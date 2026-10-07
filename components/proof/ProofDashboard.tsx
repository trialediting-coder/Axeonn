// components/proof/ProofDashboard.tsx
// What a signed-in client sees at app.axeonstudio.co. A dark sidebar and a light
// workspace, like Stripe or Linear. The numbers come only from the Monthly
// Reports Axeon enters (lib/projects.ts); before the first one, every metric
// shows an honest empty state ("Live after launch"). Nothing is invented.
import type { ComponentType, ReactNode } from 'react';
import {
  Activity,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  PhoneCall,
} from 'lucide-react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import type { OnboardingItem } from '@/data/onboardingItems';
import type { ItemState, Onboarding, Progress } from '@/lib/onboarding';
import type { MonthlyReport, ProjectDetails, ProjectUpdate } from '@/lib/projects';
import { monthLabel } from '@/lib/projectsShared';

type Icon = ComponentType<{ size?: number; className?: string }>;

const NAV: { label: string; icon: Icon; soon?: boolean }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Calls', icon: PhoneCall, soon: true },
  { label: 'Leads', icon: Activity, soon: true },
  { label: 'Booked jobs', icon: CalendarCheck, soon: true },
  { label: 'Map rank', icon: MapPin, soon: true },
];

type MetricKey = 'calls' | 'leads' | 'booked' | 'rank';
const METRICS: { key: MetricKey; label: string; icon: Icon; hint: string }[] = [
  { key: 'calls', label: 'Calls', icon: PhoneCall, hint: 'From your site and Google listing' },
  { key: 'leads', label: 'Leads', icon: Activity, hint: 'Quote requests and form leads' },
  { key: 'booked', label: 'Booked jobs', icon: CalendarCheck, hint: 'Traced back to their source' },
  { key: 'rank', label: 'Map rank', icon: MapPin, hint: 'For the services you sell' },
];

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
}) {
  const latest = reports[0] ?? null;
  const prev = reports[1] ?? null;
  const live = latest !== null;
  const chart = reports.slice(0, 6).reverse();
  const chartMax = Math.max(1, ...chart.map((r) => (r.calls ?? 0) + (r.leads ?? 0)));
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
    <div className="min-h-screen bg-[#F6F7F9] lg:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0B0D12] text-white lg:flex">
        <div className="px-5 pb-6 pt-6">
          <AxeonLogo product="PROOF" tone="light" />
        </div>
        <nav aria-label="AxeonPROOF" className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ label, icon: Icon, soon }) => (
            <div
              key={label}
              aria-current={!soon ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                soon ? 'cursor-default text-neutral-500' : 'bg-white/[0.07] text-white'
              }`}
            >
              <Icon size={17} className={soon ? 'text-neutral-600' : 'text-blue-400'} />
              {label}
              {soon ? (
                <span className="ml-auto rounded-full border border-white/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Soon
                </span>
              ) : null}
            </div>
          ))}
          <a
            href={setupUrl}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/[0.05] hover:text-white"
          >
            <ClipboardList size={17} className="text-neutral-500" />
            Setup
            {!setupDone ? <span className="ml-auto text-xs font-semibold text-blue-400">{progress.percent}%</span> : null}
          </a>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold">{initials || 'A'}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-neutral-500">{email}</p>
            </div>
          </div>
          <SignOut className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 text-xs font-semibold text-neutral-300 hover:bg-white/[0.05] hover:text-white" />
        </div>
      </aside>

      {/* Top bar (phones and tablets) */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <AxeonLogo product="PROOF" size="sm" />
        <div className="ml-auto">
          <SignOut className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-950">{name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">{planLabel}</span>
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

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(({ key, label, icon: Icon, hint }) => {
            const m = metric(key, latest, prev);
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

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">Calls and leads</h2>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                {live ? 'By month' : 'Last 30 days'}
              </span>
            </div>
            {live ? (
              <div className="mt-6 flex h-52 items-end gap-3">
                {chart.map((r) => {
                  const calls = r.calls ?? 0;
                  const leads = r.leads ?? 0;
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
                      <span className="text-[11px] text-neutral-500">{monthLabel(r.month).slice(0, 3)}</span>
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
            {live && (
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

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                        {f.r.calls ?? '—'} calls · {f.r.leads ?? '—'} leads · {f.r.booked ?? '—'} booked jobs
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
      </main>
    </div>
  );
}
