# Stripe integration

Built 2026-09-23 against the plan from Stripe's implementation planner. Scope:
Payments, Invoicing, Billing (recurring), and Tax monitoring. No Connect.

## What exists

| Piece | Where | Notes |
| --- | --- | --- |
| Stripe client | `lib/stripe.ts` | One `Stripe` instance, SDK-pinned API version |
| Money helpers | `lib/billing.ts`, `lib/billingMath.ts` | Checkout, invoices, care plans, portal |
| Webhook | `app/api/stripe/webhook/route.ts` | Signature-verified, idempotent, emails the owner |
| Admin API | `app/api/admin/billing/*` | Session or `CMS_API_TOKEN` bearer auth |
| Admin UI | `/insights/admin/billing` | Payment links, invoices, plans, portal, activity |
| Success page | `/billing/success` | Display only, noindex |
| Public pay page | `/pay` | Self-serve deposit / balance / full via hosted Checkout, noindex, footer link |
| Public API | `app/api/billing/checkout/route.ts` | No auth; honeypot + per-IP rate limit; generic errors |
| Public catalog | `lib/publicCatalog.ts` | Stripe amounts by lookup_key, cached 10 min, seeded fallback |
| Personalized links | `/pay/<token>`, `lib/payLinks.ts`, `app/api/admin/billing/pay-links` | Admin-minted, scope locked, `pay_links` table, closes on webhook |
| Catalog seed | `scripts/stripe-seed.mjs` | `npm run stripe:seed`, idempotent |
| DB tables | `stripe_events`, `billing_records` | Created by `ensureSchema()` and `db:init` |

Prices are matched by `lookup_key`, so no price IDs live in env vars:
`core-web-build`, `axeoncore`, `addon-videography`, `addon-extra-page`,
`addon-directory-integration`, `addon-landing-page-variant`. Monthly plans are
recurring prices matched the same way: `core-web-build-monthly` ($284/month) and
`axeoncore-monthly` ($574/month) are the public per-tier plans shown on `/pay`
as "then $X/mo after launch" (never charged on the setup payment); the
hosting/care product (`metadata.axeon_key = hosting-care`) carries the private
$49/month basics price `hosting-care-monthly` for existing clients, and any other
amount entered in the console is priced ad hoc on that product. `PLANS` in
`lib/billing.ts` is the list.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Restricted key (`rk_...`). Store as a sensitive env var in Vercel. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (`whsec_...`). |
| `STRIPE_DEPOSIT_PERCENT` | Deposit share of a project total. Default 50. |
| `STRIPE_AUTOMATIC_TAX` | `true` only after a registration shows Collecting. Default off. |
| `STRIPE_PORTAL_LOGIN_URL` | Customer Portal hosted login URL, shown in the admin console. |

Keep sandbox and live values in separate Vercel environments (Preview vs
Production). Never commit a key. `.env*.local` is already gitignored.

## Personalized pay links

Admin console -> "Personalized pay link": pick the client, what the link is
for (setup deposit / balance / full with add-ons, or start a monthly plan), an
optional note, and an expiry (default 30 days). The result is
`https://axeonstudio.co/pay/K7QZ2MPD`, which opens a locked page showing that
client's scope and one "Pay securely with Stripe" button. The page needs the
database (`POSTGRES_URL`); the table `pay_links` is created by `ensureSchema()`.

A link closes itself when its Checkout Session completes (webhook reads
`metadata.pay_link`), so it cannot be paid twice. Links can be disabled or
re-enabled from the console; paid links are final. The client's email is masked
on the page because links get forwarded.

## Restricted key permissions

Create the key at Dashboard -> Developers -> API keys -> Create restricted key,
with these permissions. Everything else stays None.

| Resource | Access | Used by |
| --- | --- | --- |
| Checkout Sessions | Write | Payment links, care plans, success page |
| Customers | Write | Find or create clients |
| Products | Write | Care product lookup and creation, seed script |
| Prices | Write | Seed script (Read is enough at runtime) |
| Invoices | Write | Create, finalize, send |
| Subscriptions | Read | Webhook |
| Customer portal | Write | Portal links |
| Webhook Endpoints | None | Endpoints are created in the Dashboard |

Add an access policy (IP restriction) to the live key once Vercel egress IPs are
known, or skip it if they are dynamic.

## Sandbox state (already done)

The "Axeon Studio sandbox" already has:

- Seven products with tax codes and six one-time prices (see seed script).
- A Customer Portal configuration with invoice history, payment method updates,
  and billing detail updates enabled. Cancellation is disabled so care plans end
  by agreement, not by a button. Its hosted login page URL is in the Dashboard
  under Settings -> Billing -> Customer portal.

Still to do in the sandbox before testing:

1. Create a restricted key with the permissions above and put it in `.env.local`.
2. Run `npm run stripe:seed` once. It should report every item already exists.
3. Create the webhook endpoint (below) or use the Stripe CLI locally.

## Webhook endpoint

Dashboard -> Developers -> Workbench -> Webhooks -> Add destination, URL
`https://axeonstudio.co/api/stripe/webhook`, events:

```
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
invoice.finalized
invoice.paid
invoice.payment_failed
invoice.voided
invoice.marked_uncollectible
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Do this once for the
sandbox (Preview env) and once for live (Production env).

Local testing:

```
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# put the printed whsec_... in .env.local, then:
npm run dev
```

Test cards: `4242 4242 4242 4242` succeeds, `4000 0000 0000 9995` declines,
`4000 0025 0000 3155` requires 3DS. For ACH, Checkout offers a test bank flow.

## How the flows work

**Project payment.** Admin picks build, add-ons, and deposit/balance/full. The
route sums the Stripe prices, splits by `STRIPE_DEPOSIT_PERCENT`, and creates a
hosted Checkout Session with `invoice_creation` on so the client gets a receipt
invoice. Fulfillment (activity record + owner email) happens in the webhook when
`payment_status` is not `unpaid`, which handles ACH settling days later.

**Invoice.** Admin adds catalog lines or custom lines, due days, memo. The route
creates a `send_invoice` invoice, attaches items, finalizes, and sends. Stripe
emails the hosted invoice page and reminders per Dashboard -> Settings ->
Billing -> Invoices. Smart Retries and dunning emails are Dashboard settings too.

**Care plan.** Defaults to the $49/month hosting and maintenance price; admin can
override the amount for one client. Checkout in
subscription mode creates the subscription; renewals run on Stripe. Clients
manage payment methods and invoices through the portal. Cancel is admin-only.

**Portal.** One-time links from the console, or the shareable hosted login URL
where a client enters their email and gets a magic link.

## Tax

Stripe Tax is intentionally not calculating yet. The account's tax settings are
`pending` because no head office address is set, and there are no registrations.
Web design services are generally exempt in Iowa; hosting can be taxable. Steps
when ready:

1. Dashboard -> Tax -> Settings: set the head office address (West Des Moines).
2. Dashboard -> Tax -> Monitoring: threshold monitoring flags where a
   registration is needed.
3. Add a registration only where obligated. It must show Collecting.
4. Set `STRIPE_AUTOMATIC_TAX=true` and redeploy. Run one test invoice to a
   customer with an Iowa address and check `taxability_reason` is not
   `not_collecting`.

Tax codes on products (exact Stripe codes): Website Design `txcd_10701200` for
builds and page add-ons, Website Hosting `txcd_10701100` for the care product,
General - Services `txcd_20030000` for videography because Stripe has no video
production code. Confirm with a tax advisor before collecting.

## Go-live checklist

1. Live restricted key (same permissions), set as sensitive in Vercel Production.
2. `npm run stripe:seed` against live once (`.env.local` pointed at the live key
   temporarily, then remove it).
3. Live webhook endpoint and its secret in Production.
4. Customer Portal configuration in live mode (Dashboard -> Settings -> Billing
   -> Customer portal), then set `STRIPE_PORTAL_LOGIN_URL` in Production.
5. Dashboard: branding (logo, colors) for Checkout and invoices; invoice email
   settings and reminders; payment methods (enable ACH Direct Debit for large
   invoices); statement descriptor.
6. Activate the account (business details, bank account) if not already done.
7. Send yourself a $1 custom invoice and a deposit link end to end.

## Things deliberately not built

- Connect (platform for clients). Revisit if clients should take payments
  through sites Axeon builds; the planner path is SaaS platform with direct
  charges and Stripe-owned pricing.
- A "Pay" button on `/pricing` itself. Sales stay call-first; self-serve
  payment lives on `/pay` (noindex, footer link) for clients who have already
  been scoped. Link to `/pay?tier=axeoncore` or `/pay?tier=core-web-build` to
  preselect a build. Sessions started there carry `metadata.source =
  axeon-site-pay` so they can be told apart from admin-minted links.
- Content-Security-Policy headers. Nothing loads Stripe.js on the site; all
  payment UI is Stripe-hosted. Add CSP if Elements or embedded Checkout is ever
  introduced.
