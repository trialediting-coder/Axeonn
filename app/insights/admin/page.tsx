import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listPosts } from '@/lib/posts';
import { ensureSchema, isDatabaseConfigured } from '@/lib/db';
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

  // Never crash the dashboard on infrastructure state: say what's missing.
  if (!isDatabaseConfigured()) {
    return (
      <main className="w-full min-h-screen pt-24 pb-24 px-6 sm:px-10 bg-neutral-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-amber-200 p-8">
          <h1 className="text-2xl font-bold text-neutral-950">Insights Admin</h1>
          <p className="mt-3 text-neutral-700 leading-relaxed">
            You&apos;re signed in, but no database is attached to this project yet, so posts have nowhere to live.
          </p>
          <ol className="mt-4 space-y-2 text-neutral-700 list-decimal list-inside">
            <li>In Vercel, open this project &rarr; <strong>Storage</strong> &rarr; <strong>Create Database</strong> &rarr; Postgres (Neon).</li>
            <li>Connect it to the project. Vercel adds <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-sm">POSTGRES_URL</code> automatically.</li>
            <li>Redeploy, then reload this page. The posts table is created on first load.</li>
          </ol>
        </div>
      </main>
    );
  }

  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  let dbError: string | null = null;
  try {
    await ensureSchema();
    posts = await listPosts();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-neutral-950">Insights Admin</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/insights/admin/billing"
              className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition-colors"
            >
              Billing
            </Link>
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
        {dbError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <strong>Database error:</strong> {dbError}
          </div>
        )}
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
