# AxeonPROOF Lead System — Design

Date: 2026-10-12. Owner decision the same day: GoHighLevel is out ("I don't like it, I feel like it's not quality"). Every AxeonCORE lead feature moves into AxeonPROOF, built on commodity APIs that Axeon automates from its own code.

## Why

- AxeonCORE ($299/mo) promises: tracked phone numbers, call recording, missed-call text-back, instant call-back on form submit, AI chat and online scheduling, automatic texts and emails with one list of every lead, quote follow-up, appointment reminders, a quarterly reactivation text, review requests, and one inbox. All of it was going to be GHL.
- PROOF already has the dashboard, lead list, auth, crons, email (Resend), the onboarding answers, and an ingest pattern (`/api/t`). What's missing is a phone layer, a sequences engine, and a threads inbox.
- Hard cost per CORE client on this design is about $26/mo in usage (Twilio number, 10DLC, forwarded minutes, texts, chat tokens) versus a fixed GHL fee that only wins past ~10 clients.
- Axeon is a SaaS/marketing hybrid; features in PROOF compound into an owned product. Features in GHL compound into GHL.

## Scope: six slices, one plan each

Each slice ships on its own and is sellable on its own. Order matters: later slices reuse earlier tables and routes.

| # | Slice | What a CORE client gets | Plan |
|---|---|---|---|
| 1 | **Phone layer** | A tracked local number that forwards to their cell, records calls, texts back every missed call, and counts calls in PROOF and the monthly report. | `docs/superpowers/plans/2026-10-12-phone-layer.md` |
| 2 | **Call connect** | Form submit → Twilio rings the answerers, "press 1", bridges to the lead. Lead alert texts to the owner. | later |
| 3 | **Sequences** | Scheduled SMS/email: new-lead follow-up, quote follow-up (3 touches), appointment reminders, review request on job done, quarterly reactivation. Copy drafted by Claude from the portal's "how you sell" answers, reviewed by Axeon. | later |
| 4 | **Threads inbox** | Contacts keyed by phone number, a conversation thread per contact (texts, emails, calls, forms, web chat), reply from PROOF, push on new message. | later |
| 5 | **Booking + chat** | Cal.com embed and webhook into PROOF; a Claude chat widget on the client's site trained on their services and pages, booking through Cal.com, handing off to a text thread. | later |
| 6 | **Meta inbox + posting** | Facebook Messenger and Instagram DMs into the threads inbox; reels posting for GROWTH. Needs Meta Tech Provider App Review (weeks). Start the application during slice 1. | later |

Until slice 6 ships, the CORE feature line "One inbox for every text, email, Facebook, Instagram, and Google message" is changed to "One inbox for every text, email and website chat". The "Google message" part is already dead: Google Business Profile chat shut down July 2024.

## Architecture (all slices)

- **One Twilio account** (master). No subaccounts in v1: webhooks are signed with the owning account's token, and storing per-client tokens needs encryption the repo doesn't have. Per-client cost is derived from `phone_calls` and `phone_messages` instead.
- **One Twilio Messaging Service per client.** It carries the client's A2P 10DLC campaign and the client's number. 10DLC brand and campaign are submitted by hand in the Twilio console (Trust Hub) under that service in v1; `phone_lines.sms_status` is flipped to `ready` by the admin when approved. No automated text is ever sent while `sms_status` is `pending`.
- **Webhooks are Next.js route handlers** under `app/api/phone/*`, validated with Twilio's `X-Twilio-Signature` (HMAC-SHA1 over the exact public URL plus sorted POST params). Public URL base is `PHONE_WEBHOOK_ORIGIN` (defaults to `https://axeonstudio.co`).
- **Tables** live in `lib/db.ts` `ensureSchema()` and are mirrored in `scripts/init-db.mjs`, like every other table. Names: `phone_lines`, `phone_calls`, `phone_messages`, `phone_opt_outs` (slice 1); `contacts`, `threads`, `sequence_runs` (later slices).
- **Phone numbers are stored E.164** (`+15155550134`). Display is `(515) 555-0134`. Masked display (client dashboard, lists that get screenshotted) is `(515) 555-01··`, matching `maskPhone` in `lib/onboarding.ts`.
- **Modules follow the repo split:** `lib/<thing>Shared.ts` is client-safe (types + pure helpers, tested with `tsx --test`), `lib/<thing>.ts` is server-only (SQL, Twilio). Admin API lives at `app/api/admin/onboarding/[token]/<thing>/route.ts` behind `requireAdmin`; client API under `app/api/proof/*`.
- **PROOF data** is loaded once in `lib/proofDashboardData.ts` so the client page and the admin "View as client" preview never drift.

## Slice 1 design: phone layer

### Flow

1. Admin opens the client's page, sees the Phone card prefilled from the portal's `phone-setup` answers (`mainNumber`, `trackingPreference`, `answerers`), picks an area code, presses **Provision**.
2. `provisionLine()` creates the Messaging Service, searches a local number in that area code, buys it with voice and SMS webhooks pointed at Axeon, attaches it to the service, and writes `phone_lines`.
3. Inbound call → `POST /api/phone/voice` → TwiML: optional "This call may be recorded" notice, then `<Dial>` to `forward_to`, 20-second timeout, dual-channel recording from answer, `action` = `/api/phone/voice/status`. Caller ID stays the caller's own number so the client sees who is calling.
4. `POST /api/phone/voice/status` (DialCallStatus): `completed` = answered; `busy`, `no-answer`, `failed`, `canceled` = missed. The call row is written. On missed, if `text_back_enabled` and `sms_status = ready` and the caller has not opted out and has not been texted back in the last 24 hours, the text-back is sent through the Messaging Service and `text_back_sent_at` is set. TwiML reply says "Sorry we missed you, we just sent you a text" when a text went out, otherwise hangs up.
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

## Later-slice notes (so slice 1 leaves the right hooks)

- `phone_calls.from_number` and `phone_messages.from_number` are the contact key for slice 4's `contacts` table; keep them E.164.
- Slice 2 reuses `sendSms()` and the Messaging Service for lead alerts, and adds `<Dial>` with a `<Number url>` whisper for the "press 1" bridge.
- Slice 3's scheduler is a daily-plus-hourly cron in `vercel.json` that reads `sequence_runs`; it sends through the same `sendSms()` and `lib/email.ts`.
- The portal needs `accept` items for Facebook page and Instagram connection before slice 6; add them then, not now.
