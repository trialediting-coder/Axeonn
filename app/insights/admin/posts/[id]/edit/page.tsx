import { notFound } from 'next/navigation';
import { getPostById } from '@/lib/posts';
import { PostEditor } from '@/components/insights/PostEditor';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();
  const post = await getPostById(numId);
  if (!post) notFound();

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-950 mb-8">Edit Post</h1>
        <PostEditor initialPost={post} />
      </div>
    </main>
  );
}
