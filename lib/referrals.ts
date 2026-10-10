// lib/referrals.ts
// Who sent each client, from the "How did you find us?" onboarding question,
// and what is owed for it. A client who names a referrer becomes a row on the
// admin Data page: pending until their first invoice is paid (billing_records
// from the Stripe webhook), then owed, then paid when the owner marks it.
// The offer itself is in lib/referral.ts.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { getItemStates, listOnboardings, type ItemState } from '@/lib/onboarding';
import { SURVEYS } from '@/lib/feedbackShared';

export const HOW_FOUND_KEY = 'how-found';
export const REFERRED_OPTION = 'Someone referred me';

export interface HowFound {
  source: string | null;
  referredBy: string | null;
}

/** Pure: the answer from the item states, trimmed; a referrer counts even when the source is something else. */
export function readHowFound(states: Record<string, Pick<ItemState, 'data'> | undefined>): HowFound {
  const d = states[HOW_FOUND_KEY]?.data ?? {};
  const source = typeof d.source === 'string' && d.source.trim() ? d.source.trim() : null;
  const referredBy = typeof d.referredBy === 'string' && d.referredBy.trim() ? d.referredBy.trim().slice(0, 120) : null;
  return { source, referredBy };
}

export interface ReferralRow {
  id: number;
  token: string;
  name: string;
  clientEmail: string;
  referredBy: string;
  signedUpAt: string;
  /** The referred client's first invoice (or checkout) is paid, so the reward is owed. */
  firstInvoicePaid: boolean;
  rewardPaidAt: string | null;
}

export type ReferralStatus = 'pending' | 'owed' | 'paid';
export const referralStatus = (r: Pick<ReferralRow, 'firstInvoicePaid' | 'rewardPaidAt'>): ReferralStatus =>
  r.rewardPaidAt ? 'paid' : r.firstInvoicePaid ? 'owed' : 'pending';

/** Every client who named a referrer, newest first. */
export async function listReferrals(): Promise<ReferralRow[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const all = await listOnboardings(500);
  const out: ReferralRow[] = [];
  for (const o of all) {
    const { referredBy } = readHowFound(await getItemStates(o.id));
    if (!referredBy) continue;
    const [paid, flag] = await Promise.all([
      sql<{ n: number }>`
        SELECT count(*)::int AS n FROM billing_records
        WHERE lower(customer_email) = lower(${o.clientEmail})
          AND ((object_type = 'invoice' AND status = 'paid') OR (object_type = 'checkout_session' AND status IN ('paid', 'processing')));
      `,
      sql<{ referral_paid_at: string | Date | null }>`SELECT referral_paid_at FROM onboardings WHERE id = ${o.id};`,
    ]);
    const at = flag.rows[0]?.referral_paid_at;
    out.push({
      id: o.id,
      token: o.token,
      name: o.businessName || o.clientName || o.clientEmail,
      clientEmail: o.clientEmail,
      referredBy,
      signedUpAt: o.createdAt,
      firstInvoicePaid: (paid.rows[0]?.n ?? 0) > 0,
      rewardPaidAt: at ? new Date(at).toISOString() : null,
    });
  }
  return out;
}

/**
 * Writes the "how did you find us" answer the way the onboarding step does, so
 * a tap in a report and a tap in onboarding land in the same place. Keeps a
 * referrer already on file when the new call brings none.
 */
export async function recordHowFound(onboardingId: number, input: { source?: string | null; referredBy?: string | null }): Promise<void> {
  await ensureSchema();
  const current = readHowFound(await getItemStates(onboardingId));
  const source = input.source?.trim() || current.source;
  const referredBy = input.referredBy?.trim().slice(0, 120) || current.referredBy;
  if (!source && !referredBy) return;
  const data = { source, referredBy };
  await sql`
    INSERT INTO onboarding_items (onboarding_id, item_key, status, data, completed_by, completed_at)
    VALUES (${onboardingId}, ${HOW_FOUND_KEY}, 'done', ${JSON.stringify(data)}::jsonb, 'client', now())
    ON CONFLICT (onboarding_id, item_key) DO UPDATE SET data = EXCLUDED.data, status = 'done', completed_at = coalesce(onboarding_items.completed_at, now()), updated_at = now();
  `;
}

/** The option's words for a "found" tap value, matching the onboarding select. */
export const foundLabel = (value: string): string | null => {
  const q = SURVEYS.report?.find((x) => x.key === 'found');
  return q?.options.find((o) => o.value === value)?.label ?? null;
};

/** The owner paid (or un-paid) the reward for this client's referrer. */
export async function setReferralPaid(onboardingId: number, paid: boolean): Promise<void> {
  await ensureSchema();
  await sql`UPDATE onboardings SET referral_paid_at = ${paid ? new Date().toISOString() : null} WHERE id = ${onboardingId};`;
}
