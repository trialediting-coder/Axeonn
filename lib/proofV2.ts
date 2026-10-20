// lib/proofV2.ts
// AxeonPROOF v2, server side: reads the facts the delivery schedule is derived
// from (lib/proofV2Shared.ts deriveMilestones), stores what the admin and the
// client set (onboardings.proof_v2, proof_pins, proof_pages), runs the
// reactivation (DBR) sprint, and builds the monthly / weekly summaries.
// Only v2 clients (onboardings.proof_version = 2) ever reach this module from
// the dashboard; v1 clients see exactly the dashboard they had.
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { iso, type DbId, type DbTime } from '@/lib/dbRows';
import type { Onboarding } from '@/lib/onboarding';
import { latestSignedAgreementFor } from '@/lib/agreements';
import { getLine, sendClientSms, type PhoneLine } from '@/lib/phoneLines';
import { DEFAULT_TIME_ZONE } from '@/lib/phoneShared';
import { isQuietHours } from '@/lib/leadShared';
import { contactRepliedSince } from '@/lib/sequences';
import { listAuditsForOnboarding } from '@/lib/audits';
import { section } from '@/lib/auditShared';
import { getTrackingSettings } from '@/lib/siteStats';
import type { ScheduleAuto } from '@/data/deliverySchedule';
import {
  DEFAULT_DBR_STEPS,
  canGoLive,
  deriveMilestones,
  fillDbrText,
  napProgress,
  pageGate,
  pipelineTotals,
  programDay,
  readSettings,
  stagingState,
  valueFor,
  type DbrStep,
  type Milestone,
  type MilestoneFacts,
  type PinStage,
  type PipelineRow,
  type ProofV2Settings,
  type StagingPhase,
} from '@/lib/proofV2Shared';

const day = (t: DbTime | string) => new Date(t).toISOString().slice(0, 10);
const num = (v: unknown) => Number(v ?? 0) || 0;

// ───────────────────────────── Settings ─────────────────────────────

export async function getV2Settings(onboardingId: number): Promise<ProofV2Settings> {
  if (!isDatabaseConfigured()) return {};
  await ensureSchema();
  const { rows } = await sql<{ proof_v2: unknown }>`SELECT proof_v2 FROM onboardings WHERE id = ${onboardingId} LIMIT 1;`;
  return readSettings(rows[0]?.proof_v2);
}

/** Merge top-level keys into the settings (a key set to null is removed). */
export async function patchV2(onboardingId: number, patch: Partial<Record<keyof ProofV2Settings, unknown>>): Promise<void> {
  await ensureSchema();
  const set: Record<string, unknown> = {};
  const drop: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) drop.push(k);
    else set[k] = v;
  }
  await sql`
    UPDATE onboardings SET proof_v2 = (COALESCE(proof_v2, '{}'::jsonb) || ${JSON.stringify(set)}::jsonb) - ${drop as unknown as string}::text[], updated_at = now()
    WHERE id = ${onboardingId};
  `;
}

/** Set one entry of a map-shaped key (steps, phases, nap, organic, bookingValues, reviews); merge=true merges into an object entry. */
export async function setV2Entry(onboardingId: number, top: 'steps' | 'phases' | 'nap' | 'organic' | 'bookingValues' | 'reviews', key: string, value: unknown, opts: { merge?: boolean } = {}): Promise<void> {
  await ensureSchema();
  if (value === null) {
    await sql`
      UPDATE onboardings SET proof_v2 = COALESCE(proof_v2, '{}'::jsonb) || jsonb_build_object(${top}::text, COALESCE(proof_v2 -> ${top}, '{}'::jsonb) - ${key}::text), updated_at = now()
      WHERE id = ${onboardingId};
    `;
    return;
  }
  const json = JSON.stringify(value);
  if (opts.merge) {
    await sql`
      UPDATE onboardings SET proof_v2 = COALESCE(proof_v2, '{}'::jsonb) || jsonb_build_object(${top}::text,
        COALESCE(proof_v2 -> ${top}, '{}'::jsonb) || jsonb_build_object(${key}::text, COALESCE(proof_v2 -> ${top} -> ${key}, '{}'::jsonb) || ${json}::jsonb)), updated_at = now()
      WHERE id = ${onboardingId};
    `;
  } else {
    await sql`
      UPDATE onboardings SET proof_v2 = COALESCE(proof_v2, '{}'::jsonb) || jsonb_build_object(${top}::text,
        COALESCE(proof_v2 -> ${top}, '{}'::jsonb) || jsonb_build_object(${key}::text, ${json}::jsonb)), updated_at = now()
      WHERE id = ${onboardingId};
    `;
  }
}

/** Day 1 of the client's schedule: the admin's date, else the agreement paid / signed, else the day the portal was made. */
export function startDateFor(onboarding: Pick<Onboarding, 'createdAt'>, settings: ProofV2Settings, agreement: { paidAt: string | null; signedAt: string | null } | null): string {
  if (settings.startAt && /^\d{4}-\d{2}-\d{2}$/.test(settings.startAt)) return settings.startAt;
  return day(agreement?.paidAt ?? agreement?.signedAt ?? onboarding.createdAt);
}

// ───────────────────────────── Pins ─────────────────────────────

export interface Pin {
  id: number;
  stage: PinStage;
  x: number;
  y: number;
  note: string;
  author: 'client' | 'axeon';
  status: 'open' | 'resolved';
  createdAt: string;
}

export async function listPins(onboardingId: number): Promise<Pin[]> {
  await ensureSchema();
  const { rows } = await sql<{ id: DbId; stage: PinStage; x: number; y: number; note: string; author: 'client' | 'axeon'; status: 'open' | 'resolved'; created_at: DbTime }>`
    SELECT id, stage, x, y, note, author, status, created_at FROM proof_pins WHERE onboarding_id = ${onboardingId} ORDER BY created_at LIMIT 300;
  `;
  return rows.map((r) => ({ id: Number(r.id), stage: r.stage, x: Number(r.x), y: Number(r.y), note: r.note, author: r.author, status: r.status, createdAt: iso(r.created_at) }));
}

export async function addPin(onboardingId: number, input: { stage: PinStage; x: number; y: number; note: string; author: 'client' | 'axeon' }): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO proof_pins (onboarding_id, stage, x, y, note, author) VALUES (${onboardingId}, ${input.stage}, ${input.x}, ${input.y}, ${input.note}, ${input.author});`;
}

export async function setPinStatus(onboardingId: number, pinId: number, status: 'open' | 'resolved'): Promise<void> {
  await sql`UPDATE proof_pins SET status = ${status}, resolved_at = ${status === 'resolved' ? new Date().toISOString() : null} WHERE id = ${pinId} AND onboarding_id = ${onboardingId};`;
}

// ───────────────────────────── Pages ─────────────────────────────

export interface ProgramPage {
  id: number;
  kind: 'location' | 'procedure';
  title: string;
  slug: string;
  intro: string;
  body: string;
  status: 'planned' | 'published';
  publishedAt: string | null;
  indexed: boolean;
  indexedAt: string | null;
}

export async function listPages(onboardingId: number): Promise<ProgramPage[]> {
  await ensureSchema();
  const { rows } = await sql<{ id: DbId; kind: 'location' | 'procedure'; title: string; slug: string; intro: string; body: string; status: 'planned' | 'published'; published_at: DbTime | null; indexed: boolean; indexed_at: DbTime | null }>`
    SELECT id, kind, title, slug, intro, body, status, published_at, indexed, indexed_at FROM proof_pages WHERE onboarding_id = ${onboardingId} ORDER BY created_at, id;
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    kind: r.kind,
    title: r.title,
    slug: r.slug,
    intro: r.intro,
    body: r.body,
    status: r.status,
    publishedAt: r.published_at ? iso(r.published_at) : null,
    indexed: r.indexed,
    indexedAt: r.indexed_at ? iso(r.indexed_at) : null,
  }));
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export async function savePage(onboardingId: number, input: { id?: number; kind: 'location' | 'procedure'; title: string; slug?: string; intro: string; body: string }): Promise<void> {
  await ensureSchema();
  const title = input.title.trim().slice(0, 140);
  if (title.length < 3) throw new Error('Give the page a title.');
  const slug = slugify(input.slug || title);
  if (!slug) throw new Error('The page needs a URL slug.');
  const intro = input.intro.slice(0, 4000);
  const body = input.body.slice(0, 40000);
  if (input.id) {
    // An edited published page goes back through the gate on its next publish.
    const res = await sql`
      UPDATE proof_pages SET kind = ${input.kind}, title = ${title}, slug = ${slug}, intro = ${intro}, body = ${body}, updated_at = now(),
        status = CASE WHEN intro <> ${intro} OR body <> ${body} THEN 'planned' ELSE status END
      WHERE id = ${input.id} AND onboarding_id = ${onboardingId};
    `;
    if (!res.rowCount) throw new Error('Page not found');
  } else {
    await sql`INSERT INTO proof_pages (onboarding_id, kind, title, slug, intro, body) VALUES (${onboardingId}, ${input.kind}, ${title}, ${slug}, ${intro}, ${body});`;
  }
}

/** Publish only through the uniqueness gate (lib/proofV2Shared.ts pageGate). */
export async function publishPage(onboardingId: number, pageId: number): Promise<void> {
  const pages = await listPages(onboardingId);
  const page = pages.find((p) => p.id === pageId);
  if (!page) throw new Error('Page not found');
  const gate = pageGate(page, pages);
  if (!gate.ok) throw new Error(gate.problems.join(' '));
  await sql`UPDATE proof_pages SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now() WHERE id = ${pageId} AND onboarding_id = ${onboardingId};`;
}

export async function setPageIndexed(onboardingId: number, pageId: number, indexed: boolean): Promise<void> {
  await sql`UPDATE proof_pages SET indexed = ${indexed}, indexed_at = ${indexed ? new Date().toISOString() : null}, updated_at = now() WHERE id = ${pageId} AND onboarding_id = ${onboardingId} AND status = 'published';`;
}

export async function deletePage(onboardingId: number, pageId: number): Promise<void> {
  await sql`DELETE FROM proof_pages WHERE id = ${pageId} AND onboarding_id = ${onboardingId};`;
}

// ───────────────────────────── DBR sprint ─────────────────────────────

export interface DbrState {
  imported: number;
  consented: number;
  firstImportAt: string | null;
  status: 'none' | 'running' | 'done' | 'stopped';
  steps: DbrStep[];
  startedAt: string | null;
  endedAt: string | null;
  sent: number;
  pending: number;
  stopped: number;
  replied: number;
}

export async function dbrState(onboardingId: number): Promise<DbrState> {
  await ensureSchema();
  const [{ rows: pc }, { rows: sp }, { rows: sends }] = await Promise.all([
    sql<{ total: number; consented: number; first: DbTime | null }>`
      SELECT count(*)::int AS total, count(*) FILTER (WHERE consent_attested_at IS NOT NULL)::int AS consented, min(created_at) AS first
      FROM past_customers WHERE onboarding_id = ${onboardingId};
    `,
    sql<{ steps: DbrStep[]; status: 'running' | 'done' | 'stopped'; started_at: DbTime; ended_at: DbTime | null }>`
      SELECT steps, status, started_at, ended_at FROM dbr_sprints WHERE onboarding_id = ${onboardingId};
    `,
    sql<{ sent: number; pending: number; stopped: number; replied: number }>`
      SELECT count(*) FILTER (WHERE status = 'sent')::int AS sent,
             count(*) FILTER (WHERE status IN ('pending', 'sending'))::int AS pending,
             count(*) FILTER (WHERE status IN ('stopped', 'skipped'))::int AS stopped,
             count(DISTINCT phone) FILTER (WHERE reason = 'replied')::int AS replied
      FROM dbr_sends WHERE onboarding_id = ${onboardingId};
    `,
  ]);
  const s = sp[0];
  return {
    imported: num(pc[0]?.total),
    consented: num(pc[0]?.consented),
    firstImportAt: pc[0]?.first ? iso(pc[0].first) : null,
    status: s?.status ?? 'none',
    steps: Array.isArray(s?.steps) ? s.steps : DEFAULT_DBR_STEPS.map((x) => ({ ...x })),
    startedAt: s ? iso(s.started_at) : null,
    endedAt: s?.ended_at ? iso(s.ended_at) : null,
    sent: num(sends[0]?.sent),
    pending: num(sends[0]?.pending),
    stopped: num(sends[0]?.stopped),
    replied: num(sends[0]?.replied),
  };
}

/** Starts the 3-text sprint for every consented past customer not opted out. One sprint per client. */
export async function startDbrSprint(onboardingId: number, steps: DbrStep[], now: Date = new Date()): Promise<{ queued: number }> {
  await ensureSchema();
  const line = await getLine(onboardingId);
  if (!line) throw new Error('Set up the tracked number first; the sprint texts from it.');
  if (line.smsStatus !== 'ready') throw new Error('Texting is not approved yet (A2P 10DLC). The sprint can start once it is.');
  const ins = await sql`
    INSERT INTO dbr_sprints (onboarding_id, steps, status, started_at) VALUES (${onboardingId}, ${JSON.stringify(steps)}::jsonb, 'running', ${now.toISOString()})
    ON CONFLICT (onboarding_id) DO NOTHING;
  `;
  if (!ins.rowCount) throw new Error('This client already has a reactivation sprint.');
  const base = now.getTime();
  let queued = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const due = new Date(base + steps[i].day * 86_400_000).toISOString();
    const res = await sql`
      INSERT INTO dbr_sends (onboarding_id, past_customer_id, phone, name, step, due_at)
      SELECT p.onboarding_id, p.id, p.phone, p.name, ${i}::int, ${due}::timestamptz
      FROM past_customers p
      WHERE p.onboarding_id = ${onboardingId} AND p.consent_attested_at IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM phone_opt_outs x WHERE x.onboarding_id = p.onboarding_id AND x.phone_number = p.phone)
      ORDER BY p.last_job_at DESC NULLS LAST, p.id
      LIMIT 1000
      ON CONFLICT DO NOTHING;
    `;
    if (i === 0) queued = res.rowCount ?? 0;
  }
  await sql`UPDATE dbr_sprints SET imported_count = ${queued} WHERE onboarding_id = ${onboardingId};`;
  if (!queued) {
    await sql`UPDATE dbr_sprints SET status = 'done', ended_at = now() WHERE onboarding_id = ${onboardingId};`;
    throw new Error('No consented past customers to text. Import the list (with consent confirmed) first.');
  }
  return { queued };
}

export async function stopDbrSprint(onboardingId: number): Promise<void> {
  await sql`UPDATE dbr_sends SET status = 'stopped', reason = 'stopped_by_axeon' WHERE onboarding_id = ${onboardingId} AND status = 'pending';`;
  await sql`UPDATE dbr_sprints SET status = 'stopped', ended_at = now() WHERE onboarding_id = ${onboardingId} AND status = 'running';`;
}

/** Sends due sprint texts. Outside quiet hours only; a reply stops that person's later texts. Never runs outside production (v2SendsEnabled). */
export async function processDbrSends(opts: { now?: Date; perClient?: number; deadline?: number } = {}): Promise<{ sent: number; stopped: number; skipped: number; failed: number }> {
  const out = { sent: 0, stopped: 0, skipped: 0, failed: 0 };
  if (!v2SendsEnabled() || !isDatabaseConfigured()) return out;
  await ensureSchema();
  const now = opts.now ?? new Date();
  const { rows: clients } = await sql<{ onboarding_id: number; started_at: DbTime; steps: DbrStep[]; business_name: string | null }>`
    SELECT s.onboarding_id, s.started_at, s.steps, o.business_name FROM dbr_sprints s JOIN onboardings o ON o.id = s.onboarding_id
    WHERE s.status = 'running' AND o.status <> 'closed' AND o.proof_version = 2;
  `;
  for (const c of clients) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const line = await getLine(c.onboarding_id);
    if (!line || line.smsStatus !== 'ready' || isQuietHours(now, line.timeZone || DEFAULT_TIME_ZONE)) continue;
    const { rows: due } = await sql<{ id: DbId; phone: string; name: string; step: number }>`
      UPDATE dbr_sends SET status = 'sending' WHERE id IN (
        SELECT id FROM dbr_sends WHERE onboarding_id = ${c.onboarding_id} AND status = 'pending' AND due_at <= ${now.toISOString()}
        ORDER BY due_at, id LIMIT ${opts.perClient ?? 60} FOR UPDATE SKIP LOCKED
      ) RETURNING id, phone, name, step;
    `;
    for (const d of due) {
      try {
        if (d.step > 0 && (await contactRepliedSince(c.onboarding_id, d.phone, iso(c.started_at)))) {
          await sql`UPDATE dbr_sends SET status = 'stopped', reason = 'replied' WHERE onboarding_id = ${c.onboarding_id} AND phone = ${d.phone} AND status IN ('pending', 'sending');`;
          out.stopped += 1;
          continue;
        }
        const step = c.steps[d.step];
        const r = step ? await sendClientSms(line, d.phone, fillDbrText(step.body, { name: d.name, business: c.business_name }), 'sequence') : { sent: false as const, reason: 'bad_number' as const };
        if (r.sent) {
          await sql`UPDATE dbr_sends SET status = 'sent', sent_at = now() WHERE id = ${d.id};`;
          out.sent += 1;
        } else {
          await sql`UPDATE dbr_sends SET status = 'skipped', reason = ${r.reason} WHERE id = ${d.id};`;
          if (r.reason === 'opted_out') await sql`UPDATE dbr_sends SET status = 'stopped', reason = 'opted_out' WHERE onboarding_id = ${c.onboarding_id} AND phone = ${d.phone} AND status = 'pending';`;
          out.skipped += 1;
        }
      } catch (err) {
        await sql`UPDATE dbr_sends SET status = 'failed', reason = ${(err instanceof Error ? err.message : String(err)).slice(0, 200)} WHERE id = ${d.id};`;
        out.failed += 1;
      }
    }
    await sql`
      UPDATE dbr_sprints SET status = 'done', ended_at = now()
      WHERE onboarding_id = ${c.onboarding_id} AND status = 'running'
        AND NOT EXISTS (SELECT 1 FROM dbr_sends WHERE onboarding_id = ${c.onboarding_id} AND status IN ('pending', 'sending'));
    `;
  }
  return out;
}

/** Texts and emails from v2 (DBR sprint, Launch Certificate, summaries) only leave in production, and can be paused with PROOF_V2_SENDS=off. */
export function v2SendsEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.PROOF_V2_SENDS !== 'off';
}

// ───────────────────────────── Facts ─────────────────────────────

interface PhoneFacts {
  missed: number;
  textedBack: number;
  under30: number;
  medianSeconds: number | null;
  rescued: number;
}

async function phoneFacts(onboardingId: number, since: string, until?: string): Promise<PhoneFacts> {
  const end = until ?? new Date(Date.now() + 86_400_000).toISOString();
  const { rows } = await sql<{ missed: number; texted: number; under30: number; median: number | null; rescued: number }>`
    SELECT count(*)::int AS missed,
           count(*) FILTER (WHERE text_back_sent_at IS NOT NULL)::int AS texted,
           count(*) FILTER (WHERE text_back_sent_at IS NOT NULL AND text_back_sent_at - started_at < interval '30 seconds')::int AS under30,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (text_back_sent_at - started_at))) FILTER (WHERE text_back_sent_at IS NOT NULL) AS median,
           count(*) FILTER (WHERE from_number <> 'unknown' AND (
             EXISTS (SELECT 1 FROM phone_messages m WHERE m.onboarding_id = c.onboarding_id AND m.direction = 'inbound' AND m.from_number = c.from_number AND m.created_at > c.started_at AND m.created_at < c.started_at + interval '7 days')
             OR EXISTS (SELECT 1 FROM phone_calls a WHERE a.onboarding_id = c.onboarding_id AND a.from_number = c.from_number AND a.outcome = 'answered' AND a.started_at > c.started_at AND a.started_at < c.started_at + interval '7 days')
           ))::int AS rescued
    FROM phone_calls c
    WHERE c.onboarding_id = ${onboardingId} AND c.direction = 'inbound' AND c.outcome = 'missed' AND c.started_at >= ${since} AND c.started_at < ${end};
  `;
  const r = rows[0];
  return { missed: num(r?.missed), textedBack: num(r?.texted), under30: num(r?.under30), medianSeconds: r?.median != null ? Math.round(Number(r.median)) : null, rescued: num(r?.rescued) };
}

/** Booked appointments from the reactivation sprint (or the quarterly check-in) and from the website, one row per person. */
async function pipelineRows(onboardingId: number, since: string, settings: ProofV2Settings, average: number | null): Promise<PipelineRow[]> {
  const { rows: dbrRows } = await sql<{ key: string; name: string | null; at: DbTime; phone: string }>`
    WITH texted AS (
      SELECT phone, min(sent_at) AS first_at FROM dbr_sends WHERE onboarding_id = ${onboardingId} AND status = 'sent' GROUP BY phone
      UNION ALL
      SELECT contact_phone, min(created_at) FROM sequence_runs WHERE onboarding_id = ${onboardingId} AND kind = 'reactivation' AND sms_sent_count > 0 AND contact_phone IS NOT NULL GROUP BY contact_phone
    ), firsts AS (SELECT phone, min(first_at) AS first_at FROM texted GROUP BY phone)
    SELECT DISTINCT ON (f.phone) x.key, x.name, x.at, f.phone FROM firsts f
    JOIN LATERAL (
      SELECT 'contact:' || k.id AS key, k.name, k.stage_changed_at AS at FROM contacts k
        WHERE k.onboarding_id = ${onboardingId} AND k.phone = f.phone AND k.stage IN ('booked', 'won') AND k.stage_changed_at >= f.first_at
      UNION ALL
      SELECT 'booking:' || b.id, b.contact_name, b.created_at FROM bookings b
        WHERE b.onboarding_id = ${onboardingId} AND b.phone = f.phone AND b.status <> 'cancelled' AND b.created_at >= f.first_at
    ) x ON true
    ORDER BY f.phone, x.at;
  `;
  const dbrPhones = dbrRows.map((r) => r.phone);
  const { rows: webRows } = await sql<{ key: string; name: string | null; at: DbTime }>`
    SELECT DISTINCT ON (COALESCE(phone, key)) key, name, at FROM (
      SELECT 'contact:' || k.id AS key, k.name, k.stage_changed_at AS at, k.phone FROM contacts k
        WHERE k.onboarding_id = ${onboardingId} AND k.stage IN ('booked', 'won') AND k.source IN ('form', 'chat', 'booking', 'click')
          AND k.stage_changed_at >= ${since} AND (k.phone IS NULL OR NOT (k.phone = ANY(${dbrPhones as unknown as string}::text[])))
      UNION ALL
      SELECT 'booking:' || b.id, b.contact_name, b.created_at, b.phone FROM bookings b
        WHERE b.onboarding_id = ${onboardingId} AND b.source IN ('widget', 'chat') AND b.status <> 'cancelled' AND b.created_at >= ${since}
          AND NOT (b.phone = ANY(${dbrPhones as unknown as string}::text[]))
    ) w
    ORDER BY COALESCE(phone, key), at;
  `;
  const label = (name: string | null) => {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? `${parts[0]}${parts[1] ? ` ${parts[1][0]}.` : ''}` : 'Booked lead';
  };
  const make = (source: 'dbr' | 'web') => (r: { key: string; name: string | null; at: DbTime }): PipelineRow => {
    const v = valueFor(r.key, settings.bookingValues, average);
    return { key: r.key, source, label: label(r.name), at: iso(r.at), value: v.value, valueBasis: v.basis };
  };
  return [...dbrRows.map(make('dbr')), ...webRows.map(make('web'))].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export interface FrontDesk {
  /** Missed-call threads from the last 14 days nobody has answered yet: the inbox-zero number. */
  waiting: number;
  week: { missed: number; autoTexted: number; staffReplied: number; booked: number; archived: number };
  signedOffAt: string | null;
  signedOffBy: string | null;
  access: { month: string; recipient: 'owner' | 'manager'; at: string }[];
}

async function frontDesk(onboardingId: number, settings: ProofV2Settings): Promise<FrontDesk> {
  const [{ rows: w }, { rows: wk }, { rows: st }, { rows: acc }] = await Promise.all([
    sql<{ n: number }>`
      SELECT count(DISTINCT c.from_number)::int AS n FROM phone_calls c
      WHERE c.onboarding_id = ${onboardingId} AND c.direction = 'inbound' AND c.outcome = 'missed' AND c.from_number <> 'unknown' AND c.started_at > now() - interval '14 days'
        AND NOT EXISTS (SELECT 1 FROM phone_messages m WHERE m.onboarding_id = c.onboarding_id AND m.direction = 'outbound' AND m.kind = 'manual' AND m.to_number = c.from_number AND m.created_at > c.started_at)
        AND NOT EXISTS (SELECT 1 FROM phone_calls a WHERE a.onboarding_id = c.onboarding_id AND a.from_number = c.from_number AND a.outcome = 'answered' AND a.started_at > c.started_at)
        AND NOT EXISTS (SELECT 1 FROM contacts k WHERE k.onboarding_id = c.onboarding_id AND k.phone = c.from_number AND k.stage <> 'new');
    `,
    sql<{ missed: number; auto: number; replied: number }>`
      SELECT count(*)::int AS missed, count(*) FILTER (WHERE text_back_sent_at IS NOT NULL)::int AS auto,
             count(*) FILTER (WHERE EXISTS (SELECT 1 FROM phone_messages m WHERE m.onboarding_id = c.onboarding_id AND m.direction = 'outbound' AND m.kind = 'manual' AND m.to_number = c.from_number AND m.created_at > c.started_at)
               OR EXISTS (SELECT 1 FROM phone_calls a WHERE a.onboarding_id = c.onboarding_id AND a.direction = 'connect' AND a.from_number = c.from_number AND a.outcome = 'answered' AND a.started_at > c.started_at))::int AS replied
      FROM phone_calls c
      WHERE c.onboarding_id = ${onboardingId} AND c.direction = 'inbound' AND c.outcome = 'missed' AND c.started_at > now() - interval '7 days';
    `,
    sql<{ booked: number; archived: number }>`
      SELECT count(*) FILTER (WHERE stage IN ('booked', 'won'))::int AS booked, count(*) FILTER (WHERE stage = 'lost')::int AS archived
      FROM contacts WHERE onboarding_id = ${onboardingId} AND stage_changed_at > now() - interval '7 days';
    `,
    sql<{ month: string; recipient: 'owner' | 'manager'; accessed_at: DbTime }>`
      SELECT month, recipient, accessed_at FROM proof_link_access WHERE onboarding_id = ${onboardingId} ORDER BY accessed_at DESC LIMIT 6;
    `,
  ]);
  return {
    waiting: num(w[0]?.n),
    week: { missed: num(wk[0]?.missed), autoTexted: num(wk[0]?.auto), staffReplied: num(wk[0]?.replied), booked: num(st[0]?.booked), archived: num(st[0]?.archived) },
    signedOffAt: settings.frontDesk?.signedOffAt ?? null,
    signedOffBy: settings.frontDesk?.signedOffBy ?? null,
    access: acc.map((a) => ({ month: a.month, recipient: a.recipient, at: iso(a.accessed_at) })),
  };
}

async function reviewFacts(onboardingId: number, since: string): Promise<{ enabled: boolean; enabledAt: string | null; sent: number; newReviews: number | null; rating: number | null; reviews: number | null }> {
  const [{ rows: t }, { rows: r }, audits] = await Promise.all([
    sql<{ enabled: boolean; updated_at: DbTime }>`SELECT enabled, updated_at FROM sequence_templates WHERE onboarding_id = ${onboardingId} AND kind = 'review' LIMIT 1;`,
    sql<{ n: number }>`SELECT count(*)::int AS n FROM sequence_runs WHERE onboarding_id = ${onboardingId} AND kind = 'review' AND sent_count > 0 AND created_at >= ${since};`,
    listAuditsForOnboarding(onboardingId, 60).catch(() => []),
  ]);
  const reps = audits
    .filter((a) => a.status !== 'failed')
    .map((a) => ({ at: a.createdAt, rep: section(a.results.reputation) }))
    .filter((x) => x.rep && typeof x.rep.reviews === 'number');
  const latest = reps[0]?.rep ?? null;
  // The first count measured on or after the start date (or the oldest we have) is the baseline.
  const baseline = [...reps].reverse().find((x) => x.at >= since)?.rep ?? reps.at(-1)?.rep ?? null;
  return {
    enabled: !!t[0]?.enabled,
    enabledAt: t[0]?.enabled ? iso(t[0].updated_at) : null,
    sent: num(r[0]?.n),
    newReviews: latest && baseline && reps.length > 1 ? (latest.reviews ?? 0) - (baseline.reviews ?? 0) : null,
    rating: latest?.rating ?? null,
    reviews: latest?.reviews ?? null,
  };
}

// ───────────────────────────── The view ─────────────────────────────

export interface ProofV2View {
  startAt: string;
  day: number;
  milestones: Milestone[];
  settings: ProofV2Settings;
  staging: { phase: StagingPhase; endsAt: string | null };
  goLive: { ok: boolean; reason: string | null };
  pins: Pin[];
  line: { number: string; smsReady: boolean; textBackOn: boolean } | null;
  mcat: PhoneFacts;
  dbr: DbrState;
  pipeline: { rows: PipelineRow[]; totals: ReturnType<typeof pipelineTotals>; average: number | null };
  reviews: Awaited<ReturnType<typeof reviewFacts>>;
  nap: ReturnType<typeof napProgress>;
  pages: ProgramPage[];
  frontDesk: FrontDesk;
  bookUrl: string;
}

export async function loadV2View(onboarding: Onboarding, opts: { now?: Date } = {}): Promise<ProofV2View> {
  const now = opts.now ?? new Date();
  const [settings, agreement, line, tracking] = await Promise.all([
    getV2Settings(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
    getLine(onboarding.id),
    getTrackingSettings(onboarding.id),
  ]);
  const startAt = startDateFor(onboarding, settings, agreement);
  const [mcat, dbr, reviews, pages, pins, desk, pipeline, { rows: pageDates }] = await Promise.all([
    phoneFacts(onboarding.id, startAt),
    dbrState(onboarding.id),
    reviewFacts(onboarding.id, startAt),
    listPages(onboarding.id),
    listPins(onboarding.id),
    frontDesk(onboarding.id, settings),
    pipelineRows(onboarding.id, startAt, settings, tracking.avgJobValue),
    sql<{ planned: DbTime | null; published: DbTime | null }>`SELECT min(created_at) AS planned, min(published_at) AS published FROM proof_pages WHERE onboarding_id = ${onboarding.id};`,
  ]);
  const totals = pipelineTotals(pipeline);
  const nap = napProgress(settings.nap);
  const staging = stagingState(settings.staging, now);
  const lineView = line ? { number: line.phoneNumber, smsReady: line.smsStatus === 'ready', textBackOn: line.textBackEnabled } : null;
  const autoDone = autoDoneFor({ settings, line, dbr, reviews, nap, pageDates: pageDates[0] ?? null, stagingPhase: staging.phase, stagingEndsAt: staging.endsAt });
  const facts: MilestoneFacts = {
    startAt,
    settings,
    autoDone,
    line: lineView,
    mcat,
    dbr: { imported: dbr.imported, status: dbr.status, sent: dbr.sent, booked: totals.dbr, pipelineDollars: totals.dbrDollars },
    reviewEngine: { enabled: reviews.enabled, sent: reviews.sent, newReviews: reviews.newReviews },
    nap: { synced: nap.synced, total: nap.total },
    pages: { planned: pages.length, published: pages.filter((p) => p.status === 'published').length, indexed: pages.filter((p) => p.indexed).length },
    openPins: pins.filter((p) => p.status === 'open' && p.stage !== 'staging').length,
  };
  return {
    startAt,
    day: programDay(startAt, now),
    milestones: deriveMilestones(facts, now),
    settings,
    staging,
    goLive: canGoLive(settings, now),
    pins,
    line: lineView,
    mcat,
    dbr,
    pipeline: { rows: pipeline, totals, average: tracking.avgJobValue },
    reviews,
    nap,
    pages,
    frontDesk: desk,
    bookUrl: 'https://axeonstudio.co/book',
  };
}

/** When each automatic step's real event happened. */
export function autoDoneFor(input: {
  settings: ProofV2Settings;
  line: Pick<PhoneLine, 'createdAt' | 'updatedAt' | 'smsStatus' | 'textBackEnabled'> | null;
  dbr: Pick<DbrState, 'firstImportAt' | 'startedAt' | 'endedAt' | 'status'>;
  reviews: { enabledAt: string | null };
  nap: { synced: number; submitted: number; total: number };
  pageDates: { planned: DbTime | null; published: DbTime | null } | null;
  stagingPhase: StagingPhase;
  stagingEndsAt: string | null;
}): Partial<Record<ScheduleAuto, string>> {
  const s = input.settings;
  const out: Partial<Record<ScheduleAuto, string>> = {};
  const put = (k: ScheduleAuto, v: string | null | undefined) => {
    if (v) out[k] = v;
  };
  const line = input.line;
  put('line_provisioned', line?.createdAt);
  put('a2p_filed', s.a2p?.filedAt ?? (line?.smsStatus === 'ready' ? line.updatedAt : null));
  const approved = line?.smsStatus === 'ready' ? (s.a2p?.approvedAt ?? line.updatedAt) : null;
  put('a2p_approved', approved);
  put('text_back_live', approved && line?.textBackEnabled ? approved : null);
  put('wireframe_approved', s.reviews?.wireframe?.approvedAt);
  put('copy_approved', s.reviews?.copy?.approvedAt);
  put('staging_ready', s.staging?.readyAt);
  put('staging_approved', input.stagingPhase === 'approved' ? s.staging?.approvedAt : input.stagingPhase === 'window_closed' ? input.stagingEndsAt : null);
  put('dns_cutover', s.dnsCutoverAt);
  put('go_live', s.goLiveAt);
  put('dbr_imported', input.dbr.firstImportAt);
  put('dbr_started', input.dbr.status !== 'none' ? input.dbr.startedAt : null);
  put('dbr_done', input.dbr.status === 'done' || input.dbr.status === 'stopped' ? input.dbr.endedAt : null);
  put('reviews_live', input.reviews.enabledAt);
  put('citations_started', input.nap.synced + input.nap.submitted > 0 ? (s.napStartedAt ?? null) : null);
  put('citations_done', input.nap.total > 0 && input.nap.synced >= input.nap.total ? (s.napDoneAt ?? null) : null);
  put('pages_planned', input.pageDates?.planned ? iso(input.pageDates.planned) : null);
  put('pages_published', input.pageDates?.published ? iso(input.pageDates.published) : null);
  put('sitemap_submitted', s.sitemapSubmittedAt);
  put('harvest_published', s.harvestPublishedAt);
  put('sabr_scheduled', s.sabr?.bookedAt);
  put('sabr_done', s.sabr?.completedAt);
  return out;
}

// ───────────────────────────── Summaries ─────────────────────────────

export interface MonthSummary {
  month: string;
  rescued: number;
  missed: number;
  textedBack: number;
  newReviews: number | null;
  reviewRequests: number;
  dbrBooked: number;
  webBooked: number;
  pipelineDollars: number | null;
  impressions: number | null;
  clicks: number | null;
  topKeywords: string[];
}

const monthBounds = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return { from: new Date(Date.UTC(y, m - 1, 1)).toISOString(), to: new Date(Date.UTC(y, m, 1)).toISOString() };
};

/** One month for the executive summary: every number from real rows, or what the admin entered (search impressions). */
export async function monthSummary(onboarding: Onboarding, month: string): Promise<MonthSummary> {
  const { from, to } = monthBounds(month);
  const [settings, tracking, phone, { rows: rr }] = await Promise.all([
    getV2Settings(onboarding.id),
    getTrackingSettings(onboarding.id),
    phoneFacts(onboarding.id, from, to),
    sql<{ n: number }>`SELECT count(*)::int AS n FROM sequence_runs WHERE onboarding_id = ${onboarding.id} AND kind = 'review' AND sent_count > 0 AND created_at >= ${from} AND created_at < ${to};`,
  ]);
  const rows = (await pipelineRows(onboarding.id, from, settings, tracking.avgJobValue)).filter((r) => r.at < to);
  const totals = pipelineTotals(rows);
  const audits = (await listAuditsForOnboarding(onboarding.id, 60).catch(() => [])).filter((a) => a.status !== 'failed');
  const inMonth = audits.map((a) => ({ at: a.createdAt, n: section(a.results.reputation)?.reviews })).filter((x): x is { at: string; n: number } => typeof x.n === 'number');
  const before = inMonth.find((x) => x.at < from);
  const end = inMonth.find((x) => x.at < to);
  const organic = settings.organic?.[month];
  return {
    month,
    rescued: phone.rescued,
    missed: phone.missed,
    textedBack: phone.textedBack,
    newReviews: before && end && end.at >= from ? end.n - before.n : null,
    reviewRequests: num(rr[0]?.n),
    dbrBooked: totals.dbr,
    webBooked: totals.web,
    pipelineDollars: totals.anyValue ? (totals.dbrDollars ?? 0) + (totals.webDollars ?? 0) : null,
    impressions: organic?.impressions ?? null,
    clicks: organic?.clicks ?? null,
    topKeywords: organic?.topKeywords ?? [],
  };
}

export async function logSummaryAccess(onboardingId: number, month: string, recipient: 'owner' | 'manager', userAgent: string): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO proof_link_access (onboarding_id, month, recipient, user_agent) VALUES (${onboardingId}, ${month}, ${recipient}, ${userAgent.slice(0, 200)});`;
}

export async function v2Onboardings(): Promise<number[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const { rows } = await sql<{ id: number }>`SELECT id FROM onboardings WHERE proof_version = 2 AND status <> 'closed' ORDER BY id;`;
  return rows.map((r) => r.id);
}

export async function timeZoneFor(onboardingId: number): Promise<string> {
  const line = await getLine(onboardingId).catch(() => null);
  return line?.timeZone || DEFAULT_TIME_ZONE;
}
