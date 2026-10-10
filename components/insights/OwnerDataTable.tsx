// components/insights/OwnerDataTable.tsx
// The owner's client-data page body (app/admin/data): totals across clients,
// then a row per client. Server component, pure render of lib/ownerData.ts.
import Link from 'next/link';
import { monthLabel } from '@/lib/projectsShared';
import { RATING_LABELS } from '@/lib/feedbackShared';
import type { ClientDataRow, OwnerOverview } from '@/lib/ownerData';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');
const num = (n: number | null | undefined) => (n == null ? '—' : String(n));

function Stage({ row }: { row: ClientDataRow }) {
  const cls = row.stage === 'live' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : row.stage === 'quiet' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200';
  const label = row.stage === 'live' ? 'Live' : row.stage === 'quiet' ? 'Quiet' : 'Setup';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{label}</span>;
}

export function OwnerDataTable({ data }: { data: OwnerOverview }) {
  const tiles = [
    { label: 'Clients live', value: String(data.totals.live), sub: `${data.rows.length} on the books` },
    { label: `Reached out, ${monthLabel(data.month)} so far`, value: String(data.totals.reachedOut), sub: 'across every live site' },
    { label: 'Est. new customers', value: `~${data.totals.estimatedCustomers}`, sub: 'this month, all clients' },
    { label: 'Reports that got a tap', value: data.totals.tapRate == null ? '—' : `${data.totals.tapRate}%`, sub: 'of reports emailed' },
    {
      label: 'Worth the price?',
      value: `${data.totals.worth.easily} · ${data.totals.worth.even} · ${data.totals.worth.notyet}`,
      sub: 'easily · about even · not yet',
    },
  ];
  return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-950">Client data</h1>
          <p className="mt-1 text-sm text-neutral-600">Every client on one page: what their site did, what they marked, and what they told us. Flags first.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{t.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{t.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-neutral-50 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-3 py-3">Stage</th>
                <th className="px-3 py-3">Reports</th>
                <th className="px-3 py-3 text-right">Visits</th>
                <th className="px-3 py-3 text-right">Reached out</th>
                <th className="px-3 py-3 text-right">Est. cust.</th>
                <th className="px-3 py-3 text-right">Last month</th>
                <th className="px-3 py-3">Marked</th>
                <th className="px-3 py-3">What they told us</th>
                <th className="px-3 py-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 align-top">
              {data.rows.map((r) => (
                <tr key={r.id} className={r.flags.length ? 'bg-amber-50/40' : ''}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/onboarding/${r.token}`} className="font-semibold text-neutral-950 hover:text-blue-700">
                      {r.name}
                    </Link>
                    <p className="text-xs text-neutral-500">{r.plan}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Stage row={r} />
                    <p className="mt-1 text-[11px] text-neutral-500">{r.lastEventAt ? `last event ${day(r.lastEventAt)}` : 'no tracker yet'}</p>
                  </td>
                  <td className="px-3 py-3 text-neutral-700">
                    {r.reportsSent} sent
                    <p className="text-[11px] text-neutral-500">{r.ramp ? `next is ramp ${r.nextReport} of 3` : `next is #${r.nextReport}`}</p>
                    <p className="text-[11px] text-neutral-500">{r.taps.emailed ? `${r.taps.answered} of ${r.taps.emailed} got a tap` : ''}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-900">{num(r.thisMonth?.views)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-950">{num(r.thisMonth?.conversions)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-900">{r.thisMonth ? `~${r.thisMonth.estimatedCustomers}` : '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-500">
                    {r.lastMonth ? `${r.lastMonth.conversions} · ~${r.lastMonth.estimatedCustomers}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-neutral-700">
                    {r.markedWon + r.markedLost ? (
                      <>
                        {r.markedWon} booked · {r.markedLost} not
                        <p className="text-[11px] text-neutral-500">{r.closeRate != null ? `${r.closeRate}% their rate` : 'under 10 marked'}</p>
                      </>
                    ) : (
                      <span className="text-neutral-400">nothing marked</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.answers.length || r.lastRating ? (
                      <ul className="space-y-0.5 text-xs">
                        {r.answers.slice(0, 6).map((a) => (
                          <li key={a.key} className={a.attention ? 'font-semibold text-amber-800' : 'text-neutral-700'}>
                            <span className="text-neutral-400">{shortQuestion(a.key)}:</span> {a.answer}
                          </li>
                        ))}
                        {r.lastRating ? (
                          <li className="text-neutral-500">
                            <span className="text-neutral-400">Report useful:</span> {RATING_LABELS[r.lastRating]} · {day(r.lastTapAt)}
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <span className="text-xs text-neutral-400">no taps yet</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.flags.length ? (
                      <ul className="space-y-1">
                        {r.flags.map((f) => (
                          <li key={f} className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-neutral-500">
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          This month is from the tracker as of now; last month is the full month. Marked and the close rate come from the client&apos;s own Booked / Not yet taps. Answers are the latest per question.
        </p>
      </div>
  );
}


/** Short column labels for the survey keys. */
function shortQuestion(key: string): string {
  return (
    {
      job: 'Job from site',
      pickup: 'Picks up',
      worth: 'Worth it',
      recommend: 'Recommend',
      jobs: 'Jobs/month',
      clear: 'Numbers clear',
      next: 'Wants next',
      source: 'Best customer from',
    }[key] ?? key
  );
}
