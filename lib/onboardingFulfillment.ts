// lib/onboardingFulfillment.ts
// Glue between a purchase and the onboarding portal: make sure the client has
// exactly one open portal and has been emailed the link. Called from the Stripe
// webhook on a completed Checkout, and from the admin board for manual mints
// and resends. Idempotent: a retry of the same session, or a second purchase by
// the same email, reuses the existing portal instead of minting another.
import {
  createOnboarding,
  findOnboardingForCheckout,
  findOpenOnboardingByEmail,
  markWelcomeSent,
  orderedItems,
  welcomeUrl,
  type Onboarding,
  type OnboardingInput,
} from '@/lib/onboarding';
import { TIER_LABELS, TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { sendWelcomeEmail } from '@/lib/email';
import { isDatabaseConfigured, sql } from '@/lib/db';

/** Sum of the per-item estimates, rounded up to a friendly number for the email. */
export function estimatedMinutes(tier: OnboardingTier): number {
  const total = orderedItems(tier).client.reduce((sum, item) => sum + (item.minutes ?? 1), 0);
  return Math.max(5, Math.ceil(total / 5) * 5);
}

export async function sendWelcomeFor(onboarding: Onboarding): Promise<boolean> {
  const sent = await sendWelcomeEmail({
    to: onboarding.clientEmail,
    clientName: onboarding.clientName,
    tierLabel: TIER_LABELS[onboarding.tier],
    url: welcomeUrl(onboarding.token),
    minutes: estimatedMinutes(onboarding.tier),
  });
  if (sent) await markWelcomeSent(onboarding.id);
  return sent;
}

export interface FulfillmentResult {
  onboarding: Onboarding;
  created: boolean;
  welcomeSent: boolean;
}

/**
 * Called with what Stripe knows after a paid Checkout. Returns null when there is
 * nothing to do (no database, no email, or a tier we cannot map). Never throws
 * for mail failures: the admin board shows "welcome not sent" and has a resend button.
 */
export async function ensureOnboardingForPurchase(input: OnboardingInput): Promise<FulfillmentResult | null> {
  if (!isDatabaseConfigured()) return null;

  if (input.checkoutSessionId) {
    const existing = await findOnboardingForCheckout(input.checkoutSessionId);
    if (existing) {
      const welcomeSent = existing.welcomeSentAt ? true : await sendWelcomeFor(existing).catch(logMail);
      return { onboarding: existing, created: false, welcomeSent };
    }
  }

  const open = await findOpenOnboardingByEmail(input.clientEmail);
  if (open) {
    // A second purchase (e.g. an upgrade) should not spawn a second checklist. If the
    // new tier is higher, the existing portal simply gains the extra items.
    if (TIER_RANK[input.tier] > TIER_RANK[open.tier]) {
      await upgradeTier(open, input.tier);
      open.tier = input.tier;
    }
    const welcomeSent = open.welcomeSentAt ? true : await sendWelcomeFor(open).catch(logMail);
    return { onboarding: open, created: false, welcomeSent };
  }

  const onboarding = await createOnboarding(input);
  const welcomeSent = await sendWelcomeFor(onboarding).catch(logMail);
  return { onboarding, created: true, welcomeSent };
}

function logMail(err: unknown): false {
  console.error('[onboarding] welcome email failed', err instanceof Error ? err.message : err);
  return false;
}

async function upgradeTier(onboarding: Onboarding, tier: OnboardingTier): Promise<void> {
  await sql`UPDATE onboardings SET tier = ${tier}, status = 'active', completed_at = NULL, updated_at = now() WHERE id = ${onboarding.id};`;
}
