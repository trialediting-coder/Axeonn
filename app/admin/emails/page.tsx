import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminInput, adminMain, btn } from '@/components/admin/ui';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { EMAIL_LOG_PAGE, listEmailLog, type EmailLogEntry } from '@/lib/emailLog';
import { EMAIL_CATEGORIES, EMAIL_KINDS, emailKindLabel, isEmailCategory, type EmailKind } from '@/lib/emailLogShared';

export const dynamic = 'force-dynamic';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function EmailLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const params = await searchParams;
  const category = isEmailCategory(one(params.category)) ? (one(params.category) as keyof typeof EMAIL_CATEGORIES) : null;
  const status = one(params.status) === 'failed' ? 'failed' : null;
  const q = one(params.q).slice(0, 200);
  const owner = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';

  let entries: EmailLogEntry[] = [];
  let dbError: string | null = isDatabaseConfigured() ? null : 'The email log needs the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      entries = await listEmailLog({ category, status, q });
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  const href = (next: { category?: string | null; status?: string | null }) => {
    const sp = new URLSearchParams();
    const c = next.category === undefined ? category : next.category;
    const s = next.status === undefined ? status : next.status;
    if (c) sp.set('category', c);
    if (s) sp.set('status', s);
    if (q) sp.set('q', q);
    const qs = sp.toString();
    return qs ? `/admin/emails?${qs}` : '/admin/emails';
  };
  const chip = (active: boolean) =>
    `inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap border ${
      active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
    }`;

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-950">Emails</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Every email the site sends: onboarding, contracts, reports, codes and alerts to you. Newest first, times in Central.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Link href={href({ category: null })} className={chip(!category)}>
            All
          </Link>
          {Object.entries(EMAIL_CATEGORIES).map(([key, label]) => (
            <Link key={key} href={href({ category: key })} className={chip(category === key)}>
              {label}
            </Link>
          ))}
        </div>

        <form action="/admin/emails" className="mb-5 flex flex-wrap items-center gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search recipient or subject" className={`${adminInput} min-w-0 flex-1 sm:max-w-xs sm:flex-none`} />
          <button type="submit" className={btn('secondary', 'md')}>
            Search
          </button>
          <Link href={href({ status: status ? null : 'failed' })} className={chip(status === 'failed')}>
            Failed only
          </Link>
          {(category || status || q) && (
            <Link href="/admin/emails" className={btn('ghost', 'sm')}>
              Clear
            </Link>
          )}
        </form>

        {dbError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{dbError}</p>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
            {category || status || q ? 'No emails match.' : 'No emails logged yet. Sends show up here from now on.'}
          </p>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white sm:overflow-x-auto">
            {/* Below sm each send is a card; from sm up it's a regular table. */}
            <table className="block w-full text-sm sm:table">
              <thead className="hidden bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:table-header-group">
                <tr>
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">To</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-neutral-100 sm:table-row-group">
                {entries.map((e) => (
                  <tr key={e.id} className="relative block px-4 py-3 align-top sm:table-row sm:p-0">
                    <td className="block pr-16 text-xs text-neutral-500 sm:table-cell sm:whitespace-nowrap sm:px-4 sm:py-2.5 sm:pr-4 sm:text-sm sm:text-neutral-600">{when(e.createdAt)}</td>
                    <td className="mt-1 block sm:mt-0 sm:table-cell sm:px-4 sm:py-2.5">
                      <div className="font-medium text-neutral-900 sm:whitespace-nowrap">{emailKindLabel(e.kind)}</div>
                      {Object.hasOwn(EMAIL_KINDS, e.kind) && (
                        <div className="text-xs text-neutral-500">{EMAIL_CATEGORIES[EMAIL_KINDS[e.kind as EmailKind].category]}</div>
                      )}
                    </td>
                    <td className="mt-1 block text-neutral-800 break-all sm:mt-0 sm:table-cell sm:px-4 sm:py-2.5">
                      <span className="text-neutral-500 sm:hidden">To </span>
                      {owner && e.recipient === owner ? 'You' : e.recipient}
                    </td>
                    <td className="mt-0.5 block text-neutral-800 break-words sm:mt-0 sm:table-cell sm:px-4 sm:py-2.5">{e.subject}</td>
                    <td className="absolute right-4 top-3 sm:static sm:table-cell sm:px-4 sm:py-2.5">
                      {e.status === 'sent' ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Sent</span>
                      ) : (
                        <>
                          <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Failed</span>
                          {e.error && <div className="mt-1 hidden max-w-xs text-xs text-red-700 sm:block">{e.error}</div>}
                        </>
                      )}
                    </td>
                    {e.status !== 'sent' && e.error && (
                      <td className="mt-1 block text-xs text-red-700 sm:hidden">{e.error}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {entries.length === EMAIL_LOG_PAGE && (
          <p className="mt-3 text-xs text-neutral-500">Showing the latest {EMAIL_LOG_PAGE}. Filter or search to find older ones.</p>
        )}
      </div>
    </main>
  );
}
