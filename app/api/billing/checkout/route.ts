// app/api/billing/checkout/route.ts
// Public: the /pay pages post here to start a Stripe-hosted Checkout Session.
//
// Two shapes of request:
//   { token }                             a personalized pay link minted by the admin;
//                                         the scope comes from the database row, not the body
//   { tier, kind, addOns, name, email }   the self-serve chooser on /pay
//
// There is no auth (anyone may pay Axeon Studio), so this route is deliberately
// narrow: inputs are validated against the catalog, a honeypot field catches
// bots, requests are rate limited per IP, and Stripe errors are never echoed
// back to the browser. It only ever creates a session for the email the visitor
// typed or the email on the link; it reads nothing about other customers.
//
// The admin equivalent (app/api/admin/billing/checkout) stays separate so its
// error detail and auth model are unchanged.
import { NextResponse } from 'next/server';
import {
  ADDON_KEYS,
  TIER_KEYS,
  createCarePlanCheckout,
  createProjectCheckout,
  isCatalogKey,
  type CatalogKey,
  type CheckoutResult,
} from '@/lib/billing';
import { isPaymentKind, type PaymentKind } from '@/lib/billingMath';
import { optionalString, readBody, requireEmail } from '@/lib/billingApi';
import { isStripeConfigured } from '@/lib/stripe';
import { getPayLink, isValidToken, payLinkState, type PayLink } from '@/lib/payLinks';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const MAX_NAME_LENGTH = 120;
const CALL_US = 'Call (515) 493-8017';

// Best-effort limiter. Each serverless instance keeps its own map, so the real
// ceiling is a small multiple of MAX_PER_WINDOW. Good enough to stop a loop from
// minting thousands of Checkout Sessions; not a security boundary.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  return first.trim() || 'unknown';
}

class ClientError extends Error {
  readonly status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

interface SelfServeRequest {
  email: string;
  name: string;
  tier: CatalogKey;
  kind: PaymentKind;
  addOns: CatalogKey[];
}

function parseSelfServe(body: Record<string, unknown>): SelfServeRequest {
  let email: string;
  try {
    email = requireEmail(body.email);
  } catch {
    throw new ClientError('Enter a valid email address so we can send your receipt.');
  }

  const name = optionalString(body.name);
  if (!name) throw new ClientError('Enter your name or business name.');
  if (name.length > MAX_NAME_LENGTH) throw new ClientError('That name is too long.');

  const tier = body.tier;
  if (!isCatalogKey(tier) || !TIER_KEYS.includes(tier)) throw new ClientError('Choose a build.');

  const kind = body.kind;
  if (!isPaymentKind(kind)) throw new ClientError('Choose how you would like to pay.');

  const rawAddOns: unknown[] = Array.isArray(body.addOns) ? body.addOns : [];
  const addOns: CatalogKey[] = [];
  for (const key of rawAddOns) {
    if (!isCatalogKey(key) || !ADDON_KEYS.includes(key)) throw new ClientError('Unknown add-on selected.');
    if (!addOns.includes(key)) addOns.push(key);
  }
  // AxeonCORE already includes videography; never charge for it twice.
  const filtered = tier === 'axeoncore' ? addOns.filter((k) => k !== 'addon-videography') : addOns;

  return { email, name, tier, kind, addOns: filtered };
}

async function loadOpenLink(rawToken: unknown): Promise<PayLink> {
  const token = typeof rawToken === 'string' ? rawToken.trim().toUpperCase() : '';
  if (!isValidToken(token)) throw new ClientError(`This payment link is not valid. ${CALL_US} for a new one.`, 404);
  const link = await getPayLink(token);
  if (!link) throw new ClientError(`This payment link is not valid. ${CALL_US} for a new one.`, 404);
  const state = payLinkState(link);
  if (state === 'paid') throw new ClientError('This link has already been paid. Thank you!', 409);
  if (state !== 'open') throw new ClientError(`This payment link has expired. ${CALL_US} for a new one.`, 410);
  return link;
}

function checkoutForLink(link: PayLink): Promise<CheckoutResult> {
  const common = {
    email: link.clientEmail,
    name: link.clientName ?? undefined,
    source: 'axeon-pay-link' as const,
    cancelPath: `/pay/${link.token}`,
    payLinkToken: link.token,
  };
  if (link.kind === 'plan') {
    if (!link.planKey) throw new Error(`Pay link ${link.token} is a plan link without a plan_key`);
    return createCarePlanCheckout({ ...common, planKey: link.planKey });
  }
  if (!link.tier) throw new Error(`Pay link ${link.token} has no tier`);
  return createProjectCheckout({ ...common, tier: link.tier, kind: link.kind, addOns: link.addOns });
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: `Online payments are not switched on yet. ${CALL_US} and we will send you a payment link.` },
      { status: 503 }
    );
  }
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: 'Too many attempts from this connection. Wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  let checkout: () => Promise<CheckoutResult>;
  try {
    const body = await readBody(req);
    // Honeypot: real visitors never see this field. Bots fill everything.
    if (optionalString(body.company)) throw new ClientError('Could not start checkout.');

    if (body.token !== undefined) {
      const link = await loadOpenLink(body.token);
      checkout = () => checkoutForLink(link);
    } else {
      const input = parseSelfServe(body);
      checkout = () => createProjectCheckout({ ...input, source: 'axeon-site-pay', cancelPath: '/pay' });
    }
  } catch (err) {
    if (err instanceof ClientError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('[public-checkout] bad request', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not read the request.' }, { status: 400 });
  }

  try {
    const result = await checkout();
    return NextResponse.json({ url: result.url, amountCents: result.amountCents }, { status: 201 });
  } catch (err) {
    // Stripe messages can name lookup keys and account state; keep them in the logs.
    console.error('[public-checkout]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: `We could not start checkout right now. Try again in a moment or call (515) 493-8017.` },
      { status: 502 }
    );
  }
}
