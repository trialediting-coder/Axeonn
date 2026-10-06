import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminMain, btn } from '@/components/admin/ui';
import { auth } from '@/lib/auth';
import { PostEditor } from '@/components/insights/PostEditor';

// Defense in depth alongside middleware.ts -- this page should never render
// unauthenticated even if the middleware matcher is ever misconfigured.
export default async function NewPostPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className={`${btn('ghost', 'sm')} -ml-3 mb-3`}>
          <ArrowLeft size={14} /> All posts
        </Link>
        <h1 className="text-2xl font-bold text-neutral-950 mb-6">New post</h1>
        <PostEditor />
      </div>
    </main>
  );
}
