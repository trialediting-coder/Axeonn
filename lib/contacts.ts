// lib/contacts.ts
// The leads inbox, server side. `contacts` is one row per person (a phone number
// or an email, per client); `contact_events` is a projection of the source tables
// (phone_calls, phone_messages, form_submissions, site_events, and later bookings
// and chats) so the inbox is one indexed read. The source rows stay the truth:
// every project* function re-reads its source row and upserts on (ref_table,
// ref_id, kind, ref_part), so a retried webhook or a second backfill changes
// nothing. upsertContactEvent is the one entry point every producer calls. Only
// the lead's own action (a call, an inbound text, a form) creates a contact;
// outbound sends attach to one that exists. Admin test leads never become one.
// Client stage taps do not start here: they run through slice 3's applyLeadStage
// (lib/leadStages.ts) with a contacts-backed LeadStore, which calls
// writeContactStage. Server-only.
import { db, type VercelPoolClient } from '@vercel/postgres';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { errText, iso, type DbId, type DbTime } from '@/lib/dbRows';
import { setLeadOutcome } from '@/lib/siteStats';
import {
  CLICK_ATTACH_MINUTES, cleanName, contactKeyFor, encodeCursor, eventSummary, heldReplyStatus, isLeadActivity, mergeDecision, messageEventKind,
  nextSystemStage, noteForAction, outcomeForStage, sequenceEffects, sourceForKind, systemStageFor, toDashboardContact, toDashboardEvent,
  type Contact, type ContactEvent, type ContactEventKind, type ContactSource, type DashboardContact, type DashboardContactView,
  type EventPayload, type SystemStage,
} from '@/lib/contactsShared';
import { isLeadStage, type LeadAction, type LeadStage, type SequenceStep } from '@/lib/sequenceShared';

export interface ContactRow {
  id: DbId;
  onboarding_id: number;
  phone: string | null;
  email: string | null;
  name: string | null;
  stage: string;
  source: ContactSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  first_seen_at: DbTime;
  last_activity_at: DbTime;
  stage_changed_at: DbTime | null;
  quote_sent_at: DbTime | null;
}

export const toContact = (r: ContactRow): Contact => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  phone: r.phone,
  email: r.email,
  name: r.name,
  stage: isLeadStage(r.stage) ? r.stage : 'new',
  source: r.source,
  utmSource: r.utm_source,
  utmMedium: r.utm_medium,
  utmCampaign: r.utm_campaign,
  firstSeenAt: iso(r.first_seen_at),
  lastActivityAt: iso(r.last_activity_at),
  stageChangedAt: r.stage_changed_at ? iso(r.stage_changed_at) : null,
  quoteSentAt: r.quote_sent_at ? iso(r.quote_sent_at) : null,
});

export interface EventRow {
  id: DbId;
  contact_id: DbId;
  onboarding_id: number;
  kind: ContactEventKind;
  ref_table: string | null;
  ref_id: DbId | null;
  ref_part: number;
  summary: string;
  payload: EventPayload | null;
  created_at: DbTime;
}

export const toEvent = (r: EventRow): ContactEvent => ({
  id: Number(r.id),
  contactId: Number(r.contact_id),
  onboardingId: Number(r.onboarding_id),
  kind: r.kind,
  refTable: r.ref_table,
  refId: r.ref_id === null ? null : Number(r.ref_id),
  refPart: Number(r.ref_part),
  summary: r.summary,
  payload: r.payload ?? {},
  createdAt: iso(r.created_at),
});

const isUniqueViolation = (err: unknown): boolean => typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';

export interface ContactEventInput {
  onboardingId: number;
  kind: ContactEventKind;
  /** The source table and row; null only for notes and alerts, which have no source row. */
  refTable: string | null;
  refId: number | null;
  refPart?: number;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  /** Used only when this event creates the contact. Defaults from the kind. */
  source?: ContactSource;
  utm?: { source: string | null; medium: string | null; campaign: string | null } | null;
  summary: string;
  payload: EventPayload;
  /** When it happened (the source row's time), ISO. */
  createdAt: string;
  /** False for anything outbound: attach to an existing contact or skip (spec: the inbox is who reached out). Default true. */
  createIfMissing?: boolean;
  /** The backfill: history, not news. Stage moves are recorded but no follow-up is stopped or started. */
  replay?: boolean;
}

export interface UpsertResult {
  contactId: number;
  eventId: number;
  createdContact: boolean;
  insertedEvent: boolean;
}

// ───────────────────────────── Reading ─────────────────────────────

export async function getContact(onboardingId: number, contactId: number): Promise<Contact | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<ContactRow>`SELECT * FROM contacts WHERE id = ${contactId} AND onboarding_id = ${onboardingId} LIMIT 1;`;
  return rows[0] ? toContact(rows[0]) : null;
}

async function findByPhone(onboardingId: number, phone: string): Promise<Contact | null> {
  const { rows } = await sql<ContactRow>`SELECT * FROM contacts WHERE onboarding_id = ${onboardingId} AND phone = ${phone} LIMIT 1;`;
  return rows[0] ? toContact(rows[0]) : null;
}

async function findByEmail(onboardingId: number, email: string): Promise<Contact | null> {
  const { rows } = await sql<ContactRow>`SELECT * FROM contacts WHERE onboarding_id = ${onboardingId} AND email = ${email} LIMIT 1;`;
  return rows[0] ? toContact(rows[0]) : null;
}

// ───────────────────────────── Keeping forms and clicks in step ─────────────────────────────

/**
 * Slice 3's form list (FormLeads, the admin) reads form_submissions.stage; it
 * must agree with the contact. Every (non-test) form projected onto this
 * contact gets its stage, and its quote time on a "Quote sent" tap.
 */
async function mirrorFormStage(onboardingId: number, contactId: number, stage: LeadStage, action: LeadAction | null): Promise<void> {
  await sql`
    UPDATE form_submissions
    SET stage = ${stage},
        stage_changed_at = CASE WHEN stage IS DISTINCT FROM ${stage}::text THEN now() ELSE stage_changed_at END,
        quote_sent_at = CASE WHEN ${action ?? ''}::text = 'quote_sent' THEN COALESCE(quote_sent_at, now()) ELSE quote_sent_at END
    WHERE onboarding_id = ${onboardingId} AND NOT is_test
      AND id IN (
        SELECT ref_id FROM contact_events
        WHERE onboarding_id = ${onboardingId} AND contact_id = ${contactId} AND ref_table = 'form_submissions' AND kind = 'form'
      );`;
}

/** The form stages a move code makes by itself may lift: only those behind it. Never a Won/Lost form, never backwards. */
export function formStagesBelow(next: SystemStage): LeadStage[] {
  return next === 'booked' ? ['new', 'contacted'] : ['new'];
}

/**
 * The forms' side of a system move (advanceStage): forward only. A form the
 * client already marked (Won in slice 3, say) keeps its mark even when an old
 * answered call is replayed onto its contact; copyFormStages then reads it.
 */
async function mirrorSystemStage(onboardingId: number, contactId: number, next: SystemStage): Promise<void> {
  const below = formStagesBelow(next) as unknown as string;
  await sql`
    UPDATE form_submissions
    SET stage = ${next}, stage_changed_at = now()
    WHERE onboarding_id = ${onboardingId} AND NOT is_test AND stage = ANY(${below}::text[])
      AND id IN (
        SELECT ref_id FROM contact_events
        WHERE onboarding_id = ${onboardingId} AND contact_id = ${contactId} AND ref_table = 'form_submissions' AND kind = 'form'
      );`;
}

async function clicksFor(onboardingId: number, contactId: number): Promise<{ id: number; at: string }[]> {
  const { rows } = await sql<{ ref_id: DbId; created_at: DbTime }>`
    SELECT ref_id, created_at FROM contact_events
    WHERE onboarding_id = ${onboardingId} AND contact_id = ${contactId} AND kind = 'click' AND ref_table = 'site_events'
    ORDER BY created_at, id;`;
  return rows.map((r) => ({ id: Number(r.ref_id), at: iso(r.created_at) }));
}

/**
 * Which of a contact's matched website taps carries its Won/Lost (pure): the
 * earliest (ties to the lower id), so one person counts once in the close
 * rate; every other matched tap is cleared. Null mark when there is no tap.
 */
export function planClickOutcomes(clicks: { id: number; at: string }[]): { mark: number | null; clear: number[] } {
  if (clicks.length === 0) return { mark: null, clear: [] };
  const first = clicks.reduce((best, c) => {
    const d = Date.parse(c.at) - Date.parse(best.at);
    return d < 0 || (d === 0 && c.id < best.id) ? c : best;
  });
  return { mark: first.id, clear: clicks.filter((c) => c.id !== first.id).map((c) => c.id) };
}

/**
 * Won/Lost onto the contact's earliest matched website tap, and cleared
 * (outcome and outcome_at NULL) on its other matched taps, all scoped by the
 * client, so the close rate counts the person once (an unmatched contact is
 * counted by lib/siteStats.ts directly).
 */
async function writeBackOutcome(onboardingId: number, contactId: number, stage: LeadStage): Promise<void> {
  const plan = planClickOutcomes(await clicksFor(onboardingId, contactId));
  if (plan.mark === null) return;
  await setLeadOutcome(onboardingId, plan.mark, outcomeForStage(stage));
  for (const id of plan.clear) await setLeadOutcome(onboardingId, id, null);
}

// ───────────────────────────── Resolving and merging ─────────────────────────────

async function inTransaction<T>(work: (q: VercelPoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    const out = await work(client);
    await client.sql`COMMIT`;
    return out;
  } catch (err) {
    await client.sql`ROLLBACK`.catch((rollbackErr) => console.error('[contacts] rollback failed', errText(rollbackErr)));
    throw err;
  } finally {
    client.release();
  }
}

/**
 * A merge's sequence runs (pure): the dropped contact's runs of a kind the kept
 * contact already holds are removed (the run key is one per kind and ref, and
 * the kept row's run stands); every other dropped run moves to the kept row.
 */
export function splitDroppedRuns(keptKinds: string[], dropped: { id: number; kind: string }[]): { remove: number[]; repoint: number[] } {
  const held = new Set(keptKinds);
  return {
    remove: dropped.filter((r) => held.has(r.kind)).map((r) => r.id),
    repoint: dropped.filter((r) => !held.has(r.kind)).map((r) => r.id),
  };
}

/**
 * Fold two contacts into the older one (spec, "Dedupe rules"). One transaction,
 * in this order: re-point the events and held replies, delete the newer row,
 * then give the kept row the merged fields. Deleting first matters: the newer
 * row still holds the phone or email the kept row is about to take. Afterwards
 * the kept row's forms take the merged stage, and a merged Won/Lost reaches the
 * kept row's matched tap (which the dropped row's mark never did).
 */
export async function mergeContacts(onboardingId: number, aId: number, bId: number): Promise<Contact> {
  await ensureSchema();
  const merged = await inTransaction(async (q) => {
    const { rows } = await q.sql<ContactRow>`
      SELECT * FROM contacts WHERE onboarding_id = ${onboardingId} AND id IN (${aId}, ${bId}) ORDER BY id FOR UPDATE;`;
    if (rows.length < 2) {
      // A concurrent event already merged them; the survivor is the answer.
      if (!rows[0]) throw new Error('contacts: nothing to merge');
      return { contact: toContact(rows[0]), changed: false };
    }
    const plan = mergeDecision(toContact(rows[0]), toContact(rows[1]));
    const m = plan.merged;
    await q.sql`UPDATE contact_events SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId} AND onboarding_id = ${onboardingId};`;
    await q.sql`UPDATE held_replies SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId} AND onboarding_id = ${onboardingId};`;
    // Follow-ups started from an inbox tap on the dropped row (ref_table 'contacts') now belong to the kept row.
    // A run key is (onboarding_id, kind, ref_table, ref_id) and finished runs keep theirs, so a dropped run of a
    // kind the kept row already holds would collide (and fail every retry of this merge): those are deleted.
    const { rows: keptRuns } = await q.sql<{ kind: string }>`
      SELECT kind FROM sequence_runs WHERE onboarding_id = ${onboardingId} AND ref_table = 'contacts' AND ref_id = ${plan.keepId};`;
    const { rows: droppedRuns } = await q.sql<{ id: DbId; kind: string }>`
      SELECT id, kind FROM sequence_runs WHERE onboarding_id = ${onboardingId} AND ref_table = 'contacts' AND ref_id = ${plan.dropId} FOR UPDATE;`;
    const runs = splitDroppedRuns(keptRuns.map((r) => r.kind), droppedRuns.map((r) => ({ id: Number(r.id), kind: r.kind })));
    if (runs.remove.length > 0) {
      await q.sql`DELETE FROM sequence_runs WHERE onboarding_id = ${onboardingId} AND id = ANY(${runs.remove as unknown as string}::bigint[]);`;
    }
    if (runs.repoint.length > 0) {
      await q.sql`UPDATE sequence_runs SET ref_id = ${plan.keepId} WHERE onboarding_id = ${onboardingId} AND id = ANY(${runs.repoint as unknown as string}::bigint[]);`;
    }
    await q.sql`DELETE FROM contacts WHERE id = ${plan.dropId} AND onboarding_id = ${onboardingId};`;
    const { rows: kept } = await q.sql<ContactRow>`
      UPDATE contacts SET
        name = ${m.name}, phone = ${m.phone}, email = ${m.email},
        stage = ${m.stage}, stage_changed_at = ${m.stageChangedAt}, quote_sent_at = ${m.quoteSentAt},
        source = ${m.source}, utm_source = ${m.utmSource}, utm_medium = ${m.utmMedium}, utm_campaign = ${m.utmCampaign},
        first_seen_at = ${m.firstSeenAt}, last_activity_at = ${m.lastActivityAt}
      WHERE id = ${plan.keepId} AND onboarding_id = ${onboardingId}
      RETURNING *;`;
    if (!kept[0]) throw new Error('contacts: merged contact vanished');
    return { contact: toContact(kept[0]), changed: true };
  });
  if (merged.changed) {
    const c = merged.contact;
    await mirrorFormStage(onboardingId, c.id, c.stage, null);
    if (outcomeForStage(c.stage)) await writeBackOutcome(onboardingId, c.id, c.stage);
  }
  return merged.contact;
}

interface Seed {
  name: string | null;
  source: ContactSource;
  utm: { source: string | null; medium: string | null; campaign: string | null } | null;
  at: string;
}

/**
 * The contact this event belongs to. Phone first (a phone number is the
 * identity), then email. If the phone and the email point at two different
 * contacts, they are merged. Otherwise a found contact gains whatever key or
 * name it lacked; nobody found means a new contact, unless the caller said not
 * to create one (outbound sends): then null.
 */
async function resolveContact(
  onboardingId: number,
  key: { phone: string | null; email: string | null },
  seed: Seed,
  create: boolean,
  attempt = 0,
): Promise<{ contact: Contact; created: boolean } | null> {
  const [byPhone, byEmail] = await Promise.all([
    key.phone ? findByPhone(onboardingId, key.phone) : Promise.resolve(null),
    key.email ? findByEmail(onboardingId, key.email) : Promise.resolve(null),
  ]);
  if (byPhone && byEmail && byPhone.id !== byEmail.id) {
    return { contact: await mergeContacts(onboardingId, byPhone.id, byEmail.id), created: false };
  }
  const found = byPhone ?? byEmail;
  if (!found) {
    if (!create) return null;
    // No conflict target on purpose: a row with both a phone and an email can hit
    // either partial unique index (contacts_phone_uniq, contacts_email_uniq), and a
    // bare DO NOTHING covers both. A targeted clause would cover only one.
    const { rows } = await sql<ContactRow>`
      INSERT INTO contacts (onboarding_id, phone, email, name, source, utm_source, utm_medium, utm_campaign, first_seen_at, last_activity_at)
      VALUES (${onboardingId}, ${key.phone}, ${key.email}, ${seed.name}, ${seed.source},
              ${seed.utm?.source ?? null}, ${seed.utm?.medium ?? null}, ${seed.utm?.campaign ?? null}, ${seed.at}, ${seed.at})
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    if (rows[0]) return { contact: toContact(rows[0]), created: true };
    // Another request created this person a moment ago: look again, once.
    if (attempt > 0) throw new Error('contacts: could not resolve a contact');
    return resolveContact(onboardingId, key, seed, create, attempt + 1);
  }
  try {
    const { rows } = await sql<ContactRow>`
      UPDATE contacts SET
        phone = COALESCE(phone, ${key.phone}),
        email = COALESCE(email, ${key.email}),
        name = COALESCE(name, ${seed.name})
      WHERE id = ${found.id} AND onboarding_id = ${onboardingId}
      RETURNING *;`;
    return { contact: rows[0] ? toContact(rows[0]) : found, created: false };
  } catch (err) {
    // The phone or email was just taken by another contact: the next pass sees both and merges.
    if (isUniqueViolation(err) && attempt === 0) return resolveContact(onboardingId, key, seed, create, 1);
    throw err;
  }
}

interface EventWrite {
  onboardingId: number;
  kind: ContactEventKind;
  refTable: string | null;
  refId: number | null;
  refPart: number;
  summary: string;
  payload: EventPayload;
  createdAt: string;
}

/** 'update' refreshes an existing event's summary and payload (a recording arrived); 'keep' leaves it and returns null. */
async function insertEvent(contactId: number, e: EventWrite, onConflict: 'update' | 'keep'): Promise<{ id: number; contactId: number; inserted: boolean } | null> {
  const payload = JSON.stringify(e.payload);
  const { rows } =
    onConflict === 'update'
      ? await sql<{ id: DbId; contact_id: DbId; inserted: boolean }>`
          INSERT INTO contact_events (contact_id, onboarding_id, kind, ref_table, ref_id, ref_part, summary, payload, created_at)
          VALUES (${contactId}, ${e.onboardingId}, ${e.kind}, ${e.refTable}, ${e.refId}, ${e.refPart}, ${e.summary}, ${payload}::jsonb, ${e.createdAt})
          ON CONFLICT (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL
          DO UPDATE SET summary = EXCLUDED.summary, payload = EXCLUDED.payload
          RETURNING id, contact_id, (xmax = 0) AS inserted;`
      : await sql<{ id: DbId; contact_id: DbId; inserted: boolean }>`
          INSERT INTO contact_events (contact_id, onboarding_id, kind, ref_table, ref_id, ref_part, summary, payload, created_at)
          VALUES (${contactId}, ${e.onboardingId}, ${e.kind}, ${e.refTable}, ${e.refId}, ${e.refPart}, ${e.summary}, ${payload}::jsonb, ${e.createdAt})
          ON CONFLICT (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL
          DO NOTHING
          RETURNING id, contact_id, true AS inserted;`;
  const r = rows[0];
  return r ? { id: Number(r.id), contactId: Number(r.contact_id), inserted: Boolean(r.inserted) } : null;
}

/**
 * The one entry point for every producer. Resolves (or creates, or merges) the
 * contact, writes the event idempotently, moves "last activity" for real lead
 * activity, and on a fresh event only: moves the stage forward when the event
 * implies it, and matches a brand-new caller or texter to a tap on the site's
 * call button in the 10 minutes before. Returns null when the event identifies
 * nobody (a withheld caller) or is outbound to someone who is not a contact.
 */
export async function upsertContactEvent(input: ContactEventInput): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  const key = contactKeyFor({ phone: input.phone, email: input.email });
  if (!key) return null;
  await ensureSchema();
  const resolved = await resolveContact(
    input.onboardingId,
    key,
    { name: cleanName(input.name), source: input.source ?? sourceForKind(input.kind), utm: input.utm ?? null, at: input.createdAt },
    input.createIfMissing !== false,
  );
  if (!resolved) return null;
  const ev = await insertEvent(
    resolved.contact.id,
    {
      onboardingId: input.onboardingId,
      kind: input.kind,
      refTable: input.refTable,
      refId: input.refId,
      refPart: input.refPart ?? 0,
      summary: input.summary,
      payload: input.payload,
      createdAt: input.createdAt,
    },
    'update',
  );
  if (!ev) throw new Error('contacts: event not written');
  if (isLeadActivity(input.kind, input.payload)) {
    await sql`
      UPDATE contacts SET
        last_activity_at = GREATEST(last_activity_at, ${input.createdAt}::timestamptz),
        first_seen_at = LEAST(first_seen_at, ${input.createdAt}::timestamptz)
      WHERE id = ${ev.contactId} AND onboarding_id = ${input.onboardingId};`;
  }
  if (ev.inserted) {
    const proposed = systemStageFor(input.kind, input.payload);
    if (proposed) await advanceStage(input.onboardingId, ev.contactId, proposed, input.replay === true);
    // A call-connect (direction 'connect', see projectCall) is the owner dialling, not a tap on the site's call button.
    const ownerDialled = input.kind === 'call' && input.payload.direction === 'connect';
    if (resolved.created && (input.kind === 'call' || input.kind === 'text_in') && !ownerDialled) {
      await attachClickToContact(input.onboardingId, ev.contactId, input.createdAt, input.kind);
    }
  }
  return { contactId: ev.contactId, eventId: ev.id, createdContact: resolved.created, insertedEvent: ev.inserted };
}

// ───────────────────────────── Messenger and Instagram (slice 6) ─────────────────────────────

/**
 * A Messenger or Instagram sender has no phone or email, so upsertContactEvent
 * (keyed by contactKeyFor) cannot place them. The PSID / IGSID is the identity,
 * unique per client (partial unique indexes in lib/db.ts). Returns the contact
 * id and whether this call created it. The name is only filled when the contact
 * has none, so a name the client typed is never replaced. Never merged with a
 * phone or email contact: Meta does not give us their number.
 */
export async function upsertContactByExternalId(input: {
  onboardingId: number;
  channel: 'messenger' | 'instagram';
  externalId: string;
  name: string | null;
  /** When the message was sent, ISO; a brand-new contact was first seen then. */
  at: string;
}): Promise<{ id: number; created: boolean }> {
  await ensureSchema();
  const name = cleanName(input.name);
  const res =
    input.channel === 'messenger'
      ? await sql<{ id: DbId; created: boolean }>`
          INSERT INTO contacts (onboarding_id, messenger_psid, name, source, first_seen_at, last_activity_at)
          VALUES (${input.onboardingId}, ${input.externalId}, ${name}, 'messenger', ${input.at}, ${input.at})
          ON CONFLICT (onboarding_id, messenger_psid) WHERE messenger_psid IS NOT NULL
          DO UPDATE SET name = COALESCE(contacts.name, EXCLUDED.name)
          RETURNING id, (xmax = 0) AS created;`
      : await sql<{ id: DbId; created: boolean }>`
          INSERT INTO contacts (onboarding_id, instagram_id, name, source, first_seen_at, last_activity_at)
          VALUES (${input.onboardingId}, ${input.externalId}, ${name}, 'instagram', ${input.at}, ${input.at})
          ON CONFLICT (onboarding_id, instagram_id) WHERE instagram_id IS NOT NULL
          DO UPDATE SET name = COALESCE(contacts.name, EXCLUDED.name)
          RETURNING id, (xmax = 0) AS created;`;
  return { id: Number(res.rows[0].id), created: Boolean(res.rows[0].created) };
}

/**
 * One timeline event on a contact already found by id (a DM thread). Same
 * idempotent insertEvent as every other producer (unique on ref_table, ref_id,
 * kind, ref_part), same "last activity" rule (isLeadActivity), and on a fresh
 * event an optional system stage through advanceStage: a reply the client typed
 * is 'contacted', which mirrors onto their forms and stops slice 3's new-lead
 * and quote follow-ups exactly as a typed text does.
 */
export async function addContactEvent(input: {
  onboardingId: number;
  contactId: number;
  kind: ContactEventKind;
  refTable: string;
  refId: number | null;
  summary: string;
  payload: EventPayload;
  createdAt: string;
  systemStage?: SystemStage | null;
}): Promise<{ eventId: number; insertedEvent: boolean } | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const ev = await insertEvent(
    input.contactId,
    {
      onboardingId: input.onboardingId,
      kind: input.kind,
      refTable: input.refTable,
      refId: input.refId,
      refPart: 0,
      summary: input.summary,
      payload: input.payload,
      createdAt: input.createdAt,
    },
    'update',
  );
  if (!ev) return null;
  if (isLeadActivity(input.kind, input.payload)) {
    await sql`
      UPDATE contacts SET
        last_activity_at = GREATEST(last_activity_at, ${input.createdAt}::timestamptz),
        first_seen_at = LEAST(first_seen_at, ${input.createdAt}::timestamptz)
      WHERE id = ${ev.contactId} AND onboarding_id = ${input.onboardingId};`;
  }
  if (ev.inserted && input.systemStage) await advanceStage(input.onboardingId, ev.contactId, input.systemStage, false);
  return { eventId: ev.id, insertedEvent: ev.inserted };
}

// ───────────────────────────── Tracker clicks ─────────────────────────────

/**
 * A tap on the site's call (or text) button has no identity. When a new caller
 * or texter shows up within CLICK_ATTACH_MINUTES after an unmatched tap on that
 * client's site, the tap is theirs: it joins their timeline, their source
 * becomes 'click', and the visit's campaign becomes theirs. Returns the
 * site_events id, or null when nothing matched.
 */
export async function attachClickToContact(onboardingId: number, contactId: number, at: string, kind: 'call' | 'text_in'): Promise<number | null> {
  const names = kind === 'call' ? ['call'] : ['text', 'call'];
  const { rows } = await sql<{ id: DbId; name: string; path: string | null; created_at: DbTime; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }>`
    SELECT c.id, c.name, c.path, c.created_at, v.utm_source, v.utm_medium, v.utm_campaign
    FROM site_events c
    LEFT JOIN LATERAL (
      SELECT utm_source, utm_medium, utm_campaign FROM site_events v
      WHERE v.onboarding_id = c.onboarding_id AND v.visitor = c.visitor AND v.kind = 'view'
        AND v.utm_source IS NOT NULL
        AND v.created_at <= c.created_at AND v.created_at > c.created_at - interval '2 hours'
      ORDER BY v.created_at DESC LIMIT 1
    ) v ON true
    WHERE c.onboarding_id = ${onboardingId} AND c.kind = 'click' AND c.name = ANY(${names as unknown as string}::text[])
      AND c.created_at <= ${at}::timestamptz
      AND c.created_at > ${at}::timestamptz - make_interval(mins => ${CLICK_ATTACH_MINUTES})
      AND NOT EXISTS (SELECT 1 FROM contact_events e WHERE e.ref_table = 'site_events' AND e.ref_id = c.id AND e.kind = 'click')
    ORDER BY c.created_at DESC
    LIMIT 1;`;
  const click = rows[0];
  if (!click) return null;
  const clickAt = iso(click.created_at);
  const payload: EventPayload = { name: click.name, path: click.path };
  const ev = await insertEvent(
    contactId,
    { onboardingId, kind: 'click', refTable: 'site_events', refId: Number(click.id), refPart: 0, summary: eventSummary('click', payload), payload, createdAt: clickAt },
    'keep',
  );
  if (!ev) return null; // another new caller claimed this tap a moment earlier
  await sql`
    UPDATE contacts SET
      source = 'click',
      first_seen_at = LEAST(first_seen_at, ${clickAt}::timestamptz),
      utm_source = COALESCE(utm_source, ${click.utm_source}),
      utm_medium = COALESCE(utm_medium, ${click.utm_medium}),
      utm_campaign = COALESCE(utm_campaign, ${click.utm_campaign})
    WHERE id = ${contactId} AND onboarding_id = ${onboardingId};`;
  return Number(click.id);
}

/** Of these tracker click ids, the ones already matched to a contact (the anonymous Leads list hides them). */
export async function attachedClickIds(onboardingId: number, ids: number[]): Promise<Set<number>> {
  if (ids.length === 0 || !isDatabaseConfigured()) return new Set();
  await ensureSchema();
  const { rows } = await sql<{ ref_id: DbId }>`
    SELECT ref_id FROM contact_events
    WHERE onboarding_id = ${onboardingId} AND ref_table = 'site_events' AND kind = 'click'
      AND ref_id = ANY(${ids as unknown as string}::bigint[]);`;
  return new Set(rows.map((r) => Number(r.ref_id)));
}

/** The contact a source row was projected onto (slice 3's form-lead taps send a form id). */
export async function contactIdForRef(onboardingId: number, refTable: string, refId: number): Promise<number | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{ contact_id: DbId }>`
    SELECT contact_id FROM contact_events WHERE onboarding_id = ${onboardingId} AND ref_table = ${refTable} AND ref_id = ${refId} LIMIT 1;`;
  return rows[0] ? Number(rows[0].contact_id) : null;
}

// ───────────────────────────── Stage ─────────────────────────────

/**
 * A move code makes by itself (an answered call, a typed text, a booking): only
 * forward, never off Won/Lost (nextSystemStage). The contact's forms follow, and
 * the follow-ups change through slice 3's STAGE_EFFECTS (sequenceEffects). No
 * client is waiting on this, and the webhook that caused it already stops the
 * same runs itself ('answered', 'replied'), so a follow-up failure here is
 * logged, not raised: raising would fail the webhook after its row was saved.
 */
async function advanceStage(onboardingId: number, contactId: number, proposed: SystemStage, replay: boolean): Promise<void> {
  const before = await getContact(onboardingId, contactId);
  if (!before) return;
  const next = nextSystemStage(before.stage, proposed);
  if (!next) return;
  const { rows } = await sql<ContactRow>`
    UPDATE contacts SET stage = ${next}, stage_changed_at = now()
    WHERE id = ${contactId} AND onboarding_id = ${onboardingId} AND stage = ${before.stage}
    RETURNING *;`;
  if (!rows[0]) return; // someone moved it in between; their move stands
  // The backfill records history: it leaves the forms (slice 3's marks) for
  // copyFormStages to read, and it does not stop today's follow-ups.
  if (replay) return;
  const c = toContact(rows[0]);
  await mirrorSystemStage(onboardingId, contactId, next);
  const fx = sequenceEffects(next, true);
  try {
    // Loaded here, not at the top: lib/sequences.ts imports this module (Task 6).
    const { startRun, stopRunsFor } = await import('@/lib/sequences');
    if (fx.stop.length > 0) await stopRunsFor(onboardingId, { phone: c.phone, email: c.email, kinds: fx.stop }, `stage:${next}`);
    for (const kind of fx.start) await startRun(onboardingId, kind, { name: c.name, phone: c.phone, email: c.email }, { table: 'contacts', id: c.id });
  } catch (err) {
    console.error('[contacts] system stage saved, follow-up not updated', onboardingId, contactId, next, errText(err));
  }
}

/**
 * What one of the client's taps writes on a contact. Called only by the
 * LeadStores in lib/leadStages.ts, so slice 3's applyLeadStage stays the one
 * place that decides the stage (STAGE_EFFECTS) and starts or stops follow-ups
 * (and returns STAGE_ENGINE_WARNING when that fails). Here: the stage and the
 * first quote time, the contact's forms kept in step, a timeline note, and
 * Won/Lost onto the matched website tap when the outcome changed.
 */
export async function writeContactStage(onboardingId: number, contactId: number, stage: LeadStage, action: LeadAction): Promise<void> {
  const before = await getContact(onboardingId, contactId);
  if (!before) return;
  await sql`
    UPDATE contacts
    SET stage = ${stage},
        stage_changed_at = CASE WHEN stage IS DISTINCT FROM ${stage}::text THEN now() ELSE stage_changed_at END,
        quote_sent_at = CASE WHEN ${action}::text = 'quote_sent' THEN COALESCE(quote_sent_at, now()) ELSE quote_sent_at END
    WHERE id = ${contactId} AND onboarding_id = ${onboardingId};`;
  await mirrorFormStage(onboardingId, contactId, stage, action);
  const text = noteForAction(action);
  await insertEvent(
    contactId,
    { onboardingId, kind: 'note', refTable: null, refId: null, refPart: 0, summary: text, payload: { text, action }, createdAt: new Date().toISOString() },
    'update',
  );
  if (outcomeForStage(stage) !== outcomeForStage(before.stage)) await writeBackOutcome(onboardingId, contactId, stage);
}

export async function setContactName(onboardingId: number, contactId: number, raw: unknown): Promise<Contact | null> {
  await ensureSchema();
  const { rows } = await sql<ContactRow>`UPDATE contacts SET name = ${cleanName(raw)} WHERE id = ${contactId} AND onboarding_id = ${onboardingId} RETURNING *;`;
  return rows[0] ? toContact(rows[0]) : null;
}

// ───────────────────────────── Alerts ─────────────────────────────

export async function recordAlert(onboardingId: number, contactId: number, channel: 'sms' | 'push' | 'email'): Promise<void> {
  const payload: EventPayload = { channel };
  await insertEvent(
    contactId,
    { onboardingId, kind: 'alert', refTable: null, refId: null, refPart: 0, summary: eventSummary('alert', payload), payload, createdAt: new Date().toISOString() },
    'update',
  );
}

/** Was the owner already texted or emailed about this lead lately (the fallback throttle)? Pushes do not count. */
export async function alertedRecently(onboardingId: number, contactId: number, minutes: number): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM contact_events
    WHERE onboarding_id = ${onboardingId} AND contact_id = ${contactId} AND kind = 'alert' AND payload->>'channel' IN ('sms', 'email')
      AND created_at > now() - make_interval(mins => ${Math.round(minutes)})
    LIMIT 1;`;
  return rows.length > 0;
}

// ───────────────────────────── Projections (one per source table) ─────────────────────────────

/**
 * A call on the tracked line, or a slice-2 call-connect. A connect call's
 * from_number is already the lead's phone (startConnectCall). A connect call
 * about an admin test lead is skipped, like the test lead itself.
 */
export async function projectCall(callSid: string, opts: { replay?: boolean } = {}): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{
    id: DbId; onboarding_id: number; call_sid: string; outcome: 'answered' | 'missed'; started_at: DbTime; duration_seconds: number | null;
    has_recording: boolean; text_back_sent_at: DbTime | null; direction: string; from_number: string; form_name: string | null; form_is_test: boolean;
  }>`
    SELECT c.id, c.onboarding_id, c.call_sid, c.outcome, c.started_at, c.duration_seconds,
           c.recording_url IS NOT NULL AS has_recording, c.text_back_sent_at, c.direction, c.from_number,
           f.name AS form_name, COALESCE(f.is_test, false) AS form_is_test
    FROM phone_calls c
    LEFT JOIN form_submissions f ON f.id = c.lead_id
    WHERE c.call_sid = ${callSid}
    LIMIT 1;`;
  const r = rows[0];
  if (!r || r.form_is_test) return null;
  const payload: EventPayload = {
    callSid: r.call_sid,
    outcome: r.outcome,
    durationSeconds: r.duration_seconds === null ? null : Number(r.duration_seconds),
    hasRecording: Boolean(r.has_recording),
    textedBack: r.text_back_sent_at !== null,
    direction: r.direction,
  };
  return upsertContactEvent({
    onboardingId: Number(r.onboarding_id),
    kind: 'call',
    refTable: 'phone_calls',
    refId: Number(r.id),
    phone: r.from_number,
    name: r.form_name,
    summary: eventSummary('call', payload),
    payload,
    createdAt: iso(r.started_at),
    replay: opts.replay,
  });
}

/**
 * A text on the tracked line. Inbound creates the contact; outbound (text-back,
 * manual reply, sequence, reminder, confirmation) only attaches to an existing
 * one. Owner alerts are skipped: they go to the owner, not a lead. So is an
 * inbound text from the client's own forward-to number (the owner answering an
 * alert): null, nothing written, for the live webhook and the backfill alike.
 */
export async function projectMessage(messageSid: string, opts: { replay?: boolean } = {}): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{
    id: DbId; onboarding_id: number; message_sid: string; direction: 'inbound' | 'outbound'; from_number: string; to_number: string; body: string; kind: string; created_at: DbTime;
    from_owner: boolean;
  }>`
    SELECT m.id, m.onboarding_id, m.message_sid, m.direction, m.from_number, m.to_number, m.body, m.kind, m.created_at,
           (m.direction = 'inbound' AND (EXISTS (
             SELECT 1 FROM phone_lines l WHERE l.onboarding_id = m.onboarding_id AND l.forward_to = m.from_number
           ) OR EXISTS (
             SELECT 1 FROM onboardings ob WHERE ob.id = m.onboarding_id AND ob.proof_v2 ->> 'ownerMobile' = m.from_number
           ))) AS from_owner
    FROM phone_messages m WHERE m.message_sid = ${messageSid} LIMIT 1;`;
  const r = rows[0];
  if (!r || r.from_owner) return null;
  const kind = messageEventKind(r.direction, r.kind);
  if (!kind) return null;
  const inbound = r.direction === 'inbound';
  const payload: EventPayload = {
    messageSid: r.message_sid,
    body: r.body,
    messageKind: r.kind,
    automatic: !inbound && r.kind !== 'manual',
    channel: 'sms',
  };
  return upsertContactEvent({
    onboardingId: Number(r.onboarding_id),
    kind,
    refTable: 'phone_messages',
    refId: Number(r.id),
    phone: inbound ? r.from_number : r.to_number,
    summary: eventSummary(kind, payload),
    payload,
    createdAt: iso(r.created_at),
    createIfMissing: inbound,
    replay: opts.replay,
  });
}

/** A website form (slice 2), never an admin test lead. Phone and email both join the contact, which is where the automatic merge happens. */
export async function projectForm(formId: number, opts: { replay?: boolean } = {}): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{
    id: DbId; onboarding_id: number; name: string | null; phone: string | null; email: string | null; message: string | null; page: string | null;
    utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; created_at: DbTime;
  }>`
    SELECT id, onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, created_at
    FROM form_submissions WHERE id = ${formId} AND NOT is_test LIMIT 1;`;
  const r = rows[0];
  if (!r) return null;
  const payload: EventPayload = { name: r.name, message: r.message, page: r.page };
  return upsertContactEvent({
    onboardingId: Number(r.onboarding_id),
    kind: 'form',
    refTable: 'form_submissions',
    refId: Number(r.id),
    phone: r.phone,
    email: r.email,
    name: r.name,
    source: 'form',
    utm: r.utm_source ? { source: r.utm_source, medium: r.utm_medium, campaign: r.utm_campaign } : null,
    summary: eventSummary('form', payload),
    payload,
    createdAt: iso(r.created_at),
    replay: opts.replay,
  });
}

// ───────────────────────────── The inbox ─────────────────────────────

/**
 * Newest activity first, a page at a time. "Last line" is the newest event that
 * is real lead activity (isLeadActivity, mirrored in the lateral join). Times are
 * compared at millisecond precision because that is what the cursor carries.
 */
export async function listInbox(onboardingId: number, opts: { limit?: number; cursor?: { at: string; id: number } | null } = {}): Promise<{ contacts: DashboardContact[]; nextCursor: string | null }> {
  if (!isDatabaseConfigured()) return { contacts: [], nextCursor: null };
  await ensureSchema();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const at = opts.cursor?.at ?? null;
  const afterId = opts.cursor?.id ?? null;
  const { rows } = await sql<ContactRow & { last_kind: ContactEventKind | null; last_summary: string | null; opted_out: boolean }>`
    SELECT c.*, l.kind AS last_kind, l.summary AS last_summary,
           EXISTS (SELECT 1 FROM phone_opt_outs o WHERE o.onboarding_id = c.onboarding_id AND o.phone_number = c.phone) AS opted_out
    FROM contacts c
    LEFT JOIN LATERAL (
      SELECT e.kind, e.summary FROM contact_events e
      WHERE e.contact_id = c.id
        AND e.kind NOT IN ('alert', 'note', 'sequence', 'reminder')
        AND NOT (e.kind = 'text_out' AND e.payload->>'automatic' = 'true')
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT 1
    ) l ON true
    WHERE c.onboarding_id = ${onboardingId}
      AND (${at}::timestamptz IS NULL OR (date_trunc('milliseconds', c.last_activity_at), c.id) < (${at}::timestamptz, ${afterId}::bigint))
    ORDER BY date_trunc('milliseconds', c.last_activity_at) DESC, c.id DESC
    LIMIT ${limit + 1};`;
  const page = rows.slice(0, limit);
  const contacts = page.map((r) => toDashboardContact(toContact(r), r.last_kind ? { kind: r.last_kind, summary: r.last_summary ?? '' } : null, Boolean(r.opted_out)));
  const last = page[page.length - 1];
  const nextCursor = rows.length > limit && last ? encodeCursor(iso(last.last_activity_at), Number(last.id)) : null;
  return { contacts, nextCursor };
}

/**
 * One contact's page: the masked header, the latest 300 events oldest first,
 * and replies waiting for 8 am. A row still 'sending' is shown as waiting; the
 * cron turns one stuck there into 'failed' (lib/inboxReply.ts), so it never
 * reads "goes out at 8 AM" forever.
 */
export async function contactTimeline(onboardingId: number, contactId: number): Promise<DashboardContactView | null> {
  const contact = await getContact(onboardingId, contactId);
  if (!contact) return null;
  const [events, held, opted] = await Promise.all([
    sql<EventRow>`
      SELECT * FROM (
        SELECT * FROM contact_events WHERE contact_id = ${contactId} AND onboarding_id = ${onboardingId} ORDER BY created_at DESC, id DESC LIMIT 300
      ) t ORDER BY created_at ASC, id ASC;`,
    sql<{ id: DbId; body: string; send_at: DbTime; status: 'held' | 'sending' | 'failed'; error: string | null }>`
      SELECT id, body, send_at, status, error FROM held_replies
      WHERE contact_id = ${contactId} AND onboarding_id = ${onboardingId}
        AND (status IN ('held', 'sending') OR (status = 'failed' AND created_at > now() - interval '7 days'))
      ORDER BY send_at;`,
    sql`SELECT 1 FROM phone_opt_outs WHERE onboarding_id = ${onboardingId} AND phone_number = ${contact.phone ?? ''} LIMIT 1;`,
  ]);
  const list = events.rows.map(toEvent);
  const lastLead = [...list].reverse().find((e) => isLeadActivity(e.kind, e.payload)) ?? null;
  return {
    contact: toDashboardContact(contact, lastLead ? { kind: lastLead.kind, summary: lastLead.summary } : null, opted.rows.length > 0),
    events: list.map(toDashboardEvent),
    held: held.rows.map((h) => ({ id: Number(h.id), body: h.body, sendAt: iso(h.send_at), status: heldReplyStatus(h.status, h.error) })),
  };
}

// ───────────────────────────── Backfill ─────────────────────────────

export interface BackfillResult {
  onboardingId: number;
  calls: number;
  messages: number;
  forms: number;
  /** Follow-up emails (slice 3) added to existing contacts' timelines. */
  sequenceEmails: number;
  stagesCopied: number;
  /** False when the deadline came first: run it again (idempotent) to finish. */
  complete: boolean;
}

export interface SequenceRunHistory {
  step: number;
  sentCount: number;
  smsSentCount: number;
  anchorAt: string;
  lastSentAt: string | null;
}

/**
 * Which past follow-up emails of one run to add to the inbox (pure). Slice 3
 * keeps no per-step email record, only counters: sent_count - sms_sent_count
 * emails went out, among the template's email steps before run.step. Steps
 * already in the timeline (the live hook's ref_part = step) count towards that
 * number and are never added again; the rest are the earliest email steps not
 * yet there. Each is dated at its planned time (anchor + offset), never after
 * the run's last send or `now`.
 */
export function planSequenceEmailEvents(
  run: SequenceRunHistory,
  steps: Pick<SequenceStep, 'channel' | 'offsetMinutes'>[],
  existing: ReadonlySet<number>,
  now: string,
): { step: number; at: string }[] {
  const emailsSent = Math.max(0, run.sentCount - run.smsSentCount);
  let remaining = emailsSent - existing.size;
  if (remaining <= 0) return [];
  const cap = Math.min(Date.parse(run.lastSentAt ?? now), Date.parse(now));
  const anchor = Date.parse(run.anchorAt);
  const out: { step: number; at: string }[] = [];
  for (let i = 0; i < Math.min(run.step, steps.length) && remaining > 0; i += 1) {
    if (steps[i].channel !== 'email' || existing.has(i)) continue;
    out.push({ step: i, at: new Date(Math.min(anchor + steps[i].offsetMinutes * 60_000, cap)).toISOString() });
    remaining -= 1;
  }
  return out;
}

/**
 * planSequenceEmailEvents for every run of one client that emailed someone,
 * through upsertContactEvent with the live hook's key and payload (kind
 * 'sequence', ref_table 'sequence_runs', ref_part = step; lib/sequences.ts
 * claimAndSend) and createIfMissing false, so a second run or a live event never
 * doubles one and nobody who never reached out becomes a contact. Runs started
 * from an admin test form are skipped. Uses each kind's current template.
 */
async function projectSequenceEmails(onboardingId: number, deadline: number): Promise<{ count: number; complete: boolean }> {
  const { getTemplates } = await import('@/lib/sequences'); // lazy: lib/sequences imports this module
  const steps = new Map<string, SequenceStep[]>((await getTemplates(onboardingId)).map((t) => [t.kind, t.steps]));
  const { rows } = await sql<{
    id: DbId; kind: string; step: number; sent_count: number; sms_sent_count: number; anchor_at: DbTime; last_sent_at: DbTime | null;
    contact_phone: string | null; contact_email: string; contact_name: string;
  }>`
    SELECT r.id, r.kind, r.step, r.sent_count, r.sms_sent_count, r.anchor_at, r.last_sent_at, r.contact_phone, r.contact_email, r.contact_name
    FROM sequence_runs r
    WHERE r.onboarding_id = ${onboardingId} AND r.contact_email IS NOT NULL AND r.sent_count > r.sms_sent_count
      AND NOT EXISTS (SELECT 1 FROM form_submissions f WHERE r.ref_table = 'form_submissions' AND f.id = r.ref_id AND f.is_test)
    ORDER BY r.id;`;
  if (rows.length === 0) return { count: 0, complete: true };
  const { rows: seen } = await sql<{ ref_id: DbId; ref_part: number }>`
    SELECT ref_id, ref_part FROM contact_events
    WHERE onboarding_id = ${onboardingId} AND ref_table = 'sequence_runs' AND kind = 'sequence';`;
  const existing = new Map<number, Set<number>>();
  for (const e of seen) {
    const id = Number(e.ref_id);
    const parts = existing.get(id) ?? new Set<number>();
    parts.add(Number(e.ref_part));
    existing.set(id, parts);
  }
  const now = new Date().toISOString();
  let count = 0;
  for (const r of rows) {
    if (Date.now() > deadline) return { count, complete: false };
    const runId = Number(r.id);
    const plan = planSequenceEmailEvents(
      {
        step: Number(r.step),
        sentCount: Number(r.sent_count),
        smsSentCount: Number(r.sms_sent_count),
        anchorAt: iso(r.anchor_at),
        lastSentAt: r.last_sent_at ? iso(r.last_sent_at) : null,
      },
      steps.get(r.kind) ?? [],
      existing.get(runId) ?? new Set<number>(),
      now,
    );
    for (const p of plan) {
      const res = await upsertContactEvent({
        onboardingId,
        kind: 'sequence',
        refTable: 'sequence_runs',
        refId: runId,
        refPart: p.step,
        phone: r.contact_phone,
        email: r.contact_email,
        name: r.contact_name,
        summary: eventSummary('sequence', { channel: 'email', automatic: true }),
        payload: { channel: 'email', step: p.step, automatic: true },
        createdAt: p.at,
        createIfMissing: false,
        replay: true,
      });
      if (res?.insertedEvent) count += 1;
    }
  }
  return { count, complete: true };
}

export interface FormMark {
  id: number;
  stage: LeadStage;
  stageChangedAt: string | null;
  quoteSentAt: string | null;
}

export interface FormStageCopyPlan {
  /** What to write on the contact, or null to leave it. */
  contact: { stage: LeadStage; stageChangedAt: string; quoteSentAt: string | null } | null;
  /** The contact's forms behind its final stage ('new'/'contacted' only, never a Booked/Won/Lost form), lifted with their stage times left as they are. */
  lift: { stage: LeadStage; ids: number[] } | null;
}

/**
 * The backfill's stage copy for one contact (pure). Slice 3 kept the client's
 * taps on form_submissions until contacts existed. The winning mark is the
 * latest-changed form that is not 'new' (a mark with no time loses). It goes
 * over any stage the replay made by itself (an old answered call), unless the
 * contact was already tapped in the inbox (it has a note): those taps stand.
 * Then the contact's forms behind its final stage are lifted to it, forward
 * only and without a new stage time, so FormLeads agrees with the contact.
 * A second run finds nothing to change.
 */
export function planFormStageCopy(
  contact: { stage: LeadStage; stageChangedAt: string | null; quoteSentAt: string | null; tapped: boolean },
  forms: FormMark[],
  now: string,
): FormStageCopyPlan {
  const time = (t: string | null) => (t === null ? -Infinity : Date.parse(t));
  const mark = forms
    .filter((f) => f.stage !== 'new')
    .reduce<FormMark | null>((best, f) => (best === null || time(f.stageChangedAt) > time(best.stageChangedAt) ? f : best), null);
  let final = contact.stage;
  let update: FormStageCopyPlan['contact'] = null;
  if (mark && !contact.tapped && (contact.stage !== mark.stage || (contact.quoteSentAt === null && mark.quoteSentAt !== null))) {
    final = mark.stage;
    update = { stage: mark.stage, stageChangedAt: mark.stageChangedAt ?? contact.stageChangedAt ?? now, quoteSentAt: contact.quoteSentAt ?? mark.quoteSentAt };
  }
  const ids = final === 'new' ? [] : forms.filter((f) => (f.stage === 'new' || f.stage === 'contacted') && f.stage !== final).map((f) => f.id);
  return { contact: update, lift: ids.length > 0 ? { stage: final, ids } : null };
}

/**
 * planFormStageCopy for every contact of one client that has a (non-test)
 * form, without re-running the follow-ups (slice 3 already started or stopped
 * them when the tap happened). A copied Won/Lost reaches the matched website
 * tap, as writeContactStage's does. Returns the number of contacts changed.
 */
async function copyFormStages(onboardingId: number): Promise<number> {
  const { rows } = await sql<{
    contact_id: DbId; contact_stage: string; contact_changed: DbTime | null; contact_quote: DbTime | null; tapped: boolean;
    form_id: DbId; stage: string; stage_changed_at: DbTime | null; quote_sent_at: DbTime | null;
  }>`
    SELECT c.id AS contact_id, c.stage AS contact_stage, c.stage_changed_at AS contact_changed, c.quote_sent_at AS contact_quote,
           EXISTS (SELECT 1 FROM contact_events n WHERE n.onboarding_id = c.onboarding_id AND n.contact_id = c.id AND n.kind = 'note') AS tapped,
           s.id AS form_id, s.stage, s.stage_changed_at, s.quote_sent_at
    FROM contacts c
    JOIN contact_events e ON e.contact_id = c.id AND e.onboarding_id = c.onboarding_id AND e.ref_table = 'form_submissions' AND e.kind = 'form'
    JOIN form_submissions s ON s.id = e.ref_id AND s.onboarding_id = c.onboarding_id AND NOT s.is_test
    WHERE c.onboarding_id = ${onboardingId}
    ORDER BY c.id, s.id;`;
  const byContact = new Map<number, { contact: Parameters<typeof planFormStageCopy>[0]; forms: FormMark[] }>();
  for (const r of rows) {
    const id = Number(r.contact_id);
    let entry = byContact.get(id);
    if (!entry) {
      entry = {
        contact: {
          stage: isLeadStage(r.contact_stage) ? r.contact_stage : 'new',
          stageChangedAt: r.contact_changed ? iso(r.contact_changed) : null,
          quoteSentAt: r.contact_quote ? iso(r.contact_quote) : null,
          tapped: Boolean(r.tapped),
        },
        forms: [],
      };
      byContact.set(id, entry);
    }
    entry.forms.push({
      id: Number(r.form_id),
      stage: isLeadStage(r.stage) ? r.stage : 'new',
      stageChangedAt: r.stage_changed_at ? iso(r.stage_changed_at) : null,
      quoteSentAt: r.quote_sent_at ? iso(r.quote_sent_at) : null,
    });
  }
  const now = new Date().toISOString();
  let changed = 0;
  for (const [contactId, { contact, forms }] of byContact) {
    const plan = planFormStageCopy(contact, forms, now);
    if (plan.contact) {
      const p = plan.contact;
      const res = await sql`
        UPDATE contacts SET stage = ${p.stage}, stage_changed_at = ${p.stageChangedAt}, quote_sent_at = ${p.quoteSentAt}
        WHERE id = ${contactId} AND onboarding_id = ${onboardingId}
          AND NOT EXISTS (SELECT 1 FROM contact_events n WHERE n.onboarding_id = ${onboardingId} AND n.contact_id = ${contactId} AND n.kind = 'note');`;
      if ((res.rowCount ?? 0) > 0) {
        changed += 1;
        if (outcomeForStage(p.stage) !== outcomeForStage(contact.stage)) await writeBackOutcome(onboardingId, contactId, p.stage);
      }
    }
    if (plan.lift) {
      // Forward only; each form keeps its own stage time.
      await sql`
        UPDATE form_submissions SET stage = ${plan.lift.stage}
        WHERE onboarding_id = ${onboardingId} AND NOT is_test AND stage IN ('new', 'contacted')
          AND id = ANY(${plan.lift.ids as unknown as string}::bigint[]);`;
    }
  }
  return changed;
}

/**
 * Build one client's contacts from every call, text and (non-test) form that
 * exists, in the order they happened, through the same projections the
 * webhooks use, in replay mode, then the follow-up emails slice 3 already sent.
 * Rows that already have their contact_events row (same ref_table, ref_id and
 * kind) are skipped, so a run cut off by `deadline` resumes where it stopped
 * and a later run reaches complete: true. Safe to run any number of times.
 * Sends nothing: no push, no text, no follow-up started or stopped. Starts no
 * new row past `deadline` (ms epoch) and then says so (complete: false);
 * copyFormStages runs only once everything else is in (complete).
 */
export async function backfill(onboardingId: number, opts: { deadline?: number } = {}): Promise<BackfillResult> {
  const deadline = opts.deadline ?? Number.POSITIVE_INFINITY;
  await ensureSchema();
  // The message kind CASE mirrors messageEventKind (lib/contactsShared.ts); alerts and the owner's own
  // texts (from the line's forward-to) are never projected, so they are not re-scanned every run.
  const { rows } = await sql<{ src: 'call' | 'message' | 'form'; sid: string | null; id: DbId | null }>`
    SELECT src, sid, id FROM (
      SELECT 'call' AS src, c.call_sid AS sid, NULL::bigint AS id, c.started_at AS at FROM phone_calls c
      WHERE c.onboarding_id = ${onboardingId}
        AND NOT EXISTS (SELECT 1 FROM contact_events e WHERE e.ref_table = 'phone_calls' AND e.ref_id = c.id AND e.kind = 'call')
      UNION ALL
      SELECT 'message', m.message_sid, NULL::bigint, m.created_at FROM phone_messages m
      WHERE m.onboarding_id = ${onboardingId} AND m.kind <> 'alert'
        AND NOT (m.direction = 'inbound' AND (EXISTS (
          SELECT 1 FROM phone_lines l WHERE l.onboarding_id = m.onboarding_id AND l.forward_to = m.from_number
        ) OR EXISTS (
          SELECT 1 FROM onboardings ob WHERE ob.id = m.onboarding_id AND ob.proof_v2 ->> 'ownerMobile' = m.from_number
        )))
        AND NOT EXISTS (
          SELECT 1 FROM contact_events e WHERE e.ref_table = 'phone_messages' AND e.ref_id = m.id
            AND e.kind = CASE WHEN m.direction = 'inbound' THEN 'text_in' WHEN m.kind = 'sequence' THEN 'sequence'
                              WHEN m.kind = 'reminder' THEN 'reminder' ELSE 'text_out' END
        )
      UNION ALL
      SELECT 'form', NULL::text, f.id, f.created_at FROM form_submissions f
      WHERE f.onboarding_id = ${onboardingId} AND NOT f.is_test
        AND NOT EXISTS (SELECT 1 FROM contact_events e WHERE e.ref_table = 'form_submissions' AND e.ref_id = f.id AND e.kind = 'form')
    ) s
    ORDER BY at, src;`;
  const out: BackfillResult = { onboardingId, calls: 0, messages: 0, forms: 0, sequenceEmails: 0, stagesCopied: 0, complete: false };
  for (const r of rows) {
    if (Date.now() > deadline) return out;
    if (r.src === 'call' && r.sid) {
      if (await projectCall(r.sid, { replay: true })) out.calls += 1;
    } else if (r.src === 'message' && r.sid) {
      if (await projectMessage(r.sid, { replay: true })) out.messages += 1;
    } else if (r.src === 'form' && r.id !== null) {
      if (await projectForm(Number(r.id), { replay: true })) out.forms += 1;
    }
  }
  const emails = await projectSequenceEmails(onboardingId, deadline);
  out.sequenceEmails = emails.count;
  if (!emails.complete || Date.now() > deadline) return out;
  out.stagesCopied = await copyFormStages(onboardingId);
  out.complete = true;
  return out;
}

/** backfill for every client with any history, one after another; clients past the deadline come back complete: false. */
export async function backfillAll(opts: { deadline?: number } = {}): Promise<BackfillResult[]> {
  const deadline = opts.deadline ?? Number.POSITIVE_INFINITY;
  await ensureSchema();
  const { rows } = await sql<{ onboarding_id: number }>`
    SELECT DISTINCT onboarding_id FROM (
      SELECT onboarding_id FROM phone_calls
      UNION SELECT onboarding_id FROM phone_messages
      UNION SELECT onboarding_id FROM form_submissions WHERE NOT is_test
    ) s ORDER BY onboarding_id;`;
  const results: BackfillResult[] = [];
  for (const r of rows) {
    const id = Number(r.onboarding_id);
    if (Date.now() > deadline) {
      results.push({ onboardingId: id, calls: 0, messages: 0, forms: 0, sequenceEmails: 0, stagesCopied: 0, complete: false });
      continue;
    }
    results.push(await backfill(id, { deadline }));
  }
  return results;
}
