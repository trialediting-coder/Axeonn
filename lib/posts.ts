// lib/posts.ts
import { sql } from '@/lib/db';
import { niches } from '@/data/nichesData';

const VALID_NICHE_SLUGS = new Set(niches.map((n) => n.slug));

// Enforced here (not just in the autonomous cron route) so every writer --
// the admin API, the editor, the autonomous pipeline -- inherits the same
// rule instead of each caller remembering to filter independently.
function sanitizeNicheTags(tags: string[]): string[] {
  return tags.filter((t) => VALID_NICHE_SLUGS.has(t));
}

// A post can only sit in `scheduled` with a real future publish time --
// otherwise it's either stranded forever (null) or auto-published almost
// immediately by the hourly cron (a past/near timestamp), bypassing the
// 24h human-review window the whole safety design relies on.
function resolveScheduledPublishAt(status: string, provided: string | null | undefined): string | null {
  // Only meaningful while a post is actually scheduled -- e.g. the publish-now
  // route doesn't set this field itself, and without clearing it here a
  // published post would keep showing a stale "Scheduled for" date.
  if (status !== 'scheduled') return null;
  if (provided) {
    const t = new Date(provided).getTime();
    if (Number.isNaN(t) || t <= Date.now()) {
      throw new Error('scheduledPublishAt must be a valid future timestamp when status is "scheduled".');
    }
    return provided;
  }
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  author: 'human' | 'ai';
  nicheTags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  faqItems: { question: string; answer: string }[];
  sources: { claim: string; url: string }[];
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(row: any): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    author: row.author,
    nicheTags: row.niche_tags ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    faqItems: row.faq_items ?? [],
    sources: row.sources ?? [],
    scheduledPublishAt: row.scheduled_publish_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listPosts(filter?: { status?: Post['status'] }): Promise<Post[]> {
  const { rows } = filter?.status
    ? await sql`SELECT * FROM posts WHERE status = ${filter.status} ORDER BY created_at DESC`
    : await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return rows.map(rowToPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { rows } = await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const { rows } = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToPost(rows[0]) : null;
}

// Appends a numeric suffix on collision instead of letting the DB's UNIQUE
// constraint throw -- otherwise the autonomous cron loses an entire week's
// already-paid-for, already-validated generation to a slug clash (e.g. a
// failed draft and its retry landing on near-identical titles).
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  for (let suffix = 2; await getPostBySlug(candidate); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createPost(input: PostInput): Promise<Post> {
  const slug = await uniqueSlug(input.slug);
  const nicheTags = sanitizeNicheTags(input.nicheTags);
  const scheduledPublishAt = resolveScheduledPublishAt(input.status, input.scheduledPublishAt);
  const { rows } = await sql`
    INSERT INTO posts (
      slug, title, excerpt, content, status, author, niche_tags,
      meta_title, meta_description, cover_image_url, cover_image_alt,
      faq_items, sources, scheduled_publish_at, published_at
    ) VALUES (
      ${slug}, ${input.title}, ${input.excerpt}, ${input.content},
      ${input.status}, ${input.author}, ${nicheTags as unknown as string},
      ${input.metaTitle}, ${input.metaDescription}, ${input.coverImageUrl}, ${input.coverImageAlt},
      ${JSON.stringify(input.faqItems)}, ${JSON.stringify(input.sources)},
      ${scheduledPublishAt}, ${input.publishedAt}
    )
    RETURNING *;
  `;
  return rowToPost(rows[0]);
}

export async function updatePost(id: number, input: Partial<PostInput>): Promise<Post> {
  const existing = await getPostById(id);
  if (!existing) throw new Error(`Post ${id} not found`);
  const merged = { ...existing, ...input };
  const nicheTags = sanitizeNicheTags(merged.nicheTags);
  const scheduledPublishAt = resolveScheduledPublishAt(merged.status, merged.scheduledPublishAt);
  const { rows } = await sql`
    UPDATE posts SET
      slug = ${merged.slug},
      title = ${merged.title},
      excerpt = ${merged.excerpt},
      content = ${merged.content},
      status = ${merged.status},
      niche_tags = ${nicheTags as unknown as string},
      meta_title = ${merged.metaTitle},
      meta_description = ${merged.metaDescription},
      cover_image_url = ${merged.coverImageUrl},
      cover_image_alt = ${merged.coverImageAlt},
      faq_items = ${JSON.stringify(merged.faqItems)},
      sources = ${JSON.stringify(merged.sources)},
      scheduled_publish_at = ${scheduledPublishAt},
      published_at = ${merged.publishedAt},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rowToPost(rows[0]);
}

export async function deletePost(id: number): Promise<void> {
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

export async function publishDuePosts(): Promise<Post[]> {
  const { rows } = await sql`
    UPDATE posts
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE status = 'scheduled' AND scheduled_publish_at <= now()
    RETURNING *;
  `;
  return rows.map(rowToPost);
}
