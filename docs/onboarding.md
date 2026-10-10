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
names it by hand. No cookies, no IP kept: the visitor column is a salted hash
that changes every month, so "visitors" means unique people that month. Bots,
headless browsers and localhost are ignored. The owner's own devices are left
out per device, not by IP (phones change IP constantly and the shop Wi-Fi is
shared): opening the site with `?ax_ignore=1` sets a local-storage flag the
script checks before sending anything, `?ax_ignore=0` clears it, and a small
notice confirms either. The link is built by `ownVisitsUrl` and shown on the
client's overview and the admin's Tracking card. The site key is
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
forms + bookings + directions + Google-listing taps), plus an **off-site credit**:
a computer or tablet visitor cannot tap to call, so engaged computer visits with
no click (30s+, two pages, or a contact / pricing / service page) are credited
at 25% as calls made after reading the number, capped at the real clicks plus
two (`assistedContacts` in `lib/siteStats.ts`). The email states both parts
separately. **Estimated new customers** = that total × the client's close rate. The close rate is **estimated from the data by default**
(`estimateCloseRate` in `lib/siteStats.ts`): each way of reaching out gets the
optimistic end of local-service benchmarks (online booking 85%, call 55%, text
50%, form 40%, email 35%), weighted by that client's mix, then only upward
adjustments, each with a reason the client reads in the email: visitors read
several pages first (+5), many came back before deciding (+3), most reached out
from a specific service page (+4), during business hours (+4), from a phone (+2).
Fewer than five contacts widens the range rather than lowering the number. The
email and dashboard show the headline figure, the likely range, and the reasons.
"Close rate: set by hand" on the admin card replaces the estimate with a typed
number when a client tells us their real one.
Anything Axeon typed into the same month's Monthly Report box (calls, leads,
booked jobs, rank, what we did, next month's plan) rides along in the same email,
so the manual box becomes optional notes rather than the whole report. The job
skips closed clients, clients who signed up after the month ended, months already
emailed, and clients with no website numbers *and* nothing typed in (an empty
report helps nobody), then emails the owner a digest of who was sent and who was
skipped. "Send … report now" on the admin page sends the same email on demand,
including re-sending an already-emailed month.

**How the email reads (2026-10-08).** It is framed as "Here is what Axeon did
for you in <month>", not a stats dump (`lib/reportCopy.ts`): a one-sentence
headline (people who reached out, likely new customers, "worth around $X in
work" when the client's average job is set on their admin card, and the change
since last month), the tiles with customers first, up to three "wins" drawn from
the data (rank, visits up, the page or campaign that brought the most people,
Google reach, reviews, returning visitors, speed), "What Axeon did this month"
(the typed lines plus the plan's always-on work in one sentence), what people
pressed and which pages and campaigns brought them, who found them and from
where, next month, one thing we need, the close-rate note, and the tagline.

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

### Tabs and the upgrade page

AxeonPROOF has seven tabs (`lib/proofTabs.ts`): Overview and Leads for every
plan, Calls, Bookings and Reviews from AxeonCORE, Ads and AI receptionist from
AxeonGROWTH. Every client sees every tab; one outside their plan carries a
CORE or GROWTH chip and opens an upgrade page instead of the feature. That
page shows the feature with the client's own numbers ("15 people reached out
last month, and 12 of them pressed Call"), an example month of the feature
(tiles, a chart and a list), readable and labelled on screen as an example
that is not their numbers, a loss line on Calls and Bookings from their real
contact counts with the rule of thumb stated on screen (one in five calls rings
out; a third would rather book online), what the plan adds, the price difference as
"one extra job a month" using
their average job value, one button ("Ask us about AxeonCORE"), and a link to
book a 10-minute call. No pop-ups, no banners elsewhere.

There is no self-serve upgrade (owner decision 2026-10-10): a bigger plan is
set up for the shop, not switched on with a click. The button posts to
`POST /api/proof/upgrade` (`lib/upgrades.ts`), which stores
`upgrade_requested_tier` / `upgrade_requested_at` on the onboarding and emails
`ADMIN_EMAIL`. The client sees "Got it, we'll reach out within one business
day" from then on; the admin sees a banner on the client's page and calls or
emails them. In View as client the button is switched off.

An Essentials client whose report shows 15 or more call presses in a month
gets one sentence at the end of that report pointing at the Calls tab
(`upgradeNudge` in `lib/email.ts`). One report a month, so one nudge at most,
and none when the number does not earn it. Wherever the page names the plan
it shows the lettering (`AxeonLogo product="CORE" mark={false}`), the styled
wordmark without the bars-and-dot mark.

### Leads, outcomes and the client's own close rate

The dashboard lists **People who reached out**: every contact click (call,
text, email, form, booking, directions, Google listing) this month and last,
newest first, with the page, the campaign behind the visit when the landing
page carried one, the city and the device (`leadRows` in `lib/siteStats.ts`).
No names: the tracker never has any. Each lead has two taps, **Customer** and
**Not**, saved through `POST /api/proof/leads` (the client) or the admin
project API with `kind: 'lead-outcome'` (View as client). They land in
`site_events.outcome`.

The taps are **Booked** and **Not yet** (owner decision 2026-10-10): a lead
that has not booked is pending, not a verdict. Marked leads are facts: the
month's estimate is `won + rate × unmarked`. From ten marked leads in the last
six months the client's own rate (`observedCloseRate`) is blended into the
data-driven estimate, its weight rising from 50% at ten to 100% at twenty, so
one rough stretch cannot swing the headline number; a rate typed in by hand
still wins. The report tile and the "How we got to N%" note say how the rate
was reached. When ten or more leads are marked and under 25% are booked, the
owner gets one email per 30 days from the daily tracker-health cron
(`lib/leadHealth.ts`): we are sending people and they are not closing, which
is the call to make before it becomes a cancellation.

### Reports: the ramp, the hold, and the taps

`/api/cron/monthly-reports` runs daily (`lib/autoReports.ts`). Each run moves
every open client's report for last month one step. A report is numbered by
the months already emailed (`lib/reportPlan.ts` `reportNumber`); the first
three are the **ramp**: Google takes two to three months to trust a new site,
so those reports headline what was built and the starting point, compare to the
baseline from onboarding (calls plus leads before Axeon) instead of to last
month, and carry no "vs last month" lines. A ramp report is built on the 1st
and **previewed to `ADMIN_EMAIL`** with a banner; it goes to the client on the
3rd unless the owner presses Hold on the client's admin page (released, it goes
on the next daily run). Reports from the fourth on go straight out on the 1st.
A first month with under 14 tracked days (`trackedDays`) is skipped: the first
report is the first full month. "Send now" on the admin page still sends at
once, previewed or not.

Every report ends with tap questions (`SURVEYS.report` in
`lib/feedbackShared.ts`, chosen by `reportQuestions`): the first report asks
did the site bring a job you would not have had, how often someone picks up
when it rings, is it worth the price so far; the third asks would you recommend
us (a yes offers `GOOGLE_REVIEW_URL` on the landing page); every other report
asks how many jobs came from the site (a series that calibrates the estimate)
plus one that rotates with the calendar month (`REPORT_ROTATION`). After two
reports in a row with no tap at all, only the jobs question is asked. The keys
a report carried are stored on `monthly_reports.survey`, so `/f/<token>` asks
exactly those. Every option is a link carrying `?q=<question>&a=<answer>`; one
tap in the inbox records an answer and the page asks the rest, then offers a
sentence. Answers merge by question into `client_feedback.answers` (JSONB) on
the one row per client and month; the admin Feedback card lists them in words,
and an answer marked `attention` ("Not yet", "Rarely", "None", "Confusing")
emails the owner the first time it lands. The admin board's "Email me a
sample" sends a regular report or the first ramp report.

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

## Billing tab

Every plan has a Billing tab in AxeonPROOF (`components/proof/BillingTab.tsx`).
It reads the client's Stripe customer live each time the tab opens
(`lib/clientBilling.ts`: plan from the subscription, card from the default
payment method, the last 24 invoices with Stripe's hosted pay/view links and
PDFs). It does not depend on the webhook. "Open billing" posts to
`/api/proof/billing`, which creates a Customer Portal session that returns to
`?tab=billing`; the portal is where the card, receipts and billing email are
changed. Before the first invoice there is nothing in Stripe, so the tab shows
the plan price and the reply-to address instead. The portal needs the Customer
Portal configuration saved in Stripe (docs/stripe.md) and the restricted key's
"Customer portal: Write" permission.

## The owner's data page

`/admin/data` (`lib/ownerData.ts`, `components/insights/OwnerDataTable.tsx`)
is every client on one page: totals across clients (live sites, reached out
this month, estimated customers, the share of emailed reports that got a tap,
the worth-the-price split), then a row per client with stage (setup, live,
quiet), reports sent and where the ramp stands, this month from the tracker,
last month, what they marked and their own close rate, every survey answer in
words (latest per question) plus the last "was this useful" tap, and flags:
tracker quiet, an attention answer, a report marked not useful, a low marked
close rate. Flagged clients sort first. Read live each time; nothing stored.

## The referral offer

`lib/referral.ts` holds the one offer, said the same way everywhere a client
reads: $300 to whoever refers, paid when the referred business pays its first
invoice, and a month free for the referred. It appears as a block at the end
of every monthly report, a card on the AxeonPROOF overview, and a line on the
feedback page, each with a "Send us a name" mailto to the reply-to address.

Who sent a client comes from the onboarding question "How did you find us?"
(`how-found`: a source and an optional referrer). A client who names someone
is a row on the Data page's Referrals card (`lib/referrals.ts`): pending until
the webhook has recorded a paid invoice or checkout for their email, then owed,
then paid when the owner presses "Mark $300 paid" (`referral_paid_at`). The
Data table also shows each client's source.
