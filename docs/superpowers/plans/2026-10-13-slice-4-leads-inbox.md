# Leads Inbox (Slice 4 of the PROOF Lead System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the AxeonPROOF Leads tab into a leads inbox for AxeonCORE and up: one contact per phone number or email, a stage (New, Contacted, Booked, Won, Lost), a timeline of every call, text and form with the recording attached, a reply box that texts from the client's tracked number, and a push notification when a lead texts, misses a call or sends the form. Not a CRM: no tasks, pipelines, custom fields or import.

**Architecture:** Two new tables, `contacts` and `contact_events`, are a projection of the source tables (`phone_calls`, `phone_messages`, `form_submissions`, `site_events`). Every producer (the Twilio webhooks, `sendClientSms`, the `after()` block of the slice-2 lead route, and slice 3's `claimAndSend` in `lib/sequences.ts`) calls one projection function after it writes its own row; `upsertContactEvent` resolves the contact by E.164 phone or lowercase email, merges two contacts when one event proves they are the same person, and writes the event idempotently on `(ref_table, ref_id, kind, ref_part)`. Only something the lead did (a call, an inbound text, a form) creates a contact; outbound sends attach to an existing one or are skipped. Client stage taps keep going through slice 3's `applyLeadStage` and `STAGE_EFFECTS`: slice 4 swaps the default `LeadStore` for one that writes `contacts.stage` and keeps `form_submissions.stage` / `quote_sent_at` in step, and adds a contact-keyed store for the inbox. Won/Lost write back to the tracker click so the close rate keeps learning. The client page receives pre-masked rows only. Push goes through `web-push` with VAPID keys; without a subscription, the owner gets a text through their own line (outside quiet hours) and an email.

**Tech Stack:** Next.js 15 App Router route handlers (`runtime = 'nodejs'`), `@vercel/postgres` via `lib/db.ts` (plus `db.connect()` for the one merge transaction), `web-push` 3.6.7, a plain service worker in `public/sw.js`, `tsx --test` + `node:assert/strict`, Tailwind + lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md` ("Architecture (all slices)", "Slice 4 design: the leads inbox", "Cross-slice decisions", "Slice 4 additions", "Execution order"). Where "Slice 4 design" says 9 pm, "Cross-slice decisions" (later text wins) says 8 pm; this plan uses 8 pm.

## Global Constraints

- Phone numbers are stored E.164 (`+15155550134`); emails lowercase and trimmed (`normalizeEmail` from `lib/sequenceShared.ts`). Contacts are keyed by `(onboarding_id, phone)` and `(onboarding_id, email)` through the two partial unique indexes from the spec (`WHERE phone IS NOT NULL`, `WHERE email IS NOT NULL`). A withheld caller (`'unknown'`) never becomes a contact.
- Only the lead's own action creates a contact: an inbound call, an inbound text, a website form. Outbound sends (text-back, manual reply, sequence text or email, reminder, confirmation) attach to an existing contact or are skipped; owner alerts are never projected. Admin test leads (`form_submissions.is_test`) and call-connect calls about them never become contacts or events.
- `contact_events` is a projection. The source tables stay authoritative: a projection always re-reads its source row and is idempotent on `(ref_table, ref_id, kind, ref_part)`, so a Twilio retry, a second backfill, or a recording arriving later updates one row and never adds a second.
- The client browser receives pre-masked rows only (`DashboardContact`, `DashboardEvent` from `lib/contactsShared.ts`). A full phone number or full email never leaves the server for the client page or the admin preview. The one exception is the "Email" button, a server redirect to `mailto:`, so the address is never in the page payload. The words of a text or form are shown as the lead wrote them.
- Replies go through `sendClientSms(line, to, body, 'manual')` only, so the opt-out list and the `sms_status` gate apply. Manual replies obey quiet hours, 8 pm to 8 am client-local (`QUIET_START_HOUR`, `QUIET_END_HOUR`, `isQuietHours` from `lib/leadShared.ts`, held time from `holdForQuietHours` in `lib/sequenceSchedule.ts`; never re-implemented): a reply typed in that window is held in `held_replies`, sent at 8 am by a cron, and the client is told so on screen.
- Stages drive sequences through slice 3's `STAGE_EFFECTS` (`lib/sequenceShared.ts`) only: Contacted, Booked, Won and Lost stop `new_lead` and `quote`; Won starts `review`; Quote sent starts `quote`. The client's taps are slice 3's `LEAD_ACTIONS` with `LEAD_ACTION_LABELS` ("Quote sent", "Talked to them", "Booked", "Job done", "Not a fit"); there is no second action list.
- `POST /api/proof/leads/stage` stays backward compatible: `{ id, action }` for a form lead works on every tier and answers `{ ok, id, stage, started, stopped, warning? }` exactly as today; `{ contactId, action }` is added for inbox contacts.
- Recordings play only through the existing `/api/proof/recording/[callSid]` route. A recording URL never goes into an event payload, a push, a text or an email.
- Push payloads, the owner fallback text and the fallback email carry no phone number, no name and no message words: a fixed title such as "New text from a lead", one fixed line, and a link inside PROOF (`/proof?tab=leads&contact=<id>`).
- Owner alert texts obey quiet hours (cross-slice rule, as slice 2's `planLeadDelivery` does); push and email do not.
- Won and Lost keep feeding the close rate: a contact matched to a tracker click writes the outcome onto that `site_events` row (`setLeadOutcome`); a contact with no click is counted directly in `observedCloseRate` / `markedForMonth`. Never both.
- The inbox is AxeonCORE and up (`inboxEnabled(tier)`). Essentials keeps today's Leads tab unchanged: the form list (`FormLeads`) with its stage taps, the tracker list (`LeadLog`), and the empty state.
- Client-facing copy is plain language: "leads", "text them back", "quiet hours". Never "CRM", "pipeline", "workflow", "speed-to-lead".
- Every new table goes in both `lib/db.ts` `ensureSchema()` and `scripts/init-db.mjs`, `IF NOT EXISTS` only.
- Client-safe modules (`lib/contactsShared.ts`, `lib/pushShared.ts`) import nothing from `node:*`, `@/lib/db`, or any server module.
- Reuse, do not copy: `DbId`, `DbTime`, `iso`, `errText` from `lib/dbRows.ts`; `DEFAULT_TIME_ZONE` from `lib/phoneShared.ts`; `safeTimeZone`, `holdForQuietHours` from `lib/sequenceSchedule.ts`; `SequenceKind`, `LeadStage`, `LeadAction`, `STAGE_EFFECTS`, `LEAD_ACTIONS`, `LEAD_ACTION_LABELS`, `normalizeEmail`, `parseStageRequest` from `lib/sequenceShared.ts`; `sendOwnerAlert` from `lib/phoneLines.ts`.
- Tests run with `tsx --test` and `node:assert/strict` and need no database or network; SQL is not unit-tested, pure helpers are, and SQL paths get a scripted local-database check in the task that writes them.
- Commit after every task, repo style (`feat(inbox): …`), ending with the two trailer lines `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR`.

## Review Focus

1. **Nothing identifying leaves the server.** `toDashboardContact` and `toDashboardEvent` are the only shapes the page gets; push payloads, owner fallback texts and fallback emails carry no number, name or message words. Pinned in Task 2 (the masking test serialises a contact and asserts neither the last four digits nor the email domain appear) and Task 9 (the push and owner-text outputs are pinned to exact strings; their functions take only a fixed activity word and a contact id).
2. **The merge is the hard part.** When one event carries the phone of contact A and the email of contact B, the older row is kept, the newer row's events and held replies are re-pointed, the newer row is deleted before the kept row takes its key (no unique violation), the furthest stage wins, and the kept row's forms and matched click follow the merged stage. Pinned in Task 2 (`mergeDecision` tests: older keeps, tie by id, stage, keys filled, earliest quote) and checked in Task 4 step 4 against a local database (`mergeContacts` runs in one transaction in exactly that order).
3. **Projections are idempotent and only lead actions create contacts.** Twilio retries the status webhook, the recording arrives later, the backfill may run twice; none of these may add a second event or a second contact, or move a stage twice. Pinned in Task 3 (unique partial index on `(ref_table, ref_id, kind, ref_part)`) and Task 4 (`ON CONFLICT … DO UPDATE … RETURNING (xmax = 0)`; system stage changes and click matching run only on a fresh insert; `createIfMissing: false` for outbound rows; `NOT is_test` on every form read), checked in Task 4 step 4 and Task 6 step 9.
4. **A reply never goes out when it must not.** No phone, opted out, no line, 10DLC pending: refused, in that order, before anything is held. 8 pm to 8 am: held to 8 am, never sent early. Pinned in Task 2 (`replyBlocker` order; `canReplyNow` at 7:59 am, 8:00 am, 7:59 pm, 8:00 pm, 9:30 pm, midnight, and a bad time zone) and Task 7 (`replyToContact` calls `validateReplyBody` then `replyBlocker` then `canReplyNow`; the held-reply cron claims rows before sending and never re-sends an interrupted one).
5. **Won/Lost feed the close rate exactly once, and stage taps keep slice 3's behaviour.** Stage taps from both the form list and the inbox run `applyLeadStage` (slice 3's tests still pass unchanged); Won/Lost write back to the matched click; unmatched contacts are counted in `lib/siteStats.ts`; matched ones are not counted twice. Pinned in Task 2 (`outcomeForStage`, `sequenceEffects` equals `STAGE_EFFECTS`), Task 4 (`writeContactStage` writes back only when the outcome changes; `npm run test:sequences` stays green) and Task 5 (`NOT EXISTS` click filter in both counts).

---

### Task 1: Confirm what slices 2 and 3 left behind

Slices 2 and 3 were planned in parallel with this one; this plan has been revised against the code at HEAD `23b46f8`. This task changes no code: it re-checks the twelve things the plan builds on, so no later task edits a function that is named differently.

**Files:** none modified.

**Interfaces assumed (verify each):**

| # | What exists (real name and place) | Check | Used in |
|---|---|---|---|
| A1 | `form_submissions (id BIGSERIAL, onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, ip_hash, is_test BOOLEAN, alert_text_status, created_at, …)` plus slice 3's `stage TEXT DEFAULT 'new'`, `quote_sent_at`, `stage_changed_at` (`ALTER TABLE … ADD COLUMN`); `phone` E.164 or null, `email` lowercase or null (`validateLeadInput`). | `grep -n "form_submissions\|is_test" lib/db.ts` | Tasks 4, 6 |
| A2 | `phone_messages.kind` CHECK is `('text_back','manual','inbound','alert','sequence','confirm','reminder')` (the `phone_messages_kind_check` ALTER); `sendClientSms(line, to, body, kind: Exclude<MessageKind,'inbound'>)` in `lib/phoneLines.ts` returns `{ sent: true; sid } \| { sent: false; reason: 'sms_pending' \| 'opted_out' \| 'bad_number' }`; `sendOwnerAlert(line, body)` calls it with `'alert'`. | `grep -n "kind IN" lib/db.ts` and `grep -n "export async function sendClientSms\|export async function sendOwnerAlert" lib/phoneLines.ts` | Tasks 4, 6, 7, 10 |
| A3 | `phone_calls.direction TEXT ('inbound','connect')`, `phone_calls.lead_id BIGINT → form_submissions`; `phone_lines.time_zone`; `PhoneLine.timeZone`, `.status`, `.smsStatus`, `.forwardTo`; `startConnectCall` writes a connect call's `from_number` as the lead's phone; `getLine(onboardingId)` returns active lines only; `isOptedOut(onboardingId, phone)`. | `grep -n "direction\|lead_id\|time_zone" lib/db.ts`, `grep -n "timeZone" lib/phoneShared.ts`, `grep -n "from_number is the lead" lib/phoneLines.ts` | Tasks 4, 7, 10, 11 |
| A4 | `app/api/lead/route.ts`: `const saved = await recordFormSubmission(onboardingId, lead, { ipHash });` then `after(async () => { try { const owner = await getOnboardingById(onboardingId); if (owner) await deliverLead(owner, saved); … } catch … })`. `deliverLead(owner, lead, opts: { now?; test? })` in `lib/leads.ts` texts the owner with `const r = await sendOwnerAlert(line, leadAlertText(lead));` inside `else { try { … } }` after `let text: DeliveryReport['text']; if (plan.text !== 'send') text = plan.text; else if (!line) text = 'no_line';`. `DeliveryReport` and `TEXT_WORDS` live in `lib/leadShared.ts`. There is no `lib/leadAlerts.ts` and no `sendLeadAlerts`. | `grep -n "saved\|deliverLead" app/api/lead/route.ts` and `grep -n "sendOwnerAlert\|let text" lib/leads.ts` | Tasks 6, 10 |
| A5 | `app/api/phone/connect/status/route.ts` writes the connect call with `await recordCall(line.onboardingId, { callSid: p.CallSid, fromNumber: lead.phone, …, direction: 'connect', leadId, });` inside `if (lead?.phone) {`; `p.CallSid` is in scope. | `grep -n "recordCall(" app/api/phone/connect/status/route.ts` | Task 6 |
| A6 | `lib/sequences.ts`: `startRun(onboardingId, kind, contact: RunContact, ref: RunRef, opts?) → StartResult`; `stopRunsFor(onboardingId, match: { phone?; email?; kinds? }, reason: RunStopReason) → number` with `RunStopReason = StopReason \| \`stage:${string}\``; `SequenceKind` in `lib/sequenceShared.ts`. | `grep -n "export async function startRun\|export async function stopRunsFor\|export type RunStopReason" lib/sequences.ts` | Task 4 |
| A7 | Sequence emails are sent inside `claimAndSend` in `lib/sequences.ts` (not the cron route): `const r = await sendSequenceEmail({ … idempotencyKey: \`seq-${run.id}-${claimedStep}\`, });` followed by `if (r.skipped) refusal = 'email_opted_out';`, inside the send `try` whose `catch` puts the step back. The sent step is `d.step`; `run` has `id`, `onboardingId`, `contactPhone`, `contactEmail`, `contactName`. | `grep -n "sendSequenceEmail\|email_opted_out" lib/sequences.ts` | Task 6 |
| A8 | Slice 3 stages: `lib/leadStages.ts` has `LeadStore { refTable; find(onboardingId, id); setStage(onboardingId, id, stage, action) }`, `formSubmissionStore` (reads/writes `form_submissions.stage`, `stage_changed_at`, `quote_sent_at`, skips `is_test`), `const defaultDeps: StageDeps = { store: formSubmissionStore, … }`, `applyLeadStage(onboardingId, id, action, deps = defaultDeps) → StageResult { stage, started, stopped, warning? }`. `app/api/proof/leads/stage/route.ts` parses `{ id, action }` with `parseStageRequest` and answers `{ ok: true, id, ...result }`, signed-in client only (no tier gate). `components/proof/LeadStageTaps.tsx` posts `{ id, action }` and reads `started` / `warning`; `FormLeads` renders it; `app/proof/page.tsx` passes `stageApi="/api/proof/leads/stage"`. No `lead_stages` table exists anywhere. | `grep -rn "lead_stages" lib app components scripts` (no hits) and `grep -n "defaultDeps\|export const formSubmissionStore" lib/leadStages.ts` | Tasks 4, 8, 11 |
| A9 | Quiet hours: `QUIET_START_HOUR = 20`, `QUIET_END_HOUR = 8`, `isQuietHours(now, timeZone)` in `lib/leadShared.ts`; `holdForQuietHours(at, timeZone)` and `safeTimeZone(tz)` in `lib/sequenceSchedule.ts` (client-safe). | `grep -n "QUIET_\|export function isQuietHours" lib/leadShared.ts` and `grep -n "export function holdForQuietHours\|export function safeTimeZone" lib/sequenceSchedule.ts` | Tasks 2, 7, 10 |
| A10 | `app/api/phone/voice/status/route.ts`: the `recordCall` try ends `} catch (err) {\n    return fail('[phone/status] recordCall', err);\n  }`; then `if (outcome === 'answered') {` with slice 3's `stopRunsFor(…, 'answered')` block; then the text-back; then the `// A missed caller who has not replied in 30 minutes …` block calling `startMissedCallFollowUp`; then `return twiml(afterDialTwiml({ textedBack }));`. | `grep -n "recordCall\|outcome === 'answered'\|startMissedCallFollowUp\|afterDialTwiml" app/api/phone/voice/status/route.ts` | Tasks 6, 10 |
| A11 | Schema anchors: the last statement before `})().catch(` in `lib/db.ts` and before `console.log('Schema ready.');` in `scripts/init-db.mjs` is ``await sql`ALTER TABLE sequence_runs ADD COLUMN IF NOT EXISTS template_updated_at TIMESTAMPTZ;`;`` | `grep -n "template_updated_at\|})().catch\|Schema ready" lib/db.ts scripts/init-db.mjs` | Task 3 |
| A12 | `lib/dbRows.ts` exports `DbId`, `DbTime`, `iso`, `errText`; `lib/email.ts` has `getClient(kind)`, `sendChecked`, `clientLayout`, `button`, `escapeHtml`, `CLIENT_FROM_ADDRESS`, `CLIENT_REPLY_TO`; email kinds are keys of `EMAIL_KINDS` in `lib/emailLogShared.ts`. | `grep -n "^export" lib/dbRows.ts` and `grep -n "^function getClient\|^async function sendChecked\|^function clientLayout\|^const CLIENT_FROM_ADDRESS" lib/email.ts` | Tasks 4, 10 |

- [ ] **Step 1: Run every check in the table**

Run each command from the repo root and confirm the real name matches the row.

- [ ] **Step 2: Stop on any difference**

Every row above was read from the code at `23b46f8`. If a later commit renamed or moved one of them, stop and revise the tasks in the last column before going on; this plan does not guess at names and does not re-implement anything slices 2 or 3 own.

No commit: nothing changed.

---

### Task 2: Client-safe inbox rules (`lib/contactsShared.ts`)

**Files:**
- Create: `lib/contactsShared.ts`
- Test: `lib/contactsShared.test.ts`
- Modify: `package.json` (add the `test:inbox` script)

**Interfaces:**
- Consumes: `DEFAULT_TIME_ZONE`, `callerKey`, `formatCallLength`, `maskNumber`, `SMS_MAX_CHARS`, `CallOutcome` (`lib/phoneShared.ts`); `buttonLabel`, `campaignLabel` (`lib/projectsShared.ts`); `TIER_RANK`, `OnboardingTier` (`data/onboardingItems.ts`); `QUIET_START_HOUR`, `QUIET_END_HOUR`, `isQuietHours` (`lib/leadShared.ts`); `holdForQuietHours`, `safeTimeZone` (`lib/sequenceSchedule.ts`); `LEAD_ACTION_LABELS`, `STAGE_EFFECTS`, `normalizeEmail`, `LeadAction`, `LeadStage`, `SequenceKind` (`lib/sequenceShared.ts`).
- Produces (all exported):
  - Types `ContactSource`, `ContactEventKind`, `EventPayload`, `SystemStage`, `Contact`, `ContactEvent`, `MergePlan`, `DashboardContact`, `DashboardEvent`, `HeldReply`, `DashboardContactView`, `DashboardInbox`, `Texting`, `ReplyRefusal`, `ReplyWindow`. Stages are slice 3's `LeadStage`; taps are slice 3's `LeadAction`.
  - Constants `CONTACT_STAGES`, `STAGE_LABELS`, `CONTACT_SOURCES`, `CONTACT_EVENT_KINDS`, `CLICK_ATTACH_MINUTES` (10), `OWNER_TEXT_THROTTLE_MINUTES` (30), `QUIET_WINDOW` ("8 pm to 8 am", built from `lib/leadShared.ts`), `REPLY_REFUSALS`, `REPLY_REFUSAL_COPY`.
  - `isReplyRefusal(v)`, `inboxEnabled(tier)`.
  - `contactKeyFor({ phone?, email? }): { phone: string | null; email: string | null } | null`, `cleanName(raw): string | null`, `parseContactId(raw): number | null`.
  - `nextSystemStage(current: LeadStage, proposed: SystemStage): SystemStage | null`, `systemStageFor(kind, payload): SystemStage | null`, `outcomeForStage(stage): 'won' | 'lost' | null`, `sequenceEffects(action: LeadAction, changed: boolean): { stop: SequenceKind[]; start: SequenceKind[] }` (delegates to `STAGE_EFFECTS`), `noteForAction(action: LeadAction): string`.
  - `mergeDecision(a: Contact, b: Contact): MergePlan`.
  - `messageEventKind(direction, messageKind): ContactEventKind | null`, `sourceForKind(kind): ContactSource`, `isLeadActivity(kind, payload): boolean`, `eventVerb(kind): string`, `eventSummary(kind, payload): string`.
  - `maskEmail(email)`, `shortName(name)`, `contactWho({ phone, email })`, `sourceLabelFor(contact)`, `formatWhen(iso)`, `relativeWhen(iso, now?)`.
  - `toDashboardContact(contact, last, optedOut): DashboardContact`, `toDashboardEvent(event): DashboardEvent`.
  - `encodeCursor(at, id): string`, `decodeCursor(raw): { at: string; id: number } | null`.
  - `canReplyNow(now: Date, timeZone: string): ReplyWindow`, `quietNotice(sendAtIso, timeZone, queued: boolean): string`, `validateReplyBody(raw): { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' }`, `textingState(line: { status: string; smsStatus: string } | null): Texting`, `replyBlocker({ hasPhone, optedOut, texting }): ReplyRefusal | null`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/contactsShared.test.ts
// Run with: npm run test:inbox   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canReplyNow, cleanName, contactKeyFor, decodeCursor, encodeCursor, eventSummary, inboxEnabled, isLeadActivity, maskEmail,
  mergeDecision, messageEventKind, nextSystemStage, noteForAction, outcomeForStage, parseContactId, quietNotice, relativeWhen,
  replyBlocker, sequenceEffects, shortName, sourceForKind, systemStageFor, textingState, toDashboardContact, toDashboardEvent,
  validateReplyBody, QUIET_WINDOW, type Contact, type ContactEvent,
} from './contactsShared';
import { LEAD_ACTIONS, STAGE_EFFECTS } from './sequenceShared';

const base: Contact = {
  id: 1, onboardingId: 7, phone: '+15155550134', email: null, name: null, stage: 'new', source: 'call',
  utmSource: null, utmMedium: null, utmCampaign: null,
  firstSeenAt: '2026-10-01T15:00:00.000Z', lastActivityAt: '2026-10-01T15:00:00.000Z', stageChangedAt: null, quoteSentAt: null,
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
  assert.equal(contactKeyFor({ email: 42 }), null);
  assert.equal(contactKeyFor({}), null);
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

test('the system only moves a contact forward and never off Won or Lost', () => {
  assert.equal(nextSystemStage('new', 'contacted'), 'contacted');
  assert.equal(nextSystemStage('contacted', 'booked'), 'booked');
  assert.equal(nextSystemStage('booked', 'contacted'), null);
  assert.equal(nextSystemStage('won', 'booked'), null);
  assert.equal(nextSystemStage('lost', 'contacted'), null);
  assert.equal(nextSystemStage('contacted', 'contacted'), null);
});

test('what moves a stage by itself: an answered call, a typed text, a booking', () => {
  assert.equal(systemStageFor('call', { outcome: 'answered' }), 'contacted');
  assert.equal(systemStageFor('call', { outcome: 'missed' }), null);
  assert.equal(systemStageFor('text_out', { messageKind: 'manual' }), 'contacted');
  assert.equal(systemStageFor('text_out', { messageKind: 'text_back' }), null);
  assert.equal(systemStageFor('booking', {}), 'booked');
  assert.equal(systemStageFor('form', {}), null);
});

test('stages drive the follow-ups through slice 3 STAGE_EFFECTS, one source of truth', () => {
  for (const a of LEAD_ACTIONS) {
    assert.deepEqual(sequenceEffects(a, true), { stop: STAGE_EFFECTS[a].stop, start: STAGE_EFFECTS[a].start });
    assert.deepEqual(sequenceEffects(a, false), { stop: STAGE_EFFECTS[a].stop, start: [] });
  }
  // Spec, "Slice 4 additions": Contacted stops both the new-lead and the quote follow-up.
  assert.deepEqual(sequenceEffects('contacted', true), { stop: ['new_lead', 'quote'], start: [] });
  assert.deepEqual(sequenceEffects('won', true), { stop: ['new_lead', 'quote'], start: ['review'] });
  assert.deepEqual(sequenceEffects('quote_sent', true), { stop: ['new_lead'], start: ['quote'] });
  assert.equal(noteForAction('won'), 'Tapped "Job done"');
  assert.equal(noteForAction('quote_sent'), 'Tapped "Quote sent"');
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
    quoteSentAt: '2026-10-05T16:00:00.000Z',
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
  assert.equal(plan.merged.quoteSentAt, '2026-10-05T16:00:00.000Z');
});

test('mergeDecision: same first-seen time keeps the lower id; between Won and Lost the later mark wins', () => {
  const a = contact({ id: 3, stage: 'won', stageChangedAt: '2026-10-03T00:00:00.000Z', quoteSentAt: '2026-10-02T00:00:00.000Z' });
  const b = contact({ id: 2, phone: null, email: 'b@example.com', stage: 'lost', stageChangedAt: '2026-10-04T00:00:00.000Z', quoteSentAt: '2026-10-01T00:00:00.000Z' });
  const plan = mergeDecision(a, b);
  assert.equal(plan.keepId, 2);
  assert.equal(plan.merged.stage, 'lost');
  assert.equal(plan.merged.phone, '+15155550134');
  assert.equal(plan.merged.quoteSentAt, '2026-10-01T00:00:00.000Z');
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
  assert.equal(eventSummary('note', { text: 'Tapped "Job done"' }), 'Tapped "Job done"');
  assert.equal(eventSummary('alert', { channel: 'sms' }), 'you were sent a text about this lead');
  assert.equal(eventSummary('alert', { channel: 'email' }), 'you were emailed about this lead');
  assert.equal(eventSummary('alert', { channel: 'push' }), 'you were sent a notification');
});

test('toDashboardContact masks the number and the email (Review Focus 1)', () => {
  const both = toDashboardContact(contact({ email: 'sarah.k@example.com', name: 'Sarah Kim', quoteSentAt: '2026-10-02T00:00:00.000Z' }), { kind: 'call', summary: 'missed, texted back' }, false);
  const json = JSON.stringify(both);
  assert.equal(both.who, '(515) 555-01··');
  assert.doesNotMatch(json, /0134/);
  assert.doesNotMatch(json, /\+1515/);
  assert.doesNotMatch(json, /example\.com/);
  assert.doesNotMatch(json, /2026-10-02/); // the quote time itself stays server-side
  assert.equal(both.lastVerb, 'Called');
  assert.equal(both.lastSummary, 'missed, texted back');
  assert.equal(both.hasEmail, true);
  assert.equal(both.quoteSent, true);
  const emailOnly = toDashboardContact(contact({ phone: null, email: 'sarah.k@example.com', source: 'form' }), null, false);
  assert.equal(emailOnly.who, 'sarah.k@…');
  assert.equal(emailOnly.hasPhone, false);
  assert.equal(emailOnly.quoteSent, false);
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
  const email = toDashboardEvent(event({ kind: 'sequence', payload: { channel: 'email', step: 0 } }));
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

test('canReplyNow: quiet from 8 pm to 8 am Central, held to 8 am (Review Focus 4)', () => {
  // October 2026 is CDT, UTC-5.
  assert.deepEqual(canReplyNow(new Date('2026-10-13T13:00:00Z'), 'America/Chicago'), { ok: true }); // 8:00 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T00:59:00Z'), 'America/Chicago'), { ok: true }); // 7:59 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T01:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 8:00 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T02:30:45Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 9:30 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-13T12:59:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-13T13:00:00.000Z' }); // 7:59 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T05:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // midnight
  // A wrong zone falls back to Central rather than throwing.
  assert.deepEqual(canReplyNow(new Date('2026-10-14T01:00:00Z'), 'Mars/Olympus'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' });
  assert.equal(QUIET_WINDOW, '8 pm to 8 am');
  assert.match(quietNotice('2026-10-14T13:00:00.000Z', 'America/Chicago', true), /^Quiet hours \(8 pm to 8 am\): your text goes out Wed 8:00\sAM\.$/);
  assert.match(quietNotice('2026-10-14T13:00:00.000Z', 'Mars/Olympus', false), /8 pm to 8 am.*Wed 8:00\sAM/);
});

test('replyBlocker: the order a reply is refused in (Review Focus 4)', () => {
  assert.equal(replyBlocker({ hasPhone: false, optedOut: true, texting: 'none' }), 'no_phone');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: true, texting: 'pending' }), 'opted_out');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'none' }), 'no_line');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'pending' }), 'sms_pending');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'ready' }), null);
  assert.equal(textingState(null), 'none');
  assert.equal(textingState({ status: 'released', smsStatus: 'ready' }), 'none');
  assert.equal(textingState({ status: 'active', smsStatus: 'pending' }), 'pending');
  assert.equal(textingState({ status: 'active', smsStatus: 'ready' }), 'ready');
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
// Stages, taps and their follow-ups are slice 3's (lib/sequenceShared.ts);
// quiet hours are slice 2's (lib/leadShared.ts). Nothing here re-defines them.
import { TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { QUIET_END_HOUR, QUIET_START_HOUR, isQuietHours } from '@/lib/leadShared';
import { DEFAULT_TIME_ZONE, callerKey, formatCallLength, maskNumber, SMS_MAX_CHARS, type CallOutcome } from '@/lib/phoneShared';
import { buttonLabel, campaignLabel } from '@/lib/projectsShared';
import { holdForQuietHours, safeTimeZone } from '@/lib/sequenceSchedule';
import { LEAD_ACTION_LABELS, STAGE_EFFECTS, normalizeEmail, type LeadAction, type LeadStage, type SequenceKind } from '@/lib/sequenceShared';

// ───────────────────────────── Vocabulary ─────────────────────────────

/** Slice 3's stages, in order, for the badge and the list. */
export const CONTACT_STAGES: readonly LeadStage[] = ['new', 'contacted', 'booked', 'won', 'lost'];
export const STAGE_LABELS: Record<LeadStage, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', won: 'Won', lost: 'Lost' };

/** The stages code may set by itself (an answered call or typed text; a booking). Both are slice 3 LeadActions. */
export type SystemStage = Extract<LeadAction, 'contacted' | 'booked'>;

/** How the person first reached the client. 'click' = a tap on the site's call or text button, then that call or text. */
export const CONTACT_SOURCES = ['call', 'text', 'form', 'chat', 'booking', 'click', 'messenger', 'instagram'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_EVENT_KINDS = [
  'call', 'text_in', 'text_out', 'form', 'booking', 'chat', 'click', 'note', 'alert', 'sequence', 'reminder', 'messenger', 'instagram',
] as const;
export type ContactEventKind = (typeof CONTACT_EVENT_KINDS)[number];

/** The facts of one event, copied from its source row. Never a recording URL. */
export type EventPayload = Record<string, unknown>;

export interface Contact {
  id: number;
  onboardingId: number;
  /** E.164 or null. */
  phone: string | null;
  /** Lowercase or null. */
  email: string | null;
  name: string | null;
  stage: LeadStage;
  source: ContactSource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  firstSeenAt: string;
  lastActivityAt: string;
  stageChangedAt: string | null;
  /** When "Quote sent" was first tapped; a second tap does not restart the quote follow-up (slice 3's rule). */
  quoteSentAt: string | null;
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
/** Without push, the owner gets at most one fallback text and email per lead in this many minutes. */
export const OWNER_TEXT_THROTTLE_MINUTES = 30;

const hourWord = (h: number): string => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
/** "8 pm to 8 am", from slice 2's quiet-hours constants. */
export const QUIET_WINDOW = `${hourWord(QUIET_START_HOUR)} to ${hourWord(QUIET_END_HOUR)}`;

export const inboxEnabled = (tier: OnboardingTier): boolean => TIER_RANK[tier] >= TIER_RANK.axeoncore;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
};

// ───────────────────────────── Identity ─────────────────────────────

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

const STAGE_RANK: Record<LeadStage, number> = { new: 0, contacted: 1, booked: 2, won: 3, lost: 3 };

/**
 * A move code makes by itself, or null for none. Code only moves forward and
 * never touches a Won or Lost contact; the client's taps go through slice 3's
 * applyLeadStage instead (lib/leadStages.ts), which can move a lead anywhere.
 */
export function nextSystemStage(current: LeadStage, proposed: SystemStage): SystemStage | null {
  if (current === 'won' || current === 'lost') return null;
  return STAGE_RANK[proposed] > STAGE_RANK[current] ? proposed : null;
}

/** The stage an event implies on its own: an answered call or a typed text means Contacted, a booking means Booked. */
export function systemStageFor(kind: ContactEventKind, payload: EventPayload): SystemStage | null {
  if (kind === 'call') return payload.outcome === 'answered' ? 'contacted' : null;
  if (kind === 'text_out') return payload.messageKind === 'manual' ? 'contacted' : null;
  if (kind === 'booking') return 'booked';
  return null;
}

export function outcomeForStage(stage: LeadStage): 'won' | 'lost' | null {
  return stage === 'won' || stage === 'lost' ? stage : null;
}

/**
 * The follow-ups a stage move starts and stops. Delegates to slice 3's
 * STAGE_EFFECTS (one source of truth). Stops always apply (stopping is
 * idempotent); starts only on a real change, as applyLeadStage does.
 */
export function sequenceEffects(action: LeadAction, changed: boolean): { stop: SequenceKind[]; start: SequenceKind[] } {
  const effect = STAGE_EFFECTS[action];
  return { stop: [...effect.stop], start: changed ? [...effect.start] : [] };
}

/** The timeline note for one of the client's taps, in slice 3's words. */
export function noteForAction(action: LeadAction): string {
  return `Tapped "${LEAD_ACTION_LABELS[action]}"`;
}

// ───────────────────────────── Merging ─────────────────────────────

export interface MergePlan {
  keepId: number;
  dropId: number;
  merged: Pick<Contact, 'name' | 'phone' | 'email' | 'stage' | 'stageChangedAt' | 'quoteSentAt' | 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'firstSeenAt' | 'lastActivityAt'>;
}

/**
 * Two contacts turned out to be one person (an event carried the phone of one
 * and the email of the other). The older row is kept (earlier first-seen, then
 * lower id); it keeps its first touch (source, campaign) and fills any gap from
 * the newer row. The furthest stage wins; between Won and Lost, the later mark.
 * The earliest "Quote sent" stands. If both rows had a phone, the kept row's
 * phone stays and the other's events still move over.
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
  const quotes = [a.quoteSentAt, b.quoteSentAt].filter((q): q is string => q !== null).sort();
  return {
    keepId: keep.id,
    dropId: drop.id,
    merged: {
      name: keep.name ?? drop.name,
      phone: keep.phone ?? drop.phone,
      email: keep.email ?? drop.email,
      stage: stageFrom.stage,
      stageChangedAt: stageFrom.stageChangedAt,
      quoteSentAt: quotes[0] ?? null,
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
      return p.channel === 'sms' ? 'you were sent a text about this lead' : p.channel === 'email' ? 'you were emailed about this lead' : 'you were sent a notification';
  }
}

// ───────────────────────────── Display ─────────────────────────────

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
  stage: LeadStage;
  /** Whether "Quote sent" was tapped; the time itself stays server-side (as slice 3's DashboardSubmission). */
  quoteSent: boolean;
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
    quoteSent: c.quoteSentAt !== null,
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

/** A reply typed in quiet hours, waiting for 8 am; or one that did not go out. */
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

/** Can replies go out from this client's line: yes, waiting on carrier approval, or no tracked number. */
export type Texting = 'ready' | 'pending' | 'none';

export interface DashboardInbox {
  contacts: DashboardContact[];
  nextCursor: string | null;
  /** The contact opened with ?contact=<id>, or null. */
  selected: DashboardContactView | null;
  /** The client's time zone, for the quiet-hours notice. */
  timeZone: string;
  texting: Texting;
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

/**
 * Can a typed reply go out now? Slice 2's quiet hours (8 pm to 8 am
 * client-local, isQuietHours) hold it to 8:00 am (slice 3's holdForQuietHours,
 * which also handles a wrong zone and daylight saving).
 */
export function canReplyNow(now: Date, timeZone: string): ReplyWindow {
  if (!isQuietHours(now, timeZone)) return { ok: true };
  return { ok: false, sendAt: holdForQuietHours(now, timeZone).toISOString() };
}

export function quietNotice(sendAtIso: string, timeZone: string, queued: boolean): string {
  const when = new Intl.DateTimeFormat('en-US', { timeZone: safeTimeZone(timeZone), weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(sendAtIso));
  return queued
    ? `Quiet hours (${QUIET_WINDOW}): your text goes out ${when}.`
    : `It is quiet hours (${QUIET_WINDOW}) where you are. A text sent now goes out ${when}.`;
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

/** What a client's line allows. getLine already returns active lines only; the status check keeps this honest for any caller. */
export function textingState(line: { status: string; smsStatus: string } | null): Texting {
  if (!line || line.status !== 'active') return 'none';
  return line.smsStatus === 'ready' ? 'ready' : 'pending';
}

/**
 * Why a reply can never go out, or null. One order for the server
 * (replyToContact) and the reply box: no phone, opted out (the banner the spec
 * asks for), no line, carrier approval pending. Quiet hours are not a refusal:
 * the reply is held (canReplyNow).
 */
export function replyBlocker(input: { hasPhone: boolean; optedOut: boolean; texting: Texting }): Exclude<ReplyRefusal, 'empty' | 'too_long' | 'bad_number'> | null {
  if (!input.hasPhone) return 'no_phone';
  if (input.optedOut) return 'opted_out';
  if (input.texting === 'none') return 'no_line';
  if (input.texting === 'pending') return 'sms_pending';
  return null;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsx --test lib/contactsShared.test.ts`
Expected: PASS, every test. Then `npm run lint` (clean).

- [ ] **Step 5: Commit**

```bash
git add lib/contactsShared.ts lib/contactsShared.test.ts package.json
git commit -m "feat(inbox): client-safe contact, merge, masking and reply rules on slice 2 and 3 helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 3: Tables (`contacts`, `contact_events`, `push_subscriptions`, `held_replies`)

**Files:**
- Modify: `lib/db.ts` (`ensureSchema()`, at the end of the async block, after slice 3's last statement)
- Modify: `scripts/init-db.mjs` (after the same statement, before `console.log('Schema ready.');`)

**Interfaces:**
- Consumes: `onboardings(id)`, `client_accounts(id)` (existing).
- Produces: the four tables below, used by Tasks 4 to 11. `contacts.quote_sent_at` mirrors `form_submissions.quote_sent_at` so slice 3's "a second Quote sent tap does not restart the follow-up" rule holds on contacts too. `held_replies` is not in the spec's table list; it is the smallest thing that makes "held and sent at 8 am" true without bending slice 3's `sequence_runs`; `claimed_at` lets the cron retire a row whose send was interrupted instead of showing "goes out 8 AM" forever.

- [ ] **Step 1: Add the tables to `lib/db.ts`**

Inside `ensureSchema()`, directly after

```ts
      await sql`ALTER TABLE sequence_runs ADD COLUMN IF NOT EXISTS template_updated_at TIMESTAMPTZ;`;
```

and before the closing `})().catch((err) => {`, add:

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
          quote_sent_at TIMESTAMPTZ,
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
          claimed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          sent_at TIMESTAMPTZ
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS held_replies_due_idx ON held_replies (status, send_at);`;
      await sql`CREATE INDEX IF NOT EXISTS held_replies_contact_idx ON held_replies (contact_id);`;
```

- [ ] **Step 2: Mirror them in `scripts/init-db.mjs`**

Directly after

```js
  await sql`ALTER TABLE sequence_runs ADD COLUMN IF NOT EXISTS template_updated_at TIMESTAMPTZ;`;
```

and before `console.log('Schema ready.');`, paste the same statements with the indentation of that file (two spaces, `await sql\`…\`;`), the same comments, in the same order. Nothing else changes.

- [ ] **Step 3: Check it**

Run: `npm run lint`
Expected: clean.

With a local database: `npm run db:init` then
`psql "$POSTGRES_URL" -c "\d contact_events"` shows `contact_events_ref_uniq` as `UNIQUE, btree (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL`, and `\d contacts` shows both partial unique indexes and `quote_sent_at`. Running `npm run db:init` a second time prints `Schema ready.` with no error.

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts scripts/init-db.mjs
git commit -m "feat(inbox): contacts, contact_events, push_subscriptions, held_replies tables

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 4: The contacts module (`lib/contacts.ts`) and the slice 3 store seam

**Files:**
- Create: `lib/contacts.ts`
- Modify: `lib/leadStages.ts` (the contacts-backed stores; `defaultDeps` exported and switched to them)

**Interfaces:**
- Consumes: Task 2 (`contactKeyFor`, `cleanName`, `eventSummary`, `isLeadActivity`, `mergeDecision`, `messageEventKind`, `nextSystemStage`, `noteForAction`, `outcomeForStage`, `sequenceEffects`, `sourceForKind`, `systemStageFor`, `toDashboardContact`, `toDashboardEvent`, `encodeCursor`, `CLICK_ATTACH_MINUTES`, types); Task 3 tables; `DbId`, `DbTime`, `iso`, `errText` (`lib/dbRows.ts`); `setLeadOutcome` (`lib/siteStats.ts`); `isLeadStage`, `LeadAction`, `LeadStage` (`lib/sequenceShared.ts`); `startRun`, `stopRunsFor` (`lib/sequences.ts`, A6, loaded with a dynamic `import()` because `lib/sequences.ts` imports this module in Task 6); `form_submissions` incl. `is_test`, `stage`, `quote_sent_at`, `stage_changed_at` (A1); `phone_calls.direction`, `phone_calls.lead_id` (A3); `LeadStore`, `formSubmissionStore`, `StageDeps` (`lib/leadStages.ts`, A8).
- Produces (`lib/contacts.ts`; it imports nothing from `lib/leadStages.ts`, `lib/sequences.ts` or `lib/phoneLines.ts` at the top, so there is no import cycle):
  - `interface ContactEventInput { onboardingId: number; kind: ContactEventKind; refTable: string | null; refId: number | null; refPart?: number; phone?: string | null; email?: string | null; name?: string | null; source?: ContactSource; utm?: { source: string | null; medium: string | null; campaign: string | null } | null; summary: string; payload: EventPayload; createdAt: string; createIfMissing?: boolean; replay?: boolean }`
  - `interface UpsertResult { contactId: number; eventId: number; createdContact: boolean; insertedEvent: boolean }`
  - `upsertContactEvent(input: ContactEventInput): Promise<UpsertResult | null>`: the one entry point every producer uses. Null when the event identifies nobody, or when `createIfMissing` is false and no contact matches.
  - `projectCall(callSid: string, opts?: { replay?: boolean })`, `projectMessage(messageSid: string, opts?)`, `projectForm(formId: number, opts?)`: each `Promise<UpsertResult | null>`.
  - `getContact(onboardingId: number, contactId: number): Promise<Contact | null>`
  - `mergeContacts(onboardingId: number, aId: number, bId: number): Promise<Contact>`
  - `writeContactStage(onboardingId: number, contactId: number, stage: LeadStage, action: LeadAction): Promise<void>`: what a client tap writes on a contact (stage, quote time, note, its forms, the close-rate mark); called only through the `LeadStore`s below, so `applyLeadStage` keeps owning the follow-ups.
  - `setContactName(onboardingId: number, contactId: number, raw: unknown): Promise<Contact | null>`
  - `attachClickToContact(onboardingId: number, contactId: number, at: string, kind: 'call' | 'text_in'): Promise<number | null>`, `attachedClickIds(onboardingId: number, ids: number[]): Promise<Set<number>>`
  - `contactIdForRef(onboardingId: number, refTable: string, refId: number): Promise<number | null>`
  - `recordAlert(onboardingId: number, contactId: number, channel: 'sms' | 'push' | 'email'): Promise<void>`, `alertedRecently(contactId: number, minutes: number): Promise<boolean>` (counts only the `sms` and `email` fallbacks)
  - `listInbox(onboardingId: number, opts?: { limit?: number; cursor?: { at: string; id: number } | null }): Promise<{ contacts: DashboardContact[]; nextCursor: string | null }>`
  - `contactTimeline(onboardingId: number, contactId: number): Promise<DashboardContactView | null>`
  - `interface BackfillResult { onboardingId: number; calls: number; messages: number; forms: number; stagesCopied: number }`, `backfill(onboardingId: number): Promise<BackfillResult>`, `backfillAll(): Promise<BackfillResult[]>`
- Produces (`lib/leadStages.ts`): `formContactStore: LeadStore` (form id; refTable `form_submissions`), `contactStore: LeadStore` (contact id; refTable `contacts`), `export const defaultDeps` now using `formContactStore`, and `contactStageDeps: StageDeps`.

- [ ] **Step 1: Write the module**

```ts
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
  CLICK_ATTACH_MINUTES, cleanName, contactKeyFor, encodeCursor, eventSummary, isLeadActivity, mergeDecision, messageEventKind,
  nextSystemStage, noteForAction, outcomeForStage, sequenceEffects, sourceForKind, systemStageFor, toDashboardContact, toDashboardEvent,
  type Contact, type ContactEvent, type ContactEventKind, type ContactSource, type DashboardContact, type DashboardContactView,
  type EventPayload, type SystemStage,
} from '@/lib/contactsShared';
import { isLeadStage, type LeadAction, type LeadStage } from '@/lib/sequenceShared';

interface ContactRow {
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

const toContact = (r: ContactRow): Contact => ({
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
      AND id IN (SELECT ref_id FROM contact_events WHERE contact_id = ${contactId} AND ref_table = 'form_submissions' AND kind = 'form');`;
}

async function clickIdFor(contactId: number): Promise<number | null> {
  const { rows } = await sql<{ ref_id: DbId }>`
    SELECT ref_id FROM contact_events WHERE contact_id = ${contactId} AND kind = 'click' AND ref_table = 'site_events'
    ORDER BY created_at LIMIT 1;`;
  return rows[0] ? Number(rows[0].ref_id) : null;
}

/** Won/Lost onto the matched website tap, so the close rate learns from it (an unmatched contact is counted by lib/siteStats.ts directly). */
async function writeBackOutcome(onboardingId: number, contactId: number, stage: LeadStage): Promise<void> {
  const clickId = await clickIdFor(contactId);
  if (clickId) await setLeadOutcome(onboardingId, clickId, outcomeForStage(stage));
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
    await q.sql`UPDATE contact_events SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId};`;
    await q.sql`UPDATE held_replies SET contact_id = ${plan.keepId} WHERE contact_id = ${plan.dropId};`;
    await q.sql`DELETE FROM contacts WHERE id = ${plan.dropId};`;
    const { rows: kept } = await q.sql<ContactRow>`
      UPDATE contacts SET
        name = ${m.name}, phone = ${m.phone}, email = ${m.email},
        stage = ${m.stage}, stage_changed_at = ${m.stageChangedAt}, quote_sent_at = ${m.quoteSentAt},
        source = ${m.source}, utm_source = ${m.utmSource}, utm_medium = ${m.utmMedium}, utm_campaign = ${m.utmCampaign},
        first_seen_at = ${m.firstSeenAt}, last_activity_at = ${m.lastActivityAt}
      WHERE id = ${plan.keepId}
      RETURNING *;`;
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
      WHERE id = ${found.id}
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
      WHERE id = ${ev.contactId};`;
  }
  if (ev.inserted) {
    const proposed = systemStageFor(input.kind, input.payload);
    if (proposed) await advanceStage(input.onboardingId, ev.contactId, proposed, input.replay === true);
    if (resolved.created && (input.kind === 'call' || input.kind === 'text_in')) {
      await attachClickToContact(input.onboardingId, ev.contactId, input.createdAt, input.kind);
    }
  }
  return { contactId: ev.contactId, eventId: ev.id, createdContact: resolved.created, insertedEvent: ev.inserted };
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
  const c = toContact(rows[0]);
  await mirrorFormStage(onboardingId, contactId, next, null);
  if (replay) return; // the backfill records history; it does not stop today's follow-ups
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
export async function alertedRecently(contactId: number, minutes: number): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM contact_events
    WHERE contact_id = ${contactId} AND kind = 'alert' AND payload->>'channel' IN ('sms', 'email')
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
 * one. Owner alerts are skipped: they go to the owner, not a lead.
 */
export async function projectMessage(messageSid: string, opts: { replay?: boolean } = {}): Promise<UpsertResult | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const { rows } = await sql<{ id: DbId; onboarding_id: number; message_sid: string; direction: 'inbound' | 'outbound'; from_number: string; to_number: string; body: string; kind: string; created_at: DbTime }>`
    SELECT id, onboarding_id, message_sid, direction, from_number, to_number, body, kind, created_at
    FROM phone_messages WHERE message_sid = ${messageSid} LIMIT 1;`;
  const r = rows[0];
  if (!r) return null;
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
 * Slice 3 kept the client's taps on form_submissions (stage, quote_sent_at,
 * stage_changed_at) until contacts existed. Copy each contact's latest form mark
 * onto it, without re-running the follow-ups (slice 3 already started or stopped
 * them when the tap happened). A client's tap beats a move the replay made by
 * itself (an old answered call), so the copy goes over any stage, unless the
 * contact has already been tapped in the inbox (it has a note): those taps
 * mirror onto its forms anyway. A second run finds nothing to change.
 */
async function copyFormStages(onboardingId: number): Promise<number> {
  const res = await sql`
    UPDATE contacts c
    SET stage = f.stage, stage_changed_at = COALESCE(f.stage_changed_at, c.stage_changed_at, now()), quote_sent_at = COALESCE(c.quote_sent_at, f.quote_sent_at)
    FROM (
      SELECT DISTINCT ON (e.contact_id) e.contact_id, s.stage, s.stage_changed_at, s.quote_sent_at
      FROM form_submissions s
      JOIN contact_events e ON e.ref_table = 'form_submissions' AND e.ref_id = s.id AND e.kind = 'form'
      WHERE s.onboarding_id = ${onboardingId} AND NOT s.is_test AND s.stage <> 'new'
      ORDER BY e.contact_id, s.stage_changed_at DESC NULLS LAST
    ) f
    WHERE c.id = f.contact_id AND c.onboarding_id = ${onboardingId}
      AND (c.stage <> f.stage OR (c.quote_sent_at IS NULL AND f.quote_sent_at IS NOT NULL))
      AND NOT EXISTS (SELECT 1 FROM contact_events n WHERE n.contact_id = c.id AND n.kind = 'note');`;
  return res.rowCount ?? 0;
}

/**
 * Build one client's contacts from every call, text and (non-test) form that
 * exists, in the order they happened, through the same projections the
 * webhooks use, in replay mode. Safe to run any number of times. Sends nothing:
 * no push, no text, no follow-up started or stopped.
 */
export async function backfill(onboardingId: number): Promise<BackfillResult> {
  await ensureSchema();
  const { rows } = await sql<{ src: 'call' | 'message' | 'form'; sid: string | null; id: DbId | null }>`
    SELECT src, sid, id FROM (
      SELECT 'call' AS src, call_sid AS sid, NULL::bigint AS id, started_at AS at FROM phone_calls WHERE onboarding_id = ${onboardingId}
      UNION ALL
      SELECT 'message', message_sid, NULL::bigint, created_at FROM phone_messages WHERE onboarding_id = ${onboardingId} AND kind <> 'alert'
      UNION ALL
      SELECT 'form', NULL::text, id, created_at FROM form_submissions WHERE onboarding_id = ${onboardingId} AND NOT is_test
    ) s
    ORDER BY at, src;`;
  const out: BackfillResult = { onboardingId, calls: 0, messages: 0, forms: 0, stagesCopied: 0 };
  for (const r of rows) {
    if (r.src === 'call' && r.sid) {
      if (await projectCall(r.sid, { replay: true })) out.calls += 1;
    } else if (r.src === 'message' && r.sid) {
      if (await projectMessage(r.sid, { replay: true })) out.messages += 1;
    } else if (r.src === 'form' && r.id !== null) {
      if (await projectForm(Number(r.id), { replay: true })) out.forms += 1;
    }
  }
  out.stagesCopied = await copyFormStages(onboardingId);
  return out;
}

export async function backfillAll(): Promise<BackfillResult[]> {
  await ensureSchema();
  const { rows } = await sql<{ onboarding_id: number }>`
    SELECT DISTINCT onboarding_id FROM (
      SELECT onboarding_id FROM phone_calls
      UNION SELECT onboarding_id FROM phone_messages
      UNION SELECT onboarding_id FROM form_submissions WHERE NOT is_test
    ) s ORDER BY onboarding_id;`;
  const results: BackfillResult[] = [];
  for (const r of rows) results.push(await backfill(Number(r.onboarding_id)));
  return results;
}
```

- [ ] **Step 2: Swap slice 3's default store for a contacts-backed one (`lib/leadStages.ts`)**

Slice 3's header already says "slice 4 adds a contacts store with the same shape, makes it the default, and nothing else here changes." `applyLeadStage`, `StageDeps`, `formSubmissionStore` and the tests stay as they are.

Add the import, after `import { startRun, stopRunsFor, … } from '@/lib/sequences';`:

```ts
import { contactIdForRef, getContact, writeContactStage } from '@/lib/contacts';
```

Directly after the closing `};` of `export const formSubmissionStore: LeadStore = { … };`, add:

```ts
/**
 * Slice 4's default for form-lead taps ({ id } on /api/proof/leads/stage).
 * form_submissions keeps its stage exactly as slice 3 writes it (FormLeads and
 * the admin read it), and the contact that form was projected onto gets the
 * same stage, a timeline note, its other forms kept in step, and the close-rate
 * mark (lib/contacts.ts writeContactStage). A form not yet projected (the
 * backfill has not run) is staged exactly as in slice 3.
 */
export const formContactStore: LeadStore = {
  refTable: 'form_submissions',
  find: (onboardingId, id) => formSubmissionStore.find(onboardingId, id),
  async setStage(onboardingId, id, stage, action) {
    await formSubmissionStore.setStage(onboardingId, id, stage, action);
    const contactId = await contactIdForRef(onboardingId, 'form_submissions', id);
    if (contactId) await writeContactStage(onboardingId, contactId, stage, action);
  },
};

/** Slice 4: taps on an inbox contact ({ contactId } on /api/proof/leads/stage). Runs started here carry ref_table 'contacts'. */
export const contactStore: LeadStore = {
  refTable: 'contacts',
  async find(onboardingId, id) {
    const c = await getContact(onboardingId, id);
    return c ? { name: c.name, phone: c.phone, email: c.email, stage: c.stage, quoteSentAt: c.quoteSentAt } : null;
  },
  setStage: (onboardingId, id, stage, action) => writeContactStage(onboardingId, id, stage, action),
};
```

Replace

```ts
const defaultDeps: StageDeps = {
  store: formSubmissionStore,
```

with

```ts
export const defaultDeps: StageDeps = {
  store: formContactStore,
```

and directly after that object's closing `};` add:

```ts
/** The same engine for an inbox contact. */
export const contactStageDeps: StageDeps = { ...defaultDeps, store: contactStore };
```

Import graph check: `lib/leadStages.ts` → `lib/contacts.ts` → (`lib/db`, `lib/dbRows`, `lib/siteStats`, `lib/contactsShared`, `lib/sequenceShared`); `lib/contacts.ts` reaches `lib/sequences.ts` only through the dynamic `import()` in `advanceStage`. No cycle.

- [ ] **Step 3: Type-check and run slice 3's stage tests**

Run: `npm run lint && npm run test:sequences`
Expected: clean, and every test in `lib/leadStages.test.ts` (and the rest of `test:sequences`) still passes unchanged: the tests inject their own `deps`, and `applyLeadStage`'s behaviour did not change.

- [ ] **Step 4: Check merge, idempotency and the outbound rule against a local database**

With a local database, one onboarding (id 1) and two hand-made contacts for it (one with phone `+15155550134`, one with email `sarah@example.com`, the email one created later), run in `npx tsx`:

```ts
import { projectForm, upsertContactEvent } from '@/lib/contacts';
const note = (createIfMissing?: boolean) =>
  upsertContactEvent({ onboardingId: 1, kind: 'note', refTable: null, refId: null, phone: '+15155550134', email: 'sarah@example.com', summary: 'test', payload: { text: 'test' }, createdAt: new Date().toISOString(), createIfMissing });
console.log(await note());
console.log(await note());
console.log(await upsertContactEvent({ onboardingId: 1, kind: 'text_out', refTable: null, refId: null, phone: '+15155550199', summary: 'x', payload: { automatic: true }, createdAt: new Date().toISOString(), createIfMissing: false }));
```

Expected: one contact left with both keys, every event of the other row now points at it, no unique-violation error; the second call leaves still one contact and two `note` events (notes have no source row, so they are not deduped; every projection with a source row is); the third call prints `null` and creates no contact for `+15155550199`. Then `UPDATE form_submissions SET is_test = true WHERE id = <some form>` and `await projectForm(<that id>)` prints `null`.

- [ ] **Step 5: Commit**

```bash
git add lib/contacts.ts lib/leadStages.ts
git commit -m "feat(inbox): contacts module and contacts-backed LeadStore behind slice 3's applyLeadStage

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 5: Won and Lost keep feeding the close rate

**Files:**
- Modify: `lib/siteStats.ts` (`markedForMonth`, `observedCloseRate`)

**Interfaces:**
- Consumes: `contacts`, `contact_events` (Task 3); `writeContactStage` and `mergeContacts` writing to `site_events.outcome` for matched contacts (Task 4).
- Produces: no new exports. Both functions now count inbox contacts marked Won or Lost that no website tap stands for.

- [ ] **Step 1: Replace the query in `markedForMonth`**

Replace the `const res = await sql<{ won: number; lost: number }>\`…\`;` statement in `markedForMonth` with:

```ts
  // Taps on the site (marked in the anonymous list, or through a matched contact), plus inbox
  // contacts marked Won or Lost that no tap stands for. A matched contact is only counted
  // through its tap (lib/contacts.ts writes the mark there), never twice.
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

With a local database: tap "Job done" on an unmatched contact through `POST /api/proof/leads/stage` `{ contactId, action: 'won' }` (Task 8), or `applyLeadStage(<onb>, <contact>, 'won', contactStageDeps)` in `npx tsx`; then `markedForMonth(<onb>, '<this month>')` returns `won` one higher. Do the same for a contact that has a click event: the count goes up by exactly one (through the tap), not two. Merge an unmatched Won contact into one that has a click (Task 4 step 4's script with those keys): the count stays the same.

- [ ] **Step 4: Commit**

```bash
git add lib/siteStats.ts
git commit -m "feat(inbox): Won and Lost from the inbox count toward the client's close rate

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 6: Producers: every call, text and form lands in the inbox

Each producer keeps writing its own table first, then calls one projection. A projection failure is logged and never fails the webhook or the send: the source row is already safe, and the backfill (Task 8) rebuilds anything missed. Slice 3's blocks in the same files stay exactly as they are; every change below is an insertion at a quoted anchor.

**Files:**
- Modify: `lib/phoneLines.ts` (`sendClientSms`)
- Modify: `app/api/phone/voice/status/route.ts`
- Modify: `app/api/phone/recording/route.ts`
- Modify: `app/api/phone/sms/route.ts`
- Modify: `app/api/lead/route.ts`
- Modify: `app/api/phone/connect/status/route.ts`
- Modify: `lib/sequences.ts` (`claimAndSend`, the email branch)

**Interfaces:**
- Consumes: `projectCall`, `projectMessage`, `projectForm`, `upsertContactEvent` (Task 4); `eventSummary` (Task 2).
- Produces: no new exports. After this task every new call, inbound text and (non-test) form has a `contact_events` row; outbound texts and sequence emails to an existing contact join its timeline.

| File | Where (anchor) | The call |
|---|---|---|
| `lib/phoneLines.ts` | `sendClientSms`, after the `recordMessage` try/catch, before `return { sent: true, sid };` | `projectMessage(sid)` (attaches; skips owner alerts) |
| `app/api/phone/voice/status/route.ts` | after `return fail('[phone/status] recordCall', err);\n  }`, and after the text-back block | `projectCall(p.CallSid)` |
| `app/api/phone/recording/route.ts` | after the `attachRecording` try/catch | `projectCall(p.CallSid)` |
| `app/api/phone/sms/route.ts` | after `await recordMessage(line.onboardingId, { … kind: 'inbound', … });` | `projectMessage(p.MessageSid)` |
| `app/api/lead/route.ts` | first statement inside the `after()` callback's `try {` | `projectForm(saved.id)` |
| `app/api/phone/connect/status/route.ts` | after `await recordCall(line.onboardingId, { … direction: 'connect', leadId, });` | `projectCall(p.CallSid)` |
| `lib/sequences.ts` | after `if (r.skipped) refusal = 'email_opted_out';` in `claimAndSend` | `upsertContactEvent({ kind: 'sequence', refTable: 'sequence_runs', refId: run.id, refPart: d.step, createIfMissing: false, … })` |

- [ ] **Step 1: `sendClientSms` projects every outbound text**

In `lib/phoneLines.ts` add the import:

```ts
import { projectMessage } from '@/lib/contacts';
```

In `sendClientSms`, replace

```ts
  } catch (err) {
    console.error('phone: outbound row not recorded', sid, err);
  }
  return { sent: true, sid };
```

with

```ts
  } catch (err) {
    console.error('phone: outbound row not recorded', sid, err);
  }
  // Into the leads inbox (lib/contacts.ts): attaches to an existing contact; owner alerts are skipped there. Never fails the send.
  try {
    await projectMessage(sid);
  } catch (err) {
    console.error('phone: outbound text not added to the inbox', sid, errText(err));
  }
  return { sent: true, sid };
```

(`errText` is already imported in this file from `@/lib/dbRows`.)

- [ ] **Step 2: The call status webhook projects before and after the text-back**

In `app/api/phone/voice/status/route.ts` add the import:

```ts
import { projectCall } from '@/lib/contacts';
```

Replace

```ts
  } catch (err) {
    return fail('[phone/status] recordCall', err);
  }
  if (outcome === 'answered') {
```

with

```ts
  } catch (err) {
    return fail('[phone/status] recordCall', err);
  }
  // Into the leads inbox before any text-back, so a brand-new caller is created as a
  // caller (and matched to a tap on the site's call button) rather than as a texter.
  // An answered call moves the contact to Contacted. Never fails the webhook.
  await projectCall(p.CallSid).catch((err) => {
    console.error('[phone/status] inbox', err instanceof Error ? err.message : err);
    return null;
  });
  if (outcome === 'answered') {
```

Then replace

```ts
      console.error('[phone/status] sendTextBack', err instanceof Error ? err.message : err);
    }
  }
  // A missed caller who has not replied in 30 minutes gets the new-lead follow-up (the wait lives in the engine).
```

with

```ts
      console.error('[phone/status] sendTextBack', err instanceof Error ? err.message : err);
    }
  }
  // Refresh the inbox line to "missed, texted back".
  if (textedBack) {
    await projectCall(p.CallSid).catch((err) => console.error('[phone/status] inbox', err instanceof Error ? err.message : err));
  }
  // A missed caller who has not replied in 30 minutes gets the new-lead follow-up (the wait lives in the engine).
```

Slice 3's `stopRunsFor(…, 'answered')` block and the `startMissedCallFollowUp` block are untouched.

- [ ] **Step 3: The recording webhook refreshes the call's event**

In `app/api/phone/recording/route.ts` add `import { projectCall } from '@/lib/contacts';` and replace

```ts
      console.error('[phone/recording]', err instanceof Error ? err.message : err);
      return new Response(null, { status: 500 });
    }
  }
```

with

```ts
      console.error('[phone/recording]', err instanceof Error ? err.message : err);
      return new Response(null, { status: 500 });
    }
    // The inbox's play button appears once the event knows a recording exists. No URL is copied.
    await projectCall(p.CallSid).catch((err) => console.error('[phone/recording] inbox', err instanceof Error ? err.message : err));
  }
```

- [ ] **Step 4: Inbound texts**

In `app/api/phone/sms/route.ts` add `import { projectMessage } from '@/lib/contacts';` and replace

```ts
        kind: 'inbound',
        status: 'received',
      });
      if (from !== 'unknown') {
```

with

```ts
        kind: 'inbound',
        status: 'received',
      });
      await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', err instanceof Error ? err.message : err);
        return null;
      });
      if (from !== 'unknown') {
```

(Task 10 turns this into `const projected = …` to send the alert.)

- [ ] **Step 5: Website forms (slice 2)**

In `app/api/lead/route.ts` add `import { projectForm } from '@/lib/contacts';` and replace

```ts
    after(async () => {
      try {
        const owner = await getOnboardingById(onboardingId);
```

with

```ts
    after(async () => {
      try {
        // Into the leads inbox first (lib/contacts.ts), so the alert can link to the contact. Never stops delivery.
        await projectForm(saved.id).catch((err) => {
          console.error('[lead] inbox', saved.id, err instanceof Error ? err.message : err);
          return null;
        });
        const owner = await getOnboardingById(onboardingId);
```

(Task 10 turns this into `const projected = …` and passes the contact to `deliverLead`. The admin's "Send test lead" never goes through this route, and `projectForm` skips `is_test` rows anyway.)

- [ ] **Step 6: Call-connect calls (slice 2)**

In `app/api/phone/connect/status/route.ts` add `import { projectCall } from '@/lib/contacts';` and replace

```ts
          direction: 'connect',
          leadId,
        });
```

with

```ts
          direction: 'connect',
          leadId,
        });
        // Into the leads inbox: the call joins the form's contact (its from_number is the lead's phone); answered moves it to Contacted.
        await projectCall(p.CallSid).catch((err) => console.error('[phone/connect/status] inbox', leadId, err instanceof Error ? err.message : err));
```

- [ ] **Step 7: Sequence emails (slice 3, inside `claimAndSend`)**

In `lib/sequences.ts` add:

```ts
import { upsertContactEvent } from '@/lib/contacts';
import { eventSummary } from '@/lib/contactsShared';
```

In `claimAndSend`, replace

```ts
        idempotencyKey: `seq-${run.id}-${claimedStep}`,
      });
      if (r.skipped) refusal = 'email_opted_out';
    }
```

with

```ts
        idempotencyKey: `seq-${run.id}-${claimedStep}`,
      });
      if (r.skipped) refusal = 'email_opted_out';
      else {
        // Into the inbox timeline of an existing contact (never creates one): one event per run step (ref_part = the
        // step that went out). Caught here, not thrown: a throw inside this try would put an email that already left
        // back in the queue and send it again.
        await upsertContactEvent({
          onboardingId: run.onboardingId,
          kind: 'sequence',
          refTable: 'sequence_runs',
          refId: run.id,
          refPart: d.step,
          phone: run.contactPhone,
          email: run.contactEmail,
          name: run.contactName,
          summary: eventSummary('sequence', { channel: 'email' }),
          payload: { channel: 'email', step: d.step },
          createdAt: new Date().toISOString(),
          createIfMissing: false,
        }).catch((err) => console.error('sequences: email not added to the inbox', run.id, errText(err)));
      }
    }
```

SMS steps need nothing here: they go through `sendClientSms(…, 'sequence' | 'reminder')`, which projects them (Step 1).

- [ ] **Step 8: Type-check and test**

Run: `npm run lint && npm run test:phone && npm run test:sequences && npm run test:leads`
Expected: clean and PASS.

- [ ] **Step 9: Check idempotency against a local database**

With a local database that has a `phone_calls` row: in `npx tsx`, `await (await import('@/lib/contacts')).projectCall('<that CallSid>')` returns `{ contactId, eventId, createdContact: true, insertedEvent: true }`; a second call returns the same ids with `createdContact: false, insertedEvent: false` (Review Focus 3). A `phone_messages` row with `direction = 'outbound'`, `kind = 'sequence'` to a number that is no contact: `projectMessage('<its sid>')` returns `null` and no contact is created.

- [ ] **Step 10: Commit**

```bash
git add lib/phoneLines.ts lib/sequences.ts app/api/phone/voice/status/route.ts app/api/phone/recording/route.ts app/api/phone/sms/route.ts app/api/phone/connect/status/route.ts app/api/lead/route.ts
git commit -m "feat(inbox): every call, text, form and follow-up email projects into the inbox

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 7: Replies and quiet hours (`lib/inboxReply.ts`, held-reply cron)

**Files:**
- Create: `lib/inboxReply.ts`
- Create: `app/api/cron/held-replies/route.ts`
- Modify: `vercel.json` (one cron entry)

**Interfaces:**
- Consumes: `getContact` (Task 4); `canReplyNow`, `isReplyRefusal`, `replyBlocker`, `textingState`, `validateReplyBody`, `ReplyRefusal` (Task 2); `getLine`, `isOptedOut`, `sendClientSms` (`lib/phoneLines.ts`); `errText` (`lib/dbRows.ts`); `line.timeZone` (A3); `held_replies` incl. `claimed_at` (Task 3).
- Produces:
  - `type ReplyResult = { status: 'sent' } | { status: 'held'; id: number; sendAt: string } | { status: 'refused'; reason: ReplyRefusal }`
  - `replyToContact(onboardingId: number, contactId: number, rawBody: unknown, now?: Date): Promise<ReplyResult | null>` (null = not this client's contact)
  - `sendDueHeldReplies(limit?: number): Promise<{ sent: number; failed: number; interrupted: number }>`
  - `GET|POST /api/cron/held-replies` every 15 minutes.

- [ ] **Step 1: Write the reply module**

```ts
// lib/inboxReply.ts
// Texting a lead back from the PROOF inbox. sendClientSms (lib/phoneLines.ts)
// already enforces the 10DLC gate and the opt-out list; this adds what the
// inbox needs: the contact is this client's and has a phone, and it is not
// quiet hours (8 pm to 8 am client-local; slice 2's isQuietHours through
// canReplyNow). A reply typed in quiet hours is held in held_replies and sent
// at 8 am by /api/cron/held-replies. Server-only.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { getContact } from '@/lib/contacts';
import { canReplyNow, isReplyRefusal, replyBlocker, textingState, validateReplyBody, type ReplyRefusal } from '@/lib/contactsShared';
import { getLine, isOptedOut, sendClientSms } from '@/lib/phoneLines';

export type ReplyResult = { status: 'sent' } | { status: 'held'; id: number; sendAt: string } | { status: 'refused'; reason: ReplyRefusal };

const refused = (reason: ReplyRefusal): ReplyResult => ({ status: 'refused', reason });

/** A row claimed this long ago and still 'sending' was interrupted mid-send. */
const STUCK_MINUTES = 30;

/**
 * Null when the contact is not this client's. The order is Review Focus 4:
 * the body (validateReplyBody), then every reason a text could never go out
 * (replyBlocker: no phone, opted out, no line, carrier approval pending), and
 * only then quiet hours, so nothing waits overnight only to be refused at 8 am.
 */
export async function replyToContact(onboardingId: number, contactId: number, rawBody: unknown, now: Date = new Date()): Promise<ReplyResult | null> {
  const contact = await getContact(onboardingId, contactId);
  if (!contact) return null;
  const checked = validateReplyBody(rawBody);
  if (!checked.ok) return refused(checked.reason);
  const [line, optedOut] = await Promise.all([getLine(onboardingId), contact.phone ? isOptedOut(onboardingId, contact.phone) : Promise.resolve(false)]);
  const blocked = replyBlocker({ hasPhone: contact.phone !== null, optedOut, texting: textingState(line) });
  if (blocked) return refused(blocked);
  if (!line || !contact.phone) return refused('no_line'); // unreachable after replyBlocker; narrows the types
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
 * The 8 am send. Rows are claimed ('sending', claimed_at) before anything is
 * sent, so two overlapping cron runs never send one twice. A row still
 * 'sending' STUCK_MINUTES after its claim was interrupted (a crash or timeout
 * mid-send): it becomes 'failed' and is never re-sent, because the text may
 * have left; the client sees "did not go out" and can send it again. The gates
 * run again inside sendClientSms: someone who texted STOP overnight is not texted.
 */
export async function sendDueHeldReplies(limit = 100): Promise<{ sent: number; failed: number; interrupted: number }> {
  if (!isDatabaseConfigured()) return { sent: 0, failed: 0, interrupted: 0 };
  await ensureSchema();
  const stuck = await sql`
    UPDATE held_replies SET status = 'failed', error = 'interrupted'
    WHERE status = 'sending' AND claimed_at < now() - make_interval(mins => ${STUCK_MINUTES});`;
  const { rows } = await sql<{ id: number | string; onboarding_id: number; contact_id: number | string; body: string }>`
    UPDATE held_replies SET status = 'sending', claimed_at = now()
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
      error = errText(err).slice(0, 200) || 'send failed';
    }
    if (error) {
      failed += 1;
      await sql`UPDATE held_replies SET status = 'failed', error = ${error} WHERE id = ${id};`;
    } else {
      sent += 1;
      await sql`UPDATE held_replies SET status = 'sent', sent_at = now() WHERE id = ${id};`;
    }
  }
  return { sent, failed, interrupted: stuck.rowCount ?? 0 };
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
import { errText } from '@/lib/dbRows';
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
    console.error('[cron:held-replies]', errText(err));
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

In `vercel.json` `crons`, replace

```json
    { "path": "/api/cron/sequences", "schedule": "*/15 * * * *" }
```

with

```json
    { "path": "/api/cron/sequences", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/held-replies", "schedule": "*/15 * * * *" }
```

(Sub-daily crons need the Vercel Pro plan, which slice 3's 15-minute cron already requires.)

- [ ] **Step 4: Type-check and try it**

Run: `npm run lint && npm run test:inbox`
Expected: clean, PASS (`replyBlocker` and `canReplyNow` are pinned there).

With a local database, a line in `ready`, and a contact with a phone: in `npx tsx`, `replyToContact(<onb>, <contact>, 'test', new Date('2026-10-14T01:30:00Z'))` returns `{ status: 'held', sendAt: '2026-10-14T13:00:00.000Z', … }` (8:30 pm on an `America/Chicago` line) and writes a `held_replies` row; the same with `'   '` returns `{ status: 'refused', reason: 'empty' }` and writes nothing; with the contact's number in `phone_opt_outs` it returns `{ status: 'refused', reason: 'opted_out' }` and writes nothing. `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/held-replies` returns `{"sent":0,"failed":0,"interrupted":0}` before 8 am. Set one row to `status = 'sending', claimed_at = now() - interval '1 hour'` and call the cron again: `interrupted` is 1 and the row is `failed`.

- [ ] **Step 5: Commit**

```bash
git add lib/inboxReply.ts app/api/cron/held-replies/route.ts vercel.json
git commit -m "feat(inbox): reply from the tracked number; quiet-hours replies held to 8 am

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 8: Inbox API, admin backfill, and the inbox path on slice 3's stage route

**Files:**
- Create: `lib/inboxServer.ts`
- Create: `app/api/proof/inbox/route.ts` (GET list)
- Create: `app/api/proof/inbox/[contactId]/route.ts` (GET one, PUT name)
- Create: `app/api/proof/inbox/[contactId]/reply/route.ts` (POST)
- Create: `app/api/proof/inbox/[contactId]/email/route.ts` (GET, redirect to `mailto:`)
- Create: `app/api/admin/contacts/backfill/route.ts` (POST)
- Modify: `app/api/proof/leads/stage/route.ts` (slice 3: `{ id, action }` unchanged for every tier; `{ contactId, action }` added for inbox contacts)

**Interfaces:**
- Consumes: `getSignedInClient` (`lib/proofServer.ts`), `getOnboardingById` (`lib/onboarding.ts`), `requireAdmin` (`lib/adminAuth.ts`), `readBody` (`lib/billingApi.ts`), `errText` (`lib/dbRows.ts`); Task 2 (`inboxEnabled`, `parseContactId`, `decodeCursor`, `REPLY_REFUSAL_COPY`); Task 4 (`listInbox`, `contactTimeline`, `getContact`, `setContactName`, `backfill`, `backfillAll`; `applyLeadStage`, `contactStageDeps`, `LeadNotFoundError` from `lib/leadStages.ts`); `parseStageRequest` (`lib/sequenceShared.ts`); Task 7 (`replyToContact`).
- Produces:
  - `inboxAccount(): Promise<{ ok: true; account: ClientAccount } | { ok: false; response: NextResponse }>`, `NO_STORE`, `inboxFailure(tag, err): NextResponse`, `INBOX_TIER_ERROR` (`lib/inboxServer.ts`).
  - `GET /api/proof/inbox?cursor=` → `{ contacts: DashboardContact[]; nextCursor: string | null }`
  - `GET /api/proof/inbox/<id>` → `DashboardContactView`; `PUT` `{ name }` → `{ ok: true, name }`
  - `POST /api/proof/inbox/<id>/reply` `{ body }` → `{ ok: true, status: 'sent' }` | `{ ok: true, status: 'held', sendAt }` | 400/409 `{ error, reason }`
  - `GET /api/proof/inbox/<id>/email` → 302 `mailto:`
  - `POST /api/admin/contacts/backfill` `{ onboardingId? }` → `{ ok: true, results: BackfillResult[] }`
  - `POST /api/proof/leads/stage`: `{ id, action }` → `{ ok: true, id, stage, started, stopped, warning? }` exactly as slice 3 (every tier; `applyLeadStage` with `defaultDeps`, now the contacts-backed form store); `{ contactId, action }` → `{ ok: true, contactId, stage, started, stopped, warning? }` (AxeonCORE and up; `applyLeadStage` with `contactStageDeps`). Both use slice 3's `LEAD_ACTIONS`; there is no separate inbox stage route.

Every `/api/proof/inbox` route answers 401 without a session, 403 on Essentials, 404 for a contact id that is not this client's (all queries are scoped by `account.onboardingId`), and sends `Cache-Control: private, no-store`.

- [ ] **Step 1: The shared guard**

```ts
// lib/inboxServer.ts
// The guard every /api/proof/inbox route starts with: a signed-in client whose
// plan includes the inbox. Scoping happens in each query (lib/contacts.ts takes
// the onboarding id), so another client's contact id is a plain 404. Server-only.
import { NextResponse } from 'next/server';
import { inboxEnabled } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { getOnboardingById } from '@/lib/onboarding';
import type { ClientAccount } from '@/lib/proofAuth';
import { getSignedInClient } from '@/lib/proofServer';

export type InboxAuth = { ok: true; account: ClientAccount } | { ok: false; response: NextResponse };

export const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;
export const INBOX_TIER_ERROR = 'The leads inbox comes with AxeonCORE';

export async function inboxAccount(): Promise<InboxAuth> {
  const account = await getSignedInClient();
  if (!account) return { ok: false, response: NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: NO_STORE }) };
  const onboarding = await getOnboardingById(account.onboardingId).catch(() => null);
  if (!onboarding || !inboxEnabled(onboarding.tier)) {
    return { ok: false, response: NextResponse.json({ error: INBOX_TIER_ERROR }, { status: 403, headers: NO_STORE }) };
  }
  return { ok: true, account };
}

export function inboxFailure(tag: string, err: unknown): NextResponse {
  console.error(tag, errText(err));
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

- [ ] **Step 5: Email (the one place a full address leaves the server)**

```ts
// app/api/proof/inbox/[contactId]/email/route.ts
// GET: opens the client's mail app to this lead (spec: email replies open the
// mail app; PROOF sends no email to leads in this slice). A redirect, so the
// address is never in the inbox page's data; only a tap on "Email" reveals it,
// to the signed-in owner, in their own mail app.
import { NextResponse } from 'next/server';
import { getContact } from '@/lib/contacts';
import { parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return NextResponse.json({ error: 'No email for this lead' }, { status: 404, headers: NO_STORE });
  try {
    const contact = await getContact(auth.account.onboardingId, contactId);
    if (!contact?.email) return NextResponse.json({ error: 'No email for this lead' }, { status: 404, headers: NO_STORE });
    return new Response(null, { status: 302, headers: { Location: `mailto:${contact.email}`, ...NO_STORE } });
  } catch (err) {
    return inboxFailure('[proof/inbox/email]', err);
  }
}
```

- [ ] **Step 6: Admin backfill**

```ts
// app/api/admin/contacts/backfill/route.ts
// POST { onboardingId? }: build the inbox from every call, text and (non-test)
// form that already exists (lib/contacts.ts backfill), for one client or all of
// them. Idempotent: run it again and nothing doubles. Sends nothing to anyone
// and starts or stops no follow-up (replay mode).
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { backfill, backfillAll } from '@/lib/contacts';
import { errText } from '@/lib/dbRows';

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
    console.error('[admin/contacts/backfill]', errText(err));
    return NextResponse.json({ error: errText(err) || 'Backfill failed' }, { status: 500 });
  }
}
```

(`backfillAll` runs every client in one request with `maxDuration = 300`; with more than a few thousand rows in total, call it once per client with `{ onboardingId }` instead.)

- [ ] **Step 7: Add the inbox path to slice 3's stage route**

Rewrite `app/api/proof/leads/stage/route.ts` whole. The `{ id, action }` path keeps slice 3's parsing, auth, errors and response byte for byte; only the store behind `applyLeadStage`'s default changed (Task 4), so `FormLeads` / `LeadStageTaps` keep working for every tier.

```ts
// app/api/proof/leads/stage/route.ts
// POST { id, action } from the signed-in client's Leads tab: Quote sent, Talked to
// them, Booked, Job done or Not a fit on one of their form leads. Moves the stage
// and starts or stops the follow-ups that go with it (lib/leadStages.ts). Only the
// client's own leads: applyLeadStage looks the id up with their onboarding id.
// Every plan; since slice 4 the form's contact follows (formContactStore).
// POST { contactId, action } (slice 4, AxeonCORE and up): the same taps on an
// inbox contact, through the same applyLeadStage with the contact store.
import { NextResponse } from 'next/server';
import { readBody } from '@/lib/billingApi';
import { inboxEnabled } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { applyLeadStage, contactStageDeps, defaultDeps, LeadNotFoundError, type StageDeps } from '@/lib/leadStages';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';
import { parseStageRequest, type LeadAction } from '@/lib/sequenceShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  let parsed: { id: number; action: LeadAction };
  // { contactId } is the inbox; anything else is slice 3's { id } form-lead tap.
  let inbox = false;
  try {
    const raw = await readBody(req);
    inbox = raw.contactId !== undefined;
    // parseStageRequest's own messages are written for the client; the inbox path reuses it with the contact id.
    parsed = parseStageRequest(inbox ? { id: raw.contactId, action: raw.action } : raw);
  } catch (err) {
    return bad(errText(err));
  }
  const { id, action } = parsed;
  let deps: StageDeps = defaultDeps;
  if (inbox) {
    const onboarding = await getOnboardingById(account.onboardingId).catch(() => null);
    if (!onboarding || !inboxEnabled(onboarding.tier)) return NextResponse.json({ error: 'The leads inbox comes with AxeonCORE' }, { status: 403 });
    deps = contactStageDeps;
  }
  try {
    // A follow-up failure is not an error here: the stage is saved and the result carries a warning (200).
    const result = await applyLeadStage(account.onboardingId, id, action, deps);
    return NextResponse.json(inbox ? { ok: true, contactId: id, ...result } : { ok: true, id, ...result });
  } catch (err) {
    if (err instanceof LeadNotFoundError) return bad(err.message);
    // Anything else (a database error) is logged, never shown.
    console.error('[proof/leads/stage]', account.onboardingId, inbox ? 'contact' : 'form', id, action, errText(err));
    return bad('Could not save that. Please try again.');
  }
}
```

There is no `lead_stages` table and nothing else to migrate: slice 3's marks are on `form_submissions` and reach contacts through the backfill's `copyFormStages` (Task 4).

- [ ] **Step 8: Type-check and exercise the routes**

Run: `npm run lint && npm run test:sequences`
Expected: clean, PASS.

Run `npm run dev`, sign in as a test AxeonCORE client, then in the browser console:

```js
await (await fetch('/api/proof/inbox')).json();                                   // { contacts: [...], nextCursor }
await (await fetch('/api/proof/inbox/999999')).status;                            // 404
const post = (body) => fetch('/api/proof/leads/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await (await post({ contactId: 1, action: 'nope' })).status;                      // 400
await (await post({ contactId: <a contact id>, action: 'booked' })).json();       // { ok: true, contactId, stage: 'booked', started: [], stopped }
await (await post({ id: <a form id>, action: 'quote_sent' })).json();             // { ok: true, id, stage: 'contacted', started, stopped } as in slice 3
```

After the last call, that form's contact shows stage Contacted with a `Tapped "Quote sent"` note in its timeline. Signed in as an Essentials client: `fetch('/api/proof/inbox')` is 403, `post({ contactId: 1, action: 'won' })` is 403, and `post({ id: <their form id>, action: 'booked' })` still answers `{ ok: true, id, stage: 'booked', … }`. Signed out, 401. In the JSON from the first call, no `who` value contains a full number.

- [ ] **Step 9: Commit**

```bash
git add lib/inboxServer.ts app/api/proof/inbox app/api/admin/contacts/backfill/route.ts app/api/proof/leads/stage/route.ts
git commit -m "feat(inbox): client inbox API, admin backfill, contact taps on the slice 3 stage route

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 9: Push notifications (`web-push`, service worker, "Turn on notifications")

**Files:**
- Modify: `package.json` (dependency `web-push` `3.6.7`, published 2024-01-16; dev dependency `@types/web-push` `3.6.4`, published 2024-10-22; both well over two weeks old)
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
- Consumes: `push_subscriptions` (Task 3); `inboxAccount`, `NO_STORE` (Task 8); `client_accounts` (existing); `errText` (`lib/dbRows.ts`).
- Produces:
  - `lib/pushShared.ts`: `type LeadActivity = 'text' | 'call' | 'form' | 'messenger' | 'instagram'`, `interface PushMessage { title; body; url }`, `interface PushSubscriptionInput { endpoint; keys: { p256dh; auth } }`, `LEAD_ALERT_TITLES`, `leadLink(contactId): string`, `leadPushMessage(what, contactId): PushMessage`, `ownerAlertText(what, contactId, appOrigin): string`, `isValidSubscription(raw): raw is PushSubscriptionInput`, `urlBase64ToUint8Array(base64): Uint8Array<ArrayBuffer>`, `needsHomeScreenInstall(userAgent, standalone): boolean`.
  - `lib/push.ts`: `isPushConfigured(): boolean`, `savePushSubscription(accountId: number, sub: PushSubscriptionInput): Promise<void>`, `sendPush(accountId: number, msg: PushMessage): Promise<number>` (devices reached; prunes dead subscriptions on 404/410), `pushToClient(onboardingId: number, msg: PushMessage): Promise<number>`.
  - `<NotificationsButton publicKey={…} />`; `POST /api/proof/push/subscribe` `{ subscription }` → `{ ok: true }`.

- [ ] **Step 1: Add the dependency**

Run: `npm install --save-exact web-push@3.6.7 && npm install --save-exact --save-dev @types/web-push@3.6.4`
Expected: `package.json` gains `"web-push": "3.6.7"` under `dependencies` and `"@types/web-push": "3.6.4"` under `devDependencies`; `package-lock.json` updates.

- [ ] **Step 2: Write the failing tests**

The privacy guarantee is structural: `leadPushMessage` and `ownerAlertText` take only a fixed activity word, a contact id and the app origin, so no name, number or message words can reach them. The tests pin their exact output, so any field or text added later fails here.

```ts
// lib/pushShared.test.ts
// Run with: npm run test:inbox
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSubscription, leadPushMessage, needsHomeScreenInstall, ownerAlertText, urlBase64ToUint8Array } from './pushShared';

test('a push says what happened and where to look, nothing else (Review Focus 1)', () => {
  assert.deepEqual(leadPushMessage('text', 42), { title: 'New text from a lead', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('call', 42), { title: 'Missed call from a lead', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('form', 42), { title: 'New form from your website', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('messenger', 7).title, 'New Facebook message from a lead');
  assert.deepEqual(leadPushMessage('instagram', 7).title, 'New Instagram message from a lead');
});

test('the owner text has no lead details either', () => {
  assert.equal(
    ownerAlertText('text', 42, 'https://app.axeonstudio.co/'),
    'New text from a lead. See it and reply in AxeonPROOF: https://app.axeonstudio.co/proof?tab=leads&contact=42',
  );
  assert.equal(
    ownerAlertText('call', 9, 'https://app.axeonstudio.co'),
    'Missed call from a lead. See it and reply in AxeonPROOF: https://app.axeonstudio.co/proof?tab=leads&contact=9',
  );
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
// title, one fixed line, and a link inside PROOF. The same goes for the text and
// the email the owner gets when push is not on (lib/leadNotify.ts).

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

export const LEAD_ALERT_TITLES: Record<LeadActivity, string> = {
  text: 'New text from a lead',
  call: 'Missed call from a lead',
  form: 'New form from your website',
  messenger: 'New Facebook message from a lead',
  instagram: 'New Instagram message from a lead',
};

export const leadLink = (contactId: number): string => `/proof?tab=leads&contact=${contactId}`;

export function leadPushMessage(what: LeadActivity, contactId: number): PushMessage {
  return { title: LEAD_ALERT_TITLES[what], body: 'Open AxeonPROOF to see it and reply.', url: leadLink(contactId) };
}

/** The fallback text to the owner's cell when no device has push on. */
export function ownerAlertText(what: LeadActivity, contactId: number, appOrigin: string): string {
  return `${LEAD_ALERT_TITLES[what]}. See it and reply in AxeonPROOF: ${appOrigin.replace(/\/$/, '')}${leadLink(contactId)}`;
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
// send reports 0 devices and callers fall back to a text and an email. A
// subscription the push service says is gone (404/410) is deleted. Server-only.
import webpush from 'web-push';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { errText } from '@/lib/dbRows';
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
          await sql`DELETE FROM push_subscriptions WHERE id = ${s.id};`.catch((delErr) => console.error('[push] dead subscription not removed', s.id, errText(delErr)));
        } else {
          console.error('[push] send failed', status ?? '', errText(err));
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
          await w.navigate(url).catch(() => undefined); // an uncontrolled window cannot be navigated; focusing it is enough
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

Save it as `public/proof.webmanifest`. (iOS uses `apple-icon.png` for the Home Screen; Android push does not need an install. Chrome's own install prompt also wants a 512x512 icon, which this slice does not add; that affects the prompt only, not notifications.) In `app/proof/layout.tsx` extend `metadata`:

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
import { errText } from '@/lib/dbRows';
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
    console.error('[proof/push/subscribe]', errText(err));
    return NextResponse.json({ error: 'That did not save. Try again.' }, { status: 502, headers: NO_STORE });
  }
}
```

- [ ] **Step 9: Type-check, test, build**

Run: `npm run test:inbox && npm run lint && npm run build`
Expected: PASS, clean, and a build that compiles `web-push` into the Node routes (if the build reports that `web-push` cannot be bundled, add `serverExternalPackages: ['web-push']` to `nextConfig` in `next.config.mjs` and build again).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json lib/pushShared.ts lib/pushShared.test.ts lib/push.ts public/sw.js public/proof.webmanifest app/proof/layout.tsx next.config.mjs components/proof/NotificationsButton.tsx app/api/proof/push/subscribe/route.ts
git commit -m "feat(inbox): web push for lead alerts, service worker, installable PROOF

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 10: Alerts: push first; a text (outside quiet hours) and an email as the fallback

**Files:**
- Create: `lib/leadNotify.ts`
- Modify: `lib/emailLogShared.ts` (one email kind) and `lib/email.ts` (`sendLeadActivityEmail`)
- Modify: `lib/leadShared.ts` (`DeliveryReport['text']` gains `'pushed'`) and `lib/leadShared.test.ts`
- Modify: `lib/leads.ts` (`deliverLead`: push first for forms)
- Modify: `app/api/lead/route.ts` (pass the contact to `deliverLead`)
- Modify: `app/api/phone/sms/route.ts` (inbound text → alert)
- Modify: `app/api/phone/voice/status/route.ts` (missed call → alert)

**Interfaces:**
- Consumes: `pushToClient` (Task 9); `leadLink`, `leadPushMessage`, `ownerAlertText`, `LEAD_ALERT_TITLES`, `LeadActivity` (Task 9); `recordAlert`, `alertedRecently` (Task 4); `inboxEnabled`, `OWNER_TEXT_THROTTLE_MINUTES` (Task 2); `getLine`, `sendOwnerAlert` (`lib/phoneLines.ts`, A2); `isQuietHours` (`lib/leadShared.ts`, A9); `getOnboardingById` (`lib/onboarding.ts`); `APP_ORIGIN` (`lib/hostRouting.ts`); `getClient`, `sendChecked`, `clientLayout`, `button`, `escapeHtml`, `CLIENT_FROM_ADDRESS`, `CLIENT_REPLY_TO` (`lib/email.ts`, A12).
- Produces:
  - `lib/leadNotify.ts`: `pushLeadAlert(onboardingId: number, contactId: number, what: LeadActivity): Promise<number>` (devices reached; never throws); `interface NotifyResult { pushed: number; sms: boolean; email: boolean }`; `notifyLeadActivity(onboardingId: number, contactId: number, what: LeadActivity, now?: Date): Promise<NotifyResult>`. Slice 6 (Messenger, Instagram) calls `notifyLeadActivity` with `'messenger'` / `'instagram'` after its own `upsertContactEvent`.
  - `lib/email.ts`: `sendLeadActivityEmail({ to, businessName, title, url }): Promise<boolean>`; email kind `lead_activity_alert`.
  - `deliverLead(owner, lead, opts: { now?; test?; contactId?: number | null })`; `DeliveryReport['text']` may be `'pushed'`.

How each lead activity alerts the owner (spec: "Push … and, as a fallback, a text to the owner's cell"; "Cross-slice decisions": "an SMS … and an email through Resend"; quiet hours apply to every automated outbound text):

| Activity | First | If no device took the push |
|---|---|---|
| Inbound text (not STOP/START) | push | owner text (not 8 pm to 8 am) and an email, at most once per lead per 30 minutes |
| Missed call | push | the same |
| Website form | push (after slice 2's duplicate check, so a repeat form within 5 minutes pushes nothing) | slice 2's owner text exactly as today (its own quiet-hours and 10DLC plan); slice 2's lead email always goes regardless |

- [ ] **Step 1: The fallback email**

In `lib/emailLogShared.ts` `EMAIL_KINDS`, after the `client_lead_alert` line, add:

```ts
  lead_activity_alert: { label: 'Lead text or missed call (to client)', category: 'leads' },
```

In `lib/email.ts`, directly after the closing `}` of `export async function sendClientLeadAlert(…)`, add:

```ts
/**
 * Slice 4: a lead texted or missed-called and no device has push on. No lead
 * details (the same rule as the push): the words and the number stay in PROOF.
 */
export async function sendLeadActivityEmail(input: { to: string; businessName: string | null; title: string; url: string }): Promise<boolean> {
  const resend = getClient('lead_activity_alert');
  if (!resend) return false;
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: input.businessName ? `${input.title} · ${input.businessName}` : input.title,
    html: clientLayout(
      escapeHtml(input.title),
      `<p style="margin:0 0 12px">Open AxeonPROOF to see it and text them back from your tracked number.</p>${button(input.url, 'Open the lead')}`,
    ),
  });
  return true;
}
```

- [ ] **Step 2: Write the notifier**

```ts
// lib/leadNotify.ts
// Telling the owner a lead just did something (spec, slice 4 "Push" and
// "Cross-slice decisions"): a push to every device they turned notifications on
// for; if none took it, a text to their cell through their own line (never
// 8 pm to 8 am: quiet hours apply to every automated text) and an email, at
// most once per lead per OWNER_TEXT_THROTTLE_MINUTES. Each channel fails on its
// own and the result says what actually went. Forms use pushLeadAlert only:
// deliverLead (lib/leads.ts) already owns their text and email. Server-only.
import { alertedRecently, recordAlert } from '@/lib/contacts';
import { inboxEnabled, OWNER_TEXT_THROTTLE_MINUTES } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { sendLeadActivityEmail } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { isQuietHours } from '@/lib/leadShared';
import { getOnboardingById } from '@/lib/onboarding';
import { getLine, sendOwnerAlert } from '@/lib/phoneLines';
import { pushToClient } from '@/lib/push';
import { LEAD_ALERT_TITLES, leadLink, leadPushMessage, ownerAlertText, type LeadActivity } from '@/lib/pushShared';

export interface NotifyResult {
  /** Devices that accepted the push. */
  pushed: number;
  sms: boolean;
  email: boolean;
}

const note = (onboardingId: number, contactId: number, channel: 'sms' | 'push' | 'email') =>
  recordAlert(onboardingId, contactId, channel).catch((err) => console.error('[leadNotify] alert not noted', contactId, channel, errText(err)));

/** Push to the client's devices. How many took it; 0 when push is off or failed. Never throws. */
export async function pushLeadAlert(onboardingId: number, contactId: number, what: LeadActivity): Promise<number> {
  try {
    const n = await pushToClient(onboardingId, leadPushMessage(what, contactId));
    if (n > 0) await note(onboardingId, contactId, 'push');
    return n;
  } catch (err) {
    console.error('[leadNotify] push', contactId, errText(err));
    return 0;
  }
}

/** For inbound texts and missed calls (and later Messenger / Instagram). Never throws. */
export async function notifyLeadActivity(onboardingId: number, contactId: number, what: LeadActivity, now: Date = new Date()): Promise<NotifyResult> {
  const out: NotifyResult = { pushed: await pushLeadAlert(onboardingId, contactId, what), sms: false, email: false };
  if (out.pushed > 0) return out;
  try {
    if (await alertedRecently(contactId, OWNER_TEXT_THROTTLE_MINUTES)) return out;
  } catch (err) {
    // Cannot tell: alert anyway. A second text beats a missed lead.
    console.error('[leadNotify] throttle check failed', contactId, errText(err));
  }
  const onboarding = await getOnboardingById(onboardingId).catch(() => null);
  if (!onboarding || !inboxEnabled(onboarding.tier)) return out;

  try {
    const line = await getLine(onboardingId);
    if (line && line.status === 'active' && !isQuietHours(now, line.timeZone)) {
      const r = await sendOwnerAlert(line, ownerAlertText(what, contactId, APP_ORIGIN));
      if (r.sent) {
        out.sms = true;
        await note(onboardingId, contactId, 'sms');
      }
    }
  } catch (err) {
    console.error('[leadNotify] owner text', contactId, errText(err));
  }

  try {
    const sent = await sendLeadActivityEmail({
      to: onboarding.clientEmail,
      businessName: onboarding.businessName,
      title: LEAD_ALERT_TITLES[what],
      url: `${APP_ORIGIN}${leadLink(contactId)}`,
    });
    if (sent) {
      out.email = true;
      await note(onboardingId, contactId, 'email');
    }
  } catch (err) {
    console.error('[leadNotify] email', contactId, errText(err));
  }
  return out;
}
```

- [ ] **Step 3: `DeliveryReport` learns "pushed" (`lib/leadShared.ts`)**

Replace

```ts
  text: SmsSkip | 'sent' | 'opted_out' | 'bad_number' | 'failed' | 'duplicate';
```

with

```ts
  /** 'pushed': slice 4 sent a push to the owner's devices instead of the text. */
  text: SmsSkip | 'sent' | 'opted_out' | 'bad_number' | 'failed' | 'duplicate' | 'pushed';
```

and in `TEXT_WORDS`, after `duplicate: 'duplicate: same person wrote again within 5 minutes',`, add:

```ts
  pushed: 'skipped, a notification went to their phone instead',
```

(`detailsWereTexted('pushed')` stays false, so the call-connect whisper does not claim the details were texted.)

In `lib/leadShared.test.ts`, inside `test('describeDelivery reads as one line for the admin card', () => {`, add as its last line:

```ts
  assert.equal(describeDelivery({ email: 'sent', text: 'pushed', connect: 'started' }), "Email: sent · Text: skipped, a notification went to their phone instead · Call connect: calling the owner's cell now");
```

- [ ] **Step 4: Forms: push first inside `deliverLead` (`lib/leads.ts`)**

Add the imports:

```ts
import { inboxEnabled } from '@/lib/contactsShared';
import { pushLeadAlert } from '@/lib/leadNotify';
```

Change the signature

```ts
export async function deliverLead(owner: LeadOwner, lead: FormSubmission, opts: { now?: Date; test?: boolean } = {}): Promise<DeliveryReport> {
```

to

```ts
export async function deliverLead(owner: LeadOwner, lead: FormSubmission, opts: { now?: Date; test?: boolean; contactId?: number | null } = {}): Promise<DeliveryReport> {
```

Replace

```ts
  // The text goes before the call, so "we texted you their details" is already true when the owner hears it.
  let text: DeliveryReport['text'];
  if (plan.text !== 'send') text = plan.text;
  else if (!line) text = 'no_line';
  else {
    try {
      const r = await sendOwnerAlert(line, leadAlertText(lead));
```

with

```ts
  // Slice 4: a push to the owner's devices first; the owner text is the fallback (spec, "Slice 4 additions").
  // After the duplicate check above, so a repeat form within the window pushes nothing either. The email always went.
  const pushed = opts.contactId && !opts.test && inboxEnabled(owner.tier) ? await pushLeadAlert(owner.id, opts.contactId, 'form') : 0;

  // The text goes before the call, so "we texted you their details" is already true when the owner hears it.
  let text: DeliveryReport['text'];
  if (pushed > 0) text = 'pushed';
  else if (plan.text !== 'send') text = plan.text;
  else if (!line) text = 'no_line';
  else {
    try {
      const r = await sendOwnerAlert(line, leadAlertText(lead));
```

Nothing else in `deliverLead` changes (call connect, the follow-up start and the report stay as they are).

- [ ] **Step 5: The lead route passes the contact**

In `app/api/lead/route.ts`, replace Task 6's

```ts
        await projectForm(saved.id).catch((err) => {
          console.error('[lead] inbox', saved.id, err instanceof Error ? err.message : err);
          return null;
        });
        const owner = await getOnboardingById(onboardingId);
        if (owner) await deliverLead(owner, saved);
```

with

```ts
        const projected = await projectForm(saved.id).catch((err) => {
          console.error('[lead] inbox', saved.id, err instanceof Error ? err.message : err);
          return null;
        });
        const owner = await getOnboardingById(onboardingId);
        if (owner) await deliverLead(owner, saved, { contactId: projected?.contactId ?? null });
```

- [ ] **Step 6: Inbound texts alert the owner**

In `app/api/phone/sms/route.ts` add:

```ts
import { after } from 'next/server';
import { notifyLeadActivity } from '@/lib/leadNotify';
```

Replace Task 6's

```ts
      await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', err instanceof Error ? err.message : err);
        return null;
      });
```

with

```ts
      const projected = await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', err instanceof Error ? err.message : err);
        return null;
      });
      // After Twilio has its answer: push first, then a text and an email if push is not on. Not for STOP / START.
      if (projected && !isStopWord(p.Body) && !isStartWord(p.Body)) {
        const onboardingId = line.onboardingId;
        after(() => notifyLeadActivity(onboardingId, projected.contactId, 'text').then(() => undefined));
      }
```

(`notifyLeadActivity` never throws; `projectMessage` returns null for a withheld sender.)

- [ ] **Step 7: Missed calls alert the owner**

In `app/api/phone/voice/status/route.ts` add:

```ts
import { after } from 'next/server';
import { notifyLeadActivity } from '@/lib/leadNotify';
```

Change Task 6's first projection from

```ts
  await projectCall(p.CallSid).catch((err) => {
```

to

```ts
  const projected = await projectCall(p.CallSid).catch((err) => {
```

(same body). Then replace

```ts
  return twiml(afterDialTwiml({ textedBack }));
}
```

with

```ts
  // Only missed calls reach here (answered returned above): push first, then a text and an email.
  if (projected) {
    const onboardingId = line.onboardingId;
    after(() => notifyLeadActivity(onboardingId, projected.contactId, 'call').then(() => undefined));
  }
  return twiml(afterDialTwiml({ textedBack }));
}
```

- [ ] **Step 8: Type-check and try it**

Run: `npm run lint && npm run test:phone && npm run test:inbox && npm run test:leads && npm run test:sequences`
Expected: clean and PASS.

With `WEB_PUSH_*` unset locally, an AxeonCORE onboarding with a `ready` line and `RESEND_API_KEY` set: in `npx tsx`, `notifyLeadActivity(<onb>, <contact>, 'text', new Date('2026-10-13T18:00:00Z'))` returns `{ pushed: 0, sms: true, email: true }` the first time and `{ pushed: 0, sms: false, email: false }` a second time within 30 minutes (throttle); the contact's timeline shows one "you were sent a text about this lead" and one "you were emailed about this lead". With `new Date('2026-10-14T03:00:00Z')` (10 pm Central) on a fresh contact it returns `{ pushed: 0, sms: false, email: true }`. `deliverLead` through the admin's "Send test lead" still reports the text as before (no `contactId`, `test: true`).

- [ ] **Step 9: Commit**

```bash
git add lib/leadNotify.ts lib/emailLogShared.ts lib/email.ts lib/leadShared.ts lib/leadShared.test.ts lib/leads.ts app/api/lead/route.ts app/api/phone/sms/route.ts app/api/phone/voice/status/route.ts
git commit -m "feat(inbox): lead alerts go push-first with a quiet-hours text and email fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

---

### Task 11: The Leads tab becomes the inbox (AxeonCORE and up); Essentials unchanged

**Files:**
- Modify: `lib/proofDashboardData.ts` (load the inbox for the Leads tab; skip the separate form list for inbox clients; hide matched taps from the anonymous list; pass the push key)
- Modify: `components/proof/LeadStageTaps.tsx` (optional `target` and `onSaved` props; default behaviour unchanged)
- Create: `components/proof/InboxTab.tsx`
- Modify: `components/proof/ProofDashboard.tsx` (new props; inbox branch added in front of today's Leads branch; header button)
- Modify: `app/proof/page.tsx` and `app/admin/onboarding/[token]/preview/page.tsx` (`?contact=`)

**Interfaces:**
- Consumes: `listInbox`, `contactTimeline`, `attachedClickIds` (Task 4); `inboxEnabled`, `parseContactId`, `textingState`, `replyBlocker`, `DashboardInbox` and the display helpers (Task 2); `NotificationsButton` (Task 9); `getLine` and `line.timeZone` (A3); `DEFAULT_TIME_ZONE` (`lib/phoneShared.ts`); `LeadLog`, `FormLeads`, `LeadStageTaps` (existing); `POST /api/proof/leads/stage` `{ contactId, action }` (Task 8).
- Produces:
  - `loadDashboardData(onboarding, tab = 'overview', opts: { contactId?: number | null } = {})`; `DashboardData` gains `inbox: DashboardInbox | null` and `pushKey: string | null`.
  - `ProofDashboard` props `inbox?: DashboardInbox | null`, `inboxApi?: string | null` (null = read-only), `pushKey?: string | null`; `stageApi` unchanged.
  - `<LeadStageTaps … target?: 'form' | 'contact'; onSaved?: () => void />`: `'form'` (default) posts `{ id, action }` exactly as today; `'contact'` posts `{ contactId: id, action }`.
  - `<InboxTab inbox={…} api={…} stageApi={…} />`.

- [ ] **Step 1: Load the inbox in `lib/proofDashboardData.ts`**

Add the imports:

```ts
import { attachedClickIds, contactTimeline, listInbox } from '@/lib/contacts';
import { inboxEnabled, textingState, type DashboardInbox } from '@/lib/contactsShared';
```

and change

```ts
import { toDashboardCall, type CallsSummary, type DashboardCall } from '@/lib/phoneShared';
```

to

```ts
import { DEFAULT_TIME_ZONE, toDashboardCall, type CallsSummary, type DashboardCall } from '@/lib/phoneShared';
```

Change the `DashboardData` type so the page-level props stay outside it:

```ts
export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi' | 'inboxApi' | 'tab'>;
```

Change the signature:

```ts
export async function loadDashboardData(onboarding: Onboarding, tab: ProofTabKey = 'overview', opts: { contactId?: number | null } = {}): Promise<DashboardData> {
```

Replace

```ts
  const [thisMonth, lastMonth, thisForms, lastForms] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
    listSubmissions(onboarding.id, month),
    listSubmissions(onboarding.id, previous),
  ]);
```

with

```ts
  // AxeonCORE and up get the leads inbox, where every form is a contact; the separate form list is Essentials' view.
  const inboxOn = inboxEnabled(onboarding.tier);
  const [thisMonth, lastMonth, thisForms, lastForms] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
    inboxOn ? Promise.resolve([]) : listSubmissions(onboarding.id, month),
    inboxOn ? Promise.resolve([]) : listSubmissions(onboarding.id, previous),
  ]);
```

After the `const phone: DashboardPhone | null = …;` block, add:

```ts
  // The leads inbox: loaded only for the Leads tab; ?contact=<id> opens one person.
  const inbox: DashboardInbox | null =
    inboxOn && tab === 'leads'
      ? await (async (): Promise<DashboardInbox> => {
          const [list, selected] = await Promise.all([
            listInbox(onboarding.id, { limit: 50 }),
            opts.contactId ? contactTimeline(onboarding.id, opts.contactId) : Promise.resolve(null),
          ]);
          return { ...list, selected, timeZone: line?.timeZone ?? DEFAULT_TIME_ZONE, texting: textingState(line) };
        })()
      : null;
  // Taps already matched to a caller live in the inbox; the anonymous list keeps the rest.
  const attached = inboxOn && tab === 'leads' ? await attachedClickIds(onboarding.id, [...thisLeads, ...lastLeads].map((r) => r.id)) : new Set<number>();
  const pushKey = inboxOn && process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY ? process.env.WEB_PUSH_PUBLIC_KEY : null;
```

In the returned object, replace

```ts
    leads: [
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads },
      { month: previous, label: monthLabel(previous), rows: lastLeads },
    ],
```

with

```ts
    leads: [
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads.filter((r) => !attached.has(r.id)) },
      { month: previous, label: monthLabel(previous), rows: lastLeads.filter((r) => !attached.has(r.id)) },
    ],
```

and replace `    phone,` with:

```ts
    phone,
    inbox,
    pushKey,
```

(The `forms` entry stays as it is; for inbox clients it is two empty months.)

- [ ] **Step 2: Let `LeadStageTaps` post for a contact (`components/proof/LeadStageTaps.tsx`)**

Same taps, labels, Job done confirm and notes; two optional props. With neither passed, the component behaves exactly as today, so `FormLeads` is untouched.

Add to the header comment, after its last line:

```ts
// The leads inbox (slice 4) reuses it with target="contact": the same taps post
// { contactId, action }, and onSaved lets the inbox refresh its list.
```

Replace

```tsx
export function LeadStageTaps({ id, stage, quoteSent: initialQuoteSent, api }: { id: number; stage: LeadStage; quoteSent: boolean; api: string | null }) {
```

with

```tsx
export function LeadStageTaps({
  id,
  stage,
  quoteSent: initialQuoteSent,
  api,
  target = 'form',
  onSaved,
}: {
  id: number;
  stage: LeadStage;
  quoteSent: boolean;
  api: string | null;
  /** 'form' posts { id, action } (a form lead, slice 3); 'contact' posts { contactId, action } (an inbox contact, slice 4). */
  target?: 'form' | 'contact';
  /** Called after a tap saved, e.g. to refresh the inbox list. */
  onSaved?: () => void;
}) {
```

Replace

```tsx
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
```

with

```tsx
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target === 'contact' ? { contactId: id, action } : { id, action }) });
```

and replace

```tsx
      else if (started.includes('review')) setNote('The review request goes out in about two hours.');
```

with

```tsx
      else if (started.includes('review')) setNote('The review request goes out in about two hours.');
      onSaved?.();
```

- [ ] **Step 3: Write the inbox tab**

```tsx
'use client';

// components/proof/InboxTab.tsx
// The Leads tab for AxeonCORE and up (spec, "Slice 4 design"): one row per
// person who reached out, newest activity first, and that person's page: who
// they are, where they came from, a stage, every call, text and form in order
// with the recording attached, and a reply box that texts from the client's
// tracked number. The stage taps are slice 3's (LeadStageTaps: Quote sent,
// Talked to them, Booked, Job done, Not a fit), posting { contactId } to the
// same stage route. Everything arrives pre-masked from the server
// (lib/contacts.ts); no full number is ever in this component. `api` and
// `stageApi` are null in the admin's "View as client", which makes the tab
// read-only. Not a CRM: no tasks, no pipeline board, no custom fields.
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Bot, CalendarCheck, FileText, Mail, MessageSquare, MousePointerClick, PhoneCall, Send, StickyNote } from 'lucide-react';
import { LeadStageTaps } from '@/components/proof/LeadStageTaps';
import {
  REPLY_REFUSAL_COPY, STAGE_LABELS, canReplyNow, formatWhen, quietNotice, relativeWhen, replyBlocker, shortName,
  type ContactEventKind, type DashboardContact, type DashboardContactView, type DashboardEvent, type DashboardInbox,
} from '@/lib/contactsShared';
import { SMS_MAX_CHARS } from '@/lib/phoneShared';
import type { LeadStage } from '@/lib/sequenceShared';

type Icon = typeof PhoneCall;

const KIND_ICONS: Record<ContactEventKind, Icon> = {
  call: PhoneCall, text_in: MessageSquare, text_out: MessageSquare, form: FileText, booking: CalendarCheck, chat: Bot,
  click: MousePointerClick, note: StickyNote, alert: Bell, sequence: MessageSquare, reminder: CalendarCheck, messenger: MessageSquare, instagram: MessageSquare,
};

const STAGE_TONES: Record<LeadStage, string> = {
  new: 'bg-blue-50 text-blue-800 ring-blue-200',
  contacted: 'bg-amber-50 text-amber-800 ring-amber-200',
  booked: 'bg-violet-50 text-violet-800 ring-violet-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

const OUTGOING: readonly ContactEventKind[] = ['text_out', 'sequence', 'reminder'];

function StageBadge({ stage }: { stage: LeadStage }) {
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

/** Slice 3's taps on this contact. Read-only chips when stageApi is null (admin preview). */
function StageLine({ contact, stageApi }: { contact: DashboardContact; stageApi: string | null }) {
  const router = useRouter();
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500">Stage</span>
        <StageBadge stage={contact.stage} />
      </div>
      <div className="mt-2">
        <LeadStageTaps id={contact.id} stage={contact.stage} quoteSent={contact.quoteSent} api={stageApi} target="contact" onSaved={() => router.refresh()} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">Job done and Not a fit count toward your close rate.</p>
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

  // The same order the server refuses in (lib/contactsShared.ts replyBlocker).
  const blocked = replyBlocker({ hasPhone: contact.hasPhone, optedOut: contact.optedOut, texting });

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
            {REPLY_REFUSAL_COPY.opted_out}
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

function ContactView({ view, api, stageApi, timeZone, texting }: { view: DashboardContactView; api: string | null; stageApi: string | null; timeZone: string; texting: DashboardInbox['texting'] }) {
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
        <StageLine contact={c} stageApi={stageApi} />
      </header>
      <ol ref={timeline} className="max-h-[60vh] space-y-4 overflow-y-auto p-4" aria-label="Everything from this lead">
        {view.events.length === 0 ? <li className="text-sm text-neutral-500">Nothing yet.</li> : view.events.map((e) => <EventItem key={e.id} e={e} api={api} />)}
        {view.held.map((h) => (
          <li key={`held-${h.id}`} className="flex justify-end">
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1 ${h.status === 'failed' ? 'bg-red-50 text-red-900 ring-red-200' : 'bg-amber-50 text-amber-950 ring-amber-200'}`}>
              <p className="whitespace-pre-wrap break-words">{h.body}</p>
              <p className="mt-1 text-[11px]">{h.status === 'failed' ? 'This text may not have gone out. Check with them, or send it again from the box below.' : quietNotice(h.sendAt, timeZone, true)}</p>
            </div>
          </li>
        ))}
      </ol>
      <ReplyBox contact={c} api={api} timeZone={timeZone} texting={texting} />
    </div>
  );
}

export function InboxTab({ inbox, api, stageApi }: { inbox: DashboardInbox; api: string | null; stageApi: string | null }) {
  const selected = inbox.selected;
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(300px,400px)_1fr]">
      <div className={selected ? 'hidden lg:block' : ''}>
        <ContactList contacts={inbox.contacts} nextCursor={inbox.nextCursor} selectedId={selected?.contact.id ?? null} api={api} />
      </div>
      <div className={selected ? '' : 'hidden lg:block'}>
        {selected ? (
          <ContactView key={selected.contact.id} view={selected} api={api} stageApi={stageApi} timeZone={inbox.timeZone} texting={inbox.texting} />
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

- [ ] **Step 4: Wire it into `components/proof/ProofDashboard.tsx`**

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
  /** The leads inbox for AxeonCORE and up, loaded for the Leads tab only (lib/proofDashboardData.ts). Null: today's Leads tab. */
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

Then, in the Leads branch, replace exactly

```tsx
          tab === 'leads' ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
```

with

```tsx
          tab === 'leads' ? (
            inbox ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Leads</h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  Everyone who called, texted or sent your form, newest first. Tap a person to see everything from them, mark how it went, and text them back from your tracked number.
                </p>
                <InboxTab inbox={inbox} api={preview ? null : inboxApi} stageApi={preview ? null : stageApi} />
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
```

and replace exactly

```tsx
                </Card>
              )}
            </div>
          ) : tab === 'email' ? (
```

with

```tsx
                </Card>
              )}
            </div>
            )
          ) : tab === 'email' ? (
```

Everything between those two edits, today's Leads tab (its heading, `{forms.some((m) => m.rows.length > 0) ? <FormLeads months={forms} stageApi={preview ? null : stageApi} /> : null}`, the `LeadLog`, and the empty-state `Card`), is left byte for byte as it is: it is now the Essentials branch. (Run the formatter on the file afterwards if the repo's style wants that block re-indented; no content changes.)

- [ ] **Step 5: Pass `?contact=` from both pages**

`app/proof/page.tsx`, whole file (it keeps `stageApi`):

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
  return (
    <ProofDashboard
      email={account.email}
      {...data}
      leadApi="/api/proof/leads"
      stageApi="/api/proof/leads/stage"
      inboxApi="/api/proof/inbox"
      scanApi="/api/proof/scan"
      tab={key}
    />
  );
}
```

(A signed-out tap on a notification lands on the sign-in page; after signing in the client opens Leads. The sign-in form's redirect is unchanged in this slice.)

In `app/admin/onboarding/[token]/preview/page.tsx`: change the `searchParams` type to `Promise<{ tab?: string; contact?: string }>`, replace `const { tab } = await searchParams;` with `const { tab, contact } = await searchParams;`, add `import { parseContactId } from '@/lib/contactsShared';`, and replace `const data = await loadDashboardData(onboarding, key);` with `const data = await loadDashboardData(onboarding, key, { contactId: parseContactId(contact) });`. Pass no `inboxApi` and no `stageApi` (as today): the preview's inbox is read-only (no reply, read-only stage chips, no Email button, recordings shown as "Recorded").

- [ ] **Step 6: Type-check, build and look at it**

Run: `npm run lint && npm run build`
Expected: clean; build succeeds.

`npm run dev`, then as an AxeonCORE test client with the backfill run (Task 8) and a line:

1. Leads tab: one row per person, newest first; rows read like `Mike R. · (515) 555-01··` / `Called · 2 min ago · missed, texted back`. No "Messages from your website form" list: those forms are contacts here.
2. Tap a row: the URL gains `&contact=<id>`; header, stage badge and slice 3's taps (Quote sent, Talked to them, Booked, Job done, Not a fit; Job done asks first), timeline (calls with a player, texts as bubbles with "sent automatically" on the text-back, forms with their fields, a `Tapped "…"` note per tap), reply box. On a phone the list hides and "All leads" goes back.
3. Tap Booked: the badge and the list row change to Booked after the refresh; the matching form row in the database has `stage = 'booked'`.
4. View source / React DevTools props: no `+1` number and no full email anywhere (Review Focus 1).
5. An opted-out contact shows "This person asked not to be texted." and no reply box. A contact with only an email shows the email copy and an Email button.
6. Admin "View as client" → Leads: same list and timeline, no reply box ("Read-only preview"), stage chips read-only, no Email button, no notifications button.
7. An Essentials client's Leads tab is unchanged: the form list with its taps (which still save), the tracker list, and the empty state.

- [ ] **Step 7: Commit**

```bash
git add lib/proofDashboardData.ts components/proof/LeadStageTaps.tsx components/proof/InboxTab.tsx components/proof/ProofDashboard.tsx app/proof/page.tsx "app/admin/onboarding/[token]/preview/page.tsx"
git commit -m "feat(inbox): Leads tab becomes the leads inbox for AxeonCORE and up

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
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
# Without them every lead alert falls back to a text to the owner's cell (not 8 pm to 8 am) and an email.
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
"send booked leads to" integration, built when a client asks. Essentials keeps
the Leads tab it had (form list with taps, tracker list).

| Piece | Where |
| --- | --- |
| Rules, masking, reply order (client-safe) | `lib/contactsShared.ts` |
| Contacts, merge, projections, backfill | `lib/contacts.ts` |
| Stage taps (form leads and contacts) | `lib/leadStages.ts` (`applyLeadStage`, `formContactStore`, `contactStore`), `POST /api/proof/leads/stage` `{ id }` or `{ contactId }` |
| Replies and held replies | `lib/inboxReply.ts`, `/api/cron/held-replies` (every 15 min) |
| Push | `lib/pushShared.ts`, `lib/push.ts`, `public/sw.js`, `public/proof.webmanifest` |
| Alerts (push first, text and email fallback) | `lib/leadNotify.ts`; forms in `deliverLead` (`lib/leads.ts`) |
| Client API | `/api/proof/inbox`, `/api/proof/inbox/<id>` (+ `/reply`, `/email`), `/api/proof/push/subscribe` |
| Admin | `POST /api/admin/contacts/backfill` `{ onboardingId? }` |
| UI | `components/proof/InboxTab.tsx`, `components/proof/NotificationsButton.tsx`, `LeadStageTaps` (`target="contact"`) |
| Tables | `contacts`, `contact_events`, `push_subscriptions`, `held_replies` |
| Tests | `npm run test:inbox` (plus `test:sequences` for the stage engine) |

**How a lead becomes a contact.** Every producer writes its own table first
(`phone_calls`, `phone_messages`, `form_submissions`), then calls one projection
in `lib/contacts.ts`. The projection re-reads the source row and upserts one
`contact_events` row keyed on the source row, so retries and re-runs never
double anything. Only the lead's own action creates a contact (a call, a text to
the tracked number, a form); texts and follow-up emails we send join a contact
that already exists and never create one. Admin test leads never become
contacts. A phone number is the identity; a form with only an email is keyed by
email. When one event carries the phone of one contact and the email of another,
the two merge into the older one. A tap on the site's call or text button joins a
brand-new caller or texter who shows up within 10 minutes; any other tap stays in
"Website taps we could not match to a caller" below the inbox.

**Stages.** New, Contacted, Booked, Won, Lost. The client taps slice 3's buttons:
Quote sent, Talked to them, Booked, Job done (Won), Not a fit (Lost), on a form
lead (Essentials and up) or on a contact (inbox). Both go through the same
`applyLeadStage`, and the form and its contact always show the same stage. An
answered call or a typed reply moves New to Contacted by itself; code never moves
a contact backwards or off Won/Lost. Contacted, Booked, Won and Lost stop the
new-lead and quote follow-ups; Won starts the review request; Quote sent starts
the quote follow-up (`STAGE_EFFECTS`). Won and Lost count toward the client's
close rate: through the matched website tap if there is one, directly otherwise.

**Replies** go out from the tracked number through `sendClientSms`, so the opt-out
list and the 10DLC gate apply. Between 8 pm and 8 am client-local a reply is held
and sent at 8 am; the client sees when. A held reply whose send was interrupted
shows as "may not have gone out" and is never sent twice. Email replies open the
client's mail app.

**Privacy.** The browser only gets masked numbers and emails. A push, the
fallback text and the fallback email say "New text from a lead" (or "Missed
call", "New form") and link to the lead, nothing else. Recordings play through
the signed-in recording route.

**Push.** "Turn on notifications" in the PROOF header. On an iPhone, PROOF must be
added to the Home Screen first (the button explains). With no device turned on:
an inbound text or a missed call sends the owner one text (never 8 pm to 8 am)
and one email per lead per 30 minutes; a form uses slice 2's alert text, and
slice 2's lead email always goes.
```

In the `## Environment variables` table, add:

```markdown
| `WEB_PUSH_PUBLIC_KEY` | VAPID public key for lead notifications (`npx web-push generate-vapid-keys`). |
| `WEB_PUSH_PRIVATE_KEY` | VAPID private key. Never pasted anywhere but Vercel. |
| `WEB_PUSH_SUBJECT` | Optional. Contact for the push services. Default `mailto:hello@axeonstudio.co`. |
```

- [ ] **Step 3: Full check**

Run: `npm run test:inbox && npm run test:sequences && npm run test:leads && npm run test:phone && npm run test:onboarding && npm run lint && npm run build`
Expected: all PASS, clean, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/onboarding.md .env.example
git commit -m "docs(inbox): the leads inbox, push keys, go-live

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YQUJc6ai2kbkCaDk39UxNR"
```

- [ ] **Step 5: Go-live (owner, not code)**

1. **VAPID keys.** Run `npx web-push generate-vapid-keys` once. In Vercel (Production and Preview) set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT=mailto:hello@axeonstudio.co`. Redeploy. Keep the private key only in Vercel.
2. **Tables.** They create themselves on the first request (`ensureSchema`); `npm run db:init` against production does the same.
3. **Backfill once.** Signed in to the admin on `app.axeonstudio.co`, in the browser console: `await (await fetch('/api/admin/contacts/backfill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()`. Per client, `calls` should match that client's `phone_calls` rows minus withheld callers and connect calls about test leads; `forms` should match its `form_submissions` rows with `is_test = false`; `messages` counts inbound texts plus outbound texts to someone who is a contact (owner alerts and texts to non-contacts are not counted). `stagesCopied` is the number of contacts that took a stage already tapped on a form in slice 3. Running it again returns the same `calls`, `messages` and `forms`, `stagesCopied: 0`, and adds nothing.
4. **Cron.** Vercel → Settings → Cron Jobs lists `/api/cron/held-replies` every 15 minutes.
5. **Reply test.** As an AxeonCORE test client whose line is `ready`, with your own cell as the lead: open Leads → your contact → send "Test from PROOF" in the daytime. It arrives from the tracked number; the timeline shows it as yours and the stage moves to Contacted. After 8 pm Central, send another: the box says it goes out at 8:00 AM; it arrives between 8:00 and 8:15.
6. **Stage test.** Tap Quote sent on that contact: the quote follow-up starts (the note says so). If the contact came from a form, the same form in an Essentials-style form list (admin "View as client" of an Essentials client, or the database) shows Contacted too.
7. **Push test, Android.** Chrome on an Android phone, PROOF signed in → "Turn on notifications" → allow. Text the tracked number from another phone: "New text from a lead" arrives with no number or words in it; tapping it opens that contact.
8. **Push test, iPhone.** Safari → Share → Add to Home Screen → open AxeonPROOF from the Home Screen → "Turn on notifications" → allow → repeat the text.
9. **Fallback test.** Turn notifications off for PROOF in the phone's settings, then in the daytime text the tracked number twice within a few minutes: the owner's cell gets one "New text from a lead…" text and the client's email one "New text from a lead" email, not two of either.
10. **Opt-out test.** Reply STOP from the test phone: the contact shows "This person asked not to be texted." and the reply box is gone.
11. **Close rate.** Tap Job done on a test contact, then Not a fit, then Talked to them: the admin's report preview for that client shows the marked count go up by one and back.
12. **Essentials unchanged.** As an Essentials test client, the Leads tab still shows the form list with its taps; a tap saves and answers as before.
