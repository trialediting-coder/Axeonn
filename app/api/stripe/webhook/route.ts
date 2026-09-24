// app/api/stripe/webhook/route.ts
// Stripe event destination. Every payment side effect (recording activity,
// alerting the owner) happens here, never on the success page, because
// customers are not guaranteed to reach the success page.
//
// Configure the endpoint in Stripe Workbench -> Webhooks pointing at
// https://axeonstudio.co/api/stripe/webhook and put its signing secret in
// STRIPE_WEBHOOK_SECRET. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  markEventProcessed,
  upsertBillingRecord,
  wasEventProcessed,
  type BillingRecordInput,
} from '@/lib/billingRecords';
import { sendBillingNotification } from '@/lib/email';
import { formatCents } from '@/lib/billingMath';
import { markPayLinkPaid } from '@/lib/payLinks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  // Raw body is required for signature verification; never parse JSON first.
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (await wasEventProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await handleEvent(event);
    await markEventProcessed(event.id, event.type);
  } catch (err) {
    // Non-2xx makes Stripe retry with backoff, which is what we want for transient failures.
    console.error(`[stripe-webhook] failed to process ${event.type} (${event.id})`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      await handleCheckoutSession(event.data.object, event.type);
      return;
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.voided':
    case 'invoice.marked_uncollectible':
      await handleInvoice(event.data.object, event.type);
      return;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscription(event.data.object, event.type);
      return;
    default:
      // Acknowledge everything else so Stripe does not keep retrying it.
      return;
  }
}

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

function customerDashboardLink(customerId: string | null): { label: string; href: string } | undefined {
  return customerId
    ? { label: 'Open customer in Stripe', href: `https://dashboard.stripe.com/customers/${customerId}` }
    : undefined;
}

async function handleCheckoutSession(session: Stripe.Checkout.Session, type: string): Promise<void> {
  const paid = session.payment_status !== 'unpaid';
  let status: string;
  if (type === 'checkout.session.async_payment_failed') status = 'failed';
  else if (type === 'checkout.session.expired') status = 'expired';
  else status = paid ? 'paid' : 'processing';

  const md = session.metadata ?? {};
  const record: BillingRecordInput = {
    stripeObjectId: session.id,
    objectType: 'checkout_session',
    kind: md.kind ?? (session.mode === 'subscription' ? 'care-plan' : null),
    status,
    customerId: idOf(session.customer),
    customerEmail: session.customer_details?.email ?? null,
    customerName: session.customer_details?.name ?? null,
    amountCents: session.amount_total,
    currency: session.currency,
    tier: md.tier ?? null,
    hostedUrl: null,
    metadata: { ...md, mode: session.mode, payment_status: session.payment_status, last_event: type },
  };
  await upsertBillingRecord(record);

  // A personalized pay link is spent once its Checkout completes (ACH may still
  // be settling, but the client has committed; the link must not be reusable).
  if (md.pay_link && (status === 'paid' || status === 'processing')) {
    await markPayLinkPaid(md.pay_link, session.id);
  }

  const amount =
    session.amount_total != null ? formatCents(session.amount_total, session.currency ?? 'usd') : 'an unknown amount';
  const who = [record.customerName, record.customerEmail].filter(Boolean).join(' ') || 'a client';
  const scope = md.scope ?? md.plan_name ?? (session.mode === 'subscription' ? 'recurring plan' : 'project');
  const lines = [`Scope: ${scope}`, `Kind: ${record.kind ?? 'n/a'}`, `Checkout session: ${session.id}`];
  const link = customerDashboardLink(record.customerId);

  if (status === 'paid') {
    await sendBillingNotification({ subject: `Payment received: ${amount} from ${who}`, lines, link });
  } else if (status === 'processing') {
    await sendBillingNotification({
      subject: `Payment processing: ${amount} from ${who}`,
      lines: [...lines, 'Bank debits can take a few business days. You will get another email when it settles.'],
      link,
    });
  } else if (status === 'failed') {
    await sendBillingNotification({ subject: `Payment failed: ${amount} from ${who}`, lines, link });
  }
}

async function handleInvoice(invoice: Stripe.Invoice, type: string): Promise<void> {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription ?? null);
  const record: BillingRecordInput = {
    stripeObjectId: invoice.id,
    objectType: 'invoice',
    kind: subscriptionId ? 'care-plan' : 'invoice',
    status: invoice.status ?? 'unknown',
    customerId: idOf(invoice.customer),
    customerEmail: invoice.customer_email ?? null,
    customerName: invoice.customer_name ?? null,
    amountCents: invoice.amount_due,
    currency: invoice.currency,
    tier: null,
    hostedUrl: invoice.hosted_invoice_url ?? null,
    metadata: {
      number: invoice.number,
      subscription: subscriptionId,
      amount_paid: invoice.amount_paid,
      last_event: type,
    },
  };
  await upsertBillingRecord(record);

  const amount = formatCents(invoice.amount_due, invoice.currency);
  const who = [record.customerName, record.customerEmail].filter(Boolean).join(' ') || 'a client';
  const label = invoice.number ? `Invoice ${invoice.number}` : 'Invoice';
  const lines = [`${label}: ${amount}`, `Stripe id: ${invoice.id}`];
  const link = invoice.hosted_invoice_url
    ? { label: 'View hosted invoice', href: invoice.hosted_invoice_url }
    : customerDashboardLink(record.customerId);

  if (type === 'invoice.paid') {
    await sendBillingNotification({ subject: `${label} paid: ${amount} from ${who}`, lines, link });
  } else if (type === 'invoice.payment_failed') {
    await sendBillingNotification({
      subject: `${label} payment failed: ${amount} from ${who}`,
      lines: [...lines, 'Stripe Smart Retries will keep trying per the Dashboard schedule.'],
      link,
    });
  }
}

async function handleSubscription(subscription: Stripe.Subscription, type: string): Promise<void> {
  const stripe = getStripe();
  const customerId = idOf(subscription.customer);
  let email: string | null = null;
  let name: string | null = null;
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      email = customer.email;
      name = customer.name ?? null;
    }
  }
  const item = subscription.items.data[0];
  const record: BillingRecordInput = {
    stripeObjectId: subscription.id,
    objectType: 'subscription',
    kind: 'care-plan',
    status: subscription.status,
    customerId,
    customerEmail: email,
    customerName: name,
    amountCents: item?.price.unit_amount ?? null,
    currency: item?.price.currency ?? null,
    tier: null,
    hostedUrl: null,
    metadata: {
      ...subscription.metadata,
      cancel_at_period_end: subscription.cancel_at_period_end,
      last_event: type,
    },
  };
  await upsertBillingRecord(record);

  const who = [name, email].filter(Boolean).join(' ') || 'a client';
  const amount = record.amountCents != null ? formatCents(record.amountCents, record.currency ?? 'usd') : 'custom amount';
  const link = customerDashboardLink(customerId);
  if (type === 'customer.subscription.created') {
    await sendBillingNotification({
      subject: `Recurring plan started: ${who} (${amount}/month)`,
      lines: [`Subscription: ${subscription.id}`, `Status: ${subscription.status}`],
      link,
    });
  } else if (type === 'customer.subscription.deleted') {
    await sendBillingNotification({
      subject: `Recurring plan ended: ${who}`,
      lines: [`Subscription: ${subscription.id}`],
      link,
    });
  }
}
