# AxeonPROOF Lead System — Design

Date: 2026-10-12. Owner decision the same day: GoHighLevel is out ("I don't like it, I feel like it's not quality"). Every AxeonCORE lead feature moves into AxeonPROOF, built on commodity APIs that Axeon automates from its own code.

## Why

- AxeonCORE ($299/mo) promises: tracked phone numbers, call recording, missed-call text-back, instant call-back on form submit, AI chat and online scheduling, automatic texts and emails with one list of every lead, quote follow-up, appointment reminders, a quarterly reactivation text, review requests, and one inbox. All of it was going to be GHL.
- PROOF already has the dashboard, lead list, auth, crons, email (Resend), the onboarding answers, and an ingest pattern (`/api/t`). What's missing is a phone layer, a sequences engine, and a leads inbox (the "CRM", sized the way Scorpion sizes it: one unified leads view, not pipelines).
- Hard cost per CORE client on this design is about $26/mo in usage (Twilio number, 10DLC, forwarded minutes, texts, chat tokens) versus a fixed GHL fee that only wins past ~10 clients.
- Axeon is a SaaS/marketing hybrid; features in PROOF compound into an owned product. Features in GHL compound into GHL.

## Scope: six slices, one plan each

Each slice ships on its own and is sellable on its own. Order matters: later slices reuse earlier tables and routes.

| # | Slice | What a CORE client gets | Plan |
|---|---|---|---|
| 1 | **Phone layer** | A tracked local number that forwards to their cell, records calls, texts back every missed call, and counts calls in PROOF and the monthly report. | `docs/superpowers/plans/2026-10-12-phone-layer.md` |
| 2 | **Call connect** | Form submit → Twilio rings the answerers, "press 1", bridges to the lead. Lead alert texts to the owner. | later |
| 3 | **Sequences** | Scheduled SMS/email: new-lead follow-up, quote follow-up (3 touches), appointment reminders, review request on job done, quarterly reactivation. Copy drafted by Claude from the portal's "how you sell" answers, reviewed by Axeon. | later |
| 4 | **Leads inbox** | One list of every lead: a contact per phone number or email, a stage, a timeline of every call, text, form, booking and chat, the recording attached, and a reply box. This is the "CRM". See "Slice 4 design" below. | later |
| 5 | **Booking + chat** | Cal.com embed and webhook into PROOF; a Claude chat widget on the client's site trained on their services and pages, booking through Cal.com, handing off to a text thread. | later |
| 6 | **Meta inbox + posting** | Facebook Messenger and Instagram DMs into the threads inbox; reels posting for GROWTH. Needs Meta Tech Provider App Review (weeks). Start the application during slice 1. | later |

Until slice 6 ships, the CORE feature line "One inbox for every text, email, Facebook, Instagram, and Google message" is changed to "One inbox for every text, email and website chat". The "Google message" part is already dead: Google Business Profile chat shut down July 2024.

## Architecture (all slices)

- **One Twilio account** (master). No subaccounts in v1: webhooks are signed with the owning account's token, and storing per-client tokens needs encryption the repo doesn't have. Per-client cost is derived from `phone_calls` and `phone_messages` instead.
- **One Twilio Messaging Service per client.** It carries the client's A2P 10DLC campaign and the client's number. 10DLC brand and campaign are submitted by hand in the Twilio console (Trust Hub) under that service in v1; `phone_lines.sms_status` is flipped to `ready` by the admin when approved. No automated text is ever sent while `sms_status` is `pending`.
- **Webhooks are Next.js route handlers** under `app/api/phone/*`, validated with Twilio's `X-Twilio-Signature` (HMAC-SHA1 over the exact public URL plus sorted POST params). Public URL base is `PHONE_WEBHOOK_ORIGIN` (defaults to `https://axeonstudio.co`).
- **Tables** live in `lib/db.ts` `ensureSchema()` and are mirrored in `scripts/init-db.mjs`, like every other table. Names: `phone_lines`, `phone_calls`, `phone_messages`, `phone_opt_outs` (slice 1); `contacts`, `contact_events`, `sequence_runs` (later slices).
- **Phone numbers are stored E.164** (`+15155550134`). Display is `(515) 555-0134`. Masked display (client dashboard, lists that get screenshotted) is `(515) 555-01··`, matching `maskPhone` in `lib/onboarding.ts`.
- **Modules follow the repo split:** `lib/<thing>Shared.ts` is client-safe (types + pure helpers, tested with `tsx --test`), `lib/<thing>.ts` is server-only (SQL, Twilio). Admin API lives at `app/api/admin/onboarding/[token]/<thing>/route.ts` behind `requireAdmin`; client API under `app/api/proof/*`.
- **PROOF data** is loaded once in `lib/proofDashboardData.ts` so the client page and the admin "View as client" preview never drift.

## Slice 1 design: phone layer

### Flow

1. Admin opens the client's page, sees the Phone card prefilled from the portal's `phone-setup` answers (`mainNumber`, `trackingPreference`, `answerers`), picks an area code, presses **Provision**.
2. `provisionLine()` creates the Messaging Service, searches a local number in that area code, buys it with voice and SMS webhooks pointed at Axeon, attaches it to the service, and writes `phone_lines`.
3. Inbound call → `POST /api/phone/voice` → TwiML: optional "This call may be recorded" notice, then `<Dial>` to `forward_to`, 20-second timeout, dual-channel recording from answer, `action` = `/api/phone/voice/status`. Caller ID stays the caller's own number so the client sees who is calling.
4. `POST /api/phone/voice/status` (DialCallStatus): `completed` = answered; `busy`, `no-answer`, `failed`, `canceled` = missed. Known gap: a carrier voicemail answering the forwarded leg also reports `completed`, so a declined or unreachable cell counts as answered in slice 1; slice 2's call-screening whisper (press 1 to accept) closes it and is the first task of that plan. The call row is written. On missed, if `text_back_enabled` and `sms_status = ready` and the caller has not opted out and has not been texted back in the last 24 hours, the text-back is sent through the Messaging Service and `text_back_sent_at` is set. TwiML reply says "Sorry we missed you, we just sent you a text" when a text went out, otherwise hangs up.
5. `POST /api/phone/recording` → stores `recording_url` and `recording_seconds` on the call by CallSid.
6. `POST /api/phone/sms` → stores the inbound message. A body matching STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT marks the sender opted out (Twilio's Advanced Opt-Out already sends the confirmation and blocks further sends; we mirror it so our own code never tries). Replies with an empty `<Response/>`.
7. PROOF Calls tab shows this month and last month: calls, answered, missed-and-texted-back, average length, plus a recent-calls list with masked numbers. The ghost example only shows when the plan is locked.
8. The monthly report job fills `calls` from `phone_calls` when Axeon has not typed a number for that month (fills blanks only, like the audit numbers).

### Tables

```
phone_lines
  id SERIAL, onboarding_id INT UNIQUE → onboardings(id) ON DELETE CASCADE
  phone_number TEXT UNIQUE (E.164), phone_number_sid TEXT, messaging_service_sid TEXT
  forward_to TEXT (E.164), area_code TEXT
  record_calls BOOL DEFAULT true, consent_notice BOOL DEFAULT true
  text_back_enabled BOOL DEFAULT true, text_back_message TEXT
  sms_status TEXT CHECK IN ('pending','ready') DEFAULT 'pending'
  status TEXT CHECK IN ('active','released') DEFAULT 'active'
  created_at, updated_at TIMESTAMPTZ

phone_calls
  id BIGSERIAL, onboarding_id INT → onboardings(id) ON DELETE CASCADE
  call_sid TEXT UNIQUE, from_number TEXT, to_number TEXT
  outcome TEXT CHECK IN ('answered','missed'), dial_status TEXT
  started_at TIMESTAMPTZ, duration_seconds INT
  recording_url TEXT, recording_seconds INT
  text_back_sent_at TIMESTAMPTZ
  created_at TIMESTAMPTZ

phone_messages
  id BIGSERIAL, onboarding_id INT → onboardings(id) ON DELETE CASCADE
  message_sid TEXT UNIQUE, direction TEXT CHECK IN ('inbound','outbound')
  from_number TEXT, to_number TEXT, body TEXT
  kind TEXT CHECK IN ('text_back','manual','inbound'), status TEXT
  created_at TIMESTAMPTZ

phone_opt_outs
  onboarding_id INT, phone_number TEXT, created_at TIMESTAMPTZ, PRIMARY KEY (onboarding_id, phone_number)
```

### Compliance written into code

- No automated text while `sms_status = 'pending'`.
- STOP words mark the number opted out for that client; every outbound send checks the table first.
- Text-back is transactional (a reply to the caller's own action seconds earlier), so it is not subject to quiet hours. Sequences (slice 3) are, and will carry a quiet-hours rule.
- Recording: `consent_notice` plays "This call may be recorded for quality" before the dial. Iowa is one-party consent; the notice covers callers from two-party states. Default on.
- One text-back per caller per client per 24 hours.

### Environment

```
TWILIO_ACCOUNT_SID=        # master account
TWILIO_AUTH_TOKEN=         # signs webhooks and authenticates REST calls
PHONE_WEBHOOK_ORIGIN=      # optional; defaults to https://axeonstudio.co. Must be the public origin Twilio calls.
```

### Non-goals for slice 1

- Outbound calls from the tracking number (no softphone). The client calls back from their cell.
- Sending texts from PROOF (slice 4).
- Automatic 10DLC submission (manual in console; `sms_status` gate in code).
- Dynamic number insertion on the client site: the tracking number is the number on the site and on Google if the client chose "publish a new tracking number"; otherwise the number is site-only. Admin decides from the portal answer.

### Cost model per client

Number $1.15/mo; 10DLC low-volume standard $1.50/mo; forwarded call = inbound leg $0.0085/min + outbound leg $0.014/min; recording $0.0025/min; SMS $0.0083 + ~$0.003 carrier fee per segment. The admin Phone card shows the running month's estimate from the two tables.

## Slice 4 design: the leads inbox (what Scorpion does, sized for Axeon)

### Why not a CRM

The owner asked how hard a CRM in PROOF is and how Scorpion does it. The answer: Scorpion does not sell a CRM. Its platform is a **unified leads view**: every call, form, chat and booking a client's marketing produces lands as one lead row with a source, a status, a timeline, and the recording or transcript attached, with AI lead scoring on top. Scorpion built its own call tracking and telephony over twenty years and owns the number, so every touch is already in its database. For anything heavier (jobs, invoices, dispatch) it integrates with the client's field-service or practice software (ServiceTitan, Housecall Pro, Jobber, Dentrix) rather than replacing it.

PROOF should do the same and stop there. A home-service owner with a cell phone does not want pipelines, deals, tasks or custom objects. They want one list that answers: who reached out, from where, did we get back to them, did we book it. That is a **leads inbox**, and it is about a week of work once slice 1 exists because slice 1 writes every call and text with an E.164 key.

### What the client sees

The existing PROOF **Leads** tab (today a list of contact clicks from `site_events` with a "Customer" / "Not" tap) becomes the inbox. One row per contact, newest activity first:

```
Mike R. · (515) 555-01··        Called · 2 min ago · missed, texted back       New
Sarah K. · sarah@…              Form · Tue · "water heater quote"              Booked
(319) 555-02··                  Texted · Mon · "still open Saturday?"          Replied
```

Tapping a row opens the contact:

- **Header:** name if we have one, masked number or email, source of first touch (Google, site form, Facebook ad campaign from `utm_*`, direct call), first seen, last activity.
- **Stage** chips: `New` → `Contacted` → `Booked` → `Won` / `Lost`. `Won` and `Lost` replace today's "Customer" / "Not" outcome and keep feeding the close rate in `lib/siteStats.ts`. Stages move by hand (client taps) or by code (a booking webhook sets `Booked`; an outbound text or answered call sets `Contacted`).
- **Timeline:** every event for that contact in order: calls (outcome, length, play button on the recording), texts (both directions, the text-back marked as automatic), forms (fields as submitted), bookings (from slice 5), chat transcripts (slice 5), contact clicks from the site tracker, and later Messenger/IG (slice 6).
- **Reply box:** send a text from the client's tracking number. Email reply opens their mail app (`mailto:`), no email sending from PROOF in this slice.
- **Push:** a new inbound text, missed call or form sends the client a push notification (PROOF is already installable as a PWA; the push subscription is the one new client-side piece) and, as a fallback, a text to the owner's cell through the Messaging Service. Lead alerts are the same mechanism slice 2 uses.

Nothing else. No tasks, no pipeline view, no custom fields, no import. If a client asks for those they are a ServiceTitan or Jobber customer, and the right move is the integration Scorpion makes, not a bigger PROOF.

### Tables

```
contacts
  id BIGSERIAL, onboarding_id INT → onboardings(id) ON DELETE CASCADE
  phone TEXT (E.164, nullable), email TEXT (lowercase, nullable), name TEXT
  stage TEXT CHECK IN ('new','contacted','booked','won','lost') DEFAULT 'new'
  source TEXT            -- 'call' | 'text' | 'form' | 'chat' | 'booking' | 'click' | 'messenger' | 'instagram'
  utm_source, utm_medium, utm_campaign TEXT   -- copied from the first site_events row that matches
  first_seen_at, last_activity_at, stage_changed_at TIMESTAMPTZ
  UNIQUE (onboarding_id, phone) WHERE phone IS NOT NULL
  UNIQUE (onboarding_id, email) WHERE email IS NOT NULL

contact_events
  id BIGSERIAL, contact_id BIGINT → contacts(id) ON DELETE CASCADE, onboarding_id INT
  kind TEXT CHECK IN ('call','text_in','text_out','form','booking','chat','click','note')
  ref_table TEXT, ref_id BIGINT       -- points at phone_calls / phone_messages / site_events / bookings
  summary TEXT                        -- one line for the list: "missed, texted back", "water heater quote"
  payload JSONB                       -- form fields, chat transcript, booking time; never the recording itself
  created_at TIMESTAMPTZ
  INDEX (onboarding_id, created_at), INDEX (contact_id, created_at)
```

`contact_events` is a projection: the source of truth stays in `phone_calls`, `phone_messages`, `site_events` and the slice-5 tables. The projection exists so the inbox is one indexed read per client, not a five-table union at request time.

### Dedupe rules (the hard part)

- A phone number is the identity. Every inbound call or text upserts a contact by `(onboarding_id, phone)`.
- A form with a phone number joins that contact; a form with only an email upserts by `(onboarding_id, email)`.
- When a later event carries both a phone and an email that belong to two different contacts, the two are merged into the older row and the newer row's events are re-pointed. Merging is automatic only on this exact case; the client cannot merge by hand in this slice.
- Site tracker contact clicks have no identity (a `tel:` click does not tell us who clicked). They are attached to a contact only when a call or text from a new number arrives within 10 minutes of a `tel:` click on that client's site, and the match is recorded as the lead's source (`click` → `call`). Otherwise the click stays an anonymous row in the Leads tab as it is today.
- Names come from forms, from chat, or from the client typing one in the header. Never from a carrier lookup in this slice.

### Compliance

- Replies from the inbox go through the same `sendSms()` and obey `phone_opt_outs` and the `sms_status` gate. An opted-out contact shows a "This person asked not to be texted" banner and the reply box is disabled.
- Quiet hours apply to manual replies the same as to sequences: a reply typed between 9 pm and 8 am client-local is held and sent at 8 am, with the client told so.
- Recordings stream from Twilio behind an authenticated PROOF route; the recording URL is never put in a notification or the client's email.

### Later integrations, not in scope

Jobber, Housecall Pro and ServiceTitan each have a public API that accepts a new customer or request. If a client runs one of those, a per-client "send booked leads to" switch is the whole integration. It is noted here so the `contacts` shape stays compatible (phone, email, name, source, first address-free), and it is not built until a client asks.

## Later-slice notes (so slice 1 leaves the right hooks)

- `phone_calls.from_number` and `phone_messages.from_number` are the contact key for slice 4's `contacts` table; keep them E.164. Slice 4 backfills `contacts` and `contact_events` from every `phone_calls` and `phone_messages` row that exists when it ships, so slice 1 must never store a number in any other format or drop the `From` of a missed call.
- Slice 1's `recentCalls()` list (Calls tab) is the first version of the slice-4 timeline; keep its `PhoneCall` row shape (`fromNumber`, `outcome`, `startedAt`, `durationSeconds`, `recordingUrl`, `textBackSentAt`) stable so the inbox can render the same rows.
- Slice 2 reuses `sendSms()` and the Messaging Service for lead alerts, and adds `<Dial>` with a `<Number url>` whisper for the "press 1" bridge.
- Slice 3's scheduler is a daily-plus-hourly cron in `vercel.json` that reads `sequence_runs`; it sends through the same `sendSms()` and `lib/email.ts`.
- The portal needs `accept` items for Facebook page and Instagram connection before slice 6; add them then, not now.


## Slices 2 to 6: designs (added 2026-10-13, owner instruction "build every layer")

These sections are the binding design for the remaining slices. Where they revise an earlier line in this document, the later text wins. Decisions marked **Ruling** were made by the executor without the owner, with the reason, and are reversible.

### Cross-slice decisions

- **Ruling: client-site forms post to PROOF, not Formspree.** `POST https://axeonstudio.co/api/lead` accepts form-encoded or JSON with `site` (the client's tracking site key, the same one `t.js` carries), `name`, `phone`, `email`, `message`, optional `page`, `utm_*`, and a honeypot field `company_website` that must be empty. On success it redirects to the form's `redirect` field or returns `{ ok: true }` for JSON. Existing client sites switch by changing the form action and adding the hidden `site` input; new builds ship that way. Reason: call connect, alerts, sequences and the inbox all need the submission in our database within a second, and Formspree cannot do that.
- **Ruling: no third-party booking.** Cal.com needs an account and an API key per client, which is the per-client-secret problem the Twilio design avoided. Booking is built in-house (slice 5).
- **Ruling: push via web-push.** `WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_PRIVATE_KEY` (VAPID, generated once by the owner with `npx web-push generate-vapid-keys`) and a `push_subscriptions` table. Until the keys exist, every alert falls back to an SMS to the owner's cell through the client's own line (`kind = 'alert'`) and an email through Resend.
- **Ruling: one secrets helper.** `lib/secretBox.ts`: AES-256-GCM with `SECRETS_KEY` (32 bytes, base64, generated once by the owner). Used by slice 6 for Meta page tokens. Nothing else stores a third-party secret per client.
- **Quiet hours** apply to every automated outbound text except the transactional missed-call text-back: nothing sends between 8 pm and 8 am in the client's time zone (add `phone_lines.time_zone TEXT DEFAULT 'America/Chicago'`, editable on the admin card). A send that falls in quiet hours is held to 8 am.
- **Kinds.** `phone_messages.kind` grows to `('text_back','manual','inbound','alert','sequence','confirm','reminder')`.
- **Tier gating.** Call connect, sequences, inbox, booking, chat: AxeonCORE and up. Reels posting: AxeonGROWTH. The admin cards are hidden for Essentials exactly like the Phone card.

### Slice 2 design: call connect, lead intake, alerts, call screening

**Flow.**
1. A form posts to `/api/lead`. The route resolves the site key to the onboarding (same lookup `/api/t` uses), validates, writes `form_submissions`, and responds. Everything else runs after the response via `after()` from `next/server`.
2. **Alerts**: email to the client (a lead-notification template with the fields and a link to PROOF), and an SMS to `forward_to` through the client's line (`kind = 'alert'`, obeys the 10DLC gate; if the line is not ready, email only). Push later (slice 4).
3. **Call connect** (if the line exists, `call_connect_enabled`, the lead left a US phone, and it is not quiet hours): Twilio REST creates an outbound call from the tracking number to `forward_to` with `url = /api/phone/connect?lead=<id>` and a status callback. The TwiML says "New lead from your website: <name>. Press 1 to call them now." in a `<Gather numDigits="1" timeout="8">`. On `1`, the route returns `<Dial callerId="<tracking number>" record="record-from-answer-dual" recordingStatusCallback=…><Number>lead phone</Number></Dial>`. No key: "Okay, we texted you their details" and hang up. The call row is written with `direction = 'connect'` and `lead_id`.
4. **Call screening** (closes the slice-1 voicemail gap). `forwardTwiml` dials `<Number url="/api/phone/voice/screen">forward_to</Number>` when `screen_calls` is on (default on). The screen route answers the child leg with `<Gather numDigits="1" timeout="5"><Say>Call for <business>. Press 1 to accept.</Say></Gather><Hangup/>`; Gather's action returns an empty `<Response/>`, which bridges. Voicemail never presses 1, so the child leg hangs up. Since Twilio's December 2020 change a hang-up in the screening URL reports `DialCallStatus=completed` with `DialBridged=false`; the status route treats `DialBridged=false` as missed, so text-back fires.

**Tables.**
```
form_submissions (id BIGSERIAL, onboarding_id FK CASCADE, name TEXT, phone TEXT E.164|null, email TEXT lowercase|null, message TEXT, page TEXT, utm_source/utm_medium/utm_campaign TEXT, ip_hash TEXT, created_at)
phone_lines + screen_calls BOOL DEFAULT true, call_connect_enabled BOOL DEFAULT true, time_zone TEXT DEFAULT 'America/Chicago'
phone_calls + direction TEXT CHECK ('inbound','connect') DEFAULT 'inbound', lead_id BIGINT NULL
phone_messages.kind CHECK widened (see Kinds)
```
Rate limit: 5 submissions per IP hash per 10 minutes per site, checked against `form_submissions.ip_hash` and `created_at` (an in-memory map is useless on serverless).

**Twilio additions** (`lib/twilio.ts`): `createCall({ from, to, url, statusCallback }): { sid }`.
**Admin card**: toggles for screening and call connect, the time zone, and a "Send test lead" button that posts a fake submission for that client.
**PROOF**: the Leads tab lists form submissions alongside tracker leads (the full inbox is slice 4; here it is a row per submission with name, masked phone, page, time, and whether the owner pressed 1).
**Docs**: how to switch a client site's form; the `t.js` snippet and the form snippet side by side.

### Slice 3 design: sequences

**What runs.**
| Sequence | Trigger | Steps (default) | Stops when |
|---|---|---|---|
| new_lead | form submission, or a missed call with no reply in 30 min | +5 min SMS "got your request, calling you shortly"; +1 day email; +3 days SMS | contact replies, is marked Contacted/Booked/Won/Lost, or STOP |
| quote | client taps "Quote sent" on a lead | +1 day SMS; +3 days email; +7 days SMS | reply, Won/Lost, STOP |
| reminder | a booking (slice 5) | −24 h SMS; −2 h SMS | booking cancelled |
| review | client taps Won | +2 h SMS with the Google review link | always one step |
| reactivation | quarterly cron, past-customer list | one SMS per contact, spread over the quarter's first week, max 50/day per client | STOP |

**Tables.**
```
sequence_templates (id, onboarding_id FK, kind TEXT, steps JSONB [{ offset_minutes, channel 'sms'|'email', subject?, body }], enabled BOOL DEFAULT false, updated_at, UNIQUE(onboarding_id, kind))
sequence_runs (id BIGSERIAL, onboarding_id FK, kind, contact_phone TEXT|null, contact_email TEXT|null, contact_name TEXT, ref_table TEXT, ref_id BIGINT, step INT DEFAULT 0, next_at TIMESTAMPTZ, status TEXT CHECK ('active','done','stopped'), stop_reason TEXT, created_at, updated_at; INDEX (status, next_at))
past_customers (id, onboarding_id FK, name, phone E.164, email, last_job_at DATE, consent_attested_at TIMESTAMPTZ, source TEXT 'csv', created_at; UNIQUE(onboarding_id, phone))
```
**Engine.** `app/api/cron/sequences` every 15 minutes (`*/15 * * * *` in vercel.json): select due `active` runs, up to 200 per tick, send the step through `sendClientSms(kind 'sequence')` or `sendSequenceEmail` (Resend, from `"<Business> via Axeon" <leads@axeonstudio.co>`, reply-to the client's email), advance `step`, set `next_at` to the next offset or mark done. Quiet hours shift `next_at` to 8 am local. Templates render `{name}`, `{business}`, `{owner_first}`, `{review_link}`, `{booking_link}` with a strict allow-list; unknown braces render empty.
**Stops.** The inbound SMS route stops every active run for that `(onboarding_id, from_number)`. A stage change (slice 4; in slice 3 the Leads tab's taps) stops the matching kinds. STOP stops all.
**Copy.** "Draft with Claude" on the admin Sequences card calls `lib/anthropic.ts` with the portal's `sales-process.*`, `reviews.jobDoneSignal`, `exit-offer.offer` answers and the business name, returns the five templates as JSON (validated against the step schema), saved as a draft the admin edits and enables. Axeon reviews before enabling; nothing sends while a template is `enabled = false`. Every SMS body ends with "Reply STOP to opt out." on the first step of each sequence.
**Past-customer upload.** Admin uploads a CSV (name, phone, email, last job date) with a required checkbox attesting the client has consent to text these customers; the attestation time is stored per row. The reactivation sequence sends only to rows with `consent_attested_at`.

### Slice 4 additions (leads inbox; design above stands)

- `contact_events.kind` also gets `'alert'`, `'sequence'`, `'reminder'`, `'messenger'`, `'instagram'`.
- **Backfill** on first deploy: a one-shot admin endpoint `POST /api/admin/contacts/backfill` builds contacts from `phone_calls`, `phone_messages`, `form_submissions` in `created_at` order, idempotent.
- **Push**: `push_subscriptions (id, account_id FK client_accounts, endpoint TEXT UNIQUE, p256dh, auth, created_at)`; `public/sw.js` service worker; a "Turn on notifications" button in PROOF's header; `lib/push.ts` wraps `web-push`. Fallback when no subscription: SMS alert (slice 2 path).
- **Stages drive sequences**: Contacted/Booked/Won/Lost stop `new_lead` and `quote`; Won starts `review`; "Quote sent" starts `quote`.

### Slice 5 design: booking and website chat

**Booking (in-house).**
```
booking_settings (onboarding_id PK FK, enabled BOOL, slot_minutes INT DEFAULT 60, buffer_minutes INT DEFAULT 15, lead_days INT DEFAULT 14, hours JSONB { mon: [["08:00","17:00"]], … }, service_names TEXT[], confirm_message TEXT, updated_at)
bookings (id BIGSERIAL, onboarding_id FK, contact_name, phone E.164, email, service TEXT, starts_at TIMESTAMPTZ, ends_at, status CHECK ('booked','cancelled','done'), source CHECK ('widget','chat','manual'), cancel_token TEXT UNIQUE, created_at; INDEX (onboarding_id, starts_at))
```
Public: `GET /api/book/<site>/slots?from=&to=` returns open slots from hours minus existing bookings and buffer, in the client's time zone; `POST /api/book/<site>` books (phone required, US only), writes a contact event, sends confirmation SMS + email with an `.ics`, schedules reminders (slice 3), alerts the owner, sets the contact to Booked. Cancel link `/b/<site>/cancel/<token>`. Hosted page `/b/<site>` (server-rendered, mobile-first, brand-neutral) and an embed `public/book.js` that mounts the same UI into `<div data-axeon-book>`. Admin card: hours grid, slot length, services, enable; a list of upcoming bookings with cancel. PROOF Bookings tab becomes real (count this month, next 7 days list, done vs cancelled).

**Chat widget.**
```
site_pages (id, onboarding_id FK, url TEXT, title, text TEXT, fetched_at; UNIQUE(onboarding_id, url))
chat_sessions (id TEXT PK random, onboarding_id FK, visitor TEXT, phone E.164|null, name, created_at, last_at)
chat_messages (id BIGSERIAL, session_id FK, role CHECK ('user','assistant','tool'), content TEXT, created_at)
```
`public/chat.js` injects a bubble; `POST /api/chat/<site>` with `{ session, message }` streams a Claude response (`claude-sonnet-5-5` for cost; `lib/anthropic.ts` already has the client). System prompt: the business name, services, hours, service area and the portal's answers, plus the top 20 `site_pages` texts truncated to 12k chars. Tools: `offer_booking` (returns the next 6 open slots, books on confirmation), `take_message` (requires a phone number; creates a `form_submissions` row, which triggers slice 2 alerts and the new_lead sequence), `handoff` (texts the owner and tells the visitor they will hear back). Guardrails in the prompt: never quote prices not on the site, never promise a time without a booking, always offer to take a number. Rate limit 30 messages per session, 200 per site per hour. Admin card: "Train on site" (crawls the client's sitemap or homepage links, same-origin only, max 40 pages, stores text), greeting, enable, and a transcript viewer. Transcripts land in the inbox as `chat` events once a phone number is known.

### Slice 6 design: Facebook Messenger and Instagram DMs, reels posting

**Gate.** Nothing here can be verified until Meta approves the app for `pages_messaging`, `instagram_manage_messages`, `instagram_content_publish`. Build behind `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `SECRETS_KEY`; every route returns 503 "not configured" without them. Unit tests cover the webhook verify handshake, the `X-Hub-Signature-256` check, and payload parsing from Meta's documented samples.

**Connect.** Portal item (kind `accept`) "Connect your Facebook page and Instagram" → `/api/meta/connect?token=<onboarding token>` → Facebook Login with the three scopes → callback exchanges the code, lists the user's pages, stores each selected page's long-lived page token encrypted in `meta_pages (id, onboarding_id FK, page_id TEXT UNIQUE, page_name, ig_user_id TEXT|null, token_enc TEXT, connected_at)`, and subscribes the page to the app's webhook.
**Inbound.** `GET /api/meta/webhook` answers the verify challenge; `POST` verifies the signature, maps the page or IG account to the onboarding, upserts a contact keyed by the sender's PSID (`contacts` gains `messenger_psid TEXT`, `instagram_id TEXT` with partial unique indexes), writes a `contact_events` row of kind `messenger` or `instagram`, pushes/alerts like a text.
**Reply.** The inbox reply box sends through the Send API when the thread's last inbound is a Messenger or IG message (24-hour messaging window enforced; outside it the box says so and offers SMS if a phone is known).
**Reels (GROWTH).** `social_posts (id, onboarding_id FK, platform CHECK ('instagram','facebook'), kind 'reel', video_url TEXT, caption TEXT, scheduled_at, status CHECK ('draft','scheduled','published','failed'), remote_id, error, created_at)`. Admin: upload a video to Vercel Blob (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN`), caption, schedule. Cron `/api/cron/social` hourly publishes due posts via the IG container → publish flow and the Page video endpoint. The PROOF social area shows published reels with reach pulled daily.

### Execution order and what each slice must leave behind

2 → 3 → 4 → 5 → 6. Slice 2 leaves `form_submissions` and the alert path; slice 3 leaves the engine and `stopRunsFor(onboardingId, phone)`; slice 4 leaves `contacts`, `upsertContactEvent(...)` and push; slice 5 writes bookings and chat through those; slice 6 adds adapters only.
