# Leads Inbox (Slice 4 of the PROOF Lead System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the AxeonPROOF Leads tab into a leads inbox for AxeonCORE and up: one contact per phone number or email, a stage (New, Contacted, Booked, Won, Lost), a timeline of every call, text and form with the recording attached, a reply box that texts from the client's tracked number, and a push notification when a lead texts, misses a call or sends the form. Not a CRM: no tasks, pipelines, custom fields or import.

**Architecture:** Two new tables, `contacts` and `contact_events`, are a projection of the source tables (`phone_calls`, `phone_messages`, `form_submissions`, `site_events`). Every producer (the Twilio webhooks, `sendClientSms`, the slice-2 lead route, the slice-3 cron) calls one projection function after it writes its own row; `upsertContactEvent` resolves the contact by E.164 phone or lowercase email, merges two contacts when one event proves they are the same person, and writes the event idempotently on `(ref_table, ref_id, kind, ref_part)`. Stage changes drive slice 3's sequences and write Won/Lost back to the tracker click so the close rate keeps learning. The client page receives pre-masked rows only. Push goes through `web-push` with VAPID keys; without a subscription, the owner gets a text through their own line.

**Tech Stack:** Next.js 15 App Router route handlers (`runtime = 'nodejs'`), `@vercel/postgres` via `lib/db.ts` (plus `db.connect()` for the one merge transaction), `web-push` 3.6.7, a plain service worker in `public/sw.js`, `tsx --test` + `node:assert/strict`, Tailwind + lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md` ("Architecture (all slices)", "Slice 4 design: the leads inbox", "Cross-slice decisions", "Slice 4 additions", "Execution order").

## Global Constraints

- Phone numbers are stored E.164 (`+15155550134`); emails lowercase and trimmed. Contacts are keyed by `(onboarding_id, phone)` and `(onboarding_id, email)` through the two partial unique indexes from the spec (`WHERE phone IS NOT NULL`, `WHERE email IS NOT NULL`). A withheld caller (`'unknown'`) never becomes a contact.
- `contact_events` is a projection. The source tables stay authoritative: a projection always re-reads its source row and is idempotent on `(ref_table, ref_id, kind, ref_part)`, so a Twilio retry, a second backfill, or a recording arriving later updates one row and never adds a second.
- The client browser receives pre-masked rows only (`DashboardContact`, `DashboardEvent` from `lib/contactsShared.ts`). A full phone number or full email never leaves the server for the client page or the admin preview. The one exception is the "Email" button, a server redirect to `mailto:`, so the address is never in the page payload. The words of a text or form are shown as the lead wrote them.
- Replies go through `sendClientSms(line, to, body, 'manual')` only, so the opt-out list and the `sms_status` gate apply. Manual replies obey quiet hours, 9 pm to 8 am client-local (spec, slice 4 "Compliance"): a reply typed in that window is held in `held_replies`, sent at 8 am by a cron, and the client is told so on screen.
- Recordings play only through the existing `/api/proof/recording/[callSid]` route. A recording URL never goes into an event payload, a push, a text or an email.
- Push payloads carry no phone number, no name and no message words: a fixed title such as "New text from a lead", one fixed line, and a link inside PROOF (`/proof?tab=leads&contact=<id>`).
- Won and Lost keep feeding the close rate: a contact matched to a tracker click writes the outcome onto that `site_events` row (`setLeadOutcome`); a contact with no click is counted directly in `observedCloseRate` / `markedForMonth`. Never both.
- The inbox is AxeonCORE and up (`inboxEnabled(tier)`). Essentials keeps today's Leads tab unchanged.
- Client-facing copy is plain language: "leads", "text them back", "quiet hours". Never "CRM", "pipeline", "workflow", "speed-to-lead".
- Every new table goes in both `lib/db.ts` `ensureSchema()` and `scripts/init-db.mjs`, `IF NOT EXISTS` only.
- Client-safe modules (`lib/contactsShared.ts`, `lib/pushShared.ts`) import nothing from `node:*`, `@/lib/db`, or any server module.
- Tests run with `tsx --test` and `node:assert/strict` and need no database or network; SQL is not unit-tested, pure helpers are.
- Commit after every task, repo style (`feat(inbox): …`), ending with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Nothing identifying leaves the server.** `toDashboardContact` and `toDashboardEvent` are the only shapes the page gets; push payloads and owner alert texts carry no number, name or message words. Pinned in Task 2 (the masking test serialises a contact and asserts neither the last four digits nor the email domain appear) and Task 9 (the push test rejects any phone-like digit run).
2. **The merge is the hard part.** When one event carries the phone of contact A and the email of contact B, the older row is kept, the newer row's events and held replies are re-pointed, the newer row is deleted before the kept row takes its key (no unique violation), and the furthest stage wins. Pinned in Task 2 (`mergeDecision` tests: older keeps, tie by id, stage, keys filled) and Task 4 (`mergeContacts` runs in one transaction in exactly that order).
3. **Projections are idempotent.** Twilio retries the status webhook, the recording arrives later, the backfill may run twice; none of these may add a second event or a second contact, or move a stage twice. Pinned in Task 3 (unique partial index on `(ref_table, ref_id, kind, ref_part)`) and Task 4 (`ON CONFLICT … DO UPDATE … RETURNING (xmax = 0)`; system stage changes and click matching run only on a fresh insert).
4. **A reply never goes out when it must not.** Opted out: refused, banner shown, box disabled. 10DLC pending: refused. 9 pm to 8 am: held to 8 am, never sent early. Pinned in Task 2 (`canReplyNow` at 7:59, 8:00, 8:59 pm, 9:00 pm, midnight, and a bad time zone) and Task 7 (`replyToContact` check order; the held-reply cron claims rows before sending).
5. **Won/Lost feed the close rate exactly once.** Stage changes write back to the matched click; unmatched contacts are counted in `lib/siteStats.ts`; matched ones are not counted twice. Pinned in Task 2 (`outcomeForStage`), Task 4 (`setStage` writes back only when the outcome changes) and Task 5 (`NOT EXISTS` click filter in both counts).

---

### Task 1: Confirm what slices 2 and 3 left behind

Slices 2 and 3 were planned in parallel with this one. This task changes no code: it checks the eight things this plan builds on, so no later task edits a function that is named differently.

**Files:** none modified.

**Interfaces assumed (verify each):**

| # | Assumption | Check | Used in |
|---|---|---|---|
| A1 | Table `form_submissions (id BIGSERIAL, onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, ip_hash, created_at)`; `phone` E.164 or null, `email` lowercase or null. | `grep -n "form_submissions" lib/db.ts` | Tasks 4, 6 |
| A2 | `phone_messages.kind` CHECK allows `'text_back','manual','inbound','alert','sequence','confirm','reminder'`, and `sendClientSms(line, to, body, kind)` accepts `'alert'`, `'sequence'`, `'confirm'`, `'reminder'` as well as `'text_back'`, `'manual'`. | `grep -n "kind IN" lib/db.ts` and `grep -n "export async function sendClientSms" lib/phoneLines.ts` | Tasks 4, 6, 10 |
| A3 | `phone_calls.direction TEXT ('inbound','connect')` and `phone_calls.lead_id BIGINT`; `phone_lines.time_zone TEXT DEFAULT 'America/Chicago'`; `PhoneLine` has `timeZone: string`. | `grep -n "direction\|lead_id\|time_zone" lib/db.ts` and `grep -n "timeZone" lib/phoneShared.ts` | Tasks 4, 7, 11 |
| A4 | The slice-2 lead route is `app/api/lead/route.ts`; it writes `form_submissions` and runs the alerts inside `after()`. The owner alert is one function, assumed `sendLeadAlerts(onboarding, line, submission)` in `lib/leadAlerts.ts`, which sends the alert email and calls `sendClientSms(line, line.forwardTo, <body>, 'alert')`. | `grep -rn "'alert')" lib app` | Tasks 6, 10 |
| A5 | Slice 2 writes a call-connect call through `recordCall(...)` from a status callback route (assumed `app/api/phone/connect/status/route.ts`). | `grep -rn "recordCall(" app` | Task 6 |
| A6 | `lib/sequences.ts` exports `startRun(onboardingId: number, kind, contact: { phone: string \| null; email: string \| null; name: string \| null }, ref: { table: string; id: number })` and `stopRunsFor(onboardingId: number, who: { phone?: string \| null; email?: string \| null; kinds?: SequenceKind[] }, reason: string)`, with `SequenceKind` including `'new_lead'`, `'quote'`, `'review'`. | `grep -n "export async function startRun\|export async function stopRunsFor\|SequenceKind" lib/sequences.ts` | Task 4 |
| A7 | The slice-3 cron `app/api/cron/sequences/route.ts` sends an email step with `sendSequenceEmail(...)` and has the run in scope as `run` with `id`, `onboardingId`, `step`, `contactPhone`, `contactEmail`, `contactName`. SMS steps go through `sendClientSms(..., 'sequence')`. | `grep -n "sendSequenceEmail\|sendClientSms" app/api/cron/sequences/route.ts` | Task 6 |
| A8 | `POST /api/proof/leads/stage` exists (`app/api/proof/leads/stage/route.ts`) with actions `quote_sent`, `contacted`, `booked`, `won`, `lost`, and keeps the stage in a temporary table assumed `lead_stages (onboarding_id, ref_table, ref_id, stage, updated_at)`, written and read by helpers in slice-3 code. | `grep -rn "lead_stages\|leads/stage" lib app components scripts` | Tasks 4, 8, 12 |

- [ ] **Step 1: Run every check in the table**

Run each command from the repo root. Next to each row, write down the real name.

- [ ] **Step 2: Carry any difference into the later tasks**

If a name differs (for example the alert function is `alertOwner` in `lib/leadIntake.ts`, or the temporary stage table is `lead_stage_marks`), use the real name wherever this plan writes the assumed one, in the tasks listed in the last column. Behaviour does not change: the calls, arguments and order stay as written. If something is missing entirely (no `time_zone` column, no `direction` column, no `lib/sequences.ts`), stop: finish that part of slice 2 or 3 first; this plan does not re-implement it.

No commit: nothing changed.

---

### Task 2: Client-safe inbox rules (`lib/contactsShared.ts`)

**Files:**
- Create: `lib/contactsShared.ts`
- Test: `lib/contactsShared.test.ts`
- Modify: `package.json` (add the `test:inbox` script)

**Interfaces:**
- Consumes: `callerKey`, `formatCallLength`, `maskNumber`, `SMS_MAX_CHARS`, `CallOutcome` (`lib/phoneShared.ts`); `buttonLabel`, `campaignLabel` (`lib/projectsShared.ts`); `TIER_RANK`, `OnboardingTier` (`data/onboardingItems.ts`).
- Produces (all exported):
  - Types `ContactStage`, `ContactAction`, `ContactSource`, `ContactEventKind`, `EventPayload`, `SequenceKind`, `Contact`, `ContactEvent`, `MergePlan`, `DashboardContact`, `DashboardEvent`, `HeldReply`, `DashboardContactView`, `DashboardInbox`, `ReplyRefusal`, `ReplyWindow`.
  - Constants `CONTACT_STAGES`, `STAGE_LABELS`, `CONTACT_ACTIONS`, `CONTACT_SOURCES`, `CONTACT_EVENT_KINDS`, `CLICK_ATTACH_MINUTES` (10), `OWNER_TEXT_THROTTLE_MINUTES` (30), `QUIET_START_HOUR` (21), `QUIET_END_HOUR` (8), `DEFAULT_TIME_ZONE`, `REPLY_REFUSALS`, `REPLY_REFUSAL_COPY`.
  - `isContactStage(v)`, `isContactAction(v)`, `isReplyRefusal(v)`, `inboxEnabled(tier)`.
  - `normalizeEmail(raw): string | null`, `contactKeyFor({ phone?, email? }): { phone: string | null; email: string | null } | null`, `cleanName(raw): string | null`, `parseContactId(raw): number | null`.
  - `stageAfterAction(current, action): ContactStage`, `nextStage(current, proposed, by: 'client' | 'system'): ContactStage | null`, `systemStageFor(kind, payload): ContactStage | null`, `outcomeForStage(stage): 'won' | 'lost' | null`, `sequenceEffects(action, changedTo: ContactStage | null): { stop: SequenceKind[]; start: SequenceKind[] }`, `noteForAction(action): string`.
  - `mergeDecision(a: Contact, b: Contact): MergePlan`.
  - `messageEventKind(direction, messageKind): ContactEventKind | null`, `sourceForKind(kind): ContactSource`, `isLeadActivity(kind, payload): boolean`, `eventVerb(kind): string`, `eventSummary(kind, payload): string`.
  - `maskEmail(email)`, `shortName(name)`, `contactWho({ phone, email })`, `sourceLabelFor(contact)`, `formatWhen(iso)`, `relativeWhen(iso, now?)`.
  - `toDashboardContact(contact, last, optedOut): DashboardContact`, `toDashboardEvent(event): DashboardEvent`.
  - `encodeCursor(at, id): string`, `decodeCursor(raw): { at: string; id: number } | null`.
  - `canReplyNow(now: Date, timeZone: string): ReplyWindow`, `quietNotice(sendAtIso, timeZone, queued: boolean): string`, `validateReplyBody(raw): { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' }`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/contactsShared.test.ts
// Run with: npm run test:inbox   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canReplyNow, cleanName, contactKeyFor, decodeCursor, encodeCursor, eventSummary, inboxEnabled, isLeadActivity, maskEmail,
  mergeDecision, messageEventKind, nextStage, normalizeEmail, outcomeForStage, parseContactId, quietNotice, relativeWhen,
  sequenceEffects, shortName, sourceForKind, stageAfterAction, systemStageFor, toDashboardContact, toDashboardEvent,
  validateReplyBody, type Contact, type ContactEvent,
} from './contactsShared';

const base: Contact = {
  id: 1, onboardingId: 7, phone: '+15155550134', email: null, name: null, stage: 'new', source: 'call',
  utmSource: null, utmMedium: null, utmCampaign: null,
  firstSeenAt: '2026-10-01T15:00:00.000Z', lastActivityAt: '2026-10-01T15:00:00.000Z', stageChangedAt: null,
};
const contact = (over: Partial<Contact>): Contact => ({ ...base, ...over });
const event = (over: Partial<ContactEvent>): ContactEvent => ({
  id: 10, contactId: 1, onboardingId: 7, kind: 'call', refTable: 'phone_calls', refId: 5, refPart: 0, summary: '', payload: {},
  createdAt: '2026-10-01T15:00:00.000Z', ...over,
});

test('contactKeyFor: E.164 phone and lowercase email, nothing for a withheld caller or junk', () => {
  assert.deepEqual(contactKeyFor({ phone: '(515) 555-0134', email: ' Sarah@Example.COM ' }), { phone: '+15155550134', email: 'sarah@example.com' });
  assert.deepEqual(contactKeyFor({ email: 'a@b.co' }), { phone: null, email: 'a@b.co' });
  assert.deepEqual(contactKeyFor({ phone: '+447700900123' }), { phone: '+447700900123', email: null });
  assert.equal(contactKeyFor({ phone: 'anonymous' }), null);
  assert.equal(contactKeyFor({ phone: 'unknown' }), null);
  assert.equal(contactKeyFor({ phone: '', email: 'nope' }), null);
  assert.equal(contactKeyFor({}), null);
  assert.equal(normalizeEmail('x@y'), null);
  assert.equal(normalizeEmail(42), null);
});

test('names and ids are cleaned', () => {
  assert.equal(cleanName('  Mike   Rogers '), 'Mike Rogers');
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName('x'.repeat(200))?.length, 80);
  assert.equal(parseContactId('42'), 42);
  assert.equal(parseContactId(42), 42);
  assert.equal(parseContactId('0'), null);
  assert.equal(parseContactId('4.2'), null);
  assert.equal(parseContactId('1; drop'), null);
  assert.equal(parseContactId(undefined), null);
});

test('the system only moves a contact forward; the client can move it anywhere', () => {
  assert.equal(nextStage('new', 'contacted', 'system'), 'contacted');
  assert.equal(nextStage('booked', 'contacted', 'system'), null);
  assert.equal(nextStage('won', 'booked', 'system'), null);
  assert.equal(nextStage('lost', 'contacted', 'system'), null);
  assert.equal(nextStage('contacted', 'contacted', 'system'), null);
  assert.equal(nextStage('won', 'new', 'client'), 'new');
  assert.equal(nextStage('won', 'won', 'client'), null);
});

test('Quote sent moves a new lead to Contacted and never pulls a later stage back', () => {
  assert.equal(stageAfterAction('new', 'quote_sent'), 'contacted');
  assert.equal(stageAfterAction('booked', 'quote_sent'), 'booked');
  assert.equal(stageAfterAction('new', 'won'), 'won');
});

test('what moves a stage by itself: an answered call, a typed text, a booking', () => {
  assert.equal(systemStageFor('call', { outcome: 'answered' }), 'contacted');
  assert.equal(systemStageFor('call', { outcome: 'missed' }), null);
  assert.equal(systemStageFor('text_out', { messageKind: 'manual' }), 'contacted');
  assert.equal(systemStageFor('text_out', { messageKind: 'text_back' }), null);
  assert.equal(systemStageFor('booking', {}), 'booked');
  assert.equal(systemStageFor('form', {}), null);
});

test('stages drive the follow-ups', () => {
  assert.deepEqual(sequenceEffects('quote_sent', 'contacted'), { stop: ['new_lead'], start: ['quote'] });
  assert.deepEqual(sequenceEffects('contacted', 'contacted'), { stop: ['new_lead'], start: [] });
  assert.deepEqual(sequenceEffects('booked', 'booked'), { stop: ['new_lead', 'quote'], start: [] });
  assert.deepEqual(sequenceEffects('won', 'won'), { stop: ['new_lead', 'quote'], start: ['review'] });
  assert.deepEqual(sequenceEffects('lost', 'lost'), { stop: ['new_lead', 'quote'], start: [] });
  assert.deepEqual(sequenceEffects('won', null), { stop: [], start: [] });
  assert.deepEqual(sequenceEffects('new', 'new'), { stop: [], start: [] });
});

test('only Won and Lost are outcomes for the close rate (Review Focus 5)', () => {
  assert.equal(outcomeForStage('won'), 'won');
  assert.equal(outcomeForStage('lost'), 'lost');
  assert.equal(outcomeForStage('booked'), null);
  assert.equal(outcomeForStage('new'), null);
});

test('mergeDecision keeps the older contact and takes the best of both (Review Focus 2)', () => {
  const older = contact({ id: 9, phone: '+15155550134', firstSeenAt: '2026-10-01T15:00:00.000Z', lastActivityAt: '2026-10-02T15:00:00.000Z' });
  const newer = contact({
    id: 4, phone: null, email: 'sarah@example.com', name: 'Sarah K', stage: 'booked', source: 'form', stageChangedAt: '2026-10-06T10:00:00.000Z',
    utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'spring', firstSeenAt: '2026-10-05T15:00:00.000Z', lastActivityAt: '2026-10-06T15:00:00.000Z',
  });
  const plan = mergeDecision(newer, older);
  assert.equal(plan.keepId, 9);
  assert.equal(plan.dropId, 4);
  assert.equal(plan.merged.phone, '+15155550134');
  assert.equal(plan.merged.email, 'sarah@example.com');
  assert.equal(plan.merged.name, 'Sarah K');
  assert.equal(plan.merged.stage, 'booked');
  assert.equal(plan.merged.stageChangedAt, '2026-10-06T10:00:00.000Z');
  assert.equal(plan.merged.source, 'call');
  assert.equal(plan.merged.utmSource, 'google');
  assert.equal(plan.merged.firstSeenAt, '2026-10-01T15:00:00.000Z');
  assert.equal(plan.merged.lastActivityAt, '2026-10-06T15:00:00.000Z');
});

test('mergeDecision: same first-seen time keeps the lower id; between Won and Lost the later mark wins', () => {
  const a = contact({ id: 3, stage: 'won', stageChangedAt: '2026-10-03T00:00:00.000Z' });
  const b = contact({ id: 2, phone: null, email: 'b@example.com', stage: 'lost', stageChangedAt: '2026-10-04T00:00:00.000Z' });
  const plan = mergeDecision(a, b);
  assert.equal(plan.keepId, 2);
  assert.equal(plan.merged.stage, 'lost');
  assert.equal(plan.merged.phone, '+15155550134');
});

test('which texts become which timeline events', () => {
  assert.equal(messageEventKind('inbound', 'inbound'), 'text_in');
  assert.equal(messageEventKind('outbound', 'alert'), null);
  assert.equal(messageEventKind('outbound', 'sequence'), 'sequence');
  assert.equal(messageEventKind('outbound', 'reminder'), 'reminder');
  assert.equal(messageEventKind('outbound', 'text_back'), 'text_out');
  assert.equal(messageEventKind('outbound', 'manual'), 'text_out');
  assert.equal(messageEventKind('outbound', 'confirm'), 'text_out');
  assert.equal(sourceForKind('text_in'), 'text');
  assert.equal(sourceForKind('form'), 'form');
});

test('automatic sends and bookkeeping do not count as the lead doing something', () => {
  assert.equal(isLeadActivity('call', {}), true);
  assert.equal(isLeadActivity('text_out', { automatic: false }), true);
  assert.equal(isLeadActivity('text_out', { automatic: true }), false);
  assert.equal(isLeadActivity('sequence', {}), false);
  assert.equal(isLeadActivity('alert', {}), false);
  assert.equal(isLeadActivity('note', {}), false);
});

test('one-line summaries', () => {
  assert.equal(eventSummary('call', { outcome: 'missed', textedBack: true }), 'missed, texted back');
  assert.equal(eventSummary('call', { outcome: 'missed', textedBack: false }), 'missed');
  assert.equal(eventSummary('call', { outcome: 'answered', durationSeconds: 134 }), 'answered · 2:14');
  assert.equal(eventSummary('call', { outcome: 'answered', durationSeconds: 134, direction: 'connect' }), 'you called them back · 2:14');
  assert.equal(eventSummary('call', { outcome: 'missed', direction: 'connect' }), 'call-back did not connect');
  assert.equal(eventSummary('text_in', { body: 'still open Saturday?' }), '"still open Saturday?"');
  assert.equal(eventSummary('text_in', { body: 'x'.repeat(80) }), `"${'x'.repeat(59)}…"`);
  assert.equal(eventSummary('text_out', { automatic: true, messageKind: 'text_back' }), 'texted back automatically');
  assert.equal(eventSummary('text_out', { automatic: false, body: 'On my way' }), '"On my way"');
  assert.equal(eventSummary('form', { message: 'water heater quote' }), '"water heater quote"');
  assert.equal(eventSummary('form', {}), 'sent your form');
  assert.equal(eventSummary('click', { name: 'call', path: '/services' }), 'tapped call button on services');
  assert.equal(eventSummary('sequence', { channel: 'email' }), 'follow-up email sent');
  assert.equal(eventSummary('note', { text: 'Marked Won' }), 'Marked Won');
});

test('toDashboardContact masks the number and the email (Review Focus 1)', () => {
  const both = toDashboardContact(contact({ email: 'sarah.k@example.com', name: 'Sarah Kim' }), { kind: 'call', summary: 'missed, texted back' }, false);
  const json = JSON.stringify(both);
  assert.equal(both.who, '(515) 555-01··');
  assert.doesNotMatch(json, /0134/);
  assert.doesNotMatch(json, /\+1515/);
  assert.doesNotMatch(json, /example\.com/);
  assert.equal(both.lastVerb, 'Called');
  assert.equal(both.lastSummary, 'missed, texted back');
  assert.equal(both.hasEmail, true);
  const emailOnly = toDashboardContact(contact({ phone: null, email: 'sarah.k@example.com', source: 'form' }), null, false);
  assert.equal(emailOnly.who, 'sarah.k@…');
  assert.equal(emailOnly.hasPhone, false);
  assert.equal(emailOnly.sourceLabel, 'Your website form');
  assert.equal(toDashboardContact(contact({ utmSource: 'google', utmMedium: 'cpc' }), null, true).sourceLabel, 'Google Ads');
  assert.equal(maskEmail('averyveryverylongname@x.co'), 'averyveryver@…');
  assert.equal(shortName('Mike Rogers'), 'Mike R.');
  assert.equal(shortName('Cher'), 'Cher');
  assert.equal(shortName(null), null);
});

test('toDashboardEvent: calls carry the sid for the recording route, texts their words, forms their fields', () => {
  const call = toDashboardEvent(event({ kind: 'call', summary: 'answered · 2:14', payload: { callSid: 'CA1', outcome: 'answered', durationSeconds: 134, hasRecording: true } }));
  assert.deepEqual(call.call, { callSid: 'CA1', outcome: 'answered', durationSeconds: 134, hasRecording: true });
  assert.equal(call.text, null);
  const typed = toDashboardEvent(event({ kind: 'text_out', payload: { body: 'On my way', automatic: false, messageKind: 'manual' } }));
  assert.equal(typed.text, 'On my way');
  assert.equal(typed.automatic, false);
  const email = toDashboardEvent(event({ kind: 'sequence', payload: { channel: 'email', subject: 'Following up' } }));
  assert.equal(email.text, null);
  assert.equal(email.automatic, true);
  const form = toDashboardEvent(event({ kind: 'form', payload: { name: 'Sarah', message: 'Leaky faucet', page: '/contact' } }));
  assert.deepEqual(form.fields, [{ label: 'Name', value: 'Sarah' }, { label: 'Message', value: 'Leaky faucet' }, { label: 'Page', value: 'contact' }]);
});

test('cursors round-trip and reject junk', () => {
  const c = encodeCursor('2026-10-13T14:05:00.123Z', 42);
  assert.deepEqual(decodeCursor(c), { at: '2026-10-13T14:05:00.123Z', id: 42 });
  assert.equal(decodeCursor('abc'), null);
  assert.equal(decodeCursor('1_0'), null);
  assert.equal(decodeCursor(null), null);
});

test('canReplyNow: quiet from 9 pm to 8 am Central, held to 8 am (Review Focus 4)', () => {
  // October 2026 is CDT, UTC-5.
  assert.deepEqual(canReplyNow(new Date('2026-10-13T13:00:00Z'), 'America/Chicago'), { ok: true }); // 8:00 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T01:59:00Z'), 'America/Chicago'), { ok: true }); // 8:59 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T02:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 9:00 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T02:30:45Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 9:30 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-13T12:59:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-13T13:00:00.000Z' }); // 7:59 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T05:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // midnight
  // A wrong zone falls back to Central rather than throwing.
  assert.deepEqual(canReplyNow(new Date('2026-10-14T02:00:00Z'), 'Mars/Olympus'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' });
  assert.match(quietNotice('2026-10-14T13:00:00.000Z', 'America/Chicago', true), /Wed 8:00\sAM/);
});

test('reply bodies: trimmed, not empty, at most two texts long', () => {
  assert.deepEqual(validateReplyBody('  On my way  '), { ok: true, body: 'On my way' });
  assert.deepEqual(validateReplyBody('   '), { ok: false, reason: 'empty' });
  assert.deepEqual(validateReplyBody(7), { ok: false, reason: 'empty' });
  assert.deepEqual(validateReplyBody('x'.repeat(321)), { ok: false, reason: 'too_long' });
});

test('relativeWhen in Central time', () => {
  const now = new Date('2026-10-13T19:00:00Z'); // 2:00 pm CDT, a Tuesday
  assert.equal(relativeWhen('2026-10-13T18:59:40Z', now), 'just now');
  assert.equal(relativeWhen('2026-10-13T18:58:00Z', now), '2 min ago');
  assert.match(relativeWhen('2026-10-13T14:05:00Z', now), /^9:05\sAM$/);
  assert.equal(relativeWhen('2026-10-12T14:05:00Z', now), 'Mon');
  assert.equal(relativeWhen('2026-09-30T14:05:00Z', now), 'Sep 30');
});

test('the inbox is AxeonCORE and up', () => {
  assert.equal(inboxEnabled('essentials'), false);
  assert.equal(inboxEnabled('axeoncore'), true);
  assert.equal(inboxEnabled('axeongrowth'), true);
});
```

- [ ] **Step 2: Add the test script and run it to see it fail**

In `package.json` `scripts`, after `test:phone`, add:

```json
    "test:inbox": "tsx --test lib/contactsShared.test.ts lib/pushShared.test.ts",
```

`lib/pushShared.test.ts` arrives in Task 9; until then run the one file:

Run: `npx tsx --test lib/contactsShared.test.ts`
Expected: FAIL, `Cannot find module './contactsShared'`.

- [ ] **Step 3: Write the module**

```ts
// lib/contactsShared.ts
// The leads inbox (slice 4 of the PROOF lead system): one contact per phone
// number or email per client, a stage, and a timeline of every call, text,
// form, booking and chat. Types and pure rules shared by the server
// (lib/contacts.ts), the API routes and the PROOF Leads tab. Client-safe: no
// Node imports, no database. Identity (phone, email) is masked here before
// anything reaches a browser; the words of a text or form are shown as written.
import { TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { callerKey, formatCallLength, maskNumber, SMS_MAX_CHARS, type CallOutcome } from '@/lib/phoneShared';
import { buttonLabel, campaignLabel } from '@/lib/projectsShared';

// ───────────────────────────── Vocabulary ─────────────────────────────

export const CONTACT_STAGES = ['new', 'contacted', 'booked', 'won', 'lost'] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];
export const isContactStage = (v: unknown): v is ContactStage => typeof v === 'string' && (CONTACT_STAGES as readonly string[]).includes(v);
export const STAGE_LABELS: Record<ContactStage, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', won: 'Won', lost: 'Lost' };

/** What the client can tap on a contact: every stage, plus 'quote_sent', which is not a stage (it starts the quote follow-up). */
export const CONTACT_ACTIONS = ['new', 'contacted', 'quote_sent', 'booked', 'won', 'lost'] as const;
export type ContactAction = (typeof CONTACT_ACTIONS)[number];
export const isContactAction = (v: unknown): v is ContactAction => typeof v === 'string' && (CONTACT_ACTIONS as readonly string[]).includes(v);

/** How the person first reached the client. 'click' = a tap on the site's call or text button, then that call or text. */
export const CONTACT_SOURCES = ['call', 'text', 'form', 'chat', 'booking', 'click', 'messenger', 'instagram'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_EVENT_KINDS = [
  'call', 'text_in', 'text_out', 'form', 'booking', 'chat', 'click', 'note', 'alert', 'sequence', 'reminder', 'messenger', 'instagram',
] as const;
export type ContactEventKind = (typeof CONTACT_EVENT_KINDS)[number];

/** The facts of one event, copied from its source row. Never a recording URL. */
export type EventPayload = Record<string, unknown>;

/** The slice-3 sequences the inbox starts and stops. */
export type SequenceKind = 'new_lead' | 'quote' | 'review';

export interface Contact {
  id: number;
  onboardingId: number;
  /** E.164 or null. */
  phone: string | null;
  /** Lowercase or null. */
  email: string | null;
  name: string | null;
  stage: ContactStage;
  source: ContactSource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  firstSeenAt: string;
  lastActivityAt: string;
  stageChangedAt: string | null;
}

export interface ContactEvent {
  id: number;
  contactId: number;
  onboardingId: number;
  kind: ContactEventKind;
  refTable: string | null;
  refId: number | null;
  /** Splits one source row into several events (a sequence run's steps). 0 for everything else. */
  refPart: number;
  summary: string;
  payload: EventPayload;
  createdAt: string;
}

/** A call or text this many minutes after a tap on the site's call or text button is that tap's person. */
export const CLICK_ATTACH_MINUTES = 10;
/** Without push, the owner gets at most one text per lead in this many minutes. */
export const OWNER_TEXT_THROTTLE_MINUTES = 30;
/** Manual replies typed from 9 pm to 8 am client-local wait until 8 am (spec, slice 4 "Compliance"). */
export const QUIET_START_HOUR = 21;
export const QUIET_END_HOUR = 8;
export const DEFAULT_TIME_ZONE = 'America/Chicago';

export const inboxEnabled = (tier: OnboardingTier): boolean => TIER_RANK[tier] >= TIER_RANK.axeoncore;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
};

// ───────────────────────────── Identity ─────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

/** The two keys a contact can be found by. Null when the event identifies nobody (a withheld caller, a form with neither). */
export function contactKeyFor(input: { phone?: unknown; email?: unknown }): { phone: string | null; email: string | null } | null {
  const rawPhone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const key = rawPhone ? callerKey(rawPhone) : 'unknown';
  const phone = key === 'unknown' ? null : key;
  const email = normalizeEmail(input.email);
  return phone || email ? { phone, email } : null;
}

export function cleanName(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  return s || null;
}

export function parseContactId(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d{1,15}$/.test(raw) ? Number(raw) : Number.NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ───────────────────────────── Stages ─────────────────────────────

const STAGE_RANK: Record<ContactStage, number> = { new: 0, contacted: 1, booked: 2, won: 3, lost: 3 };

export function stageAfterAction(current: ContactStage, action: ContactAction): ContactStage {
  if (action === 'quote_sent') return current === 'new' ? 'contacted' : current;
  return action;
}

/**
 * The stage to move to, or null for no change. The client can move a contact
 * anywhere (a mis-tap must be undoable). Code only moves forward and never
 * touches a Won or Lost contact.
 */
export function nextStage(current: ContactStage, proposed: ContactStage, by: 'client' | 'system'): ContactStage | null {
  if (proposed === current) return null;
  if (by === 'client') return proposed;
  if (current === 'won' || current === 'lost') return null;
  return STAGE_RANK[proposed] > STAGE_RANK[current] ? proposed : null;
}

/** The stage an event implies on its own: an answered call or a typed text means Contacted, a booking means Booked. */
export function systemStageFor(kind: ContactEventKind, payload: EventPayload): ContactStage | null {
  if (kind === 'call') return payload.outcome === 'answered' ? 'contacted' : null;
  if (kind === 'text_out') return payload.messageKind === 'manual' ? 'contacted' : null;
  if (kind === 'booking') return 'booked';
  return null;
}

export function outcomeForStage(stage: ContactStage): 'won' | 'lost' | null {
  return stage === 'won' || stage === 'lost' ? stage : null;
}

/**
 * Stages drive slice 3's sequences (spec, "Slice 4 additions"). Contacted stops
 * the new-lead follow-up; Booked, Won and Lost also stop the quote follow-up
 * (a quote is only sent after first contact, so Contacted leaves that one
 * running); Won starts the review request; "Quote sent" starts the quote follow-up.
 */
export function sequenceEffects(action: ContactAction, changedTo: ContactStage | null): { stop: SequenceKind[]; start: SequenceKind[] } {
  const stop: SequenceKind[] =
    changedTo === 'contacted' ? ['new_lead'] : changedTo === 'booked' || changedTo === 'won' || changedTo === 'lost' ? ['new_lead', 'quote'] : [];
  const start: SequenceKind[] = [];
  if (action === 'quote_sent') start.push('quote');
  if (changedTo === 'won') start.push('review');
  return { stop, start };
}

export function noteForAction(action: ContactAction): string {
  return action === 'quote_sent' ? 'Marked: quote sent' : `Marked ${STAGE_LABELS[action]}`;
}

// ───────────────────────────── Merging ─────────────────────────────

export interface MergePlan {
  keepId: number;
  dropId: number;
  merged: Pick<Contact, 'name' | 'phone' | 'email' | 'stage' | 'stageChangedAt' | 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'firstSeenAt' | 'lastActivityAt'>;
}

/**
 * Two contacts turned out to be one person (an event carried the phone of one
 * and the email of the other). The older row is kept (earlier first-seen, then
 * lower id); it keeps its first touch (source, campaign) and fills any gap from
 * the newer row. The furthest stage wins; between Won and Lost, the later mark.
 * If both rows had a phone, the kept row's phone stays and the other's events
 * still move over.
 */
export function mergeDecision(a: Contact, b: Contact): MergePlan {
  const aFirst = Date.parse(a.firstSeenAt);
  const bFirst = Date.parse(b.firstSeenAt);
  const [keep, drop] = aFirst < bFirst || (aFirst === bFirst && a.id < b.id) ? [a, b] : [b, a];
  const dropRank = STAGE_RANK[drop.stage];
  const keepRank = STAGE_RANK[keep.stage];
  const dropLater = Date.parse(drop.stageChangedAt ?? '') > Date.parse(keep.stageChangedAt ?? '');
  const stageFrom = dropRank > keepRank || (dropRank === keepRank && drop.stage !== keep.stage && dropLater) ? drop : keep;
  const utmFrom = keep.utmSource ? keep : drop.utmSource ? drop : keep;
  return {
    keepId: keep.id,
    dropId: drop.id,
    merged: {
      name: keep.name ?? drop.name,
      phone: keep.phone ?? drop.phone,
      email: keep.email ?? drop.email,
      stage: stageFrom.stage,
      stageChangedAt: stageFrom.stageChangedAt,
      source: keep.source,
      utmSource: utmFrom.utmSource,
      utmMedium: utmFrom.utmMedium,
      utmCampaign: utmFrom.utmCampaign,
      firstSeenAt: new Date(Math.min(aFirst, bFirst)).toISOString(),
      lastActivityAt: new Date(Math.max(Date.parse(a.lastActivityAt), Date.parse(b.lastActivityAt))).toISOString(),
    },
  };
}

// ───────────────────────────── Events ─────────────────────────────

/** phone_messages (direction, kind) → the timeline kind. Owner alerts are about a lead, not to one: null. */
export function messageEventKind(direction: 'inbound' | 'outbound', messageKind: string): ContactEventKind | null {
  if (direction === 'inbound') return 'text_in';
  if (messageKind === 'alert') return null;
  if (messageKind === 'sequence') return 'sequence';
  if (messageKind === 'reminder') return 'reminder';
  return 'text_out';
}

export function sourceForKind(kind: ContactEventKind): ContactSource {
  switch (kind) {
    case 'call':
    case 'form':
    case 'booking':
    case 'chat':
    case 'click':
    case 'messenger':
    case 'instagram':
      return kind;
    default:
      return 'text';
  }
}

/** Does this event mean the lead (or the owner, by hand) did something? Decides "last activity" and the list's one line. Mirrored in listInbox's SQL. */
export function isLeadActivity(kind: ContactEventKind, payload: EventPayload): boolean {
  if (kind === 'alert' || kind === 'note' || kind === 'sequence' || kind === 'reminder') return false;
  if (kind === 'text_out' && payload.automatic === true) return false;
  return true;
}

const VERBS: Record<ContactEventKind, string> = {
  call: 'Called', text_in: 'Texted', text_out: 'You texted', form: 'Form', booking: 'Booked', chat: 'Chat', click: 'Website',
  note: 'Note', alert: 'Alert', sequence: 'Follow-up', reminder: 'Reminder', messenger: 'Facebook', instagram: 'Instagram',
};
export const eventVerb = (kind: ContactEventKind): string => VERBS[kind];

const quote = (text: string | null, max = 60): string | null => (text ? `"${text.length > max ? `${text.slice(0, max - 1)}…` : text}"` : null);
const pageName = (path: string | null) => (!path || path === '/' ? 'home page' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

/** The one line under a name in the list and beside an event in the timeline. */
export function eventSummary(kind: ContactEventKind, p: EventPayload): string {
  switch (kind) {
    case 'call': {
      const connect = p.direction === 'connect';
      if (p.outcome === 'answered') {
        const len = formatCallLength(num(p.durationSeconds));
        return connect ? `you called them back · ${len}` : `answered · ${len}`;
      }
      if (connect) return 'call-back did not connect';
      return p.textedBack === true ? 'missed, texted back' : 'missed';
    }
    case 'text_in':
    case 'messenger':
    case 'instagram':
      return quote(str(p.body)) ?? 'sent a message';
    case 'text_out':
      if (p.automatic === true) return p.messageKind === 'text_back' ? 'texted back automatically' : 'automatic text sent';
      return quote(str(p.body)) ?? 'you texted them';
    case 'sequence':
      return p.channel === 'email' ? 'follow-up email sent' : 'follow-up text sent';
    case 'reminder':
      return 'appointment reminder sent';
    case 'form':
      return quote(str(p.message)) ?? 'sent your form';
    case 'booking': {
      const service = str(p.service);
      return service ? `booked ${service}` : 'booked a time';
    }
    case 'chat':
      return 'chatted on your site';
    case 'click':
      return `tapped ${buttonLabel(str(p.name) ?? 'call').toLowerCase()} on ${pageName(str(p.path))}`;
    case 'note':
      return str(p.text) ?? 'note';
    case 'alert':
      return p.channel === 'sms' ? 'you were sent a text about this lead' : 'you were notified';
  }
}

// ───────────────────────────── Display ─────────────────────────────

const ZONES = new Map<string, string>();
/** A usable IANA zone, or Central when the stored one is wrong. */
function zone(timeZone: string): string {
  const hit = ZONES.get(timeZone);
  if (hit) return hit;
  let ok = DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    ok = timeZone;
  } catch {
    ok = DEFAULT_TIME_ZONE;
  }
  ZONES.set(timeZone, ok);
  return ok;
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  const local = at > 0 ? email.slice(0, at) : email;
  return `${local.slice(0, 12)}@…`;
}

/** "Mike Rogers" → "Mike R.", for the list. */
export function shortName(name: string | null): string | null {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return null;
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[words.length - 1][0].toUpperCase()}.`;
}

export function contactWho(c: { phone: string | null; email: string | null }): string {
  if (c.phone) return maskNumber(c.phone);
  if (c.email) return maskEmail(c.email);
  return 'Unknown';
}

const SOURCE_LABELS: Record<ContactSource, string> = {
  call: 'Called your number', text: 'Texted your number', form: 'Your website form', chat: 'Your website chat',
  booking: 'Online booking', click: 'Your website', messenger: 'Facebook', instagram: 'Instagram',
};

/** "Google Ads: spring", "Your website form", "Called your number". */
export function sourceLabelFor(c: Pick<Contact, 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign'>): string {
  if (c.utmSource) return campaignLabel({ source: c.utmSource, medium: c.utmMedium ?? '', campaign: c.utmCampaign ?? '' });
  return SOURCE_LABELS[c.source];
}

/** "Oct 9, 2:05 PM" in Central time, like the rest of PROOF. */
export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "just now", "2 min ago", "9:05 AM" today, "Mon" this week, else "Sep 30". */
export function relativeWhen(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const ms = now.getTime() - then.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  if (day(then) === day(now)) return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(then);
  if (ms < 6 * 24 * 3_600_000) return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, weekday: 'short' }).format(then);
  return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, month: 'short', day: 'numeric' }).format(then);
}

/** One row of the inbox list, as the browser gets it: no full number, no full email. */
export interface DashboardContact {
  id: number;
  /** As the lead gave it or the client typed it. */
  name: string | null;
  /** Masked number, masked email, or "Unknown". */
  who: string;
  stage: ContactStage;
  sourceLabel: string;
  firstSeenAt: string;
  lastActivityAt: string;
  /** "Called", "Texted", "Form"; null before any event. */
  lastVerb: string | null;
  /** "missed, texted back", "\"still open Saturday?\"". */
  lastSummary: string | null;
  hasPhone: boolean;
  hasEmail: boolean;
  /** Replied STOP: no texts from this client's line. */
  optedOut: boolean;
}

export function toDashboardContact(c: Contact, last: { kind: ContactEventKind; summary: string } | null, optedOut: boolean): DashboardContact {
  return {
    id: c.id,
    name: c.name,
    who: contactWho(c),
    stage: c.stage,
    sourceLabel: sourceLabelFor(c),
    firstSeenAt: c.firstSeenAt,
    lastActivityAt: c.lastActivityAt,
    lastVerb: last ? eventVerb(last.kind) : null,
    lastSummary: last ? last.summary : null,
    hasPhone: c.phone !== null,
    hasEmail: c.email !== null,
    optedOut,
  };
}

/** One timeline entry as the browser gets it. */
export interface DashboardEvent {
  id: number;
  kind: ContactEventKind;
  at: string;
  verb: string;
  summary: string;
  /** Sent by Axeon on the client's behalf (text-back, follow-ups, reminders), not typed by anyone. */
  automatic: boolean;
  /** The words of a text or message, either direction. Null for everything else. */
  text: string | null;
  /** For calls: what the recording route needs. */
  call: { callSid: string; outcome: CallOutcome; durationSeconds: number | null; hasRecording: boolean } | null;
  /** For forms and bookings: what was submitted. */
  fields: Array<{ label: string; value: string }>;
}

const MESSAGE_KINDS: readonly ContactEventKind[] = ['text_in', 'text_out', 'sequence', 'reminder', 'messenger', 'instagram'];

function eventFields(kind: ContactEventKind, p: EventPayload): Array<{ label: string; value: string }> {
  const page = str(p.page);
  const startsAt = str(p.startsAt);
  const rows: Array<[string, string | null]> =
    kind === 'form'
      ? [['Name', str(p.name)], ['Message', str(p.message)], ['Page', page ? pageName(page) : null]]
      : kind === 'booking'
        ? [['Service', str(p.service)], ['When', startsAt ? formatWhen(startsAt) : null]]
        : [];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, value]) => ({ label, value }));
}

export function toDashboardEvent(e: ContactEvent): DashboardEvent {
  const p = e.payload;
  const isMessage = MESSAGE_KINDS.includes(e.kind) && p.channel !== 'email';
  return {
    id: e.id,
    kind: e.kind,
    at: e.createdAt,
    verb: eventVerb(e.kind),
    summary: e.summary || eventSummary(e.kind, p),
    automatic: p.automatic === true || e.kind === 'sequence' || e.kind === 'reminder',
    text: isMessage ? str(p.body) : null,
    call:
      e.kind === 'call' && typeof p.callSid === 'string'
        ? { callSid: p.callSid, outcome: p.outcome === 'answered' ? 'answered' : 'missed', durationSeconds: num(p.durationSeconds), hasRecording: p.hasRecording === true }
        : null,
    fields: eventFields(e.kind, p),
  };
}

/** A reply typed in quiet hours, waiting for 8 am; or one that could not go out. */
export interface HeldReply {
  id: number;
  body: string;
  sendAt: string;
  status: 'held' | 'failed';
}

export interface DashboardContactView {
  contact: DashboardContact;
  /** Oldest first, the latest 300. */
  events: DashboardEvent[];
  held: HeldReply[];
}

export interface DashboardInbox {
  contacts: DashboardContact[];
  nextCursor: string | null;
  /** The contact opened with ?contact=<id>, or null. */
  selected: DashboardContactView | null;
  /** The client's time zone, for the quiet-hours notice. */
  timeZone: string;
  /** Can replies go out: yes, waiting on carrier approval, or no tracked number. */
  texting: 'ready' | 'pending' | 'none';
}

/** "<ms>_<id>" of the last row on a page; the next page starts strictly after it. */
export function encodeCursor(at: string, id: number): string {
  return `${Date.parse(at)}_${id}`;
}

export function decodeCursor(raw: unknown): { at: string; id: number } | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{1,15})_(\d{1,15})$/.exec(raw);
  if (!m) return null;
  const id = Number(m[2]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { at: new Date(Number(m[1])).toISOString(), id };
}

// ───────────────────────────── Replies ─────────────────────────────

export type ReplyWindow = { ok: true } | { ok: false; sendAt: string };

function localClock(now: Date, timeZone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone(timeZone), hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { hour, minute };
}

/**
 * Can a typed reply go out now? From 9 pm to 8 am client-local it waits until
 * 8:00 am. On the two daylight-saving nights a year the held time can land an
 * hour off, never more.
 */
export function canReplyNow(now: Date, timeZone: string): ReplyWindow {
  const { hour, minute } = localClock(now, timeZone);
  if (hour >= QUIET_END_HOUR && hour < QUIET_START_HOUR) return { ok: true };
  const minutesToOpen = hour >= QUIET_START_HOUR ? (24 - hour + QUIET_END_HOUR) * 60 - minute : (QUIET_END_HOUR - hour) * 60 - minute;
  const sendAt = new Date(now.getTime() + minutesToOpen * 60_000);
  sendAt.setUTCSeconds(0, 0);
  return { ok: false, sendAt: sendAt.toISOString() };
}

export function quietNotice(sendAtIso: string, timeZone: string, queued: boolean): string {
  const when = new Intl.DateTimeFormat('en-US', { timeZone: zone(timeZone), weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(sendAtIso));
  return queued
    ? `Quiet hours (9 pm to 8 am): your text goes out ${when}.`
    : `It is quiet hours (9 pm to 8 am) where you are. A text sent now goes out ${when}.`;
}

export const REPLY_REFUSALS = ['empty', 'too_long', 'no_phone', 'no_line', 'sms_pending', 'opted_out', 'bad_number'] as const;
export type ReplyRefusal = (typeof REPLY_REFUSALS)[number];
export const isReplyRefusal = (v: unknown): v is ReplyRefusal => typeof v === 'string' && (REPLY_REFUSALS as readonly string[]).includes(v);

export const REPLY_REFUSAL_COPY: Record<ReplyRefusal, string> = {
  empty: 'Type a message first.',
  too_long: `Keep it under ${SMS_MAX_CHARS} characters so it arrives in one piece.`,
  no_phone: 'We only have an email for this person. Use the Email button instead.',
  no_line: 'Replies go out from your tracked number, and you do not have one yet.',
  sms_pending: 'Texting turns on once the phone carriers approve your number. We will tell you when.',
  opted_out: 'This person asked not to be texted.',
  bad_number: 'This number cannot get texts from your line.',
};

export function validateReplyBody(raw: unknown): { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' } {
  const body = typeof raw === 'string' ? raw.trim() : '';
  if (!body) return { ok: false, reason: 'empty' };
  if (body.length > SMS_MAX_CHARS) return { ok: false, reason: 'too_long' };
  return { ok: true, body };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsx --test lib/contactsShared.test.ts`
Expected: PASS, every test. Then `npm run lint` (clean).

- [ ] **Step 5: Commit**

```bash
git add lib/contactsShared.ts lib/contactsShared.test.ts package.json
git commit -m "feat(inbox): client-safe contact, stage, merge and quiet-hours rules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Tables (`contacts`, `contact_events`, `push_subscriptions`, `held_replies`)

**Files:**
- Modify: `lib/db.ts` (`ensureSchema()`, at the end of the async block, after the `plan_items` statements)
- Modify: `scripts/init-db.mjs` (before `console.log('Schema ready.');`)

**Interfaces:**
- Consumes: `onboardings(id)`, `client_accounts(id)` (existing).
- Produces: the four tables below, used by Tasks 4 to 11. `held_replies` is not in the spec's table list; it is the smallest thing that makes "held and sent at 8 am" true without bending slice 3's `sequence_runs`.

- [ ] **Step 1: Add the tables to `lib/db.ts`**

Inside `ensureSchema()`, after `await sql\`CREATE INDEX IF NOT EXISTS plan_items_onboarding_idx …\`;` and before the closing `})().catch(`, add:

```ts
      // The leads inbox (lib/contacts.ts, slice 4): one contact per phone or email
      // per client, and a projection of every call, text, form and click onto it.
      // The source tables stay the truth; contact_events exists so the inbox is one read.
      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id BIGSERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          phone TEXT,
          email TEXT,
          name TEXT,
          stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'booked', 'won', 'lost')),
          source TEXT NOT NULL CHECK (source IN ('call', 'text', 'form', 'chat', 'booking', 'click', 'messenger', 'instagram')),
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          stage_changed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT contacts_identity_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
        );
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_phone_uniq ON contacts (onboarding_id, phone) WHERE phone IS NOT NULL;`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_uniq ON contacts (onboarding_id, email) WHERE email IS NOT NULL;`;
      await sql`CREATE INDEX IF NOT EXISTS contacts_inbox_idx ON contacts (onboarding_id, last_activity_at DESC, id DESC);`;
      await sql`
        CREATE TABLE IF NOT EXISTS contact_events (
          id BIGSERIAL PRIMARY KEY,
          contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          kind TEXT NOT NULL CHECK (kind IN ('call', 'text_in', 'text_out', 'form', 'booking', 'chat', 'click', 'note', 'alert', 'sequence', 'reminder', 'messenger', 'instagram')),
          ref_table TEXT,
          ref_id BIGINT,
          ref_part INTEGER NOT NULL DEFAULT 0,
          summary TEXT NOT NULL DEFAULT '',
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS contact_events_client_time_idx ON contact_events (onboarding_id, created_at);`;
      await sql`CREATE INDEX IF NOT EXISTS contact_events_contact_time_idx ON contact_events (contact_id, created_at);`;
      // One event per source row and kind: Twilio retries and a second backfill update it instead of adding one.
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS contact_events_ref_uniq ON contact_events (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL;`;
      // Browsers that asked for lead notifications (lib/push.ts), one row per device.
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
          endpoint TEXT UNIQUE NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS push_subscriptions_account_idx ON push_subscriptions (account_id);`;
      // Replies typed during quiet hours (lib/inboxReply.ts), sent at 8 am by /api/cron/held-replies.
      await sql`
        CREATE TABLE IF NOT EXISTS held_replies (
          id BIGSERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          send_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'sending', 'sent', 'failed')),
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          sent_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS held_replies_due_idx ON held_replies (status, send_at);`;
      await sql`CREATE INDEX IF NOT EXISTS held_replies_contact_idx ON held_replies (contact_id);`;
```

- [ ] **Step 2: Mirror them in `scripts/init-db.mjs`**

Before `console.log('Schema ready.');` paste the same statements with the indentation of that file (two spaces, `await sql\`…\`;`), the same comments, in the same order. Nothing else changes.

- [ ] **Step 3: Check it**

Run: `npm run lint`
Expected: clean.

With a local database: `npm run db:init` then
`psql "$POSTGRES_URL" -c "\d contact_events"` shows `contact_events_ref_uniq` as `UNIQUE, btree (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL`, and `\d contacts` shows both partial unique indexes. Running `npm run db:init` a second time prints `Schema ready.` with no error.

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts scripts/init-db.mjs
git commit -m "feat(inbox): contacts, contact_events, push_subscriptions, held_replies tables

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The contacts module (`lib/contacts.ts`)

**Files:**
- Create: `lib/contacts.ts`

**Interfaces:**
- Consumes: Task 2 (`contactKeyFor`, `cleanName`, `eventSummary`, `isLeadActivity`, `mergeDecision`, `messageEventKind`, `nextStage`, `noteForAction`, `outcomeForStage`, `sequenceEffects`, `sourceForKind`, `stageAfterAction`, `systemStageFor`, `toDashboardContact`, `toDashboardEvent`, `encodeCursor`, `isContactAction`, `CLICK_ATTACH_MINUTES`, types); Task 3 tables; `setLeadOutcome` (`lib/siteStats.ts`); `startRun`, `stopRunsFor` (`lib/sequences.ts`, A6, loaded with a dynamic `import()`); `form_submissions` (A1); `phone_calls.direction`, `phone_calls.lead_id` (A3); `lead_stages` (A8).
- Produces:
  - `interface ContactEventInput { onboardingId: number; kind: ContactEventKind; refTable: string | null; refId: number | null; refPart?: number; phone?: string | null; email?: string | null; name?: string | null; source?: ContactSource; utm?: { source: string | null; medium: string | null; campaign: string | null } | null; summary: string; payload: EventPayload; createdAt: string }`
  - `interface UpsertResult { contactId: number; eventId: number; createdContact: boolean; insertedEvent: boolean }`
  - `upsertContactEvent(input: ContactEventInput): Promise<UpsertResult | null>` — the one entry point every producer uses.
  - `projectCall(callSid: string): Promise<UpsertResult | null>`, `projectMessage(messageSid: string): Promise<UpsertResult | null>`, `projectForm(formId: number): Promise<UpsertResult | null>`.
  - `getContact(onboardingId: number, contactId: number): Promise<Contact | null>`
  - `mergeContacts(onboardingId: number, aId: number, bId: number): Promise<Contact>`
  - `setStage(onboardingId: number, contactId: number, action: ContactAction, by: 'client' | 'system'): Promise<Contact | null>` (the brief's `setStage(contactId, stage, by)`, scoped by onboarding so a route can never touch another client's contact)
  - `setContactName(onboardingId: number, contactId: number, raw: unknown): Promise<Contact | null>`
  - `attachClickToContact(onboardingId: number, contactId: number, at: string, kind: 'call' | 'text_in'): Promise<number | null>`
  - `attachedClickIds(onboardingId: number, ids: number[]): Promise<Set<number>>`
  - `contactIdForRef(onboardingId: number, refTable: string, refId: number): Promise<number | null>`
  - `recordAlert(onboardingId: number, contactId: number, channel: 'sms' | 'push'): Promise<void>`, `alertedRecently(contactId: number, minutes: number): Promise<boolean>`
  - `listInbox(onboardingId: number, opts?: { limit?: number; cursor?: { at: string; id: number } | null }): Promise<{ contacts: DashboardContact[]; nextCursor: string | null }>`
  - `contactTimeline(onboardingId: number, contactId: number): Promise<DashboardContactView | null>`
  - `interface BackfillResult { onboardingId: number; calls: number; messages: number; forms: number; stagesCopied: number }`, `backfill(onboardingId: number): Promise<BackfillResult>`, `backfillAll(): Promise<BackfillResult[]>`

- [ ] **Step 1: Write the module**

```ts
// lib/contacts.ts
// The leads inbox, server side. `contacts` is one row per person (a phone number
// or an email, per client); `contact_events` is a projection of the source tables
// (phone_calls, phone_messages, form_submissions, site_events, and later bookings
// and chats) so the inbox is one indexed read. The source rows stay the truth:
// every project* function re-reads its source row and upserts on (ref_table,
// ref_id, kind, ref_part), so a retried webhook or a second backfill changes
// nothing. upsertContactEvent is the one entry point every producer calls.
// Server-only.
import { db, type VercelPoolClient } from '@vercel/postgres';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { setLeadOutcome } from '@/lib/siteStats';
import {
  CLICK_ATTACH_MINUTES, cleanName, contactKeyFor, encodeCursor, eventSummary, isContactAction, isLeadActivity, mergeDecision,
  messageEventKind, nextStage, noteForAction, outcomeForStage, sequenceEffects, sourceForKind, stageAfterAction, systemStageFor,
  toDashboardContact, toDashboardEvent,
  type Contact, type ContactAction, type ContactEvent, type ContactEventKind, type ContactSource, type ContactStage,
  type DashboardContact, type DashboardContactView, type EventPayload, type SequenceKind,
} from '@/lib/contactsShared';

// node-postgres hands back BIGSERIAL ids as strings and TIMESTAMPTZ as Date.
type DbId = number | string;
type DbTime = Date | string;
const iso = (t: DbTime): string => new Date(t).toISOString();

interface ContactRow {
  id: DbId;
  onboarding_id: number;
  phone: string | null;
  email: string | null;
  name: string | null;
  stage: ContactStage;
  source: ContactSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  first_seen_at: DbTime;
  last_activity_at: DbTime;
  stage_changed_at: DbTime | null;
}

const toContact = (r: ContactRow): Contact => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  phone: r.phone,
  email: r.email,
  name: r.name,
  stage: r.stage,
  source: r.source,
  utmSource: r.utm_source,
  utmMedium: r.utm_medium,
  utmCampaign: r.utm_campaign,
  firstSeenAt: iso(r.first_seen_at),
  lastActivityAt: iso(r.last_activity_at),
  stageChangedAt: r.stage_changed_at ? iso(r.stage_changed_at) : null,
});

interface EventRow {
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

const toEvent = (r: EventRow): ContactEvent => ({
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

// ───────────────────────────── Resolving and merging ─────────────────────────────

async function inTransaction<T>(work: (q: VercelPoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    const out = await work(client);
    await client.sql`COMMIT`;
    return out;
  } catch (err) {
    await client.sql`ROLLBACK`.catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fold two contacts into the older one (spec, "Dedupe rules"). One transaction,
 * in this order: re-point the events and held replies, delete the newer row,
 * then give the kept row the merged fields. Deleting first matters: the newer
 * row still holds the phone or email the kept row is about to take.
 */
export async function mergeContacts(onboardingId: number, aId: number, bId: number): Promise<Contact> {
  await ensureSchema();
  return inTransaction(async (q) => {
    const { rows } = await q.sql<ContactRow>`
      SELECT * FROM contacts WHERE onboarding_id = ${onboardingId} AND id IN (${aId}, ${bId}) ORDER BY id FOR UPDATE;`;
    if (rows.length < 2) {
      // A concurrent event already merged them; the survivor is the answer.
      if (!rows[0]) throw new Error('contacts: nothing to merge');
      return toContact(rows[0]);
    }
    const plan = mergeDecision(toContact(rows[0]), toContact(rows[1]));
    const m = plan.merged;
    await q.sql`UPDATE contact_events SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId};`;
    await q.sql`UPDATE held_replies SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId};`;
    await q.sql`DELETE FROM contacts WHERE id = ${plan.dropId};`;
    const { rows: kept } = await q.sql<ContactRow>`
      UPDATE contacts SET
        name = ${m.name}, phone = ${m.phone}, email = ${m.email},
        stage = ${m.stage}, stage_changed_at = ${m.stageChangedAt},
        source = ${m.source}, utm_source = ${m.utmSource}, utm_medium = ${m.utmMedium}, utm_campaign = ${m.utmCampaign},
        first_seen_at = ${m.firstSeenAt}, last_activity_at = ${m.lastActivityAt}
      WHERE id = ${plan.keepId}
      RETURNING *;`;
    return toContact(kept[0]);
  });
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
 * name it lacked; nobody found means a new contact.
 */
async function resolveContact(onboardingId: number, key: { phone: string | null; email: string | null }, seed: Seed, attempt = 0): Promise<{ contact: Contact; created: boolean }> {
  const [byPhone, byEmail] = await Promise.all([
    key.phone ? findByPhone(onboardingId, key.phone) : Promise.resolve(null),
    key.email ? findByEmail(onboardingId, key.email) : Promise.resolve(null),
  ]);
  if (byPhone && byEmail && byPhone.id !== byEmail.id) {
    return { contact: await mergeContacts(onboardingId, byPhone.id, byEmail.id), created: false };
  }
  const found = byPhone ?? byEmail;
  if (!found) {
    const { rows } = await sql<ContactRow>`
      INSERT INTO contacts (onboarding_id, phone, email, name, source, utm_source, utm_medium, utm_campaign, first_seen_at, last_activity_at)
      VALUES (${onboardingId}, ${key.phone}, ${key.email}, ${seed.name}, ${seed.source},
              ${seed.utm?.source ?? null}, ${seed.utm?.medium ?? null}, ${seed.utm?.campaign ?? null}, ${seed.at}, ${seed.at})
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    if (rows[0]) return { contact: toContact(rows[0]), created: true };
    // Another request created this person a moment ago: look again, once.
    if (attempt > 0) throw new Error('contacts: could not resolve a contact');
    return resolveContact(onboardingId, key, seed, attempt + 1);
  }
  try {
    const { rows } = await sql<ContactRow>`
      UPDATE contacts SET
        phone = COALESCE(phone, ${key.phone}),
        email = COALESCE(email, ${key.email}),
        name = COALESCE(name, ${seed.name})
      WHERE id = ${found.id}
      RETURNING *;`;
    return { contact: rows[0] ? toContact(rows[0]) : found, created: false };
  } catch (err) {
    // The phone or email was just taken by another contact: the next pass sees both and merges.
    if (isUniqueViolation(err) && attempt === 0) return resolveContact(onboardingId, key, seed, 1);
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
 * nobody (a withheld caller).
 */
export async function upsertContactEvent(input: ContactEventInput): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  const key = contactKeyFor({ phone: input.phone, email: input.email });
  if (!key) return null;
  await ensureSchema();
  const { contact, created } = await resolveContact(input.onboardingId, key, {
    name: cleanName(input.name),
    source: input.source ?? sourceForKind(input.kind),
    utm: input.utm ?? null,
    at: input.createdAt,
  });
  const ev = await insertEvent(
    contact.id,
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
      WHERE id = ${ev.contactId};`;
  }
  if (ev.inserted) {
    const proposed = systemStageFor(input.kind, input.payload);
    if (proposed) await setStage(input.onboardingId, ev.contactId, proposed, 'system');
    if (created && (input.kind === 'call' || input.kind === 'text_in')) {
      await attachClickToContact(input.onboardingId, ev.contactId, input.createdAt, input.kind);
    }
  }
  return { contactId: ev.contactId, eventId: ev.id, createdContact: created, insertedEvent: ev.inserted };
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
    WHERE id = ${contactId};`;
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

async function clickIdFor(contactId: number): Promise<number | null> {
  const { rows } = await sql<{ ref_id: DbId }>`
    SELECT ref_id FROM contact_events WHERE contact_id = ${contactId} AND kind = 'click' AND ref_table = 'site_events'
    ORDER BY created_at LIMIT 1;`;
  return rows[0] ? Number(rows[0].ref_id) : null;
}

/** The contact a source row was projected onto (slice 3's stage route still sends a source row). */
export async function contactIdForRef(onboardingId: number, refTable: string, refId: number): Promise<number | null> {
  await ensureSchema();
  const { rows } = await sql<{ contact_id: DbId }>`
    SELECT contact_id FROM contact_events WHERE onboarding_id = ${onboardingId} AND ref_table = ${refTable} AND ref_id = ${refId} LIMIT 1;`;
  return rows[0] ? Number(rows[0].contact_id) : null;
}

// ───────────────────────────── Stage ─────────────────────────────

async function applySequenceEffects(c: Contact, fx: { stop: SequenceKind[]; start: SequenceKind[] }): Promise<void> {
  if (fx.stop.length === 0 && fx.start.length === 0) return;
  try {
    // Loaded here, not at the top: lib/sequences.ts sends through lib/phoneLines.ts, which projects into this module.
    const { startRun, stopRunsFor } = await import('@/lib/sequences');
    if (fx.stop.length > 0) await stopRunsFor(c.onboardingId, { phone: c.phone, email: c.email, kinds: fx.stop }, `stage:${c.stage}`);
    for (const kind of fx.start) await startRun(c.onboardingId, kind, { phone: c.phone, email: c.email, name: c.name }, { table: 'contacts', id: c.id });
  } catch (err) {
    // A follow-up problem must not undo the client's tap.
    console.error('contacts: sequence change failed', c.id, err instanceof Error ? err.message : err);
  }
}

/**
 * Move a contact. The client can move it anywhere; code (an answered call, a
 * typed text, a booking) only moves it forward (nextStage). Then: a note on the
 * timeline for the client's own taps, the slice-3 follow-ups started or stopped,
 * and Won/Lost written onto the matched website tap so the close rate learns
 * from it (an unmatched contact is counted by lib/siteStats.ts directly).
 * Returns the contact as it now stands, or null if it is not this client's.
 */
export async function setStage(onboardingId: number, contactId: number, action: ContactAction, by: 'client' | 'system'): Promise<Contact | null> {
  const before = await getContact(onboardingId, contactId);
  if (!before) return null;
  const next = nextStage(before.stage, stageAfterAction(before.stage, action), by);
  let current = before;
  if (next) {
    const { rows } = await sql<ContactRow>`
      UPDATE contacts SET stage = ${next}, stage_changed_at = now()
      WHERE id = ${contactId} AND onboarding_id = ${onboardingId} AND stage = ${before.stage}
      RETURNING *;`;
    // Someone moved it in between; their move stands.
    if (!rows[0]) return getContact(onboardingId, contactId);
    current = toContact(rows[0]);
  }
  if (by === 'client' && (next || action === 'quote_sent')) {
    const text = noteForAction(action);
    await insertEvent(
      contactId,
      { onboardingId, kind: 'note', refTable: null, refId: null, refPart: 0, summary: text, payload: { text, action }, createdAt: new Date().toISOString() },
      'update',
    );
  }
  await applySequenceEffects(current, sequenceEffects(action, next));
  if (next && outcomeForStage(next) !== outcomeForStage(before.stage)) {
    const clickId = await clickIdFor(contactId);
    if (clickId) await setLeadOutcome(onboardingId, clickId, outcomeForStage(next));
  }
  return current;
}

export async function setContactName(onboardingId: number, contactId: number, raw: unknown): Promise<Contact | null> {
  await ensureSchema();
  const { rows } = await sql<ContactRow>`UPDATE contacts SET name = ${cleanName(raw)} WHERE id = ${contactId} AND onboarding_id = ${onboardingId} RETURNING *;`;
  return rows[0] ? toContact(rows[0]) : null;
}

// ───────────────────────────── Alerts ─────────────────────────────

export async function recordAlert(onboardingId: number, contactId: number, channel: 'sms' | 'push'): Promise<void> {
  const payload: EventPayload = { channel };
  await insertEvent(
    contactId,
    { onboardingId, kind: 'alert', refTable: null, refId: null, refPart: 0, summary: eventSummary('alert', payload), payload, createdAt: new Date().toISOString() },
    'update',
  );
}

export async function alertedRecently(contactId: number, minutes: number): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM contact_events
    WHERE contact_id = ${contactId} AND kind = 'alert' AND created_at > now() - make_interval(mins => ${Math.round(minutes)})
    LIMIT 1;`;
  return rows.length > 0;
}

// ───────────────────────────── Projections (one per source table) ─────────────────────────────

/** A call on the tracked line, or a slice-2 call-connect (whose lead is the form's phone, not the caller id). */
export async function projectCall(callSid: string): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{
    id: DbId; onboarding_id: number; call_sid: string; outcome: 'answered' | 'missed'; started_at: DbTime; duration_seconds: number | null;
    has_recording: boolean; text_back_sent_at: DbTime | null; direction: string; lead_number: string | null; form_name: string | null;
  }>`
    SELECT c.id, c.onboarding_id, c.call_sid, c.outcome, c.started_at, c.duration_seconds,
           c.recording_url IS NOT NULL AS has_recording, c.text_back_sent_at, c.direction,
           CASE WHEN c.direction = 'connect' THEN f.phone ELSE c.from_number END AS lead_number,
           f.name AS form_name
    FROM phone_calls c
    LEFT JOIN form_submissions f ON f.id = c.lead_id
    WHERE c.call_sid = ${callSid}
    LIMIT 1;`;
  const r = rows[0];
  if (!r || !r.lead_number || r.lead_number === 'unknown') return null;
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
    phone: r.lead_number,
    name: r.form_name,
    summary: eventSummary('call', payload),
    payload,
    createdAt: iso(r.started_at),
  });
}

/** A text on the tracked line, either way. Owner alerts are skipped: they go to the owner, not a lead. */
export async function projectMessage(messageSid: string): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{ id: DbId; onboarding_id: number; message_sid: string; direction: 'inbound' | 'outbound'; from_number: string; to_number: string; body: string; kind: string; created_at: DbTime }>`
    SELECT id, onboarding_id, message_sid, direction, from_number, to_number, body, kind, created_at
    FROM phone_messages WHERE message_sid = ${messageSid} LIMIT 1;`;
  const r = rows[0];
  if (!r) return null;
  const kind = messageEventKind(r.direction, r.kind);
  if (!kind) return null;
  const lead = r.direction === 'inbound' ? r.from_number : r.to_number;
  const payload: EventPayload = {
    messageSid: r.message_sid,
    body: r.body,
    messageKind: r.kind,
    automatic: r.direction === 'outbound' && r.kind !== 'manual',
    channel: 'sms',
  };
  return upsertContactEvent({
    onboardingId: Number(r.onboarding_id),
    kind,
    refTable: 'phone_messages',
    refId: Number(r.id),
    phone: lead,
    summary: eventSummary(kind, payload),
    payload,
    createdAt: iso(r.created_at),
  });
}

/** A website form (slice 2). Phone and email both join the contact, which is where the automatic merge happens. */
export async function projectForm(formId: number): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{
    id: DbId; onboarding_id: number; name: string | null; phone: string | null; email: string | null; message: string | null; page: string | null;
    utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; created_at: DbTime;
  }>`
    SELECT id, onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, created_at
    FROM form_submissions WHERE id = ${formId} LIMIT 1;`;
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

/** One contact's page: the masked header, the latest 300 events oldest first, and replies waiting for 8 am. */
export async function contactTimeline(onboardingId: number, contactId: number): Promise<DashboardContactView | null> {
  const contact = await getContact(onboardingId, contactId);
  if (!contact) return null;
  const [events, held, opted] = await Promise.all([
    sql<EventRow>`
      SELECT * FROM (
        SELECT * FROM contact_events WHERE contact_id = ${contactId} ORDER BY created_at DESC, id DESC LIMIT 300
      ) t ORDER BY created_at ASC, id ASC;`,
    sql<{ id: DbId; body: string; send_at: DbTime; status: 'held' | 'sending' | 'failed' }>`
      SELECT id, body, send_at, status FROM held_replies
      WHERE contact_id = ${contactId}
        AND (status IN ('held', 'sending') OR (status = 'failed' AND created_at > now() - interval '7 days'))
      ORDER BY send_at;`,
    sql`SELECT 1 FROM phone_opt_outs WHERE onboarding_id = ${onboardingId} AND phone_number = ${contact.phone ?? ''} LIMIT 1;`,
  ]);
  const list = events.rows.map(toEvent);
  const lastLead = [...list].reverse().find((e) => isLeadActivity(e.kind, e.payload)) ?? null;
  return {
    contact: toDashboardContact(contact, lastLead ? { kind: lastLead.kind, summary: lastLead.summary } : null, opted.rows.length > 0),
    events: list.map(toDashboardEvent),
    held: held.rows.map((h) => ({ id: Number(h.id), body: h.body, sendAt: iso(h.send_at), status: h.status === 'failed' ? 'failed' : 'held' })),
  };
}

// ───────────────────────────── Backfill ─────────────────────────────

export interface BackfillResult {
  onboardingId: number;
  calls: number;
  messages: number;
  forms: number;
  stagesCopied: number;
}

/**
 * Slice 3 kept the client's taps in lead_stages (A8) until contacts existed.
 * Copy each onto its contact once, only over 'new', without re-running the
 * follow-ups (slice 3 already started or stopped them when the tap happened).
 */
async function migrateTemporaryStages(onboardingId: number): Promise<number> {
  const { rows: exists } = await sql<{ t: string | null }>`SELECT to_regclass('public.lead_stages')::text AS t;`;
  if (!exists[0]?.t) return 0;
  const { rows } = await sql<{ contact_id: DbId; stage: string; updated_at: DbTime }>`
    SELECT DISTINCT ON (e.contact_id) e.contact_id, s.stage, s.updated_at
    FROM lead_stages s
    JOIN contact_events e ON e.onboarding_id = s.onboarding_id AND e.ref_table = s.ref_table AND e.ref_id = s.ref_id
    WHERE s.onboarding_id = ${onboardingId}
    ORDER BY e.contact_id, s.updated_at DESC;`;
  let copied = 0;
  for (const r of rows) {
    if (!isContactAction(r.stage)) continue;
    const stage = stageAfterAction('new', r.stage);
    const res = await sql`
      UPDATE contacts SET stage = ${stage}, stage_changed_at = ${iso(r.updated_at)}
      WHERE id = ${Number(r.contact_id)} AND stage = 'new' AND ${stage} <> 'new';`;
    copied += res.rowCount ?? 0;
  }
  return copied;
}

/**
 * Build one client's contacts from every call, text and form that exists, in
 * the order they happened, through the same projections the webhooks use.
 * Safe to run any number of times. Sends nothing: no push, no text.
 */
export async function backfill(onboardingId: number): Promise<BackfillResult> {
  await ensureSchema();
  const { rows } = await sql<{ src: 'call' | 'message' | 'form'; sid: string | null; id: DbId | null }>`
    SELECT src, sid, id FROM (
      SELECT 'call' AS src, call_sid AS sid, NULL::bigint AS id, started_at AS at FROM phone_calls WHERE onboarding_id = ${onboardingId}
      UNION ALL
      SELECT 'message', message_sid, NULL::bigint, created_at FROM phone_messages WHERE onboarding_id = ${onboardingId} AND kind <> 'alert'
      UNION ALL
      SELECT 'form', NULL::text, id, created_at FROM form_submissions WHERE onboarding_id = ${onboardingId}
    ) s
    ORDER BY at, src;`;
  const out: BackfillResult = { onboardingId, calls: 0, messages: 0, forms: 0, stagesCopied: 0 };
  for (const r of rows) {
    if (r.src === 'call' && r.sid) {
      if (await projectCall(r.sid)) out.calls += 1;
    } else if (r.src === 'message' && r.sid) {
      if (await projectMessage(r.sid)) out.messages += 1;
    } else if (r.src === 'form' && r.id !== null) {
      if (await projectForm(Number(r.id))) out.forms += 1;
    }
  }
  out.stagesCopied = await migrateTemporaryStages(onboardingId);
  return out;
}

export async function backfillAll(): Promise<BackfillResult[]> {
  await ensureSchema();
  const { rows } = await sql<{ onboarding_id: number }>`
    SELECT DISTINCT onboarding_id FROM (
      SELECT onboarding_id FROM phone_calls
      UNION SELECT onboarding_id FROM phone_messages
      UNION SELECT onboarding_id FROM form_submissions
    ) s ORDER BY onboarding_id;`;
  const results: BackfillResult[] = [];
  for (const r of rows) results.push(await backfill(Number(r.onboarding_id)));
  return results;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: clean. If `stopRunsFor` / `startRun` signatures differ from A6, fix the two calls inside `applySequenceEffects` only (Task 1 table).

- [ ] **Step 3: Check the merge order against a local database**

With a local database and two hand-made contacts for one onboarding (one with phone `+15155550134`, one with email `sarah@example.com`, the email one created later), run in `npx tsx`:

```ts
import { upsertContactEvent } from '@/lib/contacts';
await upsertContactEvent({ onboardingId: 1, kind: 'note', refTable: null, refId: null, phone: '+15155550134', email: 'sarah@example.com', summary: 'test', payload: { text: 'test' }, createdAt: new Date().toISOString() });
```

Expected: one contact left with both keys, every event of the other row now points at it, no unique-violation error. Run it twice: still one contact, two `note` events (notes have no source row, so they are not deduped; every projection with a source row is).

- [ ] **Step 4: Commit**

```bash
git add lib/contacts.ts
git commit -m "feat(inbox): contacts module: upsert, merge, stage, click matching, projections, backfill

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Won and Lost keep feeding the close rate

**Files:**
- Modify: `lib/siteStats.ts` (`markedForMonth`, `observedCloseRate`)

**Interfaces:**
- Consumes: `contacts`, `contact_events` (Task 3); `setStage` writing to `site_events.outcome` for matched contacts (Task 4).
- Produces: no new exports. Both functions now count inbox contacts marked Won or Lost that no website tap stands for.

- [ ] **Step 1: Replace the query in `markedForMonth`**

Replace the `const res = await sql<{ won: number; lost: number }>\`…\`;` statement in `markedForMonth` with:

```ts
  // Taps on the site (marked in the anonymous list, or through a matched contact), plus inbox
  // contacts marked Won or Lost that no tap stands for. A matched contact is only counted
  // through its tap (lib/contacts.ts setStage writes the mark there), never twice.
  const res = await sql<{ won: number; lost: number }>`
    SELECT (count(*) FILTER (WHERE outcome = 'won'))::int AS won, (count(*) FILTER (WHERE outcome = 'lost'))::int AS lost
    FROM (
      SELECT outcome FROM site_events
      WHERE onboarding_id = ${onboardingId} AND kind = 'click' AND outcome IS NOT NULL
        AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
      UNION ALL
      SELECT c.stage AS outcome FROM contacts c
      WHERE c.onboarding_id = ${onboardingId} AND c.stage IN ('won', 'lost')
        AND c.first_seen_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND c.first_seen_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
        AND NOT EXISTS (SELECT 1 FROM contact_events e WHERE e.contact_id = c.id AND e.kind = 'click' AND e.ref_table = 'site_events')
    ) marked;
  `;
```

- [ ] **Step 2: Replace the query in `observedCloseRate`**

Replace its `const res = await sql<{ won: number; lost: number }>\`…\`;` with:

```ts
  // Same two sources as markedForMonth, over the observed window.
  const res = await sql<{ won: number; lost: number }>`
    SELECT (count(*) FILTER (WHERE outcome = 'won'))::int AS won, (count(*) FILTER (WHERE outcome = 'lost'))::int AS lost
    FROM (
      SELECT outcome FROM site_events
      WHERE onboarding_id = ${onboardingId} AND kind = 'click' AND outcome IS NOT NULL
        AND created_at >= now() - make_interval(months => ${OBSERVED_MONTHS})
      UNION ALL
      SELECT c.stage AS outcome FROM contacts c
      WHERE c.onboarding_id = ${onboardingId} AND c.stage IN ('won', 'lost')
        AND c.first_seen_at >= now() - make_interval(months => ${OBSERVED_MONTHS})
        AND NOT EXISTS (SELECT 1 FROM contact_events e WHERE e.contact_id = c.id AND e.kind = 'click' AND e.ref_table = 'site_events')
    ) marked;
  `;
```

The rest of both functions is unchanged.

- [ ] **Step 3: Run the existing tests and type-check**

Run: `npm run test:onboarding && npm run lint`
Expected: PASS (these tests do not touch SQL) and clean.

With a local database: mark one unmatched contact Won through the inbox (Task 8 route, or `setStage` in `npx tsx`), then `markedForMonth(<id>, '<this month>')` returns `won` one higher; mark a contact that has a click event Won and the count goes up by exactly one (through the tap), not two.

- [ ] **Step 4: Commit**

```bash
git add lib/siteStats.ts
git commit -m "feat(inbox): Won and Lost from the inbox count toward the client's close rate

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Producers: every call, text and form lands in the inbox

Each producer keeps writing its own table first, then calls one projection. A projection failure is logged and never fails the webhook or the send: the source row is already safe, and the backfill (Task 8) rebuilds anything missed.

**Files:**
- Modify: `lib/phoneLines.ts` (`sendClientSms`)
- Modify: `app/api/phone/voice/status/route.ts`
- Modify: `app/api/phone/recording/route.ts`
- Modify: `app/api/phone/sms/route.ts`
- Modify: `app/api/lead/route.ts` (slice 2, A4)
- Modify: the slice-2 connect status route that calls `recordCall` for `direction = 'connect'` (A5)
- Modify: `app/api/cron/sequences/route.ts` (slice 3, A7)

**Interfaces:**
- Consumes: `projectCall`, `projectMessage`, `projectForm`, `upsertContactEvent` (Task 4); `eventSummary` (Task 2).
- Produces: no new exports. After this task every new call, text (both ways, every kind but `alert`), form and sequence email has a `contact_events` row.

| File | Where | The call |
|---|---|---|
| `lib/phoneLines.ts` | `sendClientSms`, after the `recordMessage` try/catch | `await projectMessage(sid)` (covers manual replies, text-backs, sequence texts, confirmations, reminders; skips owner alerts) |
| `app/api/phone/voice/status/route.ts` | right after `recordCall`, and again after a text-back went out | `await projectCall(p.CallSid)` |
| `app/api/phone/recording/route.ts` | after `attachRecording` | `await projectCall(p.CallSid)` |
| `app/api/phone/sms/route.ts` | after `recordMessage` (inbound) | `await projectMessage(p.MessageSid)` |
| `app/api/lead/route.ts` | first line inside `after()`, before the alerts | `await projectForm(submission.id)` |
| slice-2 connect status route | after its `recordCall(...)` | `await projectCall(<the CallSid it recorded>)` |
| `app/api/cron/sequences/route.ts` | after a successful `sendSequenceEmail(...)` | `await upsertContactEvent({ … kind: 'sequence', refTable: 'sequence_runs', refId: run.id, refPart: run.step … })` |

- [ ] **Step 1: `sendClientSms` projects every outbound text**

In `lib/phoneLines.ts` add the import:

```ts
import { projectMessage } from '@/lib/contacts';
```

In `sendClientSms`, after the existing `try { await recordMessage(…) } catch (err) { … }` block and before `return { sent: true, sid };`, add:

```ts
  // Into the leads inbox (lib/contacts.ts); owner alerts are skipped there. Never fails the send.
  try {
    await projectMessage(sid);
  } catch (err) {
    console.error('phone: outbound text not added to the inbox', sid, err);
  }
```

- [ ] **Step 2: The call status webhook projects before and after the text-back**

In `app/api/phone/voice/status/route.ts` add the import:

```ts
import { projectCall } from '@/lib/contacts';
```

Replace everything from `if (outcome === 'answered') return twiml(emptyTwiml());` to the end of `POST` with:

```ts
  // Into the leads inbox before any text-back, so a brand-new caller is created as a
  // caller (and matched to a tap on the site's call button) rather than as a texter.
  await projectCall(p.CallSid).catch((err) => {
    console.error('[phone/status] inbox', err instanceof Error ? err.message : err);
    return null;
  });
  if (outcome === 'answered') return twiml(emptyTwiml());

  // The call row is saved; a text-back problem must not make Twilio retry the whole webhook.
  let textedBack = false;
  if (from !== 'unknown') {
    try {
      const onboarding = await getOnboardingById(line.onboardingId).catch(() => null);
      textedBack = await sendTextBack(line, onboarding?.businessName ?? null, from, p.CallSid);
    } catch (err) {
      console.error('[phone/status] sendTextBack', err instanceof Error ? err.message : err);
    }
  }
  // Refresh the inbox line to "missed, texted back".
  if (textedBack) {
    await projectCall(p.CallSid).catch((err) => console.error('[phone/status] inbox', err instanceof Error ? err.message : err));
  }
  return twiml(afterDialTwiml({ textedBack }));
}
```

- [ ] **Step 3: The recording webhook refreshes the call's event**

In `app/api/phone/recording/route.ts` add `import { projectCall } from '@/lib/contacts';` and, after the closing `}` of the existing `try { … } catch (err) { … }` inside the `if (p.CallSid && p.RecordingUrl && …)` block, add:

```ts
    // The inbox's play button appears once the event knows a recording exists. No URL is copied.
    await projectCall(p.CallSid).catch((err) => console.error('[phone/recording] inbox', err instanceof Error ? err.message : err));
```

- [ ] **Step 4: Inbound texts**

In `app/api/phone/sms/route.ts` add `import { projectMessage } from '@/lib/contacts';` and, directly after the `await recordMessage(line.onboardingId, { … kind: 'inbound', … });` call, add:

```ts
      await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', err instanceof Error ? err.message : err);
        return null;
      });
```

(Task 10 turns this into `const projected = …` to send the alert.)

- [ ] **Step 5: Website forms (slice 2)**

In `app/api/lead/route.ts` add `import { projectForm } from '@/lib/contacts';`. Inside the `after(async () => { … })` callback, as its first statement, add (using the route's own name for the saved row, assumed `submission`):

```ts
    await projectForm(submission.id).catch((err) => {
      console.error('[lead] inbox', err instanceof Error ? err.message : err);
      return null;
    });
```

(Task 10 turns this into `const projected = …` and passes the contact to the alert.)

- [ ] **Step 6: Call-connect calls (slice 2)**

In the route Task 1 found for A5, add `import { projectCall } from '@/lib/contacts';` and directly after its `await recordCall(…)` call, add:

```ts
  await projectCall(p.CallSid).catch((err) => console.error('[phone/connect] inbox', err instanceof Error ? err.message : err));
```

(`p.CallSid` is the sid that route passed to `recordCall`; use the same expression.) `projectCall` reads the lead's phone from `form_submissions` through `lead_id`, so the call joins the form's contact, and an answered call-connect moves it to Contacted.

- [ ] **Step 7: Sequence emails (slice 3)**

In `app/api/cron/sequences/route.ts` add:

```ts
import { upsertContactEvent } from '@/lib/contacts';
import { eventSummary } from '@/lib/contactsShared';
```

Directly after a successful `await sendSequenceEmail(…)` (inside the same branch), add:

```ts
      // Into the inbox timeline; one event per run step (ref_part), never a second on a retry.
      await upsertContactEvent({
        onboardingId: run.onboardingId,
        kind: 'sequence',
        refTable: 'sequence_runs',
        refId: run.id,
        refPart: run.step,
        phone: run.contactPhone,
        email: run.contactEmail,
        name: run.contactName,
        summary: eventSummary('sequence', { channel: 'email' }),
        payload: { channel: 'email', step: run.step },
        createdAt: new Date().toISOString(),
      }).catch((err) => console.error('[cron/sequences] inbox', err instanceof Error ? err.message : err));
```

SMS steps need nothing here: they go through `sendClientSms(…, 'sequence')`, which projects them (Step 1).

- [ ] **Step 8: Type-check and test**

Run: `npm run lint && npm run test:phone`
Expected: clean and PASS.

With a local database that has a `phone_calls` row: in `npx tsx`, `await (await import('@/lib/contacts')).projectCall('<that CallSid>')` returns `{ contactId, eventId, createdContact: true, insertedEvent: true }`; a second call returns the same ids with `createdContact: false, insertedEvent: false` (Review Focus 3).

- [ ] **Step 9: Commit**

```bash
git add lib/phoneLines.ts app/api/phone app/api/lead app/api/cron/sequences
git commit -m "feat(inbox): every call, text, form and follow-up email projects into the inbox

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Replies and quiet hours (`lib/inboxReply.ts`, held-reply cron)

**Files:**
- Create: `lib/inboxReply.ts`
- Create: `app/api/cron/held-replies/route.ts`
- Modify: `vercel.json` (one cron entry)

**Interfaces:**
- Consumes: `getContact` (Task 4); `canReplyNow`, `isReplyRefusal`, `validateReplyBody`, `ReplyRefusal` (Task 2); `getLine`, `isOptedOut`, `sendClientSms` (`lib/phoneLines.ts`); `line.timeZone` (A3); `held_replies` (Task 3).
- Produces:
  - `type ReplyResult = { status: 'sent' } | { status: 'held'; id: number; sendAt: string } | { status: 'refused'; reason: ReplyRefusal }`
  - `replyToContact(onboardingId: number, contactId: number, rawBody: unknown, now?: Date): Promise<ReplyResult | null>` (null = not this client's contact)
  - `sendDueHeldReplies(limit?: number): Promise<{ sent: number; failed: number }>`
  - `GET|POST /api/cron/held-replies` every 15 minutes.

- [ ] **Step 1: Write the reply module**

```ts
// lib/inboxReply.ts
// Texting a lead back from the PROOF inbox. sendClientSms (lib/phoneLines.ts)
// already enforces the 10DLC gate and the opt-out list; this adds what the
// inbox needs: the contact is this client's and has a phone, and it is not
// quiet hours (9 pm to 8 am client-local, spec slice 4 "Compliance"). A reply
// typed in quiet hours is held in held_replies and sent at 8 am by
// /api/cron/held-replies. Server-only.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { getContact } from '@/lib/contacts';
import { canReplyNow, isReplyRefusal, validateReplyBody, type ReplyRefusal } from '@/lib/contactsShared';
import { getLine, isOptedOut, sendClientSms } from '@/lib/phoneLines';

export type ReplyResult = { status: 'sent' } | { status: 'held'; id: number; sendAt: string } | { status: 'refused'; reason: ReplyRefusal };

const refused = (reason: ReplyRefusal): ReplyResult => ({ status: 'refused', reason });

/**
 * Null when the contact is not this client's. The order matters (Review Focus 4):
 * every reason a text could never go out is checked before anything is held,
 * so nothing waits overnight only to be refused at 8 am.
 */
export async function replyToContact(onboardingId: number, contactId: number, rawBody: unknown, now: Date = new Date()): Promise<ReplyResult | null> {
  const contact = await getContact(onboardingId, contactId);
  if (!contact) return null;
  const checked = validateReplyBody(rawBody);
  if (!checked.ok) return refused(checked.reason);
  if (!contact.phone) return refused('no_phone');
  const line = await getLine(onboardingId);
  if (!line || line.status !== 'active') return refused('no_line');
  if (line.smsStatus !== 'ready') return refused('sms_pending');
  if (await isOptedOut(onboardingId, contact.phone)) return refused('opted_out');
  const window = canReplyNow(now, line.timeZone);
  if (!window.ok) {
    await ensureSchema();
    const { rows } = await sql<{ id: number | string }>`
      INSERT INTO held_replies (onboarding_id, contact_id, body, send_at)
      VALUES (${onboardingId}, ${contactId}, ${checked.body}, ${window.sendAt})
      RETURNING id;`;
    return { status: 'held', id: Number(rows[0].id), sendAt: window.sendAt };
  }
  const sent = await sendClientSms(line, contact.phone, checked.body, 'manual');
  if (!sent.sent) return refused(isReplyRefusal(sent.reason) ? sent.reason : 'bad_number');
  return { status: 'sent' };
}

/**
 * The 8 am send. Rows are claimed ('sending') before anything is sent, so two
 * overlapping cron runs never send one twice; a crash after the claim leaves
 * the row 'sending' (not sent) rather than risking a double text. The gates run
 * again inside sendClientSms: someone who texted STOP overnight is not texted.
 */
export async function sendDueHeldReplies(limit = 100): Promise<{ sent: number; failed: number }> {
  if (!isDatabaseConfigured()) return { sent: 0, failed: 0 };
  await ensureSchema();
  const { rows } = await sql<{ id: number | string; onboarding_id: number; contact_id: number | string; body: string }>`
    UPDATE held_replies SET status = 'sending'
    WHERE id IN (
      SELECT id FROM held_replies WHERE status = 'held' AND send_at <= now()
      ORDER BY send_at LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, onboarding_id, contact_id, body;`;
  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    const id = Number(r.id);
    let error: string | null = null;
    try {
      const onboardingId = Number(r.onboarding_id);
      const contact = await getContact(onboardingId, Number(r.contact_id));
      const line = await getLine(onboardingId);
      if (!contact?.phone) error = 'no_phone';
      else if (!line || line.status !== 'active') error = 'no_line';
      else {
        const res = await sendClientSms(line, contact.phone, r.body, 'manual');
        if (!res.sent) error = res.reason;
      }
    } catch (err) {
      error = err instanceof Error ? err.message.slice(0, 200) : 'send failed';
    }
    if (error) {
      failed += 1;
      await sql`UPDATE held_replies SET status = 'failed', error = ${error} WHERE id = ${id};`;
    } else {
      sent += 1;
      await sql`UPDATE held_replies SET status = 'sent', sent_at = now() WHERE id = ${id};`;
    }
  }
  return { sent, failed };
}
```

- [ ] **Step 2: Write the cron route**

```ts
// app/api/cron/held-replies/route.ts
// Every 15 minutes (vercel.json): sends inbox replies that were typed during
// quiet hours, once their 8 am has come (lib/inboxReply.ts).
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { sendDueHeldReplies } from '@/lib/inboxReply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  try {
    return NextResponse.json(await sendDueHeldReplies());
  } catch (err) {
    console.error('[cron:held-replies]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'held replies failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
```

- [ ] **Step 3: Schedule it**

In `vercel.json` `crons`, add after the `audits` entry (keep the slice-3 `sequences` entry if it is there):

```json
    { "path": "/api/cron/held-replies", "schedule": "*/15 * * * *" }
```

(Sub-daily crons need the Vercel Pro plan, which slice 3's 15-minute cron already requires.)

- [ ] **Step 4: Type-check and try it**

Run: `npm run lint`
Expected: clean.

With a local database, a line in `ready`, and a contact: in `npx tsx`, `replyToContact(<onb>, <contact>, 'test', new Date('2026-10-14T02:30:00Z'))` returns `{ status: 'held', sendAt: '2026-10-14T13:00:00.000Z', … }` (for an `America/Chicago` line) and writes a `held_replies` row; the same with `'   '` returns `{ status: 'refused', reason: 'empty' }` and writes nothing. `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/held-replies` returns `{"sent":0,"failed":0}` before 8 am.

- [ ] **Step 5: Commit**

```bash
git add lib/inboxReply.ts app/api/cron/held-replies vercel.json
git commit -m "feat(inbox): reply from the tracked number; quiet-hours replies held to 8 am

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Inbox API, admin backfill, and slice 3's stage route

**Files:**
- Create: `lib/inboxServer.ts`
- Create: `app/api/proof/inbox/route.ts` (GET list)
- Create: `app/api/proof/inbox/[contactId]/route.ts` (GET one, PUT name)
- Create: `app/api/proof/inbox/[contactId]/reply/route.ts` (POST)
- Create: `app/api/proof/inbox/[contactId]/stage/route.ts` (POST)
- Create: `app/api/proof/inbox/[contactId]/email/route.ts` (GET, redirect to `mailto:`)
- Create: `app/api/admin/contacts/backfill/route.ts` (POST)
- Modify: `app/api/proof/leads/stage/route.ts` (slice 3, A8: rewritten onto `contacts.stage`)
- Modify: every slice-3 file that reads or writes `lead_stages` (A8), plus its `CREATE TABLE` in `lib/db.ts` and `scripts/init-db.mjs`

**Interfaces:**
- Consumes: `getSignedInClient` (`lib/proofServer.ts`), `getOnboardingById` (`lib/onboarding.ts`), `requireAdmin` (`lib/adminAuth.ts`); Task 2 (`inboxEnabled`, `parseContactId`, `decodeCursor`, `isContactAction`, `REPLY_REFUSAL_COPY`); Task 4 (`listInbox`, `contactTimeline`, `getContact`, `setStage`, `setContactName`, `contactIdForRef`, `backfill`, `backfillAll`); Task 7 (`replyToContact`).
- Produces:
  - `inboxAccount(): Promise<{ ok: true; account: ClientAccount } | { ok: false; response: NextResponse }>`, `NO_STORE`, `inboxFailure(tag, err): NextResponse` (`lib/inboxServer.ts`).
  - `GET /api/proof/inbox?cursor=` → `{ contacts: DashboardContact[]; nextCursor: string | null }`
  - `GET /api/proof/inbox/<id>` → `DashboardContactView`; `PUT` `{ name }` → `{ ok: true, name }`
  - `POST /api/proof/inbox/<id>/reply` `{ body }` → `{ ok: true, status: 'sent' }` | `{ ok: true, status: 'held', sendAt }` | 400/409 `{ error, reason }`
  - `POST /api/proof/inbox/<id>/stage` `{ action }` → `{ ok: true, stage }`
  - `GET /api/proof/inbox/<id>/email` → 302 `mailto:`
  - `POST /api/admin/contacts/backfill` `{ onboardingId? }` → `{ ok: true, results: BackfillResult[] }`
  - `POST /api/proof/leads/stage` `{ contactId, action }` or `{ refTable, refId, action }` → `{ ok: true, contactId, stage }`

Every client route answers 401 without a session, 403 on Essentials, 404 for a contact id that is not this client's (all queries are scoped by `account.onboardingId`), and sends `Cache-Control: private, no-store`.

- [ ] **Step 1: The shared guard**

```ts
// lib/inboxServer.ts
// The guard every /api/proof/inbox route starts with: a signed-in client whose
// plan includes the inbox. Scoping happens in each query (lib/contacts.ts takes
// the onboarding id), so another client's contact id is a plain 404. Server-only.
import { NextResponse } from 'next/server';
import { inboxEnabled } from '@/lib/contactsShared';
import { getOnboardingById } from '@/lib/onboarding';
import type { ClientAccount } from '@/lib/proofAuth';
import { getSignedInClient } from '@/lib/proofServer';

export type InboxAuth = { ok: true; account: ClientAccount } | { ok: false; response: NextResponse };

export const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function inboxAccount(): Promise<InboxAuth> {
  const account = await getSignedInClient();
  if (!account) return { ok: false, response: NextResponse.json({ error: 'Please sign in again' }, { status: 401 }) };
  const onboarding = await getOnboardingById(account.onboardingId).catch(() => null);
  if (!onboarding || !inboxEnabled(onboarding.tier)) {
    return { ok: false, response: NextResponse.json({ error: 'The leads inbox comes with AxeonCORE' }, { status: 403 }) };
  }
  return { ok: true, account };
}

export function inboxFailure(tag: string, err: unknown): NextResponse {
  console.error(tag, err instanceof Error ? err.message : err);
  return NextResponse.json({ error: 'That did not work. Try again in a minute.' }, { status: 502, headers: NO_STORE });
}
```

- [ ] **Step 2: The list**

```ts
// app/api/proof/inbox/route.ts
// GET: the signed-in client's leads, newest activity first, 50 at a time
// (?cursor= from the previous page). Pre-masked rows only.
import { NextResponse } from 'next/server';
import { listInbox } from '@/lib/contacts';
import { decodeCursor } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const raw = new URL(req.url).searchParams.get('cursor');
  const cursor = raw ? decodeCursor(raw) : null;
  if (raw && !cursor) return NextResponse.json({ error: 'That page marker is not valid' }, { status: 400, headers: NO_STORE });
  try {
    return NextResponse.json(await listInbox(auth.account.onboardingId, { limit: 50, cursor }), { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/inbox]', err);
  }
}
```

- [ ] **Step 3: One contact, and renaming it**

```ts
// app/api/proof/inbox/[contactId]/route.ts
// GET: one lead's page (header, stage, timeline, held replies), pre-masked.
// PUT { name }: the client types the person's name (spec: names come from forms,
// chat, or the client; never a carrier lookup). An empty name clears it.
import { NextResponse } from 'next/server';
import { contactTimeline, setContactName } from '@/lib/contacts';
import { parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ contactId: string }> };
const notFound = () => NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return notFound();
  try {
    const view = await contactTimeline(auth.account.onboardingId, contactId);
    return view ? NextResponse.json(view, { headers: NO_STORE }) : notFound();
  } catch (err) {
    return inboxFailure('[proof/inbox/contact]', err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return notFound();
  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  if (!body || (typeof body.name !== 'string' && body.name !== null)) {
    return NextResponse.json({ error: 'Type a name, or leave it empty to clear it' }, { status: 400, headers: NO_STORE });
  }
  try {
    const contact = await setContactName(auth.account.onboardingId, contactId, body.name);
    return contact ? NextResponse.json({ ok: true, name: contact.name }, { headers: NO_STORE }) : notFound();
  } catch (err) {
    return inboxFailure('[proof/inbox/name]', err);
  }
}
```

- [ ] **Step 4: Reply**

```ts
// app/api/proof/inbox/[contactId]/reply/route.ts
// POST { body }: text the lead from the client's tracked number (lib/inboxReply.ts).
// 'held' means quiet hours: it goes out at 8 am. A refusal comes back as a plain
// sentence the reply box shows as-is.
import { NextResponse } from 'next/server';
import { parseContactId, REPLY_REFUSAL_COPY } from '@/lib/contactsShared';
import { replyToContact } from '@/lib/inboxReply';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { body?: unknown } | null;
  try {
    const result = await replyToContact(auth.account.onboardingId, contactId, body?.body);
    if (!result) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
    if (result.status === 'refused') {
      const status = result.reason === 'empty' || result.reason === 'too_long' ? 400 : 409;
      return NextResponse.json({ error: REPLY_REFUSAL_COPY[result.reason], reason: result.reason }, { status, headers: NO_STORE });
    }
    return NextResponse.json(result.status === 'held' ? { ok: true, status: 'held', sendAt: result.sendAt } : { ok: true, status: 'sent' }, { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/inbox/reply]', err);
  }
}
```

- [ ] **Step 5: Stage**

```ts
// app/api/proof/inbox/[contactId]/stage/route.ts
// POST { action }: the client's tap on a stage chip or "Quote sent". setStage
// (lib/contacts.ts) also starts or stops the follow-ups and feeds Won/Lost to the close rate.
import { NextResponse } from 'next/server';
import { setStage } from '@/lib/contacts';
import { isContactAction, parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
  if (!body || !isContactAction(body.action)) return NextResponse.json({ error: 'Pick New, Contacted, Quote sent, Booked, Won or Lost' }, { status: 400, headers: NO_STORE });
  try {
    const contact = await setStage(auth.account.onboardingId, contactId, body.action, 'client');
    if (!contact) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ ok: true, stage: contact.stage }, { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/inbox/stage]', err);
  }
}
```

- [ ] **Step 6: Email (the one place a full address leaves the server)**

```ts
// app/api/proof/inbox/[contactId]/email/route.ts
// GET: opens the client's mail app to this lead (spec: email replies open the
// mail app; PROOF sends no email in this slice). A redirect, so the address is
// never in the inbox page's data; only a tap on "Email" reveals it, to the
// signed-in owner, in their own mail app.
import { NextResponse } from 'next/server';
import { getContact } from '@/lib/contacts';
import { parseContactId } from '@/lib/contactsShared';
import { inboxAccount, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  const contact = contactId ? await getContact(auth.account.onboardingId, contactId).catch(() => null) : null;
  if (!contact?.email) return NextResponse.json({ error: 'No email for this lead' }, { status: 404, headers: NO_STORE });
  return new Response(null, { status: 302, headers: { Location: `mailto:${contact.email}`, ...NO_STORE } });
}
```

- [ ] **Step 7: Admin backfill**

```ts
// app/api/admin/contacts/backfill/route.ts
// POST { onboardingId? }: build the inbox from every call, text and form that
// already exists (lib/contacts.ts backfill), for one client or all of them.
// Idempotent: run it again and nothing doubles. Sends nothing to anyone.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { backfill, backfillAll } from '@/lib/contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { onboardingId?: unknown };
  const id = body.onboardingId === undefined || body.onboardingId === null ? null : Number(body.onboardingId);
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return NextResponse.json({ error: 'onboardingId must be a client id' }, { status: 400 });
  try {
    const results = id ? [await backfill(id)] : await backfillAll();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[admin/contacts/backfill]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Backfill failed' }, { status: 500 });
  }
}
```

- [ ] **Step 8: Replace slice 3's temporary stage storage**

Rewrite `app/api/proof/leads/stage/route.ts` whole:

```ts
// app/api/proof/leads/stage/route.ts
// Slice 3's stage taps, now stored on the contact (contacts.stage) instead of
// the temporary lead_stages table. Takes { contactId, action } from the inbox,
// or the slice-3 shape { refTable, refId, action } (a source row the contact
// was projected from). The inbox's own route is /api/proof/inbox/<id>/stage.
import { NextResponse } from 'next/server';
import { contactIdForRef, setStage } from '@/lib/contacts';
import { isContactAction, parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => null)) as { contactId?: unknown; refTable?: unknown; refId?: unknown; action?: unknown } | null;
  if (!body || !isContactAction(body.action)) return NextResponse.json({ error: 'Pick a stage' }, { status: 400, headers: NO_STORE });
  try {
    const onboardingId = auth.account.onboardingId;
    let contactId = parseContactId(body.contactId);
    const refId = parseContactId(body.refId);
    if (!contactId && typeof body.refTable === 'string' && refId) contactId = await contactIdForRef(onboardingId, body.refTable, refId);
    if (!contactId) return NextResponse.json({ error: 'Which lead?' }, { status: 400, headers: NO_STORE });
    const contact = await setStage(onboardingId, contactId, body.action, 'client');
    if (!contact) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ ok: true, contactId, stage: contact.stage }, { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/leads/stage]', err);
  }
}
```

Then run `grep -rn "lead_stages" lib app components scripts` and, for each hit outside `lib/contacts.ts` (whose `migrateTemporaryStages` reads it once during the backfill):

- A function that **writes** a stage there: delete it and its callers' calls (the route above replaced its only caller).
- A function that **reads** a stage from there: replace its body with `const id = await contactIdForRef(onboardingId, refTable, refId); const c = id ? await getContact(onboardingId, id) : null; return c?.stage ?? 'new';` (imports from `@/lib/contacts`).
- The `CREATE TABLE IF NOT EXISTS lead_stages` statement (and its indexes) in `lib/db.ts` and `scripts/init-db.mjs`: delete. Production keeps the table until the go-live step in Task 12 drops it, after the backfill has copied it.

- [ ] **Step 9: Type-check and exercise the routes**

Run: `npm run lint`
Expected: clean.

Run `npm run dev`, sign in as a test AxeonCORE client, then in the browser console:

```js
await (await fetch('/api/proof/inbox')).json();                                   // { contacts: [...], nextCursor }
await (await fetch('/api/proof/inbox/999999')).status;                            // 404
await (await fetch('/api/proof/inbox/1/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'nope' }) })).status; // 400
```

Signed in as an Essentials client, `fetch('/api/proof/inbox')` is 403. Signed out, 401. In the JSON from the first call, no `who` value contains a full number.

- [ ] **Step 10: Commit**

```bash
git add lib/inboxServer.ts app/api/proof/inbox app/api/admin/contacts app/api/proof/leads/stage lib scripts
git commit -m "feat(inbox): client inbox API, admin backfill, stage taps stored on the contact

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Push notifications (`web-push`, service worker, "Turn on notifications")

**Files:**
- Modify: `package.json` (dependency `web-push` `3.6.7`, dev dependency `@types/web-push` `3.6.4`; both published January 2024)
- Create: `lib/pushShared.ts`
- Test: `lib/pushShared.test.ts`
- Create: `lib/push.ts`
- Create: `public/sw.js`
- Create: `public/proof.webmanifest`
- Modify: `app/proof/layout.tsx` (link the manifest; iPhone home-screen metadata)
- Modify: `next.config.mjs` (no-cache header for `/sw.js`)
- Create: `components/proof/NotificationsButton.tsx`
- Create: `app/api/proof/push/subscribe/route.ts`

**Interfaces:**
- Consumes: `push_subscriptions` (Task 3); `inboxAccount`, `NO_STORE` (Task 8); `client_accounts` (existing).
- Produces:
  - `lib/pushShared.ts`: `type LeadActivity = 'text' | 'call' | 'form' | 'messenger' | 'instagram'`, `interface PushMessage { title; body; url }`, `interface PushSubscriptionInput { endpoint; keys: { p256dh; auth } }`, `leadLink(contactId): string`, `leadPushMessage(what, contactId): PushMessage`, `ownerAlertText(what, contactId, appOrigin): string`, `isValidSubscription(raw): raw is PushSubscriptionInput`, `urlBase64ToUint8Array(base64): Uint8Array<ArrayBuffer>`, `needsHomeScreenInstall(userAgent, standalone): boolean`.
  - `lib/push.ts`: `isPushConfigured(): boolean`, `savePushSubscription(accountId: number, sub: PushSubscriptionInput): Promise<void>`, `sendPush(accountId: number, msg: PushMessage): Promise<number>` (devices reached; prunes dead subscriptions on 404/410), `pushToClient(onboardingId: number, msg: PushMessage): Promise<number>`.
  - `<NotificationsButton publicKey={…} />`; `POST /api/proof/push/subscribe` `{ subscription }` → `{ ok: true }`.

- [ ] **Step 1: Add the dependency**

Run: `npm install --save-exact web-push@3.6.7 && npm install --save-exact --save-dev @types/web-push@3.6.4`
Expected: `package.json` gains `"web-push": "3.6.7"` under `dependencies` and `"@types/web-push": "3.6.4"` under `devDependencies`; `package-lock.json` updates.

- [ ] **Step 2: Write the failing tests**

```ts
// lib/pushShared.test.ts
// Run with: npm run test:inbox
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSubscription, leadPushMessage, needsHomeScreenInstall, ownerAlertText, urlBase64ToUint8Array } from './pushShared';

const PHONEISH = /\d{3}\D{0,2}\d{3}\D?\d{4}/;

test('a push says what happened and where to look, nothing else (Review Focus 1)', () => {
  for (const what of ['text', 'call', 'form', 'messenger', 'instagram'] as const) {
    const m = leadPushMessage(what, 42);
    assert.equal(m.url, '/proof?tab=leads&contact=42');
    assert.equal(m.body, 'Open AxeonPROOF to see it and reply.');
    assert.doesNotMatch(JSON.stringify(m), PHONEISH);
    assert.deepEqual(Object.keys(m).sort(), ['body', 'title', 'url']);
  }
  assert.equal(leadPushMessage('text', 42).title, 'New text from a lead');
  assert.equal(leadPushMessage('call', 42).title, 'Missed call from a lead');
  assert.equal(leadPushMessage('form', 42).title, 'New form from your website');
});

test('the owner text has no lead details either', () => {
  const t = ownerAlertText('text', 42, 'https://app.axeonstudio.co/');
  assert.equal(t, 'New text from a lead. See it and reply in AxeonPROOF: https://app.axeonstudio.co/proof?tab=leads&contact=42');
  assert.doesNotMatch(t, PHONEISH);
});

test('subscriptions: https on a known push service, base64url keys', () => {
  const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/abc', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://web.push.apple.com/QGx', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://wns2-by3p.notify.windows.com/w/?token=x', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'http://fcm.googleapis.com/fcm/send/abc', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://169.254.169.254/latest', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://evil.example.com/fcm.googleapis.com', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'has space', auth: 'x' } }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/x' }), false);
  assert.equal(isValidSubscription(null), false);
});

test('urlBase64ToUint8Array decodes a VAPID key', () => {
  assert.deepEqual([...urlBase64ToUint8Array('AQID')], [1, 2, 3]);
  assert.deepEqual([...urlBase64ToUint8Array('-_8')], [251, 255]);
});

test('iPhones need PROOF on the Home Screen before push works', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  assert.equal(needsHomeScreenInstall(iphone, false), true);
  assert.equal(needsHomeScreenInstall(iphone, true), false);
  assert.equal(needsHomeScreenInstall('Mozilla/5.0 (Linux; Android 15) Chrome/130.0 Mobile', false), false);
});
```

Run: `npx tsx --test lib/pushShared.test.ts`
Expected: FAIL, `Cannot find module './pushShared'`.

- [ ] **Step 3: Write `lib/pushShared.ts`**

```ts
// lib/pushShared.ts
// Lead notifications: what a push says and where it opens, the key conversion
// the browser needs, and the subscription shape the server accepts. Client-safe.
// A push never carries a phone number, a name or the words of a message: a fixed
// title, one fixed line, and a link inside PROOF. The same goes for the text the
// owner gets when push is not on.

export type LeadActivity = 'text' | 'call' | 'form' | 'messenger' | 'instagram';

export interface PushMessage {
  title: string;
  body: string;
  /** A path inside PROOF. /proof works on both hosts (lib/hostRouting.ts sends it to the app). */
  url: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const TITLES: Record<LeadActivity, string> = {
  text: 'New text from a lead',
  call: 'Missed call from a lead',
  form: 'New form from your website',
  messenger: 'New Facebook message from a lead',
  instagram: 'New Instagram message from a lead',
};

export const leadLink = (contactId: number): string => `/proof?tab=leads&contact=${contactId}`;

export function leadPushMessage(what: LeadActivity, contactId: number): PushMessage {
  return { title: TITLES[what], body: 'Open AxeonPROOF to see it and reply.', url: leadLink(contactId) };
}

/** The fallback text to the owner's cell when no device has push on. */
export function ownerAlertText(what: LeadActivity, contactId: number, appOrigin: string): string {
  return `${TITLES[what]}. See it and reply in AxeonPROOF: ${appOrigin.replace(/\/$/, '')}${leadLink(contactId)}`;
}

// The browsers' push services. The server POSTs to whatever endpoint a browser
// registered, so only these hosts are accepted (no posting to arbitrary URLs).
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

export function isValidSubscription(raw: unknown): raw is PushSubscriptionInput {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } | null };
  if (typeof s.endpoint !== 'string' || s.endpoint.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(s.endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((re) => re.test(url.hostname))) return false;
  const k = s.keys;
  return (
    !!k &&
    typeof k.p256dh === 'string' && typeof k.auth === 'string' &&
    k.p256dh.length <= 200 && k.auth.length <= 100 &&
    B64URL.test(k.p256dh) && B64URL.test(k.auth)
  );
}

/** The VAPID public key (base64url) as the bytes pushManager.subscribe wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** iOS only delivers web push to a site added to the Home Screen and opened from there. */
export function needsHomeScreenInstall(userAgent: string, standalone: boolean): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) && !standalone;
}
```

Run: `npm run test:inbox`
Expected: PASS (both files).

- [ ] **Step 4: Write `lib/push.ts`**

```ts
// lib/push.ts
// Web push to the client's own devices (spec, "Cross-slice decisions": push via
// web-push). VAPID keys come from WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY,
// generated once with `npx web-push generate-vapid-keys`. Without them every
// send reports 0 devices and callers fall back to a text. A subscription the
// push service says is gone (404/410) is deleted. Server-only.
import webpush from 'web-push';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import type { PushMessage, PushSubscriptionInput } from '@/lib/pushShared';

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || 'mailto:hello@axeonstudio.co', publicKey, privateKey);
  configured = true;
  return true;
}

/** One row per browser; a browser that re-subscribes (or moves to another login) keeps one row. */
export async function savePushSubscription(accountId: number, sub: PushSubscriptionInput): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO push_subscriptions (account_id, endpoint, p256dh, auth)
    VALUES (${accountId}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET account_id = EXCLUDED.account_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;`;
}

/** Sends to every device of one client login. Returns how many accepted it. Never throws for a single bad device. */
export async function sendPush(accountId: number, msg: PushMessage): Promise<number> {
  if (!isPushConfigured() || !isDatabaseConfigured()) return 0;
  await ensureSchema();
  const { rows } = await sql<{ id: number; endpoint: string; p256dh: string; auth: string }>`
    SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE account_id = ${accountId};`;
  const payload = JSON.stringify(msg);
  const results = await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' });
        return 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${s.id};`.catch(() => undefined);
        } else {
          console.error('[push] send failed', status ?? '', err instanceof Error ? err.message : err);
        }
        return 0;
      }
    }),
  );
  return results.reduce<number>((n, r) => n + r, 0);
}

/** A client has one PROOF login (client_accounts.onboarding_id is unique). */
export async function pushToClient(onboardingId: number, msg: PushMessage): Promise<number> {
  if (!isPushConfigured() || !isDatabaseConfigured()) return 0;
  await ensureSchema();
  const { rows } = await sql<{ id: number }>`SELECT id FROM client_accounts WHERE onboarding_id = ${onboardingId} LIMIT 1;`;
  return rows[0] ? sendPush(Number(rows[0].id), msg) : 0;
}
```

- [ ] **Step 5: The service worker**

```js
// public/sw.js
// AxeonPROOF's service worker: shows lead notifications and opens the lead when
// one is tapped. Payloads carry only a title, one line and a PROOF path
// (lib/pushShared.ts), never a phone number or a message. No caching: PROOF is
// always live data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' ? data.title : 'New lead activity';
  const body = typeof data.body === 'string' ? data.body : 'Open AxeonPROOF to see it.';
  // Only a path on this site: never an outside link.
  const url = typeof data.url === 'string' && /^\/(?!\/)/.test(data.url) ? data.url : '/';
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: '/icon.png', badge: '/icon.png', tag: url, renotify: true, data: { url } }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of windows) {
        if ('focus' in w) {
          await w.navigate(url).catch(() => undefined);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
```

- [ ] **Step 6: Make PROOF installable (iPhone push needs it)**

```json
{
  "name": "AxeonPROOF",
  "short_name": "PROOF",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#F3F5F8",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icon.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/apple-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

Save it as `public/proof.webmanifest`. In `app/proof/layout.tsx` extend `metadata`:

```ts
export const metadata: Metadata = {
  title: { absolute: 'AxeonPROOF' },
  robots: { index: false, follow: false, nocache: true },
  // Installable, so an iPhone can get lead notifications (iOS only pushes to Home Screen apps).
  manifest: '/proof.webmanifest',
  appleWebApp: { capable: true, title: 'AxeonPROOF', statusBarStyle: 'default' },
};
```

In `next.config.mjs` `headers()`, add an entry after the `/t.js` one:

```js
      {
        // The service worker must update the moment a new one ships.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
```

(`/sw.js` and `/proof.webmanifest` are served on the app host as-is: `isSharedPath` in `lib/hostRouting.ts` passes any path with a dot.)

- [ ] **Step 7: The button**

```tsx
'use client';

// components/proof/NotificationsButton.tsx
// "Turn on notifications" in the PROOF header (AxeonCORE and up). Registers
// public/sw.js, asks the browser, subscribes with the VAPID public key and
// saves the subscription. On an iPhone that has not added PROOF to the Home
// Screen it explains how instead, because iOS only pushes to Home Screen apps.
import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { needsHomeScreenInstall, urlBase64ToUint8Array } from '@/lib/pushShared';

type State = 'checking' | 'off' | 'working' | 'on' | 'blocked' | 'install' | 'unsupported' | 'error';

const BUTTON = 'inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50';

export function NotificationsButton({ publicKey, api = '/api/proof/push/subscribe' }: { publicKey: string; api?: string }) {
  const [state, setState] = useState<State>('checking');
  const [tip, setTip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const set = (s: State) => {
      if (!cancelled) setState(s);
    };
    (async () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (needsHomeScreenInstall(navigator.userAgent, standalone)) return set('install');
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return set('unsupported');
      if (Notification.permission === 'denied') return set('blocked');
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      set(sub && Notification.permission === 'granted' ? 'on' : 'off');
    })().catch(() => set('off'));
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'blocked' : 'off');
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      setState(res.ok ? 'on' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'checking' || state === 'unsupported') return null;
  if (state === 'on') {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
        <BellRing size={14} /> Notifications on
      </span>
    );
  }
  if (state === 'blocked') {
    return <span className="text-xs text-neutral-500">Notifications are blocked in this browser&apos;s settings.</span>;
  }
  if (state === 'install') {
    return (
      <span className="relative">
        <button type="button" className={BUTTON} onClick={() => setTip((v) => !v)} aria-expanded={tip}>
          <Bell size={14} /> Get lead alerts
        </button>
        {tip ? (
          <span role="note" className="absolute right-0 top-10 z-40 w-64 rounded-lg bg-white p-3 text-xs text-neutral-700 shadow-lg ring-1 ring-neutral-200">
            On iPhone: tap Share, then Add to Home Screen, then open AxeonPROOF from your Home Screen and tap this again.
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <button type="button" className={BUTTON} onClick={turnOn} disabled={state === 'working'}>
      <Bell size={14} /> {state === 'working' ? 'Turning on…' : state === 'error' ? 'Try notifications again' : 'Turn on notifications'}
    </button>
  );
}
```

- [ ] **Step 8: The subscribe route**

```ts
// app/api/proof/push/subscribe/route.ts
// POST { subscription }: saves this browser for lead notifications, for the
// signed-in client (AxeonCORE and up). Only real push-service endpoints are
// accepted (lib/pushShared.ts isValidSubscription).
import { NextResponse } from 'next/server';
import { inboxAccount, NO_STORE } from '@/lib/inboxServer';
import { isPushConfigured, savePushSubscription } from '@/lib/push';
import { isValidSubscription } from '@/lib/pushShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  if (!isPushConfigured()) return NextResponse.json({ error: 'Notifications are not switched on yet' }, { status: 503, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { subscription?: unknown } | null;
  const sub = body?.subscription;
  if (!isValidSubscription(sub)) return NextResponse.json({ error: 'This browser sent a subscription we cannot use' }, { status: 400, headers: NO_STORE });
  try {
    await savePushSubscription(auth.account.id, sub);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error('[proof/push/subscribe]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'That did not save. Try again.' }, { status: 502, headers: NO_STORE });
  }
}
```

- [ ] **Step 9: Type-check, test, build**

Run: `npm run test:inbox && npm run lint && npm run build`
Expected: PASS, clean, and a build that compiles `web-push` into the Node routes (if the build reports that `web-push` cannot be bundled, add `serverExternalPackages: ['web-push']` to `nextConfig` in `next.config.mjs` and build again).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json lib/pushShared.ts lib/pushShared.test.ts lib/push.ts public/sw.js public/proof.webmanifest app/proof/layout.tsx next.config.mjs components/proof/NotificationsButton.tsx app/api/proof/push
git commit -m "feat(inbox): web push for lead alerts, service worker, installable PROOF

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Alerts: push first, a text to the owner as the fallback

**Files:**
- Create: `lib/leadNotify.ts`
- Modify: `app/api/phone/sms/route.ts` (inbound text → alert)
- Modify: `app/api/phone/voice/status/route.ts` (missed call → alert)
- Modify: `app/api/lead/route.ts` and the slice-2 alert function (A4): form → push first, SMS fallback

**Interfaces:**
- Consumes: `pushToClient` (Task 9); `leadPushMessage`, `ownerAlertText`, `LeadActivity` (Task 9); `recordAlert`, `alertedRecently` (Task 4); `OWNER_TEXT_THROTTLE_MINUTES` (Task 2); `getLine`, `sendClientSms` (`lib/phoneLines.ts`, `'alert'` kind per A2); `APP_ORIGIN` (`lib/hostRouting.ts`).
- Produces: `type NotifyResult = 'push' | 'sms' | 'none'`; `notifyLeadActivity(onboardingId: number, contactId: number, what: LeadActivity, smsFallback?: () => Promise<unknown>): Promise<NotifyResult>`. Slice 6 (Messenger, Instagram) calls the same function with `'messenger'` / `'instagram'` after its own `upsertContactEvent`; nothing else is needed for those channels.

- [ ] **Step 1: Write the notifier**

```ts
// lib/leadNotify.ts
// Telling the owner a lead just did something (spec, slice 4 "Push" and
// "Slice 4 additions"): a push to every device they turned notifications on
// for; if none took it, a text to their cell through their own line, at most
// one per lead per OWNER_TEXT_THROTTLE_MINUTES. A missed call gets push only:
// the forwarded call already rang (and shows as missed on) the owner's phone.
// Callers that already have their own fallback (slice 2's form alert) pass it.
// Server-only.
import { alertedRecently, recordAlert } from '@/lib/contacts';
import { OWNER_TEXT_THROTTLE_MINUTES } from '@/lib/contactsShared';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { getLine, sendClientSms } from '@/lib/phoneLines';
import { pushToClient } from '@/lib/push';
import { leadPushMessage, ownerAlertText, type LeadActivity } from '@/lib/pushShared';

export type NotifyResult = 'push' | 'sms' | 'none';

async function textOwner(onboardingId: number, contactId: number, what: LeadActivity): Promise<boolean> {
  const line = await getLine(onboardingId);
  if (!line || line.status !== 'active') return false;
  if (await alertedRecently(contactId, OWNER_TEXT_THROTTLE_MINUTES)) return false;
  const res = await sendClientSms(line, line.forwardTo, ownerAlertText(what, contactId, APP_ORIGIN), 'alert');
  if (res.sent) await recordAlert(onboardingId, contactId, 'sms');
  return res.sent;
}

export async function notifyLeadActivity(onboardingId: number, contactId: number, what: LeadActivity, smsFallback?: () => Promise<unknown>): Promise<NotifyResult> {
  let pushed = 0;
  try {
    pushed = await pushToClient(onboardingId, leadPushMessage(what, contactId));
  } catch (err) {
    console.error('[leadNotify] push', err instanceof Error ? err.message : err);
  }
  if (pushed > 0) return 'push';
  if (smsFallback) {
    await smsFallback();
    return 'sms';
  }
  if (what === 'call') return 'none';
  return (await textOwner(onboardingId, contactId, what)) ? 'sms' : 'none';
}
```

- [ ] **Step 2: Inbound texts alert the owner**

In `app/api/phone/sms/route.ts` add:

```ts
import { after } from 'next/server';
import { notifyLeadActivity } from '@/lib/leadNotify';
```

Replace the projection Task 6 added (`await projectMessage(p.MessageSid).catch(…);`) with:

```ts
      const projected = await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', err instanceof Error ? err.message : err);
        return null;
      });
      // After Twilio has its answer: push first, a text to the owner if push is not on. Not for STOP / START.
      if (projected && from !== 'unknown' && !isStopWord(p.Body) && !isStartWord(p.Body)) {
        const onboardingId = line.onboardingId;
        after(() =>
          notifyLeadActivity(onboardingId, projected.contactId, 'text').then(
            () => undefined,
            (err) => console.error('[phone/sms] alert', err instanceof Error ? err.message : err),
          ),
        );
      }
```

- [ ] **Step 3: Missed calls alert the owner (push only)**

In `app/api/phone/voice/status/route.ts` add:

```ts
import { after } from 'next/server';
import { notifyLeadActivity } from '@/lib/leadNotify';
```

Change the first projection Task 6 added from `await projectCall(p.CallSid).catch(…)` to `const projected = await projectCall(p.CallSid).catch(…)` (same body). Then, directly before the final `return twiml(afterDialTwiml({ textedBack }));`, add:

```ts
  // Only missed calls reach here (answered returned above).
  if (projected) {
    const onboardingId = line.onboardingId;
    after(() =>
      notifyLeadActivity(onboardingId, projected.contactId, 'call').then(
        () => undefined,
        (err) => console.error('[phone/status] alert', err instanceof Error ? err.message : err),
      ),
    );
  }
```

- [ ] **Step 4: Forms: push first, slice 2's text as the fallback**

In `app/api/lead/route.ts`, change Task 6's `await projectForm(submission.id).catch(…)` to `const projected = await projectForm(submission.id).catch(…)` (same body), and pass `projected?.contactId ?? null` as a new last argument to the alert call, e.g. `await sendLeadAlerts(onboarding, line, submission, projected?.contactId ?? null);`.

In the alert function (A4, assumed `sendLeadAlerts` in `lib/leadAlerts.ts`):

1. Add the parameter `contactId: number | null = null` at the end of its signature.
2. Add `import { notifyLeadActivity } from '@/lib/leadNotify';`.
3. Leave the alert email exactly as it is (it always goes).
4. Replace the statement that texts the owner, `await sendClientSms(line, line.forwardTo, smsBody, 'alert');` (keep the body expression it passes today; `smsBody` stands for that existing expression's variable), and any `if (line …)` guard wrapped directly around it, with:

```ts
  // Push first; the owner text is the fallback (spec, "Slice 4 additions").
  const textOwner = async () => {
    if (line && line.status === 'active') await sendClientSms(line, line.forwardTo, smsBody, 'alert');
  };
  if (contactId) await notifyLeadActivity(onboarding.id, contactId, 'form', textOwner);
  else await textOwner();
```

If the existing guard checked more than `line` (for example `line.smsStatus === 'ready'`), keep that condition inside `textOwner` as well; `sendClientSms` checks `sms_status` itself either way.

- [ ] **Step 5: Type-check and try it**

Run: `npm run lint && npm run test:phone && npm run test:inbox`
Expected: clean and PASS.

With `WEB_PUSH_*` unset locally, `notifyLeadActivity(<onb>, <contact>, 'call')` in `npx tsx` returns `'none'`; `'text'` with a `ready` line returns `'sms'` the first time and `'none'` the second time within 30 minutes (throttle), and the contact's timeline shows one "you were sent a text about this lead" alert.

- [ ] **Step 6: Commit**

```bash
git add lib/leadNotify.ts app/api/phone app/api/lead lib
git commit -m "feat(inbox): lead alerts go push-first with a throttled text fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: The Leads tab becomes the inbox

**Files:**
- Modify: `lib/proofDashboardData.ts` (load the inbox for the Leads tab; hide matched taps from the anonymous list; pass the push key)
- Create: `components/proof/InboxTab.tsx`
- Modify: `components/proof/ProofDashboard.tsx` (new props; Leads branch; header button)
- Modify: `app/proof/page.tsx` and `app/admin/onboarding/[token]/preview/page.tsx` (`?contact=`)

**Interfaces:**
- Consumes: `listInbox`, `contactTimeline`, `attachedClickIds` (Task 4); `inboxEnabled`, `parseContactId`, `DashboardInbox` and the display helpers (Task 2); `NotificationsButton` (Task 9); `getLine` and `line.timeZone` (A3); `LeadLog` (existing).
- Produces:
  - `loadDashboardData(onboarding, tab = 'overview', opts: { contactId?: number | null } = {})`; `DashboardData` gains `inbox: DashboardInbox | null` and `pushKey: string | null`.
  - `ProofDashboard` props `inbox?: DashboardInbox | null`, `inboxApi?: string | null` (null = read-only), `pushKey?: string | null`.
  - `<InboxTab inbox={…} api={…} />`.

- [ ] **Step 1: Load the inbox in `lib/proofDashboardData.ts`**

Add the imports:

```ts
import { attachedClickIds, contactTimeline, listInbox } from '@/lib/contacts';
import { DEFAULT_TIME_ZONE, inboxEnabled, type DashboardInbox } from '@/lib/contactsShared';
```

Change the `DashboardData` type so the page-level props stay outside it:

```ts
export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi' | 'inboxApi' | 'tab'>;
```

Change the signature:

```ts
export async function loadDashboardData(onboarding: Onboarding, tab: ProofTabKey = 'overview', opts: { contactId?: number | null } = {}): Promise<DashboardData> {
```

After the `const phone: DashboardPhone | null = …;` block, add:

```ts
  // The leads inbox (AxeonCORE and up): loaded only for the Leads tab; ?contact=<id> opens one person.
  const inboxOn = inboxEnabled(onboarding.tier);
  const inbox: DashboardInbox | null =
    inboxOn && tab === 'leads'
      ? await (async (): Promise<DashboardInbox> => {
          const [list, selected] = await Promise.all([
            listInbox(onboarding.id, { limit: 50 }),
            opts.contactId ? contactTimeline(onboarding.id, opts.contactId) : Promise.resolve(null),
          ]);
          return {
            ...list,
            selected,
            timeZone: line?.timeZone ?? DEFAULT_TIME_ZONE,
            texting: !line ? 'none' : line.smsStatus === 'ready' ? 'ready' : 'pending',
          };
        })()
      : null;
  // Taps already matched to a caller live in the inbox; the anonymous list keeps the rest.
  const attached = inboxOn ? await attachedClickIds(onboarding.id, [...thisLeads, ...lastLeads].map((r) => r.id)) : new Set<number>();
  const pushKey = inboxOn && process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY ? process.env.WEB_PUSH_PUBLIC_KEY : null;
```

In the returned object, change the two lead months to filter matched taps out:

```ts
    leads: [
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads.filter((r) => !attached.has(r.id)) },
      { month: previous, label: monthLabel(previous), rows: lastLeads.filter((r) => !attached.has(r.id)) },
    ],
```

and add, next to `phone,`:

```ts
    inbox,
    pushKey,
```

- [ ] **Step 2: Write the inbox tab**

```tsx
'use client';

// components/proof/InboxTab.tsx
// The Leads tab for AxeonCORE and up (spec, "Slice 4 design"): one row per
// person who reached out, newest activity first, and that person's page: who
// they are, where they came from, a stage, every call, text and form in order
// with the recording attached, and a reply box that texts from the client's
// tracked number. Everything arrives pre-masked from the server (lib/contacts.ts);
// no full number is ever in this component. `api` is null in the admin's "View
// as client", which makes the tab read-only. Not a CRM: no tasks, no pipeline
// board, no custom fields.
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Bot, CalendarCheck, FileText, Mail, MessageSquare, MousePointerClick, PhoneCall, Send, StickyNote } from 'lucide-react';
import {
  CONTACT_STAGES, REPLY_REFUSAL_COPY, STAGE_LABELS, canReplyNow, formatWhen, quietNotice, relativeWhen, shortName,
  type ContactAction, type ContactEventKind, type ContactStage, type DashboardContact, type DashboardContactView, type DashboardEvent, type DashboardInbox,
} from '@/lib/contactsShared';
import { SMS_MAX_CHARS } from '@/lib/phoneShared';

type Icon = typeof PhoneCall;

const KIND_ICONS: Record<ContactEventKind, Icon> = {
  call: PhoneCall, text_in: MessageSquare, text_out: MessageSquare, form: FileText, booking: CalendarCheck, chat: Bot,
  click: MousePointerClick, note: StickyNote, alert: Bell, sequence: MessageSquare, reminder: CalendarCheck, messenger: MessageSquare, instagram: MessageSquare,
};

const STAGE_TONES: Record<ContactStage, string> = {
  new: 'bg-blue-50 text-blue-800 ring-blue-200',
  contacted: 'bg-amber-50 text-amber-800 ring-amber-200',
  booked: 'bg-violet-50 text-violet-800 ring-violet-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

const OUTGOING: readonly ContactEventKind[] = ['text_out', 'sequence', 'reminder'];

function StageBadge({ stage }: { stage: ContactStage }) {
  return <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${STAGE_TONES[stage]}`}>{STAGE_LABELS[stage]}</span>;
}

const errorText = (data: unknown, fallback: string) =>
  data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : fallback;

function ContactList({ contacts, nextCursor, selectedId, api }: { contacts: DashboardContact[]; nextCursor: string | null; selectedId: number | null; api: string | null }) {
  const [rows, setRows] = useState(contacts);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRows(contacts);
    setCursor(nextCursor);
  }, [contacts, nextCursor]);

  async function more() {
    if (!api || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${api}?cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as { contacts?: DashboardContact[]; nextCursor?: string | null };
      const page = data.contacts;
      if (!res.ok || !page) throw new Error(errorText(data, 'Could not load older leads. Try again.'));
      setRows((r) => [...r, ...page]);
      setCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load older leads. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-neutral-500">No one has reached out yet. Calls, texts and forms show up here within a minute.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {rows.map((c) => {
            const name = shortName(c.name);
            return (
              <li key={c.id}>
                <Link
                  href={`?tab=leads&contact=${c.id}`}
                  scroll={false}
                  aria-current={c.id === selectedId ? 'true' : undefined}
                  className={`block px-4 py-3 hover:bg-neutral-50 ${c.id === selectedId ? 'bg-blue-50/70' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">{name ? `${name} · ${c.who}` : c.who}</p>
                    <StageBadge stage={c.stage} />
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {c.lastVerb ? `${c.lastVerb} · ` : ''}
                    <span suppressHydrationWarning>{relativeWhen(c.lastActivityAt)}</span>
                    {c.lastSummary ? ` · ${c.lastSummary}` : ''}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {cursor && api ? (
        <div className="border-t border-neutral-100 p-3 text-center">
          <button type="button" onClick={more} disabled={loading} className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50">
            {loading ? 'Loading…' : 'Show older leads'}
          </button>
          {error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function NameLine({ contact, api }: { contact: DashboardContact; api: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(contact.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!api) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${api}/${contact.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value }) });
      if (!res.ok) throw new Error(errorText(await res.json().catch(() => null), 'That did not save. Try again.'));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (editing && api) {
    return (
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          autoFocus
          aria-label="Name"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-base sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs font-semibold text-neutral-600">
          Cancel
        </button>
        {error ? <p role="alert" className="w-full text-xs text-red-700">{error}</p> : null}
      </form>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-bold text-neutral-950">{contact.name ?? 'No name yet'}</h3>
      {api ? (
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-700 hover:underline">
          {contact.name ? 'Edit' : 'Add name'}
        </button>
      ) : null}
    </div>
  );
}

function StageChips({ contact, api }: { contact: DashboardContact; api: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<ContactAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: ContactAction) {
    if (!api) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`${api}/${contact.id}/stage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error(errorText(await res.json().catch(() => null), 'That did not save. Try again.'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not save. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Stage">
        {CONTACT_STAGES.map((s) => {
          const active = s === contact.stage;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              disabled={!api || busy !== null}
              onClick={() => (active ? undefined : act(s))}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors disabled:cursor-default ${active ? STAGE_TONES[s] : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50'}`}
            >
              {busy === s ? 'Saving…' : STAGE_LABELS[s]}
            </button>
          );
        })}
        <button
          type="button"
          disabled={!api || busy !== null}
          onClick={() => act('quote_sent')}
          className="ml-1 rounded-full px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50 disabled:cursor-default disabled:opacity-60"
        >
          {busy === 'quote_sent' ? 'Saving…' : 'Quote sent'}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">Won and Lost count toward your close rate.</p>
      {error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function EventItem({ e, api }: { e: DashboardEvent; api: string | null }) {
  const outgoing = OUTGOING.includes(e.kind);
  if (e.text !== null) {
    return (
      <li className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${outgoing ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
          <p className="whitespace-pre-wrap break-words">{e.text}</p>
          <p className={`mt-1 text-[11px] ${outgoing ? 'text-blue-100' : 'text-neutral-500'}`}>
            {formatWhen(e.at)}
            {e.automatic ? ' · sent automatically' : ''}
          </p>
        </div>
      </li>
    );
  }
  const Icon = KIND_ICONS[e.kind];
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900">
          <span className="font-semibold">{e.verb}</span> · {e.summary}
        </p>
        <p className="text-[11px] text-neutral-500">{formatWhen(e.at)}</p>
        {e.call?.hasRecording ? (
          api ? (
            <audio controls preload="none" aria-label="Call recording" className="mt-2 h-8 w-full max-w-xs" src={`/api/proof/recording/${encodeURIComponent(e.call.callSid)}`} />
          ) : (
            <p className="mt-1 text-xs text-neutral-500">Recorded</p>
          )
        ) : null}
        {e.fields.length > 0 ? (
          <dl className="mt-2 space-y-1 rounded-lg bg-neutral-50 p-3 text-xs">
            {e.fields.map((f) => (
              <div key={f.label}>
                <dt className="font-semibold text-neutral-600">{f.label}</dt>
                <dd className="whitespace-pre-wrap break-words text-neutral-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </li>
  );
}

function ReplyBox({ contact, api, timeZone, texting }: { contact: DashboardContact; api: string | null; timeZone: string; texting: DashboardInbox['texting'] }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quiet, setQuiet] = useState<string | null>(null);
  // Computed after mount: the server's clock and the phone's can disagree by a minute.
  useEffect(() => {
    const w = canReplyNow(new Date(), timeZone);
    setQuiet(w.ok ? null : quietNotice(w.sendAt, timeZone, false));
  }, [timeZone]);

  const blocked = contact.optedOut ? 'opted_out' : !contact.hasPhone ? 'no_phone' : texting === 'none' ? 'no_line' : texting === 'pending' ? 'sms_pending' : null;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!api || !body.trim()) return;
    setSending(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`${api}/${contact.id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
      const data = (await res.json().catch(() => null)) as { status?: string; sendAt?: string } | null;
      if (!res.ok) throw new Error(errorText(data, 'Your text did not go out. Try again.'));
      setBody('');
      if (data?.status === 'held' && typeof data.sendAt === 'string') setNote(quietNotice(data.sendAt, timeZone, true));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your text did not go out. Try again.');
    } finally {
      setSending(false);
    }
  }

  if (!api) return <p className="border-t border-neutral-100 p-4 text-sm text-neutral-500">Read-only preview. Replies are sent from the client&apos;s own login.</p>;
  if (blocked) {
    return (
      <div className="border-t border-neutral-100 p-4">
        {blocked === 'opted_out' ? (
          <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
            This person asked not to be texted.
          </p>
        ) : (
          <p className="text-sm text-neutral-500">{REPLY_REFUSAL_COPY[blocked]}</p>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={send} className="border-t border-neutral-100 p-4">
      {quiet ? <p className="mb-2 text-xs text-amber-800">{quiet}</p> : null}
      <label htmlFor={`reply-${contact.id}`} className="sr-only">
        Text this lead
      </label>
      <textarea
        id={`reply-${contact.id}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={SMS_MAX_CHARS}
        placeholder="Text them back from your tracked number"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {body.trim().length}/{SMS_MAX_CHARS}
        </span>
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={14} /> {sending ? 'Sending…' : 'Send text'}
        </button>
      </div>
      {note ? <p role="status" className="mt-2 text-xs text-emerald-800">{note}</p> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
    </form>
  );
}

function ContactView({ view, api, timeZone, texting }: { view: DashboardContactView; api: string | null; timeZone: string; texting: DashboardInbox['texting'] }) {
  const c = view.contact;
  const timeline = useRef<HTMLOListElement>(null);
  // Newest at the bottom, next to the reply box, like any text thread.
  useEffect(() => {
    if (timeline.current) timeline.current.scrollTop = timeline.current.scrollHeight;
  }, [view.events.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <header className="border-b border-neutral-100 p-4 sm:p-5">
        <Link href="?tab=leads" scroll={false} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 lg:hidden">
          <ArrowLeft size={14} /> All leads
        </Link>
        <NameLine key={c.name ?? ''} contact={c} api={api} />
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          <span>{c.who}</span>
          {c.hasEmail && api ? (
            <a href={`${api}/${c.id}/email`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
              <Mail size={14} /> Email
            </a>
          ) : null}
        </div>
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs text-neutral-500 sm:grid-cols-3">
          <div>
            <dt className="inline">From </dt>
            <dd className="inline font-medium text-neutral-800">{c.sourceLabel}</dd>
          </div>
          <div>
            <dt className="inline">First seen </dt>
            <dd className="inline font-medium text-neutral-800">{formatWhen(c.firstSeenAt)}</dd>
          </div>
          <div>
            <dt className="inline">Last activity </dt>
            <dd className="inline font-medium text-neutral-800">{formatWhen(c.lastActivityAt)}</dd>
          </div>
        </dl>
        <StageChips contact={c} api={api} />
      </header>
      <ol ref={timeline} className="max-h-[60vh] space-y-4 overflow-y-auto p-4" aria-label="Everything from this lead">
        {view.events.length === 0 ? <li className="text-sm text-neutral-500">Nothing yet.</li> : view.events.map((e) => <EventItem key={e.id} e={e} api={api} />)}
        {view.held.map((h) => (
          <li key={`held-${h.id}`} className="flex justify-end">
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1 ${h.status === 'failed' ? 'bg-red-50 text-red-900 ring-red-200' : 'bg-amber-50 text-amber-950 ring-amber-200'}`}>
              <p className="whitespace-pre-wrap break-words">{h.body}</p>
              <p className="mt-1 text-[11px]">{h.status === 'failed' ? 'This text did not go out. Send it again from the box below.' : quietNotice(h.sendAt, timeZone, true)}</p>
            </div>
          </li>
        ))}
      </ol>
      <ReplyBox contact={c} api={api} timeZone={timeZone} texting={texting} />
    </div>
  );
}

export function InboxTab({ inbox, api }: { inbox: DashboardInbox; api: string | null }) {
  const selected = inbox.selected;
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(300px,400px)_1fr]">
      <div className={selected ? 'hidden lg:block' : ''}>
        <ContactList contacts={inbox.contacts} nextCursor={inbox.nextCursor} selectedId={selected?.contact.id ?? null} api={api} />
      </div>
      <div className={selected ? '' : 'hidden lg:block'}>
        {selected ? (
          <ContactView key={selected.contact.id} view={selected} api={api} timeZone={inbox.timeZone} texting={inbox.texting} />
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            Pick a lead to see every call, text and form from them, and to text them back.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire it into `components/proof/ProofDashboard.tsx`**

Add the imports:

```tsx
import { InboxTab } from '@/components/proof/InboxTab';
import { NotificationsButton } from '@/components/proof/NotificationsButton';
import type { DashboardInbox } from '@/lib/contactsShared';
```

Add to the destructured props (after `phone = null,`):

```tsx
  inbox = null,
  inboxApi = null,
  pushKey = null,
```

and to the props type (after `phone?: DashboardPhone | null;`):

```tsx
  /** The leads inbox for AxeonCORE and up, loaded for the Leads tab only (lib/proofDashboardData.ts). Null: today's Leads list. */
  inbox?: DashboardInbox | null;
  /** Where the inbox calls home: '/api/proof/inbox' on the client's page; null in the admin preview (read-only). */
  inboxApi?: string | null;
  /** VAPID public key when push is set up and the plan has the inbox; shows "Turn on notifications". */
  pushKey?: string | null;
```

In the header row, inside `<div className="flex items-center gap-2">` (the one holding the plan badge and the Live pill), add as its first child:

```tsx
            {pushKey && !preview ? <NotificationsButton publicKey={pushKey} /> : null}
```

Replace the Leads branch, from `tab === 'leads' ? (` up to (not including) `) : tab === 'email' ? (`, with:

```tsx
          tab === 'leads' ? (
            inbox ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Leads</h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  Everyone who called, texted or sent your form, newest first. Tap a person to see everything from them, mark how it went, and text them back from your tracked number.
                </p>
                <InboxTab inbox={inbox} api={preview ? null : inboxApi} />
                {leads.some((m) => m.rows.length > 0) ? (
                  <div className="mt-10">
                    <h3 className="text-base font-semibold text-neutral-950">Website taps we could not match to a caller</h3>
                    <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                      Someone tapped a button on your site, but no call or text from a new number followed within 10 minutes. Mark the ones that became customers.
                    </p>
                    <LeadLog months={leads} api={leadApi} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
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
            )
```

The `: (` branch is today's Leads tab exactly as it is in the file now. If slice 2 added its form-submission list to that block, it stays in this Essentials branch only; if slice 3 added stage buttons (Quote sent and the like) to it, remove them from the dashboard: the inbox has them, and `/api/proof/leads/stage` (Task 8) still accepts their posts.

- [ ] **Step 4: Pass `?contact=` from both pages**

`app/proof/page.tsx`, whole file:

```tsx
// app/proof/page.tsx
// app.axeonstudio.co: the AxeonPROOF welcome / sign-in page, or the client's
// dashboard once they are signed in. ?contact=<id> opens one lead in the inbox
// (the link a lead notification opens).
import { getSignedInClient } from '@/lib/proofServer';
import { getOnboardingById } from '@/lib/onboarding';
import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { SignInForm } from '@/components/proof/ProofForms';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';
import { isProofTab } from '@/lib/proofTabs';
import { parseContactId } from '@/lib/contactsShared';

export const dynamic = 'force-dynamic';

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ tab?: string; contact?: string }> }) {
  const { tab, contact } = await searchParams;
  const account = await getSignedInClient();
  const onboarding = account ? await getOnboardingById(account.onboardingId).catch(() => null) : null;

  if (!account || !onboarding) {
    return (
      <ProofAuthShell title="Welcome back" subtitle="Sign in with your business email and password.">
        <SignInForm />
      </ProofAuthShell>
    );
  }

  const key = isProofTab(tab) ? tab : 'overview';
  const data = await loadDashboardData(onboarding, key, { contactId: parseContactId(contact) });
  return <ProofDashboard email={account.email} {...data} leadApi="/api/proof/leads" inboxApi="/api/proof/inbox" scanApi="/api/proof/scan" tab={key} />;
}
```

(A signed-out tap on a notification lands on the sign-in page; after signing in the client opens Leads. The sign-in form's redirect is unchanged in this slice.)

In `app/admin/onboarding/[token]/preview/page.tsx`: change the `searchParams` type to `Promise<{ tab?: string; contact?: string }>`, read `const { tab, contact } = await searchParams;`, add `import { parseContactId } from '@/lib/contactsShared';`, and load with `loadDashboardData(onboarding, key, { contactId: parseContactId(contact) })`. Pass no `inboxApi`: the preview's inbox is read-only (no reply, no stage taps, no Email button, recordings shown as "Recorded").

- [ ] **Step 5: Type-check, build and look at it**

Run: `npm run lint && npm run build`
Expected: clean; build succeeds.

`npm run dev`, then as an AxeonCORE test client with the backfill run (Task 8) and a line:

1. Leads tab: one row per person, newest first; rows read like `Mike R. · (515) 555-01··` / `Called · 2 min ago · missed, texted back`.
2. Tap a row: the URL gains `&contact=<id>`; header, stage chips, timeline (calls with a player, texts as bubbles with "sent automatically" on the text-back, forms with their fields), reply box. On a phone the list hides and "All leads" goes back.
3. View source / React DevTools props: no `+1` number and no full email anywhere (Review Focus 1).
4. An opted-out contact shows "This person asked not to be texted." and no reply box. A contact with only an email shows the email copy and an Email button.
5. Admin "View as client" → Leads: same list and timeline, no reply box ("Read-only preview"), chips disabled, no Email button, no notifications button.
6. An Essentials client's Leads tab is unchanged.

- [ ] **Step 6: Commit**

```bash
git add lib/proofDashboardData.ts components/proof/InboxTab.tsx components/proof/ProofDashboard.tsx app/proof/page.tsx "app/admin/onboarding/[token]/preview/page.tsx"
git commit -m "feat(inbox): Leads tab becomes the leads inbox for AxeonCORE and up

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Docs, environment, and go-live

**Files:**
- Modify: `docs/onboarding.md` (new section "The leads inbox"; env table rows; one line in the phone section)
- Modify: `.env.example`

**Interfaces:**
- Consumes: everything above.
- Produces: the owner's go-live checklist.

- [ ] **Step 1: `.env.example`**

After the Twilio block (after `PHONE_WEBHOOK_ORIGIN=`), add:

```bash

# --- Web push (lib/push.ts): lead notifications in AxeonPROOF ---
# Generate once with: npx web-push generate-vapid-keys
# Without them every lead alert falls back to a text to the owner's cell.
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
# Optional. Contact for the push services; default mailto:hello@axeonstudio.co
WEB_PUSH_SUBJECT=
```

- [ ] **Step 2: `docs/onboarding.md`**

In "The tracked phone number" section, replace the sentence `Replying from PROOF is slice 4.` with `Replying from PROOF: see "The leads inbox" below.`

Insert a new section directly before `## Environment variables`:

```markdown
## The leads inbox (AxeonCORE and up)

Built 2026-10-13 (slice 4 of `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md`).
The PROOF Leads tab is one list of every person who reached out: a contact per
phone number or email, a stage, everything they did in order, and a reply box.
It is not a CRM: no tasks, pipeline board, custom fields or import. A client who
needs those runs Jobber, Housecall Pro or ServiceTitan, and the right answer is a
"send booked leads to" integration, built when a client asks.

| Piece | Where |
| --- | --- |
| Rules, masking, quiet hours (client-safe) | `lib/contactsShared.ts` |
| Contacts, merge, stage, projections, backfill | `lib/contacts.ts` |
| Replies and held replies | `lib/inboxReply.ts`, `/api/cron/held-replies` (every 15 min) |
| Push | `lib/pushShared.ts`, `lib/push.ts`, `public/sw.js`, `public/proof.webmanifest` |
| Alerts (push first, text fallback) | `lib/leadNotify.ts` |
| Client API | `/api/proof/inbox`, `/api/proof/inbox/<id>` (+ `/reply`, `/stage`, `/email`), `/api/proof/push/subscribe` |
| Admin | `POST /api/admin/contacts/backfill` `{ onboardingId? }` |
| UI | `components/proof/InboxTab.tsx`, `components/proof/NotificationsButton.tsx` |
| Tables | `contacts`, `contact_events`, `push_subscriptions`, `held_replies` |
| Tests | `npm run test:inbox` |

**How a lead becomes a contact.** Every producer writes its own table first
(`phone_calls`, `phone_messages`, `form_submissions`), then calls one projection
in `lib/contacts.ts`. The projection re-reads the source row and upserts one
`contact_events` row keyed on the source row, so retries and re-runs never
double anything. A phone number is the identity; a form with only an email is
keyed by email. When one event carries the phone of one contact and the email of
another, the two merge into the older one. A tap on the site's call or text
button joins a brand-new caller or texter who shows up within 10 minutes; any
other tap stays in "Website taps we could not match to a caller" below the inbox.

**Stages.** New, Contacted, Booked, Won, Lost, plus a "Quote sent" tap. An
answered call or a typed reply moves New to Contacted by itself; code never moves
a contact backwards or off Won/Lost. Contacted stops the new-lead follow-up;
Booked, Won and Lost stop the quote follow-up too; Won starts the review request;
"Quote sent" starts the quote follow-up. Won and Lost count toward the client's
close rate: through the matched website tap if there is one, directly otherwise.

**Replies** go out from the tracked number through `sendClientSms`, so the opt-out
list and the 10DLC gate apply. Between 9 pm and 8 am client-local a reply is held
and sent at 8 am; the client sees when. Email replies open the client's mail app.

**Privacy.** The browser only gets masked numbers and emails. A push says "New
text from a lead" and links to the lead, nothing else. Recordings play through
the signed-in recording route.

**Push.** "Turn on notifications" in the PROOF header. On an iPhone, PROOF must be
added to the Home Screen first (the button explains). With no device turned on,
an inbound text sends the owner one text per lead per 30 minutes; a form uses
slice 2's alert text; a missed call sends nothing extra (their phone already shows it).
```

In the `## Environment variables` table, add:

```markdown
| `WEB_PUSH_PUBLIC_KEY` | VAPID public key for lead notifications (`npx web-push generate-vapid-keys`). |
| `WEB_PUSH_PRIVATE_KEY` | VAPID private key. Never pasted anywhere but Vercel. |
| `WEB_PUSH_SUBJECT` | Optional. Contact for the push services. Default `mailto:hello@axeonstudio.co`. |
```

- [ ] **Step 3: Full check**

Run: `npm run test:inbox && npm run test:phone && npm run test:onboarding && npm run lint && npm run build`
Expected: all PASS, clean, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/onboarding.md .env.example
git commit -m "docs(inbox): the leads inbox, push keys, go-live

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 5: Go-live (owner, not code)**

1. **VAPID keys.** Run `npx web-push generate-vapid-keys` once. In Vercel (Production and Preview) set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT=mailto:hello@axeonstudio.co`. Redeploy. Keep the private key only in Vercel.
2. **Tables.** They create themselves on the first request (`ensureSchema`); `npm run db:init` against production does the same.
3. **Backfill once.** Signed in to the admin on `app.axeonstudio.co`, in the browser console: `await (await fetch('/api/admin/contacts/backfill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()`. Each client's `calls`, `messages` and `forms` should match the counts of those rows (minus withheld callers and owner alerts). Running it again returns the same numbers and adds nothing.
4. **Retire slice 3's temporary table.** After the backfill shows `stagesCopied` for the clients who had taps: `psql "$POSTGRES_URL" -c "DROP TABLE IF EXISTS lead_stages;"`.
5. **Cron.** Vercel → Settings → Cron Jobs lists `/api/cron/held-replies` every 15 minutes.
6. **Reply test.** As an AxeonCORE test client whose line is `ready`, with your own cell as the lead: open Leads → your contact → send "Test from PROOF" in the daytime. It arrives from the tracked number; the timeline shows it as yours and the stage moves to Contacted. After 9 pm Central, send another: the box says it goes out at 8:00 AM; it arrives between 8:00 and 8:15.
7. **Push test, Android.** Chrome on an Android phone, PROOF signed in → "Turn on notifications" → allow. Text the tracked number from another phone: "New text from a lead" arrives with no number or words in it; tapping it opens that contact.
8. **Push test, iPhone.** Safari → Share → Add to Home Screen → open AxeonPROOF from the Home Screen → "Turn on notifications" → allow → repeat the text.
9. **Fallback test.** Turn notifications off for PROOF in the phone's settings, text the tracked number twice within a few minutes: the owner's cell gets one "New text from a lead…" text, not two.
10. **Opt-out test.** Reply STOP from the test phone: the contact shows "This person asked not to be texted." and the reply box is gone.
11. **Close rate.** Mark a test contact Won, then Lost, then New: the admin's report preview for that client shows the marked count go up by one and back.
