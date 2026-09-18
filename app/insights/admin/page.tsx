import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { auth, signOut } from '@/lib/auth';
import { AdminDashboardTable } from '@/components/insights/AdminDashboardTable';

async function handleSignOut() {
  'use server';
  await signOut({ redirectTo: '/insights/admin/login' });
}

// This route is gated by middleware.ts (redirects unauthenticated requests
// to /insights/admin/login) and always shows live, per-request post data —
// it must never be statically prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Defense in depth alongside middleware.ts -- this page lists every draft
  // (including failed-validation AI attempts) and should never render
  // unauthenticated even if the middleware matcher is ever misconfigured.
  const session = await auth();
  if (!session) redirect('/insights/admin/login');

  const posts = await listPosts();

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-neutral-950">Insights Admin</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/insights/admin/posts/new"
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              New Post
            </Link>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          {posts.length === 0 ? (
            <p className="text-neutral-500">No posts yet.</p>
          ) : (
            <AdminDashboardTable initialPosts={posts} />
          )}
        </div>
      </div>
    </main>
  );
}
