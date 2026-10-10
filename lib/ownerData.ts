// lib/ownerData.ts
// The owner's own view of every client's data, in one table (app/admin/data).
// Per client: plan and stage, this month and last month from the tracker,
// what the client marked, every survey answer in words, and the flags that
// want a call. Read live each time the page opens; nothing is stored here.
import { TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';
import { answerLabel, type FeedbackEntry, type FeedbackRating } from '@/lib/feedbackShared';
import { listFeedback } from '@/lib/feedback';
import { listOnboardings, type Onboarding } from '@/lib/onboarding';
import { listMonthlyReports, monthLabel, type MonthlyReport } from '@/lib/projects';
import { RAMP_REPORTS, reportNumber } from '@/lib/reportPlan';
import { effectiveCloseRate, getTrackingSettings, hasTraffic, lastEventAt, monthOf, monthTraffic, previousMonth } from '@/lib/siteStats';
import { QUIET_DAYS } from '@/lib/trackerHealth';
import type { TrafficSummary } from '@/lib/projectsShared';

export interface ClientAnswer {
  key: string;
  question: string;
  answer: string;
  attention: boolean;
  /** The report month it came with. */
  month: string;
}

export interface ClientDataRow {
  id: number;
  token: string;
  name: string;
  tier: OnboardingTier;
  plan: string;
  status: Onboarding['status'];
  /** 'setup' before the tracker sends anything; 'quiet' when it stopped; else 'live'. */
  stage: 'setup' | 'live' | 'quiet';
  /** Reports emailed so far, and whether the next one is still in the ramp. */
  reportsSent: number;
  nextReport: number;
  ramp: boolean;
  thisMonth: TrafficSummary | null;
  lastMonth: TrafficSummary | null;
  /** Leads the client marked, all time in the window the tracker keeps. */
  markedWon: number;
  markedLost: number;
  closeRate: number | null;
  /** The latest answer per question, newest first. */
  answers: ClientAnswer[];
  /** The last "was this report useful" tap. */
  lastRating: FeedbackRating | null;
  lastTapAt: string | null;
  /** Reports emailed that got any tap, over reports emailed. */
  taps: { answered: number; emailed: number };
  lastEventAt: string | null;
  flags: string[];
}

export interface OwnerOverview {
  month: string;
  previous: string;
  rows: ClientDataRow[];
  totals: {
    live: number;
    reachedOut: number;
    estimatedCustomers: number;
    /** Reports emailed across clients that got any tap. */
    tapRate: number | null;
    worth: { easily: number; even: number; notyet: number };
  };
}

/** Pure: newest answer per question, in words, from a client's feedback rows. */
export function latestAnswers(feedback: readonly FeedbackEntry[]): ClientAnswer[] {
  const seen = new Set<string>();
  const out: ClientAnswer[] = [];
  const rows = [...feedback].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const f of rows) {
    for (const [key, value] of Object.entries(f.answers)) {
      if (seen.has(key)) continue;
      const w = answerLabel(f.kind, key, value);
      if (!w) continue;
      seen.add(key);
      out.push({ key, question: w.question, answer: w.answer, attention: w.attention, month: f.month ?? '' });
    }
  }
  return out;
}

/** Pure: which emailed reports got any tap at all. */
export function tapCounts(reports: readonly Pick<MonthlyReport, 'month' | 'emailedAt'>[], feedback: readonly FeedbackEntry[]): { answered: number; emailed: number } {
  const emailed = reports.filter((r) => r.emailedAt).map((r) => r.month);
  const tapped = new Set(feedback.filter((f) => f.kind === 'report' && f.month && (f.rating || f.comment || Object.keys(f.answers).length)).map((f) => f.month));
  return { answered: emailed.filter((m) => tapped.has(m)).length, emailed: emailed.length };
}

/** The words a flag uses for an attention answer, by question. */
const ATTENTION_FLAGS: Record<string, string> = {
  job: 'No job from the site yet',
  pickup: 'Rarely picks up',
  worth: 'Not worth it yet',
  recommend: 'Would not recommend yet',
  jobs: 'No jobs this month',
  clear: 'Numbers confusing',
};

/** Pure: what wants a call, in plain words. */
export function clientFlags(row: Pick<ClientDataRow, 'stage' | 'answers' | 'closeRate' | 'markedWon' | 'markedLost' | 'lastRating'>): string[] {
  const flags: string[] = [];
  if (row.stage === 'quiet') flags.push('Tracker quiet');
  for (const a of row.answers) if (a.attention) flags.push(ATTENTION_FLAGS[a.key] ?? a.answer);
  if (row.lastRating === 'no') flags.push('Report not useful');
  const marked = row.markedWon + row.markedLost;
  if (row.closeRate != null && marked >= 10 && row.closeRate < 25) flags.push('Low close rate');
  return flags;
}

/** Pure: no events yet is setup; nothing for QUIET_DAYS is quiet; else live. */
export const stageOf = (last: string | null, now: number): ClientDataRow['stage'] => {
  if (!last) return 'setup';
  if (now - new Date(last).getTime() > QUIET_DAYS * 86_400_000) return 'quiet';
  return 'live';
};

export async function ownerOverview(now: Date = new Date()): Promise<OwnerOverview> {
  const month = monthOf(now);
  const previous = previousMonth(month);
  const all = (await listOnboardings(200)).filter((o) => o.status !== 'closed');
  const rows: ClientDataRow[] = [];
  for (const o of all) {
    const settings = await getTrackingSettings(o.id);
    const rate = effectiveCloseRate(settings);
    const [thisMonth, lastMonth, reports, feedback, last] = await Promise.all([
      monthTraffic(o.id, month, rate),
      monthTraffic(o.id, previous, rate),
      listMonthlyReports(o.id),
      listFeedback(o.id),
      lastEventAt(o.id),
    ]);
    const sent = reports.filter((r) => r.emailedAt).map((r) => r.month);
    const next = reportNumber(sent, month);
    const t = hasTraffic(thisMonth) ? thisMonth : null;
    const l = hasTraffic(lastMonth) ? lastMonth : null;
    const src = t ?? l;
    const ratings = feedback.filter((f) => f.rating).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const taps = feedback.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const base = {
      id: o.id,
      token: o.token,
      name: o.businessName || o.clientName || o.clientEmail,
      tier: o.tier,
      plan: TIER_LABELS[o.tier],
      status: o.status,
      stage: stageOf(last, now.getTime()),
      reportsSent: sent.length,
      nextReport: next,
      ramp: next <= RAMP_REPORTS,
      thisMonth: t,
      lastMonth: l,
      markedWon: src?.markedWon ?? 0,
      markedLost: src?.markedLost ?? 0,
      closeRate: src?.observedCloseRate?.rate ?? null,
      answers: latestAnswers(feedback),
      lastRating: ratings[0]?.rating ?? null,
      lastTapAt: taps[0]?.createdAt ?? null,
      taps: tapCounts(reports, feedback),
      lastEventAt: last,
    };
    rows.push({ ...base, flags: clientFlags(base) });
  }
  rows.sort((a, b) => b.flags.length - a.flags.length || (b.thisMonth?.conversions ?? 0) - (a.thisMonth?.conversions ?? 0));
  const live = rows.filter((r) => r.stage !== 'setup');
  const tapped = rows.reduce((n, r) => n + r.taps.answered, 0);
  const emailed = rows.reduce((n, r) => n + r.taps.emailed, 0);
  const worth = { easily: 0, even: 0, notyet: 0 };
  for (const r of rows) {
    const w = r.answers.find((a) => a.key === 'worth');
    if (w?.answer === 'Easily') worth.easily += 1;
    else if (w?.answer === 'About even') worth.even += 1;
    else if (w?.answer === 'Not yet') worth.notyet += 1;
  }
  return {
    month,
    previous,
    rows,
    totals: {
      live: live.length,
      reachedOut: rows.reduce((n, r) => n + (r.thisMonth?.conversions ?? 0), 0),
      estimatedCustomers: rows.reduce((n, r) => n + (r.thisMonth?.estimatedCustomers ?? 0), 0),
      tapRate: emailed ? Math.round((tapped / emailed) * 100) : null,
      worth,
    },
  };
}

export { monthLabel };
