// app/api/admin/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPostById, updatePost, deletePost, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { critiquePost } from '@/lib/anthropic';
import { requireAdmin } from '@/lib/adminAuth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
  }
  const numId = Number(id);
  const body = (await req.json()) as Partial<PostInput>;

  const existing = await getPostById(numId);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const merged = { ...existing, ...body };

  if (merged.status === 'scheduled' || merged.status === 'published') {
    const structural = validatePost({ title: merged.title, content: merged.content, sources: merged.sources });
    if (!structural.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: structural.reasons },
        { status: 422 }
      );
    }
    const critique = await critiquePost({
      title: merged.title,
      slug: merged.slug,
      excerpt: merged.excerpt,
      content: merged.content,
      metaTitle: merged.metaTitle ?? '',
      metaDescription: merged.metaDescription ?? '',
      nicheTags: merged.nicheTags,
      faqItems: merged.faqItems,
      sources: merged.sources,
    });
    if (!critique.passed) {
      return NextResponse.json(
        { error: 'Post failed compliance review and cannot be scheduled/published.', reasons: critique.reasons },
        { status: 422 }
      );
    }
  }

  const update: Partial<PostInput> = { ...body };
  if (merged.status === 'published' && existing.status !== 'published' && !body.publishedAt) {
    update.publishedAt = new Date().toISOString();
  }

  const post = await updatePost(numId, update);

  // insights/[slug] has a 1h revalidate window -- revalidate both slugs
  // (covers a slug change) whenever a published post was involved, so an
  // edit or a stale cached 404 doesn't linger for up to an hour.
  if (post.status === 'published' || existing.status === 'published') {
    revalidatePath('/insights');
    revalidatePath('/sitemap.xml');
    revalidatePath(`/insights/${existing.slug}`);
    revalidatePath(`/insights/${post.slug}`);
  }

  return NextResponse.json({ post });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
  }
  const numId = Number(id);
  const existing = await getPostById(numId);
  await deletePost(numId);

  if (existing?.status === 'published') {
    revalidatePath('/insights');
    revalidatePath('/sitemap.xml');
    revalidatePath(`/insights/${existing.slug}`);
  }

  return NextResponse.json({ ok: true });
}
