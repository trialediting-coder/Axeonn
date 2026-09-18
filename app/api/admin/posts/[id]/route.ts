// app/api/admin/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { updatePost, deletePost, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
  }
  const body = (await req.json()) as Partial<PostInput>;

  if ((body.status === 'scheduled' || body.status === 'published') && body.title && body.content) {
    const result = validatePost({ title: body.title, content: body.content, sources: body.sources ?? [] });
    if (!result.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: result.reasons },
        { status: 422 }
      );
    }
  }

  const post = await updatePost(Number(id), body);
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
  await deletePost(Number(id));
  return NextResponse.json({ ok: true });
}
