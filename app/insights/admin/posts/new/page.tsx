import { PostEditor } from '@/components/insights/PostEditor';

export default function NewPostPage() {
  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-950 mb-8">New Post</h1>
        <PostEditor />
      </div>
    </main>
  );
}
