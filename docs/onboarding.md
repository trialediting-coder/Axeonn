# Client onboarding portal

Built 2026-10-06. Replaces the back-and-forth of collecting Google access, logins,
photos and business details from low-ticket clients with one private page per
client: `https://axeonstudio.co/welcome/<token>`.

## The idea

Every item a plan needs is sorted into three buckets, defined in
`data/onboardingItems.ts`:

| Kind | Who does it | What the client sees |
| --- | --- | --- |
| `axeon` | Axeon, never the client | Greyed row with "In progress" / "Set up" (GA4, Search Console, hosting, quote form, report) |
| `accept` | Axeon sends a platform invite, client taps Accept | Numbered steps plus one "I accepted" button (Google Business Profile, calendar, Google Ads, Meta) |
| `confirm` | Client confirms a short, prefilled card | A few fields and "Looks right, save it" (business details, services, lead routing, phone setup, sales process) |

Higher plans include everything below them. Essentials asks the client for 7
things; AxeonCORE adds 5; AxeonGROWTH adds 6. Launch never waits on any of them.

Hard rule: no field may collect a password or login. Access always goes
through the platform's own invite flow and the portal only records "accepted".
`assertNoCredentialFields()` in `lib/onboarding.ts` fails the test suite if an
item ever asks for one.

## Security model

- The link holds a 20-character random token (31-letter alphabet, about 99 bits).
  Lookups answer the same generic 404 for missing, malformed and closed tokens.
- First visit on any device: a 6-digit code is emailed to the address that paid
  through Stripe. Codes are stored as a salted SHA-256 hash, live 10 minutes,
  work once, lock after 5 wrong tries, 60s resend cooldown, 12 sends per link.
- A verified device gets an HMAC-signed, httpOnly cookie for 30 days
  (`axeon_welcome_<token>`, signed with `ONBOARDING_COOKIE_SECRET` or `AUTH_SECRET`).
- Per-IP rate limits on the code, verify and save routes (`lib/welcomeApi.ts`).
- Phone numbers and other sensitive answers show masked (last 4) once saved.
- The portal turns read-only 60 days after completion, and immediately when an
  admin closes it.
- Admin routes and pages sit behind the existing `/admin` auth.

## What exists

| Piece | Where |
| --- | --- |
| Item definitions per plan | `data/onboardingItems.ts` |
| Tokens, codes, cookie, validation, DB | `lib/onboarding.ts` |
| Purchase → portal + welcome email (idempotent) | `lib/onboardingFulfillment.ts` |
| Client page | `app/welcome/[token]/page.tsx`, `components/welcome/*` |
| Public API (code, verify, save item) | `app/api/welcome/[token]/*` |
| Admin board + detail | `/admin/onboarding`, `components/insights/Onboarding*.tsx` |
| Admin API (list, mint, mark done, nudge, close) | `app/api/admin/onboarding/*` |
| Emails (welcome, code, nudge) | `lib/email.ts` |
| Stripe hook | `app/api/stripe/webhook/route.ts` → `startOnboarding()` |
| Tables | `onboardings`, `onboarding_items` in `lib/db.ts` and `scripts/init-db.mjs` |
| Tests | `npm run test:onboarding` |

## How it fires

1. Stripe `checkout.session.completed` (paid or processing) with `metadata.tier`
   or `metadata.plan_key` mapping to a plan. One portal per email: a second
   purchase reuses the open one and upgrades its tier if higher. Mail failures
   are logged, never retried through Stripe; the board shows "welcome not sent"
   with a resend button.
2. The client opens the link, enters the code, works the checklist. Every save is
   one PATCH; completion flips to `complete` when all client items are done.
3. The admin board shows every client, completion, last activity, and who is
   stale. The detail view marks Axeon items done (the client sees "Set up"),
   nudges with the list of open items, resends the welcome, or closes the link.
4. Manual minting from the board covers legacy clients and AxeonGROWTH, which
   has no Stripe catalog entry yet.
5. After every change (client save, admin action, new purchase) the site mirrors
   the portal into Airtable > Clients and, the first time a portal completes,
   emails the owner (`lib/onboardingSync.ts`).
6. Every day at 15:00 UTC, `/api/cron/onboarding-nudges` sends the day 1, 3 and 7
   reminders (`nudgeStepDue` in `lib/onboarding.ts`) and refreshes Airtable.

No outside automation tool is involved. The site also writes website leads to
Airtable directly (`lib/airtableSync.ts`) and emails each one to the owner.

## AxeonPROOF and app.axeonstudio.co

`app.axeonstudio.co` is the client app (routing in `lib/hostRouting.ts`, applied by
`middleware.ts`):

- `/` shows AxeonPROOF: the welcome and email + password sign-in page, or the
  client's dashboard once signed in (route `app/proof`, shown at the bare address).
- `/admin` is the team admin (its own login). `/welcome/<token>` are the portals.
- Marketing paths on the app host redirect to axeonstudio.co; `/admin`,
  `/welcome` and `/proof` on axeonstudio.co redirect to the app host. `/api` works
  on both, so the Stripe webhook and crons are unaffected.

Client accounts (`lib/proofAuth.ts`, table `client_accounts`): the client creates
their password as the last card of the onboarding portal, after passing the email
code. bcrypt hashes, signed 30-day session cookie invalidated by a password change,
lock after 8 wrong passwords for 15 minutes, per-IP limits, and a single-use
60-minute reset link that never reveals whether an email has an account.

The dashboard shows setup progress and what Axeon is working on. The calls, leads,
booked jobs and map rank cards read "live after launch" until those data sources
are connected; nothing is invented.

## Client documents (agreement, welcome packet, updates, reports)

The five Claude Design templates are no longer filled in by hand:

| Document | Where it lives | Who triggers it |
| --- | --- | --- |
| Client Services Agreement | `/admin/agreements` → client signs at `app.axeonstudio.co/sign/<token>` | Axeon fills the form; the client signs and pays |
| Client Onboarding | `/welcome/<token>` (the setup portal) | Stripe payment |
| Welcome Packet | `/welcome/<token>/packet` | Generated from plan, fees and dates |
| Project Update | Admin client page → "Post a Project Update" | Axeon, whenever something ships |
| Monthly Report | Admin client page → "Monthly Report" | Axeon, once a month |

Flow: create agreement → client gets "ready to sign" email → reads, types name,
ticks consent (we store a SHA-256 of the exact text, time, IP, browser) → Stripe
Checkout for setup + monthly → webhook marks it paid and starts onboarding as
before. Every page has "Print or save PDF".

- The agreement wording lives in `data/agreementTemplate.ts`. Change it there and
  bump `AGREEMENT_VERSION`; signed agreements keep the version they signed.
- The 90-day guarantee shows only for AxeonCORE and AxeonGROWTH.
- AxeonPROOF numbers come only from Monthly Reports. A blank box shows "—".

## Environment variables

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Required for codes; without it the client cannot verify. |
| `RESEND_CLIENT_FROM_EMAIL` | Optional. Default `Axeon Studio <hello@axeonstudio.co>` (same verified domain). |
| `RESEND_CLIENT_REPLY_TO` | Optional. Default `hello@axeonstudio.co`. |
| `ONBOARDING_COOKIE_SECRET` | Optional. Falls back to `AUTH_SECRET`. |
| `POSTGRES_URL` | Required. Tables are created on first use. |
| `AIRTABLE_TOKEN` | Airtable personal access token for the Clients mirror and website leads. |
| `CRON_SECRET` | Required for the daily nudge job (and the blog crons). |
| `ADMIN_EMAIL` | Where lead and "client finished" alerts go. |

## Not built yet

- File upload for photos and logo (needs Vercel Blob). Today the client texts or
  emails them and taps "Sent them".
- Prefill from the client's existing Google listing. Today prefill is limited to
  what Stripe knows: business name, contact, email, phone.
