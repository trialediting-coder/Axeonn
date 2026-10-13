// lib/plans.ts
// The 90-Day Plan per client (phase 2, spec §3.2): rows in plan_items, drafted
// by lib/planRules.ts after a deep audit, re-checked after every audit, and
// edited by the owner. Owner edits (title / owner / target, or Drop) are never
// overwritten by a re-sync; current and status always move with the numbers.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import type { AuditRow } from '@/lib/auditShared';
import { metricValue, planFromAudit, targetMet, type PlanDraft, type PlanOwner, type PlanStatus, type PlanValue } from '@/lib/planRules';

export type { PlanDraft, PlanOwner, PlanStatus, PlanValue } from '@/lib/planRules';

export interface PlanItem extends PlanDraft {
  id: number;
  onboardingId: number;
  status: PlanStatus;
  /** True once the owner changed title, owner or target: a re-sync keeps those. */
  edited: boolean;
  /** Where the metric stood when the item was created, for the slipping maths. */
  start: PlanValue;
  dueAt: string | null;
  sourceAuditId: number | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DAY = 86_400_000;
export const PLAN_WINDOW_DAYS = 90;

// ───────────────────────────── Pure ─────────────────────────────

/** done when the target is met; slipping when >60% of the window is gone and <40% of the gap closed; on_track when moving; else open. */
export function statusFor(item: Pick<PlanItem, 'status' | 'metric' | 'target' | 'current' | 'start' | 'createdAt' | 'dueAt'>, now: number = Date.now()): PlanStatus {
  if (item.status === 'dropped') return 'dropped';
  if (item.metric === null) return item.status === 'done' ? 'done' : 'open';
  if (targetMet(item.metric, item.current, item.target)) return 'done';
  if (typeof item.target === 'boolean' || typeof item.current !== 'number' || typeof item.target !== 'number') return 'open';
  const start = typeof item.start === 'number' ? item.start : item.current;
  const gap = item.target - start;
  const progress = gap === 0 ? 1 : (item.current - start) / gap;
  const createdAt = Date.parse(item.createdAt);
  const dueAt = item.dueAt ? Date.parse(`${item.dueAt}T00:00:00Z`) : createdAt + PLAN_WINDOW_DAYS * DAY;
  const elapsed = dueAt > createdAt ? (now - createdAt) / (dueAt - createdAt) : 0;
  if (elapsed > 0.6 && progress < 0.4) return 'slipping';
  return progress > 0 ? 'on_track' : 'open';
}

/** Review Focus 4: a re-sync never overwrites the owner's title, owner or target, and never resurrects a dropped item. */
export function mergeDraft(existing: PlanItem | null, draft: PlanDraft, now: number = Date.now(), dueAt: string | null = null): PlanItem {
  if (!existing) {
    const fresh: PlanItem = {
      ...draft,
      id: 0,
      onboardingId: 0,
      status: 'open',
      edited: false,
      start: draft.current,
      dueAt,
      sourceAuditId: null,
      doneAt: null,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    return { ...fresh, status: statusFor(fresh, now) };
  }
  if (existing.status === 'dropped') return existing;
  const merged: PlanItem = {
    ...existing,
    title: existing.edited ? existing.title : draft.title,
    owner: existing.edited ? existing.owner : draft.owner,
    target: existing.edited ? existing.target : draft.target,
    why: existing.edited ? existing.why : draft.why,
    metric: draft.metric,
    impact: draft.impact,
    current: draft.current,
    start: existing.start ?? draft.current,
    updatedAt: new Date(now).toISOString(),
  };
  const status = statusFor(merged, now);
  return { ...merged, status, doneAt: status === 'done' ? (existing.doneAt ?? new Date(now).toISOString()) : null };
}

export function validatePlanItemInput(raw: Record<string, unknown>): { title: string; owner: PlanOwner; why: string } {
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 160) : '';
  if (!title) throw new Error('Give the action a title');
  const owner = raw.owner === 'axeon' || raw.owner === 'client' ? raw.owner : null;
  if (!owner) throw new Error('Owner must be axeon or client');
  const why = typeof raw.why === 'string' ? raw.why.trim().slice(0, 600) : '';
  return { title, owner, why };
}

const dueFrom = (kickoffAt: string | null, now: number): string => {
  const base = kickoffAt ? Date.parse(`${kickoffAt}T00:00:00Z`) : now;
  return new Date(base + PLAN_WINDOW_DAYS * DAY).toISOString().slice(0, 10);
};

// ───────────────────────────── Database ─────────────────────────────

interface Row {
  id: number;
  onboarding_id: number;
  key: string;
  title: string;
  why: string;
  owner: PlanOwner;
  metric: string | null;
  target: PlanValue;
  current: PlanValue;
  start: PlanValue;
  impact: number;
  status: PlanStatus;
  edited: boolean;
  due_at: string | null;
  source_audit_id: number | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

const toItem = (r: Row): PlanItem => ({
  id: r.id,
  onboardingId: r.onboarding_id,
  key: r.key,
  title: r.title,
  why: r.why,
  owner: r.owner,
  metric: r.metric,
  target: r.target ?? null,
  current: r.current ?? null,
  start: r.start ?? null,
  impact: (r.impact === 1 || r.impact === 3 ? r.impact : 2) as PlanDraft['impact'],
  status: r.status,
  edited: Boolean(r.edited),
  dueAt: r.due_at ? new Date(r.due_at).toISOString().slice(0, 10) : null,
  sourceAuditId: r.source_audit_id,
  doneAt: r.done_at ? new Date(r.done_at).toISOString() : null,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
});

export async function listPlan(onboardingId: number): Promise<PlanItem[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<Row>`
    SELECT * FROM plan_items WHERE onboarding_id = ${onboardingId}
    ORDER BY CASE status WHEN 'slipping' THEN 0 WHEN 'open' THEN 1 WHEN 'on_track' THEN 2 WHEN 'done' THEN 3 ELSE 4 END, impact DESC, id;
  `;
  return res.rows.map(toItem);
}

const json = (v: PlanValue) => JSON.stringify(v);

async function writeItem(onboardingId: number, item: PlanItem, sourceAuditId: number | null): Promise<void> {
  await sql`
    INSERT INTO plan_items (onboarding_id, key, title, why, owner, metric, target, current, start, impact, status, edited, due_at, source_audit_id, done_at)
    VALUES (${onboardingId}, ${item.key}, ${item.title}, ${item.why}, ${item.owner}, ${item.metric}, ${json(item.target)}::jsonb, ${json(item.current)}::jsonb, ${json(item.start)}::jsonb,
            ${item.impact}, ${item.status}, ${item.edited}, ${item.dueAt}, ${sourceAuditId}, ${item.doneAt})
    ON CONFLICT (onboarding_id, key) DO UPDATE SET
      title = EXCLUDED.title, why = EXCLUDED.why, owner = EXCLUDED.owner, metric = EXCLUDED.metric, target = EXCLUDED.target, current = EXCLUDED.current,
      start = COALESCE(plan_items.start, EXCLUDED.start), impact = EXCLUDED.impact, status = EXCLUDED.status, done_at = EXCLUDED.done_at,
      due_at = COALESCE(plan_items.due_at, EXCLUDED.due_at), source_audit_id = COALESCE(EXCLUDED.source_audit_id, plan_items.source_audit_id), updated_at = now();
  `;
}

/** After a deep audit: draft from the rules, merge with what exists, close rules that no longer fire. */
export async function syncPlan(onboardingId: number, audit: AuditRow, kickoffAt: string | null, now: number = Date.now()): Promise<PlanItem[]> {
  await ensureSchema();
  const existing = new Map((await listPlan(onboardingId)).map((i) => [i.key, i]));
  const drafts = planFromAudit({ results: audit.results, subject: audit.subject, createdAt: audit.createdAt });
  const dueAt = dueFrom(kickoffAt, now);
  const seen = new Set<string>();
  for (const d of drafts) {
    seen.add(d.key);
    await writeItem(onboardingId, mergeDraft(existing.get(d.key) ?? null, d, now, dueAt), audit.id);
  }
  // Rules that fired before and do not now: their target is met → done.
  for (const item of existing.values()) {
    if (seen.has(item.key) || item.key.startsWith('custom:') || item.status === 'dropped' || item.status === 'done' || !item.metric) continue;
    const v = metricValue(audit.results, item.metric);
    if (v === null) continue;
    const next: PlanItem = { ...item, current: v };
    const status = statusFor(next, now);
    await writeItem(onboardingId, { ...next, status, doneAt: status === 'done' ? new Date(now).toISOString() : null }, audit.id);
  }
  return listPlan(onboardingId);
}

/** After any audit (quick or deep): refresh current/status for every open item the audit can measure. */
export async function recheckPlan(onboardingId: number, audit: AuditRow, now: number = Date.now()): Promise<PlanItem[]> {
  await ensureSchema();
  const items = await listPlan(onboardingId);
  for (const item of items) {
    if (item.status === 'dropped' || item.status === 'done' || !item.metric) continue;
    const v = metricValue(audit.results, item.metric);
    if (v === null) continue;
    const next: PlanItem = { ...item, current: v };
    const status = statusFor(next, now);
    await sql`UPDATE plan_items SET current = ${json(v)}::jsonb, status = ${status}, done_at = ${status === 'done' ? new Date(now).toISOString() : null}, updated_at = now() WHERE id = ${item.id};`;
  }
  return listPlan(onboardingId);
}

export interface PlanPatch { title?: string; owner?: PlanOwner; target?: PlanValue; status?: 'dropped' | 'done' | 'open' }

/** Owner edits. Title / owner / target mark the row as edited so re-syncs leave them alone. */
export async function updatePlanItem(onboardingId: number, id: number, patch: PlanPatch): Promise<PlanItem[]> {
  await ensureSchema();
  const res = await sql<Row>`SELECT * FROM plan_items WHERE id = ${id} AND onboarding_id = ${onboardingId} LIMIT 1;`;
  const row = res.rows[0];
  if (!row) throw new Error('That action is not on this plan');
  const item = toItem(row);
  const edited = item.edited || patch.title !== undefined || patch.owner !== undefined || patch.target !== undefined;
  const title = patch.title !== undefined ? patch.title.trim().slice(0, 160) || item.title : item.title;
  const owner = patch.owner ?? item.owner;
  const target = patch.target !== undefined ? patch.target : item.target;
  let status: PlanStatus = patch.status ?? item.status;
  if (patch.status === undefined && patch.target !== undefined) status = statusFor({ ...item, target, status: item.status === 'dropped' ? 'dropped' : 'open' });
  const doneAt = status === 'done' ? (item.doneAt ?? new Date().toISOString()) : null;
  await sql`UPDATE plan_items SET title = ${title}, owner = ${owner}, target = ${json(target)}::jsonb, status = ${status}, edited = ${edited}, done_at = ${doneAt}, updated_at = now() WHERE id = ${id};`;
  return listPlan(onboardingId);
}

export async function addPlanItem(onboardingId: number, input: { title: string; owner: PlanOwner; why: string }, kickoffAt: string | null = null): Promise<PlanItem[]> {
  await ensureSchema();
  const key = `custom:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await sql`
    INSERT INTO plan_items (onboarding_id, key, title, why, owner, metric, target, current, start, impact, status, edited, due_at)
    VALUES (${onboardingId}, ${key}, ${input.title}, ${input.why}, ${input.owner}, ${null}, ${'null'}::jsonb, ${'null'}::jsonb, ${'null'}::jsonb, 2, 'open', true, ${dueFrom(kickoffAt, Date.now())});
  `;
  return listPlan(onboardingId);
}
