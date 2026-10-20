// components/proof/v2/V2Sections.tsx
// AxeonPROOF v2 on the client dashboard: what is added to the Overview (one
// schedule status card, Launch Certificate, front desk, pipeline) and the Program
// tab (done phases folded to a line, the phase on now in full, the rest by date). Numbers come from lib/proofV2.ts loadV2View; anything not
// measured yet says when it starts on the schedule. Each section is sized to
// sit on one phone screen.
import type { ReactNode } from 'react';
import { ArrowRight, Award, CalendarCheck, Check, ChevronDown, ExternalLink, Inbox, MapPin, PhoneCall, Search, Star, TrendingUp } from 'lucide-react';
import type { ProofV2View } from '@/lib/proofV2';
import { FRONT_DESK_ROUTINE, GROWTH_UPGRADE_PRICE, NAP_DIRECTORIES, scheduleStatus, shortDate, type FilingStatus, type Milestone, type ScheduleTone } from '@/lib/proofV2Shared';
import type { OnboardingTier } from '@/data/onboardingItems';
import type { RankingData } from '@/components/proof/RankingCard';
import { MilestoneTracker, StatusPill, StepRow } from '@/components/proof/v2/MilestoneTracker';
import LineIcon from '@/components/common/LineIcon';
import { FrontDeskSignoff, ManagerForm, PinBoard, ReviewApproval, StagingActions } from '@/components/proof/v2/V2Interactive';
import { UpgradeButton } from '@/components/proof/UpgradeButton';
import { formatPhone } from '@/lib/phoneShared';
import { monthLabel } from '@/lib/projectsShared';

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const longDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`proof-rise rounded-2xl bg-white p-4 shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.04)] sm:p-6 ${className}`}>{children}</section>;
}

function Head({ icon: Icon, title, sub, right }: { icon: typeof Award; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-600/30">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold leading-tight text-neutral-950">{title}</h2>
        {sub ? <p className="mt-0.5 text-xs text-neutral-500">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <p className="text-[11px] font-medium leading-snug text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight text-neutral-950">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">{sub}</p> : null}
    </div>
  );
}

const startsLine = (phase: Milestone['key'], v: ProofV2View) => `Starts ${shortDate(v.milestones.find((x) => x.key === phase)!.from)}`;

// ───────────────────────────── Overview cards ─────────────────────────────

export function LaunchCertificate({ v, businessName }: { v: ProofV2View; businessName: string }) {
  const s = v.settings;
  if (!s.goLiveAt) return null;
  return (
    <Card className="relative overflow-hidden ring-2 ring-blue-600/80">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
          <Award size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">Launch Certificate</p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-neutral-950">{businessName}</p>
          <p className="text-sm text-neutral-600">Live since {longDate(s.goLiveAt)}</p>
        </div>
      </div>
      {s.liveItems?.length ? (
        <ul className="mt-3 grid gap-1 text-sm text-neutral-800 sm:grid-cols-2">
          {s.liveItems.map((i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {i}
            </li>
          ))}
        </ul>
      ) : null}
      {s.dnsCutoverAt ? <p className="mt-3 text-[11px] text-neutral-500">Domain switched {shortDate(s.dnsCutoverAt)}{s.certificateSentAt ? ` · emailed ${shortDate(s.certificateSentAt)}` : ''}</p> : null}
    </Card>
  );
}

export function FrontDeskCard({ v }: { v: ProofV2View }) {
  const f = v.frontDesk;
  return (
    <Card>
      <Head icon={Inbox} title="Front desk" sub="Inbox zero by 8:30 AM, every day" right={<a href="?tab=leads" className="shrink-0 text-xs font-semibold text-blue-600">Open inbox</a>} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Missed-call threads waiting" value={String(f.waiting)} sub={f.waiting ? 'Reply or call back today' : v.line ? 'Inbox zero' : 'Starts when your number is live'} />
        <Stat label="This week" value={`${f.week.booked} booked`} sub={`${f.week.archived} not a fit · ${f.week.missed} missed, ${f.week.staffReplied} answered by your team`} />
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">
        {f.access.length ? `Monthly summary last opened ${shortDate(f.access[0].at)} (${f.access[0].recipient === 'owner' ? 'owner' : 'practice manager'})` : 'Your monthly summary link arrives on the 1st.'}
      </p>
    </Card>
  );
}

export function PipelineCard({ v, full = false }: { v: ProofV2View; full?: boolean }) {
  const { rows, totals, average } = v.pipeline;
  const total = totals.anyValue ? (totals.dbrDollars ?? 0) + (totals.webDollars ?? 0) : null;
  return (
    <Card>
      <Head icon={TrendingUp} title="Pipeline Revenue Tracker" sub={total != null ? `${money(total)} estimated from your own values` : 'Bookings from win-back texts and your website'} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="From win-back texts" value={String(totals.dbr)} sub={totals.dbrDollars != null ? money(totals.dbrDollars) : v.dbr.status === 'none' ? startsLine('p3', v) : 'booked'} />
        <Stat label="From your website" value={String(totals.web)} sub={totals.webDollars != null ? money(totals.webDollars) : 'booked'} />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-neutral-500">
        {average ? `Estimate: each booking × your average of ${money(average)}, or the value entered for that booking.` : 'Add your average appointment value and we show the dollar figure; until then it counts bookings.'}
      </p>
      {full && rows.length ? (
        <ul className="mt-3 max-h-64 divide-y divide-neutral-100 overflow-y-auto text-sm">
          {rows.slice(0, 50).map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-neutral-800">
                {r.label} <span className="text-xs text-neutral-400">· {r.source === 'dbr' ? 'win-back' : 'website'} · {shortDate(r.at)}</span>
              </span>
              <span className="shrink-0 font-semibold text-neutral-950">{r.value != null ? money(r.value) : '—'}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

const TONE: Record<ScheduleTone, { label: string; cls: string }> = {
  on_track: { label: 'On track', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  waiting_client: { label: 'Waiting on your approval', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  waiting_carrier: { label: 'Waiting on the phone carriers', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  behind: { label: 'Running behind', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  done: { label: 'All six phases done', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

/** The one thing the client can do now, if anything: where it lives on the Program tab, or the booking link. */
function clientAction(v: ProofV2View): { label: string; href: string; external?: boolean } | null {
  const s = v.settings;
  const current = v.milestones.find((m) => m.current)?.key;
  if (s.reviews?.wireframe?.sharedAt && !s.reviews.wireframe.approvedAt) return { label: 'Approve your layout', href: '?tab=program#phase-p2' };
  if (s.reviews?.copy?.sharedAt && !s.reviews.copy.approvedAt) return { label: 'Approve your words', href: '?tab=program#phase-p2' };
  if (v.staging.phase === 'in_review') return { label: 'Review your new site', href: '?tab=program#phase-p2' };
  if (s.goLiveAt && !v.frontDesk.signedOffAt) return { label: 'Sign off your front-desk routine', href: '?tab=program#front-desk' };
  if (current === 'p6' && !s.sabr?.scheduledAt && !s.sabr?.completedAt) return { label: 'Book your six-month review', href: v.bookUrl, external: true };
  return null;
}

/** The Overview's schedule card: where things stand in one look; the full schedule opens under it. */
export function ScheduleStatusCard({ v }: { v: ProofV2View }) {
  const st = scheduleStatus(v.milestones);
  const tone = TONE[st.tone];
  const action = clientAction(v);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-neutral-500">
          Delivery schedule · <span className="whitespace-nowrap">day {Math.min(v.day, 180)} of 180</span>
        </p>
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone.cls}`}>{tone.label}</span>
      </div>
      <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight text-neutral-950 sm:text-xl">
        {st.tone === 'done' ? 'Your first 180 days are done' : <>Phase {st.n} of 6: {st.title}</>}
      </h2>
      {st.next ? (
        <p className="mt-1 text-sm text-neutral-600">
          Next: {st.next.title} · <span className="whitespace-nowrap">{shortDate(st.next.date)}</span>
        </p>
      ) : null}
      {action ? (
        <a
          href={action.href}
          {...(action.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 sm:w-auto"
        >
          {action.label} <ArrowRight size={15} />
        </a>
      ) : (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-neutral-700">
          <LineIcon>
            <Check size={15} className="text-emerald-600" />
          </LineIcon>
          Nothing needed from you right now.
        </p>
      )}
      <details className="group mt-4 border-t border-neutral-100 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-blue-600 [&::-webkit-details-marker]:hidden">
          See the full schedule <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="-mx-4 mt-2 sm:-mx-6">
          <MilestoneTracker milestones={v.milestones} day={v.day} startAt={v.startAt} bare />
        </div>
      </details>
    </Card>
  );
}

const CERTIFICATE_DAYS = 30;

/**
 * The v2 part of the Overview. Before launch the schedule card leads; after it,
 * the dashboard's own numbers lead (ProofDashboard puts this block below them)
 * and the Launch Certificate shows for its first month only (it stays on the
 * Program tab).
 */
export function V2Overview({ v, businessName }: { v: ProofV2View; businessName: string }) {
  const live = !!v.settings.goLiveAt;
  const freshLaunch = live && Date.now() - new Date(v.settings.goLiveAt!).getTime() < CERTIFICATE_DAYS * 86_400_000;
  return (
    <div className="mt-5 space-y-4 sm:mt-8 sm:space-y-5">
      <ScheduleStatusCard v={v} />
      {freshLaunch ? <LaunchCertificate v={v} businessName={businessName} /> : null}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <FrontDeskCard v={v} />
        <PipelineCard v={v} />
      </div>
    </div>
  );
}

// ───────────────────────────── Program tab ─────────────────────────────

const FILING: Record<FilingStatus, string> = { not_filed: 'Not filed yet', pending: 'Waiting on the carriers', approved: 'Approved', rejected: 'Needs a fix (we are on it)' };

const today = () => new Date().toISOString().slice(0, 10);

/**
 * One phase on the Program tab. Done: one line with a check, opens to its steps
 * and cards. On now: its cards in full. Coming: the name and start date, opens to
 * the steps planned; its cards appear when it starts.
 */
function PhaseBlock({ m, n, children }: { m: Milestone; n: number; children: ReactNode }) {
  const on = m.current || ((m.status === 'in_progress' || m.status === 'pending') && m.from <= today());
  if (on) {
    return (
      <section id={`phase-${m.key}`} className="scroll-mt-6">
        <div className="mb-3 mt-8 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/30">{n}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-lg font-bold leading-snug tracking-tight text-neutral-950">{m.title}</h3>
              <StatusPill status={m.status} />
            </div>
            <p className="text-xs text-neutral-500">
              {shortDate(m.from)}–{shortDate(m.to)} · {m.metric}
            </p>
          </div>
        </div>
        <details className="group mb-4 rounded-xl bg-white/70 px-4 py-2 ring-1 ring-neutral-200/70">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-neutral-600 [&::-webkit-details-marker]:hidden">
            {m.steps.filter((x) => x.state === 'done').length} of {m.steps.length} steps done <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-1 divide-y divide-neutral-100/70">
            {m.steps.map((x) => (
              <StepRow key={x.key} step={x} />
            ))}
          </ul>
        </details>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }
  const done = m.status === 'completed';
  return (
    <details id={`phase-${m.key}`} className="group mt-3 scroll-mt-6 rounded-2xl bg-white shadow-[0_2px_12px_-2px_rgba(16,24,40,0.06)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
          {done ? <Check size={14} className="stroke-[3]" /> : n}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-950">
          {m.title}
          <span className="font-normal text-neutral-500">{done ? ` · ${shortDate(m.from)}–${shortDate(m.to)}` : `, starts ${shortDate(m.from)}`}</span>
        </p>
        <ChevronDown size={14} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-neutral-100 px-4 pb-4 pt-2 sm:px-6">
        <p className="text-xs text-neutral-500">{done ? m.metric : m.summary}</p>
        <ul className="mt-1 divide-y divide-neutral-100/70">
          {m.steps.map((x) => (
            <StepRow key={x.key} step={x} />
          ))}
        </ul>
        {done ? <div className="mt-3 space-y-4">{children}</div> : null}
      </div>
    </details>
  );
}

export function ProgramTab({
  v,
  api,
  tier,
  businessName,
  ranking,
  upgradeRequestedAt,
  preview,
}: {
  v: ProofV2View;
  api: string | null;
  tier: OnboardingTier;
  businessName: string;
  ranking: RankingData | null;
  upgradeRequestedAt: string | null;
  preview: boolean;
}) {
  const s = v.settings;
  const st = v.staging;
  const organicMonths = Object.entries(s.organic ?? {}).sort(([a], [b]) => (a < b ? -1 : 1));
  const firstImp = organicMonths.find(([, o]) => o.impressions != null)?.[1].impressions ?? null;
  const lastOrganic = [...organicMonths].reverse().find(([, o]) => o.impressions != null)?.[1] ?? null;
  const pagesIndexed = s.indexedOverride ? s.indexedOverride.indexed : v.pages.filter((p) => p.indexed).length;
  const pagesTotal = s.indexedOverride ? s.indexedOverride.total : v.pages.length;
  const published = v.pages.filter((p) => p.status === 'published').length;
  const pipelineTotal = v.pipeline.totals.anyValue ? (v.pipeline.totals.dbrDollars ?? 0) + (v.pipeline.totals.webDollars ?? 0) : null;
  const rankPoints = (ranking?.points ?? []).filter((p) => p.rank != null);
  const status = scheduleStatus(v.milestones);

  const cards: Record<Milestone['key'], ReactNode> = {
    p1: (
      <Card>
        <Head icon={PhoneCall} title={v.line ? `Your tracked number: ${formatPhone(v.line.number)}` : 'Your tracked number'} sub="Missed calls get a text within 30 seconds" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Number" value={v.line ? 'Live' : 'Coming'} sub={v.line ? 'forwards to your front desk' : startsLine('p1', v)} />
          <Stat label="Business registered" value={v.line?.smsReady ? 'Approved' : FILING[s.a2p?.brand ?? 'not_filed']} />
          <Stat label="Texting approved by carriers" value={v.line?.smsReady ? 'Approved' : FILING[s.a2p?.campaign ?? 'not_filed']} />
          <Stat
            label="Auto-text under 30s"
            value={v.mcat.textedBack ? `${v.mcat.under30}/${v.mcat.textedBack}` : '—'}
            sub={v.mcat.medianSeconds != null ? `median ${v.mcat.medianSeconds}s` : v.line?.smsReady ? 'no missed calls yet' : 'starts once texting is approved'}
          />
        </div>
      </Card>
    ),
    p2: (
      <>
        <Card>
          <Head icon={MapPin} title="Layout approval" sub="Drop a pin anywhere you want a change, then approve" />
          <div className="mt-3">
            <ReviewApproval stage="wireframe" item={s.reviews?.wireframe} pins={v.pins} api={api} />
          </div>
        </Card>
        <Card>
          <Head icon={MapPin} title="Copy approval" sub="The words on every page, pinned and approved the same way" />
          <div className="mt-3">
            <ReviewApproval stage="copy" item={s.reviews?.copy} pins={v.pins} api={api} />
          </div>
        </Card>
        <Card>
          <Head
            icon={CalendarCheck}
            title="Preview of your new site"
            sub={
              st.phase === 'in_review'
                ? `Open for 48 hours, until ${when(st.endsAt!)}`
                : st.phase === 'changes_requested'
                  ? 'You asked for changes; we reopen it when they are made'
                  : st.phase === 'approved'
                    ? `Approved ${shortDate(s.staging!.approvedAt!)}`
                    : st.phase === 'window_closed'
                      ? 'The 48 hours passed with no changes asked for'
                      : `Your 48-hour review opens on ${shortDate(v.milestones.find((m) => m.key === 'p2')!.steps.find((x) => x.key === 'p2-staging')!.date)}`
            }
          />
          {st.phase !== 'not_ready' ? (
            <div className="mt-3">
              {s.staging?.imageUrl ? <PinBoard stage="staging" imageUrl={s.staging.imageUrl} pins={v.pins} api={api} locked={st.phase !== 'in_review'} /> : null}
              <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                {s.staging?.url ? (
                  <a href={s.staging.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    Open the preview <ExternalLink size={13} />
                  </a>
                ) : null}
                {s.staging?.callAt ? (
                  <span className="text-neutral-700">Review call: {when(s.staging.callAt)}</span>
                ) : (
                  <a href={v.bookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    Book a call to walk through it <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {st.phase === 'changes_requested' && s.staging?.changesNote ? <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">You asked: {s.staging.changesNote}</p> : null}
              <StagingActions api={api} open={st.phase === 'in_review'} />
            </div>
          ) : null}
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
            <li className="rounded-lg bg-neutral-50 px-3 py-2">Domain switch: {s.dnsCutoverAt ? shortDate(s.dnsCutoverAt) : 'after your approval'}</li>
            <li className="rounded-lg bg-neutral-50 px-3 py-2">Launch: {s.goLiveAt ? shortDate(s.goLiveAt) : 'right after the switch'}</li>
          </ul>
        </Card>
        <LaunchCertificate v={v} businessName={businessName} />
      </>
    ),
    p3: (
      <>
        <Card>
          <Head icon={CalendarCheck} title="Win-back texts to past patients and clients" sub="3 texts over 7 days from your number; replies land in your Leads inbox" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="People on the list" value={String(v.dbr.imported)} sub={v.dbr.imported ? `${v.dbr.consented} with consent confirmed` : startsLine('p3', v)} />
            <Stat label="Status" value={v.dbr.status === 'none' ? 'Not started' : v.dbr.status === 'running' ? 'Sending' : v.dbr.status === 'done' ? 'Finished' : 'Stopped'} sub={v.dbr.startedAt ? `started ${shortDate(v.dbr.startedAt)}` : undefined} />
            <Stat label="Texts sent" value={String(v.dbr.sent)} sub={v.dbr.pending ? `${v.dbr.pending} still scheduled` : undefined} />
            <Stat label="Replied (texts stopped)" value={String(v.dbr.replied)} />
          </div>
        </Card>
        <PipelineCard v={v} full />
      </>
    ),
    p4: (
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <Head icon={Star} title="Review requests" sub="A text 2 hours after you mark a visit completed" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Requests sent" value={String(v.reviews.sent)} sub={v.reviews.enabled ? 'on' : startsLine('p4', v)} />
            <Stat label="New Google reviews" value={v.reviews.newReviews != null ? `${v.reviews.newReviews >= 0 ? '+' : ''}${v.reviews.newReviews}` : '—'} sub={v.reviews.reviews != null ? `${v.reviews.reviews} total${v.reviews.rating ? ` · ${v.reviews.rating}★` : ''}` : 'counted from our review scans'} />
          </div>
        </Card>
        <Card>
          <Head icon={MapPin} title={`Listed on ${v.nap.synced} of ${v.nap.total} directories`} sub="Same name, address and phone on every one" />
          <div className="mt-3 h-2 rounded-full bg-neutral-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${v.nap.total ? (v.nap.synced / v.nap.total) * 100 : 0}%` }} />
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-blue-600">See all directories</summary>
            <ul className="mt-2 grid max-h-56 grid-cols-1 gap-x-4 overflow-y-auto text-xs sm:grid-cols-2">
              {NAP_DIRECTORIES.filter((d) => (s.nap?.[d.key] ?? 'todo') !== 'na').map((d) => {
                const st2 = s.nap?.[d.key] ?? 'todo';
                return (
                  <li key={d.key} className="flex justify-between gap-2 border-b border-neutral-100 py-1">
                    <span className="text-neutral-700">{d.name}</span>
                    <span className={st2 === 'synced' ? 'font-semibold text-emerald-700' : st2 === 'submitted' ? 'text-blue-700' : 'text-neutral-400'}>{st2 === 'synced' ? 'Listed' : st2 === 'submitted' ? 'Submitted' : 'To do'}</span>
                  </li>
                );
              })}
            </ul>
          </details>
        </Card>
      </div>
    ),
    p5: (
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <Head
            icon={Search}
            title={pagesTotal ? `${pagesIndexed} of ${pagesTotal} pages on Google` : 'Pages for your locations and services'}
            sub={pagesTotal ? `${published} published · ${s.sitemapSubmittedAt ? `Google told ${shortDate(s.sitemapSubmittedAt)}` : 'Google not told yet'}` : startsLine('p5', v)}
          />
          {v.pages.length ? (
            <ul className="mt-3 max-h-60 divide-y divide-neutral-100 overflow-y-auto text-sm">
              {v.pages.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-neutral-800">{p.title}</span>
                  <span className={`shrink-0 text-xs font-semibold ${p.indexed ? 'text-emerald-700' : p.status === 'published' ? 'text-blue-700' : 'text-neutral-400'}`}>{p.indexed ? 'On Google' : p.status === 'published' ? 'Published' : 'Writing'}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
        <Card>
          <Head icon={TrendingUp} title="Your search report" sub={s.harvestPublishedAt ? `Published ${shortDate(s.harvestPublishedAt)}` : `Month 5 · ${shortDate(v.milestones.find((m) => m.key === 'p5')!.to)}`} />
          {organicMonths.length || rankPoints.length ? (
            <div className="mt-3 space-y-3">
              {rankPoints.length ? (
                <p className="text-sm text-neutral-700">
                  Map rank for “{ranking!.keyword}”: {rankPoints.slice(-5).map((p) => `#${p.rank}`).join(' → ')}
                </p>
              ) : null}
              {organicMonths.length ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-neutral-500">
                      <th className="py-1 font-medium">Month</th>
                      <th className="py-1 text-right font-medium">Seen</th>
                      <th className="py-1 text-right font-medium">Clicks</th>
                      <th className="py-1 text-right font-medium">Calls</th>
                      <th className="py-1 text-right font-medium">Forms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {organicMonths.slice(-6).map(([m, o]) => (
                      <tr key={m}>
                        <td className="py-1 text-neutral-700">{monthLabel(m).slice(0, 3)}</td>
                        <td className="py-1 text-right font-semibold">{o.impressions?.toLocaleString('en-US') ?? '—'}</td>
                        <td className="py-1 text-right">{o.clicks ?? '—'}</td>
                        <td className="py-1 text-right">{o.calls ?? '—'}</td>
                        <td className="py-1 text-right">{o.forms ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              <p className="text-[11px] text-neutral-500">“Seen” is how often you showed up in Google search, from Google Search Console, entered by Axeon each month.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Your map rank, search clicks, and the calls and forms that came from search. {startsLine('p5', v)}.</p>
          )}
        </Card>
      </div>
    ),
    p6: (
      <Card>
        <Head icon={Award} title="Six-month review" sub={s.sabr?.completedAt ? `Reviewed ${shortDate(s.sabr.completedAt)}` : s.sabr?.scheduledAt ? `30 minutes on ${longDate(s.sabr.scheduledAt)}` : `30 minutes around ${longDate(v.milestones.find((m) => m.key === 'p6')!.to)}`} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Recovered pipeline" value={pipelineTotal != null ? money(pipelineTotal) : String(v.pipeline.totals.dbr + v.pipeline.totals.web)} sub={pipelineTotal != null ? 'estimated from your values' : 'bookings so far'} />
          <Stat label="Missed calls rescued" value={String(v.mcat.rescued)} sub={`of ${v.mcat.missed} missed since day 1`} />
          <Stat label="New reviews" value={v.reviews.newReviews != null ? `${v.reviews.newReviews >= 0 ? '+' : ''}${v.reviews.newReviews}` : '—'} />
          <Stat
            label="Seen in Google search"
            value={lastOrganic?.impressions != null ? lastOrganic.impressions.toLocaleString('en-US') : '—'}
            sub={firstImp && lastOrganic?.impressions != null && firstImp !== lastOrganic.impressions ? `${Math.round(((lastOrganic.impressions - firstImp) / firstImp) * 100)}% since the first month` : lastOrganic?.topKeywords?.length ? lastOrganic.topKeywords.join(', ') : 'tracked from month 3'}
          />
        </div>
        {lastOrganic?.topKeywords?.length ? <p className="mt-2 text-xs text-neutral-600">Top searches: {lastOrganic.topKeywords.join(' · ')}</p> : null}
        {!s.sabr?.scheduledAt && !s.sabr?.completedAt ? (
          <a href={v.bookUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
            Book your 30-minute review <ExternalLink size={13} />
          </a>
        ) : null}
        {tier === 'axeoncore' ? (
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">Next: AxeonGROWTH, ${GROWTH_UPGRADE_PRICE.toLocaleString('en-US')}/mo</p>
            <p className="mt-1 text-sm text-blue-900">Ads with every dollar next to the patients it brought in, an AI receptionist on every call, and a monthly strategy call. We walk through it at your review.</p>
            <div className="mt-3">
              <UpgradeButton tier="axeongrowth" label="Ask about AxeonGROWTH" requestedAt={upgradeRequestedAt} preview={preview} />
            </div>
          </div>
        ) : null}
      </Card>
    ),
  };

  const frontDesk = (
    <>
      <Head icon={Inbox} title="Your front-desk routine" sub={`${v.frontDesk.waiting} missed-call thread${v.frontDesk.waiting === 1 ? '' : 's'} waiting · ${v.frontDesk.week.booked} booked this week`} />
      <ol className="mt-3 space-y-2">
        {FRONT_DESK_ROUTINE.map((r) => (
          <li key={r.key} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3">
            <span className="shrink-0 text-xs font-semibold text-neutral-500 sm:w-36">{r.when}</span>
            <span className="text-neutral-800">{r.what}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <FrontDeskSignoff api={api} signedOffAt={v.frontDesk.signedOffAt} signedOffBy={v.frontDesk.signedOffBy} />
      </div>
      <div className="mt-4 border-t border-neutral-100 pt-4">
        <p className="mb-2 text-xs font-semibold text-neutral-600">Practice manager (weekly summary + the monthly link)</p>
        <ManagerForm api={api} manager={s.manager} />
      </div>
      {v.frontDesk.access.length ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold text-neutral-600">Monthly summary opens</p>
          <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
            {v.frontDesk.access.map((a, i) => (
              <li key={i}>
                {monthLabel(a.month)} summary · {a.recipient === 'owner' ? 'owner' : 'practice manager'} · {when(a.at)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Your first 180 days</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Day {Math.min(v.day, 180)} of 180 · {status.tone === 'done' ? 'all six phases done' : `phase ${status.n} of 6`}
      </p>

      {v.milestones.map((m, i) => (
        <PhaseBlock key={m.key} m={m} n={i + 1}>
          {cards[m.key]}
        </PhaseBlock>
      ))}

      {s.goLiveAt ? (
        <section id="front-desk" className="scroll-mt-6">
          <p className="mb-2 mt-8 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Every day · front desk</p>
          <Card>{frontDesk}</Card>
        </section>
      ) : (
        <details id="front-desk" className="group mt-3 scroll-mt-6 rounded-2xl bg-white shadow-[0_2px_12px_-2px_rgba(16,24,40,0.06)]">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <Inbox size={14} />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-950">
              Your front-desk routine<span className="font-normal text-neutral-500">, starts at launch</span>
            </p>
            <ChevronDown size={14} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-neutral-100 px-4 pb-4 pt-3 sm:px-6">{frontDesk}</div>
        </details>
      )}
    </div>
  );
}
