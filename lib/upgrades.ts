// lib/upgrades.ts
// A client asking, from their dashboard, to move to a bigger plan. Nothing is
// billed here: the request is stored on the onboarding, the owner is emailed,
// and the client sees "requested" until the owner switches them over.
import { ONBOARDING_TIERS, TIER_LABELS, TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { sendUpgradeRequestNotification } from '@/lib/email';
import type { Onboarding } from '@/lib/onboarding';

export interface UpgradeRequest {
  tier: OnboardingTier;
  at: string;
}

const isTier = (v: unknown): v is OnboardingTier => typeof v === 'string' && (ONBOARDING_TIERS as readonly string[]).includes(v);

export async function getUpgradeRequest(onboardingId: number): Promise<UpgradeRequest | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<{ tier: string | null; at: string | Date | null }>`
    SELECT upgrade_requested_tier AS tier, upgrade_requested_at AS at FROM onboardings WHERE id = ${onboardingId};
  `;
  const r = res.rows[0];
  return r?.tier && r.at && isTier(r.tier) ? { tier: r.tier, at: new Date(r.at).toISOString() } : null;
}

/** Stores the request and emails the owner. Only a bigger plan than the current one is accepted. */
export async function requestUpgrade(onboarding: Onboarding, tier: unknown): Promise<UpgradeRequest> {
  if (!isTier(tier)) throw new Error('Pick a plan');
  if (TIER_RANK[tier] <= TIER_RANK[onboarding.tier]) throw new Error(`You are already on ${TIER_LABELS[onboarding.tier]}`);
  if (onboarding.status === 'closed') throw new Error('This account is closed');
  if (!isDatabaseConfigured()) throw new Error('Not available right now');
  await ensureSchema();
  const at = new Date().toISOString();
  await sql`UPDATE onboardings SET upgrade_requested_tier = ${tier}, upgrade_requested_at = ${at}, updated_at = now() WHERE id = ${onboarding.id};`;
  sendUpgradeRequestNotification({
    businessName: onboarding.businessName || onboarding.clientEmail,
    clientEmail: onboarding.clientEmail,
    token: onboarding.token,
    from: onboarding.tier,
    to: tier,
  }).catch((err) => console.error('[upgrade] owner email failed', err instanceof Error ? err.message : err));
  return { tier, at };
}
