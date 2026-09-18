// app/api/admin/posts/route.ts
import { NextResponse } from 'next/server';
import { createPost, listPosts, slugify, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

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

  const body = (await req.json()) as PostInput;

  if (body.status === 'scheduled' || body.status === 'published') {
    const result = validatePost({ title: body.title, content: body.content, sources: body.sources });
    if (!result.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: result.reasons },
        { status: 422 }
      );
    }
  }

  const slug = body.slug || slugify(body.title);
  const post = await createPost({ ...body, slug });
  return NextResponse.json({ post }, { status: 201 });
}
