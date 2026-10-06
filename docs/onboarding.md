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
- Admin routes and pages sit behind the existing `/insights/admin` auth.

## What exists

| Piece | Where |
| --- | --- |
| Item definitions per plan | `data/onboardingItems.ts` |
| Tokens, codes, cookie, validation, DB | `lib/onboarding.ts` |
| Purchase → portal + welcome email (idempotent) | `lib/onboardingFulfillment.ts` |
| Client page | `app/welcome/[token]/page.tsx`, `components/welcome/*` |
| Public API (code, verify, save item) | `app/api/welcome/[token]/*` |
| Admin board + detail | `/insights/admin/onboarding`, `components/insights/Onboarding*.tsx` |
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

## Environment variables

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Required for codes; without it the client cannot verify. |
| `RESEND_CLIENT_FROM_EMAIL` | Optional. Default `Axeon Studio <hello@axeonstudio.co>` (same verified domain). |
| `RESEND_CLIENT_REPLY_TO` | Optional. Default `hello@axeonstudio.co`. |
| `ONBOARDING_COOKIE_SECRET` | Optional. Falls back to `AUTH_SECRET`. |
| `POSTGRES_URL` | Required. Tables are created on first use. |

## Not built yet

- File upload for photos and logo (needs Vercel Blob). Today the client texts or
  emails them and taps "Sent them".
- Scheduled nudges on days 1, 3 and 7 (n8n). Nudges are a button on the board.
- Prefill from the client's existing Google listing. Today prefill is limited to
  what Stripe knows: business name, contact, email, phone.
- Mirror to Airtable via n8n.
