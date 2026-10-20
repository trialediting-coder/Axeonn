'use client';

// components/axeonproof/screens.tsx
// The AxeonPROOF screens rendered live for the fictional demo practice on
// /axeonproof. Each one copies the layout of its counterpart in
// components/proof/* and animates in with the Tailwind animate-proof-*
// utilities from globals.css: numbers count up, bars grow, the rank line
// draws itself, rows slide in. The lead log is real UI: tapping Booked moves
// the count.
import { useState } from 'react';
import { Check, Clock, FileText, Globe, Lock, Mail, MapPin, MousePointerClick, PhoneCall, ShieldCheck, Smartphone, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { TIER_LABELS } from '@/data/onboardingItems';
import { PROOF_TABS, TIER_PRICE, TIER_SHORT, tabLocked, type ProofTab, type ProofTabKey } from '@/lib/proofTabs';
import { CARD_NOTES, EXAMPLE, type ExampleLead, type ExampleTile } from '@/data/proofPage';
import { CountUp } from '@/components/axeonproof/motion';

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
const SHADOW = 'shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.04)]';

function Card({ children, className = '', ms = 0 }: { children: React.ReactNode; className?: string; ms?: number }) {
  return (
    <section className={`animate-proof-rise rounded-2xl bg-white ${SHADOW} ${className}`} style={delay(ms)}>
      {children}
    </section>
  );
}

const TILE_ICONS: Record<ExampleTile['key'], LucideIcon> = { reached: PhoneCall, customers: Users, visits: Globe, clicks: MousePointerClick };

function StatTile({ tile, ms }: { tile: ExampleTile; ms: number }) {
  const Icon = TILE_ICONS[tile.key];
  return (
    <Card className="relative flex flex-col p-4 @3xl:px-5 @3xl:pb-4 @3xl:pt-5" ms={ms}>
      {/* The icon sits in the card's own row; it used to float over the top edge and cover long labels. */}
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-600/30 @3xl:h-10 @3xl:w-10 @3xl:rounded-xl">
          <Icon size={18} />
        </span>
        <p className="min-w-0 text-xs font-medium leading-snug text-neutral-500 @3xl:text-sm">{tile.label}</p>
      </div>
      <div className="mt-1 @3xl:mt-3">
        <p className="text-2xl font-bold tracking-tight text-neutral-950 @3xl:text-3xl">
          <CountUp value={tile.value} prefix={tile.prefix} delay={ms} />
        </p>
        <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-wide text-neutral-400 @3xl:block">{EXAMPLE.month} so far</p>
      </div>
      <p className={`mt-2 border-neutral-100 text-[11px] leading-snug @3xl:mt-4 @3xl:border-t @3xl:pt-3 @3xl:text-xs ${tile.tone === 'up' ? 'font-semibold text-emerald-600' : 'text-neutral-500'}`}>{tile.sub}</p>
    </Card>
  );
}

/** The people who reached out, with Booked / Not yet as real buttons. */
export function LeadLog({ ms = 0 }: { ms?: number }) {
  const [leads, setLeads] = useState<ExampleLead[]>(EXAMPLE.leads);
  const booked = leads.filter((l) => l.booked).length;
  const set = (i: number, value: boolean) => setLeads((prev) => prev.map((l, j) => (j === i ? { ...l, booked: value } : l)));
  return (
    <Card className="mt-4 overflow-hidden" ms={ms}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 @3xl:px-5">
        <h3 className="text-base font-semibold text-neutral-950">People who reached out</h3>
        <p className="text-xs text-neutral-500">
          {leads.length} leads · <span className="font-semibold text-emerald-700">{booked} booked</span>
        </p>
      </div>
      <p className="px-4 pb-3 pt-1 text-xs leading-relaxed text-neutral-500 @3xl:px-5">
        Every call, text, email, form and booking from your site, with the page and campaign behind it. Tap <b className="text-neutral-700">Booked</b> on the ones that turned into an appointment and your numbers get more exact every month.
      </p>
      <p className="bg-neutral-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 @3xl:px-5">{EXAMPLE.month} so far</p>
      <ul className="divide-y divide-neutral-100">
        {leads.map((l, i) => (
          <li key={i} className="animate-proof-slide flex items-center justify-between gap-3 px-4 py-3 @3xl:px-5" style={delay(ms + 120 + i * 70)}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-950">
                {l.kind} <span className="ml-1 font-normal text-neutral-500">{l.when}</span>
              </p>
              <p className="truncate text-xs text-neutral-500">
                {l.page} · {l.where} · {l.device}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => set(i, true)}
                aria-pressed={l.booked}
                className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors ${l.booked ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
              >
                <Check size={13} /> Booked
              </button>
              <button
                type="button"
                onClick={() => set(i, false)}
                aria-pressed={!l.booked}
                className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors ${!l.booked ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
              >
                <X size={13} /> Not yet
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MonthChart({ ms }: { ms: number }) {
  const max = Math.max(...EXAMPLE.months.map((m) => m.calls + m.leads));
  const top = Math.ceil(max / 10) * 10;
  return (
    <Card className="@3xl:col-span-2" ms={ms}>
      <div className="mx-3 mt-3 rounded-xl bg-white px-4 pb-3 pt-4 ring-1 ring-neutral-100 @3xl:mx-4 @3xl:-mt-4 @3xl:shadow-[0_10px_30px_-10px_rgba(16,24,40,0.22)]">
        <div className="relative h-48">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between pb-6 pl-8">
            {[1, 0.75, 0.5, 0.25, 0].map((k) => (
              <div key={k} className="relative border-t border-dashed border-neutral-200">
                <span className="absolute -left-8 -top-2 w-7 text-right text-[10px] text-neutral-400">{Math.round(top * k)}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-3 pb-6 pl-8">
            {EXAMPLE.months.map((m, i) => {
              const total = m.calls + m.leads;
              return (
                <div key={m.label} className="relative flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 animate-proof-pop text-xs font-semibold text-neutral-700" style={delay(ms + 500 + i * 80)}>
                    {total}
                  </span>
                  <div className="flex w-full max-w-10 animate-proof-grow origin-bottom flex-col justify-end overflow-hidden rounded-md" style={{ height: `${(total / top) * 100}%`, ...delay(ms + 150 + i * 80) }}>
                    <div className="bg-blue-300" style={{ flexGrow: m.leads }} />
                    <div className="bg-blue-600" style={{ flexGrow: m.calls }} />
                  </div>
                  <span className="absolute -bottom-6 text-[11px] text-neutral-500">
                    {m.label}
                    {m.live ? <span className="ml-1 text-[10px] text-neutral-400">so far</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-5 pb-3 pt-5">
        <h3 className="text-base font-semibold text-neutral-950">Calls and leads</h3>
        <p className="mt-0.5 text-sm text-neutral-500">By month, straight from your site and your tracked number</p>
        <p className="mt-3 flex gap-4 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-blue-600" /> Calls
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-blue-300" /> Leads
          </span>
        </p>
      </div>
      <p className="flex items-center gap-1.5 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
        <Clock size={13} className="text-neutral-400" /> updated just now
      </p>
    </Card>
  );
}

function ProjectCard({ ms }: { ms: number }) {
  const c = EXAMPLE.commitment;
  const pct = Math.round((c.repliedIn60 / c.inquiries) * 100);
  return (
    <Card className="p-5" ms={ms}>
      <h3 className="text-base font-semibold text-neutral-950">Your project</h3>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Kickoff</dt>
          <dd className="font-medium text-neutral-900">Aug 28</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Live</dt>
          <dd className="font-medium text-neutral-900">{c.launched}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Agreement</dt>
          <dd className="font-medium text-neutral-900">12-month</dd>
        </div>
      </dl>
      <div className="mt-5 rounded-lg bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Performance commitment · Day {c.day} of 90</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div className="h-1.5 animate-proof-width rounded-full bg-blue-600" style={{ width: `${(c.day / 90) * 100}%`, ...delay(ms + 300) }} />
        </div>
        <ul className="mt-2 space-y-1 text-xs text-blue-900">
          <li className="flex items-center gap-1.5">
            <Check size={12} className="shrink-0 text-emerald-700" /> Live within 30 days
          </li>
          <li className="flex items-center gap-1.5">
            <Check size={12} className="shrink-0 text-emerald-700" /> <b>{pct}%</b> of inquiries answered within 60 sec
          </li>
          <li className="flex items-center gap-1.5">
            <Check size={12} className="shrink-0 text-emerald-700" /> Review request on <b>{c.reviewRequests}</b> of {c.visits} visits
          </li>
        </ul>
      </div>
      <div className="mt-5 flex flex-col gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold text-blue-600">
          <FileText size={15} /> Welcome Packet
        </span>
        <span className="inline-flex items-center gap-2 font-semibold text-blue-600">
          <FileText size={15} /> Signed agreement
        </span>
      </div>
    </Card>
  );
}

function RankCard({ ms }: { ms: number }) {
  const r = EXAMPLE.rank;
  const W = 320;
  const H = 96;
  const pad = 10;
  const max = Math.max(5, ...r.points, r.baseline);
  const x = (i: number) => pad + (i * (W - pad * 2)) / (r.points.length - 1);
  const y = (rank: number) => pad + ((rank - 1) * (H - pad * 2)) / (max - 1);
  const path = r.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  return (
    <Card className="mt-4 p-5" ms={ms}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <MapPin size={12} /> Google Maps · “{EXAMPLE.keyword}” in {EXAMPLE.city}
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            <span className="inline-block animate-proof-pop" style={delay(ms + 900)}>
              #{r.current}
            </span>
            <span className="ml-2 text-sm font-semibold text-neutral-500">today</span>
          </p>
          <p className="text-sm text-neutral-600">
            {r.rating} ★ · {r.reviews} reviews · started at #{r.baseline}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white">Scan now</span>
          <p className="mt-1 text-[11px] text-neutral-500">3 of 4 left this month</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 @3xl:grid-cols-4">
        {r.progress.map((t, i) => (
          <div key={t.label} className="animate-proof-rise rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2" style={delay(ms + 200 + i * 80)}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{t.label}</p>
            <p className="mt-0.5 text-base font-bold text-neutral-950">
              {t.from}
              <span className="mx-1 text-neutral-400">→</span>
              <span className="text-emerald-700">{t.to}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label="Maps rank over time, from #11 to #2">
          <line x1={pad} x2={W - pad} y1={y(r.baseline)} y2={y(r.baseline)} stroke="#a3a3a3" strokeDasharray="4 4" />
          <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" pathLength={1} strokeDasharray={1} className="animate-proof-draw" style={delay(ms + 300)} />
          {r.points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p)} r="3.5" fill="#2563eb" className="animate-proof-pop [transform-box:fill-box] [transform-origin:center]" style={delay(ms + 300 + (i * 1500) / r.points.length)} />
          ))}
        </svg>
        <p className="mt-1 text-xs text-neutral-500">Rankings move a spot or two day to day. The line is what matters. Dashed line: where you started.</p>
      </div>
    </Card>
  );
}

type CardKey = keyof typeof CARD_NOTES | 'buttons' | 'pages';

function Rows({ rows, ms }: { rows: Array<[string, number | string, (number | string)?]>; ms: number }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {rows.map(([label, n, reached], i) => (
        <li key={label} className="animate-proof-slide flex items-center justify-between gap-3" style={delay(ms + 150 + i * 60)}>
          <span className="truncate text-neutral-700">{label}</span>
          <span className="shrink-0 font-semibold text-neutral-950">
            {typeof n === 'number' ? n.toLocaleString('en-US') : n}
            {reached != null ? <span className="ml-1 font-semibold text-emerald-700">· {reached} reached out</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The seven analytics cards from the Overview. Cards with a note highlight on hover and report it up. */
export function AnalyticsCards({ active, onActive, ms = 0 }: { active?: string | null; onActive?: (key: string) => void; ms?: number }) {
  const a = EXAMPLE.analytics;
  const card = (key: CardKey, i: number, title: string, sub: string, body: React.ReactNode, className = '') => {
    const interactive = !!onActive && key in CARD_NOTES;
    const on = active === key;
    return (
      <Card
        key={key}
        className={`p-5 transition-shadow ${className} ${interactive ? 'cursor-pointer hover:shadow-[0_12px_28px_-8px_rgba(16,24,40,0.16)]' : ''} ${on ? 'ring-2 ring-blue-600' : ''}`}
        ms={ms + i * 60}
      >
        <div onMouseEnter={interactive ? () => onActive!(key) : undefined} onClick={interactive ? () => onActive!(key) : undefined} className="h-full">
          <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
          <p className="text-xs text-neutral-500">{sub}</p>
          {body}
        </div>
      </Card>
    );
  };
  const bars = (rows: [string, number][], max: number, suffix = '') => (
    <ul className="mt-3 space-y-2">
      {rows.map(([label, n], i) => (
        <li key={label}>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-700">{label}</span>
            <span className="font-semibold text-neutral-950">
              {n}
              {suffix}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-1.5 animate-proof-width rounded-full bg-blue-600" style={{ width: `${(n / max) * 100}%`, ...delay(ms + 200 + i * 80) }} />
          </div>
        </li>
      ))}
    </ul>
  );
  const hourBars = (values: number[], max: number, start: number, step: number, gap: string) => (
    <div className={`flex h-24 items-end ${gap}`}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 animate-proof-grow origin-bottom rounded-sm bg-blue-600" style={{ height: `${Math.max(4, (v / max) * 100)}%`, opacity: v ? 1 : 0.15, ...delay(ms + start + i * step) }} />
      ))}
    </div>
  );
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 @2xl:grid-cols-3">
      {card('buttons', 0, 'Most clicked buttons', `${EXAMPLE.month} so far`, <Rows rows={a.buttons} ms={ms} />)}
      {card('sources', 1, 'Where visitors came from', '812 visitors', bars(a.sources, a.sources[0][1]))}
      {card('pages', 2, 'Most visited pages', '1,284 page views', <Rows rows={a.pages} ms={ms} />)}
      {card(
        'device',
        3,
        'How people visit',
        '1,284 visits · 96 came back',
        <>
          {bars(a.devices, 100, '%')}
          <dl className="mt-3 space-y-1.5 text-sm">
            {a.visitFacts.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-neutral-500">{k}</dt>
                <dd className="font-semibold text-neutral-950">{v}</dd>
              </div>
            ))}
          </dl>
        </>,
      )}
      {card(
        'bring',
        4,
        'Pages that bring new patients and clients',
        'First page of the visit, and how many reached out',
        <>
          <Rows rows={a.bring} ms={ms} />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Campaigns</p>
          <Rows rows={a.campaigns} ms={ms + 200} />
        </>,
      )}
      {card('cities', 5, 'Where visitors are', 'City and area only, never who', <Rows rows={a.cities} ms={ms} />)}
      {card(
        'when',
        6,
        'When people reach out',
        'Calls, texts, emails, forms and bookings by time of day and day of week',
        <div className="mt-4 grid grid-cols-[3fr_1.2fr] gap-6">
          <div>
            {hourBars(a.hours, 8, 150, 25, 'gap-[3px]')}
            <div className="mt-1.5 flex justify-between text-[10px] text-neutral-500">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </div>
          <div>
            {hourBars(a.days, 12, 400, 50, 'gap-1')}
            <div className="mt-1.5 flex justify-between text-[10px] text-neutral-500">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>,
        '@2xl:col-span-3',
      )}
    </div>
  );
}

export function OverviewScreen({ full = true }: { full?: boolean }) {
  return (
    <>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 @3xl:hidden">{EXAMPLE.month} so far</p>
      <div className="mt-2 grid grid-cols-2 gap-3 @3xl:mt-9 @3xl:gap-x-4 @3xl:gap-y-7 @5xl:grid-cols-4">
        {EXAMPLE.tiles.map((t, i) => (
          <StatTile key={t.key} tile={t} ms={i * 70} />
        ))}
      </div>
      <LeadLog ms={280} />
      <div className="mt-4 grid grid-cols-1 gap-4 @3xl:mt-8 @3xl:grid-cols-3">
        <MonthChart ms={360} />
        <ProjectCard ms={420} />
      </div>
      <RankCard ms={480} />
      {full ? <AnalyticsCards ms={560} /> : null}
    </>
  );
}

function Included({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{label}</h3>
      <p className="mt-1.5 max-w-2xl text-sm text-neutral-600">{text}</p>
    </div>
  );
}

/** Calls, Bookings, Reviews, Ads, AI receptionist: the app's own example month, animated. */
export function GhostScreen({ tab }: { tab: ProofTab }) {
  const locked = tabLocked(tab, EXAMPLE.plan);
  const plan = TIER_LABELS[tab.tier];
  const g = tab.ghost!;
  const delta = TIER_PRICE[tab.tier] - TIER_PRICE[EXAMPLE.plan];
  const num = (v: string) => {
    const m = v.match(/^(\$?)(\d[\d,]*)(\.\d+)?$/);
    return m && !m[3] ? <CountUp value={Number(m[2].replace(/,/g, ''))} prefix={m[1]} /> : v;
  };
  const SOURCES: [string, number][] = [
    ['Google', 48],
    ['Your website', 31],
    ['Google listing', 14],
    ['Facebook', 7],
  ];
  return (
    <>
      {locked ? (
        <div className="mt-5">
          <AxeonLogo product={TIER_SHORT[tab.tier]} size="sm" mark={false} />
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{tab.label}</h3>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-700">{tab.promise}</p>
        </div>
      ) : (
        <Included label={tab.label} text={tab.promise} />
      )}
      <Card className="mt-4 overflow-hidden" ms={100}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
          <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-neutral-900">
            {locked ? 'An example month on' : 'This month on'} <AxeonLogo product={TIER_SHORT[tab.tier]} size="sm" mark={false} />
            {locked ? <span className="font-normal text-neutral-500">· not your numbers yet</span> : null}
          </p>
          {locked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
              <Lock size={12} /> {plan}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">{EXAMPLE.month} so far</span>
          )}
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
            {g.tiles.map((t, i) => (
              <div key={t.label} className="animate-proof-rise rounded-xl border border-neutral-200 bg-white p-4" style={delay(150 + i * 70)}>
                <p className="text-xs font-medium text-neutral-600">{t.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{num(t.value)}</p>
                <p className="mt-1 text-[11px] font-semibold text-emerald-600">{t.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 @3xl:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 @3xl:col-span-2">
              <p className="text-sm font-semibold text-neutral-900">By week</p>
              <div className="mt-4 flex h-28 items-end gap-2">
                {g.bars.map((h, i) => (
                  <div key={i} className="flex-1 animate-proof-grow origin-bottom rounded-t bg-blue-600" style={{ height: `${h}%`, opacity: 0.55 + (i / g.bars.length) * 0.45, ...delay(300 + i * 60) }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-900">Where they came from</p>
              <ul className="mt-3 space-y-2">
                {SOURCES.map(([src, pct], i) => (
                  <li key={src}>
                    <div className="flex justify-between text-xs text-neutral-700">
                      <span>{src}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-1.5 animate-proof-width rounded-full bg-blue-600" style={{ width: `${pct}%`, ...delay(400 + i * 80) }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ul className={`mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white ${locked ? 'blur-[1.5px]' : ''}`}>
            {g.rows.map((row, i) => (
              <li key={i} className="grid animate-proof-slide grid-cols-[1fr_1.4fr_1.6fr] gap-3 px-4 py-3 text-sm" style={delay(500 + i * 70)}>
                <span className="font-semibold text-neutral-900">{row.a}</span>
                <span className="truncate text-neutral-700">{row.b}</span>
                <span className="truncate text-neutral-500">{row.c}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      {locked ? (
        <div className="mt-4 grid grid-cols-1 gap-4 @3xl:grid-cols-2">
          <Card className="p-5" ms={200}>
            <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-neutral-900">
              What <AxeonLogo product={TIER_SHORT[tab.tier]} size="sm" mark={false} /> adds
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-neutral-700">
              {tab.includes.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5" ms={260}>
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-2xl font-extrabold tracking-tight text-neutral-950">
                ${delta.toLocaleString('en-US')}
                <span className="text-sm font-semibold text-neutral-500">/mo more</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">Plus the ad budget you set ($500/mo minimum), paid to Google directly and yours to decide.</p>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-neutral-600">{plan} is set up for your practice or firm, not switched on with a click. Tell us you are interested and we will walk you through what changes.</p>
            <span className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">Ask us about {plan}</span>
          </Card>
        </div>
      ) : null}
    </>
  );
}

export function LeadsScreen() {
  return (
    <>
      <Included label="Leads" text="Every call, text, email, form and booking from your site, the day it happens. Tap Booked on the ones that turned into an appointment and your numbers get more exact every month." />
      <LeadLog ms={100} />
    </>
  );
}

export function EmailScreen() {
  const boxes = [
    [`dana@${EXAMPLE.emailDomain}`, 'Owner · signed in'],
    [`frontdesk@${EXAMPLE.emailDomain}`, 'Front desk · signed in'],
    [`info@${EXAMPLE.emailDomain}`, 'Alias, delivers to Dana · free'],
  ];
  const checks = ['Google trusts mail from your domain', 'Nobody can send as you from elsewhere', 'Your mail lands in inboxes, not spam'];
  return (
    <>
      <Included label="Business email" text="Your email at your own domain, on Google Workspace. Google sends each person their own sign-in, so we never see or ask for a password." />
      <div className="mt-4 grid grid-cols-1 gap-4 @3xl:grid-cols-2">
        <Card className="p-5" ms={100}>
          <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Mail size={15} className="text-neutral-400" /> Your mailboxes
          </p>
          <ul className="mt-3 divide-y divide-neutral-100 text-sm">
            {boxes.map(([addr, note], i) => (
              <li key={addr} className="animate-proof-slide flex items-center justify-between gap-3 py-2.5" style={delay(200 + i * 70)}>
                <span className="font-medium text-neutral-900">{addr}</span>
                <span className="text-xs text-neutral-500">{note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">AxeonCORE includes 3 mailboxes. Addresses like info@ that deliver into a mailbox are always free.</p>
        </Card>
        <Card className="p-5" ms={160}>
          <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ShieldCheck size={15} className="text-neutral-400" /> Spam protection
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {checks.map((line, i) => (
              <li key={line} className="animate-proof-slide flex items-center gap-2" style={delay(250 + i * 70)}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <Check size={12} />
                </span>
                <span className="text-neutral-700">{line}</span>
                <span className="ml-auto text-xs font-semibold text-emerald-700">Passing</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">Checked every night. Nothing for you to do; this updates by itself.</p>
        </Card>
        <Card className="p-5 @3xl:col-span-2" ms={220}>
          <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Smartphone size={15} className="text-neutral-400" /> On your phone and computer
          </p>
          <div className="mt-3 grid gap-4 text-sm @3xl:grid-cols-3">
            <div>
              <p className="font-semibold text-blue-600">iPhone and iPad</p>
              <p className="text-neutral-600">Get the Gmail app, tap Add account, choose Google.</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">Android</p>
              <p className="text-neutral-600">Open Gmail, tap your photo, then Add another account.</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">Outlook on a computer</p>
              <p className="text-neutral-600">File, then Add Account, type your new address and sign in with Google.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export function BillingScreen() {
  const invoices = [
    ['Oct 1, 2026', 'AxeonCORE · October', '$799.00', 'Paid'],
    ['Sep 1, 2026', 'AxeonCORE · September', '$799.00', 'Paid'],
    ['Aug 28, 2026', 'AxeonCORE · first month ($3,000 setup credited)', '$799.00', 'Paid'],
  ];
  return (
    <>
      <Included label="Billing" text="Your plan, the card on file, and every invoice. Receipts download from here any time; nothing to ask us for." />
      <div className="mt-4 grid grid-cols-1 gap-4 @3xl:grid-cols-3">
        <Card className="p-5 @3xl:col-span-2" ms={100}>
          <p className="text-sm font-semibold text-neutral-500">Your plan</p>
          <p className="mt-1">
            <AxeonLogo product="CORE" size="lg" mark={false} />
          </p>
          <p className="mt-2 text-sm text-neutral-600">$799 per month, 12-month agreement. Next invoice Nov 1.</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
            <span className="inline-flex h-7 w-10 items-center justify-center rounded bg-neutral-950 text-[10px] font-bold text-white">VISA</span>
            Visa ending in 4242 · expires 08/29
          </p>
        </Card>
        <Card className="p-5" ms={160}>
          <p className="text-sm font-semibold text-neutral-900">Manage billing</p>
          <p className="mt-1 text-sm text-neutral-600">Change the card, download receipts, or update the billing email. Opens Stripe, our payment provider, and brings you back here.</p>
          <span className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">Open billing</span>
        </Card>
        <Card className="overflow-hidden @3xl:col-span-3" ms={220}>
          <p className="border-b border-neutral-100 px-5 py-4 text-base font-semibold text-neutral-950">Invoices</p>
          <ul className="divide-y divide-neutral-100">
            {invoices.map(([date, what, amount, status], i) => (
              <li key={date} className="animate-proof-slide grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 text-sm @3xl:grid-cols-[1fr_2fr_auto_auto]" style={delay(300 + i * 70)}>
                <span className="font-medium text-neutral-900">{date}</span>
                <span className="hidden text-neutral-600 @3xl:block">{what}</span>
                <span className="font-semibold text-neutral-950">{amount}</span>
                <span className="hidden rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 @3xl:inline">{status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/** The screen for a tab, as the tour and the hero use it. */
export function ScreenFor({ tab, full = true }: { tab: ProofTabKey; full?: boolean }) {
  const t = PROOF_TABS.find((x) => x.key === tab) ?? PROOF_TABS[0];
  switch (tab) {
    case 'overview':
      return <OverviewScreen full={full} />;
    case 'leads':
      return <LeadsScreen />;
    case 'email':
      return <EmailScreen />;
    case 'billing':
      return <BillingScreen />;
    default:
      return <GhostScreen tab={t} />;
  }
}
