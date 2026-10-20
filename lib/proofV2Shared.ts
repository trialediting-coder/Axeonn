// lib/proofV2Shared.ts
// AxeonPROOF v2: the 180-day Value-Staged Delivery program ("Axeon Studio -
// Value-Staged Delivery Protocol & 180-Day Client Retention Cadence"), for new
// AxeonCORE / AxeonGROWTH clients only (lib/proofVersion.ts). Pure: no database,
// no Node imports, so the dashboard, the admin panel and the tests share it.
//
// The delivery schedule itself (phases, steps, days, client wording) lives in
// data/deliverySchedule.ts; this file derives where a client is on it.
//   - Every client runs the same schedule from their start date: each step has a
//     planned date shown from day 1, the phase on now is highlighted, finished
//     steps show the date done. The admin can move the start date or one step.
//   - Numbers (missed calls rescued, bookings, reviews, indexed pages) come from
//     real rows or from what the admin entered; before there are any, the card
//     says when that part of the schedule starts.
//   - The 48-hour staging review starts when Axeon marks staging ready; the
//     client can approve sooner or ask for changes, and go-live waits for it.
//   - Location / procedure pages pass a uniqueness gate before they publish.
//   - The upgrade conversation is AxeonGROWTH at $1,999/mo.
import { DELIVERY_SCHEDULE, type ScheduleAuto, type ScheduleStep } from '@/data/deliverySchedule';

export const GROWTH_UPGRADE_PRICE = 1999;
export const CORE_PRICE = 799;

// ───────────────────────────── Settings (onboardings.proof_v2) ─────────────────────────────

export const PHASE_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;
export type PhaseKey = (typeof PHASE_KEYS)[number];
export const PHASE_STATUSES = ['completed', 'in_progress', 'pending', 'scheduled'] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];
export const FILING_STATUSES = ['not_filed', 'pending', 'approved', 'rejected'] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];
export const NAP_STATUSES = ['todo', 'submitted', 'synced', 'na'] as const;
export type NapStatus = (typeof NAP_STATUSES)[number];
export const REVIEW_STAGES = ['wireframe', 'copy'] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number];
export const PIN_STAGES = ['wireframe', 'copy', 'staging'] as const;
export type PinStage = (typeof PIN_STAGES)[number];

export interface ReviewItem {
  /** A screenshot of the page (pins are dropped on it). */
  imageUrl?: string;
  /** Where the live draft is. */
  url?: string;
  sharedAt?: string;
  approvedAt?: string;
}

export interface StagingState {
  url?: string;
  imageUrl?: string;
  /** Axeon marked the staging site ready: the 48-hour review starts here. */
  readyAt?: string;
  approvedAt?: string;
  changesRequestedAt?: string;
  changesNote?: string;
  /** The staging review call, when one is booked. */
  callAt?: string;
}

export interface OrganicMonth {
  impressions?: number;
  clicks?: number;
  calls?: number;
  forms?: number;
  topKeywords?: string[];
}

export interface ProofV2Settings {
  /** The admin moved the client's day 1 (YYYY-MM-DD). */
  startAt?: string;
  /** Per step: marked done in the admin, a moved date, a note. Keys from data/deliverySchedule.ts. */
  steps?: Record<string, { doneAt?: string; date?: string; note?: string }>;
  phases?: Partial<Record<PhaseKey, { status?: PhaseStatus; note?: string }>>;
  a2p?: { brand?: FilingStatus; campaign?: FilingStatus; filedAt?: string; approvedAt?: string };
  reviews?: Partial<Record<ReviewStage, ReviewItem>>;
  staging?: StagingState;
  dnsCutoverAt?: string;
  goLiveAt?: string;
  /** What is live, for the Launch Certificate ("Website, tracked phone line, missed-call text-back"). */
  liveItems?: string[];
  certificateSentAt?: string;
  nap?: Record<string, NapStatus>;
  /** First directory touched, and the day every one was synced. */
  napStartedAt?: string;
  napDoneAt?: string;
  sitemapSubmittedAt?: string;
  /** Pages Google shows as indexed when there is no per-page record (Search Console count). */
  indexedOverride?: { indexed: number; total: number; at: string };
  organic?: Record<string, OrganicMonth>;
  harvestPublishedAt?: string;
  /** scheduledAt = the review's date; bookedAt = when it was booked. */
  sabr?: { scheduledAt?: string; bookedAt?: string; completedAt?: string };
  manager?: { name?: string; email?: string; phone?: string };
  frontDesk?: { signedOffAt?: string; signedOffBy?: string };
  /** Dollar value of one booked appointment, by pipeline key ("contact:12", "booking:40"). */
  bookingValues?: Record<string, number>;
  summaries?: { lastMonth?: string; lastWeek?: string };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Whatever is stored, read safely: unknown keys and bad shapes are dropped. */
export function readSettings(raw: unknown): ProofV2Settings {
  return isObj(raw) ? (raw as ProofV2Settings) : {};
}

// ───────────────────────────── The delivery schedule ─────────────────────────────

export const PHASES = DELIVERY_SCHEDULE;
export const phaseDef = (key: PhaseKey) => DELIVERY_SCHEDULE.find((p) => p.key === key)!;

const DAY_MS = 86_400_000;
const parseDay = (iso: string) => Date.parse(iso.length === 10 ? `${iso}T12:00:00Z` : iso);

/** Program day for `now`, day 1 = the start date. */
export function programDay(startAt: string, now: Date): number {
  const start = parseDay(startAt);
  if (!Number.isFinite(start)) return 1;
  return Math.max(1, Math.floor((now.getTime() - start) / DAY_MS) + 1);
}

/** The calendar date a program day falls on (YYYY-MM-DD). */
export function dateOfDay(startAt: string, day: number): string {
  return new Date(parseDay(startAt) + (day - 1) * DAY_MS).toISOString().slice(0, 10);
}

/** Facts the tracker reads: each one from a real row, or set by the admin. */
export interface MilestoneFacts {
  startAt: string;
  settings: ProofV2Settings;
  /** When each automatic step's event happened (lib/proofV2.ts autoDone). */
  autoDone: Partial<Record<ScheduleAuto, string>>;
  line: { number: string; smsReady: boolean; textBackOn: boolean } | null;
  /** Missed calls and how fast the auto-text went (phone_calls). */
  mcat: { missed: number; textedBack: number; under30: number; medianSeconds: number | null };
  dbr: { imported: number; status: 'none' | 'running' | 'done' | 'stopped'; sent: number; booked: number; pipelineDollars: number | null };
  reviewEngine: { enabled: boolean; sent: number; newReviews: number | null };
  nap: { synced: number; total: number };
  pages: { planned: number; published: number; indexed: number };
  openPins: number;
}

export type StepState = 'done' | 'current' | 'upcoming' | 'waiting';

export interface StepView {
  key: string;
  title: string;
  client: string;
  /** Planned date (YYYY-MM-DD), after any admin move. */
  date: string;
  shifted: boolean;
  state: StepState;
  /** The day the client sees it done (YYYY-MM-DD); null until then. */
  doneDate: string | null;
  /** For the admin: when it was actually done (in the admin or by a live event), possibly before the client sees it. */
  actualDoneAt: string | null;
  note: string | null;
}

export interface Milestone {
  key: PhaseKey;
  title: string;
  days: string;
  summary: string;
  /** First and last planned date of the phase. */
  from: string;
  to: string;
  status: PhaseStatus;
  /** One real number or state for the phase. */
  metric: string;
  note: string | null;
  overridden: boolean;
  /** The phase on now (highlighted). */
  current: boolean;
  steps: StepView[];
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
export const shortDate = (iso: string) => new Date(parseDay(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayOnly = (iso: string) => new Date(parseDay(iso)).toISOString().slice(0, 10);
const todayOf = (now: Date) => now.toISOString().slice(0, 10);

/** One step on the schedule: its date, and whether the client sees it done. */
export function stepView(step: ScheduleStep, facts: MilestoneFacts, now: Date): StepView {
  const own = facts.settings.steps?.[step.key];
  const planned = own?.date && /^\d{4}-\d{2}-\d{2}$/.test(own.date) ? own.date : dateOfDay(facts.startAt, step.day);
  const actual = own?.doneAt ?? (step.auto ? (facts.autoDone[step.auto] ?? null) : null);
  // Axeon's own work is released on its scheduled date; a client action or live event shows the day it happens.
  const shown = actual ? (step.release === 'schedule' && dayOnly(actual) < planned ? planned : dayOnly(actual)) : null;
  const today = todayOf(now);
  const doneDate = shown && shown <= today ? shown : null;
  const state: StepState = doneDate ? 'done' : planned > today ? 'upcoming' : planned === today ? 'current' : 'waiting';
  return { key: step.key, title: step.title, client: step.client, date: planned, shifted: !!own?.date, state, doneDate, actualDoneAt: actual, note: own?.note?.trim() || null };
}

function phaseMetric(key: PhaseKey, facts: MilestoneFacts, now: Date): string {
  const s = facts.settings;
  switch (key) {
    case 'p1': {
      const line = facts.line;
      if (!line) return s.a2p?.brand || s.a2p?.campaign ? 'Texting registration filed' : 'Number not set up yet';
      if (!line.smsReady) return `Number live · texting ${s.a2p?.campaign === 'pending' || s.a2p?.brand === 'pending' ? 'awaiting carrier approval' : 'registration next'}`;
      if (facts.mcat.textedBack) return `${facts.mcat.under30}/${facts.mcat.textedBack} missed calls auto-texted in under 30s`;
      return line.textBackOn ? 'Live: missed calls get an auto-text' : 'Texting approved; auto-text off';
    }
    case 'p2': {
      if (s.goLiveAt) return `Live since ${shortDate(s.goLiveAt)}`;
      const st = stagingState(s.staging, now);
      if (st.phase === 'in_review') return `Staging review open until ${new Date(st.endsAt!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      if (st.phase === 'changes_requested') return 'Your staging changes are being made';
      if (st.phase === 'approved' || st.phase === 'window_closed') return s.dnsCutoverAt ? 'DNS switched, launching' : 'Staging approved, DNS cutover next';
      const waiting = REVIEW_STAGES.filter((k) => s.reviews?.[k]?.sharedAt && !s.reviews?.[k]?.approvedAt);
      if (waiting.length) return `${waiting.map((k) => (k === 'wireframe' ? 'Layout' : 'Copy')).join(' and ')} ready for your approval${facts.openPins ? ` · ${facts.openPins} open pin${facts.openPins === 1 ? '' : 's'}` : ''}`;
      return REVIEW_STAGES.some((k) => s.reviews?.[k]?.approvedAt) ? 'Design approved, building' : 'Layout draft coming';
    }
    case 'p3': {
      const d = facts.dbr;
      if (d.booked) return `${d.booked} booked${d.pipelineDollars != null ? ` · ${money(d.pipelineDollars)} pipeline (est.)` : ''}`;
      if (d.status !== 'none') return `${d.sent} texts sent to ${d.imported} past ${d.imported === 1 ? 'customer' : 'customers'}`;
      return d.imported ? `${d.imported} records imported` : 'Customer list not imported yet';
    }
    case 'p4': {
      const r = facts.reviewEngine;
      const parts: string[] = [];
      if (r.enabled || r.sent) parts.push(`${r.sent} review request${r.sent === 1 ? '' : 's'} sent${r.newReviews != null ? ` · ${r.newReviews >= 0 ? '+' : ''}${r.newReviews} reviews` : ''}`);
      parts.push(`${facts.nap.synced}/${facts.nap.total} listings synced`);
      return parts.join(' · ');
    }
    case 'p5': {
      const o = s.indexedOverride;
      const indexed = o ? o.indexed : facts.pages.indexed;
      const total = o ? o.total : facts.pages.planned;
      return total > 0 ? `${indexed}/${total} pages indexed${facts.pages.published < facts.pages.planned ? ` · ${facts.pages.published} published` : ''}` : 'Page plan not started';
    }
    case 'p6': {
      const sabr = s.sabr ?? {};
      if (sabr.completedAt) return `Reviewed ${shortDate(sabr.completedAt)}`;
      if (sabr.scheduledAt) return `Review on ${shortDate(sabr.scheduledAt)}`;
      return `Planned for ${shortDate(dateOfDay(facts.startAt, 180))}`;
    }
  }
}

/** The six phases on the client's schedule, every step's date, and the phase that is on now. */
export function deriveMilestones(facts: MilestoneFacts, now: Date = new Date()): Milestone[] {
  const today = todayOf(now);
  const out: Milestone[] = DELIVERY_SCHEDULE.map((def) => {
    const steps = def.steps.map((st) => stepView(st, facts, now));
    const dates = steps.map((x) => x.date);
    const from = [dateOfDay(facts.startAt, def.from), ...dates].sort()[0];
    const to = [dateOfDay(facts.startAt, def.to), ...dates].sort().at(-1)!;
    const allDone = steps.every((x) => x.state === 'done');
    const anyDone = steps.some((x) => x.state === 'done');
    let status: PhaseStatus = allDone ? 'completed' : today < from && !anyDone ? 'scheduled' : today > to && !anyDone ? 'pending' : 'in_progress';
    const o = facts.settings.phases?.[def.key];
    const overridden = !!o?.status && (PHASE_STATUSES as readonly string[]).includes(o.status);
    if (overridden) status = o!.status!;
    return {
      key: def.key,
      title: def.title,
      days: def.days,
      summary: def.summary,
      from,
      to,
      status,
      metric: status === 'scheduled' && def.key !== 'p6' ? `Starts ${shortDate(from)}` : phaseMetric(def.key, facts, now),
      note: o?.note?.trim() || null,
      overridden,
      current: false,
      steps,
    };
  });
  // The phase on now: the first unfinished one whose window has started, else the next one coming.
  const current = out.find((m) => m.status !== 'completed' && m.from <= today) ?? out.find((m) => m.status !== 'completed');
  if (current) current.current = true;
  return out;
}

// ───────────────────────────── Staging review gate ─────────────────────────────

export const STAGING_WINDOW_HOURS = 48;

export type StagingPhase = 'not_ready' | 'in_review' | 'changes_requested' | 'approved' | 'window_closed';

/** Where the 48-hour staging review stands. A change request after `readyAt` holds the window until Axeon marks staging ready again. */
export function stagingState(staging: StagingState | undefined, now: Date = new Date()): { phase: StagingPhase; endsAt: string | null } {
  if (!staging?.readyAt) return { phase: 'not_ready', endsAt: null };
  const ready = Date.parse(staging.readyAt);
  const endsAt = new Date(ready + STAGING_WINDOW_HOURS * 3_600_000).toISOString();
  if (staging.approvedAt && Date.parse(staging.approvedAt) >= ready) return { phase: 'approved', endsAt };
  if (staging.changesRequestedAt && Date.parse(staging.changesRequestedAt) >= ready) return { phase: 'changes_requested', endsAt };
  if (now.getTime() >= Date.parse(endsAt)) return { phase: 'window_closed', endsAt };
  return { phase: 'in_review', endsAt };
}

/** Can the admin push go-live? Only after the client approved staging (or the 48 hours ran out) and DNS is switched. */
export function canGoLive(settings: ProofV2Settings, now: Date = new Date()): { ok: boolean; reason: string | null } {
  if (settings.goLiveAt) return { ok: false, reason: 'Already live.' };
  const st = stagingState(settings.staging, now);
  if (st.phase === 'not_ready') return { ok: false, reason: 'Mark staging ready first; the client gets 48 hours to review.' };
  if (st.phase === 'changes_requested') return { ok: false, reason: 'The client asked for changes. Make them, then mark staging ready again.' };
  if (st.phase === 'in_review') return { ok: false, reason: `The client's review window is open until ${new Date(st.endsAt!).toLocaleString('en-US')}, unless they approve sooner.` };
  if (!settings.dnsCutoverAt) return { ok: false, reason: 'Record the DNS cutover first.' };
  return { ok: true, reason: null };
}

// ───────────────────────────── Citations (NAP sync) ─────────────────────────────

/** 40 directories. Ones that do not fit the business (a law directory for a dental practice) are marked n/a and leave the count. */
export const NAP_DIRECTORIES: ReadonlyArray<{ key: string; name: string; group: 'core' | 'data' | 'general' | 'health' | 'legal' }> = [
  { key: 'google', name: 'Google Business Profile', group: 'core' },
  { key: 'bing', name: 'Bing Places', group: 'core' },
  { key: 'apple', name: 'Apple Business Connect', group: 'core' },
  { key: 'facebook', name: 'Facebook', group: 'core' },
  { key: 'yelp', name: 'Yelp', group: 'core' },
  { key: 'bbb', name: 'Better Business Bureau', group: 'core' },
  { key: 'nextdoor', name: 'Nextdoor', group: 'core' },
  { key: 'linkedin', name: 'LinkedIn', group: 'core' },
  { key: 'instagram', name: 'Instagram', group: 'core' },
  { key: 'data_axle', name: 'Data Axle', group: 'data' },
  { key: 'localeze', name: 'Neustar Localeze', group: 'data' },
  { key: 'foursquare', name: 'Foursquare', group: 'data' },
  { key: 'here', name: 'HERE', group: 'data' },
  { key: 'tomtom', name: 'TomTom', group: 'data' },
  { key: 'waze', name: 'Waze', group: 'data' },
  { key: 'mapquest', name: 'MapQuest', group: 'general' },
  { key: 'yellowpages', name: 'Yellow Pages', group: 'general' },
  { key: 'superpages', name: 'Superpages', group: 'general' },
  { key: 'manta', name: 'Manta', group: 'general' },
  { key: 'citysearch', name: 'Citysearch', group: 'general' },
  { key: 'merchantcircle', name: 'MerchantCircle', group: 'general' },
  { key: 'hotfrog', name: 'Hotfrog', group: 'general' },
  { key: 'brownbook', name: 'Brownbook', group: 'general' },
  { key: 'ezlocal', name: 'EZlocal', group: 'general' },
  { key: 'chamberofcommerce', name: 'ChamberofCommerce.com', group: 'general' },
  { key: 'local_com', name: 'Local.com', group: 'general' },
  { key: 'showmelocal', name: 'ShowMeLocal', group: 'general' },
  { key: 'cylex', name: 'Cylex', group: 'general' },
  { key: 'n49', name: 'n49', group: 'general' },
  { key: 'alignable', name: 'Alignable', group: 'general' },
  { key: 'dexknows', name: 'DexKnows (Thryv)', group: 'general' },
  { key: 'ibegin', name: 'iBegin', group: 'general' },
  { key: 'healthgrades', name: 'Healthgrades', group: 'health' },
  { key: 'zocdoc', name: 'Zocdoc', group: 'health' },
  { key: 'vitals', name: 'Vitals', group: 'health' },
  { key: 'webmd', name: 'WebMD Care', group: 'health' },
  { key: 'avvo', name: 'Avvo', group: 'legal' },
  { key: 'justia', name: 'Justia', group: 'legal' },
  { key: 'findlaw', name: 'FindLaw', group: 'legal' },
  { key: 'lawyers_com', name: 'Lawyers.com', group: 'legal' },
];

export const isNapKey = (k: unknown): k is string => typeof k === 'string' && NAP_DIRECTORIES.some((d) => d.key === k);

/** "X/Y synced": directories marked n/a leave the total. */
export function napProgress(nap: Record<string, NapStatus> | undefined): { synced: number; submitted: number; total: number } {
  let synced = 0;
  let submitted = 0;
  let total = 0;
  for (const d of NAP_DIRECTORIES) {
    const st = nap?.[d.key] ?? 'todo';
    if (st === 'na') continue;
    total += 1;
    if (st === 'synced') synced += 1;
    else if (st === 'submitted') submitted += 1;
  }
  return { synced, submitted, total };
}

// ───────────────────────────── Page program uniqueness gate ─────────────────────────────

export const PAGE_MIN_INTRO_WORDS = 40;
export const PAGE_MIN_BODY_WORDS = 150;
/** Two pages sharing more than this share of their 3-word phrases are the same page with a new city name. */
export const PAGE_MAX_SIMILARITY = 0.4;

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const wordCount = (text: string) => words(text).length;

function shingles(text: string): Set<string> {
  const w = words(text);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i += 1) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}

/** Jaccard similarity of two texts' 3-word phrases, 0..1. */
export function textSimilarity(a: string, b: string): number {
  const A = shingles(a);
  const B = shingles(b);
  if (A.size === 0 || B.size === 0) return 0;
  let both = 0;
  for (const x of A) if (B.has(x)) both += 1;
  return both / (A.size + B.size - both);
}

export interface PageText {
  id: number;
  title: string;
  intro: string;
  body: string;
}

/** May this page be published? It needs its own intro and body, and must not be a near-copy of another page. */
export function pageGate(page: PageText, others: readonly PageText[]): { ok: boolean; problems: string[]; maxSimilarity: number; closest: string | null } {
  const problems: string[] = [];
  const introWords = wordCount(page.intro);
  const bodyWords = wordCount(page.body);
  if (introWords < PAGE_MIN_INTRO_WORDS) problems.push(`Intro has ${introWords} words; it needs at least ${PAGE_MIN_INTRO_WORDS} of its own.`);
  if (bodyWords < PAGE_MIN_BODY_WORDS) problems.push(`Body has ${bodyWords} words; it needs at least ${PAGE_MIN_BODY_WORDS}.`);
  let max = 0;
  let closest: string | null = null;
  const mine = `${page.intro}\n${page.body}`;
  for (const o of others) {
    if (o.id === page.id) continue;
    const sim = textSimilarity(mine, `${o.intro}\n${o.body}`);
    if (sim > max) {
      max = sim;
      closest = o.title;
    }
  }
  if (max > PAGE_MAX_SIMILARITY) problems.push(`${Math.round(max * 100)}% the same as "${closest}". Rewrite it for this page's area or procedure.`);
  return { ok: problems.length === 0, problems, maxSimilarity: Math.round(max * 100) / 100, closest };
}

// ───────────────────────────── DBR sprint ─────────────────────────────

export interface DbrStep {
  day: number;
  body: string;
}

export const DBR_STOP_LINE = 'Reply STOP to opt out.';

/** Three texts over seven days. Axeon edits the words per client before starting. */
export const DEFAULT_DBR_STEPS: readonly DbrStep[] = [
  { day: 0, body: "Hi {name}, it's {business}. It's been a while since your last visit. We have openings this month; reply here and we'll find you a time. Reply STOP to opt out." },
  { day: 3, body: 'Hi {name}, {business} again. Just checking in: want us to save you a spot? Reply with a day that works.' },
  { day: 7, body: "Last note from {business}, {name}. If now isn't the time, no problem. Reply any time and we'll get you scheduled." },
];

export function validateDbrSteps(raw: unknown): DbrStep[] {
  if (!Array.isArray(raw) || raw.length !== 3) throw new Error('The reactivation sprint is exactly 3 texts.');
  const steps = raw.map((r, i) => {
    const day = Number((r as DbrStep)?.day);
    const body = typeof (r as DbrStep)?.body === 'string' ? (r as DbrStep).body.trim() : '';
    if (!Number.isInteger(day) || day < 0 || day > 7) throw new Error(`Text ${i + 1}: the day must be 0 to 7.`);
    if (body.length < 20 || body.length > 320) throw new Error(`Text ${i + 1}: write 20 to 320 characters.`);
    return { day, body };
  });
  for (let i = 1; i < steps.length; i += 1) if (steps[i].day <= steps[i - 1].day) throw new Error('Each text must come on a later day than the one before.');
  if (!/reply stop/i.test(steps[0].body)) steps[0] = { ...steps[0], body: `${steps[0].body} ${DBR_STOP_LINE}` };
  return steps;
}

export function fillDbrText(body: string, vars: { name: string | null; business: string | null }): string {
  const name = vars.name?.trim().split(/\s+/)[0] ?? '';
  return body
    .replace(/\{name\}/g, name)
    .replace(/\{business\}/g, vars.business?.trim() || 'our office')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/^Hi ,/, 'Hi,')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ───────────────────────────── Local time and schedules ─────────────────────────────

/** Year, month, day, hour and weekday (0 = Sunday) of `now` in a time zone. */
export function localParts(now: Date, timeZone: string): { year: number; month: number; day: number; hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')), hour: Number(get('hour')) % 24, weekday };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The monthly executive summary goes on the 1st at 8:00 AM the client's time.
 * The cron runs hourly, so any run on the 1st from 8 AM on sends a month not yet
 * sent (a failed 8 AM run retries at 9). Returns the month the summary covers.
 */
export function monthlySummaryDue(now: Date, timeZone: string, lastSentMonth: string | undefined): string | null {
  const p = localParts(now, timeZone);
  if (p.day !== 1 || p.hour < 8) return null;
  const prev = p.month === 1 ? `${p.year - 1}-12` : `${p.year}-${pad(p.month - 1)}`;
  return lastSentMonth === prev ? null : prev;
}

/** The practice manager's weekly summary: Mondays from 8 AM local. Returns the Monday's date (the week key). */
export function weeklySummaryDue(now: Date, timeZone: string, lastSentWeek: string | undefined): string | null {
  const p = localParts(now, timeZone);
  if (p.weekday !== 1 || p.hour < 8) return null;
  const key = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return lastSentWeek === key ? null : key;
}

// ───────────────────────────── Pipeline ─────────────────────────────

export interface PipelineRow {
  key: string;
  source: 'dbr' | 'web';
  label: string;
  at: string;
  /** Dollars: the per-booking value when one was entered, else the client's average. Null = no value known. */
  value: number | null;
  valueBasis: 'entered' | 'average' | null;
}

export function pipelineTotals(rows: readonly PipelineRow[]): { dbr: number; web: number; dbrDollars: number | null; webDollars: number | null; anyValue: boolean } {
  const sum = (src: 'dbr' | 'web') => {
    const r = rows.filter((x) => x.source === src);
    const valued = r.filter((x) => x.value != null);
    return { count: r.length, dollars: valued.length ? valued.reduce((a, x) => a + (x.value ?? 0), 0) : null };
  };
  const d = sum('dbr');
  const w = sum('web');
  return { dbr: d.count, web: w.count, dbrDollars: d.dollars, webDollars: w.dollars, anyValue: d.dollars != null || w.dollars != null };
}

export function valueFor(key: string, entered: Record<string, number> | undefined, average: number | null): { value: number | null; basis: 'entered' | 'average' | null } {
  const v = entered?.[key];
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return { value: v, basis: 'entered' };
  if (average != null && average > 0) return { value: average, basis: 'average' };
  return { value: null, basis: null };
}

// ───────────────────────────── Front desk ─────────────────────────────

export const FRONT_DESK_ROUTINE: readonly { key: string; when: string; what: string }[] = [
  { key: 'inbox', when: 'Every day, 8:30 AM', what: 'Inbox zero: open every missed-call and text thread from overnight and reply or call back.' },
  { key: 'mark', when: 'Every day', what: 'Mark each lead Booked or Not a fit, so the numbers and the review requests stay right.' },
  { key: 'weekly', when: 'Every Monday', what: 'The practice manager reads the weekly summary email and checks nothing is left waiting.' },
  { key: 'monthly', when: 'The 1st of each month', what: 'The owner opens the monthly summary link (no password) and sees what the month produced.' },
];
