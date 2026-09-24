// lib/stripe.ts
// Server-only Stripe client. Never import this from a client component.
//
// The SDK pins its own API version (see node_modules/stripe/cjs/apiVersion.d.ts),
// so upgrading the `stripe` package is how the API version moves forward.
//
// STRIPE_SECRET_KEY should be a restricted key (rk_...) with only the permissions
// listed in docs/stripe.md, stored as a sensitive env var in Vercel. Never a
// secret key in source, and never a live key in a committed file.
import Stripe from 'stripe';
import { SITE_URL } from '@/lib/seo';

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add a restricted key (rk_...) to the environment.');
  }
  if (!client) {
    client = new Stripe(key, {
      appInfo: { name: 'Axeon Studio Site', url: SITE_URL },
      maxNetworkRetries: 2,
    });
  }
  return client;
}
