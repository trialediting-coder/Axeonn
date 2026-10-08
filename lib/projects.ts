// lib/projects.ts
// What happens after onboarding: project dates and the 90-day baseline, Project
// Updates and Monthly Reports. Axeon enters them in the admin; each one is
// emailed to the client and shown in AxeonPROOF, where the report numbers are
// the only numbers the dashboard ever shows. The monthly job (lib/autoReports.ts)
// attaches measured website numbers to each report; the one derived figure,
// "estimated new customers", is always labelled as an estimate. Nothing is invented.
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import type { OnboardingTier } from '@/data/onboardingItems';
import { UPDATE_STATUSES, UPDATE_TYPES, buttonLabel, type Line, type TrafficSummary } from '@/lib/projectsShared';

export { UPDATE_STATUSES, UPDATE_TYPES, linesToText, monthLabel, type Line, type TrafficSummary } from '@/lib/projectsShared';

export interface ProjectDetails {
  kickoffAt: string | null; // YYYY-MM-DD
  targetLaunchAt: string | null;
  baselineCalls: number | null;
  baselineLeads: number | null;
  baselineKeyword: string | null;
  baselineRank: number | null;
}

export interface UpdateBody {
  summary: string;
  type: (typeof UPDATE_TYPES)[number];
  status: (typeof UPDATE_STATUSES)[number];
  link: string;
  changes: Line[];
  why: string;
  actionNeeded: string;
  nextUp: string;
}

export interface ProjectUpdate extends UpdateBody {
  id: number;
  number: number;
  title: string;
  emailedAt: string | null;
  createdAt: string;
}

export interface ReportBody {
  calls: number | null;
  leads: number | null;
  booked: number | null;
  keyword: string;
  rank: number | null;
  reviews: number | null;
  rating: number | null;
  done: Line[];
  next: Line[];
  fromYou: string;
  note: string;
  /** Website numbers from the tracking snippet (lib/autoReports.ts). Absent until the month is summed. */
  traffic?: TrafficSummary | null;
  /** True when the 1st-of-the-month job built and sent this report. */
  auto?: boolean;
}

/** A report with nothing typed in yet: what the monthly job starts from when Axeon has not saved one. */
export const emptyReportBody = (): ReportBody => ({
  calls: null,
  leads: null,
  booked: null,
  keyword: '',
  rank: null,
  reviews: null,
  rating: null,
  done: [],
  next: [],
  fromYou: '',
  note: '',
});

/** Old rows and partial merges may lack keys; every reader gets a complete body. */
export function normalizeReportBody(raw: Partial<ReportBody> | null | undefined): ReportBody {
  const base = emptyReportBody();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    done: Array.isArray(raw.done) ? raw.done : [],
    next: Array.isArray(raw.next) ? raw.next : [],
    keyword: raw.keyword ?? '',
    fromYou: raw.fromYou ?? '',
    note: raw.note ?? '',
    traffic: raw.traffic ?? null,
    auto: Boolean(raw.auto),
  };
}

export interface MonthlyReport extends ReportBody {
  id: number;
  month: string; // YYYY-MM
  emailedAt: string | null;
  createdAt: string;
}

// ───────────────────────────── Pure helpers ─────────────────────────────

/** The 90-day guarantee applies to AxeonCORE and AxeonGROWTH only. */
export const tierHasGuarantee = (tier: OnboardingTier) => tier !== 'essentials';

/** Day N of the 90-day window (1-based) from kickoff, or null before kickoff / after day 90. */
export function guaranteeDay(kickoffAt: string | null, now: number = Date.now()): number | null {
  if (!kickoffAt) return null;
  const start = Date.parse(`${kickoffAt}T00:00:00Z`);
  if (Number.isNaN(start) || now < start) return null;
  const day = Math.floor((now - start) / 86_400_000) + 1;
  return day <= 90 ? day : null;
}

/** "Title: what we did" per line; a line without a colon is all body. */
export function parseLines(text: unknown, max = 8): Line[] {
  if (typeof text !== 'string') return [];
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^[-•\d.)\s]+/, ''))
    .filter(Boolean)
    .slice(0, max)
    .map((l) => {
      const i = l.indexOf(':');
      return i > 0 && i < 80 ? { title: l.slice(0, i).trim(), body: l.slice(i + 1).trim() } : { title: '', body: l };
    })
    .map((x) => ({ title: x.title.slice(0, 120), body: x.body.slice(0, 600) }));
}

const str = (raw: Record<string, unknown>, k: string, max: number) =>
  typeof raw[k] === 'string' ? (raw[k] as string).trim().slice(0, max) : '';

function int(raw: Record<string, unknown>, k: string, max = 1_000_000): number | null {
  const v = raw[k];
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error(`${k} must be a number between 0 and ${max}`);
  return Math.round(n);
}

const date = (raw: Record<string, unknown>, k: string) => {
  const v = str(raw, k, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

function safeLink(v: string): string {
  if (!v) return '';
  if (!/^https:\/\/[^\s]+$/i.test(v)) throw new Error('Link must start with https://');
  return v;
}

export function validateDetailsInput(raw: Record<string, unknown>): ProjectDetails {
  return {
    kickoffAt: date(raw, 'kickoffAt'),
    targetLaunchAt: date(raw, 'targetLaunchAt'),
    baselineCalls: int(raw, 'baselineCalls'),
    baselineLeads: int(raw, 'baselineLeads'),
    baselineKeyword: str(raw, 'baselineKeyword', 120) || null,
    baselineRank: int(raw, 'baselineRank', 500),
  };
}

export function validateUpdateInput(raw: Record<string, unknown>): { title: string; body: UpdateBody } {
  const title = str(raw, 'title', 160);
  if (!title) throw new Error('Give the update a one-line headline');
  const type = UPDATE_TYPES.find((t) => t === raw.type) ?? 'Site change';
  const status = UPDATE_STATUSES.find((s) => s === raw.status) ?? 'Live';
  return {
    title,
    body: {
      summary: str(raw, 'summary', 1000),
      type,
      status,
      link: safeLink(str(raw, 'link', 500)),
      changes: parseLines(raw.changes),
      why: str(raw, 'why', 1000),
      actionNeeded: str(raw, 'actionNeeded', 600),
      nextUp: str(raw, 'nextUp', 600),
    },
  };
}

export function validateReportInput(raw: Record<string, unknown>): { month: string; body: ReportBody } {
  const month = str(raw, 'month', 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Pick the month this report covers');
  const ratingRaw = raw.rating;
  let rating: number | null = null;
  if (ratingRaw !== null && ratingRaw !== undefined && ratingRaw !== '') {
    rating = Number(ratingRaw);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new Error('Rating must be between 0 and 5');
    rating = Math.round(rating * 10) / 10;
  }
  return {
    month,
    body: {
      calls: int(raw, 'calls'),
      leads: int(raw, 'leads'),
      booked: int(raw, 'booked'),
      keyword: str(raw, 'keyword', 120),
      rank: int(raw, 'rank', 500),
      reviews: int(raw, 'reviews'),
      rating,
      done: parseLines(raw.done),
      next: parseLines(raw.next, 5),
      fromYou: str(raw, 'fromYou', 600),
      note: str(raw, 'note', 600),
    },
  };
}

/** "+3" / "−2" / "0" against the previous value, or null when either is missing. */
export function delta(now: number | null, before: number | null | undefined): string | null {
  if (now == null || before == null) return null;
  const d = now - before;
  return d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '0';
}

// ───────────────────────────── Database ─────────────────────────────

const isoOrNull = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
const dateOrNull = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : null);

export async function getProjectDetails(onboardingId: number): Promise<ProjectDetails> {
  const empty: ProjectDetails = {
    kickoffAt: null,
    targetLaunchAt: null,
    baselineCalls: null,
    baselineLeads: null,
    baselineKeyword: null,
    baselineRank: null,
  };
  if (!isDatabaseConfigured()) return empty;
  await ensureSchema();
  const res = await sql`
    SELECT kickoff_at, target_launch_at, baseline_calls, baseline_leads, baseline_keyword, baseline_rank
    FROM onboardings WHERE id = ${onboardingId} LIMIT 1;
  `;
  const r = res.rows[0];
  if (!r) return empty;
  return {
    kickoffAt: dateOrNull(r.kickoff_at),
    targetLaunchAt: dateOrNull(r.target_launch_at),
    baselineCalls: r.baseline_calls ?? null,
    baselineLeads: r.baseline_leads ?? null,
    baselineKeyword: r.baseline_keyword ?? null,
    baselineRank: r.baseline_rank ?? null,
  };
}

export async function setProjectDetails(onboardingId: number, d: ProjectDetails): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE onboardings SET kickoff_at = ${d.kickoffAt}, target_launch_at = ${d.targetLaunchAt},
      baseline_calls = ${d.baselineCalls}, baseline_leads = ${d.baselineLeads},
      baseline_keyword = ${d.baselineKeyword}, baseline_rank = ${d.baselineRank}, updated_at = now()
    WHERE id = ${onboardingId};
  `;
}

interface UpdateRow {
  id: number;
  title: string;
  body: UpdateBody;
  emailed_at: string | null;
  created_at: string;
  n: number;
}

export async function listProjectUpdates(onboardingId: number, limit = 50): Promise<ProjectUpdate[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<UpdateRow>`
    SELECT *, ROW_NUMBER() OVER (ORDER BY created_at, id)::int AS n
    FROM project_updates WHERE onboarding_id = ${onboardingId}
    ORDER BY created_at DESC, id DESC LIMIT ${limit};
  `;
  return res.rows.map((r) => ({
    ...r.body,
    id: r.id,
    number: r.n,
    title: r.title,
    emailedAt: isoOrNull(r.emailed_at),
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function createProjectUpdate(onboardingId: number, input: { title: string; body: UpdateBody }): Promise<ProjectUpdate> {
  await ensureSchema();
  const res = await sql<{ id: number }>`
    INSERT INTO project_updates (onboarding_id, title, body)
    VALUES (${onboardingId}, ${input.title}, ${JSON.stringify(input.body)}::jsonb) RETURNING id;
  `;
  const id = res.rows[0].id;
  const all = await listProjectUpdates(onboardingId, 500);
  const found = all.find((u) => u.id === id);
  if (!found) throw new Error('Update was not saved');
  return found;
}

export async function markUpdateEmailed(id: number): Promise<void> {
  await sql`UPDATE project_updates SET emailed_at = now() WHERE id = ${id};`;
}

export async function deleteProjectUpdate(onboardingId: number, id: number): Promise<void> {
  await sql`DELETE FROM project_updates WHERE id = ${id} AND onboarding_id = ${onboardingId};`;
}

interface ReportRow {
  id: number;
  month: string;
  body: ReportBody;
  emailed_at: string | null;
  created_at: string;
}

export async function listMonthlyReports(onboardingId: number, limit = 24): Promise<MonthlyReport[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<ReportRow>`
    SELECT * FROM monthly_reports WHERE onboarding_id = ${onboardingId} ORDER BY month DESC LIMIT ${limit};
  `;
  return res.rows.map((r) => ({
    ...normalizeReportBody(r.body),
    id: r.id,
    month: r.month,
    emailedAt: isoOrNull(r.emailed_at),
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function getMonthlyReport(onboardingId: number, month: string): Promise<MonthlyReport | null> {
  return (await listMonthlyReports(onboardingId, 60)).find((r) => r.month === month) ?? null;
}

/**
 * One report per month. Saving the same month again replaces what Axeon typed
 * but keeps the website numbers the monthly job attached (`traffic`, `auto`),
 * since the admin form never carries those.
 */
export async function saveMonthlyReport(onboardingId: number, input: { month: string; body: ReportBody }): Promise<MonthlyReport> {
  await ensureSchema();
  const { traffic: _traffic, auto: _auto, ...typed } = input.body;
  await sql`
    INSERT INTO monthly_reports (onboarding_id, month, body)
    VALUES (${onboardingId}, ${input.month}, ${JSON.stringify(typed)}::jsonb)
    ON CONFLICT (onboarding_id, month) DO UPDATE SET body = monthly_reports.body || EXCLUDED.body, updated_at = now();
  `;
  const found = await getMonthlyReport(onboardingId, input.month);
  if (!found) throw new Error('Report was not saved');
  return found;
}

/**
 * The monthly job's write: attaches the website numbers to the month's report,
 * creating an otherwise blank one when Axeon has not saved anything for it, and
 * never touching what Axeon typed.
 */
export async function attachTrafficToReport(onboardingId: number, month: string, traffic: TrafficSummary): Promise<MonthlyReport> {
  await ensureSchema();
  const fresh: ReportBody = { ...emptyReportBody(), traffic, auto: true };
  const patch = { traffic, auto: true };
  await sql`
    INSERT INTO monthly_reports (onboarding_id, month, body)
    VALUES (${onboardingId}, ${month}, ${JSON.stringify(fresh)}::jsonb)
    ON CONFLICT (onboarding_id, month) DO UPDATE SET body = monthly_reports.body || ${JSON.stringify(patch)}::jsonb, updated_at = now();
  `;
  const found = await getMonthlyReport(onboardingId, month);
  if (!found) throw new Error('Report was not saved');
  return found;
}

export async function markReportEmailed(id: number): Promise<void> {
  await sql`UPDATE monthly_reports SET emailed_at = now() WHERE id = ${id};`;
}

export async function deleteMonthlyReport(onboardingId: number, id: number): Promise<void> {
  await sql`DELETE FROM monthly_reports WHERE id = ${id} AND onboarding_id = ${onboardingId};`;
}

export interface ReportStat {
  label: string;
  value: string;
  sub?: string | null;
}

/**
 * The headline numbers of a report, compared with last month and the baseline.
 * With website numbers attached, those lead (visits, button clicks, estimated
 * new customers) and the typed-in numbers follow only when they were filled in;
 * without them, the four typed-in boxes show as before, blank as "—".
 */
export function reportStats(r: ReportBody, prev: ReportBody | null, d: ProjectDetails): ReportStat[] {
  const vs = (now: number | null, before: number | null | undefined, base: number | null) =>
    [delta(now, before) && `${delta(now, before)} vs last month`, base != null && `baseline ${base}`].filter(Boolean).join(' · ') || null;
  const typed: ReportStat[] = [
    { label: 'Phone calls', value: r.calls == null ? '—' : String(r.calls), sub: vs(r.calls, prev?.calls, d.baselineCalls) },
    { label: 'Form & chat leads', value: r.leads == null ? '—' : String(r.leads), sub: vs(r.leads, prev?.leads, d.baselineLeads) },
    { label: 'Booked jobs', value: r.booked == null ? '—' : String(r.booked), sub: vs(r.booked, prev?.booked, null) },
    {
      label: r.keyword ? `Google rank · “${r.keyword}”` : 'Google rank',
      value: r.rank == null ? '—' : `#${r.rank}`,
      sub: prev?.rank != null ? `was #${prev.rank} last month` : null,
    },
  ];
  const t = r.traffic;
  if (!t) return typed;
  const pt = prev?.traffic ?? null;
  const top = t.buttons[0];
  const web: ReportStat[] = [
    {
      label: 'Website visits',
      value: String(t.views),
      sub: [`${t.visitors} ${t.visitors === 1 ? 'visitor' : 'visitors'}`, delta(t.views, pt?.views) && `${delta(t.views, pt?.views)} vs last month`]
        .filter(Boolean)
        .join(' · '),
    },
    {
      label: 'Button clicks',
      value: String(t.clicks),
      sub: top ? `most clicked: ${buttonLabel(top.name)} (${top.count})` : 'calls, texts, forms and bookings',
    },
    {
      label: 'Customers reached out',
      value: String(t.conversions),
      sub: [
        t.assistedContacts
          ? `${t.directContacts ?? t.conversions - t.assistedContacts} on the site · ~${t.assistedContacts} likely called after reading your number`
          : 'calls, texts, forms, bookings, directions',
        delta(t.conversions, pt?.conversions) && `${delta(t.conversions, pt?.conversions)} vs last month`,
      ]
        .filter(Boolean)
        .join(' · '),
    },
    {
      label: 'Estimated new customers',
      value: `~${t.estimatedCustomers}`,
      sub:
        t.closeRateEstimate && t.customersLow != null && t.customersHigh != null && t.conversions > 0
          ? `likely ${t.customersLow} to ${t.customersHigh} · ${t.closeRate}% close rate, worked out from how they reached out`
          : `${t.closeRate}% of those who reached out`,
    },
  ];
  return [...web, ...typed.filter((s) => s.value !== '—')];
}

/** The report before `month`, for "vs last month". */
export const previousReport = (reports: MonthlyReport[], month: string) =>
  reports.filter((r) => r.month < month).sort((a, b) => (a.month < b.month ? 1 : -1))[0] ?? null;
