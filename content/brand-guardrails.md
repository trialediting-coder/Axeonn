# Axeon Studio — Brand Guardrails (Production, Committed)

These are the ONLY facts the autonomous content pipeline may state about
Axeon Studio. This file ships to production; it is intentionally a narrow
factual subset of the fuller internal marketing-context file, which stays
local-only. Last updated 2026-10-19 (practice repositioning).

## Positioning (owner decision 2026-10-19)
- Axeon installs patient and client intake infrastructure for established
  private practices. It is not "a website company". Lead with the problem:
  calls and web inquiries that come in after hours or while the front desk is
  busy go to voicemail or to a form nobody answers until tomorrow, and the
  patient books with whoever answered first. Axeon answers every missed call
  and web inquiry within 60 seconds, 24/7, books the consultation, and asks
  every patient or client for a review after the visit.
- Sell the result, not the service: lead with more new patients, clients and
  booked consultations; the website, SEO, ads and 60-second intake are how.
- Tagline: "We Get You Patients, Not Clicks." (the practice version of the
  former "We Get You Customers, Not Clicks."). The retired tagline "Your
  Business. Your Partner." must never be used.
- Primary call to action everywhere: the free after-hours audit at /audit
  ("Get your free after-hours audit", short form "Free audit"). What it is:
  "We call your practice after hours, check how fast your website answers an
  inquiry, and compare your reviews to the top 3 nearby practices. You get a
  short video walkthrough of what we found — no charge." Secondary: "Book a
  call" at /book.

## Audience
- Write for an owner or practice manager of an established private practice
  (roughly $500k–$2.5M in yearly revenue): dental practices, med spas and
  aesthetic clinics, law firms, accounting and CPA firms.
- Use "practice", "patients", "clients", "consultations", "appointments",
  "front desk", "intake".
- Do not write for or about contractors, trades, home services, detailers,
  roofers, HVAC, plumbers or real estate, and do not use "jobs", "crews",
  "shop" or "booked jobs" in public copy.

## Real pricing (never state a different number)
- Two plans. Public display is "From $799/mo" (AxeonCORE) and
  "From $1,999/mo" (AxeonGROWTH). There is no self-serve checkout and no
  "buy now"; every plan starts with the audit or a call and a signed agreement.
- Terms: state the 12-month agreement plainly. Month-to-month is available
  with the $3,000 implementation fee paid upfront. Never invent a different
  term (no "24-month", no "3-month minimum", no "cancel anytime").
- AxeonCORE: from $799/month, 12-month agreement, $3,000 implementation fee
  credited in full. Prepay a year for $7,990 (2 months free). Includes a custom
  mobile-first practice website (providers and credentials, services, reviews,
  booking), 24/7 missed-call text-back, a first reply to every web inquiry
  within 60 seconds, online consultation booking, a two-way text inbox for the
  front desk, call tracking, automated review requests after each
  appointment, the AxeonPROOF client portal (live recovered-inquiry counter,
  change requests, monthly reports), hosting, security and monitoring, up to
  2 hours of content updates a month, the 90-day performance commitment, and
  5-mile territory exclusivity for the practice's specialty.
- AxeonGROWTH: from $1,999/month plus ad spend, 12-month agreement, $5,000
  implementation fee credited. Everything in AxeonCORE plus Google Local
  Services Ads and search ads management, a quarterly database reactivation
  campaign to past patients or clients, an AI phone receptionist,
  multi-provider calendar and intake routing, quarterly photo and video
  (review videos, reels), a monthly strategy call plus a quarterly business
  review, and priority support.
- Ad spend: $500/month minimum, paid to Google directly. No markup.
- Add-ons (mention only where a menu of extras already exists): Local
  Services Ads management on AxeonCORE +$750/month, database reactivation $100
  per showed appointment, AI phone receptionist +$199/month, extra page $450,
  on-site videography $1,500.
- Google runs its own screening for Local Services Ads, so never promise the
  Google Guaranteed / Google Screened badge.
- Existing clients keep their current rates and plans. Those private
  arrangements are never mentioned in public copy. There is no public /pay
  page; payments go through personalized links and invoices.

## Retired prices and offers (never cite)
- $149/month (Essentials), $299/month (old AxeonCORE), $999/month (old
  AxeonGROWTH), $99 to start, $1,500 to start, "first month free",
  "$0 to start", the founding client offer, the "free website / $0 setup" ad
  offer.
- Ads add-on at +$399/month (now +$750/month for Local Services Ads on
  AxeonCORE).
- The $2,800/$5,800 setup fees, the $284/$574 monthly plans, "$490/month".
- The $49/month basics arrangement for existing clients is private: never
  mention it.

## The 90-day performance commitment
- It replaces the old "90-day customer guarantee" everywhere. The old
  guarantee wording ("more calls and leads than before, or we keep working
  for free") is retired and must never be used.
- Full form: "Live within 30 days of getting your materials. Every missed
  call and web inquiry gets a reply within 60 seconds. Every completed
  appointment gets a review request. If we miss any of those in the first 90
  days and don't fix it within 15 days, you can walk away and owe nothing for
  the rest of the term."
- Short form: "90-day performance commitment: live in 30 days, 60-second
  replies, review requests on every visit — or walk away."
- Never promise a number of leads, patients, clients, revenue, or rankings.
  Never attach a percentage or lift number to any feature.

## Territory, ownership and health information
- Territory: "One practice per specialty within 5 miles." (While the account
  is in good standing.)
- Ownership: the practice's domain, Google Business Profile, and
  patient/client contact data are always theirs. The website design and code
  become theirs once the 12-month term is paid. The intake system, phone/text
  numbers and AxeonPROOF are a service and stop if they leave. Never write
  "100% ownership", "you own everything from day one" or "zero lock-in".
- Health information: "Intake collects name, contact, service and preferred
  time only — never symptoms, insurance or health details." Never describe the
  system as collecting, storing or analyzing health information, and never
  call Axeon "HIPAA certified".

## AxeonPROOF
- AxeonPROOF (app.axeonstudio.co) is Axeon's real client portal. It is shown
  at /axeonproof as a live render for an example business with an example
  month (data in data/proofPage.ts). Those figures are never a real client's
  numbers, and the page says so.
- Tabs (lib/proofTabs.ts is the source of truth): Overview, Leads, Email and
  Billing on every plan; AxeonCORE switches on Calls, Bookings and Reviews;
  AxeonGROWTH adds Ads and the AI receptionist. A locked tab shows a labelled
  "example month"; never present those figures as a client's results.

## Real, currently-live services (safe to describe as offered)
- Custom practice websites.
- Missed-call text-back, 60-second first reply to web inquiries, online
  consultation booking, a two-way text inbox, call tracking.
- Automated review requests after each appointment.
- Local SEO and Google Business Profile upkeep.
- Google Local Services Ads and search ads management (AxeonGROWTH, or
  +$750/month on AxeonCORE). Never promise ROAS, cost-per-lead or lift numbers.
- AI phone receptionist (AxeonGROWTH, or +$199/month on AxeonCORE).
- Database reactivation campaigns to past patients or clients.
- Photo and video.

## NOT currently live — never imply these are offered
- ChatGPT Ads or any other paid AI-platform advertising product.
- Anything that reads, stores or acts on patient health records, insurance,
  or an EHR/practice-management system.

## Banned / retired terminology
- Plain language: customer-facing copy avoids "AEO", "GEO", "CRM pipeline",
  "exit-intent", "funnel", "nurture", "workflow" and "convert/conversion".
  "Speed-to-lead" is fine only in llms files, schema and code. Legal docs,
  llms files and code identifiers are exempt.
- No hype words: "revolutionary", "supercharge", "unlock", "seamless",
  "game-changer", "predator", "weaponized", "lock-in", "hegemony". No
  exclamation points.
- Do not call any plan a "sprint" or use "sprint" as a headline value
  proposition.
- The only timeline that may be stated is the commitment's "live within 30
  days of getting your materials". Never promise any other build timeline
  ("7 days", "14 days", "7–14 days", etc.).
- Never refer to "Operations Retainer" or an "AxeonCORE retainer"; those plans
  are retired. "AxeonCORE" is the $799/month plan; "AxeonGROWTH" is the
  $1,999/month plan.

## Never fabricate
- Axeon has no practice clients yet. Never invent practice clients, case
  studies, testimonials, quotes, reviews, statistics or percentages, and never
  imply a dental, med spa, law or accounting client exists.
- Illustrative math must be labelled as an example with its assumptions
  stated, e.g. "Example: 30 after-hours inquiries a month × 1 in 4 that would
  have booked × $400 average first visit." Never present it as a result.
- Case studies: Axeon's earlier builds for local service businesses (trade,
  detailing and portfolio sites) may be mentioned only generically as
  "earlier builds for local service businesses" and never as proof that the
  intake system works for practices. Do not write new case studies about them
  for the blog. Do not cite their rankings, review counts or quotes.
- Hintz Family Dentistry is an unsolicited concept build. If it is ever
  mentioned, label it "Concept build" and never imply it is a client.
- Use AxeonPROOF and the free audit as the proof of how the system works.
- No unverifiable superlatives ("best", "#1", "leading", "first in Iowa").
- Any external statistic (industry data, survey results, etc.) MUST come
  from a real source found via web search during generation, and MUST be
  recorded in this post's `sources` array with the real URL. Never state a
  statistic without a real, checkable source.

## Voice
- Plain, confident, short sentences, specific. Talk to a practice owner or
  manager. No em-dash-heavy AI tone.
- Iowa-based, West Des Moines. Present Axeon as a company: never name the
  founder or use a personal "I" voice in public copy (owner, 2026-10-14).
- Never publish a street address.
