// components/proof/ProofDashboard.tsx
// What a signed-in client sees at app.axeonstudio.co. A dark sidebar and a light
// workspace, like Stripe or Linear. The numbers come only from the Monthly
// Reports Axeon enters (lib/projects.ts); before the first one, every metric
// shows an honest empty state ("Live after launch"). Nothing is invented.
import type { ComponentType, ReactNode } from 'react';
import {
  Activity,
  Bot,
  CalendarCheck,
  Check,
  Megaphone,
  Star,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  MousePointerClick,
  PhoneCall,
  Users,
} from 'lucide-react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { LeadLog, type LeadMonth } from '@/components/proof/LeadLog';
import { FeatureTab } from '@/components/proof/FeatureTab';
import { UpgradePanel } from '@/components/proof/UpgradePanel';
import { PROOF_TABS, TIER_SHORT, proofTab, tabLocked, type ProofTabKey } from '@/lib/proofTabs';
import type { UpgradeRequest } from '@/lib/upgrades';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import type { OnboardingItem } from '@/data/onboardingItems';
import type { ItemState, Onboarding, Progress } from '@/lib/onboarding';
import type { MonthlyReport, ProjectDetails, ProjectUpdate } from '@/lib/projects';
import { DEVICE_LABELS, WEEKDAY_LABELS, buttonLabel, campaignLabel, hourLabel, monthLabel, sourceLabel, type TrafficSummary } from '@/lib/projectsShared';

type Icon = ComponentType<{ size?: number; className?: string }>;

/** The tracker's running month (lib/proofDashboardData.ts), shown ahead of the saved report. */
export type LiveTraffic = { month: string; traffic: TrafficSummary; prev: TrafficSummary | null };

/** The month before "2026-01" is "2025-12". */
const previousMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** Every tab is visible to every client; a tab outside their plan opens the upgrade page (lib/proofTabs.ts). */
const TAB_ICONS: Record<ProofTabKey, Icon> = {
  overview: LayoutDashboard,
  leads: Activity,
  calls: PhoneCall,
  bookings: CalendarCheck,
  reviews: Star,
  ads: Megaphone,
  receptionist: Bot,
};

type MetricKey = 'calls' | 'leads' | 'booked' | 'rank';
const METRICS: { key: MetricKey; label: string; icon: Icon; hint: string }[] = [
  { key: 'calls', label: 'Calls', icon: PhoneCall, hint: 'From your site and Google listing' },
  { key: 'leads', label: 'Leads', icon: Activity, hint: 'Quote requests and form leads' },
  { key: 'booked', label: 'Booked jobs', icon: CalendarCheck, hint: 'Traced back to their source' },
  { key: 'rank', label: 'Map rank', icon: MapPin, hint: 'For the services you sell' },
];

/** Website cards from the latest report's tracking numbers (lib/autoReports.ts). */
type WebKey = 'views' | 'clicks' | 'conversions' | 'estimatedCustomers';
const WEB_METRICS: { key: WebKey; label: string; icon: Icon; hint: string }[] = [
  { key: 'conversions', label: 'Reached out', icon: PhoneCall, hint: 'Calls, texts, forms, bookings, directions' },
  { key: 'estimatedCustomers', label: 'Est. new customers', icon: Users, hint: 'Estimated from who reached out' },
  { key: 'views', label: 'Website visits', icon: Globe, hint: 'Page views on your site' },
  { key: 'clicks', label: 'Button clicks', icon: MousePointerClick, hint: 'Call, text, book, form and more' },
];

function webMetric(key: WebKey, t: TrafficSummary, prev: TrafficSummary | null, avgJobValue: number | null = null, prevLabel = 'last month') {
  const now = t[key];
  const value = key === 'estimatedCustomers' ? `~${now}` : String(now);
  const before = prev?.[key] ?? null;
  const worth = avgJobValue && t.estimatedCustomers > 0 ? `about $${Math.round(t.estimatedCustomers * avgJobValue).toLocaleString('en-US')} in work · ` : '';
  const confirmed = t.markedWon ? `${t.markedWon} booked, marked by you · ` : '';
  const estimateSub =
    worth +
    confirmed +
    (t.observedCloseRate
      ? `${t.closeRate}% close rate ${t.observedCloseRate.weight >= 1 ? 'from the leads you marked' : 'from your marks and our estimate'}`
      : t.closeRateEstimate && t.customersLow != null && t.customersHigh != null && t.conversions > 0
        ? `likely ${t.customersLow} to ${t.customersHigh} · ${t.closeRate}% close rate`
        : `${t.closeRate}% of who reached out`);
  if (key === 'estimatedCustomers') return { value, sub: estimateSub, tone: 'neutral' as const };
  if (key === 'conversions' && t.assistedContacts) {
    return { value, sub: `${t.directContacts} on the site · ~${t.assistedContacts} likely called after reading the number`, tone: 'neutral' as const };
  }
  if (before == null) {
    const sub = key === 'views' ? `${t.visitors} ${t.visitors === 1 ? 'visitor' : 'visitors'}` : null;
    return { value, sub, tone: 'neutral' as const };
  }
  const diff = now - before;
  return {
    value,
    sub: `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff)} vs ${prevLabel}`,
    tone: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
  };
}

/** Your own visits count too: one tap per phone or laptop leaves that device out. */
function OwnVisitsLine({ url, className = '', tone = 'neutral' }: { url: string; className?: string; tone?: 'neutral' | 'amber' }) {
  const text = tone === 'amber' ? 'text-amber-900/80' : 'text-neutral-500';
  const link = tone === 'amber' ? 'text-amber-950 hover:text-amber-900' : 'text-blue-600 hover:text-blue-700';
  return (
    <p className={`text-xs ${text} ${className}`}>
      Your own visits count too.{' '}
      <a href={url} target="_blank" rel="noopener" className={`font-semibold ${link}`}>
        Leave this device out
      </a>
      {' '}· opens your site once; do it on each phone or computer you use.
    </p>
  );
}

const prettyDay = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'To be set';

/** The value and the "vs last month" line for one metric card. Rank is better when lower. */
function metric(key: MetricKey, r: MonthlyReport | null, prev: MonthlyReport | null) {
  const now = r?.[key] ?? null;
  if (now == null) return { value: '—', sub: null as string | null, tone: 'neutral' as const };
  const before = prev?.[key] ?? null;
  const value = key === 'rank' ? `#${now}` : String(now);
  if (before == null) return { value, sub: null, tone: 'neutral' as const };
  const diff = key === 'rank' ? before - now : now - before;
  const sub = key === 'rank' ? `was #${before} last month` : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff)} vs last month`;
  return { value, sub, tone: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const) };
}

function SignOut({ className }: { className: string }) {
  return (
    <form action="/api/proof/logout" method="post">
      <button type="submit" className={className}>
        <LogOut size={14} /> Sign out
      </button>
    </form>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>{children}</section>;
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#EEF2F7" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#2563EB"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-neutral-950">{percent}%</span>
    </div>
  );
}

export function ProofDashboard({
  email,
  onboarding,
  progress,
  planLabel,
  axeonItems,
  states,
  setupUrl,
  details,
  updates,
  reports,
  guarantee,
  guaranteeDay,
  agreementUrl,
  preview = null,
  avgJobValue = null,
  leads = [],
  leadApi = null,
  tab = 'overview',
  upgradeRequest = null,
  live: liveTraffic = null,
  ownVisitsUrl = null,
}: {
  email: string;
  onboarding: Onboarding;
  progress: Progress;
  planLabel: string;
  axeonItems: OnboardingItem[];
  states: Record<string, ItemState>;
  setupUrl: string;
  details: ProjectDetails;
  updates: ProjectUpdate[];
  reports: MonthlyReport[];
  guarantee: boolean;
  guaranteeDay: number | null;
  agreementUrl: string | null;
  /** Set when an admin is looking at this client's dashboard (app/admin/onboarding/[token]/preview). */
  preview?: { label: string; backHref: string } | null;
  /** Average job in dollars, when the client has told us; turns estimated customers into a dollar figure. */
  avgJobValue?: number | null;
  /** This month's and last month's leads (lib/siteStats.ts leadRows), newest first. */
  leads?: LeadMonth[];
  /** Where the Customer / Not taps post: the client's own API, or the admin API from View as client. */
  leadApi?: string | null;
  /** Which tab is open (?tab=). Tabs outside the plan show the upgrade page. */
  tab?: ProofTabKey;
  /** The plan the client asked to move to, if they pressed the button (lib/upgrades.ts). */
  upgradeRequest?: UpgradeRequest | null;
  /** This month so far, straight from the tracker (lib/siteStats.ts monthTraffic); shown ahead of the saved report. */
  live?: LiveTraffic | null;
  /** Opens the client's site so the device it is tapped on stops counting (lib/siteStats.ts ownVisitsUrl). */
  ownVisitsUrl?: string | null;
}) {
  const latest = reports[0] ?? null;
  const prev = reports[1] ?? null;
  const reportTraffic = latest?.traffic && (latest.traffic.views > 0 || latest.traffic.clicks > 0) ? latest.traffic : null;
  // The tracker's running month beats the saved report, so the page moves every day, not once a month.
  const traffic = liveTraffic?.traffic ?? reportTraffic;
  const prevTraffic = liveTraffic ? liveTraffic.prev : (prev?.traffic ?? null);
  const live = latest !== null || liveTraffic !== null;
  const trafficLabel = liveTraffic ? `${monthLabel(liveTraffic.month)} so far` : latest ? monthLabel(latest.month) : '';
  const prevLabel = liveTraffic ? `all of ${monthLabel(previousMonth(liveTraffic.month))}` : 'last month';
  const period = liveTraffic ? 'so far this month' : 'last month';
  const detail = traffic?.detail && traffic.detail.sessions > 0 ? traffic.detail : null;
  const estimate = traffic && traffic.conversions > 0 ? (traffic.closeRateEstimate ?? null) : null;
  const deviceTotal = detail ? detail.devices.phone + detail.devices.tablet + detail.devices.desktop : 0;
  const hourMax = detail ? Math.max(1, ...detail.conversionHours) : 1;
  const dayMax = detail ? Math.max(1, ...detail.conversionDays) : 1;
  // Up to six reported months, plus the running month from the tracker when no report covers it yet.
  const chart: { month: string; calls: number | null; leads: number | null; traffic: TrafficSummary | null; live?: boolean }[] = reports
    .slice(0, 6)
    .reverse()
    .map((r) => ({ month: r.month, calls: r.calls, leads: r.leads, traffic: r.traffic ?? null }));
  const typedChart = chart.some((r) => r.calls != null || r.leads != null);
  // A typed chart (calls and leads Axeon entered) has no live bar: the tracker counts people who reached out, a different thing.
  if (liveTraffic && !typedChart && !chart.some((r) => r.month === liveTraffic.month)) {
    chart.push({ month: liveTraffic.month, calls: null, leads: null, traffic: liveTraffic.traffic, live: true });
    if (chart.length > 6) chart.shift();
  }
  const chartMax = Math.max(1, ...chart.map((r) => (typedChart ? (r.calls ?? 0) + (r.leads ?? 0) : (r.traffic?.conversions ?? 0))));
  const baseline = details.baselineCalls != null || details.baselineLeads != null ? (details.baselineCalls ?? 0) + (details.baselineLeads ?? 0) : null;
  const feed = [
    ...updates.map((u) => ({ kind: 'update' as const, at: u.createdAt, u })),
    ...reports.map((r) => ({ kind: 'report' as const, at: r.createdAt, r })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const name = onboarding.businessName || onboarding.clientName || 'Your business';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const setupDone = progress.clientDone >= progress.clientTotal;
  const firstName = onboarding.clientName?.split(' ')[0];

  return (
    <div className={`min-h-screen bg-[#F6F7F9] lg:pl-64 ${preview ? 'pt-10' : ''}`}>
      {preview ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-3 bg-amber-400 px-4 text-xs font-semibold text-amber-950">
          <span className="truncate">{preview.label}. This is exactly what the client sees; nothing has been sent to them.</span>
          <a href={preview.backHref} className="shrink-0 rounded-md bg-amber-950/10 px-2 py-0.5 hover:bg-amber-950/20">
            Back to admin
          </a>
        </div>
      ) : null}
      {/* Sidebar (desktop) */}
      <aside className={`fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0B0D12] text-white lg:flex ${preview ? 'top-10' : ''}`}>
        <div className="px-5 pb-6 pt-6">
          <AxeonLogo product="PROOF" tone="light" />
        </div>
        <nav aria-label="AxeonPROOF" className="flex-1 space-y-0.5 px-3">
          {PROOF_TABS.map((t) => {
            const Icon = TAB_ICONS[t.key];
            const locked = tabLocked(t, onboarding.tier);
            const active = t.key === tab;
            return (
              <a
                key={t.key}
                href={`?tab=${t.key}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium ${
                  active ? 'bg-white/[0.07] text-white' : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? 'text-blue-400' : 'text-neutral-500'} />
                {t.label}
                {locked ? (
                  <span className="ml-auto rounded-full bg-blue-500/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-blue-300">{TIER_SHORT[t.tier]}</span>
                ) : null}
              </a>
            );
          })}
          <a
            href={setupUrl}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-neutral-300 hover:bg-white/[0.05] hover:text-white"
          >
            <ClipboardList size={18} className="text-neutral-500" />
            Setup
            {!setupDone ? <span className="ml-auto text-xs font-semibold text-blue-400">{progress.percent}%</span> : null}
          </a>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold">{initials || 'A'}</span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{name}</p>
              <p className="truncate text-[13px] text-neutral-500">{email}</p>
            </div>
          </div>
          {!preview ? (
            <SignOut className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 text-xs font-semibold text-neutral-300 hover:bg-white/[0.05] hover:text-white" />
          ) : null}
        </div>
      </aside>

      {/* Top bar (phones and tablets) */}
      <header className={`sticky z-30 flex h-14 items-center border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:hidden ${preview ? 'top-10' : 'top-0'}`}>
        <AxeonLogo product="PROOF" size="sm" />
        {!preview ? (
          <div className="ml-auto">
            <SignOut className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50" />
          </div>
        ) : null}
      </header>
      <nav aria-label="AxeonPROOF sections" className={`sticky z-20 flex gap-1.5 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 lg:hidden ${preview ? 'top-24' : 'top-14'}`}>
        {PROOF_TABS.map((t) => {
          const locked = tabLocked(t, onboarding.tier);
          const active = t.key === tab;
          return (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {t.label}
              {locked ? <span className={`rounded-full px-1.5 py-px text-[10px] font-bold uppercase ${active ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>{TIER_SHORT[t.tier]}</span> : null}
            </a>
          );
        })}
      </nav>

      <main className="mx-auto max-w-[1920px] px-4 pb-20 pt-8 sm:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-950">{name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
              {onboarding.tier === 'essentials' ? planLabel : <AxeonLogo product={TIER_SHORT[onboarding.tier]} size="sm" mark={false} />}
            </span>
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Setting up
              </span>
            )}
          </div>
        </div>

        {!live ? (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">You are in setup, so the numbers are not on yet.</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                Everything fills in by itself the day your site goes live with Axeon&apos;s tracking line: visits, who reached out, and what it is worth. Until then this page shows what is coming.
              </p>
              {ownVisitsUrl ? <OwnVisitsLine url={ownVisitsUrl} className="mt-2" tone="amber" /> : null}
            </div>
            {!setupDone ? (
              <a href={setupUrl} className="shrink-0 rounded-lg bg-amber-950 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-amber-900">
                Finish setup
              </a>
            ) : null}
          </div>
        ) : null}

        {tab !== 'overview' ? (
          tab === 'leads' ? (
            <div className="mt-6">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">Included in your plan</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Leads</h2>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">Every call, text, email, form and booking from your site, the day it happens. Tap Booked on the ones that turned into a job and your numbers get more exact every month.</p>
              {leads.some((m) => m.rows.length > 0) ? (
                <LeadLog months={leads} api={leadApi} />
              ) : (
                <Card className="mt-4 p-8 text-center">
                  <p className="text-sm font-semibold text-neutral-900">No one has reached out yet this month.</p>
                  <p className="mt-1 text-sm text-neutral-500">Calls, texts, forms and bookings from your site show up here within a minute.</p>
                </Card>
              )}
            </div>
          ) : tabLocked(proofTab(tab), onboarding.tier) ? (
            <UpgradePanel tab={proofTab(tab)} tier={onboarding.tier} traffic={traffic} period={period} avgJobValue={avgJobValue} request={upgradeRequest} preview={!!preview} bookUrl={`${SITE_ORIGIN}/book`} />
          ) : (
            <FeatureTab tab={proofTab(tab)} reports={reports} traffic={traffic} />
          )
        ) : null}

        {tab === 'overview' ? (<>
        {traffic ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {WEB_METRICS.map(({ key, label, icon: Icon, hint }) => {
              const m = webMetric(key, traffic, prevTraffic, avgJobValue, prevLabel);
              return (
                <Card key={label} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-600">{label}</p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-neutral-950">{m.value}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p
                      className={`text-xs ${
                        m.tone === 'up' ? 'font-semibold text-emerald-600' : m.tone === 'down' ? 'font-semibold text-red-600' : 'text-neutral-500'
                      }`}
                    >
                      {m.sub ?? hint}
                    </p>
                  </div>
                  <div className="mt-3 border-t border-dashed border-neutral-200 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{trafficLabel}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
        {traffic && ownVisitsUrl ? <OwnVisitsLine url={ownVisitsUrl} className="mt-3" /> : null}

        {leads.some((m) => m.rows.length > 0) ? <LeadLog months={leads} api={leadApi} /> : null}

        <div className={`${traffic ? 'mt-4' : 'mt-6'} grid grid-cols-1 gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-4`}>
          {METRICS.map(({ key, label, icon: Icon, hint }) => {
            const m = metric(key, latest, prev);
            // Once the site reports, a typed figure Axeon has not entered is left out rather than shown as a dash.
            if (traffic && m.value === '—') return null;
            return (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-600">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={16} />
                </span>
              </div>
              <p className={`mt-4 text-3xl font-bold tracking-tight ${m.value === '—' ? 'text-neutral-300' : 'text-neutral-950'}`}>{m.value}</p>
              <div className="mt-3 flex items-center justify-between">
                <p
                  className={`text-xs ${
                    m.tone === 'up' ? 'font-semibold text-emerald-600' : m.tone === 'down' ? 'font-semibold text-red-600' : 'text-neutral-500'
                  }`}
                >
                  {m.sub ?? (key === 'rank' && latest?.keyword ? `“${latest.keyword}”` : hint)}
                </p>
              </div>
              <div className="mt-3 border-t border-dashed border-neutral-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  {latest ? monthLabel(latest.month) : 'Live after launch'}
                </p>
              </div>
            </Card>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">{typedChart ? 'Calls and leads' : 'People who reached out'}</h2>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                {live ? 'By month' : 'Last 30 days'}
              </span>
            </div>
            {live ? (
              <div className="mt-6 flex h-52 items-end gap-3">
                {chart.map((r) => {
                  const calls = typedChart ? (r.calls ?? 0) : (r.traffic?.conversions ?? 0);
                  const leads = typedChart ? (r.leads ?? 0) : 0;
                  return (
                    <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-xs font-semibold text-neutral-700">{calls + leads}</span>
                      <div
                        className="flex w-full max-w-14 flex-col justify-end overflow-hidden rounded-t"
                        style={{ height: `${((calls + leads) / chartMax) * 80}%` }}
                      >
                        <div className="bg-blue-300" style={{ flexGrow: leads }} title={`${leads} leads`} />
                        <div className="bg-blue-600" style={{ flexGrow: calls }} title={`${calls} calls`} />
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {monthLabel(r.month).slice(0, 3)}
                        {r.live ? <span className="block text-[10px] text-neutral-400">so far</span> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="relative mt-6 h-52">
              <div aria-hidden className="absolute inset-0 flex items-end gap-2">
                {[30, 45, 38, 55, 48, 62, 52, 70, 60, 74, 66, 80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-neutral-100" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-neutral-200 bg-white/95 px-5 py-4 text-center shadow-sm">
                  <p className="text-sm font-semibold text-neutral-900">Your chart starts the day you launch</p>
                  <p className="mt-1 text-xs text-neutral-500">Every call and lead will show up here, with where it came from.</p>
                </div>
              </div>
            </div>
            )}
            {live && typedChart && (
              <p className="mt-3 flex gap-4 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-blue-600" /> Calls
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-blue-300" /> Leads
                </span>
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-neutral-950">Your setup</h2>
            <div className="mt-5 flex items-center gap-5">
              <ProgressRing percent={progress.percent} />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {progress.clientDone} of {progress.clientTotal} done
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {setupDone ? 'Everything we need is in. Thank you.' : 'A few quick items get you live faster.'}
                </p>
              </div>
            </div>
            <a
              href={setupUrl}
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {setupDone ? 'Review my answers' : 'Continue setup'}
            </a>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-neutral-950">Your project</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Kickoff</dt>
                <dd className="font-medium text-neutral-900">{prettyDay(details.kickoffAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Target launch</dt>
                <dd className="font-medium text-neutral-900">{prettyDay(details.targetLaunchAt)}</dd>
              </div>
              {baseline != null ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Starting point</dt>
                  <dd className="font-medium text-neutral-900">{baseline} calls + leads / mo</dd>
                </div>
              ) : null}
            </dl>
            {guarantee && guaranteeDay != null ? (
              <div className="mt-5 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">90-day guarantee · Day {guaranteeDay} of 90</p>
                <div className="mt-2 h-1.5 rounded-full bg-blue-100">
                  <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(guaranteeDay / 90) * 100}%` }} />
                </div>
                {latest && baseline != null ? (
                  <p className="mt-2 text-xs text-blue-900">
                    Baseline {baseline} · {monthLabel(latest.month)}: {(latest.calls ?? 0) + (latest.leads ?? 0)} calls + leads
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <a href={`${setupUrl}/packet`} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
                <FileText size={15} /> Welcome Packet
              </a>
              {agreementUrl ? (
                <a href={agreementUrl} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
                  <FileText size={15} /> Signed agreement
                </a>
              ) : null}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-950">Updates and reports</h2>
              {feed.length ? <span className="text-sm text-neutral-500">{feed.length} total</span> : null}
            </div>
            {feed.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-neutral-500">
                Every time we ship something, and every month, you get an update here and by email.
              </p>
            ) : (
              <ul className="max-h-[520px] divide-y divide-neutral-100 overflow-y-auto">
                {feed.slice(0, 20).map((f) =>
                  f.kind === 'update' ? (
                    <li key={`u${f.u.id}`} className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Update #{f.u.number}</span>
                        <span className="text-xs text-neutral-500">
                          {prettyDay(f.u.createdAt)} · {f.u.type} · {f.u.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-neutral-950">{f.u.title}</p>
                      {f.u.summary ? <p className="mt-1 text-sm text-neutral-600">{f.u.summary}</p> : null}
                      {f.u.actionNeeded ? (
                        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <b>We need from you:</b> {f.u.actionNeeded}
                        </p>
                      ) : null}
                      {f.u.link ? (
                        <a
                          href={f.u.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          See it <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </li>
                  ) : (
                    <li key={`r${f.r.id}`} className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Monthly report</span>
                        <span className="text-xs text-neutral-500">{monthLabel(f.r.month)}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-neutral-950">
                        {f.r.traffic && (f.r.traffic.views > 0 || f.r.traffic.clicks > 0)
                          ? `${f.r.traffic.views} visits · ${f.r.traffic.clicks} button clicks · ~${f.r.traffic.estimatedCustomers} new customers (est.)`
                          : `${f.r.calls ?? '—'} calls · ${f.r.leads ?? '—'} leads · ${f.r.booked ?? '—'} booked jobs`}
                        {f.r.rank != null ? ` · #${f.r.rank} on Google` : ''}
                      </p>
                      {f.r.note ? <p className="mt-1 text-sm text-neutral-600">{f.r.note}</p> : null}
                      {f.r.done.length ? (
                        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-neutral-600">
                          {f.r.done.map((l, i) => (
                            <li key={i}>
                              {l.title ? <b className="text-neutral-800">{l.title}. </b> : null}
                              {l.body}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {f.r.fromYou ? (
                        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <b>From you:</b> {f.r.fromYou}
                        </p>
                      ) : null}
                    </li>
                  )
                )}
              </ul>
            )}
          </Card>
        </div>

        {traffic ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-3">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-neutral-950">Most clicked buttons</h2>
              <p className="mt-0.5 text-xs text-neutral-500">{trafficLabel}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {traffic.buttons.slice(0, 6).map((b) => (
                  <li key={b.name} className="flex items-center justify-between gap-3">
                    <span className="truncate text-neutral-700">{buttonLabel(b.name)}</span>
                    <span className="font-semibold text-neutral-950">{b.count}</span>
                  </li>
                ))}
                {traffic.buttons.length === 0 ? <li className="text-neutral-500">No button clicks yet.</li> : null}
              </ul>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-neutral-950">Where visitors came from</h2>
              <p className="mt-0.5 text-xs text-neutral-500">{traffic.visitors} visitors</p>
              <ul className="mt-4 space-y-2 text-sm">
                {traffic.sources.slice(0, 5).map((x) => (
                  <li key={x.host || 'direct'} className="flex items-center justify-between gap-3">
                    <span className="truncate text-neutral-700">{sourceLabel(x.host)}</span>
                    <span className="font-semibold text-neutral-950">{x.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-neutral-950">Most visited pages</h2>
              <p className="mt-0.5 text-xs text-neutral-500">{traffic.views} page views</p>
              <ul className="mt-4 space-y-2 text-sm">
                {traffic.pages.slice(0, 5).map((pg) => (
                  <li key={pg.path} className="flex items-center justify-between gap-3">
                    <span className="truncate text-neutral-700">{pg.path === '/' ? 'Home page' : pg.path}</span>
                    <span className="font-semibold text-neutral-950">{pg.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {detail ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-3">
              <Card className="p-6">
                <h2 className="text-base font-semibold text-neutral-950">How people visit</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {detail.sessions} visits · {detail.returningVisitors} came back
                </p>
                <ul className="mt-4 space-y-3">
                  {(['phone', 'tablet', 'desktop'] as const).map((k) => {
                    const pct = deviceTotal ? Math.round((detail.devices[k] / deviceTotal) * 100) : 0;
                    return (
                      <li key={k}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-700">{DEVICE_LABELS[k]}</span>
                          <span className="font-semibold text-neutral-950">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                          <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-neutral-500">Typical visit</dt>
                  <dd className="text-right font-semibold text-neutral-950">
                    {detail.avgSeconds >= 90 ? `${Math.round(detail.avgSeconds / 60)} min` : `${detail.avgSeconds} sec`}
                  </dd>
                  <dt className="text-neutral-500">Pages per visit</dt>
                  <dd className="text-right font-semibold text-neutral-950">{detail.pagesPerSession}</dd>
                  <dt className="text-neutral-500">One-page visits</dt>
                  <dd className="text-right font-semibold text-neutral-950">{detail.bounceRate}%</dd>
                  {detail.speedMs ? (
                    <>
                      <dt className="text-neutral-500">Page load</dt>
                      <dd className="text-right font-semibold text-neutral-950">{(detail.speedMs / 1000).toFixed(1)}s</dd>
                    </>
                  ) : null}
                </dl>
                {estimate ? (
                  <div className="mt-4 rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-700">
                      How we estimate customers: {estimate.low}% to {estimate.high}% of people who reach out
                    </p>
                    {traffic?.observedCloseRate ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        Blended with your own marks: {traffic.observedCloseRate.won} of {traffic.observedCloseRate.won + traffic.observedCloseRate.lost} booked
                        {traffic.observedCloseRate.weight >= 1 ? ', which now sets the rate.' : `, counting for ${Math.round(traffic.observedCloseRate.weight * 100)}% until you have marked 20.`}
                      </p>
                    ) : null}
                    <ul className="mt-1.5 space-y-0.5 text-xs text-neutral-500">
                      {estimate.factors.map((f) => (
                        <li key={f.label}>
                          {f.label}
                          {f.effect ? <span className="font-semibold text-emerald-700"> +{f.effect}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
              <Card className="p-6">
                <h2 className="text-base font-semibold text-neutral-950">Pages that bring customers</h2>
                <p className="mt-0.5 text-xs text-neutral-500">First page of the visit, and how many reached out</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {detail.landing.slice(0, 6).map((l) => (
                    <li key={l.path} className="flex items-center justify-between gap-3">
                      <span className="truncate text-neutral-700">{l.path === '/' ? 'Home page' : l.path}</span>
                      <span className="shrink-0 text-neutral-500">
                        {l.sessions} {l.conversions ? <span className="font-semibold text-emerald-700">· {l.conversions} reached out</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {detail.campaigns.length ? (
                  <>
                    <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Campaigns</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      {detail.campaigns.slice(0, 4).map((c) => (
                        <li key={`${c.source}|${c.medium}|${c.campaign}`} className="flex items-center justify-between gap-3">
                          <span className="truncate text-neutral-700">{campaignLabel(c)}</span>
                          <span className="shrink-0 text-neutral-500">
                            {c.sessions} {c.conversions ? <span className="font-semibold text-emerald-700">· {c.conversions} reached out</span> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </Card>
              <Card className="p-6">
                <h2 className="text-base font-semibold text-neutral-950">Where visitors are</h2>
                <p className="mt-0.5 text-xs text-neutral-500">City and area only, never who</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {detail.places.slice(0, 6).map((p) => (
                    <li key={p.city} className="flex items-center justify-between gap-3">
                      <span className="truncate text-neutral-700">{p.city}</span>
                      <span className="shrink-0 text-neutral-500">
                        {p.sessions} {p.conversions ? <span className="font-semibold text-emerald-700">· {p.conversions} reached out</span> : null}
                      </span>
                    </li>
                  ))}
                  {detail.places.length === 0 ? <li className="text-neutral-500">Not enough visits yet.</li> : null}
                </ul>
              </Card>
            </div>

            {traffic && traffic.conversions > 0 ? (
              <Card className="mt-4 p-6">
                <h2 className="text-base font-semibold text-neutral-950">When customers reach out</h2>
                <p className="mt-0.5 text-xs text-neutral-500">Calls, texts, emails, forms and bookings by time of day and day of week</p>
                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                  <div>
                    <div className="flex h-24 items-end gap-1">
                      {detail.conversionHours.map((n, h) => (
                        <div key={h} className="flex flex-1 flex-col items-center justify-end" title={`${hourLabel(h)}: ${n}`}>
                          <div className={`w-full rounded-t ${n ? 'bg-blue-600' : 'bg-neutral-100'}`} style={{ height: `${Math.max(4, (n / hourMax) * 100)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                      <span>12am</span>
                      <span>6am</span>
                      <span>12pm</span>
                      <span>6pm</span>
                      <span>11pm</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex h-24 items-end gap-1.5">
                      {detail.conversionDays.map((n, d) => (
                        <div key={d} className="flex flex-1 flex-col items-center justify-end" title={`${WEEKDAY_LABELS[d]}: ${n}`}>
                          <div className={`w-full rounded-t ${n ? 'bg-blue-600' : 'bg-neutral-100'}`} style={{ height: `${Math.max(4, (n / dayMax) * 100)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                      {WEEKDAY_LABELS.map((d) => (
                        <span key={d}>{d.slice(0, 1)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </>
        ) : null}

        <Card className="mt-4">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-950">What Axeon is building</h2>
            <span className="text-sm text-neutral-500">
              {progress.axeonDone} of {progress.axeonTotal} done
            </span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {axeonItems.map((item) => {
              const done = states[item.key]?.status === 'done';
              return (
                <li key={item.key} className="flex items-center gap-4 px-6 py-3.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      done ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {done ? <Check size={14} className="stroke-[3]" /> : <Clock size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                    <p className="truncate text-sm text-neutral-500">{item.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      done ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {done ? 'Done' : 'In progress'}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <p className="mt-10 text-center text-sm text-neutral-500">
          Questions? Call or text{' '}
          <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:text-blue-700">
            (515) 493-8017
          </a>
        </p>
        </>) : null}
      </main>
    </div>
  );
}
