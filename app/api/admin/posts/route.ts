// app/api/admin/posts/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createPost, listPosts, slugify, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { critiquePost } from '@/lib/anthropic';
import { requireAdmin } from '@/lib/adminAuth';
import { ensureSchema } from '@/lib/db';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const posts = await listPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureSchema();
  const body = (await req.json()) as PostInput;
  const slug = body.slug || slugify(body.title);

  if (body.status === 'scheduled' || body.status === 'published') {
    const structural = validatePost({ title: body.title, content: body.content, sources: body.sources });
    if (!structural.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: structural.reasons },
        { status: 422 }
      );
    }
    // Same two-stage gate as the autonomous cron -- this route is also the
    // "Claude Code, on request" front door (CMS_API_TOKEN), which the spec
    // requires to pass self-critique too, not just structural checks.
    const critique = await critiquePost({
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content: body.content,
      metaTitle: body.metaTitle ?? '',
      metaDescription: body.metaDescription ?? '',
      nicheTags: body.nicheTags,
      faqItems: body.faqItems,
      sources: body.sources,
    });
    if (!critique.passed) {
      return NextResponse.json(
        { error: 'Post failed compliance review and cannot be scheduled/published.', reasons: critique.reasons },
        { status: 422 }
      );
    }
  }

  const post = await createPost({ ...body, slug });

  if (post.status === 'published') {
    revalidatePath('/insights');
    revalidatePath('/sitemap.xml');
    revalidatePath(`/insights/${post.slug}`);
  }

  return NextResponse.json({ post }, { status: 201 });
}
