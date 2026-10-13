# Call Connect, Lead Intake, Alerts and Call Screening (Slice 2 of the PROOF Lead System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Client website forms post straight into AxeonPROOF. The client gets an email for every lead; on AxeonCORE and up the owner also gets a text alert and a call that says the lead's name and connects them on "press 1" (call connect). Inbound calls to the tracked number are screened with "press 1 to accept", so a voicemail pickup or a declined call counts as missed and gets the missed-call text-back.

**Architecture:** `POST /api/lead` resolves the form's `site` key to the client with the same lookup `/api/t` uses (`onboardingIdForSiteKey`), validates the fields in `lib/leadShared.ts`, writes `form_submissions`, answers the visitor, and then runs `deliverLead` (`lib/leads.ts`) inside `after()` from `next/server`: a Resend email to the client, an owner text through `sendClientSms` (`kind = 'alert'`), and a Twilio REST call from the tracked number to the owner's cell. Twilio fetches signed TwiML from `/api/phone/connect?lead=<id>` (whisper inside a `<Gather>`, then `<Dial>` to the lead on 1) and reports to `/api/phone/connect/status?lead=<id>`. Inbound forwarding wraps the owner's number in `<Number url="/api/phone/voice/screen?line=<id>">`, whose `<Gather>` action `/api/phone/voice/screen/accept` bridges only on 1. The admin Phone card gets the three new settings and a "Send test lead" button; PROOF's Leads tab lists website form messages next to the tracker's leads.

**Tech Stack:** Next.js 15 App Router route handlers (`runtime = 'nodejs'`) and `after()` from `next/server`, `@vercel/postgres` via `lib/db.ts`, Twilio REST over `fetch` (no SDK), `node:crypto` for the IP hash, `Intl.DateTimeFormat` for client-local time, Resend through `lib/email.ts`, `tsx --test` + `node:assert/strict` for tests, Tailwind + `components/admin/ui.ts` helpers for UI.

**Spec:** `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md` (sections "Architecture (all slices)", "Cross-slice decisions", "Slice 2 design", "Execution order")

## Global Constraints

Carried from slice 1, unchanged:

- Phone numbers are stored E.164 (`+15155550134`); never store a formatted number.
- No automated text is sent while `phone_lines.sms_status = 'pending'`.
- Every outbound send checks `phone_opt_outs` first.
- One text-back per caller per client per 24 hours.
- Webhook routes verify `X-Twilio-Signature` and answer 403 on a bad one; they never leak whether a number is known.
- Client-facing copy uses plain language (brand guardrails): "tracked phone number", "missed-call text-back", never "speed-to-lead" or "workflow".
- Every new table goes in both `lib/db.ts` `ensureSchema()` and `scripts/init-db.mjs`, `IF NOT EXISTS` only.
- Client-safe modules (`*Shared.ts`) import nothing from `node:*` or `@/lib/db`.
- Tests run with `tsx --test` and need no database or network; SQL functions are not unit-tested, pure helpers are.
- Commit after every task with a message in the repo's style (`feat:`, `fix:`, short imperative).

Added by this slice:

- Every commit message ends with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` (passed as a second `-m`).
- The features are called "call connect" and "call screening" in every string a client or owner sees. Never "speed-to-lead" or "workflow".
- **Quiet hours:** 8 pm to 8 am in the line's `time_zone` (default `America/Chicago`). No owner alert text and no call connect call goes out in quiet hours; the email still goes (email is silent). The missed-call text-back in `/api/phone/voice/status` is transactional and is never subject to quiet hours: do not add a quiet-hours check there. Holding a skipped text until 8 am needs the slice 3 scheduler; slice 2 skips it and says so in the delivery report.
- **`/api/lead` defends itself:** the honeypot field `company_website` must be empty (a filled one gets the same "thanks" a person gets and nothing is written), and at most `LEAD_RATE_LIMIT` (5) submissions per IP hash per `LEAD_RATE_WINDOW_MINUTES` (10) per site, counted in `form_submissions` (an in-memory map is only a flood guard on top). The raw IP is never stored, only `leadIpHash`.
- **The visitor never waits on Twilio or Resend:** `/api/lead` writes the row, schedules `deliverLead` with `after()`, and returns. Nothing after the insert is awaited before the response.
- **`sendSms` is reachable only through `sendClientSms`.** Owner alerts go through `sendOwnerAlert`, which calls `sendClientSms(line, line.forwardTo, body, 'alert')`. No new file imports `sendSms`.
- **Schema changes are additive and idempotent:** new columns use `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in both schema files; the widened `phone_messages.kind` check uses `DROP CONSTRAINT IF EXISTS` then `ADD CONSTRAINT`, exactly like `site_events_kind_check` in `lib/db.ts`.
- **Tier gating:** the email alert goes to every client whose site posts a form. Owner texts and call connect calls are AxeonCORE and up (`planLeadDelivery` returns `'plan'` below that), even if a line was provisioned by mistake.
- **Ids in Twilio URLs are signed:** `/api/phone/connect*` and `/api/phone/voice/screen` carry `?lead=` / `?line=`; they read the request with `readTwilioRequest(req, path, { withQuery: true })` so the signature covers the query, and a lead id is only honoured when it belongs to the client whose tracked number is on the call.
- `.env.example` and `vercel.json` do not change: no new secrets, no new cron.

## Hooks this slice leaves for slices 3 and 4

- `form_submissions` is the lead record slices 3 to 5 build on (slice 4 backfills `contacts` from it). Keep `phone` E.164 or null and `email` lower-case or null.
- `deliverLead(owner, lead)` in Task 4 is the one place a new website lead fans out. Slice 3 starts the `new_lead` sequence from it; slice 5's chat `take_message` tool writes a `form_submissions` row and calls it.
- Call connect rows in `phone_calls` have `direction = 'connect'`, `lead_id` set, and `from_number` = the lead's phone, so slice 4's contact timeline keys them to the lead like any other call. `callsSummary` and `recentCalls` count `direction = 'inbound'` only, so the Calls tab and the monthly report keep meaning "people who called you".
- `sendOwnerAlert` is the SMS path slice 4's push notifications fall back to.

## Review Focus

1. **Phone numbers people actually type.** A visitor types `555-0134`, `+44 7700 900123`, or nothing; a lead with only an email must still be saved, a non-US number must never be dialed, and the owner must never be connect-called to their own cell. Pinned in Task 1 (`validateLeadInput keeps a lead whose phone is not a US number…`, `planLeadDelivery explains every other reason it will not call`: `no_phone`, `same_number`).
2. **The clock.** A lead at 9:30 pm Central must not ring a sleeping owner's phone, across daylight saving and for clients outside Iowa, and a mistyped zone must fall back to Central rather than throw. Pinned in Task 1 (`isQuietHours follows the client's own zone, across daylight saving`, `planLeadDelivery holds the text and the call at night, and never for Essentials`).
3. **Text the visitor typed reaching a voice, a text, an email, or a redirect.** A name like `Jane <b>&</b>` or a link must not break TwiML, be read aloud as markup, inject HTML into the client's email, push an alert past two segments, or turn the form's `redirect` field into an open redirect. Pinned in Task 1 (`spokenName keeps letters only…`, `leadAlertText fits one alert in two SMS segments…`, `safeRedirect only follows the form back to the site it came from`), Task 2 (`connectWhisperTwiml says the lead name safely…`), and Task 4 (`renderClientLeadAlert escapes everything the visitor typed…`).
4. **Twilio callbacks that carry an id in the URL.** Twilio signs the full URL including `?lead=42`; a replay against `?lead=43`, or a request checked without its query, must be refused, and a lead id from one client must never ring through another client's line. Pinned in Task 2 (`readTwilioRequest with withQuery checks the signature over the URL including its query`); the onboarding binding (`getSubmission(line.onboardingId, leadId)`) is in Task 5's connect routes, reviewed.
5. **Keypresses, or none, on a screened or connect call.** Voicemail never presses 1, so a screened leg must end in `<Hangup/>` (the parent dial reports `no-answer` and the text-back fires); any digit other than 1 must not bridge; an owner who presses nothing must hear where the details went. Pinned in Task 2 (`screenTwiml asks for 1 with the business name and hangs up when nobody presses`, `connectWhisperTwiml says the lead name safely inside a Gather and falls through to where the details went`); Task 5's accept route bridges only on `Digits === '1'`, reviewed.

---

### Task 1: Lead helpers, quiet hours, and the slice 2 tables

**Files:**
- Create: `lib/leadShared.ts`
- Test: `lib/leadShared.test.ts`
- Modify: `lib/phoneShared.ts` (call direction, message kinds, US time zones)
- Modify: `lib/phoneShared.test.ts` (one test)
- Modify: `lib/db.ts` (`ensureSchema()`)
- Modify: `scripts/init-db.mjs`
- Modify: `package.json` (add `test:leads`)

**Interfaces:**
- Consumes: `normalizePhone`, `formatPhone`, `maskNumber`, `SMS_MAX_CHARS`, `type SmsStatus` (lib/phoneShared.ts, slice 1); `TIER_RANK`, `type OnboardingTier` (data/onboardingItems.ts).
- Produces (lib/phoneShared.ts):
  - `type CallDirection = 'inbound' | 'connect'`
  - `type MessageKind = 'text_back' | 'manual' | 'inbound' | 'alert' | 'sequence' | 'confirm' | 'reminder'`
  - `DEFAULT_TIME_ZONE = 'America/Chicago'`
  - `US_TIME_ZONES: ReadonlyArray<{ id: string; label: string }>`
  - `isUsTimeZone(v: unknown): v is string`
- Produces (lib/leadShared.ts):
  - `HONEYPOT_FIELD = 'company_website'`, `LEAD_MESSAGE_MAX = 2000`, `QUIET_START_HOUR = 20`, `QUIET_END_HOUR = 8`
  - `interface LeadInput { name: string; phone: string | null; email: string | null; message: string; page: string; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }`
  - `type LeadValidation = { ok: true; lead: LeadInput } | { ok: false; reason: 'spam' } | { ok: false; reason: 'invalid'; error: string }`
  - `validateLeadInput(raw: Record<string, unknown>): LeadValidation`
  - `pagePath(raw: unknown): string`
  - `isQuietHours(now: Date, timeZone: string): boolean`
  - `type SmsSkip = 'plan' | 'no_line' | 'sms_pending' | 'quiet_hours'`
  - `type ConnectSkip = 'plan' | 'no_line' | 'off' | 'no_phone' | 'same_number' | 'quiet_hours'`
  - `interface LeadLineView { phoneNumber: string; forwardTo: string; smsStatus: SmsStatus; callConnectEnabled: boolean; timeZone: string }`
  - `interface DeliveryPlan { text: 'send' | SmsSkip; connect: 'call' | ConnectSkip }`
  - `planLeadDelivery(input: { tier: OnboardingTier; line: LeadLineView | null; leadPhone: string | null; now: Date }): DeliveryPlan`
  - `interface DeliveryReport { email: 'sent' | 'off' | 'failed'; text: SmsSkip | 'sent' | 'opted_out' | 'bad_number' | 'failed'; connect: ConnectSkip | 'started' | 'failed' }`
  - `describeDelivery(r: DeliveryReport): string`
  - `leadDisplayName(name: string): string`
  - `leadAlertText(lead: { name: string; phone: string | null; email: string | null; message: string; page: string }): string`
  - `spokenName(name: string): string`
  - `connectWhisperText(leadName: string): string`
  - `parseId(raw: string | null | undefined): number | null`
  - `safeRedirect(target: unknown, origin: string | null, referer: string | null): string | null`
  - `backLink(referer: string | null): string | null`
  - `replyPage(input: { heading: string; text: string; backUrl: string | null }): string`
  - `interface FormSubmission extends LeadInput { id: number; onboardingId: number; isTest: boolean; connectPressedAt: string | null; createdAt: string }`
  - `interface DashboardSubmission { id: number; at: string; name: string; phone: string | null; page: string; calledBack: boolean }`
  - `toDashboardSubmission(s: FormSubmission): DashboardSubmission`
- Produces (schema): table `form_submissions`; columns `phone_lines.screen_calls`, `phone_lines.call_connect_enabled`, `phone_lines.time_zone`, `phone_calls.direction`, `phone_calls.lead_id`; widened `phone_messages_kind_check`.

- [ ] **Step 1: Write the failing tests for the lead helpers**

```ts
// lib/leadShared.test.ts
// Run with: npm run test:leads   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  backLink, connectWhisperText, describeDelivery, isQuietHours, leadAlertText, pagePath, parseId, planLeadDelivery,
  replyPage, safeRedirect, spokenName, toDashboardSubmission, validateLeadInput, type FormSubmission, type LeadLineView,
} from './leadShared';
import { SMS_MAX_CHARS } from './phoneShared';

test('validateLeadInput keeps a normal form and normalizes phone, email and page', () => {
  const v = validateLeadInput({
    site: 'ax_abcdefghjkmnpq', name: '  Jane   Doe ', phone: '(515) 555-0134', email: ' Jane@Example.COM ',
    message: 'Need a quote\r\nfor a driveway', page: 'https://client.com/quote?x=1', utm_source: 'google', company_website: '',
  });
  assert.deepEqual(v, {
    ok: true,
    lead: { name: 'Jane Doe', phone: '+15155550134', email: 'jane@example.com', message: 'Need a quote\nfor a driveway', page: '/quote', utmSource: 'google', utmMedium: null, utmCampaign: null },
  });
});

test('validateLeadInput treats a filled honeypot as spam and needs a phone or an email', () => {
  assert.deepEqual(validateLeadInput({ name: 'Bot', email: 'a@b.co', company_website: 'http://spam.example' }), { ok: false, reason: 'spam' });
  const none = validateLeadInput({ name: 'Jane', message: 'hi' });
  assert.ok(!none.ok && none.reason === 'invalid' && /phone number or email/.test(none.error));
});

test('validateLeadInput keeps a lead whose phone is not a US number when there is an email, with the phone as typed in the message', () => {
  const v = validateLeadInput({ name: 'Ann', phone: '+44 7700 900123', email: 'ann@example.co.uk', message: 'Hello' });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.phone, null);
    assert.equal(v.lead.message, 'Hello\nPhone as typed: +44 7700 900123');
  }
  const bad = validateLeadInput({ name: 'Ann', phone: '555-0134' });
  assert.ok(!bad.ok && bad.reason === 'invalid' && /check your phone/.test(bad.error));
});

test('validateLeadInput accepts the field names client sites already use and appends extra fields to the message', () => {
  const v = validateLeadInput({ first_name: 'Jose', last_name: 'García', tel: '515-555-0134', service: 'Driveway', 'square-feet': 800, _gotcha: '', redirect: '/thanks' });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.name, 'Jose García');
    assert.equal(v.lead.phone, '+15155550134');
    assert.equal(v.lead.message, 'service: Driveway\nsquare feet: 800');
  }
});

test('validateLeadInput caps long fields and never keeps control characters', () => {
  const v = validateLeadInput({ name: `A\u0000B${'x'.repeat(300)}`, email: 'a@b.co', message: 'm'.repeat(5000) });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.name.length, 100);
    assert.ok(!v.lead.name.includes('\u0000'));
    assert.equal(v.lead.message.length, 2000);
  }
});

test('pagePath keeps only the path of a page URL', () => {
  assert.equal(pagePath('https://client.com/quote?x=1#top'), '/quote');
  assert.equal(pagePath('quote'), '/quote');
  assert.equal(pagePath('/'), '/');
  assert.equal(pagePath(''), '');
  assert.equal(pagePath(5), '');
});

test("isQuietHours follows the client's own zone, across daylight saving", () => {
  // July, Central daylight time (UTC-5).
  assert.equal(isQuietHours(new Date('2026-07-15T00:59:00Z'), 'America/Chicago'), false); // 7:59 pm
  assert.equal(isQuietHours(new Date('2026-07-15T01:00:00Z'), 'America/Chicago'), true); // 8:00 pm
  assert.equal(isQuietHours(new Date('2026-07-15T12:59:00Z'), 'America/Chicago'), true); // 7:59 am
  assert.equal(isQuietHours(new Date('2026-07-15T13:00:00Z'), 'America/Chicago'), false); // 8:00 am
  // January, Central standard time (UTC-6).
  assert.equal(isQuietHours(new Date('2026-01-15T01:59:00Z'), 'America/Chicago'), false); // 7:59 pm
  assert.equal(isQuietHours(new Date('2026-01-15T02:00:00Z'), 'America/Chicago'), true); // 8:00 pm
  // The morning the clocks spring forward (2026-03-08): 8 am is 13:00Z, not 14:00Z.
  assert.equal(isQuietHours(new Date('2026-03-08T12:30:00Z'), 'America/Chicago'), true); // 7:30 am CDT
  assert.equal(isQuietHours(new Date('2026-03-08T13:00:00Z'), 'America/Chicago'), false); // 8:00 am CDT
  // One instant, three clients.
  const t = new Date('2026-07-15T01:30:00Z');
  assert.equal(isQuietHours(t, 'America/New_York'), true); // 9:30 pm
  assert.equal(isQuietHours(t, 'America/Los_Angeles'), false); // 6:30 pm
  assert.equal(isQuietHours(new Date('2026-07-15T06:00:00Z'), 'Pacific/Honolulu'), true); // 8:00 pm
  // A bad zone falls back to Central instead of throwing.
  assert.equal(isQuietHours(new Date('2026-07-15T01:00:00Z'), 'Mars/Base'), true);
  assert.equal(isQuietHours(new Date('2026-07-15T17:00:00Z'), ''), false);
});

const LINE: LeadLineView = { phoneNumber: '+15155550199', forwardTo: '+15155550100', smsStatus: 'ready', callConnectEnabled: true, timeZone: 'America/Chicago' };
const NOON = new Date('2026-07-15T17:00:00Z');
const TEN_PM = new Date('2026-07-16T03:00:00Z');

test('planLeadDelivery texts and calls the owner for AxeonCORE and up in the daytime', () => {
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'send', connect: 'call' });
  assert.deepEqual(planLeadDelivery({ tier: 'axeongrowth', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'send', connect: 'call' });
});

test('planLeadDelivery holds the text and the call at night, and never for Essentials', () => {
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: LINE, leadPhone: '+15155550134', now: TEN_PM }), { text: 'quiet_hours', connect: 'quiet_hours' });
  assert.deepEqual(planLeadDelivery({ tier: 'essentials', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'plan', connect: 'plan' });
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: null, leadPhone: '+15155550134', now: NOON }), { text: 'no_line', connect: 'no_line' });
});

test('planLeadDelivery explains every other reason it will not call', () => {
  const at = (line: Partial<LeadLineView>, leadPhone: string | null) => planLeadDelivery({ tier: 'axeoncore', line: { ...LINE, ...line }, leadPhone, now: NOON });
  assert.deepEqual(at({ smsStatus: 'pending' }, '+15155550134'), { text: 'sms_pending', connect: 'call' });
  assert.equal(at({ callConnectEnabled: false }, '+15155550134').connect, 'off');
  assert.equal(at({}, null).connect, 'no_phone');
  assert.equal(at({}, '+15155550100').connect, 'same_number'); // the owner's own cell
  assert.equal(at({}, '+15155550199').connect, 'same_number'); // the tracked number itself
  assert.deepEqual(planLeadDelivery({ tier: 'gold' as never, line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'plan', connect: 'plan' });
});

test('describeDelivery reads as one line for the admin card', () => {
  assert.equal(describeDelivery({ email: 'sent', text: 'sms_pending', connect: 'started' }), "Email: sent · Text: waiting on 10DLC approval · Call connect: calling the owner's cell now");
  assert.equal(
    describeDelivery({ email: 'off', text: 'quiet_hours', connect: 'same_number' }),
    "Email: not configured (RESEND_API_KEY) · Text: skipped, quiet hours (8 pm to 8 am) · Call connect: the lead's phone is the owner's own number",
  );
});

test('leadAlertText fits one alert in two SMS segments and keeps who and how to reach them', () => {
  const t = leadAlertText({ name: 'Jane Doe', phone: '+15155550134', email: 'jane@example.com', message: 'word '.repeat(200), page: '/quote' });
  assert.ok(t.length <= SMS_MAX_CHARS, String(t.length));
  assert.ok(t.startsWith('New website lead: Jane Doe, (515) 555-0134, jane@example.com. "word word'));
  assert.ok(t.endsWith('…" Page: /quote'));
  assert.equal(leadAlertText({ name: '', phone: null, email: 'a@b.co', message: '', page: '' }), 'New website lead: Someone, a@b.co.');
  assert.equal(leadAlertText({ name: 'Al', phone: '+15155550134', email: null, message: 'Fix\n\nmy   deck', page: '/' }), 'New website lead: Al, (515) 555-0134. "Fix my deck" Page: /');
});

test('spokenName keeps letters only, so the voice never reads markup, links or numbers', () => {
  assert.equal(spokenName('Jane & "Bob" <b>'), 'Jane Bob b');
  assert.equal(spokenName("Mary-Kate O'Neil"), "Mary-Kate O'Neil");
  assert.equal(spokenName('José Núñez'), 'José Núñez');
  assert.equal(spokenName('12345 !!!'), 'someone');
  assert.equal(spokenName('x'.repeat(80)).length, 40);
  assert.equal(connectWhisperText('Jane'), 'New lead from your website: Jane. Press 1 to call them now.');
});

test('parseId accepts a positive whole number and nothing else', () => {
  assert.equal(parseId('42'), 42);
  for (const bad of ['0', '-1', '4.2', '042', 'abc', '', null, undefined, '1'.repeat(16)]) assert.equal(parseId(bad), null, String(bad));
});

test('safeRedirect only follows the form back to the site it came from', () => {
  const origin = 'https://www.client.com';
  assert.equal(safeRedirect('https://client.com/thanks', origin, null), 'https://client.com/thanks');
  assert.equal(safeRedirect('/thanks', origin, null), 'https://www.client.com/thanks');
  assert.equal(safeRedirect('thanks.html', null, 'https://client.com/contact/'), 'https://client.com/contact/thanks.html');
  assert.equal(safeRedirect('https://evil.example/x', origin, null), null);
  assert.equal(safeRedirect('//evil.example/x', origin, null), null);
  assert.equal(safeRedirect('javascript:alert(1)', origin, null), null);
  assert.equal(safeRedirect('/thanks', null, null), null);
  assert.equal(safeRedirect('/thanks', 'null', null), null);
  assert.equal(safeRedirect(undefined, origin, null), null);
});

test('backLink and replyPage: only http(s) links back, and everything shown is escaped', () => {
  assert.equal(backLink('https://client.com/contact'), 'https://client.com/contact');
  assert.equal(backLink('javascript:alert(1)'), null);
  assert.equal(backLink(null), null);
  const html = replyPage({ heading: 'Thanks', text: '<script>x</script>', backUrl: 'https://client.com/?a=1&b="2"' });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /<p>&lt;script&gt;x&lt;\/script&gt;<\/p>/);
  assert.match(html, /href="https:\/\/client\.com\/\?a=1&amp;b=&quot;2&quot;"/);
  assert.doesNotMatch(replyPage({ heading: 'Thanks', text: 'ok', backUrl: null }), /Back to the site/);
});

test('toDashboardSubmission sends the dashboard a masked phone and no email or message', () => {
  const s: FormSubmission = {
    id: 7, onboardingId: 3, name: '', phone: '+15155550134', email: 'jane@example.com', message: 'secret', page: '/quote',
    utmSource: null, utmMedium: null, utmCampaign: null, isTest: false, connectPressedAt: '2026-07-15T17:01:00.000Z', createdAt: '2026-07-15T17:00:00.000Z',
  };
  const d = toDashboardSubmission(s);
  assert.deepEqual(d, { id: 7, at: '2026-07-15T17:00:00.000Z', name: 'Someone', phone: '(515) 555-01··', page: '/quote', calledBack: true });
  const json = JSON.stringify(d);
  assert.ok(!json.includes('5550134') && !json.includes('jane@') && !json.includes('secret'));
  assert.equal(toDashboardSubmission({ ...s, phone: null, connectPressedAt: null }).calledBack, false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Add the script to `package.json`, on the line after `test:phone`:

```json
    "test:leads": "tsx --test lib/leadShared.test.ts",
```

Run: `npx tsx --test lib/leadShared.test.ts`
Expected: FAIL, `Cannot find module './leadShared'`.

- [ ] **Step 3: Add the phone types the lead code needs**

In `lib/phoneShared.ts`, directly after the line `export type SmsStatus = 'pending' | 'ready';`, insert:

```ts

/** Which way a phone_calls row went: a caller dialing the tracked number, or call connect ringing the owner about a website lead. */
export type CallDirection = 'inbound' | 'connect';

/** phone_messages.kind. Slice 2 sends 'alert'; slices 3 and 5 send 'sequence', 'confirm' and 'reminder'. */
export type MessageKind = 'text_back' | 'manual' | 'inbound' | 'alert' | 'sequence' | 'confirm' | 'reminder';

/** Where most Axeon clients are. Quiet hours follow the line's own zone. */
export const DEFAULT_TIME_ZONE = 'America/Chicago';

/** The zones the admin card offers. IANA ids, so Intl handles daylight saving. */
export const US_TIME_ZONES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'America/New_York', label: 'Eastern' },
  { id: 'America/Chicago', label: 'Central' },
  { id: 'America/Denver', label: 'Mountain' },
  { id: 'America/Phoenix', label: 'Arizona (no daylight saving)' },
  { id: 'America/Los_Angeles', label: 'Pacific' },
  { id: 'America/Anchorage', label: 'Alaska' },
  { id: 'Pacific/Honolulu', label: 'Hawaii' },
];

export const isUsTimeZone = (v: unknown): v is string => typeof v === 'string' && US_TIME_ZONES.some((z) => z.id === v);
```

- [ ] **Step 4: Write the lead helpers**

```ts
// lib/leadShared.ts
// Website form leads (slice 2 of the PROOF lead system): what a client site's
// form sent, what happens next (an email to the client, a text to the owner,
// a call connect call), and the words the owner reads and hears. Client-safe:
// no Node imports, no database. The server half is lib/leads.ts.
import { TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { DEFAULT_TIME_ZONE, SMS_MAX_CHARS, formatPhone, maskNumber, normalizePhone, type SmsStatus } from '@/lib/phoneShared';

/** The hidden field the form snippet carries. People never fill it; form-filling bots do. */
export const HONEYPOT_FIELD = 'company_website';
export const LEAD_MESSAGE_MAX = 2000;
/** Quiet hours, client-local: no owner text and no call connect call from 8 pm to 8 am. */
export const QUIET_START_HOUR = 20;
export const QUIET_END_HOUR = 8;

export interface LeadInput {
  name: string;
  /** E.164, or null when none was left or it was not a US number. */
  phone: string | null;
  /** Lower-case, or null. */
  email: string | null;
  message: string;
  /** Path only ("/quote"), or "" when unknown. */
  page: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export type LeadValidation = { ok: true; lead: LeadInput } | { ok: false; reason: 'spam' } | { ok: false; reason: 'invalid'; error: string };

// The names client sites already use (Formspree templates, page builders), so switching a form is one attribute.
const ALIASES = {
  name: ['name', 'full_name', 'fullname', 'your_name'],
  phone: ['phone', 'tel', 'telephone', 'phone_number'],
  email: ['email', 'email_address', '_replyto'],
  message: ['message', 'details', 'comments', 'description'],
} as const;

const RESERVED = new Set<string>([
  'site', 'redirect', 'page', 'utm_source', 'utm_medium', 'utm_campaign', 'first_name', 'last_name', HONEYPOT_FIELD,
  ...ALIASES.name, ...ALIASES.phone, ...ALIASES.email, ...ALIASES.message,
]);
const MAX_EXTRA_FIELDS = 10;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** A form value as trimmed text with control characters turned into spaces. Multiline keeps single line breaks. */
function clean(v: unknown, max: number, multiline = false): string {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  const s = String(v).replace(/\r\n?/g, '\n');
  const out = multiline
    ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return out.trim().slice(0, max);
}

function firstOf(raw: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) if (clean(raw[k], 10)) return raw[k];
  return undefined;
}

/** "https://site.com/quote?x=1" or "quote" → "/quote". Anything unparseable → "". */
export function pagePath(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    return new URL(raw.trim(), 'https://page.invalid/').pathname.slice(0, 300);
  } catch {
    return '';
  }
}

/**
 * What a client site's form sent → a lead, spam, or a message for the visitor.
 * A phone that is not a US number is kept in the message as typed (the owner can
 * still read it) but never stored as the lead's phone, so it is never dialed.
 */
export function validateLeadInput(raw: Record<string, unknown>): LeadValidation {
  if (clean(raw[HONEYPOT_FIELD], 200)) return { ok: false, reason: 'spam' };
  const name = clean(firstOf(raw, ALIASES.name), 100) || clean(`${clean(raw.first_name, 50)} ${clean(raw.last_name, 50)}`, 100);
  const phoneTyped = clean(firstOf(raw, ALIASES.phone), 40);
  const phone = normalizePhone(phoneTyped);
  const emailTyped = clean(firstOf(raw, ALIASES.email), 254).toLowerCase();
  const email = EMAIL_RE.test(emailTyped) ? emailTyped : null;
  if (!phone && !email) {
    return {
      ok: false,
      reason: 'invalid',
      error: phoneTyped || emailTyped ? 'Please check your phone number or email.' : 'Please leave a phone number or email so we can reach you.',
    };
  }
  const lines = [clean(firstOf(raw, ALIASES.message), LEAD_MESSAGE_MAX, true)];
  if (phoneTyped && !phone) lines.push(`Phone as typed: ${phoneTyped}`);
  let extras = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (extras >= MAX_EXTRA_FIELDS || RESERVED.has(key) || key.startsWith('_')) continue;
    const v = clean(value, 300);
    const label = clean(key.replace(/[_-]+/g, ' '), 40);
    if (!v || !label) continue;
    lines.push(`${label}: ${v}`);
    extras += 1;
  }
  return {
    ok: true,
    lead: {
      name,
      phone,
      email,
      message: lines.filter(Boolean).join('\n').slice(0, LEAD_MESSAGE_MAX),
      page: pagePath(raw.page),
      utmSource: clean(raw.utm_source, 100) || null,
      utmMedium: clean(raw.utm_medium, 100) || null,
      utmCampaign: clean(raw.utm_campaign, 100) || null,
    },
  };
}

function hourIn(now: Date, timeZone: string): number {
  const read = (tz: string) =>
    Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).formatToParts(now).find((p) => p.type === 'hour')?.value);
  let h: number;
  try {
    h = read(timeZone);
  } catch {
    h = read(DEFAULT_TIME_ZONE); // an unknown zone must not stop a lead; Central is where most clients are
  }
  return h === 24 ? 0 : h;
}

/** 8 pm to 8 am on the client's clock. Never applied to the missed-call text-back. */
export function isQuietHours(now: Date, timeZone: string): boolean {
  const h = hourIn(now, timeZone);
  return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
}

export type SmsSkip = 'plan' | 'no_line' | 'sms_pending' | 'quiet_hours';
export type ConnectSkip = 'plan' | 'no_line' | 'off' | 'no_phone' | 'same_number' | 'quiet_hours';

/** The parts of a PhoneLine the decision needs. */
export interface LeadLineView {
  phoneNumber: string;
  forwardTo: string;
  smsStatus: SmsStatus;
  callConnectEnabled: boolean;
  timeZone: string;
}

export interface DeliveryPlan {
  text: 'send' | SmsSkip;
  connect: 'call' | ConnectSkip;
}

/** What a new lead should set off, decided before anything is sent. The email always goes; this decides the text and the call. */
export function planLeadDelivery(input: { tier: OnboardingTier; line: LeadLineView | null; leadPhone: string | null; now: Date }): DeliveryPlan {
  if ((TIER_RANK[input.tier] ?? 0) < TIER_RANK.axeoncore) return { text: 'plan', connect: 'plan' };
  const line = input.line;
  if (!line) return { text: 'no_line', connect: 'no_line' };
  const quiet = isQuietHours(input.now, line.timeZone);
  const text: DeliveryPlan['text'] = line.smsStatus !== 'ready' ? 'sms_pending' : quiet ? 'quiet_hours' : 'send';
  let connect: DeliveryPlan['connect'];
  if (!line.callConnectEnabled) connect = 'off';
  else if (!input.leadPhone) connect = 'no_phone';
  else if (input.leadPhone === line.forwardTo || input.leadPhone === line.phoneNumber) connect = 'same_number';
  else if (quiet) connect = 'quiet_hours';
  else connect = 'call';
  return { text, connect };
}

/** What actually happened to one lead; the admin's "Send test lead" shows it. */
export interface DeliveryReport {
  email: 'sent' | 'off' | 'failed';
  text: SmsSkip | 'sent' | 'opted_out' | 'bad_number' | 'failed';
  connect: ConnectSkip | 'started' | 'failed';
}

const EMAIL_WORDS: Record<DeliveryReport['email'], string> = {
  sent: 'sent',
  off: 'not configured (RESEND_API_KEY)',
  failed: 'failed, see the Vercel log',
};
const TEXT_WORDS: Record<DeliveryReport['text'], string> = {
  sent: 'sent',
  plan: 'not in this plan',
  no_line: 'no tracked number yet',
  sms_pending: 'waiting on 10DLC approval',
  quiet_hours: 'skipped, quiet hours (8 pm to 8 am)',
  opted_out: "skipped, the owner's cell texted STOP",
  bad_number: 'skipped, forward-to is not a US number',
  failed: 'failed, see the Vercel log',
};
const CONNECT_WORDS: Record<DeliveryReport['connect'], string> = {
  started: "calling the owner's cell now",
  plan: 'not in this plan',
  no_line: 'no tracked number yet',
  off: 'switched off',
  no_phone: 'the lead left no US phone number',
  same_number: "the lead's phone is the owner's own number",
  quiet_hours: 'skipped, quiet hours (8 pm to 8 am)',
  failed: 'failed, see the Vercel log',
};

export function describeDelivery(r: DeliveryReport): string {
  return `Email: ${EMAIL_WORDS[r.email]} · Text: ${TEXT_WORDS[r.text]} · Call connect: ${CONNECT_WORDS[r.connect]}`;
}

export function leadDisplayName(name: string): string {
  return name.trim() || 'Someone';
}

/** The owner's text: who, how to reach them, what they said, from which page. At most SMS_MAX_CHARS (two segments). */
export function leadAlertText(lead: { name: string; phone: string | null; email: string | null; message: string; page: string }): string {
  const who = [leadDisplayName(lead.name), lead.phone ? formatPhone(lead.phone) : null, lead.email].filter(Boolean).join(', ');
  const head = `New website lead: ${who}.`;
  const tail = lead.page ? ` Page: ${lead.page}` : '';
  const msg = lead.message.replace(/\s+/g, ' ').trim();
  const room = SMS_MAX_CHARS - head.length - tail.length - 3; // a space and two quotes
  const body = msg.length > room ? `${msg.slice(0, Math.max(0, room - 1)).trimEnd()}…` : msg;
  const quoted = msg && room > 10 ? ` "${body}"` : '';
  return `${head}${quoted}${tail}`.slice(0, SMS_MAX_CHARS);
}

/** The name as the voice should say it: letters, spaces, apostrophes and hyphens only, at most 40 characters. */
export function spokenName(name: string): string {
  const s = name.normalize('NFC').replace(/[^\p{L}\p{M}' -]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40).trim();
  return s || 'someone';
}

export function connectWhisperText(leadName: string): string {
  return `New lead from your website: ${spokenName(leadName)}. Press 1 to call them now.`;
}

/** A row id from a webhook query string (?lead=, ?line=): digits only, no leading zero, at most 15 digits. */
export function parseId(raw: string | null | undefined): number | null {
  if (!raw || !/^[1-9]\d{0,14}$/.test(raw)) return null;
  return Number(raw);
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

function httpUrl(raw: string | null): URL | null {
  if (!raw || raw === 'null') return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/**
 * Where to send the visitor after a plain HTML form post: the form's `redirect`
 * field, but only on the same site the post came from (Origin, else Referer;
 * www ignored). Anything else, or no way to tell the site, returns null and the
 * route shows its own thank-you page. Never an open redirect.
 */
export function safeRedirect(target: unknown, origin: string | null, referer: string | null): string | null {
  if (typeof target !== 'string' || !target.trim()) return null;
  const base = httpUrl(origin) ?? httpUrl(referer);
  if (!base) return null;
  let to: URL;
  try {
    to = new URL(target.trim(), base);
  } catch {
    return null;
  }
  if (to.protocol !== 'https:' && to.protocol !== 'http:') return null;
  if (bareHost(to.hostname) !== bareHost(base.hostname)) return null;
  return to.toString();
}

/** The page the visitor came from, for a "Back to the site" link; http(s) only. */
export function backLink(referer: string | null): string | null {
  return httpUrl(referer)?.toString() ?? null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The small page a plain form post lands on when there is no safe redirect. */
export function replyPage(input: { heading: string; text: string; backUrl: string | null }): string {
  const back = input.backUrl ? `<p><a href="${esc(input.backUrl)}">Back to the site</a></p>` : '';
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    `<title>${esc(input.heading)}</title><style>body{font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#0a0a0a;line-height:1.5}a{color:#2563eb}</style></head>` +
    `<body><h1>${esc(input.heading)}</h1><p>${esc(input.text)}</p>${back}</body></html>`
  );
}

/** A stored website form lead (lib/leads.ts). Dates are ISO strings. */
export interface FormSubmission extends LeadInput {
  id: number;
  onboardingId: number;
  /** Sent from the admin's "Send test lead"; never shown to the client. */
  isTest: boolean;
  /** When the owner pressed 1 on the call connect call. */
  connectPressedAt: string | null;
  createdAt: string;
}

/** What the client dashboard gets per form lead: pre-masked phone, no email, no message. */
export interface DashboardSubmission {
  id: number;
  at: string;
  name: string;
  /** Already masked by maskNumber. */
  phone: string | null;
  page: string;
  /** The owner pressed 1 and we dialed the lead. */
  calledBack: boolean;
}

export function toDashboardSubmission(s: FormSubmission): DashboardSubmission {
  return {
    id: s.id,
    at: s.createdAt,
    name: leadDisplayName(s.name),
    phone: s.phone ? maskNumber(s.phone) : null,
    page: s.page,
    calledBack: s.connectPressedAt !== null,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:leads`
Expected: PASS, no failures.

- [ ] **Step 6: Add the table and columns to both schema files**

In `lib/db.ts`, directly before the line `      // Business audits (lib/audits.ts): one dated snapshot of a business's Google`, insert:

```ts
      // Slice 2 (lib/leads.ts): client-site forms post to /api/lead and land here;
      // call screening, call connect and the client's time zone live on the line.
      await sql`
        CREATE TABLE IF NOT EXISTS form_submissions (
          id BIGSERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT '',
          phone TEXT,
          email TEXT,
          message TEXT NOT NULL DEFAULT '',
          page TEXT NOT NULL DEFAULT '',
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          ip_hash TEXT NOT NULL DEFAULT '',
          is_test BOOLEAN NOT NULL DEFAULT false,
          connect_call_sid TEXT,
          connect_pressed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS form_submissions_client_time_idx ON form_submissions (onboarding_id, created_at DESC);`;
      await sql`CREATE INDEX IF NOT EXISTS form_submissions_rate_idx ON form_submissions (onboarding_id, ip_hash, created_at DESC);`;
      await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS screen_calls BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS call_connect_enabled BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Chicago';`;
      await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'connect'));`;
      await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES form_submissions(id) ON DELETE SET NULL;`;
      await sql`ALTER TABLE phone_messages DROP CONSTRAINT IF EXISTS phone_messages_kind_check;`;
      await sql`ALTER TABLE phone_messages ADD CONSTRAINT phone_messages_kind_check CHECK (kind IN ('text_back', 'manual', 'inbound', 'alert', 'sequence', 'confirm', 'reminder'));`;
```

In `scripts/init-db.mjs`, directly before the line `  console.log('Schema ready.');`, insert the same statements at two-space indent:

```js
  // Slice 2 (lib/leads.ts): website forms, call screening, call connect, time zone.
  await sql`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      email TEXT,
      message TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT '',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_hash TEXT NOT NULL DEFAULT '',
      is_test BOOLEAN NOT NULL DEFAULT false,
      connect_call_sid TEXT,
      connect_pressed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS form_submissions_client_time_idx ON form_submissions (onboarding_id, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS form_submissions_rate_idx ON form_submissions (onboarding_id, ip_hash, created_at DESC);`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS screen_calls BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS call_connect_enabled BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Chicago';`;
  await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'connect'));`;
  await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES form_submissions(id) ON DELETE SET NULL;`;
  await sql`ALTER TABLE phone_messages DROP CONSTRAINT IF EXISTS phone_messages_kind_check;`;
  await sql`ALTER TABLE phone_messages ADD CONSTRAINT phone_messages_kind_check CHECK (kind IN ('text_back', 'manual', 'inbound', 'alert', 'sequence', 'confirm', 'reminder'));`;
```

Why the name `phone_messages_kind_check`: slice 1 declared the check inline on the column, and Postgres names an inline column check `<table>_<column>_check`. The `form_submissions` block comes before `lead_id` because the foreign key needs the table.

- [ ] **Step 7: Test the time zone list**

In `lib/phoneShared.test.ts`, replace the import block at the top with:

```ts
import {
  areaCodeOf, callOutcome, callResultLabel, callerKey, callerLabel, DEFAULT_TIME_ZONE, formatCallLength, formatCallWhen,
  formatPhone, isStartWord, isStopWord, isUsTimeZone, maskNumber, normalizePhone, textBackMessage, TEXT_BACK_DEFAULT, toDashboardCall, US_TIME_ZONES,
} from './phoneShared';
```

and append:

```ts
test('isUsTimeZone accepts the seven US zones the admin can pick and nothing else', () => {
  assert.equal(US_TIME_ZONES.length, 7);
  for (const z of US_TIME_ZONES) assert.equal(isUsTimeZone(z.id), true, z.id);
  assert.equal(isUsTimeZone(DEFAULT_TIME_ZONE), true);
  for (const bad of ['Europe/London', 'CST', '', null, 5]) assert.equal(isUsTimeZone(bad), false, String(bad));
});
```

Run: `npm run test:phone && npm run test:leads`
Expected: PASS, no failures.

- [ ] **Step 8: Type-check**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add lib/leadShared.ts lib/leadShared.test.ts lib/phoneShared.ts lib/phoneShared.test.ts lib/db.ts scripts/init-db.mjs package.json
git commit -m "feat(leads): lead helpers, quiet hours, and the slice 2 tables" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Outbound calls, the screening and call connect TwiML, signed query URLs

**Files:**
- Modify: `lib/twilio.ts` (add `createCall`)
- Modify: `lib/twilio.test.ts`
- Modify: `lib/phoneTwiml.ts` (new builders; `forwardTwiml` gains `screenUrl`)
- Modify: `lib/phoneTwiml.test.ts`
- Modify: `lib/phoneWebhook.ts` (`withQuery` option)
- Modify: `lib/phoneWebhook.test.ts`

**Interfaces:**
- Consumes: `connectWhisperText` (Task 1); `call`, `sid`, `API` (private to lib/twilio.ts); `formParams`, `verifyTwilioSignature`, `webhookUrl`, `twilioSignature` (slice 1).
- Produces:
  - `createCall(input: { from: string; to: string; url: string; statusCallback: string }): Promise<{ sid: string }>`
  - `forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string; screenUrl?: string }): string`
  - `hangupTwiml(): string`
  - `screenTwiml(input: { businessName: string | null; acceptUrl: string }): string`
  - `acceptTwiml(): string`
  - `connectWhisperTwiml(input: { leadName: string; gatherUrl: string; textedDetails: boolean }): string`
  - `connectNoAnswerTwiml(input: { textedDetails: boolean }): string`
  - `connectDialTwiml(input: { leadPhone: string; callerId: string; statusUrl: string; recordingUrl: string | null; noticeUrl: string | null }): string`
  - `recordingNoticeTwiml(): string`
  - `readTwilioRequest(req: Request, path: string, opts?: { withQuery?: boolean }): Promise<TwilioRead>`

Design note on the query string: Twilio computes `X-Twilio-Signature` over the exact URL it requested, query included, then the sorted POST params. Slice 1's reader signs `webhookUrl(path)`, which has no query, so a request to `/api/phone/connect?lead=42` would always fail. With `withQuery: true` the reader appends `new URL(req.url).search` exactly as sent (never rebuilt from parsed params, so encoding cannot drift). The `path` argument stays a constant in each route, so a signed request for one route cannot be replayed at another.

- [ ] **Step 1: Write the failing tests**

In `lib/twilio.test.ts`, change the import line to:

```ts
import { createCall, fetchRecording, formParams, redactPath, searchLocalNumbers, twilioSignature, verifyTwilioSignature, webhookUrl } from './twilio';
```

and append (this file shadows the global `URL` with a constant, so the test compares strings and never calls `new URL`):

```ts
test('createCall posts From, To, the TwiML URL and the status callback to the Calls endpoint, ringing 20 seconds', async () => {
  const saved = { fetch: globalThis.fetch, sid: process.env.TWILIO_ACCOUNT_SID, tok: process.env.TWILIO_AUTH_TOKEN };
  process.env.TWILIO_ACCOUNT_SID = 'ACtestsid0123456789';
  process.env.TWILIO_AUTH_TOKEN = 'tok';
  const seen: Array<{ url: string; method: string | undefined; body: URLSearchParams }> = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    seen.push({ url: String(input), method: init?.method, body: new URLSearchParams(String(init?.body ?? '')) });
    return new Response(JSON.stringify({ sid: 'CAnew' }), { status: 201, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  try {
    const r = await createCall({
      from: '+15155550199',
      to: '+15155550100',
      url: 'https://axeonstudio.co/api/phone/connect?lead=42',
      statusCallback: 'https://axeonstudio.co/api/phone/connect/status?lead=42',
    });
    assert.deepEqual(r, { sid: 'CAnew' });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, 'https://api.twilio.com/2010-04-01/Accounts/ACtestsid0123456789/Calls.json');
    assert.equal(seen[0].method, 'POST');
    const b = seen[0].body;
    assert.equal(b.get('From'), '+15155550199');
    assert.equal(b.get('To'), '+15155550100');
    assert.equal(b.get('Url'), 'https://axeonstudio.co/api/phone/connect?lead=42');
    assert.equal(b.get('Method'), 'POST');
    assert.equal(b.get('StatusCallback'), 'https://axeonstudio.co/api/phone/connect/status?lead=42');
    assert.equal(b.get('StatusCallbackMethod'), 'POST');
    assert.equal(b.get('Timeout'), '20');
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.sid === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = saved.sid;
    if (saved.tok === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = saved.tok;
  }
});
```

In `lib/phoneTwiml.test.ts`, change the import line to:

```ts
import {
  acceptTwiml, afterDialTwiml, connectDialTwiml, connectNoAnswerTwiml, connectWhisperTwiml, emptyTwiml, escapeXml, forwardTwiml,
  hangupTwiml, recordingNoticeTwiml, screenTwiml,
} from './phoneTwiml';
```

and append:

```ts
const XML = '<?xml version="1.0" encoding="UTF-8"?>';

test('forwardTwiml wraps the forward number in a screened <Number> when screenUrl is set', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: false, recordCalls: false, statusUrl: 'https://x.co/s', recordingUrl: 'https://x.co/r', screenUrl: 'https://x.co/api/phone/voice/screen?line=7' });
  assert.equal(xml, `${XML}<Response><Dial action="https://x.co/s" method="POST" timeout="20"><Number url="https://x.co/api/phone/voice/screen?line=7" method="POST">+15155550134</Number></Dial></Response>`);
});

test('screenTwiml asks for 1 with the business name and hangs up when nobody presses', () => {
  assert.equal(
    screenTwiml({ businessName: 'Medina Concrete', acceptUrl: 'https://x.co/a' }),
    `${XML}<Response><Gather numDigits="1" timeout="5" action="https://x.co/a" method="POST"><Say voice="Polly.Joanna">Call for Medina Concrete. Press 1 to accept.</Say></Gather><Hangup/></Response>`,
  );
  assert.match(screenTwiml({ businessName: '  ', acceptUrl: 'https://x.co/a' }), /<Say voice="Polly\.Joanna">Call from your tracking number\. Press 1 to accept\.<\/Say>/);
  assert.match(screenTwiml({ businessName: "Tom & Jerry's <Shop>", acceptUrl: 'https://x.co/a' }), /Call for Tom &amp; Jerry&apos;s &lt;Shop&gt;\. Press 1/);
});

test('acceptTwiml is an empty document (Twilio bridges) and hangupTwiml hangs up', () => {
  assert.equal(acceptTwiml(), `${XML}<Response></Response>`);
  assert.equal(hangupTwiml(), `${XML}<Response><Hangup/></Response>`);
});

test('connectWhisperTwiml says the lead name safely inside a Gather and falls through to where the details went', () => {
  assert.equal(
    connectWhisperTwiml({ leadName: 'Jane <b>&</b>', gatherUrl: 'https://x.co/api/phone/connect?lead=42', textedDetails: true }),
    `${XML}<Response><Gather numDigits="1" timeout="8" action="https://x.co/api/phone/connect?lead=42" method="POST"><Say voice="Polly.Joanna">New lead from your website: Jane b b. Press 1 to call them now.</Say></Gather><Say voice="Polly.Joanna">Okay. We texted you their details.</Say><Hangup/></Response>`,
  );
  assert.match(connectWhisperTwiml({ leadName: '', gatherUrl: 'https://x.co/c', textedDetails: false }), /your website: someone\. Press 1.*We emailed you their details\./);
});

test('connectNoAnswerTwiml says where the details went and hangs up', () => {
  assert.equal(connectNoAnswerTwiml({ textedDetails: true }), `${XML}<Response><Say voice="Polly.Joanna">Okay. We texted you their details.</Say><Hangup/></Response>`);
  assert.equal(connectNoAnswerTwiml({ textedDetails: false }), `${XML}<Response><Say voice="Polly.Joanna">Okay. We emailed you their details.</Say><Hangup/></Response>`);
});

test('connectDialTwiml dials the lead from the tracked number, recorded with the notice to the lead, or plain', () => {
  assert.equal(
    connectDialTwiml({ leadPhone: '+15155550134', callerId: '+15155550199', statusUrl: 'https://x.co/st?lead=42', recordingUrl: 'https://x.co/r', noticeUrl: 'https://x.co/n' }),
    `${XML}<Response><Dial callerId="+15155550199" action="https://x.co/st?lead=42" method="POST" timeout="25" record="record-from-answer-dual" recordingStatusCallback="https://x.co/r" recordingStatusCallbackMethod="POST"><Number url="https://x.co/n" method="POST">+15155550134</Number></Dial></Response>`,
  );
  assert.equal(
    connectDialTwiml({ leadPhone: '+15155550134', callerId: '+15155550199', statusUrl: 'https://x.co/st?lead=42', recordingUrl: null, noticeUrl: null }),
    `${XML}<Response><Dial callerId="+15155550199" action="https://x.co/st?lead=42" method="POST" timeout="25"><Number>+15155550134</Number></Dial></Response>`,
  );
});

test('recordingNoticeTwiml plays the notice and ends, so the lead is bridged after it', () => {
  assert.equal(recordingNoticeTwiml(), `${XML}<Response><Say voice="Polly.Joanna">This call may be recorded for quality.</Say></Response>`);
});
```

In `lib/phoneWebhook.test.ts`, append (it reuses the file's `TOKEN` and `statusOf`):

```ts
test('readTwilioRequest with withQuery checks the signature over the URL including its query', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  const path = '/api/phone/connect';
  const params = { CallSid: 'CA9', From: '+15155550199', To: '+15155550100' };
  const sig = twilioSignature(`https://axeonstudio.co${path}?lead=42`, params, TOKEN);
  const req = (query: string) =>
    new Request(`https://axeonstudio.co${path}${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig },
      body: new URLSearchParams(params).toString(),
    });
  assert.deepEqual(await readTwilioRequest(req('?lead=42'), path, { withQuery: true }), { ok: true, params });
  // The same signed body replayed against another lead id is refused.
  assert.equal(await statusOf(readTwilioRequest(req('?lead=43'), path, { withQuery: true })), 403);
  // Checked without its query, the URL is not the one Twilio signed.
  assert.equal(await statusOf(readTwilioRequest(req('?lead=42'), path)), 403);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:phone`
Expected: FAIL: `createCall` is not exported, the new TwiML builders are not exported, and the `withQuery` test returns 403 for `?lead=42`.

- [ ] **Step 3: Add createCall**

In `lib/twilio.ts`, directly after the `sendSms` function, insert:

```ts
/**
 * An outbound call from a client's tracked number (call connect). Twilio fetches
 * `url` for TwiML when the callee answers and posts the final status to
 * `statusCallback`. Rings 20 seconds, short of most carriers' voicemail pickup.
 */
export async function createCall(input: { from: string; to: string; url: string; statusCallback: string }): Promise<{ sid: string }> {
  const r = await call<{ sid: string }>(`${API}/Accounts/${sid()}/Calls.json`, {
    method: 'POST',
    form: {
      From: input.from,
      To: input.to,
      Url: input.url,
      Method: 'POST',
      StatusCallback: input.statusCallback,
      StatusCallbackMethod: 'POST',
      Timeout: '20',
    },
  });
  return { sid: r.sid };
}
```

- [ ] **Step 4: Add the TwiML builders**

In `lib/phoneTwiml.ts`, replace the header comment (the first three lines) with:

```ts
// The TwiML documents the phone webhooks answer with. Strings, not a library:
// every attribute is tested. Client-safe by accident (no Node imports), but only
// the routes use it.
import { connectWhisperText } from '@/lib/leadShared';
```

Replace the whole `forwardTwiml` function with:

```ts
/**
 * Inbound call: optional recording notice, then ring the client's phone. Caller ID stays the caller's, so the
 * client sees who it is. With screenUrl (call screening), the owner's leg first runs that TwiML: press 1 to accept.
 */
export function forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string; screenUrl?: string }): string {
  // The notice only makes sense when the call is actually recorded (R12).
  const say = input.consentNotice && input.recordCalls ? `<Say voice="${VOICE}">This call may be recorded for quality.</Say>` : '';
  const record = input.recordCalls
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  const target = input.screenUrl
    ? `<Number url="${escapeXml(input.screenUrl)}" method="POST">${escapeXml(input.forwardTo)}</Number>`
    : escapeXml(input.forwardTo);
  return `${HEAD}<Response>${say}<Dial action="${escapeXml(input.statusUrl)}" method="POST" timeout="20"${record}>${target}</Dial></Response>`;
}
```

Append at the end of the file:

```ts
export function hangupTwiml(): string {
  return `${HEAD}<Response><Hangup/></Response>`;
}

/**
 * Call screening, on the owner's leg of a forwarded call. A person presses 1 and
 * the Gather action bridges; voicemail never does, so the leg hangs up and the
 * parent <Dial> reports no-answer: a real missed call, and the text-back fires.
 */
export function screenTwiml(input: { businessName: string | null; acceptUrl: string }): string {
  const name = input.businessName?.trim();
  const who = name ? `Call for ${name}.` : 'Call from your tracking number.';
  return `${HEAD}<Response><Gather numDigits="1" timeout="5" action="${escapeXml(input.acceptUrl)}" method="POST"><Say voice="${VOICE}">${escapeXml(who)} Press 1 to accept.</Say></Gather><Hangup/></Response>`;
}

/** The screen's Gather action after a 1: an empty document ends the whisper and Twilio bridges the call. */
export function acceptTwiml(): string {
  return emptyTwiml();
}

const detailsSay = (textedDetails: boolean) => `<Say voice="${VOICE}">Okay. We ${textedDetails ? 'texted' : 'emailed'} you their details.</Say>`;

/** Call connect, when the owner picks up: the lead's name, press 1. No key in 8 seconds: where the details went, then hang up. */
export function connectWhisperTwiml(input: { leadName: string; gatherUrl: string; textedDetails: boolean }): string {
  return `${HEAD}<Response><Gather numDigits="1" timeout="8" action="${escapeXml(input.gatherUrl)}" method="POST"><Say voice="${VOICE}">${escapeXml(connectWhisperText(input.leadName))}</Say></Gather>${detailsSay(input.textedDetails)}<Hangup/></Response>`;
}

/** Call connect, the owner pressed something other than 1. */
export function connectNoAnswerTwiml(input: { textedDetails: boolean }): string {
  return `${HEAD}<Response>${detailsSay(input.textedDetails)}<Hangup/></Response>`;
}

/**
 * Call connect, the owner pressed 1: dial the lead from the tracked number, so
 * the lead sees the business calling. noticeUrl plays the recording notice to
 * the lead when they pick up; null recordingUrl means the call is not recorded.
 */
export function connectDialTwiml(input: { leadPhone: string; callerId: string; statusUrl: string; recordingUrl: string | null; noticeUrl: string | null }): string {
  const record = input.recordingUrl
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  const number = input.noticeUrl
    ? `<Number url="${escapeXml(input.noticeUrl)}" method="POST">${escapeXml(input.leadPhone)}</Number>`
    : `<Number>${escapeXml(input.leadPhone)}</Number>`;
  return `${HEAD}<Response><Dial callerId="${escapeXml(input.callerId)}" action="${escapeXml(input.statusUrl)}" method="POST" timeout="25"${record}>${number}</Dial></Response>`;
}

/** Played to the lead's leg of a recorded call connect call; when it ends, Twilio bridges. */
export function recordingNoticeTwiml(): string {
  return `${HEAD}<Response><Say voice="${VOICE}">This call may be recorded for quality.</Say></Response>`;
}
```

- [ ] **Step 5: Let the request reader sign the query**

Replace the whole of `lib/phoneWebhook.ts` with:

```ts
// lib/phoneWebhook.ts
// What every /api/phone route does first: read the form body, prove it came
// from Twilio, hand back the params. Signature is computed over the public URL
// (webhookUrl), not req.url, because Vercel rewrites the host internally.
// Routes whose URL carries an id (?lead=, ?line=) pass withQuery: Twilio signs
// the URL it requested, query included, so the query is appended exactly as sent.
import { formParams, verifyTwilioSignature, webhookUrl } from '@/lib/twilio';

const MAX_BODY = 65536;

export type TwilioRead = { ok: true; params: Record<string, string> } | { ok: false; response: Response };

export async function readTwilioRequest(req: Request, path: string, opts: { withQuery?: boolean } = {}): Promise<TwilioRead> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY) return { ok: false, response: new Response(null, { status: 413 }) };
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) return { ok: false, response: new Response(null, { status: 413 }) };
  const params = formParams(text);
  const signedPath = opts.withQuery ? `${path}${new URL(req.url).search}` : path;
  if (!verifyTwilioSignature(webhookUrl(signedPath), params, req.headers.get('x-twilio-signature'))) return { ok: false, response: new Response(null, { status: 403 }) };
  return { ok: true, params };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:phone`
Expected: PASS, no failures (the slice 1 `forwardTwiml` tests still pass: without `screenUrl` the output is byte-identical).

- [ ] **Step 7: Type-check**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add lib/twilio.ts lib/twilio.test.ts lib/phoneTwiml.ts lib/phoneTwiml.test.ts lib/phoneWebhook.ts lib/phoneWebhook.test.ts
git commit -m "feat(phone): outbound calls, screening and call connect TwiML, signed query URLs" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Line settings, owner alerts and call connect calls in the phone module

**Files:**
- Modify: `lib/phoneShared.ts` (`PhoneLineSettings` gains three fields)
- Modify: `lib/phoneLines.ts`
- Modify: `lib/phoneLines.test.ts`

**Interfaces:**
- Consumes: `CallDirection`, `MessageKind`, `DEFAULT_TIME_ZONE`, `isUsTimeZone` (Task 1); `createCall` (Task 2); slice 1's `sendClientSms`, `recordCall`, `webhookUrl`.
- Produces:
  - `PhoneLineSettings` (and so `PhoneLine`) gains `screenCalls: boolean; callConnectEnabled: boolean; timeZone: string`.
  - `validateLineSettings(raw: Record<string, unknown>, phoneNumber: string | null): PhoneLineSettings` (time zone checked, toggles default on).
  - `updateLineSettings(onboardingId: number, s: PhoneLineSettings): Promise<PhoneLine>` (writes the three new columns).
  - `getLineById(id: number): Promise<PhoneLine | null>`
  - `recordCall(onboardingId: number, c: { callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; durationSeconds: number | null; direction?: CallDirection; leadId?: number | null }): Promise<void>`
  - `recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: MessageKind; status: string }): Promise<void>`
  - `sendClientSms(line: PhoneLine, to: string, body: string, kind: Exclude<MessageKind, 'inbound'>): Promise<ClientSmsResult>`
  - `sendOwnerAlert(line: PhoneLine, body: string): Promise<ClientSmsResult>`
  - `startConnectCall(line: PhoneLine, lead: { id: number; phone: string }): Promise<{ sid: string }>`
  - `markConnectEnded(callSid: string, callStatus: string): Promise<void>`
  - `callsSummary` and `recentCalls` count `direction = 'inbound'` only.

- [ ] **Step 1: Write the failing tests**

In `lib/phoneLines.test.ts`, the first test's expected object grows by the three defaults. Replace:

```ts
  assert.deepEqual(s, { forwardTo: '+15155550134', recordCalls: true, consentNotice: false, textBackEnabled: true, textBackMessage: 'We missed you!' });
```

with:

```ts
  assert.deepEqual(s, {
    forwardTo: '+15155550134', recordCalls: true, consentNotice: false, textBackEnabled: true, textBackMessage: 'We missed you!',
    screenCalls: true, callConnectEnabled: true, timeZone: 'America/Chicago',
  });
```

and append:

```ts
test('validateLineSettings keeps the call screening, call connect and time zone choices', () => {
  const s = validateLineSettings({ forwardTo: '+15155550134', screenCalls: false, callConnectEnabled: 'false', timeZone: 'America/Denver' }, null);
  assert.equal(s.screenCalls, false);
  assert.equal(s.callConnectEnabled, false);
  assert.equal(s.timeZone, 'America/Denver');
});

test('validateLineSettings defaults the time zone to Central and refuses one outside the US list', () => {
  assert.equal(validateLineSettings({ forwardTo: '+15155550134' }, null).timeZone, 'America/Chicago');
  assert.equal(validateLineSettings({ forwardTo: '+15155550134', timeZone: '' }, null).timeZone, 'America/Chicago');
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', timeZone: 'Europe/London' }, null), /US time zone/);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', timeZone: 'CST' }, null), /US time zone/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test lib/phoneLines.test.ts`
Expected: FAIL: the deepEqual is missing `screenCalls`, `callConnectEnabled`, `timeZone`, and `Europe/London` does not throw.

- [ ] **Step 3: Grow the settings type**

In `lib/phoneShared.ts`, inside `PhoneLineSettings`, replace:

```ts
  /** Null = use TEXT_BACK_DEFAULT with the business name. */
  textBackMessage: string | null;
}
```

with:

```ts
  /** Null = use TEXT_BACK_DEFAULT with the business name. */
  textBackMessage: string | null;
  /** Call screening: the owner presses 1 to accept, so voicemail counts as missed. */
  screenCalls: boolean;
  /** Call connect: ring the owner and bridge to a new website lead on 1. */
  callConnectEnabled: boolean;
  /** IANA zone from US_TIME_ZONES; quiet hours follow it. */
  timeZone: string;
}
```

- [ ] **Step 4: Update the phone module**

All edits are in `lib/phoneLines.ts`.

(a) Imports. Replace the `@/lib/twilio` import line with:

```ts
import { attachNumberToService, buyNumber, createCall, createMessagingService, isTwilioConfigured, releaseNumber, searchLocalNumbers, sendSms, webhookUrl } from '@/lib/twilio';
```

and the `@/lib/phoneShared` import line with:

```ts
import {
  callerKey, DEFAULT_TIME_ZONE, isUsTimeZone, normalizePhone, textBackMessage, SMS_MAX_CHARS,
  type CallDirection, type CallOutcome, type CallsSummary, type MessageKind, type PhoneCall, type PhoneLine, type PhoneLineSettings, type SmsStatus,
} from '@/lib/phoneShared';
```

(b) `LineRow`. Replace:

```ts
  sms_status: SmsStatus;
  status: 'active' | 'released';
```

with:

```ts
  sms_status: SmsStatus;
  screen_calls: boolean;
  call_connect_enabled: boolean;
  time_zone: string;
  status: 'active' | 'released';
```

(c) `toLine`. Replace:

```ts
  smsStatus: r.sms_status,
  status: r.status,
```

with:

```ts
  smsStatus: r.sms_status,
  screenCalls: r.screen_calls,
  callConnectEnabled: r.call_connect_enabled,
  timeZone: r.time_zone,
  status: r.status,
```

(d) `validateLineSettings`. Replace its `return { … };` block:

```ts
  return {
    forwardTo,
    recordCalls: bool(raw.recordCalls, true),
    consentNotice: bool(raw.consentNotice, true),
    textBackEnabled: bool(raw.textBackEnabled, true),
    textBackMessage: msg || null,
  };
```

with:

```ts
  const timeZone = raw.timeZone === undefined || raw.timeZone === null || raw.timeZone === '' ? DEFAULT_TIME_ZONE : raw.timeZone;
  if (!isUsTimeZone(timeZone)) throw new Error('Pick a US time zone from the list');
  return {
    forwardTo,
    recordCalls: bool(raw.recordCalls, true),
    consentNotice: bool(raw.consentNotice, true),
    textBackEnabled: bool(raw.textBackEnabled, true),
    textBackMessage: msg || null,
    screenCalls: bool(raw.screenCalls, true),
    callConnectEnabled: bool(raw.callConnectEnabled, true),
    timeZone,
  };
```

(e) `getLineById`. Directly after the `lineForNumber` function (whose body ends `return rows[0] ? toLine(rows[0]) : null;` then `}`), insert:

```ts

/** The screen route's lookup: the line id rides in the signed screen URL. */
export async function getLineById(id: number): Promise<PhoneLine | null> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`SELECT * FROM phone_lines WHERE id = ${id} AND status = 'active' LIMIT 1;`;
  return rows[0] ? toLine(rows[0]) : null;
}
```

(f) `updateLineSettings`. Replace:

```ts
        text_back_enabled = ${s.textBackEnabled}, text_back_message = ${s.textBackMessage}, updated_at = now()
```

with:

```ts
        text_back_enabled = ${s.textBackEnabled}, text_back_message = ${s.textBackMessage},
        screen_calls = ${s.screenCalls}, call_connect_enabled = ${s.callConnectEnabled}, time_zone = ${s.timeZone}, updated_at = now()
```

(g) `recordCall`. Replace the whole function with:

```ts
/**
 * Twilio retries webhooks, so the same CallSid can arrive twice: an upsert keeps one row.
 * Call connect rows (direction 'connect') are inserted when the call starts and updated
 * by the connect webhooks; direction and lead_id are set on insert and never changed.
 */
export async function recordCall(
  onboardingId: number,
  c: { callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; durationSeconds: number | null; direction?: CallDirection; leadId?: number | null },
): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO phone_calls (onboarding_id, call_sid, from_number, to_number, outcome, dial_status, duration_seconds, direction, lead_id)
    VALUES (${onboardingId}, ${c.callSid}, ${c.fromNumber}, ${c.toNumber}, ${c.outcome}, ${c.dialStatus}, ${c.durationSeconds}, ${c.direction ?? 'inbound'}, ${c.leadId ?? null})
    ON CONFLICT (call_sid) DO UPDATE SET
      -- A retried or late webhook must never turn an answered call back into a missed one.
      outcome = CASE WHEN phone_calls.outcome = 'answered' THEN 'answered' ELSE EXCLUDED.outcome END,
      dial_status = CASE WHEN phone_calls.outcome = 'answered' THEN phone_calls.dial_status ELSE EXCLUDED.dial_status END,
      duration_seconds = COALESCE(EXCLUDED.duration_seconds, phone_calls.duration_seconds);
  `;
}
```

(h) `recordMessage`. Replace its signature line:

```ts
export async function recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: 'text_back' | 'manual' | 'inbound'; status: string }): Promise<void> {
```

with:

```ts
export async function recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: MessageKind; status: string }): Promise<void> {
```

(i) `sendClientSms`. Replace its signature line:

```ts
export async function sendClientSms(line: PhoneLine, to: string, body: string, kind: 'text_back' | 'manual'): Promise<ClientSmsResult> {
```

with:

```ts
export async function sendClientSms(line: PhoneLine, to: string, body: string, kind: Exclude<MessageKind, 'inbound'>): Promise<ClientSmsResult> {
```

(j) New functions. Directly before the line `/** Month is YYYY-MM in America/Chicago, the same key the reports use (monthOf in lib/siteStats.ts). */`, insert:

```ts
/**
 * A new-lead text to the owner's own cell, through their line. Same gates as
 * every automated text (10DLC ready, not opted out, US number) because it goes
 * through sendClientSms. Quiet hours are the caller's job (planLeadDelivery).
 */
export async function sendOwnerAlert(line: PhoneLine, body: string): Promise<ClientSmsResult> {
  return sendClientSms(line, line.forwardTo, body, 'alert');
}

/**
 * Call connect: ring the owner's cell from their tracked number. When they pick
 * up, Twilio fetches /api/phone/connect?lead=<id> (the lead's name, press 1).
 * The call row is written here, so the webhooks only ever update it. Its
 * from_number is the lead's phone: that is the contact the call is about.
 */
export async function startConnectCall(line: PhoneLine, lead: { id: number; phone: string }): Promise<{ sid: string }> {
  const leadPhone = normalizePhone(lead.phone);
  if (!leadPhone) throw new Error('Call connect needs a US phone number for the lead');
  const { sid } = await createCall({
    from: line.phoneNumber,
    to: line.forwardTo,
    url: webhookUrl(`/api/phone/connect?lead=${lead.id}`),
    statusCallback: webhookUrl(`/api/phone/connect/status?lead=${lead.id}`),
  });
  try {
    await recordCall(line.onboardingId, { callSid: sid, fromNumber: leadPhone, toNumber: line.phoneNumber, outcome: 'missed', dialStatus: 'queued', durationSeconds: null, direction: 'connect', leadId: lead.id });
  } catch (err) {
    // The call is already ringing; the connect webhooks upsert the row if this write was lost.
    console.error('phone: connect row not recorded', sid, err);
  }
  return { sid };
}

/**
 * The owner's leg of a call connect call ended (Twilio's call status callback).
 * Only a call that never reached the lead (dial_status still 'queued') takes the
 * owner's status, so a lead's "no-answer" from the dial is never overwritten.
 */
export async function markConnectEnded(callSid: string, callStatus: string): Promise<void> {
  await ensureSchema();
  const status = `owner-${callStatus.toLowerCase().replace(/[^a-z-]/g, '').slice(0, 20) || 'unknown'}`;
  await sql`UPDATE phone_calls SET dial_status = ${status} WHERE call_sid = ${callSid} AND direction = 'connect' AND dial_status = 'queued';`;
}

```

(k) `callsSummary` counts people who called in. Replace:

```ts
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId}
      AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
```

with:

```ts
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND direction = 'inbound' -- call connect calls are the owner calling out
      AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
```

(l) `recentCalls` likewise. Replace:

```ts
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId}
    ORDER BY started_at DESC
```

with:

```ts
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND direction = 'inbound'
    ORDER BY started_at DESC
```

`monthCost` is left as is: it estimates Twilio usage, and call connect minutes are usage.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:phone && npm run test:leads`
Expected: PASS, no failures.

- [ ] **Step 6: Type-check**

Run: `npm run lint`
Expected: clean. (`PhonePanel` still sends the old PUT body; the new toggles default on and the zone defaults to Central until Task 6 sends them.)

- [ ] **Step 7: Commit**

```bash
git add lib/phoneShared.ts lib/phoneLines.ts lib/phoneLines.test.ts
git commit -m "feat(phone): screening, call connect and time zone settings; owner alerts and connect calls" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Lead storage, delivery, and the client's lead email

**Files:**
- Create: `lib/leads.ts`
- Test: `lib/leads.test.ts`
- Test: `lib/leadEmail.test.ts`
- Modify: `lib/email.ts` (`clientLayout` footer parameter; `renderClientLeadAlert`, `sendClientLeadAlert`)
- Modify: `lib/emailLogShared.ts` (category `leads`, kind `client_lead_alert`)
- Modify: `package.json` (`test:leads` runs the two new test files)

**Interfaces:**
- Consumes: `LeadInput`, `FormSubmission`, `DeliveryReport`, `planLeadDelivery`, `leadAlertText` (Task 1); `getLine`, `sendOwnerAlert`, `startConnectCall` (Task 3); `normalizePhone`, `formatPhone` (slice 1); `REPORT_TIME_ZONE`, `isValidMonth` (lib/siteStats.ts); `APP_ORIGIN` (lib/hostRouting.ts); `type Onboarding` (lib/onboarding.ts); `getClient`, `sendChecked`, `clientLayout`, `button`, `escapeHtml`, `CLIENT_FROM_ADDRESS`, `CLIENT_REPLY_TO` (private to lib/email.ts).
- Produces (lib/email.ts):
  - `interface ClientLeadAlertInput { businessName: string | null; lead: { name: string; phone: string | null; email: string | null; message: string; page: string }; proofUrl: string; test: boolean }`
  - `renderClientLeadAlert(input: ClientLeadAlertInput): { subject: string; html: string }`
  - `sendClientLeadAlert(input: ClientLeadAlertInput & { to: string }): Promise<boolean>` (false when Resend is not configured; throws when Resend rejects)
- Produces (lib/leads.ts):
  - `LEAD_RATE_LIMIT = 5`, `LEAD_RATE_WINDOW_MINUTES = 10`
  - `type LeadOwner = Pick<Onboarding, 'id' | 'tier' | 'businessName' | 'clientEmail'>`
  - `leadIpHash(ip: string, secret: string): string`
  - `recordFormSubmission(onboardingId: number, input: LeadInput, meta: { ipHash: string; isTest?: boolean }): Promise<FormSubmission>`
  - `recentSubmissionCount(onboardingId: number, ipHash: string, minutes: number): Promise<number>`
  - `getSubmission(onboardingId: number, id: number): Promise<FormSubmission | null>`
  - `listSubmissions(onboardingId: number, month: string, limit?: number): Promise<FormSubmission[]>`
  - `markConnectPressed(onboardingId: number, leadId: number, callSid: string): Promise<void>`
  - `deliverLead(owner: LeadOwner, lead: FormSubmission, opts?: { now?: Date; test?: boolean }): Promise<DeliveryReport>`
  - `sendTestLead(owner: LeadOwner, phoneRaw: unknown): Promise<DeliveryReport>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/leads.test.ts
// Run with: npm run test:leads. Only the pure parts; the SQL is reviewed, not unit-tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leadIpHash, LEAD_RATE_LIMIT, LEAD_RATE_WINDOW_MINUTES } from './leads';

test('leadIpHash is stable, keyed by the secret, and 32 hex characters', () => {
  const a = leadIpHash('203.0.113.7', 'salt');
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(a, leadIpHash('203.0.113.7', 'salt'));
  assert.notEqual(a, leadIpHash('203.0.113.8', 'salt'));
  assert.notEqual(a, leadIpHash('203.0.113.7', 'other'));
  assert.match(leadIpHash('203.0.113.7', ''), /^[0-9a-f]{32}$/); // no secret configured still hashes
});

test('the rate limit is the spec: 5 submissions per IP per 10 minutes per site', () => {
  assert.equal(LEAD_RATE_LIMIT, 5);
  assert.equal(LEAD_RATE_WINDOW_MINUTES, 10);
});
```

```ts
// lib/leadEmail.test.ts
// Run with: npm run test:leads. Renders the client's lead email; nothing is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderClientLeadAlert } from './email';

const lead = {
  name: 'Jane <script>alert(1)</script>\r\nBcc: x@y.z',
  phone: '+15155550134',
  email: 'jane@example.com',
  message: 'Hi & <b>bold</b>\nsecond line',
  page: '/quote',
};

test('renderClientLeadAlert escapes everything the visitor typed and keeps the subject on one line', () => {
  const { subject, html } = renderClientLeadAlert({ businessName: 'Medina Concrete', lead, proofUrl: 'https://app.axeonstudio.co/?tab=leads', test: false });
  assert.ok(!/[\r\n]/.test(subject));
  assert.ok(subject.startsWith('New website lead: Jane'));
  assert.ok(!html.includes('<script>'));
  assert.match(html, /Jane &lt;script&gt;alert\(1\)&lt;\/script&gt; Bcc: x@y\.z/);
  assert.match(html, /Hi &amp; &lt;b&gt;bold&lt;\/b&gt;<br>second line/);
  assert.match(html, /href="tel:\+15155550134"[^>]*>\(515\) 555-0134</);
  assert.match(html, /href="mailto:jane@example\.com"/);
  assert.match(html, /Reply to this email to answer them\./);
  assert.match(html, /href="https:\/\/app\.axeonstudio\.co\/\?tab=leads"/);
  assert.doesNotMatch(html, /Questions\? Reply to this email/); // replies go to the lead, so the footer must not invite questions by reply
});

test('renderClientLeadAlert marks a test and says how to reach a lead who left no email', () => {
  const { subject, html } = renderClientLeadAlert({ businessName: null, lead: { ...lead, name: '', email: null }, proofUrl: 'https://app.axeonstudio.co/?tab=leads', test: true });
  assert.equal(subject, '[Test] New website lead: Someone');
  assert.match(html, /This is a test Axeon sent to check your setup/);
  assert.match(html, /They left no email, so call or text them\./);
  assert.match(html, /Email: none left/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Change the `test:leads` script in `package.json` to:

```json
    "test:leads": "tsx --test lib/leadShared.test.ts lib/leads.test.ts lib/leadEmail.test.ts",
```

Run: `npm run test:leads`
Expected: FAIL: `Cannot find module './leads'` and `renderClientLeadAlert` is not exported from `./email`.

- [ ] **Step 3: Add the email kind**

In `lib/emailLogShared.ts`, inside `EMAIL_CATEGORIES`, replace:

```ts
  alerts: 'Alerts to you',
} as const;
```

with:

```ts
  alerts: 'Alerts to you',
  leads: 'Client lead alerts',
} as const;
```

and inside `EMAIL_KINDS`, replace:

```ts
  lead_alert: { label: 'New lead', category: 'alerts' },
```

with:

```ts
  lead_alert: { label: 'New lead', category: 'alerts' },
  client_lead_alert: { label: 'Website lead (to client)', category: 'leads' },
```

- [ ] **Step 4: Write the lead email**

In `lib/email.ts`:

(a) Add to the imports at the top:

```ts
import { formatPhone } from '@/lib/phoneShared';
```

(b) Give `clientLayout` a footer parameter. Replace:

```ts
function clientLayout(title: string, bodyHtml: string): string {
```

with:

```ts
function clientLayout(title: string, bodyHtml: string, footer = 'Questions? Reply to this email or call (515) 493-8017.'): string {
```

and replace:

```ts
      <p style="margin:32px 0 0;font-size:13px;color:#737373">Questions? Reply to this email or call (515) 493-8017.</p>
```

with:

```ts
      <p style="margin:32px 0 0;font-size:13px;color:#737373">${footer}</p>
```

(c) Directly after the `sendLeadNotification` function, insert:

```ts
export interface ClientLeadAlertInput {
  businessName: string | null;
  lead: { name: string; phone: string | null; email: string | null; message: string; page: string };
  proofUrl: string;
  test: boolean;
}

/**
 * A website form lead, to the client (slice 2, lib/leads.ts). Read on a phone in
 * five seconds: who, how to reach them, what they said. Every visitor-typed
 * value is escaped; the subject is one line. Reply-to is the lead when they left
 * an email, so the footer does not invite questions by reply.
 */
export function renderClientLeadAlert(input: ClientLeadAlertInput): { subject: string; html: string } {
  const name = input.lead.name.replace(/[\r\n]+/g, ' ').trim() || 'Someone';
  const subject = `${input.test ? '[Test] ' : ''}New website lead: ${name}`.slice(0, 120);
  const link = (href: string, text: string) => `<a href="${escapeHtml(href)}" style="color:#2563eb">${escapeHtml(text)}</a>`;
  const phone = input.lead.phone ? link(`tel:${input.lead.phone}`, formatPhone(input.lead.phone)) : 'none left';
  const email = input.lead.email ? link(`mailto:${input.lead.email}`, input.lead.email) : 'none left';
  const message = input.lead.message ? escapeHtml(input.lead.message).replace(/\n/g, '<br>') : '<span style="color:#737373">No message.</span>';
  const where = input.lead.page ? `the ${escapeHtml(input.lead.page)} page` : 'your website';
  const site = input.businessName ? ` of the ${escapeHtml(input.businessName)} site` : '';
  const html = clientLayout(
    input.test ? 'Test lead from your website' : 'New lead from your website',
    `
      ${input.test ? '<p style="margin:0 0 12px;color:#92400e">This is a test Axeon sent to check your setup. Nothing to do.</p>' : ''}
      <p style="margin:0 0 4px;font-size:18px"><b>${escapeHtml(name)}</b></p>
      <p style="margin:0 0 4px">Phone: ${phone}</p>
      <p style="margin:0 0 12px">Email: ${email}</p>
      <p style="margin:0 0 12px;padding:12px 14px;background:#f5f5f5;border-radius:10px">${message}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#525252">${input.lead.email ? 'Reply to this email to answer them.' : 'They left no email, so call or text them.'} Sent from ${where}${site}.</p>
      ${button(input.proofUrl, 'See all your leads')}
    `,
    'Sent by Axeon from your website form. Questions about these alerts? Call Axeon at (515) 493-8017.',
  );
  return { subject, html };
}

/** Sends renderClientLeadAlert. False when Resend is not configured; throws when Resend rejects it. */
export async function sendClientLeadAlert(input: ClientLeadAlertInput & { to: string }): Promise<boolean> {
  const resend = getClient('client_lead_alert');
  if (!resend) return false;
  const { subject, html } = renderClientLeadAlert(input);
  await sendChecked(resend, { from: CLIENT_FROM_ADDRESS, replyTo: input.lead.email ?? CLIENT_REPLY_TO, to: input.to, subject, html });
  return true;
}
```

`CLIENT_FROM_ADDRESS` and `sendChecked` are declared above `sendLeadNotification` already, so the order works.

- [ ] **Step 5: Write the lead module**

```ts
// lib/leads.ts
// Website form leads, server side (slice 2). /api/lead writes a row here and,
// after answering the visitor, calls deliverLead: an email to the client, a
// text to the owner's cell through their own line, and a call connect call.
// The connect webhooks read and mark rows; PROOF's Leads tab reads
// listSubmissions. Server-only.
import { createHmac } from 'node:crypto';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { sendClientLeadAlert } from '@/lib/email';
import { getLine, sendOwnerAlert, startConnectCall } from '@/lib/phoneLines';
import { REPORT_TIME_ZONE, isValidMonth } from '@/lib/siteStats';
import { normalizePhone } from '@/lib/phoneShared';
import { leadAlertText, planLeadDelivery, type DeliveryReport, type FormSubmission, type LeadInput } from '@/lib/leadShared';
import type { Onboarding } from '@/lib/onboarding';

/** At most this many submissions per IP hash per site in the window (spec, "Slice 2 design"). */
export const LEAD_RATE_LIMIT = 5;
export const LEAD_RATE_WINDOW_MINUTES = 10;

export type LeadOwner = Pick<Onboarding, 'id' | 'tier' | 'businessName' | 'clientEmail'>;

type DbId = number | string;
type DbTime = Date | string;

interface SubmissionRow {
  id: DbId;
  onboarding_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  page: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_test: boolean;
  connect_pressed_at: DbTime | null;
  created_at: DbTime;
}

const iso = (t: DbTime): string => new Date(t).toISOString();
const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));

const toSubmission = (r: SubmissionRow): FormSubmission => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  name: r.name,
  phone: r.phone,
  email: r.email,
  message: r.message,
  page: r.page,
  utmSource: r.utm_source,
  utmMedium: r.utm_medium,
  utmCampaign: r.utm_campaign,
  isTest: r.is_test,
  connectPressedAt: r.connect_pressed_at ? iso(r.connect_pressed_at) : null,
  createdAt: iso(r.created_at),
});

/** The rate-limit key. The IP itself never reaches the table; this keyed hash does. */
export function leadIpHash(ip: string, secret: string): string {
  return createHmac('sha256', secret || 'axeon-lead').update(`lead|${ip}`).digest('hex').slice(0, 32);
}

export async function recordFormSubmission(onboardingId: number, input: LeadInput, meta: { ipHash: string; isTest?: boolean }): Promise<FormSubmission> {
  await ensureSchema();
  const { rows } = await sql<SubmissionRow>`
    INSERT INTO form_submissions (onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, ip_hash, is_test)
    VALUES (${onboardingId}, ${input.name}, ${input.phone}, ${input.email}, ${input.message}, ${input.page},
            ${input.utmSource}, ${input.utmMedium}, ${input.utmCampaign}, ${meta.ipHash}, ${meta.isTest ?? false})
    RETURNING *;
  `;
  return toSubmission(rows[0]);
}

/** Submissions from this IP hash to this client in the last `minutes`. In the table, because serverless instances share no memory. */
export async function recentSubmissionCount(onboardingId: number, ipHash: string, minutes: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT count(*)::int AS n FROM form_submissions
    WHERE onboarding_id = ${onboardingId} AND ip_hash = ${ipHash}
      AND created_at > now() - make_interval(mins => ${Math.round(minutes)});
  `;
  return Number(rows[0]?.n ?? 0);
}

/** One lead, only if it is this client's: the connect webhooks bind ?lead= to the line's onboarding through this. */
export async function getSubmission(onboardingId: number, id: number): Promise<FormSubmission | null> {
  await ensureSchema();
  const { rows } = await sql<SubmissionRow>`SELECT * FROM form_submissions WHERE id = ${id} AND onboarding_id = ${onboardingId} LIMIT 1;`;
  return rows[0] ? toSubmission(rows[0]) : null;
}

/** The month's real (non-test) form leads, newest first. Month is YYYY-MM in REPORT_TIME_ZONE, like leadRows. */
export async function listSubmissions(onboardingId: number, month: string, limit = 200): Promise<FormSubmission[]> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return [];
  await ensureSchema();
  const first = `${month}-01`;
  const { rows } = await sql<SubmissionRow>`
    SELECT * FROM form_submissions
    WHERE onboarding_id = ${onboardingId} AND is_test = false
      AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
      AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit};
  `;
  return rows.map(toSubmission);
}

/** The owner pressed 1. The first press time is kept if Twilio retries. */
export async function markConnectPressed(onboardingId: number, leadId: number, callSid: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE form_submissions
    SET connect_pressed_at = COALESCE(connect_pressed_at, now()), connect_call_sid = COALESCE(NULLIF(${callSid}, ''), connect_call_sid)
    WHERE id = ${leadId} AND onboarding_id = ${onboardingId};
  `;
}

async function noteConnectCall(onboardingId: number, leadId: number, callSid: string): Promise<void> {
  await sql`UPDATE form_submissions SET connect_call_sid = ${callSid} WHERE id = ${leadId} AND onboarding_id = ${onboardingId};`;
}

/**
 * Everything a new lead sets off. Runs inside after() from /api/lead, and
 * directly from the admin's test button. Each channel fails on its own: a
 * Twilio error never stops the email, and the report says what happened.
 */
export async function deliverLead(owner: LeadOwner, lead: FormSubmission, opts: { now?: Date; test?: boolean } = {}): Promise<DeliveryReport> {
  const line = await getLine(owner.id).catch((err) => {
    console.error('[lead] line lookup', errText(err));
    return null;
  });
  const plan = planLeadDelivery({ tier: owner.tier, line, leadPhone: lead.phone, now: opts.now ?? new Date() });

  const email = sendClientLeadAlert({ to: owner.clientEmail, businessName: owner.businessName, lead, proofUrl: `${APP_ORIGIN}/?tab=leads`, test: Boolean(opts.test) })
    .then((sent): DeliveryReport['email'] => (sent ? 'sent' : 'off'))
    .catch((err): DeliveryReport['email'] => {
      console.error('[lead] email', lead.id, errText(err));
      return 'failed';
    });

  // The text goes before the call, so "we texted you their details" is already true when the owner hears it.
  let text: DeliveryReport['text'];
  if (plan.text !== 'send') text = plan.text;
  else if (!line) text = 'no_line';
  else {
    try {
      const r = await sendOwnerAlert(line, leadAlertText(lead));
      text = r.sent ? 'sent' : r.reason;
    } catch (err) {
      console.error('[lead] owner text', lead.id, errText(err));
      text = 'failed';
    }
  }

  let connect: DeliveryReport['connect'];
  if (plan.connect !== 'call') connect = plan.connect;
  else if (!line || !lead.phone) connect = 'no_phone';
  else {
    try {
      const { sid } = await startConnectCall(line, { id: lead.id, phone: lead.phone });
      await noteConnectCall(owner.id, lead.id, sid).catch((err) => console.error('[lead] connect sid not saved', sid, errText(err)));
      connect = 'started';
    } catch (err) {
      console.error('[lead] call connect', lead.id, errText(err));
      connect = 'failed';
    }
  }

  const report: DeliveryReport = { email: await email, text, connect };
  console.info('[lead] delivered', lead.id, report);
  return report;
}

/**
 * The admin's "Send test lead": a fake submission for this client, delivered
 * the real way (email marked [Test], owner text, call connect to the owner's
 * cell, which then dials `phoneRaw` on 1). Test rows never show in PROOF.
 */
export async function sendTestLead(owner: LeadOwner, phoneRaw: unknown): Promise<DeliveryReport> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) throw new Error("Enter the test lead's phone: a 10-digit US number that is not the owner's forward-to (use your own cell)");
  const lead = await recordFormSubmission(
    owner.id,
    { name: 'Test Lead', phone, email: null, message: 'This is a test lead sent from the Axeon admin. Nothing to do.', page: '/axeon-test', utmSource: null, utmMedium: null, utmCampaign: null },
    { ipHash: 'admin-test', isTest: true },
  );
  return deliverLead(owner, lead, { test: true });
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:leads && npm run test:onboarding`
Expected: PASS, no failures (`test:onboarding` includes `lib/emailLog.test.ts`, which checks every kind has a real category).

- [ ] **Step 7: Type-check**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add lib/leads.ts lib/leads.test.ts lib/leadEmail.test.ts lib/email.ts lib/emailLogShared.ts package.json
git commit -m "feat(leads): form submissions, lead delivery, and the client lead email" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: The lead intake route and the call connect and screening webhooks

**Files:**
- Create: `app/api/lead/route.ts`
- Create: `app/api/phone/connect/route.ts`
- Create: `app/api/phone/connect/status/route.ts`
- Create: `app/api/phone/connect/notice/route.ts`
- Create: `app/api/phone/voice/screen/route.ts`
- Create: `app/api/phone/voice/screen/accept/route.ts`
- Modify: `app/api/phone/voice/route.ts` (pass `screenUrl`)

No unit tests: these are thin routes over tested helpers (Global Constraints). Steps 8 and 9 smoke them locally.

**Interfaces:**
- Consumes: `validateLeadInput`, `pagePath`, `safeRedirect`, `backLink`, `replyPage`, `parseId` (Task 1); `readTwilioRequest` with `withQuery`, `hangupTwiml`, `screenTwiml`, `acceptTwiml`, `connectWhisperTwiml`, `connectNoAnswerTwiml`, `connectDialTwiml`, `recordingNoticeTwiml` (Task 2); `getLineById`, `recordCall`, `markConnectEnded` (Task 3); `deliverLead`, `leadIpHash`, `recordFormSubmission`, `recentSubmissionCount`, `getSubmission`, `markConnectPressed`, `LEAD_RATE_LIMIT`, `LEAD_RATE_WINDOW_MINUTES` (Task 4); `isValidSiteKey`, `onboardingIdForSiteKey` (lib/siteStats.ts); `clientIp`, `rateLimited` (lib/welcomeApi.ts); `getOnboardingById` (lib/onboarding.ts); `lineForNumber`, `forwardTwiml`, `emptyTwiml`, `TWIML_HEADERS`, `webhookUrl`, `normalizePhone`, `callOutcome` (slice 1).
- Produces: `POST`/`OPTIONS /api/lead`; `POST /api/phone/connect?lead=<id>`; `POST /api/phone/connect/status?lead=<id>`; `POST /api/phone/connect/notice`; `POST /api/phone/voice/screen?line=<id>`; `POST /api/phone/voice/screen/accept`.

Request/response contract of `/api/lead` (what the docs in Task 8 promise):

| Request | Response |
| --- | --- |
| Form post (`application/x-www-form-urlencoded` or `multipart/form-data`), saved | `303` to the safe `redirect`, else `200` thank-you page |
| JSON (`application/json`, or `Accept: application/json`), saved | `200 { ok: true }` |
| Honeypot filled | Same as saved; nothing written |
| Bad or unknown `site`, no phone and no email, unreadable body | `400`/`404` with a plain sentence (`{ ok: false, error }` for JSON) |
| Over the rate limit | `429` with a plain sentence |

- [ ] **Step 1: Write the intake route**

```ts
// app/api/lead/route.ts
// Website forms on client sites post here (the form snippet in docs/onboarding.md):
// form-encoded from a plain <form>, or JSON from fetch. The site key resolves to
// the client the way /api/t does; the honeypot and the rate limit come first;
// the lead is saved and the visitor answered at once. The email, the owner's
// text and the call connect call run after the response (after()), so a slow
// Twilio or Resend never holds up the visitor's "thanks". Unlike /api/t, an
// unknown key is reported: a silently dropped lead costs the client a job, and
// the key is unguessable.
import { after } from 'next/server';
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { isValidSiteKey, onboardingIdForSiteKey } from '@/lib/siteStats';
import { getOnboardingById } from '@/lib/onboarding';
import { deliverLead, leadIpHash, LEAD_RATE_LIMIT, LEAD_RATE_WINDOW_MINUTES, recentSubmissionCount, recordFormSubmission } from '@/lib/leads';
import { backLink, pagePath, replyPage, safeRedirect, validateLeadInput } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'cache-control': 'no-store',
};

const MAX_BODY = 16384;
// Per instance, before any database work: only stops floods. The real limit is LEAD_RATE_LIMIT per site, in the table.
const MAX_PER_MINUTE = 20;

interface Reply {
  json: boolean;
  origin: string | null;
  referer: string | null;
  redirect: unknown;
}

function page(r: Reply, status: number, heading: string, text: string): Response {
  return new Response(replyPage({ heading, text, backUrl: backLink(r.referer) }), { status, headers: { ...CORS, 'content-type': 'text/html; charset=utf-8' } });
}

function thanks(r: Reply): Response {
  if (r.json) return Response.json({ ok: true }, { headers: CORS });
  const to = safeRedirect(r.redirect, r.origin, r.referer);
  if (to) return new Response(null, { status: 303, headers: { ...CORS, location: to } });
  return page(r, 200, 'Thanks, we got your message.', 'We will get back to you soon.');
}

function refuse(r: Reply, status: number, error: string): Response {
  if (r.json) return Response.json({ ok: false, error }, { status, headers: CORS });
  return page(r, status, 'Your message was not sent.', error);
}

async function readFields(req: Request): Promise<Record<string, unknown> | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY) return null;
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  if (type.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of form) if (typeof v === 'string') fields[k] = v; // file inputs are ignored
    return fields;
  }
  const text = await req.text().catch(() => '');
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) return null;
  if (type.includes('application/json')) {
    try {
      const v: unknown = JSON.parse(text);
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return Object.fromEntries(new URLSearchParams(text));
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  const accept = (req.headers.get('accept') ?? '').toLowerCase();
  const reply: Reply = {
    json: type.includes('application/json') || accept.includes('application/json'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    redirect: null,
  };

  const fields = await readFields(req);
  if (!fields) return refuse(reply, 400, 'That form could not be read. Please call us instead.');
  reply.redirect = fields.redirect;

  const site = fields.site;
  if (!isValidSiteKey(site)) return refuse(reply, 400, 'This form is not connected yet. Please call us instead.');
  const ip = clientIp(req);
  if (rateLimited(`lead:${ip}`, MAX_PER_MINUTE, 60_000)) return refuse(reply, 429, 'Too many messages at once. Please wait a minute or call us.');

  const checked = validateLeadInput(fields);
  // A bot that filled the hidden field gets the same "thanks" a person gets, so it learns nothing.
  if (!checked.ok) return checked.reason === 'spam' ? thanks(reply) : refuse(reply, 400, checked.error);
  const lead = { ...checked.lead, page: checked.lead.page || pagePath(reply.referer) };

  try {
    const onboardingId = await onboardingIdForSiteKey(site);
    if (!onboardingId) {
      console.warn('[lead] unknown site key', site.slice(0, 6));
      return refuse(reply, 404, 'This form is not connected yet. Please call us instead.');
    }
    const ipHash = leadIpHash(ip, process.env.TRACKING_SALT || process.env.AUTH_SECRET || '');
    if ((await recentSubmissionCount(onboardingId, ipHash, LEAD_RATE_WINDOW_MINUTES)) >= LEAD_RATE_LIMIT) {
      return refuse(reply, 429, 'We already have several messages from you and will be in touch. Please call us if it is urgent.');
    }
    const saved = await recordFormSubmission(onboardingId, lead, { ipHash });
    after(async () => {
      try {
        const owner = await getOnboardingById(onboardingId);
        if (owner) await deliverLead(owner, saved);
      } catch (err) {
        console.error('[lead] deliver', saved.id, err instanceof Error ? err.message : err);
      }
    });
    return thanks(reply);
  } catch (err) {
    console.error('[lead]', err instanceof Error ? err.message : err);
    return refuse(reply, 500, 'Something went wrong on our side. Please call us instead.');
  }
}
```

No user-agent bot filter here, on purpose: `looksLikeBot` drops anything that says "preview" or "node-fetch", and a dropped real lead costs more than a spam row. The honeypot and the rate limit carry it.

- [ ] **Step 2: Write the call connect route**

```ts
// app/api/phone/connect/route.ts
// Call connect. Twilio fetches this when the owner answers our call about a new
// website lead (startConnectCall in lib/phoneLines.ts), and again with Digits
// when they press a key. ?lead=<id> is inside the signed URL, and the lead must
// belong to the client whose tracked number placed the call (From), so one
// client's lead can never ring through another client's line.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber } from '@/lib/phoneLines';
import { getSubmission, markConnectPressed } from '@/lib/leads';
import { connectDialTwiml, connectNoAnswerTwiml, connectWhisperTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { normalizePhone } from '@/lib/phoneShared';
import { parseId } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATH = '/api/phone/connect';
const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, PATH, { withQuery: true });
  if (!read.ok) return read.response;
  const p = read.params;
  const leadId = parseId(new URL(req.url).searchParams.get('lead'));
  const from = normalizePhone(p.From);
  if (!leadId || !from) return twiml(hangupTwiml());

  let line;
  let lead;
  try {
    line = await lineForNumber(from);
    lead = line ? await getSubmission(line.onboardingId, leadId) : null;
  } catch (err) {
    console.error('[phone/connect]', err instanceof Error ? err.message : err);
    return twiml(connectNoAnswerTwiml({ textedDetails: false })); // the email always goes, so "emailed" is true
  }
  if (!line || !lead?.phone) return twiml(hangupTwiml());

  const textedDetails = line.smsStatus === 'ready';
  // Gather posts back here only when a key was pressed; the first request has no Digits.
  if (p.Digits === undefined) {
    return twiml(connectWhisperTwiml({ leadName: lead.name, gatherUrl: webhookUrl(`${PATH}?lead=${leadId}`), textedDetails }));
  }
  if (p.Digits !== '1') return twiml(connectNoAnswerTwiml({ textedDetails }));

  await markConnectPressed(line.onboardingId, leadId, p.CallSid ?? '').catch((err) => console.error('[phone/connect] press not saved', err instanceof Error ? err.message : err));
  return twiml(
    connectDialTwiml({
      leadPhone: lead.phone,
      callerId: line.phoneNumber,
      statusUrl: webhookUrl(`/api/phone/connect/status?lead=${leadId}`),
      recordingUrl: line.recordCalls ? webhookUrl('/api/phone/recording') : null,
      noticeUrl: line.recordCalls && line.consentNotice ? webhookUrl('/api/phone/connect/notice') : null,
    }),
  );
}
```

- [ ] **Step 3: Write the call connect status route**

```ts
// app/api/phone/connect/status/route.ts
// Two Twilio callbacks for one call connect call land here. The <Dial> action
// (DialCallStatus) when the owner-to-lead bridge ends: did the lead pick up.
// The call's own status callback (CallStatus) when the owner's leg ends. The
// row was written when the call started (startConnectCall); these update it.
// The recording arrives at /api/phone/recording under the same CallSid.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, markConnectEnded, recordCall } from '@/lib/phoneLines';
import { getSubmission } from '@/lib/leads';
import { emptyTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callOutcome, normalizePhone } from '@/lib/phoneShared';
import { parseId } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATH = '/api/phone/connect/status';
const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, PATH, { withQuery: true });
  if (!read.ok) return read.response;
  const p = read.params;
  const leadId = parseId(new URL(req.url).searchParams.get('lead'));
  const from = normalizePhone(p.From);
  if (!p.CallSid || !leadId || !from) return twiml(hangupTwiml());
  try {
    const line = await lineForNumber(from);
    if (!line) return twiml(hangupTwiml());
    if (p.DialCallStatus) {
      const lead = await getSubmission(line.onboardingId, leadId);
      if (lead?.phone) {
        const seconds = p.DialCallDuration ? Number.parseInt(p.DialCallDuration, 10) : null;
        await recordCall(line.onboardingId, {
          callSid: p.CallSid,
          fromNumber: lead.phone,
          toNumber: line.phoneNumber,
          outcome: callOutcome(p.DialCallStatus),
          dialStatus: p.DialCallStatus,
          durationSeconds: seconds !== null && Number.isFinite(seconds) ? seconds : null,
          direction: 'connect',
          leadId,
        });
      }
      return twiml(hangupTwiml());
    }
    if (p.CallStatus) await markConnectEnded(p.CallSid, p.CallStatus);
  } catch (err) {
    // Hang up cleanly either way: a 500 here would make Twilio read an error to the owner.
    console.error('[phone/connect/status]', err instanceof Error ? err.message : err);
    return twiml(hangupTwiml());
  }
  return twiml(emptyTwiml());
}
```

- [ ] **Step 4: Write the recording notice route**

```ts
// app/api/phone/connect/notice/route.ts
// The lead's leg of a recorded call connect call: when the lead picks up they
// hear the recording notice, then Twilio bridges them to the owner.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { recordingNoticeTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/connect/notice');
  if (!read.ok) return read.response;
  return new Response(recordingNoticeTwiml(), { status: 200, headers: TWIML_HEADERS });
}
```

- [ ] **Step 5: Write the two screening routes**

```ts
// app/api/phone/voice/screen/route.ts
// Call screening. The forwarded leg of an inbound call: when the owner's phone
// picks up, this says "Call for <business>. Press 1 to accept." A person presses
// 1 and the call bridges (screen/accept). Voicemail never does, so the leg
// hangs up, the parent <Dial> reports no-answer, and the missed-call text-back
// fires. This closes slice 1's voicemail gap. ?line=<id> is in the signed URL.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { getLineById } from '@/lib/phoneLines';
import { getOnboardingById } from '@/lib/onboarding';
import { screenTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { parseId } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/screen', { withQuery: true });
  if (!read.ok) return read.response;
  const lineId = parseId(new URL(req.url).searchParams.get('line'));
  let businessName: string | null = null;
  try {
    const line = lineId ? await getLineById(lineId) : null;
    businessName = line ? ((await getOnboardingById(line.onboardingId))?.businessName ?? null) : null;
  } catch (err) {
    // Screening still works without the name: "Call from your tracking number."
    console.error('[phone/screen]', err instanceof Error ? err.message : err);
  }
  return new Response(screenTwiml({ businessName, acceptUrl: webhookUrl('/api/phone/voice/screen/accept') }), { status: 200, headers: TWIML_HEADERS });
}
```

```ts
// app/api/phone/voice/screen/accept/route.ts
// The screen's <Gather> action. Only a 1 bridges (an empty document ends the
// whisper and Twilio connects the caller); any other key hangs up the owner's
// leg, which the parent <Dial> reports as a missed call.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { acceptTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/screen/accept');
  if (!read.ok) return read.response;
  return new Response(read.params.Digits === '1' ? acceptTwiml() : hangupTwiml(), { status: 200, headers: TWIML_HEADERS });
}
```

- [ ] **Step 6: Screen inbound calls when the line says so**

In `app/api/phone/voice/route.ts`, replace:

```ts
      statusUrl: webhookUrl('/api/phone/voice/status'),
      recordingUrl: webhookUrl('/api/phone/recording'),
    }),
```

with:

```ts
      statusUrl: webhookUrl('/api/phone/voice/status'),
      recordingUrl: webhookUrl('/api/phone/recording'),
      screenUrl: line.screenCalls ? webhookUrl(`/api/phone/voice/screen?line=${line.id}`) : undefined,
    }),
```

`app/api/phone/voice/status/route.ts` does not change. With screening on, a voicemail pickup or a decline now arrives there as `no-answer`, and the existing missed-call path (row, text-back, no quiet hours) handles it.

- [ ] **Step 7: Type-check**

Run: `npm run lint && npm run test:phone && npm run test:leads`
Expected: clean, then PASS.

- [ ] **Step 8: Smoke the intake route locally**

With `npm run dev` running and `POSTGRES_URL` in `.env.local` (a dev branch database), in Git Bash:

```bash
# Unknown key: a plain sentence, nothing saved.
curl -s -i -X POST http://localhost:3000/api/lead -H 'content-type: application/x-www-form-urlencoded' -H 'origin: https://client.example' \
  --data 'site=ax_aaaaaaaaaaaaaa&name=Jane&phone=5155550134&redirect=/thanks' | head -1
```

Expected: `HTTP/1.1 404`. Then take the site key from your own test onboarding's admin page (the `t.js` snippet) and:

```bash
KEY=ax_yourrealkey00
curl -s -i -X POST http://localhost:3000/api/lead -H 'content-type: application/x-www-form-urlencoded' -H 'origin: https://client.example' \
  --data "site=$KEY&name=Jane&phone=5155550134&message=Driveway&redirect=/thanks" | grep -iE '^(HTTP|location)'
curl -s -X POST http://localhost:3000/api/lead -H 'content-type: application/json' --data "{\"site\":\"$KEY\",\"email\":\"jane@example.com\"}"
curl -s -i -X POST http://localhost:3000/api/lead -H 'content-type: application/x-www-form-urlencoded' \
  --data "site=$KEY&name=Bot&email=a@b.co&company_website=http://spam" | head -1
curl -s -i -X POST http://localhost:3000/api/lead -H 'content-type: application/x-www-form-urlencoded' \
  --data "site=$KEY&name=Jane&redirect=https://evil.example/" | head -1
```

Expected, in order: `HTTP/1.1 303` with `location: https://client.example/thanks`; `{"ok":true}`; `HTTP/1.1 200` (honeypot: thank-you page, and no new row in `form_submissions`); `HTTP/1.1 400` (no phone or email). Repeat the first saved request until the 6th inside ten minutes answers `HTTP/1.1 429`. The dev log shows `[lead] delivered <id> { email: …, text: …, connect: … }` after each saved one.

- [ ] **Step 9: Smoke a signed screen request**

```bash
node -e "
const {createHmac}=require('crypto');
const url='https://axeonstudio.co/api/phone/voice/screen?line=1';
const p={CallSid:'CA1',From:'+15155550134',To:'+15155550100'};
const sig=createHmac('sha1',process.env.TOK).update(url+Object.keys(p).sort().map(k=>k+p[k]).join('')).digest('base64');
fetch('http://localhost:3000/api/phone/voice/screen?line=1',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-twilio-signature':sig},body:new URLSearchParams(p).toString()}).then(async r=>console.log(r.status,await r.text()));
" 
```

Run it as `TOK=test node -e "…"` with `TWILIO_AUTH_TOKEN=test` in `.env.local`. Expected: `200 <?xml …><Response><Gather numDigits="1" timeout="5" …>…Press 1 to accept.</Say></Gather><Hangup/></Response>`. Change the fetch URL to `?line=2` (signature unchanged): `403`.

- [ ] **Step 10: Commit**

```bash
git add app/api/lead app/api/phone/connect app/api/phone/voice/screen app/api/phone/voice/route.ts
git commit -m "feat(leads): /api/lead intake and the call connect and call screening webhooks" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Admin Phone card: screening, call connect, time zone, and "Send test lead"

**Files:**
- Modify: `app/api/admin/onboarding/[token]/phone/route.ts` (action `test-lead`)
- Modify: `components/insights/PhonePanel.tsx`

**Interfaces:**
- Consumes: `sendTestLead` (Task 4); `describeDelivery` (Task 1); `US_TIME_ZONES`, `DEFAULT_TIME_ZONE` (Task 1); `PhoneLine.screenCalls`, `.callConnectEnabled`, `.timeZone` and `validateLineSettings` (Task 3).
- Produces:
  - `POST /api/admin/onboarding/[token]/phone` `{ action: 'test-lead', phone }` → the usual phone payload plus `testLead: string` (the `describeDelivery` line). Admin-only (`requireAdmin`), errors as `{ error }` 400 like the other actions.
  - `PUT` now carries `screenCalls`, `callConnectEnabled`, `timeZone`.

- [ ] **Step 1: Add the test-lead action**

In `app/api/admin/onboarding/[token]/phone/route.ts`, replace the header comment block (the first six lines) with:

```ts
// app/api/admin/onboarding/[token]/phone/route.ts
// Admin-only: the client's tracked phone line (lib/phoneLines.ts).
//   GET                                           line, recent calls, this month's cost
//   POST { action: 'provision', areaCode, forwardTo }   buy the number
//   POST { action: 'sms', status: 'pending'|'ready' }    flip the 10DLC gate
//   POST { action: 'test-lead', phone }                  fake website lead, delivered for real (lib/leads.ts)
//   PUT  { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage, screenCalls, callConnectEnabled, timeZone }
```

add two imports below the `@/lib/phoneLines` import:

```ts
import { sendTestLead } from '@/lib/leads';
import { describeDelivery } from '@/lib/leadShared';
```

and in `POST`, directly before the line `    throw new Error('Unknown action');`, insert:

```ts
    if (body.action === 'test-lead') {
      // Awaited, not after(): the admin wants to see what happened.
      const report = await sendTestLead(onboarding, body.phone);
      return NextResponse.json({ ...(await payload(onboarding.id)), testLead: describeDelivery(report) });
    }
```

- [ ] **Step 2: Add the settings and the test button to the card**

All edits are in `components/insights/PhonePanel.tsx`.

(a) Imports. Replace the `@/lib/phoneShared` value import line with:

```ts
import { areaCodeOf, callerLabel, callResultLabel, DEFAULT_TIME_ZONE, formatCallLength, formatCallWhen, formatPhone, normalizePhone, textBackMessage as textBackPreview, US_TIME_ZONES } from '@/lib/phoneShared';
```

(b) State. Directly after the line `  const [textBackMessage, setTextBackMessage] = useState(data.line?.textBackMessage ?? '');`, insert:

```tsx
  const [screenCalls, setScreenCalls] = useState(data.line?.screenCalls ?? true);
  const [callConnectEnabled, setCallConnectEnabled] = useState(data.line?.callConnectEnabled ?? true);
  const [timeZone, setTimeZone] = useState(data.line?.timeZone ?? DEFAULT_TIME_ZONE);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
```

(c) `syncForm`. Directly after the line `    setTextBackMessage(l.textBackMessage ?? '');`, insert:

```tsx
    setScreenCalls(l.screenCalls);
    setCallConnectEnabled(l.callConnectEnabled);
    setTimeZone(l.timeZone);
```

(d) `send`. Replace:

```tsx
      const json = (await res.json()) as PhoneData;
      setData(json);
```

with:

```tsx
      const json = (await res.json()) as PhoneData & { testLead?: string };
      setData(json);
      if (json.testLead) setTestResult(json.testLead);
```

(e) Toggles. Replace:

```tsx
              <label className="flex items-center gap-2"><input type="checkbox" checked={textBackEnabled} onChange={(e) => setTextBackEnabled(e.target.checked)} /> Missed-call text-back</label>
```

with:

```tsx
              <label className="flex items-center gap-2"><input type="checkbox" checked={textBackEnabled} onChange={(e) => setTextBackEnabled(e.target.checked)} /> Missed-call text-back</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={screenCalls} onChange={(e) => setScreenCalls(e.target.checked)} /> Call screening (press 1 to accept)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={callConnectEnabled} onChange={(e) => setCallConnectEnabled(e.target.checked)} /> Call connect on website leads</label>
```

(f) Time zone. Replace:

```tsx
            <div className="sm:col-span-2">
              <label htmlFor="phone-text-back" className={adminLabel}>Text-back message (blank = default)</label>
```

with:

```tsx
            <div>
              <label htmlFor="phone-time-zone" className={adminLabel}>Client's time zone (quiet hours 8 pm to 8 am)</label>
              <select id="phone-time-zone" className={adminInput} value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                {US_TIME_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="phone-text-back" className={adminLabel}>Text-back message (blank = default)</label>
```

(g) Save. Replace:

```tsx
send('PUT', { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage })
```

with:

```tsx
send('PUT', { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage, screenCalls, callConnectEnabled, timeZone })
```

(h) Test button. Directly after the paragraph that starts `<p className="mt-2 text-xs text-neutral-500">Messaging Service {line.messagingServiceSid}.` (one line, ends `</p>`), insert:

```tsx

          <div className="mt-4 rounded-xl border border-neutral-200 p-4">
            <p className="text-sm font-semibold text-neutral-900">Send test lead</p>
            <p className="mt-1 text-xs text-neutral-500">
              Posts a fake website form for this client and delivers it for real: the client gets the lead email marked [Test], the owner gets the text (once 10DLC is approved, 8 am to 8 pm), and call connect rings {formatPhone(line.forwardTo)}. Press 1 there and we dial the number below, so use a second phone you have in hand. Test leads never show in the client's dashboard.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="phone-test-lead" className={adminLabel}>Test lead's phone</label>
                <input id="phone-test-lead" className={adminInput} value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="(515) 555-0134" inputMode="tel" />
              </div>
              <button
                className={btn('secondary', 'sm')}
                disabled={busy}
                onClick={() => {
                  setTestResult(null);
                  void send('POST', { action: 'test-lead', phone: testPhone });
                }}
              >
                Send test lead
              </button>
            </div>
            {testResult ? <p role="status" className="mt-2 text-sm text-neutral-700">{testResult}</p> : null}
          </div>
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Check it in the browser**

With `npm run dev`, open `/admin/onboarding/<your test token>` for a client with a provisioned line. Expected: the three new controls show the saved values (both toggles on, Central) on first load; switch Call screening off, pick Mountain, Save settings, reload: the choices persist. Press "Send test lead" with an empty phone: the red error "Enter the test lead's phone…". With a number: one status line like `Email: sent · Text: waiting on 10DLC approval · Call connect: calling the owner's cell now` (Twilio configured) or `… Call connect: failed, see the Vercel log` (not configured locally).

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/onboarding/[token]/phone/route.ts" components/insights/PhonePanel.tsx
git commit -m "feat(phone): admin card settings for screening, call connect and time zone; Send test lead" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Website form messages on the PROOF Leads tab

**Files:**
- Create: `components/proof/FormLeads.tsx`
- Modify: `lib/proofDashboardData.ts`
- Modify: `components/proof/ProofDashboard.tsx`

**Interfaces:**
- Consumes: `listSubmissions` (Task 4); `toDashboardSubmission`, `type DashboardSubmission` (Task 1); `monthLabel` (lib/projectsShared.ts).
- Produces:
  - `interface FormMonth { month: string; label: string; rows: DashboardSubmission[] }` and `FormLeads({ months }: { months: FormMonth[] })` (components/proof/FormLeads.tsx).
  - `ProofDashboard` prop `forms?: FormMonth[]`; `loadDashboardData` returns `forms` (this month so far and last month), so `DashboardData` carries it with no other change and the admin "View as client" preview shows the same rows.

The rows are pre-masked on the server (`toDashboardSubmission`), so no raw phone, email or message is in the page payload. `toDashboardSubmission` is tested in Task 1; this task is rendering only.

- [ ] **Step 1: Write the list component**

```tsx
// components/proof/FormLeads.tsx
// "Messages from your website form": every form a visitor sent through the
// client's site (slice 2, lib/leads.ts), with the name, a masked phone, the
// page, and whether the owner took the call connect call. The rows arrive
// pre-masked (toDashboardSubmission); the full details are in the lead email.
import { PhoneCall } from 'lucide-react';
import type { DashboardSubmission } from '@/lib/leadShared';

export interface FormMonth {
  month: string;
  label: string;
  rows: DashboardSubmission[];
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const pageName = (path: string) => (!path || path === '/' ? 'Home page' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

export function FormLeads({ months }: { months: FormMonth[] }) {
  const total = months.reduce((n, m) => n + m.rows.length, 0);
  const calledBack = months.reduce((n, m) => n + m.rows.filter((r) => r.calledBack).length, 0);
  return (
    <section className="mt-4 rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold text-neutral-950">Messages from your website form</h2>
          <span className="text-sm text-neutral-500">
            {total} {total === 1 ? 'message' : 'messages'}
            {calledBack ? ` · ${calledBack} called back` : ''}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          The full message and phone number are in the email we send you for each one. <span className="font-semibold text-neutral-700">Called back</span> means you pressed 1 on our call and we dialed them for you.
        </p>
      </div>
      {months.map((m) =>
        m.rows.length ? (
          <div key={m.month}>
            <h3 className="bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:px-6">{m.label}</h3>
            <ul className="divide-y divide-neutral-100">
              {m.rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-neutral-950">{r.name}</span>
                      <span className="text-neutral-500">{when(r.at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{[r.phone, pageName(r.page)].filter(Boolean).join(' · ')}</p>
                  </div>
                  {r.calledBack ? (
                    <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:self-center">
                      <PhoneCall size={12} /> Called back
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}
```

- [ ] **Step 2: Load the rows with the rest of the dashboard**

In `lib/proofDashboardData.ts`:

(a) Add below the `@/lib/phoneShared` import:

```ts
import { listSubmissions } from '@/lib/leads';
import { toDashboardSubmission } from '@/lib/leadShared';
```

(b) Replace:

```ts
  const [thisMonth, lastMonth] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
  ]);
```

with:

```ts
  const [thisMonth, lastMonth, thisForms, lastForms] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
    listSubmissions(onboarding.id, month),
    listSubmissions(onboarding.id, previous),
  ]);
```

(c) In the returned object, directly before the line `    upgradeRequest,`, insert:

```ts
    // Website form messages (slice 2), pre-masked: no raw phone, email or message reaches the page.
    forms: [
      { month, label: `${monthLabel(month)} so far`, rows: thisForms.map(toDashboardSubmission) },
      { month: previous, label: monthLabel(previous), rows: lastForms.map(toDashboardSubmission) },
    ],
```

- [ ] **Step 3: Show them on the Leads tab**

In `components/proof/ProofDashboard.tsx`:

(a) Add below the `LeadLog` import:

```tsx
import { FormLeads, type FormMonth } from '@/components/proof/FormLeads';
```

(b) In the destructured props, replace:

```tsx
  leads = [],
  leadApi = null,
```

with:

```tsx
  leads = [],
  forms = [],
  leadApi = null,
```

(c) In the props type, replace:

```tsx
  leads?: LeadMonth[];
```

with:

```tsx
  leads?: LeadMonth[];
  /** This month's and last month's website form messages (lib/leads.ts listSubmissions), pre-masked. */
  forms?: FormMonth[];
```

(d) On the Leads tab, replace:

```tsx
              {leads.some((m) => m.rows.length > 0) ? (
                <LeadLog months={leads} api={leadApi} />
              ) : (
```

with:

```tsx
              {forms.some((m) => m.rows.length > 0) ? <FormLeads months={forms} /> : null}
              {leads.some((m) => m.rows.length > 0) ? (
                <LeadLog months={leads} api={leadApi} />
              ) : forms.some((m) => m.rows.length > 0) ? null : (
```

The empty card ("No one has reached out yet this month.") now shows only when there are neither form messages nor tracker leads. The overview tab is unchanged.

- [ ] **Step 4: Type-check and look at it**

Run: `npm run lint`
Expected: clean.

With `npm run dev`, post one lead for your test client with the first `curl` from Task 5 Step 8, then open the admin "View as client" for that client, Leads tab. Expected: "Messages from your website form" with `Jane`, `(515) 555-01··`, the page, and the time; no "Called back" badge. View the page source: `5550134` does not appear. A "Send test lead" row never appears here.

- [ ] **Step 5: Commit**

```bash
git add components/proof/FormLeads.tsx lib/proofDashboardData.ts components/proof/ProofDashboard.tsx
git commit -m "feat(proof): website form messages on the Leads tab" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Docs: website forms into PROOF, call connect and call screening

**Files:**
- Modify: `docs/onboarding.md`

`.env.example` and `vercel.json` are unchanged (no new variable, no new cron).

**Interfaces:**
- Consumes: the `/api/lead` contract (Task 5), the field names `validateLeadInput` accepts (Task 1), the admin card (Task 6).
- Produces: the form snippet next to the `t.js` snippet, and the operator notes for call connect and call screening.

- [ ] **Step 1: Add the website forms section**

In `docs/onboarding.md`, directly before the line `## The tracked phone number (AxeonCORE and up)`, insert:

````markdown
## Website forms into PROOF (every plan)

Built 2026-10-13 (slice 2 of `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md`).
Client-site forms post to `https://axeonstudio.co/api/lead` instead of Formspree. The
lead is in `form_submissions` within a second, the client gets an email with it
(reply goes to the lead), and the Leads tab in AxeonPROOF lists it. On AxeonCORE and
up the owner also gets a text and a call connect call (see the phone section).

Every client site carries two snippets, both with the same site key from the admin page:

Tracking, on every page (before `</body>`):

```html
<script defer src="https://axeonstudio.co/t.js" data-site="ax_xxxxxxxxxxxxxx"></script>
```

The form, on the contact or quote page:

```html
<form action="https://axeonstudio.co/api/lead" method="POST">
  <input type="hidden" name="site" value="ax_xxxxxxxxxxxxxx">
  <input type="hidden" name="redirect" value="/thanks">
  <!-- Honeypot: off-screen for people, filled by bots. Keep it empty. -->
  <div style="position:absolute;left:-9999px" aria-hidden="true">
    <label>Leave this empty <input type="text" name="company_website" tabindex="-1" autocomplete="off"></label>
  </div>
  <label>Name <input name="name" autocomplete="name" required></label>
  <label>Phone <input name="phone" type="tel" autocomplete="tel" required></label>
  <label>Email <input name="email" type="email" autocomplete="email"></label>
  <label>How can we help? <textarea name="message"></textarea></label>
  <button type="submit">Send</button>
</form>
```

A site that sends with `fetch` posts JSON to the same URL and gets `{ "ok": true }` back:

```js
await fetch('https://axeonstudio.co/api/lead', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ site: 'ax_xxxxxxxxxxxxxx', name, phone, email, message, page: location.pathname }),
});
```

**Field rules.** A phone or an email is required; a phone that is not a 10-digit US
number is kept in the message as typed and never dialed. Accepted names:
`name` / `full_name` (or `first_name` + `last_name`), `phone` / `tel`, `email` /
`_replyto`, `message` / `details` / `comments`. Any other field (a service select,
square footage) is added to the message as `label: value`, up to ten. `page` and
`utm_source` / `utm_medium` / `utm_campaign` are optional; without `page` the
referring page's path is used.

**What the visitor sees.** A plain form is sent to `redirect` (only a page on the
same site; anything else is ignored) or, without one, a short "Thanks, we got your
message" page. A problem (no phone or email, more than 5 sends from one connection
in 10 minutes, a wrong site key) shows one plain sentence and asks them to call.

**Switching an existing site off Formspree.** Change the form's `action` to
`https://axeonstudio.co/api/lead`, add the hidden `site` input and the honeypot
block, replace Formspree's `_next` with `redirect`, keep the field names (the
common ones are accepted as they are), deploy, send one test from your phone, and
confirm the email and the Leads tab row before deleting the Formspree form.

| Piece | Where |
| --- | --- |
| Validation, quiet hours, alert and whisper wording | `lib/leadShared.ts` |
| Storage, rate limit, delivery, test lead | `lib/leads.ts` |
| Intake route | `app/api/lead/route.ts` |
| Client email | `renderClientLeadAlert` in `lib/email.ts` |
| Client list | `components/proof/FormLeads.tsx` via `lib/proofDashboardData.ts` |
| Table | `form_submissions` |
| Tests | `npm run test:leads` |

````

- [ ] **Step 2: Add call connect and call screening to the phone section**

In the same file, replace:

```markdown
| Tables | `phone_lines`, `phone_calls`, `phone_messages`, `phone_opt_outs` |
| Tests | `npm run test:phone` |
```

with:

```markdown
| Call connect and call screening webhooks | `app/api/phone/connect{,/status,/notice}`, `app/api/phone/voice/screen{,/accept}` |
| Tables | `phone_lines`, `phone_calls`, `phone_messages`, `phone_opt_outs` |
| Tests | `npm run test:phone`, `npm run test:leads` |
```

and directly before the paragraph that starts `**Cost.** The admin card estimates the month`, insert:

```markdown
**Call screening** (on by default, slice 2). The forwarded leg says "Call for
<business>. Press 1 to accept." before the caller is connected. A person presses 1;
voicemail never does, so a declined call, a dead battery or a voicemail pickup is
recorded as Missed and gets the missed-call text-back. Turn it off on the admin card
only if the owner hates it; then a voicemail pickup counts as Answered again.

**Lead alerts and call connect** (AxeonCORE and up, slice 2). For every website form
lead: the client gets an email (every plan); the owner's cell gets a text through
their own line (`kind = 'alert'`, only once 10DLC is approved); and if the lead left
a US phone, Twilio calls the owner from the tracked number: "New lead from your
website: <name>. Press 1 to call them now." On 1 we dial the lead with the tracked
number as caller ID, recorded like any call (the lead hears the recording notice).
No key: "Okay. We texted you their details." Call connect calls are kept out of the
Calls tab and the monthly report's call count (they are the owner calling out); the
Leads tab marks the lead "Called back".

**Quiet hours.** 8 pm to 8 am in the line's time zone (admin card, default Central):
no owner text and no call connect call. The email still goes. The missed-call
text-back ignores quiet hours, because the caller just called. A text skipped at
night is not sent later until sequences (slice 3) ship.

**Testing a client's setup.** "Send test lead" on the Phone card posts a fake lead
for that client and shows what happened on one line (email, text, call connect, and
why anything was skipped). The client's email is marked [Test]; test leads never
show in their dashboard. Use a second phone as the test lead's number, not the
forward-to.

```

- [ ] **Step 3: Commit**

```bash
git add docs/onboarding.md
git commit -m "docs: website forms into PROOF, call connect and call screening" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Go-live checklist (owner, not code)

No files. These are the steps only the owner can do, in order, after the branch is deployed to production (preview deployments sit behind Deployment Protection and answer Twilio with 401, and a call placed from a preview keeps the preview's webhook URLs).

- [ ] Open any admin page on production once (that runs `ensureSchema()`), then confirm in Neon that `form_submissions` exists and `phone_lines` has `screen_calls`, `call_connect_enabled`, `time_zone`.
- [ ] **Screening, answer:** call your test line from another phone, answer on the forwarded cell. Expected: "Call for <business>. Press 1 to accept." Press 1: connected; the Calls tab row reads Answered with a recording.
- [ ] **Screening, decline:** call again and decline on the forwarded cell. Expected: the caller hears "Sorry we missed you…" (10DLC approved) and gets the text; the row reads "Missed · texted back". This is the case slice 1 got wrong.
- [ ] **Screening, voicemail:** call again and let it ring to the cell's voicemail without touching it. Expected: same as decline (Missed, texted back). Then airplane mode on the forwarded cell and call again: Missed.
- [ ] **Call connect, press 1:** on the admin Phone card, "Send test lead" with a second phone's number, between 8 am and 8 pm client time. Expected within seconds: the status line reads `Email: sent · Text: sent · Call connect: calling the owner's cell now`; the [Test] email arrives; the alert text arrives on the forwarded cell; the forwarded cell rings from the tracked number and says "New lead from your website: Test Lead. Press 1 to call them now." Press 1: the second phone rings showing the tracked number, hears the recording notice, and you are connected. The admin Calls list does not show it (connect calls stay out of the inbound count); `phone_calls` has a `direction = 'connect'` row with a recording.
- [ ] **Call connect, no key:** send another test lead and do not press anything. Expected: "Okay. We texted you their details." and a hang-up; the second phone never rings.
- [ ] **Quiet hours:** after 8 pm client time, send a test lead. Expected: `Email: sent · Text: skipped, quiet hours (8 pm to 8 am) · Call connect: skipped, quiet hours (8 pm to 8 am)` and nothing rings.
- [ ] **10DLC campaign:** the owner alert is a second message type on each client's campaign. Add a sample (`New website lead: Jane Doe, (515) 555-0134, jane@example.com. "Need a driveway quote" Page: /quote`) and "business owner receives an alert when a customer submits the website form" to the campaign's message flow for any campaign still in review; for approved ones, update the campaign description at the next edit.
- [ ] **Switch one live client site's form** (an AxeonCORE client whose line is provisioned and approved): change the action, add `site`, the honeypot block and `redirect` per `docs/onboarding.md`, deploy, submit once from your phone. Expected: you land on their thanks page, the client gets the email, the owner gets the text and the call, and the PROOF Leads tab shows the row with "Called back" if you pressed 1. Then delete the old Formspree form.
- [ ] **Honeypot and rate limit on production:** `curl -s -i -X POST https://axeonstudio.co/api/lead --data 'site=<key>&name=Bot&email=a@b.co&company_website=x' | head -1` answers `200` and adds no row; six real submissions from one phone inside ten minutes: the sixth shows "We already have several messages from you…".
- [ ] Delete the test rows when done: `DELETE FROM form_submissions WHERE is_test;` (call rows keep their history; `lead_id` becomes null).
