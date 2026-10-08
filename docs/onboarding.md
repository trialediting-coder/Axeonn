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
   has no Stripe catalog entry yet. Tick "Don't email the client yet" to set up a
   client who was live before the portal existed (A-1, for example): no welcome,
   no reminders, monthly report email off. Every button that emails a client asks
   first. When ready, "Send welcome" sends the onboarding welcome and "Send
   dashboard invite" sends a plain "here is your AxeonPROOF dashboard" email with
   the same secure link.
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

## Website tracking and the automatic monthly report

Built 2026-10-07. Every client gets their website numbers by email on the 1st of
the month without anyone typing them in.

**How the numbers get here.** Each site we build loads one line, shown with a
copy button on the client's admin page:

```html
<script defer src="https://axeonstudio.co/t.js" data-site="ax_xxxxxxxxxxxxxx"></script>
```

`public/t.js` posts page views and clicks to `/api/t`. It names clicks on its
own: `tel:` links are `call`, `sms:` is `text`, `mailto:` is `email`, booking
links (Cal.com, Calendly, Square, Jobber, Housecall Pro…) are `book`, map links
are `directions`, a form send is `form`, and any `<button>`, `role="button"` or
`.btn`/`.cta` link is recorded by its text. `data-axeon="quote"` on an element
names it by hand. No cookies, no storage, no IP kept: the visitor column is a
salted hash that changes every month, so "visitors" means unique people that
month. Bots, headless browsers and localhost are ignored. The site key is
minted the first time the admin opens the client's page; a wrong key is
dropped silently. Rows live in `site_events` (`lib/siteStats.ts`) and are
pruned after 15 months; the monthly summaries stay on the reports forever.

**Detail (added 2026-10-08).** Every view also carries the viewport width (phone /
tablet / desktop), the page's campaign tags (`utm_*`, or Google / Meta / Microsoft
click ids counted as paid traffic from that network), and a coarse place from
Vercel's edge headers ("Des Moines, IA"; the IP is hashed and never stored). When
a visitor leaves a page the script sends one `leave` event with active seconds
(only while the tab is visible and the person did something in the last 30s),
deepest scroll, and page load time (largest contentful paint). Links to review
pages, Google listings, Facebook, Instagram, TikTok and YouTube are named too.
`sessionRows()` cuts each visitor's month into sessions at 30-minute gaps in SQL;
`summarizeSessions()` turns those into the `detail` block: sessions, returning
visitors, bounce rate, time and pages per visit, devices, landing pages with how
many of those visits reached out, the page they were on when they did, campaigns,
places, when they reach out (local hour and weekday), and median load time. The
report email, AxeonPROOF and the admin card all read from it.

**View as client.** "View as client" on a client's admin page opens
`/admin/onboarding/<token>/preview`: their AxeonPROOF dashboard rendered for the
admin with an amber banner, read-only, no client session, nothing sent. Both pages
load through `lib/proofDashboardData.ts` so they can never drift apart.

**What goes out.** `/api/cron/monthly-reports` runs on the 1st at 14:00 UTC
(`vercel.json`) and, for every open client with "Email on the 1st" switched on,
sums last month (`lib/autoReports.ts`): visits and visitors, button clicks with
the most-clicked list, how many people reached out (calls + texts + emails +
forms + bookings), and **estimated new customers** = that count × the client's
close rate (default 25%, editable per client; the email says it is an estimate).
Anything Axeon typed into the same month's Monthly Report box (calls, leads,
booked jobs, rank, what we did, next month's plan) rides along in the same email,
so the manual box becomes optional notes rather than the whole report. The job
skips closed clients, clients who signed up after the month ended, months already
emailed, and clients with no website numbers *and* nothing typed in (an empty
report helps nobody), then emails the owner a digest of who was sent and who was
skipped. "Send … report now" on the admin page sends the same email on demand,
including re-sending an already-emailed month.

**Where it shows.** The report email leads with the website tiles and adds
"Most clicked buttons", "Where visitors came from" and "Most visited pages".
AxeonPROOF shows the same four numbers and three lists from the latest report.
Saving the manual report for a month keeps the attached website numbers
(`saveMonthlyReport` merges rather than replaces).

| Piece | Where |
| --- | --- |
| Browser script | `public/t.js` (cached 1h, see `next.config.mjs`) |
| Admin preview of a client's dashboard | `app/admin/onboarding/[token]/preview/page.tsx`, `lib/proofDashboardData.ts` |
| Collector | `app/api/t/route.ts` |
| Validation, hashing, month sums, settings | `lib/siteStats.ts` |
| Report build + send | `lib/autoReports.ts` |
| Monthly job | `app/api/cron/monthly-reports/route.ts` |
| Admin card (snippet, this/last month, settings, send now) | `components/insights/ProjectPanel.tsx` |
| Client view | `components/proof/ProofDashboard.tsx` |
| Email | `sendMonthlyReportEmail`, `sendMonthlyReportsDigest` in `lib/email.ts` |
| Tables | `site_events`, new columns on `onboardings` |
| Tests | `lib/siteStats.test.ts` (in `npm run test:onboarding`) |

Not built: importing Google Analytics or call-tracking numbers. The snippet is
the one source for now, so a site without it gets no automatic report until it
is added.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Required for codes; without it the client cannot verify. |
| `RESEND_CLIENT_FROM_EMAIL` | Optional. Default `Axeon Studio <hello@axeonstudio.co>` (same verified domain). |
| `RESEND_CLIENT_REPLY_TO` | Optional. Default `hello@axeonstudio.co`. |
| `ONBOARDING_COOKIE_SECRET` | Optional. Falls back to `AUTH_SECRET`. |
| `POSTGRES_URL` | Required. Tables are created on first use. |
| `AIRTABLE_TOKEN` | Airtable personal access token for the Clients mirror and website leads. |
| `CRON_SECRET` | Required for the daily nudge job, the monthly reports and the blog crons. |
| `TRACKING_SALT` | Optional. Salts the visitor hash for site tracking; falls back to `AUTH_SECRET`. |
| `ADMIN_EMAIL` | Where lead and "client finished" alerts go. |

## Not built yet

- File upload for photos and logo (needs Vercel Blob). Today the client texts or
  emails them and taps "Sent them".
- Prefill from the client's existing Google listing. Today prefill is limited to
  what Stripe knows: business name, contact, email, phone.
