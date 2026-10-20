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
import { TIER_LABELS, TIER_RANK, setupMinutes, type OnboardingTier } from '@/data/onboardingItems';
import { sendDashboardInviteEmail, sendNudgeEmail, sendWelcomeEmail } from '@/lib/email';
import { getItemStates, markNudgeSent } from '@/lib/onboarding';
import { hasAccountForOnboarding } from '@/lib/proofAuth';
import { afterOnboardingChange } from '@/lib/onboardingSync';
import { isDatabaseConfigured, sql } from '@/lib/db';
import { latestSignedAgreementFor } from '@/lib/agreements';
import { proofVersionFor } from '@/lib/proofVersion';

/** The setup time quoted in the welcome email: the plan's first-round minutes, the same number the portal counts down from. */
export function estimatedMinutes(tier: OnboardingTier): number {
  return setupMinutes(tier).firstRound;
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

export interface FulfillmentOptions {
  /**
   * Set up a client without telling them yet (a client who was live before the
   * portal existed, like A-1). No welcome email, and the 1st-of-the-month report
   * is switched off until the admin turns it on. The daily nudges never fire for
   * a portal whose welcome was never sent, so the client hears nothing until
   * "Send welcome" or "Send dashboard invite" is pressed on their page.
   */
  quiet?: boolean;
  /** The version of the agreement this purchase paid for (Stripe metadata `agreement`); undefined = look up the latest signed one. */
  agreementVersion?: string | null;
}

/**
 * Called with what Stripe knows after a paid Checkout, and from the admin board.
 * Returns null when there is nothing to do (no database, no email, or a tier we
 * cannot map). Never throws for mail failures: the admin board shows "welcome
 * not sent" and has a resend button.
 */
export async function ensureOnboardingForPurchase(input: OnboardingInput, opts: FulfillmentOptions = {}): Promise<FulfillmentResult | null> {
  if (!isDatabaseConfigured()) return null;
  const welcome = (o: Onboarding) => (o.welcomeSentAt ? true : opts.quiet ? false : sendWelcomeFor(o).catch(logMail));

  if (input.checkoutSessionId) {
    const existing = await findOnboardingForCheckout(input.checkoutSessionId);
    if (existing) return { onboarding: existing, created: false, welcomeSent: await welcome(existing) };
  }

  const open = await findOpenOnboardingByEmail(input.clientEmail);
  if (open) {
    // A second purchase (e.g. an upgrade) should not spawn a second checklist. If the
    // new tier is higher, the existing portal simply gains the extra items.
    if (TIER_RANK[input.tier] > TIER_RANK[open.tier]) {
      await upgradeTier(open, input.tier);
      open.tier = input.tier;
    }
    return { onboarding: open, created: false, welcomeSent: await welcome(open) };
  }

  // PROOF v1 or v2 (lib/proofVersion.ts): from the agreement this purchase came from, else the client's latest signed one.
  const agreementVersion =
    opts.agreementVersion !== undefined ? opts.agreementVersion : ((await latestSignedAgreementFor(input.clientEmail).catch(() => null))?.version ?? null);
  const proofVersion = input.proofVersion ?? proofVersionFor({ tier: input.tier, agreementVersion, legacy: opts.quiet === true });
  const onboarding = await createOnboarding({ ...input, proofVersion });
  if (opts.quiet) await sql`UPDATE onboardings SET auto_reports = false, updated_at = now() WHERE id = ${onboarding.id};`;
  const welcomeSent = await welcome(onboarding);
  await afterOnboardingChange(onboarding.token);
  return { onboarding, created: true, welcomeSent };
}

/**
 * For a client who is already live: "here is your AxeonPROOF dashboard", with
 * the same secure link as the welcome (email code on a new device, then they
 * choose a password). Only ever sent from the button on the admin page.
 */
export async function sendDashboardInviteFor(onboarding: Onboarding): Promise<void> {
  if (onboarding.status === 'closed') throw new Error('This onboarding is closed');
  const sent = await sendDashboardInviteEmail({
    to: onboarding.clientEmail,
    clientName: onboarding.clientName,
    businessName: onboarding.businessName,
    url: welcomeUrl(onboarding.token),
    hasAccount: await hasAccountForOnboarding(onboarding.id),
  });
  if (!sent) throw new Error('Email is not configured (RESEND_API_KEY)');
}

/**
 * Emails the client the list of items still open and records the nudge. Shared by
 * the admin "Nudge" button and the daily job (app/api/cron/onboarding-nudges).
 * Throws with a message safe to show the admin.
 */
export async function sendNudgeFor(onboarding: Onboarding): Promise<void> {
  if (onboarding.status === 'closed') throw new Error('This onboarding is closed');
  const states = await getItemStates(onboarding.id);
  // Connect items are optional (S6-R13): never nag about them. Only the current round
  // is listed: the basics until they are done, then the before-launch items.
  const open = orderedItems(onboarding.tier).client.filter((i) => !i.connect && states[i.key]?.status !== 'done');
  if (open.length === 0) throw new Error('Nothing is open for this client');
  const round1 = open.filter((i) => !i.later);
  const round = round1.length > 0 ? 'start' : 'launch';
  const sent = await sendNudgeEmail({
    to: onboarding.clientEmail,
    clientName: onboarding.clientName,
    url: welcomeUrl(onboarding.token),
    openItems: (round === 'start' ? round1 : open).map((i) => i.title),
    round,
  });
  if (!sent) throw new Error('Email is not configured (RESEND_API_KEY)');
  await markNudgeSent(onboarding.id);
}

function logMail(err: unknown): false {
  console.error('[onboarding] welcome email failed', err instanceof Error ? err.message : err);
  return false;
}

async function upgradeTier(onboarding: Onboarding, tier: OnboardingTier): Promise<void> {
  await sql`UPDATE onboardings SET tier = ${tier}, status = 'active', completed_at = NULL, updated_at = now() WHERE id = ${onboarding.id};`;
}
