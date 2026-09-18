// app/api/admin/posts/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { getPostById, updatePost } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
  }
  const post = await getPostById(Number(id));
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = validatePost({ title: post.title, content: post.content, sources: post.sources });
  if (!result.passed) {
    return NextResponse.json(
      { error: 'Post failed validation and cannot be published.', reasons: result.reasons },
      { status: 422 }
    );
  }

  const updated = await updatePost(post.id, { status: 'published', publishedAt: new Date().toISOString() });
  return NextResponse.json({ post: updated });
}
