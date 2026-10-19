// components/proof/FeatureTab.tsx
// A tab the client's plan does include. The numbers come from the monthly
// reports Axeon enters, so each tab is honest about where its figures live.
import { TIER_LABELS } from '@/data/onboardingItems';
import { campaignLabel, monthLabel } from '@/lib/projectsShared';
import type { MonthlyReport } from '@/lib/projects';
import type { ProofTab } from '@/lib/proofTabs';
import type { TrafficSummary } from '@/lib/projectsShared';
import type { DashboardReel } from '@/lib/metaShared';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${value === '—' ? 'text-neutral-300' : 'text-neutral-950'}`}>{value}</p>
      {sub ? <p className="mt-2 text-xs text-neutral-500">{sub}</p> : null}
    </div>
  );
}

const show = (v: number | null | undefined, suffix = '') => (v == null ? '—' : `${v}${suffix}`);
const delta = (now: number | null | undefined, before: number | null | undefined) =>
  now != null && before != null ? `${now - before >= 0 ? '+' : '−'}${Math.abs(now - before)} vs last month` : null;

/** Published reels with the reach Instagram reports (lib/social.ts publishedReels). Facebook shows no reach in v1. */
function Reels({ reels }: { reels: DashboardReel[] }) {
  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-neutral-950">Reels we posted for you</h3>
      <p className="mt-1 text-sm text-neutral-600">Reach is how many different people saw it. It updates once a day for 90 days.</p>
      <ul className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
        {reels.map((r) => (
          <li key={`${r.platform}|${r.publishedAt}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-semibold text-neutral-900">
              {r.permalink ? (
                <a href={r.permalink} target="_blank" rel="noreferrer" className="hover:text-blue-700">
                  {r.caption || 'Reel'}
                </a>
              ) : (
                r.caption || 'Reel'
              )}
            </span>
            <span className="text-neutral-600">
              {r.platform === 'instagram' ? 'Instagram' : 'Facebook'} · {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {r.platform === 'instagram' ? ` · ${r.reach != null ? `${r.reach.toLocaleString('en-US')} reached` : 'reach tomorrow'}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeatureTab({ tab, reports, traffic, reels = [] }: { tab: ProofTab; reports: MonthlyReport[]; traffic: TrafficSummary | null; reels?: DashboardReel[] }) {
  const latest = reports[0] ?? null;
  const prev = reports[1] ?? null;
  const month = latest ? monthLabel(latest.month) : 'Live after your first report';
  const plan = TIER_LABELS[tab.tier];
  const head = (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">{tab.label}</h2>
    </div>
  );

  if (tab.key === 'calls') {
    return (
      <>
        {head}
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Tracked numbers, missed-call text-back and instant call-back run in the background. Counts come from your monthly report.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stat label="Calls" value={show(latest?.calls)} sub={delta(latest?.calls, prev?.calls) ?? month} />
          <Stat label="Calls from your site" value={traffic ? String(traffic.buttons.find((b) => b.name === 'call')?.count ?? 0) : '—'} sub="People who pressed Call on your website" />
        </div>
      </>
    );
  }
  if (tab.key === 'bookings') {
    return (
      <>
        {head}
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Online scheduling and chat booking are live on your site and your Google listing. Bookings come from your monthly report.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stat label="Bookings" value={show(latest?.booked)} sub={delta(latest?.booked, prev?.booked) ?? month} />
          <Stat label="Booked from your site" value={traffic ? String(traffic.buttons.find((b) => b.name === 'book')?.count ?? 0) : '—'} sub="People who pressed Book on your website" />
        </div>
      </>
    );
  }
  if (tab.key === 'reviews') {
    return (
      <>
        {head}
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Every completed appointment gets a review request by text. New reviews and your rating come from your monthly report.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stat label="New reviews" value={show(latest?.reviews)} sub={delta(latest?.reviews, prev?.reviews) ?? month} />
          <Stat label="Rating" value={latest?.rating != null ? latest.rating.toFixed(1) : '—'} sub={month} />
        </div>
      </>
    );
  }
  if (tab.key === 'ads') {
    const campaigns = traffic?.detail?.campaigns ?? [];
    return (
      <>
        {head}
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Google and Meta ads are managed every day and reviewed on your strategy call. Below, every campaign that sent people to your site and how many of them reached out.</p>
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white">
          {campaigns.length ? (
            <ul className="divide-y divide-neutral-100">
              {campaigns.map((c) => (
                <li key={`${c.source}|${c.medium}|${c.campaign}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-sm">
                  <span className="font-semibold text-neutral-900">{campaignLabel(c)}</span>
                  <span className="text-neutral-600">
                    {c.sessions} visits · {c.conversions} reached out
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">Campaign numbers show here once ads have run for a month.</p>
          )}
        </div>
        {reels.length ? <Reels reels={reels} /> : null}
      </>
    );
  }
  return (
    <>
      {head}
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Your AI receptionist answers when you cannot, using the services, prices and hours you gave us in setup. Calls it takes count toward your monthly calls.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat label="Calls" value={show(latest?.calls)} sub={month} />
        <Stat label="Bookings" value={show(latest?.booked)} sub={month} />
      </div>
      <p className="mt-4 text-xs text-neutral-500">Part of {plan}. To change what it says or quotes, reply to any report email.</p>
    </>
  );
}
