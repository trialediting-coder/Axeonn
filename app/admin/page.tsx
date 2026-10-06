import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { listPosts } from '@/lib/posts';
import { ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AdminDashboardTable } from '@/components/insights/AdminDashboardTable';
import { adminMain, btn } from '@/components/admin/ui';

// This route is gated by middleware.ts (redirects unauthenticated requests
// to /admin/login) and always shows live, per-request post data —
// it must never be statically prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Defense in depth alongside middleware.ts -- this page lists every draft
  // (including failed-validation AI attempts) and should never render
  // unauthenticated even if the middleware matcher is ever misconfigured.
  const session = await auth();
  if (!session) redirect('/admin/login');

  // Never crash the dashboard on infrastructure state: say what's missing.
  if (!isDatabaseConfigured()) {
    return (
      <main className={adminMain}>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-amber-200 p-8">
          <h1 className="text-2xl font-bold text-neutral-950">Axeon Admin</h1>
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
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Posts</h1>
            <p className="mt-1 text-sm text-neutral-600">Insights articles: drafts, scheduled, and published.</p>
          </div>
          <Link href="/admin/posts/new" className={btn('primary')}>
            <Plus size={16} /> New post
          </Link>
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
