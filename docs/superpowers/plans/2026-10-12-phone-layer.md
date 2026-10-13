# Phone Layer (Slice 1 of the PROOF Lead System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every AxeonCORE client a tracked local number that forwards to their cell, records calls, texts back missed calls, and counts calls in AxeonPROOF and the monthly report, with no GoHighLevel.

**Architecture:** One Twilio master account; a Messaging Service and a local number per client, stored in `phone_lines`. Twilio calls four signed webhooks under `app/api/phone/*` which write `phone_calls` / `phone_messages` and send the text-back through `lib/twilio.ts`. The admin provisions and tunes the line from a card on the client's admin page; PROOF's Calls tab and the monthly report read the two tables.

**Tech Stack:** Next.js 15 App Router route handlers (`runtime = 'nodejs'`), `@vercel/postgres` via `lib/db.ts`, Twilio REST over `fetch` (no SDK), `node:crypto` HMAC-SHA1 for signatures, `tsx --test` + `node:assert/strict` for tests, Tailwind + `components/admin/ui.ts` helpers for UI.

**Spec:** `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md`

## Global Constraints

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

## Review Focus

1. A caller who dials from a number with no `+1` or with letters (`sip:` URIs, anonymous) must never crash the voice webhook; `normalizePhone` returns `null` and the call is forwarded anyway with `from_number = 'unknown'`. Pinned in Task 1 (`normalizePhone` nulls) and Task 5 (voice route with `From=anonymous`).
2. Twilio retries a webhook on a non-2xx or slow reply, so the same `CallSid` can arrive twice; `recordCall` must be an upsert and the text-back must not go out twice. Pinned in Task 4 (`ON CONFLICT`) and Task 5 (24-hour check happens before send).
3. A `text_back_message` containing `&`, `<` or `"` must not break the TwiML or the SMS body. Pinned in Task 3 (`escapeXml` test with all five characters) and Task 1 (`textBackMessage` never adds markup).
4. `forward_to` equal to the tracking number itself would create a dial loop; `validateLineSettings` must refuse it. Pinned in Task 4.
5. A client whose plan is Essentials must never see the real Calls tab even if an admin provisioned a line by mistake; `tabLocked` already gates it, and Task 7 keeps the real tab inside the unlocked branch only. Pinned in Task 7 (render test of `callsSummary` null path).

---

### Task 1: Client-safe phone helpers

**Files:**
- Create: `lib/phoneShared.ts`
- Test: `lib/phoneShared.test.ts`
- Modify: `package.json` (add `test:phone` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `normalizePhone(raw: unknown): string | null` — E.164 for US numbers or `null`.
  - `formatPhone(e164: string): string` — `(515) 555-0134`.
  - `maskNumber(e164: string): string` — `(515) 555-01··`.
  - `areaCodeOf(e164: string): string | null` — `'515'`.
  - `isStopWord(body: unknown): boolean`.
  - `textBackMessage(businessName: string | null, custom: string | null): string`.
  - `callOutcome(dialStatus: unknown): 'answered' | 'missed'`.
  - `SMS_MAX_CHARS = 320`, `TEXT_BACK_DEFAULT`.
  - `type CallOutcome = 'answered' | 'missed'`, `type SmsStatus = 'pending' | 'ready'`.
  - `interface PhoneLineSettings { forwardTo: string; recordCalls: boolean; consentNotice: boolean; textBackEnabled: boolean; textBackMessage: string | null; }`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/phoneShared.test.ts
// Run with: npm run test:phone   (tsx --test, no database or Twilio needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areaCodeOf, callOutcome, formatPhone, isStopWord, maskNumber, normalizePhone, textBackMessage, TEXT_BACK_DEFAULT } from './phoneShared';

test('normalizePhone turns any US spelling into E.164 and rejects the rest', () => {
  assert.equal(normalizePhone('(515) 555-0134'), '+15155550134');
  assert.equal(normalizePhone('515.555.0134'), '+15155550134');
  assert.equal(normalizePhone('1 515 555 0134'), '+15155550134');
  assert.equal(normalizePhone('+15155550134'), '+15155550134');
  assert.equal(normalizePhone('555-0134'), null);
  assert.equal(normalizePhone('anonymous'), null);
  assert.equal(normalizePhone('sip:bob@example.com'), null);
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(5155550134), null);
});

test('formatPhone, maskNumber and areaCodeOf read an E.164 number', () => {
  assert.equal(formatPhone('+15155550134'), '(515) 555-0134');
  assert.equal(maskNumber('+15155550134'), '(515) 555-01··');
  assert.equal(areaCodeOf('+15155550134'), '515');
  assert.equal(areaCodeOf('nope'), null);
});

test('isStopWord matches the carrier opt-out words only, any case, trimmed', () => {
  for (const w of ['STOP', 'stop', ' Stop ', 'STOPALL', 'unsubscribe', 'CANCEL', 'end', 'QUIT']) assert.equal(isStopWord(w), true, w);
  assert.equal(isStopWord('please stop calling'), false);
  assert.equal(isStopWord('START'), false);
  assert.equal(isStopWord(''), false);
  assert.equal(isStopWord(undefined), false);
});

test('textBackMessage uses the custom text when set, otherwise the default with the business name', () => {
  assert.equal(textBackMessage('A-1 Auto Detailing', null), TEXT_BACK_DEFAULT.replace('{business}', 'A-1 Auto Detailing'));
  assert.equal(textBackMessage(null, null), TEXT_BACK_DEFAULT.replace('{business}', 'us'));
  assert.equal(textBackMessage('A-1', '  Hey, we missed you & we will call back.  '), 'Hey, we missed you & we will call back.');
  assert.equal(textBackMessage('A-1', '   '), TEXT_BACK_DEFAULT.replace('{business}', 'A-1'));
  assert.ok(textBackMessage('A-1', null).length <= 160);
});

test('callOutcome treats only a completed dial as answered', () => {
  assert.equal(callOutcome('completed'), 'answered');
  for (const s of ['busy', 'no-answer', 'failed', 'canceled', undefined, 42]) assert.equal(callOutcome(s), 'missed', String(s));
});
```

- [ ] **Step 2: Add the test script and run it to verify it fails**

In `package.json` `scripts`, after `"test:get-started"`, add:

```json
    "test:phone": "tsx --test lib/phoneShared.test.ts lib/twilio.test.ts lib/phoneTwiml.test.ts lib/phoneLines.test.ts",
```

Run: `npm run test:phone`
Expected: FAIL, `Cannot find module './phoneShared'` (the other three files don't exist yet either; that's fine, tsx reports them as missing).

- [ ] **Step 3: Write the implementation**

```ts
// lib/phoneShared.ts
// Phone numbers and the words around them, shared by the server (lib/phoneLines.ts,
// the webhooks), the admin Phone card and the client's Calls tab. Client-safe:
// no Node imports. Numbers are stored E.164 (+15155550134) everywhere.

export type CallOutcome = 'answered' | 'missed';
export type SmsStatus = 'pending' | 'ready';

export interface PhoneLineSettings {
  /** E.164. Where inbound calls ring. */
  forwardTo: string;
  recordCalls: boolean;
  /** Play "This call may be recorded" before the dial. */
  consentNotice: boolean;
  textBackEnabled: boolean;
  /** Null = use TEXT_BACK_DEFAULT with the business name. */
  textBackMessage: string | null;
}

/** Two SMS segments. Longer automated texts read as spam and cost double. */
export const SMS_MAX_CHARS = 320;

export const TEXT_BACK_DEFAULT = "Hi, it's {business}. Sorry we missed your call! Reply here with what you need and we'll get right back to you.";

const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

/** "(515) 555-0134", "515.555.0134", "1 515 555 0134", "+15155550134" → "+15155550134". Anything else → null. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  const e164 = `+1${national}`;
  return US_E164.test(e164) ? e164 : null;
}

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

/** Last two digits hidden, for screens that get screenshotted (matches maskPhone in lib/onboarding.ts). */
export function maskNumber(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{2})\d{2}$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}··` : '··';
}

export function areaCodeOf(e164: string): string | null {
  const m = /^\+1(\d{3})/.exec(e164);
  return m ? m[1] : null;
}

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

/** The carrier opt-out keywords, exactly, so "please stop calling" is a message and "STOP" is an opt-out. */
export function isStopWord(body: unknown): boolean {
  return typeof body === 'string' && STOP_WORDS.has(body.trim().toUpperCase());
}

export function textBackMessage(businessName: string | null, custom: string | null): string {
  const trimmed = custom?.trim();
  if (trimmed) return trimmed;
  return TEXT_BACK_DEFAULT.replace('{business}', businessName?.trim() || 'us');
}

/** Twilio's DialCallStatus: only "completed" means a person picked up. */
export function callOutcome(dialStatus: unknown): CallOutcome {
  return dialStatus === 'completed' ? 'answered' : 'missed';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test lib/phoneShared.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/phoneShared.ts lib/phoneShared.test.ts package.json
git commit -m "feat(phone): client-safe number helpers and text-back copy"
```

---

### Task 2: Twilio REST client and webhook signature check

**Files:**
- Create: `lib/twilio.ts`
- Test: `lib/twilio.test.ts`
- Modify: `.env.example` (append the three variables)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (all server-only):
  - `isTwilioConfigured(): boolean`
  - `webhookUrl(path: string): string` — `PHONE_WEBHOOK_ORIGIN` (default `https://axeonstudio.co`) + path.
  - `twilioSignature(url: string, params: Record<string, string>, authToken: string): string`
  - `verifyTwilioSignature(url: string, params: Record<string, string>, signature: string | null, authToken?: string): boolean`
  - `formParams(body: string): Record<string, string>` — parse `application/x-www-form-urlencoded`.
  - `createMessagingService(input: { friendlyName: string; inboundUrl: string }): Promise<{ sid: string }>`
  - `searchLocalNumbers(areaCode: string): Promise<string[]>` — E.164 candidates.
  - `buyNumber(input: { phoneNumber: string; friendlyName: string; voiceUrl: string; smsUrl: string }): Promise<{ sid: string; phoneNumber: string }>`
  - `attachNumberToService(serviceSid: string, phoneNumberSid: string): Promise<void>`
  - `sendSms(input: { serviceSid: string; to: string; body: string }): Promise<{ sid: string; status: string }>`
  - `releaseNumber(phoneNumberSid: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/twilio.test.ts
// Run with: npm run test:phone. Only the pure parts: signature and form parsing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formParams, twilioSignature, verifyTwilioSignature, webhookUrl } from './twilio';

// Worked example from Twilio's "Validating requests" doc: this URL + params + token give this signature.
const URL = 'https://mycompany.com/myapp.php?foo=1&bar=2';
const PARAMS = { CallSid: 'CA1234567890ABCDE', Caller: '+12349013030', Digits: '1234', From: '+12349013030', To: '+18005551212' };
const TOKEN = '12345';
const EXPECTED = 'RSOYDt4T1cUTdK1PDd93/VVr8B8=';

test('twilioSignature reproduces the documented example', () => {
  assert.equal(twilioSignature(URL, PARAMS, TOKEN), EXPECTED);
});

test('verifyTwilioSignature accepts the right signature and refuses a wrong, missing, or differently-ordered-URL one', () => {
  assert.equal(verifyTwilioSignature(URL, PARAMS, EXPECTED, TOKEN), true);
  assert.equal(verifyTwilioSignature(URL, PARAMS, 'nope', TOKEN), false);
  assert.equal(verifyTwilioSignature(URL, PARAMS, null, TOKEN), false);
  assert.equal(verifyTwilioSignature('https://mycompany.com/myapp.php?bar=2&foo=1', PARAMS, EXPECTED, TOKEN), false);
  assert.equal(verifyTwilioSignature(URL, { ...PARAMS, Digits: '9999' }, EXPECTED, TOKEN), false);
});

test('formParams decodes a urlencoded body including + for space and repeated keys last-wins', () => {
  assert.deepEqual(formParams('From=%2B15155550134&Body=Hello+there&Body=Second'), { From: '+15155550134', Body: 'Second' });
  assert.deepEqual(formParams(''), {});
});

test('webhookUrl uses PHONE_WEBHOOK_ORIGIN when set and the public site otherwise', () => {
  const before = process.env.PHONE_WEBHOOK_ORIGIN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  assert.equal(webhookUrl('/api/phone/voice'), 'https://axeonstudio.co/api/phone/voice');
  process.env.PHONE_WEBHOOK_ORIGIN = 'https://preview.example.com/';
  assert.equal(webhookUrl('/api/phone/voice'), 'https://preview.example.com/api/phone/voice');
  if (before === undefined) delete process.env.PHONE_WEBHOOK_ORIGIN;
  else process.env.PHONE_WEBHOOK_ORIGIN = before;
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test lib/twilio.test.ts`
Expected: FAIL, `Cannot find module './twilio'`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/twilio.ts
// The slice of Twilio Axeon uses, over fetch: buy a local number per client, put
// it in that client's Messaging Service (which carries their 10DLC campaign),
// send a text, and prove a webhook really came from Twilio. One master account;
// no subaccounts (see the spec). Server-only.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.twilio.com/2010-04-01';
const MESSAGING = 'https://messaging.twilio.com/v1';

const sid = () => process.env.TWILIO_ACCOUNT_SID ?? '';
const token = () => process.env.TWILIO_AUTH_TOKEN ?? '';

export function isTwilioConfigured(): boolean {
  return Boolean(sid() && token());
}

/** The public URL Twilio will call. Must match what the number is configured with, byte for byte, or signatures fail. */
export function webhookUrl(path: string): string {
  const origin = (process.env.PHONE_WEBHOOK_ORIGIN || 'https://axeonstudio.co').replace(/\/+$/, '');
  return `${origin}${path}`;
}

/** HMAC-SHA1 of the URL followed by every POST param (sorted by key, key then value), base64. Twilio's own scheme. */
export function twilioSignature(url: string, params: Record<string, string>, authToken: string): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
}

export function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string | null, authToken: string = token()): boolean {
  if (!signature || !authToken) return false;
  const expected = Buffer.from(twilioSignature(url, params, authToken));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function formParams(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(body)) out[k] = v;
  return out;
}

async function call<T>(url: string, init: { method: 'GET' | 'POST' | 'DELETE'; form?: Record<string, string> }): Promise<T> {
  if (!isTwilioConfigured()) throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  const res = await fetch(url, {
    method: init.method,
    headers: {
      authorization: `Basic ${Buffer.from(`${sid()}:${token()}`).toString('base64')}`,
      ...(init.form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { message?: string; code?: number };
  if (!res.ok) throw new Error(`Twilio ${res.status}${json.code ? ` (${json.code})` : ''}: ${json.message ?? 'request failed'}`);
  return json as T;
}

export async function createMessagingService(input: { friendlyName: string; inboundUrl: string }): Promise<{ sid: string }> {
  const r = await call<{ sid: string }>(`${MESSAGING}/Services`, {
    method: 'POST',
    form: { FriendlyName: input.friendlyName, InboundRequestUrl: input.inboundUrl, InboundMethod: 'POST', UseInboundWebhookOnNumber: 'false' },
  });
  return { sid: r.sid };
}

export async function searchLocalNumbers(areaCode: string): Promise<string[]> {
  const q = new URLSearchParams({ AreaCode: areaCode, SmsEnabled: 'true', VoiceEnabled: 'true', PageSize: '10' });
  const r = await call<{ available_phone_numbers: Array<{ phone_number: string }> }>(`${API}/Accounts/${sid()}/AvailablePhoneNumbers/US/Local.json?${q}`, { method: 'GET' });
  return r.available_phone_numbers.map((n) => n.phone_number);
}

export async function buyNumber(input: { phoneNumber: string; friendlyName: string; voiceUrl: string; smsUrl: string }): Promise<{ sid: string; phoneNumber: string }> {
  const r = await call<{ sid: string; phone_number: string }>(`${API}/Accounts/${sid()}/IncomingPhoneNumbers.json`, {
    method: 'POST',
    form: { PhoneNumber: input.phoneNumber, FriendlyName: input.friendlyName, VoiceUrl: input.voiceUrl, VoiceMethod: 'POST', SmsUrl: input.smsUrl, SmsMethod: 'POST' },
  });
  return { sid: r.sid, phoneNumber: r.phone_number };
}

export async function attachNumberToService(serviceSid: string, phoneNumberSid: string): Promise<void> {
  await call(`${MESSAGING}/Services/${serviceSid}/PhoneNumbers`, { method: 'POST', form: { PhoneNumberSid: phoneNumberSid } });
}

export async function sendSms(input: { serviceSid: string; to: string; body: string }): Promise<{ sid: string; status: string }> {
  const r = await call<{ sid: string; status: string }>(`${API}/Accounts/${sid()}/Messages.json`, {
    method: 'POST',
    form: { MessagingServiceSid: input.serviceSid, To: input.to, Body: input.body },
  });
  return { sid: r.sid, status: r.status };
}

export async function releaseNumber(phoneNumberSid: string): Promise<void> {
  await call(`${API}/Accounts/${sid()}/IncomingPhoneNumbers/${phoneNumberSid}.json`, { method: 'DELETE' });
}
```

Append to `.env.example` after the `GOOGLE_REVIEW_URL=` line:

```
# --- Twilio (lib/twilio.ts): the AxeonCORE phone layer ---
# Master account. Buys one local number per client and signs the webhooks under /api/phone.
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
# Optional. The public origin Twilio calls back; defaults to https://axeonstudio.co.
# Must match the deployed host exactly or every webhook fails its signature check.
PHONE_WEBHOOK_ORIGIN=
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test lib/twilio.test.ts`
Expected: PASS, 4 tests. If the documented-example test fails, re-check that the sorted concatenation has no separators between key and value (Twilio's scheme is `url + k1 + v1 + k2 + v2 …`).

- [ ] **Step 5: Commit**

```bash
git add lib/twilio.ts lib/twilio.test.ts .env.example
git commit -m "feat(phone): Twilio REST client and webhook signature check"
```

---

### Task 3: TwiML builders

**Files:**
- Create: `lib/phoneTwiml.ts`
- Test: `lib/phoneTwiml.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `escapeXml(s: string): string`
  - `forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string }): string`
  - `afterDialTwiml(input: { textedBack: boolean }): string`
  - `emptyTwiml(): string`
  - `TWIML_HEADERS` — `{ 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' }`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/phoneTwiml.test.ts
// Run with: npm run test:phone
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { afterDialTwiml, emptyTwiml, escapeXml, forwardTwiml } from './phoneTwiml';

test('escapeXml handles all five XML specials and leaves plain text alone', () => {
  assert.equal(escapeXml(`Tom & Jerry's "<shop>"`), 'Tom &amp; Jerry&apos;s &quot;&lt;shop&gt;&quot;');
  assert.equal(escapeXml('plain'), 'plain');
});

test('forwardTwiml dials the forward number with recording and the status action', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: true, recordCalls: true, statusUrl: 'https://x.co/api/phone/voice/status', recordingUrl: 'https://x.co/api/phone/recording' });
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Response>'));
  assert.match(xml, /<Say voice="Polly\.Joanna">This call may be recorded for quality\.<\/Say>/);
  assert.match(xml, /<Dial action="https:\/\/x\.co\/api\/phone\/voice\/status" method="POST" timeout="20" record="record-from-answer-dual" recordingStatusCallback="https:\/\/x\.co\/api\/phone\/recording" recordingStatusCallbackMethod="POST">\+15155550134<\/Dial>/);
  assert.ok(xml.endsWith('</Response>'));
});

test('forwardTwiml drops the notice and the recording when switched off', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: false, recordCalls: false, statusUrl: 'https://x.co/s', recordingUrl: 'https://x.co/r' });
  assert.doesNotMatch(xml, /<Say/);
  assert.doesNotMatch(xml, /record=/);
  assert.doesNotMatch(xml, /recordingStatusCallback/);
  assert.match(xml, /<Dial action="https:\/\/x\.co\/s" method="POST" timeout="20">\+15155550134<\/Dial>/);
});

test('afterDialTwiml tells the caller about the text when one went out, otherwise hangs up', () => {
  assert.match(afterDialTwiml({ textedBack: true }), /<Say voice="Polly\.Joanna">Sorry we missed you\. We just sent you a text, reply there and we will get right back to you\.<\/Say><Hangup\/>/);
  assert.equal(afterDialTwiml({ textedBack: false }), '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
});

test('emptyTwiml is a bare Response', () => {
  assert.equal(emptyTwiml(), '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test lib/phoneTwiml.test.ts`
Expected: FAIL, `Cannot find module './phoneTwiml'`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/phoneTwiml.ts
// The three TwiML documents the phone webhooks answer with. Strings, not a
// library: there are three of them and every attribute is tested. Client-safe
// by accident (no Node imports), but only the routes use it.

export const TWIML_HEADERS = { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' } as const;

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>';
const VOICE = 'Polly.Joanna';

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Inbound call: optional recording notice, then ring the client's phone. Caller ID stays the caller's, so the client sees who it is. */
export function forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string }): string {
  const say = input.consentNotice ? `<Say voice="${VOICE}">This call may be recorded for quality.</Say>` : '';
  const record = input.recordCalls
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  return `${HEAD}<Response>${say}<Dial action="${escapeXml(input.statusUrl)}" method="POST" timeout="20"${record}>${escapeXml(input.forwardTo)}</Dial></Response>`;
}

/** After the dial ends unanswered. */
export function afterDialTwiml(input: { textedBack: boolean }): string {
  const say = input.textedBack ? `<Say voice="${VOICE}">Sorry we missed you. We just sent you a text, reply there and we will get right back to you.</Say>` : '';
  return `${HEAD}<Response>${say}<Hangup/></Response>`;
}

export function emptyTwiml(): string {
  return `${HEAD}<Response></Response>`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test lib/phoneTwiml.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/phoneTwiml.ts lib/phoneTwiml.test.ts
git commit -m "feat(phone): TwiML builders for forward, after-dial and empty replies"
```

---

### Task 4: Tables and the phone line module

**Files:**
- Modify: `lib/db.ts` (inside `ensureSchema()`, after the `email_log` block at the end)
- Modify: `scripts/init-db.mjs` (same statements, before `console.log('Schema ready.')`)
- Create: `lib/phoneLines.ts`
- Test: `lib/phoneLines.test.ts` (pure validation only)

**Interfaces:**
- Consumes: `normalizePhone`, `PhoneLineSettings`, `SmsStatus`, `CallOutcome`, `SMS_MAX_CHARS`, `textBackMessage` from `lib/phoneShared.ts`; `createMessagingService`, `searchLocalNumbers`, `buyNumber`, `attachNumberToService`, `sendSms`, `webhookUrl`, `isTwilioConfigured` from `lib/twilio.ts`; `sql`, `ensureSchema` from `lib/db.ts`.
- Produces:
  - `interface PhoneLine { id: number; onboardingId: number; phoneNumber: string; phoneNumberSid: string; messagingServiceSid: string; areaCode: string; smsStatus: SmsStatus; status: 'active' | 'released'; createdAt: string; updatedAt: string; } & PhoneLineSettings`
  - `interface PhoneCall { id: number; callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; startedAt: string; durationSeconds: number | null; recordingUrl: string | null; recordingSeconds: number | null; textBackSentAt: string | null; }`
  - `interface CallsSummary { month: string; calls: number; answered: number; missed: number; textedBack: number; avgSeconds: number | null; }`
  - `validateLineSettings(raw: Record<string, unknown>, phoneNumber: string | null): PhoneLineSettings` — throws `Error` with a human message.
  - `validateAreaCode(raw: unknown): string`
  - `getLine(onboardingId: number): Promise<PhoneLine | null>`
  - `lineForNumber(e164: string): Promise<PhoneLine | null>`
  - `provisionLine(onboarding: { id: number; businessName: string | null }, input: { areaCode: string; forwardTo: string }): Promise<PhoneLine>`
  - `updateLineSettings(onboardingId: number, settings: PhoneLineSettings): Promise<PhoneLine>`
  - `setSmsStatus(onboardingId: number, status: SmsStatus): Promise<PhoneLine>`
  - `recordCall(onboardingId: number, call: { callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; durationSeconds: number | null }): Promise<void>` — upsert by `callSid`.
  - `attachRecording(callSid: string, recordingUrl: string, recordingSeconds: number | null): Promise<void>`
  - `recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: 'text_back' | 'manual' | 'inbound'; status: string }): Promise<void>` — upsert by `messageSid`.
  - `markOptedOut(onboardingId: number, phoneNumber: string): Promise<void>`
  - `isOptedOut(onboardingId: number, phoneNumber: string): Promise<boolean>`
  - `textedBackRecently(onboardingId: number, phoneNumber: string, hours?: number): Promise<boolean>`
  - `sendTextBack(line: PhoneLine, businessName: string | null, to: string, callSid: string): Promise<boolean>` — all the gates, then send + record + stamp the call. Returns whether a text went out.
  - `callsSummary(onboardingId: number, month: string): Promise<CallsSummary>`
  - `recentCalls(onboardingId: number, limit?: number): Promise<PhoneCall[]>`
  - `monthCost(onboardingId: number, month: string): Promise<{ calls: number; minutes: number; texts: number; estimate: number }>`

- [ ] **Step 1: Write the failing test for the pure validators**

```ts
// lib/phoneLines.test.ts
// Run with: npm run test:phone. Pure validation only; SQL lives untested on purpose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAreaCode, validateLineSettings } from './phoneLines';

test('validateLineSettings normalizes the forward number and trims the message', () => {
  const s = validateLineSettings({ forwardTo: '(515) 555-0134', recordCalls: 'yes', consentNotice: false, textBackEnabled: true, textBackMessage: '  We missed you!  ' }, '+15155550199');
  assert.deepEqual(s, { forwardTo: '+15155550134', recordCalls: true, consentNotice: false, textBackEnabled: true, textBackMessage: 'We missed you!' });
});

test('validateLineSettings refuses a bad forward number, a loop to the tracking number, and an over-long text', () => {
  assert.throws(() => validateLineSettings({ forwardTo: '555-0134' }, null), /forward/i);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550199' }, '+15155550199'), /itself/i);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', textBackMessage: 'x'.repeat(321) }, null), /320/);
});

test('validateLineSettings turns an empty message into null (use the default) and defaults the toggles on', () => {
  const s = validateLineSettings({ forwardTo: '+15155550134', textBackMessage: '   ' }, null);
  assert.equal(s.textBackMessage, null);
  assert.equal(s.recordCalls, true);
  assert.equal(s.consentNotice, true);
  assert.equal(s.textBackEnabled, true);
});

test('validateAreaCode wants exactly three digits not starting with 0 or 1', () => {
  assert.equal(validateAreaCode(' 515 '), '515');
  assert.equal(validateAreaCode(319), '319');
  assert.throws(() => validateAreaCode('51'), /area code/i);
  assert.throws(() => validateAreaCode('015'), /area code/i);
  assert.throws(() => validateAreaCode(''), /area code/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test lib/phoneLines.test.ts`
Expected: FAIL, `Cannot find module './phoneLines'`.

- [ ] **Step 3: Add the tables to `lib/db.ts`**

Inside `ensureSchema()`, after the `email_log` index statement, add:

```ts
      // AxeonCORE phone layer (lib/phoneLines.ts): one tracked number per client,
      // every call and text on it, and who asked us to stop texting them.
      await sql`
        CREATE TABLE IF NOT EXISTS phone_lines (
          id SERIAL PRIMARY KEY,
          onboarding_id INTEGER UNIQUE NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          phone_number TEXT UNIQUE NOT NULL,
          phone_number_sid TEXT NOT NULL,
          messaging_service_sid TEXT NOT NULL,
          forward_to TEXT NOT NULL,
          area_code TEXT NOT NULL,
          record_calls BOOLEAN NOT NULL DEFAULT true,
          consent_notice BOOLEAN NOT NULL DEFAULT true,
          text_back_enabled BOOLEAN NOT NULL DEFAULT true,
          text_back_message TEXT,
          sms_status TEXT NOT NULL DEFAULT 'pending' CHECK (sms_status IN ('pending', 'ready')),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS phone_calls (
          id BIGSERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          call_sid TEXT UNIQUE NOT NULL,
          from_number TEXT NOT NULL,
          to_number TEXT NOT NULL,
          outcome TEXT NOT NULL CHECK (outcome IN ('answered', 'missed')),
          dial_status TEXT NOT NULL DEFAULT '',
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          duration_seconds INTEGER,
          recording_url TEXT,
          recording_seconds INTEGER,
          text_back_sent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS phone_calls_client_time_idx ON phone_calls (onboarding_id, started_at DESC);`;
      await sql`CREATE INDEX IF NOT EXISTS phone_calls_from_idx ON phone_calls (onboarding_id, from_number, text_back_sent_at);`;
      await sql`
        CREATE TABLE IF NOT EXISTS phone_messages (
          id BIGSERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          message_sid TEXT UNIQUE NOT NULL,
          direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          from_number TEXT NOT NULL,
          to_number TEXT NOT NULL,
          body TEXT NOT NULL DEFAULT '',
          kind TEXT NOT NULL CHECK (kind IN ('text_back', 'manual', 'inbound')),
          status TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS phone_messages_client_time_idx ON phone_messages (onboarding_id, created_at DESC);`;
      await sql`
        CREATE TABLE IF NOT EXISTS phone_opt_outs (
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          phone_number TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (onboarding_id, phone_number)
        );
      `;
```

Copy the same statements into `scripts/init-db.mjs` right before `console.log('Schema ready.');` (that script uses the same `sql` tag; paste the block verbatim).

- [ ] **Step 4: Write the module**

```ts
// lib/phoneLines.ts
// The AxeonCORE phone layer: one tracked local number per client that forwards
// to their cell, records calls, and texts back a missed call. Provisioning talks
// to Twilio (lib/twilio.ts); the webhooks under app/api/phone call the record*
// functions; PROOF and the monthly report read callsSummary. Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { attachNumberToService, buyNumber, createMessagingService, isTwilioConfigured, searchLocalNumbers, sendSms, webhookUrl } from '@/lib/twilio';
import { normalizePhone, textBackMessage, SMS_MAX_CHARS, type CallOutcome, type PhoneLineSettings, type SmsStatus } from '@/lib/phoneShared';

export interface PhoneLine extends PhoneLineSettings {
  id: number;
  onboardingId: number;
  phoneNumber: string;
  phoneNumberSid: string;
  messagingServiceSid: string;
  areaCode: string;
  smsStatus: SmsStatus;
  status: 'active' | 'released';
  createdAt: string;
  updatedAt: string;
}

export interface PhoneCall {
  id: number;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  outcome: CallOutcome;
  dialStatus: string;
  startedAt: string;
  durationSeconds: number | null;
  recordingUrl: string | null;
  recordingSeconds: number | null;
  textBackSentAt: string | null;
}

export interface CallsSummary {
  month: string;
  calls: number;
  answered: number;
  missed: number;
  textedBack: number;
  avgSeconds: number | null;
}

export const TEXT_BACK_WINDOW_HOURS = 24;

// Rates from the spec's cost model; only for the admin card's running estimate.
const RATE = { number: 1.15, tenDlc: 1.5, inboundMin: 0.0085, outboundMin: 0.014, recordingMin: 0.0025, sms: 0.0113 } as const;

interface LineRow {
  id: number;
  onboarding_id: number;
  phone_number: string;
  phone_number_sid: string;
  messaging_service_sid: string;
  forward_to: string;
  area_code: string;
  record_calls: boolean;
  consent_notice: boolean;
  text_back_enabled: boolean;
  text_back_message: string | null;
  sms_status: SmsStatus;
  status: 'active' | 'released';
  created_at: string;
  updated_at: string;
}

const toLine = (r: LineRow): PhoneLine => ({
  id: r.id,
  onboardingId: r.onboarding_id,
  phoneNumber: r.phone_number,
  phoneNumberSid: r.phone_number_sid,
  messagingServiceSid: r.messaging_service_sid,
  forwardTo: r.forward_to,
  areaCode: r.area_code,
  recordCalls: r.record_calls,
  consentNotice: r.consent_notice,
  textBackEnabled: r.text_back_enabled,
  textBackMessage: r.text_back_message,
  smsStatus: r.sms_status,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

interface CallRow {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  outcome: CallOutcome;
  dial_status: string;
  started_at: string;
  duration_seconds: number | null;
  recording_url: string | null;
  recording_seconds: number | null;
  text_back_sent_at: string | null;
}

const toCall = (r: CallRow): PhoneCall => ({
  id: r.id,
  callSid: r.call_sid,
  fromNumber: r.from_number,
  toNumber: r.to_number,
  outcome: r.outcome,
  dialStatus: r.dial_status,
  startedAt: r.started_at,
  durationSeconds: r.duration_seconds,
  recordingUrl: r.recording_url,
  recordingSeconds: r.recording_seconds,
  textBackSentAt: r.text_back_sent_at,
});

const bool = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v === true || v === 'true' || v === 'yes' || v === 'on' || v === 1);

/** Admin card input → settings. Throws a message safe to show the admin. */
export function validateLineSettings(raw: Record<string, unknown>, phoneNumber: string | null): PhoneLineSettings {
  const forwardTo = normalizePhone(raw.forwardTo);
  if (!forwardTo) throw new Error('Forward-to must be a 10-digit US number');
  if (phoneNumber && forwardTo === phoneNumber) throw new Error('The line cannot forward to itself');
  const msg = typeof raw.textBackMessage === 'string' ? raw.textBackMessage.trim() : '';
  if (msg.length > SMS_MAX_CHARS) throw new Error(`The text-back must be ${SMS_MAX_CHARS} characters or fewer`);
  return {
    forwardTo,
    recordCalls: bool(raw.recordCalls, true),
    consentNotice: bool(raw.consentNotice, true),
    textBackEnabled: bool(raw.textBackEnabled, true),
    textBackMessage: msg || null,
  };
}

export function validateAreaCode(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!/^[2-9]\d{2}$/.test(s)) throw new Error('Area code must be three digits, like 515');
  return s;
}

export async function getLine(onboardingId: number): Promise<PhoneLine | null> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`SELECT * FROM phone_lines WHERE onboarding_id = ${onboardingId} AND status = 'active' LIMIT 1;`;
  return rows[0] ? toLine(rows[0]) : null;
}

/** The webhooks' lookup: which client owns the number Twilio just called us about. */
export async function lineForNumber(e164: string): Promise<PhoneLine | null> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`SELECT * FROM phone_lines WHERE phone_number = ${e164} AND status = 'active' LIMIT 1;`;
  return rows[0] ? toLine(rows[0]) : null;
}

/**
 * Buys the client their number. Order matters: the Messaging Service first (it
 * is what the 10DLC campaign hangs off), then the number with its webhooks,
 * then the number into the service. A failure after the purchase leaves the
 * number in Twilio; the error names it so the admin can attach or release it.
 */
export async function provisionLine(onboarding: { id: number; businessName: string | null }, input: { areaCode: string; forwardTo: string }): Promise<PhoneLine> {
  if (!isTwilioConfigured()) throw new Error('Twilio is not configured');
  const existing = await getLine(onboarding.id);
  if (existing) throw new Error(`This client already has ${existing.phoneNumber}`);
  const forwardTo = normalizePhone(input.forwardTo);
  if (!forwardTo) throw new Error('Forward-to must be a 10-digit US number');
  const areaCode = validateAreaCode(input.areaCode);
  const name = onboarding.businessName?.trim() || `Client ${onboarding.id}`;

  const candidates = await searchLocalNumbers(areaCode);
  if (candidates.length === 0) throw new Error(`No local numbers available in ${areaCode}; try a nearby area code`);
  const service = await createMessagingService({ friendlyName: `Axeon · ${name}`, inboundUrl: webhookUrl('/api/phone/sms') });
  const number = await buyNumber({ phoneNumber: candidates[0], friendlyName: `Axeon · ${name}`, voiceUrl: webhookUrl('/api/phone/voice'), smsUrl: webhookUrl('/api/phone/sms') });
  try {
    await attachNumberToService(service.sid, number.sid);
  } catch (err) {
    throw new Error(`Bought ${number.phoneNumber} (${number.sid}) but could not attach it to service ${service.sid}: ${err instanceof Error ? err.message : String(err)}`);
  }
  const { rows } = await sql<LineRow>`
    INSERT INTO phone_lines (onboarding_id, phone_number, phone_number_sid, messaging_service_sid, forward_to, area_code)
    VALUES (${onboarding.id}, ${number.phoneNumber}, ${number.sid}, ${service.sid}, ${forwardTo}, ${areaCode})
    RETURNING *;
  `;
  return toLine(rows[0]);
}

export async function updateLineSettings(onboardingId: number, s: PhoneLineSettings): Promise<PhoneLine> {
  const { rows } = await sql<LineRow>`
    UPDATE phone_lines
    SET forward_to = ${s.forwardTo}, record_calls = ${s.recordCalls}, consent_notice = ${s.consentNotice},
        text_back_enabled = ${s.textBackEnabled}, text_back_message = ${s.textBackMessage}, updated_at = now()
    WHERE onboarding_id = ${onboardingId} AND status = 'active'
    RETURNING *;
  `;
  if (!rows[0]) throw new Error('No phone line for this client');
  return toLine(rows[0]);
}

export async function setSmsStatus(onboardingId: number, status: SmsStatus): Promise<PhoneLine> {
  const { rows } = await sql<LineRow>`UPDATE phone_lines SET sms_status = ${status}, updated_at = now() WHERE onboarding_id = ${onboardingId} AND status = 'active' RETURNING *;`;
  if (!rows[0]) throw new Error('No phone line for this client');
  return toLine(rows[0]);
}

/** Twilio retries webhooks, so the same CallSid can arrive twice: an upsert keeps one row. */
export async function recordCall(onboardingId: number, c: { callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; durationSeconds: number | null }): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO phone_calls (onboarding_id, call_sid, from_number, to_number, outcome, dial_status, duration_seconds)
    VALUES (${onboardingId}, ${c.callSid}, ${c.fromNumber}, ${c.toNumber}, ${c.outcome}, ${c.dialStatus}, ${c.durationSeconds})
    ON CONFLICT (call_sid) DO UPDATE SET outcome = EXCLUDED.outcome, dial_status = EXCLUDED.dial_status, duration_seconds = COALESCE(EXCLUDED.duration_seconds, phone_calls.duration_seconds);
  `;
}

export async function attachRecording(callSid: string, recordingUrl: string, recordingSeconds: number | null): Promise<void> {
  await ensureSchema();
  await sql`UPDATE phone_calls SET recording_url = ${recordingUrl}, recording_seconds = ${recordingSeconds} WHERE call_sid = ${callSid};`;
}

export async function recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: 'text_back' | 'manual' | 'inbound'; status: string }): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO phone_messages (onboarding_id, message_sid, direction, from_number, to_number, body, kind, status)
    VALUES (${onboardingId}, ${m.messageSid}, ${m.direction}, ${m.fromNumber}, ${m.toNumber}, ${m.body}, ${m.kind}, ${m.status})
    ON CONFLICT (message_sid) DO UPDATE SET status = EXCLUDED.status;
  `;
}

export async function markOptedOut(onboardingId: number, phoneNumber: string): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO phone_opt_outs (onboarding_id, phone_number) VALUES (${onboardingId}, ${phoneNumber}) ON CONFLICT DO NOTHING;`;
}

export async function isOptedOut(onboardingId: number, phoneNumber: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`SELECT 1 FROM phone_opt_outs WHERE onboarding_id = ${onboardingId} AND phone_number = ${phoneNumber} LIMIT 1;`;
  return rows.length > 0;
}

export async function textedBackRecently(onboardingId: number, phoneNumber: string, hours: number = TEXT_BACK_WINDOW_HOURS): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT 1 FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND from_number = ${phoneNumber}
      AND text_back_sent_at IS NOT NULL AND text_back_sent_at > now() - make_interval(hours => ${hours})
    LIMIT 1;
  `;
  return rows.length > 0;
}

/**
 * Every gate in one place: the line wants it, 10DLC is approved, the caller has
 * not opted out, we did not already text them today, and we know their number.
 * Returns true only when a text actually left.
 */
export async function sendTextBack(line: PhoneLine, businessName: string | null, to: string, callSid: string): Promise<boolean> {
  if (!line.textBackEnabled || line.smsStatus !== 'ready') return false;
  if (!normalizePhone(to)) return false;
  if (await isOptedOut(line.onboardingId, to)) return false;
  if (await textedBackRecently(line.onboardingId, to)) return false;
  const body = textBackMessage(businessName, line.textBackMessage);
  const sent = await sendSms({ serviceSid: line.messagingServiceSid, to, body });
  await recordMessage(line.onboardingId, { messageSid: sent.sid, direction: 'outbound', fromNumber: line.phoneNumber, toNumber: to, body, kind: 'text_back', status: sent.status });
  await sql`UPDATE phone_calls SET text_back_sent_at = now() WHERE call_sid = ${callSid};`;
  return true;
}

/** Month is YYYY-MM in America/Chicago, the same key the reports use (monthOf in lib/siteStats.ts). */
export async function callsSummary(onboardingId: number, month: string): Promise<CallsSummary> {
  await ensureSchema();
  const { rows } = await sql<{ calls: string; answered: string; missed: string; texted: string; avg: string | null }>`
    SELECT count(*)::text AS calls,
           count(*) FILTER (WHERE outcome = 'answered')::text AS answered,
           count(*) FILTER (WHERE outcome = 'missed')::text AS missed,
           count(*) FILTER (WHERE text_back_sent_at IS NOT NULL)::text AS texted,
           avg(duration_seconds) FILTER (WHERE outcome = 'answered')::text AS avg
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId}
      AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
  `;
  const r = rows[0];
  return {
    month,
    calls: Number(r?.calls ?? 0),
    answered: Number(r?.answered ?? 0),
    missed: Number(r?.missed ?? 0),
    textedBack: Number(r?.texted ?? 0),
    avgSeconds: r?.avg ? Math.round(Number(r.avg)) : null,
  };
}

export async function recentCalls(onboardingId: number, limit = 30): Promise<PhoneCall[]> {
  await ensureSchema();
  const { rows } = await sql<CallRow>`SELECT * FROM phone_calls WHERE onboarding_id = ${onboardingId} ORDER BY started_at DESC LIMIT ${limit};`;
  return rows.map(toCall);
}

/** The admin card's running estimate for the month, from the two tables and the spec's rates. */
export async function monthCost(onboardingId: number, month: string): Promise<{ calls: number; minutes: number; texts: number; estimate: number }> {
  await ensureSchema();
  const [{ rows: c }, { rows: m }] = await Promise.all([
    sql<{ calls: string; seconds: string; recorded: string }>`
      SELECT count(*)::text AS calls, coalesce(sum(duration_seconds), 0)::text AS seconds, coalesce(sum(recording_seconds), 0)::text AS recorded
      FROM phone_calls WHERE onboarding_id = ${onboardingId} AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};`,
    sql<{ texts: string }>`
      SELECT count(*)::text AS texts FROM phone_messages WHERE onboarding_id = ${onboardingId} AND to_char(created_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};`,
  ]);
  const minutes = Math.ceil(Number(c[0]?.seconds ?? 0) / 60);
  const recordedMinutes = Math.ceil(Number(c[0]?.recorded ?? 0) / 60);
  const texts = Number(m[0]?.texts ?? 0);
  const estimate = RATE.number + RATE.tenDlc + minutes * (RATE.inboundMin + RATE.outboundMin) + recordedMinutes * RATE.recordingMin + texts * RATE.sms;
  return { calls: Number(c[0]?.calls ?? 0), minutes, texts, estimate: Math.round(estimate * 100) / 100 };
}
```

- [ ] **Step 5: Run the tests and the type check**

Run: `npx tsx --test lib/phoneLines.test.ts && npm run lint`
Expected: PASS, 4 tests; `tsc --noEmit` clean. If `sql<...>` generic complains, match how `lib/siteStats.ts` types its rows and copy that shape.

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts scripts/init-db.mjs lib/phoneLines.ts lib/phoneLines.test.ts
git commit -m "feat(phone): phone_lines/calls/messages tables and the line module"
```

---

### Task 5: The four Twilio webhooks

**Files:**
- Create: `lib/phoneWebhook.ts` (shared request handling for the routes)
- Create: `app/api/phone/voice/route.ts`
- Create: `app/api/phone/voice/status/route.ts`
- Create: `app/api/phone/recording/route.ts`
- Create: `app/api/phone/sms/route.ts`
- Test: `lib/phoneWebhook.test.ts`
- Modify: `package.json` (add `lib/phoneWebhook.test.ts` to `test:phone`)

**Interfaces:**
- Consumes: `verifyTwilioSignature`, `formParams`, `webhookUrl` (Task 2); `forwardTwiml`, `afterDialTwiml`, `emptyTwiml`, `TWIML_HEADERS` (Task 3); `lineForNumber`, `recordCall`, `attachRecording`, `recordMessage`, `markOptedOut`, `sendTextBack` (Task 4); `normalizePhone`, `callOutcome`, `isStopWord` (Task 1); `getOnboardingById` from `lib/onboarding.ts`.
- Produces: `readTwilioRequest(req: Request, path: string): Promise<{ ok: true; params: Record<string, string> } | { ok: false; status: number }>`.

- [ ] **Step 1: Write the failing test for the request reader**

```ts
// lib/phoneWebhook.test.ts
// Run with: npm run test:phone
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTwilioRequest } from './phoneWebhook';
import { twilioSignature } from './twilio';

const TOKEN = 'test-token';
const PATH = '/api/phone/voice';

function post(body: Record<string, string>, signature: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
  if (signature) headers['x-twilio-signature'] = signature;
  return new Request(`https://axeonstudio.co${PATH}`, { method: 'POST', headers, body: new URLSearchParams(body).toString() });
}

test('readTwilioRequest accepts a correctly signed form post and returns its params', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  const params = { CallSid: 'CA1', From: '+15155550134', To: '+15155550199' };
  const res = await readTwilioRequest(post(params, twilioSignature(`https://axeonstudio.co${PATH}`, params, TOKEN)), PATH);
  assert.deepEqual(res, { ok: true, params });
});

test('readTwilioRequest refuses a missing or wrong signature with 403 and an oversized body with 413', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  assert.deepEqual(await readTwilioRequest(post({ CallSid: 'CA1' }, null), PATH), { ok: false, status: 403 });
  assert.deepEqual(await readTwilioRequest(post({ CallSid: 'CA1' }, 'bad'), PATH), { ok: false, status: 403 });
  const big = { Body: 'x'.repeat(9000) };
  assert.deepEqual(await readTwilioRequest(post(big, twilioSignature(`https://axeonstudio.co${PATH}`, big, TOKEN)), PATH), { ok: false, status: 413 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Add `lib/phoneWebhook.test.ts` to the `test:phone` script in `package.json`, then:

Run: `npx tsx --test lib/phoneWebhook.test.ts`
Expected: FAIL, `Cannot find module './phoneWebhook'`.

- [ ] **Step 3: Write the shared reader**

```ts
// lib/phoneWebhook.ts
// What every /api/phone route does first: read the form body, prove it came
// from Twilio, hand back the params. Signature is computed over the public URL
// (webhookUrl), not req.url, because Vercel rewrites the host internally.
import { formParams, verifyTwilioSignature, webhookUrl } from '@/lib/twilio';

const MAX_BODY = 8192;

export async function readTwilioRequest(req: Request, path: string): Promise<{ ok: true; params: Record<string, string> } | { ok: false; status: number }> {
  const text = await req.text();
  if (text.length > MAX_BODY) return { ok: false, status: 413 };
  const params = formParams(text);
  if (!verifyTwilioSignature(webhookUrl(path), params, req.headers.get('x-twilio-signature'))) return { ok: false, status: 403 };
  return { ok: true, params };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test lib/phoneWebhook.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the voice route**

```ts
// app/api/phone/voice/route.ts
// Twilio calls this when the tracking number rings. We answer with TwiML that
// forwards the call to the client's phone. An unknown number gets a plain
// hang-up, never an error, so nothing about which numbers exist leaks.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber } from '@/lib/phoneLines';
import { afterDialTwiml, forwardTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { normalizePhone } from '@/lib/phoneShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const twiml = (xml: string, status = 200) => new Response(xml, { status, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice');
  if (!read.ok) return new Response(null, { status: read.status });
  const to = normalizePhone(read.params.To);
  const line = to ? await lineForNumber(to) : null;
  if (!line) return twiml(afterDialTwiml({ textedBack: false }));
  return twiml(
    forwardTwiml({
      forwardTo: line.forwardTo,
      consentNotice: line.consentNotice,
      recordCalls: line.recordCalls,
      statusUrl: webhookUrl('/api/phone/voice/status'),
      recordingUrl: webhookUrl('/api/phone/recording'),
    }),
  );
}
```

- [ ] **Step 6: Write the dial-status route**

```ts
// app/api/phone/voice/status/route.ts
// The <Dial> action: Twilio posts DialCallStatus when the forwarded leg ends.
// This is where a call becomes a row and a missed call becomes a text. Twilio
// retries on a slow reply, so recordCall is an upsert and sendTextBack checks
// the 24-hour window before sending.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, recordCall, sendTextBack } from '@/lib/phoneLines';
import { afterDialTwiml, emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callOutcome, normalizePhone } from '@/lib/phoneShared';
import { getOnboardingById } from '@/lib/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/status');
  if (!read.ok) return new Response(null, { status: read.status });
  const p = read.params;
  const to = normalizePhone(p.To);
  const line = to ? await lineForNumber(to) : null;
  if (!line || !p.CallSid) return twiml(emptyTwiml());

  const from = normalizePhone(p.From) ?? 'unknown';
  const outcome = callOutcome(p.DialCallStatus);
  const seconds = p.DialCallDuration ? Number.parseInt(p.DialCallDuration, 10) : null;
  try {
    await recordCall(line.onboardingId, {
      callSid: p.CallSid,
      fromNumber: from,
      toNumber: line.phoneNumber,
      outcome,
      dialStatus: p.DialCallStatus ?? '',
      durationSeconds: Number.isFinite(seconds) ? seconds : null,
    });
    if (outcome === 'answered') return twiml(emptyTwiml());
    const onboarding = await getOnboardingById(line.onboardingId);
    const textedBack = from !== 'unknown' && (await sendTextBack(line, onboarding?.businessName ?? null, from, p.CallSid));
    return twiml(afterDialTwiml({ textedBack }));
  } catch (err) {
    console.error('[phone/status]', err instanceof Error ? err.message : err);
    return twiml(afterDialTwiml({ textedBack: false }));
  }
}
```

- [ ] **Step 7: Write the recording and SMS routes**

```ts
// app/api/phone/recording/route.ts
// recordingStatusCallback: the recording is ready. Attach it to the call.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { attachRecording } from '@/lib/phoneLines';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/recording');
  if (!read.ok) return new Response(null, { status: read.status });
  const p = read.params;
  if (p.CallSid && p.RecordingUrl && p.RecordingStatus === 'completed') {
    const seconds = p.RecordingDuration ? Number.parseInt(p.RecordingDuration, 10) : null;
    await attachRecording(p.CallSid, p.RecordingUrl, Number.isFinite(seconds) ? seconds : null).catch((err) => console.error('[phone/recording]', err instanceof Error ? err.message : err));
  }
  return new Response(null, { status: 204 });
}
```

```ts
// app/api/phone/sms/route.ts
// An inbound text to the tracking number. Stored; a STOP word is mirrored into
// phone_opt_outs so our own sends stop too (Twilio already blocks and confirms).
// Replies with an empty <Response/>: no auto-reply from here.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, markOptedOut, recordMessage } from '@/lib/phoneLines';
import { emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { isStopWord, normalizePhone } from '@/lib/phoneShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/sms');
  if (!read.ok) return new Response(null, { status: read.status });
  const p = read.params;
  const to = normalizePhone(p.To);
  const from = normalizePhone(p.From);
  const line = to ? await lineForNumber(to) : null;
  if (line && from && p.MessageSid) {
    try {
      await recordMessage(line.onboardingId, { messageSid: p.MessageSid, direction: 'inbound', fromNumber: from, toNumber: line.phoneNumber, body: (p.Body ?? '').slice(0, 1600), kind: 'inbound', status: 'received' });
      if (isStopWord(p.Body)) await markOptedOut(line.onboardingId, from);
    } catch (err) {
      console.error('[phone/sms]', err instanceof Error ? err.message : err);
    }
  }
  return new Response(emptyTwiml(), { status: 200, headers: TWIML_HEADERS });
}
```

- [ ] **Step 8: Type-check and smoke the routes locally**

Run: `npm run lint`
Expected: clean.

Then, with `TWILIO_AUTH_TOKEN=test` in `.env.local` and `npm run dev` running, in a second terminal:

```bash
node -e "
const {createHmac}=require('crypto');
const url='https://axeonstudio.co/api/phone/voice';
const p={CallSid:'CA1',From:'anonymous',To:'+15155550199'};
const sig=createHmac('sha1','test').update(url+Object.keys(p).sort().map(k=>k+p[k]).join('')).digest('base64');
fetch('http://localhost:3000/api/phone/voice',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-twilio-signature':sig},body:new URLSearchParams(p).toString()}).then(async r=>console.log(r.status,await r.text()));
"
```

Expected: `200 <?xml …><Response><Hangup/></Response>` (no line for that number yet, and `From=anonymous` did not crash anything). Repeat without the header: `403`.

- [ ] **Step 9: Commit**

```bash
git add lib/phoneWebhook.ts lib/phoneWebhook.test.ts app/api/phone package.json
git commit -m "feat(phone): Twilio voice, dial-status, recording and SMS webhooks"
```

---

### Task 6: Admin Phone card and API

**Files:**
- Create: `app/api/admin/onboarding/[token]/phone/route.ts`
- Create: `components/insights/PhonePanel.tsx`
- Modify: `app/admin/onboarding/[token]/page.tsx` (load the line + cost, render the panel after `BusinessEmailPanel`)

**Interfaces:**
- Consumes: `getLine`, `provisionLine`, `updateLineSettings`, `setSmsStatus`, `recentCalls`, `monthCost`, `validateLineSettings`, `validateAreaCode`, `PhoneLine`, `PhoneCall` (Task 4); `formatPhone`, `maskNumber`, `areaCodeOf`, `normalizePhone`, `TEXT_BACK_DEFAULT` (Task 1); `requireAdmin`, `jsonError`, `readBody`, `getOnboardingByToken`, `btn`, `adminInput`, `adminLabel`, `monthOf`.
- Produces: `GET/POST/PUT /api/admin/onboarding/<token>/phone` returning `{ line: PhoneLine | null, calls: PhoneCall[], cost }`.

- [ ] **Step 1: Write the admin API route**

```ts
// app/api/admin/onboarding/[token]/phone/route.ts
// Admin-only: the client's tracked phone line (lib/phoneLines.ts).
//   GET                                           line, recent calls, this month's cost
//   POST { action: 'provision', areaCode, forwardTo }   buy the number
//   POST { action: 'sms', status: 'pending'|'ready' }    flip the 10DLC gate
//   PUT  { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage }
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { getLine, monthCost, provisionLine, recentCalls, setSmsStatus, updateLineSettings, validateAreaCode, validateLineSettings } from '@/lib/phoneLines';
import { monthOf } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

async function payload(onboardingId: number) {
  const line = await getLine(onboardingId);
  if (!line) return { line: null, calls: [], cost: null };
  const [calls, cost] = await Promise.all([recentCalls(onboardingId), monthCost(onboardingId, monthOf())]);
  return { line, calls, cost };
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await payload(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    if (body.action === 'provision') {
      await provisionLine(onboarding, { areaCode: validateAreaCode(body.areaCode), forwardTo: String(body.forwardTo ?? '') });
      return NextResponse.json(await payload(onboarding.id));
    }
    if (body.action === 'sms') {
      await setSmsStatus(onboarding.id, body.status === 'ready' ? 'ready' : 'pending');
      return NextResponse.json(await payload(onboarding.id));
    }
    throw new Error('Unknown action');
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    const line = await getLine(onboarding.id);
    await updateLineSettings(onboarding.id, validateLineSettings(await readBody(req), line?.phoneNumber ?? null));
    return NextResponse.json(await payload(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}
```

- [ ] **Step 2: Write the panel**

```tsx
// components/insights/PhonePanel.tsx
// The Phone card on a client's admin page: provision the tracked number from
// the portal's phone-setup answers, tune forwarding / recording / text-back,
// flip the 10DLC gate once Twilio approves the campaign, and see recent calls
// with this month's running cost.
'use client';

import { useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import type { PhoneCall, PhoneLine } from '@/lib/phoneLines';
import { areaCodeOf, formatPhone, maskNumber, normalizePhone, TEXT_BACK_DEFAULT } from '@/lib/phoneShared';

export interface PhoneData {
  line: PhoneLine | null;
  calls: PhoneCall[];
  cost: { calls: number; minutes: number; texts: number; estimate: number } | null;
}

interface Asked {
  mainNumber: string;
  trackingPreference: string;
  answerers: string;
}

const fmtLength = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: '2-digit' });

export function PhonePanel({ token, tier, initial, asked, businessName }: { token: string; tier: string; initial: PhoneData; asked: Asked; businessName: string | null }) {
  const [data, setData] = useState<PhoneData>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const askedNumber = normalizePhone(asked.mainNumber);
  const [areaCode, setAreaCode] = useState((askedNumber && areaCodeOf(askedNumber)) || '515');
  const [forwardTo, setForwardTo] = useState(data.line?.forwardTo ?? askedNumber ?? '');
  const [recordCalls, setRecordCalls] = useState(data.line?.recordCalls ?? true);
  const [consentNotice, setConsentNotice] = useState(data.line?.consentNotice ?? true);
  const [textBackEnabled, setTextBackEnabled] = useState(data.line?.textBackEnabled ?? true);
  const [textBackMessage, setTextBackMessage] = useState(data.line?.textBackMessage ?? '');

  if (tier === 'essentials') return null;

  async function send(method: 'POST' | 'PUT', body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/phone`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as PhoneData & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  const line = data.line;
  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tracked phone number</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{line ? formatPhone(line.phoneNumber) : 'Not provisioned yet'}</h2>
        </div>
        {line ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${line.smsStatus === 'ready' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            {line.smsStatus === 'ready' ? 'Texting approved (10DLC)' : 'Texting pending 10DLC approval'}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
        <p className="font-semibold text-neutral-900">From their setup portal</p>
        <p className="mt-1">Main number: {asked.mainNumber || '—'}</p>
        <p>Tracking: {asked.trackingPreference || '—'}</p>
        <p className="whitespace-pre-line">Answers calls: {asked.answerers || '—'}</p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {!line ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
          <div>
            <label className={adminLabel}>Area code</label>
            <input className={adminInput} value={areaCode} onChange={(e) => setAreaCode(e.target.value)} inputMode="numeric" maxLength={3} />
          </div>
          <div>
            <label className={adminLabel}>Forward calls to</label>
            <input className={adminInput} value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} placeholder="(515) 555-0134" />
          </div>
          <button className={btn('primary')} disabled={busy} onClick={() => send('POST', { action: 'provision', areaCode, forwardTo })}>
            {busy ? 'Buying…' : 'Provision number'}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>Forward calls to</label>
              <input className={adminInput} value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={recordCalls} onChange={(e) => setRecordCalls(e.target.checked)} /> Record calls</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={consentNotice} onChange={(e) => setConsentNotice(e.target.checked)} /> Play recording notice</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={textBackEnabled} onChange={(e) => setTextBackEnabled(e.target.checked)} /> Missed-call text-back</label>
            </div>
            <div className="sm:col-span-2">
              <label className={adminLabel}>Text-back message (blank = default)</label>
              <textarea className={`${adminInput} min-h-20`} value={textBackMessage} onChange={(e) => setTextBackMessage(e.target.value)} placeholder={TEXT_BACK_DEFAULT.replace('{business}', businessName || 'us')} maxLength={320} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btn('primary', 'sm')} disabled={busy} onClick={() => send('PUT', { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage })}>Save settings</button>
            <button className={btn(line.smsStatus === 'ready' ? 'warning' : 'success', 'sm')} disabled={busy} onClick={() => send('POST', { action: 'sms', status: line.smsStatus === 'ready' ? 'pending' : 'ready' })}>
              {line.smsStatus === 'ready' ? 'Mark texting pending' : 'Mark 10DLC approved'}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Messaging Service {line.messagingServiceSid}. Submit the 10DLC brand and campaign for it in the Twilio console, then press “Mark 10DLC approved”. No automated text goes out before that.</p>

          {data.cost ? (
            <p className="mt-4 text-sm text-neutral-700">
              This month: {data.cost.calls} calls, {data.cost.minutes} min, {data.cost.texts} texts — about ${data.cost.estimate.toFixed(2)} in Twilio usage.
            </p>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr><th className="py-1 pr-3">When</th><th className="py-1 pr-3">From</th><th className="py-1 pr-3">Result</th><th className="py-1 pr-3">Length</th><th className="py-1">Recording</th></tr>
              </thead>
              <tbody>
                {data.calls.length === 0 ? (
                  <tr><td colSpan={5} className="py-3 text-neutral-500">No calls yet.</td></tr>
                ) : (
                  data.calls.map((c) => (
                    <tr key={c.id} className="border-t border-neutral-100">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{fmtWhen(c.startedAt)}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{c.fromNumber === 'unknown' ? 'Unknown' : maskNumber(c.fromNumber)}</td>
                      <td className="py-1.5 pr-3">{c.outcome === 'answered' ? 'Answered' : c.textBackSentAt ? 'Missed · texted back' : 'Missed'}</td>
                      <td className="py-1.5 pr-3">{fmtLength(c.durationSeconds)}</td>
                      <td className="py-1.5">{c.recordingUrl ? <a className="text-blue-700 underline" href={c.recordingUrl} target="_blank" rel="noreferrer">Listen</a> : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Mount it on the admin client page**

In `app/admin/onboarding/[token]/page.tsx`:

Add imports after the `getBusinessEmail` import:

```ts
import { PhonePanel } from '@/components/insights/PhonePanel';
import { getLine, monthCost, recentCalls } from '@/lib/phoneLines';
import { monthOf } from '@/lib/siteStats';
```

Add to the `Promise.all` array, after `getBusinessEmail(onboarding.id),`:

```ts
    getLine(onboarding.id),
```

and name it `phoneLine` in the destructuring (append `, phoneLine` after `businessEmail`). Then after the destructuring add:

```ts
  const phone = phoneLine
    ? { line: phoneLine, calls: await recentCalls(onboarding.id), cost: await monthCost(onboarding.id, monthOf()) }
    : { line: null, calls: [], cost: null };
  const phoneCard = states['phone-setup']?.data ?? {};
  const askedPhone = (key: string) => (typeof phoneCard[key] === 'string' ? (phoneCard[key] as string) : '');
```

Render after `<BusinessEmailPanel … />`:

```tsx
        <PhonePanel
          token={onboarding.token}
          tier={onboarding.tier}
          initial={phone}
          businessName={onboarding.businessName}
          asked={{ mainNumber: askedPhone('mainNumber'), trackingPreference: askedPhone('trackingPreference'), answerers: askedPhone('answerers') }}
        />
```

- [ ] **Step 4: Type-check and look at it**

Run: `npm run lint`
Expected: clean.

Run `npm run dev`, sign in at `/admin`, open any AxeonCORE client. Expected: a "Tracked phone number · Not provisioned yet" card with the portal's answers, an area-code box prefilled from the main number, and a Provision button. With no Twilio keys, pressing it shows "Twilio is not configured" in red (that's `provisionLine` refusing, as intended). An Essentials client shows no card.

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/onboarding/[token]/phone/route.ts" components/insights/PhonePanel.tsx "app/admin/onboarding/[token]/page.tsx"
git commit -m "feat(phone): admin Phone card to provision and tune a client's line"
```

---

### Task 7: Real Calls tab in AxeonPROOF

**Files:**
- Modify: `lib/proofDashboardData.ts` (load `callsSummary` for this and last month plus recent calls when a line exists)
- Create: `components/proof/CallsTab.tsx`
- Modify: `components/proof/ProofDashboard.tsx` (render `CallsTab` for `tab === 'calls'` when unlocked and `phone` is present; keep `FeatureTab` otherwise)

**Interfaces:**
- Consumes: `getLine`, `callsSummary`, `recentCalls`, `CallsSummary`, `PhoneCall` (Task 4); `maskNumber`, `formatPhone` (Task 1); `monthLabel` from `lib/projectsShared.ts`; `tabLocked`, `proofTab` already in `ProofDashboard.tsx`.
- Produces: `DashboardPhone` type and `DashboardData.phone: DashboardPhone | null`; `<CallsTab phone={…} />`.

- [ ] **Step 1: Extend the dashboard loader**

In `lib/proofDashboardData.ts`, add the import:

```ts
import { callsSummary, getLine, recentCalls, type CallsSummary, type PhoneCall } from '@/lib/phoneLines';
```

Export the type above `DashboardData`:

```ts
export interface DashboardPhone {
  number: string;
  thisMonth: CallsSummary;
  lastMonth: CallsSummary;
  recent: PhoneCall[];
}
```

Add `getLine(onboarding.id)` as the last element of the first `Promise.all` (name it `line` in the destructuring). After the `[thisMonth, lastMonth]` block, add:

```ts
  const phone: DashboardPhone | null = line
    ? await (async () => {
        const [tm, lm, recent] = await Promise.all([callsSummary(onboarding.id, month), callsSummary(onboarding.id, previous), recentCalls(onboarding.id, 20)]);
        return { number: line.phoneNumber, thisMonth: tm, lastMonth: lm, recent };
      })()
    : null;
```

and include `phone,` in the returned object. `DashboardData` is derived from `ProofDashboard`'s props, so add `phone: DashboardPhone | null` to those props in Step 3 and the loader's return type follows.

- [ ] **Step 2: Write the tab**

```tsx
// components/proof/CallsTab.tsx
// The client's Calls tab once their tracked number exists: this month against
// last, and the latest calls with the caller's last two digits hidden. The
// recording link is the client's own call, so it is shown in full here.
import { monthLabel } from '@/lib/projectsShared';
import { formatPhone, maskNumber } from '@/lib/phoneShared';
import type { DashboardPhone } from '@/lib/proofDashboardData';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">{value}</p>
      {sub ? <p className="mt-2 text-xs text-neutral-500">{sub}</p> : null}
    </div>
  );
}

const delta = (now: number, before: number) => `${now - before >= 0 ? '+' : '−'}${Math.abs(now - before)} vs last month`;
const length = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: '2-digit' });

export function CallsTab({ phone }: { phone: DashboardPhone }) {
  const t = phone.thisMonth;
  const l = phone.lastMonth;
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Calls</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Your tracked number is {formatPhone(phone.number)}. Every call to it rings your phone; anyone you miss gets a text back within a minute.
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">{monthLabel(t.month)} so far</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls" value={String(t.calls)} sub={delta(t.calls, l.calls)} />
        <Stat label="Answered" value={String(t.answered)} sub={t.calls ? `${Math.round((t.answered / t.calls) * 100)}% picked up` : null} />
        <Stat label="Missed, texted back" value={String(t.textedBack)} sub={t.missed > t.textedBack ? `${t.missed - t.textedBack} missed before texting was approved` : null} />
        <Stat label="Average call" value={length(t.avgSeconds)} sub="answered calls" />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {phone.recent.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No calls yet. They show up here the minute they happen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Caller</th><th className="px-4 py-2">Result</th><th className="px-4 py-2">Length</th><th className="px-4 py-2">Recording</th></tr>
            </thead>
            <tbody>
              {phone.recent.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 whitespace-nowrap">{when(c.startedAt)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{c.fromNumber === 'unknown' ? 'Unknown' : maskNumber(c.fromNumber)}</td>
                  <td className="px-4 py-2">{c.outcome === 'answered' ? 'Answered' : c.textBackSentAt ? 'Missed · texted back' : 'Missed'}</td>
                  <td className="px-4 py-2">{length(c.durationSeconds)}</td>
                  <td className="px-4 py-2">{c.recordingUrl ? <a className="text-blue-700 underline" href={c.recordingUrl} target="_blank" rel="noreferrer">Listen</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire it into the dashboard**

In `components/proof/ProofDashboard.tsx`:

- Add `import { CallsTab } from '@/components/proof/CallsTab';` and `import type { DashboardPhone } from '@/lib/proofDashboardData';`.
- Add `phone: DashboardPhone | null;` to the component's props interface and destructure it.
- In the tab switch, change the final `FeatureTab` branch to:

```tsx
          ) : tab === 'calls' && phone ? (
            <CallsTab phone={phone} />
          ) : (
            <FeatureTab tab={proofTab(tab)} reports={reports} traffic={traffic} />
          )
```

This sits inside the existing `tabLocked(...) ? <UpgradePanel …> :` else-branch, so a locked plan never reaches it.

- Wherever `ProofDashboard` is rendered with a spread of `DashboardData` (the client page under `app/proof` and the admin preview page), nothing changes: `phone` arrives through the spread. If a call site builds props by hand, pass `phone={data.phone}`.

- [ ] **Step 4: Type-check and view as client**

Run: `npm run lint`
Expected: clean.

Open an AxeonCORE client's admin page → "View as client" → Calls tab. Without a line: the old FeatureTab text. After provisioning (or after inserting a `phone_lines` row by hand in a local DB): the new tiles with zeros and "No calls yet". An Essentials client still gets the upgrade panel.

- [ ] **Step 5: Commit**

```bash
git add lib/proofDashboardData.ts components/proof/CallsTab.tsx components/proof/ProofDashboard.tsx
git commit -m "feat(phone): real Calls tab in AxeonPROOF from the tracked number"
```

---

### Task 8: Calls into the monthly report, docs, and pricing copy

**Files:**
- Modify: `lib/autoReports.ts` (fill `calls` from `callsSummary` when the typed value is null, right before `attachTrafficToReport`)
- Modify: `docs/onboarding.md` (new section "The tracked phone number")
- Modify: `data/pricingData.ts` (the AxeonCORE inbox line)
- Modify: `content/brand-guardrails.md` (the matching clause)
- Modify: `lib/postValidation.test.ts` only if a test asserts the old inbox wording (check with grep first)

**Interfaces:**
- Consumes: `callsSummary`, `getLine` (Task 4); `saveMonthlyReport`, `normalizeReportBody` from `lib/projects.ts`.

- [ ] **Step 1: Fill the calls number**

In `lib/autoReports.ts`, add the import `import { callsSummary, getLine } from '@/lib/phoneLines';` and, immediately before the line `const report = await attachTrafficToReport(onboarding.id, month, traffic);`, insert:

```ts
  // Calls from the tracked number fill the blank only: a number Axeon typed in wins.
  if ((existing?.calls ?? null) === null && (await getLine(onboarding.id))) {
    const phone = await callsSummary(onboarding.id, month);
    if (phone.calls > 0) await saveMonthlyReport(onboarding.id, { month, body: { ...normalizeReportBody(existing), calls: phone.calls } });
  }
```

Confirm `saveMonthlyReport` and `normalizeReportBody` are imported from `@/lib/projects` in that file (add them to the existing import if not), and that `existing` is the `MonthlyReport | null` already in scope at that point (it is: `reportHasContent(existing)` is used a few lines above).

- [ ] **Step 2: Fix the pricing promise**

In `data/pricingData.ts`, replace the AxeonCORE feature string

```
'One inbox for every text, email, Facebook, Instagram, and Google message, on your phone',
```

with

```
'One inbox for every text, email and website chat, on your phone',
```

In `content/brand-guardrails.md`, in the AxeonCORE line, replace `a unified inbox (SMS, email, Facebook, Instagram, Google)` with `a unified inbox (SMS, email, website chat)`.

Run `grep -rn "Facebook, Instagram, and Google message\|Instagram, Google" data lib content public 2>/dev/null` and change every remaining copy of the old wording the same way (the llms files under `public/` mirror the pricing list).

- [ ] **Step 3: Document it**

Append to `docs/onboarding.md`, before the `## Environment variables` section:

```markdown
## The tracked phone number (AxeonCORE and up)

Built 2026-10-12 (slice 1 of `docs/superpowers/specs/2026-10-12-proof-lead-system-design.md`).
Every AxeonCORE client gets a local Twilio number that forwards to their cell,
records the call (after a short notice), and texts back any call they miss.

| Piece | Where |
| --- | --- |
| Number helpers, text-back copy | `lib/phoneShared.ts` |
| Twilio REST + signature check | `lib/twilio.ts` |
| TwiML | `lib/phoneTwiml.ts` |
| Provisioning, settings, calls, messages, opt-outs, month summary, cost | `lib/phoneLines.ts` |
| Webhooks | `app/api/phone/{voice,voice/status,recording,sms}` |
| Admin card | `components/insights/PhonePanel.tsx`, `/api/admin/onboarding/<token>/phone` |
| Client tab | `components/proof/CallsTab.tsx` via `lib/proofDashboardData.ts` |
| Tables | `phone_lines`, `phone_calls`, `phone_messages`, `phone_opt_outs` |
| Tests | `npm run test:phone` |

**Provisioning.** The admin's Phone card reads the portal's `phone-setup` answers,
takes an area code, and buys the first available local number with voice and SMS
webhooks pointed at `PHONE_WEBHOOK_ORIGIN`. A Messaging Service is created first;
the number is attached to it. The service is where the client's A2P 10DLC brand
and campaign are registered, by hand in the Twilio console for now. Until the
admin presses "Mark 10DLC approved", `sms_status` is `pending` and no automated
text leaves.

**Calls.** Inbound → `/api/phone/voice` answers TwiML that plays the recording
notice (if on) and dials the forward number with a 20-second timeout, dual-channel
recording from answer. The dial's `action` hits `/api/phone/voice/status`, which
writes the call (upsert on CallSid, since Twilio retries) and, on a miss, sends the
text-back if texting is approved, the caller has not opted out, and they were not
texted in the last 24 hours. `/api/phone/recording` attaches the recording URL.

**Texts.** Inbound texts land in `phone_messages`. STOP words are mirrored into
`phone_opt_outs` (Twilio's Advanced Opt-Out already blocks sends and confirms).
Replying from PROOF is slice 4.

**Where the numbers show.** The client's Calls tab (this month vs last, recent
calls with masked numbers, recordings) and the monthly report's `calls` figure,
filled only when Axeon has not typed one.

**Cost.** The admin card estimates the month from the two tables at the rates in
the spec. There are no subaccounts; usage is attributed by number.
```

- [ ] **Step 4: Run every test and the type check**

Run: `npm run test:phone && npm run test:onboarding && npm run lint`
Expected: all PASS; if `lib/postValidation.test.ts` asserted the old inbox wording, update that assertion to the new string.

- [ ] **Step 5: Commit**

```bash
git add lib/autoReports.ts data/pricingData.ts content/brand-guardrails.md docs/onboarding.md public lib/postValidation.test.ts
git commit -m "feat(phone): calls fill the monthly report; inbox copy matches what ships"
```

---

### Task 9: Go-live checklist (owner, not code)

No files. These are the steps only the owner can do, in order, after the branch is deployed to a preview and then to production.

- [ ] Add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` to Vercel (Production and Preview). Never paste them in chat.
- [ ] Set `PHONE_WEBHOOK_ORIGIN=https://axeonstudio.co` in Production. For a preview deployment, set it to that preview's URL or signatures fail.
- [ ] In the Twilio console, confirm Advanced Opt-Out is on for US messaging (it is by default).
- [ ] Provision a line for a test client (your own onboarding row), forward to your cell, call it: hear the notice, phone rings, answer, hang up; confirm a row in the admin Phone card with a recording within a minute.
- [ ] Call again and don't answer: confirm "Missed" and no text (10DLC still pending).
- [ ] Register the 10DLC brand and campaign for that Messaging Service (Trust Hub → A2P 10DLC). Standard low-volume: about $4.50 brand + $15 campaign vetting, then $1.50/mo. Wait for approval (one to seven days).
- [ ] Press "Mark 10DLC approved", miss a call, confirm the text arrives and the row reads "Missed · texted back". Reply STOP from the caller, confirm `phone_opt_outs` has the row and a second missed call sends nothing.
- [ ] Check the monthly report preview on the 1st shows the calls count.
- [ ] Release the test number from the Twilio console when done (or keep it as the demo line).
