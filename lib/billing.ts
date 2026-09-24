// lib/billing.ts
// Server-side Stripe billing helpers for Axeon Studio.
//
// Money model (decided with the Stripe implementation planner on 2026-09-23):
//   - One-time builds and add-ons: Stripe-hosted Checkout (deposit / balance / full).
//   - Quotes with a payment schedule: Invoicing API + hosted invoice page.
//   - Private hosting/care arrangements: monthly subscription started via Checkout,
//     self-served afterwards through the Customer Portal.
//   - Tax: Stripe Tax threshold monitoring only until a registration exists. Flip
//     STRIPE_AUTOMATIC_TAX=true only after a registration shows "Collecting" in the
//     Dashboard, otherwise Stripe silently collects nothing.
//   - No Connect.
//
// Everything here runs on the server. Amounts are integer cents. Public pricing copy
// lives in data/pricingData.ts and content/brand-guardrails.md; the amounts Stripe
// charges live on Stripe Prices (seeded by scripts/stripe-seed.mjs, matched by
// lookup_key) so there is one source of truth for what actually gets charged.
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { SITE_URL } from '@/lib/seo';
import { computeSplit, type PaymentKind } from '@/lib/billingMath';

export const CATALOG = {
  'core-web-build': { label: 'Core Web Build', kind: 'tier' },
  axeoncore: { label: 'AxeonCORE', kind: 'tier' },
  'addon-videography': { label: 'Custom On-Site Videography', kind: 'addon' },
  'addon-extra-page': { label: 'Additional Custom Page Build', kind: 'addon' },
  'addon-directory-integration': { label: 'Advanced Database/Directory Integration', kind: 'addon' },
  'addon-landing-page-variant': { label: 'Secondary Niche Landing Page Variant', kind: 'addon' },
} as const satisfies Record<string, { label: string; kind: 'tier' | 'addon' }>;

export type CatalogKey = keyof typeof CATALOG;
export const CATALOG_KEYS = Object.keys(CATALOG) as CatalogKey[];
export const TIER_KEYS = CATALOG_KEYS.filter((k) => CATALOG[k].kind === 'tier');
export const ADDON_KEYS = CATALOG_KEYS.filter((k) => CATALOG[k].kind === 'addon');

export function isCatalogKey(value: unknown): value is CatalogKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CATALOG, value);
}

const CARE_PRODUCT_KEY = 'hosting-care';
const CARE_PRODUCT_NAME = 'Website Hosting & Care';
/** Standard hosting/maintenance plan: a real recurring Price seeded by scripts/stripe-seed.mjs. */
export const STANDARD_CARE_LOOKUP_KEY = 'hosting-care-monthly';
export const STANDARD_CARE_AMOUNT_CENTS = 4900;

// Monthly plans: recurring Prices matched by lookup_key (seeded by
// scripts/stripe-seed.mjs). amountCents here is the seeded amount used for display
// fallbacks; the Stripe Price is what actually gets charged. The per-tier plans are
// shown publicly on /pay ("then $284/mo after launch"); the $49 basics plan is a
// private preset for existing clients and is never shown on the site.
export const PLANS = {
  'core-web-build-monthly': {
    label: 'Core Web Build Monthly Plan',
    amountCents: 28400,
    tier: 'core-web-build',
    public: true,
  },
  'axeoncore-monthly': {
    label: 'AxeonCORE Monthly Plan',
    amountCents: 57400,
    tier: 'axeoncore',
    public: true,
  },
  'hosting-care-monthly': {
    label: 'Website Hosting & Care (basics)',
    amountCents: STANDARD_CARE_AMOUNT_CENTS,
    tier: null,
    public: false,
  },
} as const satisfies Record<string, { label: string; amountCents: number; tier: CatalogKey | null; public: boolean }>;

export type PlanKey = keyof typeof PLANS;
export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANS, value);
}

/** The public monthly plan that goes with a build tier, if any. */
export function planForTier(tier: CatalogKey): PlanKey | null {
  for (const key of PLAN_KEYS) {
    if (PLANS[key].public && PLANS[key].tier === tier) return key;
  }
  return null;
}

export type RecurringPrice = Stripe.Price & { unit_amount: number; recurring: Stripe.Price.Recurring };

/** Look up an active recurring Price by its lookup_key. */
export async function getPlanPrice(key: PlanKey): Promise<RecurringPrice> {
  const res = await getStripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const price = res.data[0];
  if (!price || !price.recurring) {
    throw new Error(
      `No active recurring Stripe price with lookup_key "${key}". Run \`npm run stripe:seed\` against this Stripe environment.`
    );
  }
  if (price.unit_amount == null) throw new Error(`Stripe price "${key}" has no unit_amount.`);
  return price as RecurringPrice;
}

// integration_identifier tags Checkout Sessions so each flow can be compared in
// the Dashboard. The random suffix is part of the label, per Stripe's guidance.
const CHECKOUT_TAGS = {
  project: 'axeon_project_checkout_kqzmvtrb',
  care: 'axeon_care_plan_checkout_wpxnhdgs',
} as const;

export function automaticTaxEnabled(): boolean {
  return process.env.STRIPE_AUTOMATIC_TAX === 'true';
}

export function depositPercent(): number {
  const raw = Number(process.env.STRIPE_DEPOSIT_PERCENT ?? '50');
  return Number.isFinite(raw) && raw > 0 && raw < 100 ? raw : 50;
}

function escapeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  const normalized = email.trim().toLowerCase();
  const found = await stripe.customers.search({
    query: `email:'${escapeSearchValue(normalized)}'`,
    limit: 1,
  });
  return found.data[0] ?? null;
}

export async function getOrCreateCustomer(input: {
  email: string;
  name?: string;
  phone?: string;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const email = input.email.trim().toLowerCase();
  const existing = await findCustomerByEmail(email);
  if (existing) {
    if (input.name && !existing.name) {
      return stripe.customers.update(existing.id, { name: input.name });
    }
    return existing;
  }
  return stripe.customers.create({
    email,
    name: input.name,
    phone: input.phone,
    metadata: { source: 'axeon-site' },
  });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export type PriceWithProduct = Stripe.Price & { product: Stripe.Product; unit_amount: number };

/** Look up an active Price by its lookup_key, with its Product expanded. */
export async function getPrice(key: CatalogKey): Promise<PriceWithProduct> {
  const stripe = getStripe();
  const res = await stripe.prices.list({
    lookup_keys: [key],
    active: true,
    expand: ['data.product'],
    limit: 1,
  });
  const price = res.data[0];
  if (!price || typeof price.product === 'string' || price.product.deleted) {
    throw new Error(
      `No active Stripe price with lookup_key "${key}". Run \`npm run stripe:seed\` against this Stripe environment.`
    );
  }
  if (price.unit_amount == null) {
    throw new Error(`Stripe price "${key}" has no unit_amount; the catalog expects flat prices.`);
  }
  return price as PriceWithProduct;
}

async function getOrCreateCareProduct(): Promise<Stripe.Product> {
  const stripe = getStripe();
  const found = await stripe.products.search({
    query: `active:'true' AND metadata['axeon_key']:'${CARE_PRODUCT_KEY}'`,
    limit: 1,
  });
  if (found.data[0]) return found.data[0];
  return stripe.products.create({
    name: CARE_PRODUCT_NAME,
    metadata: { axeon_key: CARE_PRODUCT_KEY },
  });
}

/** The seeded $49/month price, or null if this Stripe environment has not been seeded. */
async function findStandardCarePrice(): Promise<Stripe.Price | null> {
  const res = await getStripe().prices.list({
    lookup_keys: [STANDARD_CARE_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  const price = res.data[0];
  return price && price.recurring ? price : null;
}

function productTaxCode(product: Stripe.Product): string | undefined {
  if (!product.tax_code) return undefined;
  return typeof product.tax_code === 'string' ? product.tax_code : product.tax_code.id;
}

// ---------------------------------------------------------------------------
// One-time project payments (hosted Checkout)
// ---------------------------------------------------------------------------

export interface ProjectCheckoutInput {
  email: string;
  name?: string;
  tier: CatalogKey;
  kind: PaymentKind;
  addOns?: CatalogKey[];
  /** Stored in metadata.source so admin-minted, self-serve (/pay) and pay-link sessions can be told apart. */
  source?: CheckoutSource;
  /** Site path Stripe returns to if the client backs out of Checkout. Defaults to /pricing. */
  cancelPath?: string;
  /** Token of the personalized pay link this session was started from, if any. */
  payLinkToken?: string;
}

export type CheckoutSource = 'axeon-admin' | 'axeon-site-pay' | 'axeon-pay-link';

export interface CheckoutResult {
  url: string;
  sessionId: string;
  amountCents: number;
}

export async function createProjectCheckout(input: ProjectCheckoutInput): Promise<CheckoutResult> {
  const stripe = getStripe();
  const tier = await getPrice(input.tier);
  const addOns = await Promise.all((input.addOns ?? []).map((k) => getPrice(k)));
  const customer = await getOrCreateCustomer(input);

  const total = tier.unit_amount + addOns.reduce((sum, p) => sum + p.unit_amount, 0);
  const split = computeSplit(total, depositPercent());
  const scope = [tier.product.name, ...addOns.map((p) => p.product.name)].join(' + ');

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let amountCents: number;

  if (input.kind === 'full') {
    lineItems = [tier, ...addOns].map((p) => ({ price: p.id, quantity: 1 }));
    amountCents = total;
  } else {
    amountCents = input.kind === 'deposit' ? split.deposit : split.balance;
    const label = input.kind === 'deposit' ? `${depositPercent()}% deposit` : 'Final balance';
    const taxCode = productTaxCode(tier.product);
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: tier.currency,
          unit_amount: amountCents,
          tax_behavior: 'exclusive',
          product_data: {
            name: `${tier.product.name} - ${label}`,
            description: scope,
            ...(taxCode ? { tax_code: taxCode } : {}),
          },
        },
      },
    ];
  }

  const metadata = {
    source: input.source ?? 'axeon-admin',
    tier: input.tier,
    kind: input.kind,
    add_ons: (input.addOns ?? []).join(','),
    scope,
    ...(input.payLinkToken ? { pay_link: input.payLinkToken } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customer.id,
    customer_update: { address: 'auto', name: 'auto' },
    billing_address_collection: 'required',
    line_items: lineItems,
    success_url: `${SITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${input.cancelPath ?? '/pricing'}`,
    invoice_creation: { enabled: true },
    automatic_tax: { enabled: automaticTaxEnabled() },
    integration_identifier: CHECKOUT_TAGS.project,
    metadata,
    payment_intent_data: {
      description: `${scope} (${input.kind})`,
      metadata,
    },
  });

  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  return { url: session.url, sessionId: session.id, amountCents };
}

// ---------------------------------------------------------------------------
// Invoices (hosted invoice page, emailed by Stripe)
// ---------------------------------------------------------------------------

export interface InvoiceLineInput {
  /** Catalog item billed at its Stripe price. */
  key?: CatalogKey;
  /** Free-form line: needs description + unitAmountCents. */
  description?: string;
  unitAmountCents?: number;
  quantity?: number;
}

export interface InvoiceInput {
  email: string;
  name?: string;
  items: InvoiceLineInput[];
  daysUntilDue?: number;
  memo?: string;
  footer?: string;
}

export interface InvoiceResult {
  invoiceId: string;
  number: string | null;
  hostedInvoiceUrl: string | null;
  amountDueCents: number;
}

export async function createAndSendInvoice(input: InvoiceInput): Promise<InvoiceResult> {
  const stripe = getStripe();
  if (!input.items.length) throw new Error('An invoice needs at least one line item');

  const customer = await getOrCreateCustomer(input);
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: input.daysUntilDue ?? 14,
    auto_advance: false,
    pending_invoice_items_behavior: 'exclude',
    description: input.memo,
    footer: input.footer,
    automatic_tax: { enabled: automaticTaxEnabled() },
    metadata: { source: 'axeon-admin' },
  });

  for (const item of input.items) {
    const quantity = item.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Line quantity must be a positive integer');
    if (item.key) {
      const price = await getPrice(item.key);
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        quantity,
        pricing: { price: price.id },
      });
    } else {
      if (!item.description || item.unitAmountCents == null) {
        throw new Error('Custom invoice lines need a description and an amount');
      }
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        quantity,
        description: item.description,
        currency: 'usd',
        unit_amount_decimal: Stripe.Decimal.from(item.unitAmountCents),
        tax_behavior: 'exclusive',
      });
    }
  }

  await stripe.invoices.finalizeInvoice(invoice.id);
  // Stripe emails the hosted invoice page (with reminders per Dashboard settings).
  const sent = await stripe.invoices.sendInvoice(invoice.id);
  return {
    invoiceId: sent.id,
    number: sent.number,
    hostedInvoiceUrl: sent.hosted_invoice_url ?? null,
    amountDueCents: sent.amount_due,
  };
}

// ---------------------------------------------------------------------------
// Hosting & care subscriptions (private per-client arrangements)
// ---------------------------------------------------------------------------

export interface CarePlanInput {
  email: string;
  name?: string;
  /** A seeded plan (per-tier monthly plan or the $49 basics). Wins over monthlyAmountCents. */
  planKey?: PlanKey;
  /** Ad hoc amount on the generic care product. Defaults to the standard $49/month plan when omitted. */
  monthlyAmountCents?: number;
  planName?: string;
  description?: string;
  source?: CheckoutSource;
  cancelPath?: string;
  payLinkToken?: string;
}

export async function createCarePlanCheckout(input: CarePlanInput): Promise<CheckoutResult> {
  const stripe = getStripe();
  const customer = await getOrCreateCustomer(input);

  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
  let monthlyAmountCents: number;
  let planName: string;

  if (input.planKey) {
    // A real recurring Price: subscriptions group under that plan in the Dashboard.
    const price = await getPlanPrice(input.planKey);
    lineItem = { price: price.id, quantity: 1 };
    monthlyAmountCents = price.unit_amount;
    planName = input.planName?.trim() || PLANS[input.planKey].label;
  } else {
    monthlyAmountCents = input.monthlyAmountCents ?? STANDARD_CARE_AMOUNT_CENTS;
    if (!Number.isInteger(monthlyAmountCents) || monthlyAmountCents <= 0) {
      throw new Error('Monthly amount must be a positive integer number of cents');
    }
    planName = input.planName?.trim() || CARE_PRODUCT_NAME;
    // Use the seeded $49 Price when the amount matches it; otherwise price ad hoc.
    const standard = await findStandardCarePrice();
    if (standard && standard.unit_amount === monthlyAmountCents) {
      lineItem = { price: standard.id, quantity: 1 };
    } else {
    const product = await getOrCreateCareProduct();
    lineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        product: product.id,
        unit_amount: monthlyAmountCents,
        recurring: { interval: 'month' },
        tax_behavior: 'exclusive',
      },
    };
    }
  }

  const metadata = {
    source: input.source ?? 'axeon-admin',
    kind: 'care-plan',
    plan_name: planName,
    ...(input.planKey ? { plan_key: input.planKey } : {}),
    ...(input.payLinkToken ? { pay_link: input.payLinkToken } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    customer_update: { address: 'auto', name: 'auto' },
    billing_address_collection: 'required',
    line_items: [lineItem],
    success_url: `${SITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelPath ? `${SITE_URL}${input.cancelPath}` : SITE_URL,
    automatic_tax: { enabled: automaticTaxEnabled() },
    integration_identifier: CHECKOUT_TAGS.care,
    subscription_data: {
      description: input.description?.trim() || planName,
      metadata,
    },
    metadata,
  });

  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  return { url: session.url, sessionId: session.id, amountCents: monthlyAmountCents };
}

// ---------------------------------------------------------------------------
// Customer Portal
// ---------------------------------------------------------------------------

export async function createPortalLink(email: string): Promise<string> {
  const customer = await findCustomerByEmail(email);
  if (!customer) throw new Error(`No Stripe customer found for ${email.trim().toLowerCase()}`);
  const session = await getStripe().billingPortal.sessions.create({
    customer: customer.id,
    return_url: SITE_URL,
  });
  return session.url;
}

// ---------------------------------------------------------------------------
// Success page support (display only; fulfillment happens in the webhook)
// ---------------------------------------------------------------------------

export interface CheckoutSummary {
  status: Stripe.Checkout.Session.Status | null;
  paymentStatus: Stripe.Checkout.Session.PaymentStatus;
  mode: Stripe.Checkout.Session.Mode;
  amountTotalCents: number | null;
  currency: string | null;
  customerEmail: string | null;
}

export async function getCheckoutSummary(sessionId: string): Promise<CheckoutSummary> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  return {
    status: session.status,
    paymentStatus: session.payment_status,
    mode: session.mode,
    amountTotalCents: session.amount_total,
    currency: session.currency,
    customerEmail: session.customer_details?.email ?? null,
  };
}
