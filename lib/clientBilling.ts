// lib/clientBilling.ts
// What the client's Billing tab shows: their plan, the card on file, and past
// invoices, read live from Stripe each time the tab opens. Nothing here depends
// on the webhook: Stripe is the source of truth and we only read it. The
// customer is found by the id saved at checkout or, failing that, by email.
// "Manage billing" opens Stripe's hosted portal (lib/billing.ts
// createPortalLink), where the client updates the card and downloads receipts;
// we build no payment screens of our own.
import type Stripe from 'stripe';
import type { Onboarding } from '@/lib/onboarding';
import { findCustomerByEmail } from '@/lib/billing';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export interface BillingPlan {
  /** Product name in Stripe, e.g. "AxeonCORE". */
  name: string;
  /** Per interval, in whole dollars (or the currency's major unit). */
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'paused' | 'incomplete';
  /** Next charge, ISO date, or when the plan ends if it is set to cancel. */
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingCard {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BillingInvoice {
  id: string;
  number: string | null;
  /** ISO date the invoice was created. */
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  /** Stripe's hosted page for the invoice (view and pay), and the PDF. */
  url: string | null;
  pdf: string | null;
}

export interface BillingSummary {
  customerId: string;
  plan: BillingPlan | null;
  card: BillingCard | null;
  invoices: BillingInvoice[];
  /** Sum of open invoices, in major units. */
  due: number;
  currency: string;
}

// The slices of Stripe's objects the summary reads, so tests can pass plain objects.
export interface SubscriptionLike {
  status: string;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      current_period_end?: number | null;
      price: { unit_amount: number | null; currency: string; recurring: { interval: string } | null; product: string | { name?: string; deleted?: boolean } };
    }>;
  };
}
export interface InvoiceLike {
  id: string;
  number: string | null;
  created: number;
  amount_due: number;
  currency: string;
  status: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
}
export interface CustomerLike {
  id: string;
  invoice_settings?: { default_payment_method?: string | { card?: { brand: string; last4: string; exp_month: number; exp_year: number } | null } | null } | null;
}

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
const major = (cents: number | null | undefined) => Math.round((cents ?? 0)) / 100;

const PLAN_STATUS = new Set<BillingPlan['status']>(['active', 'trialing', 'past_due', 'unpaid', 'canceled', 'paused', 'incomplete']);
const INTERVALS = new Set<BillingPlan['interval']>(['day', 'week', 'month', 'year']);

/** Pure: Stripe's customer, subscriptions and invoices become one summary for the tab. */
export function summarizeBilling(customer: CustomerLike, subscriptions: SubscriptionLike[], invoices: InvoiceLike[]): BillingSummary {
  // The live plan first; a plan that already ended is still shown so the tab is not blank.
  const rank = (s: SubscriptionLike) => (s.status === 'active' || s.status === 'trialing' ? 0 : s.status === 'past_due' || s.status === 'unpaid' ? 1 : 2);
  const sub = [...subscriptions].sort((a, b) => rank(a) - rank(b))[0] ?? null;
  const item = sub?.items.data[0] ?? null;
  let plan: BillingPlan | null = null;
  if (sub && item) {
    const product = item.price.product;
    const status = PLAN_STATUS.has(sub.status as BillingPlan['status']) ? (sub.status as BillingPlan['status']) : 'active';
    const interval = item.price.recurring && INTERVALS.has(item.price.recurring.interval as BillingPlan['interval']) ? (item.price.recurring.interval as BillingPlan['interval']) : 'month';
    plan = {
      name: typeof product === 'object' && product.name ? product.name : 'Your plan',
      amount: major(item.price.unit_amount),
      currency: item.price.currency.toUpperCase(),
      interval,
      status,
      periodEnd: iso(item.current_period_end),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    };
  }

  const pm = customer.invoice_settings?.default_payment_method;
  const card = pm && typeof pm === 'object' && pm.card ? { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year } : null;

  const rows: BillingInvoice[] = invoices
    .filter((i) => i.status === 'paid' || i.status === 'open' || i.status === 'void' || i.status === 'uncollectible')
    .map((i) => ({
      id: i.id,
      number: i.number,
      date: new Date(i.created * 1000).toISOString(),
      amount: major(i.amount_due),
      currency: i.currency.toUpperCase(),
      status: i.status as BillingInvoice['status'],
      url: i.hosted_invoice_url ?? null,
      pdf: i.invoice_pdf ?? null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const due = rows.filter((r) => r.status === 'open').reduce((n, r) => n + r.amount, 0);
  const currency = plan?.currency ?? rows[0]?.currency ?? 'USD';
  return { customerId: customer.id, plan, card, invoices: rows, due: Math.round(due * 100) / 100, currency };
}

/** The client's Stripe customer: the id saved at checkout, or a lookup by email. Null when Stripe is not set up or they have never paid through it. */
async function findCustomer(onboarding: Pick<Onboarding, 'clientEmail' | 'stripeCustomerId'>): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  if (onboarding.stripeCustomerId) {
    const c = await stripe.customers.retrieve(onboarding.stripeCustomerId, { expand: ['invoice_settings.default_payment_method'] }).catch(() => null);
    if (c && !c.deleted) return c as Stripe.Customer;
  }
  const byEmail = await findCustomerByEmail(onboarding.clientEmail);
  if (!byEmail) return null;
  const c = await stripe.customers.retrieve(byEmail.id, { expand: ['invoice_settings.default_payment_method'] });
  return c.deleted ? null : (c as Stripe.Customer);
}

/** Live from Stripe. Null means "nothing to show": no key, no customer, or Stripe unreachable (the tab says so without failing the page). */
export async function clientBilling(onboarding: Pick<Onboarding, 'clientEmail' | 'stripeCustomerId'>): Promise<BillingSummary | null> {
  if (!isStripeConfigured()) return null;
  try {
    const customer = await findCustomer(onboarding);
    if (!customer) return null;
    const stripe = getStripe();
    const [subs, invoices] = await Promise.all([
      stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10, expand: ['data.items.data.price.product'] }),
      stripe.invoices.list({ customer: customer.id, limit: 24 }),
    ]);
    return summarizeBilling(customer as unknown as CustomerLike, subs.data as unknown as SubscriptionLike[], invoices.data as unknown as InvoiceLike[]);
  } catch (err) {
    console.error('[client-billing]', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Dollars (or the currency's unit) for the tab: $299, $1,250.50. */
export function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
