// lib/onboardingSync.ts
// Runs after anything changes on an onboarding (client save, admin action, new
// purchase, nudge): mirrors it into Airtable and sends the one-time "client
// finished setup" alert. Never throws: callers run it after their response with
// next/server `after()`, and a mirror failure must never break a client's save.
import {
  claimCompletionNotice,
  computeProgress,
  getItemStates,
  getOnboardingByToken,
  type Onboarding,
} from '@/lib/onboarding';
import { isAirtableConfigured } from '@/lib/airtable';
import { ADMIN_APP_URL, syncOnboardingRow } from '@/lib/airtableSync';
import { sendOnboardingCompleteNotification } from '@/lib/email';
import { TIER_LABELS } from '@/data/onboardingItems';

export async function afterOnboardingChange(token: string): Promise<void> {
  let onboarding: Onboarding | null = null;
  try {
    onboarding = await getOnboardingByToken(token);
  } catch (err) {
    console.error('[onboarding-sync] load failed', err instanceof Error ? err.message : err);
    return;
  }
  if (!onboarding) return;

  const progress = computeProgress(onboarding.tier, await getItemStates(onboarding.id).catch(() => ({})));

  if (isAirtableConfigured()) {
    try {
      await syncOnboardingRow(onboarding, progress);
    } catch (err) {
      console.error('[onboarding-sync] airtable failed', err instanceof Error ? err.message : err);
    }
  }

  if (onboarding.status === 'complete') {
    try {
      if (await claimCompletionNotice(onboarding.id)) {
        await sendOnboardingCompleteNotification({
          displayName: onboarding.businessName || onboarding.clientName || onboarding.clientEmail,
          planLabel: TIER_LABELS[onboarding.tier],
          adminUrl: `${ADMIN_APP_URL}/admin/onboarding/${onboarding.token}`,
        });
      }
    } catch (err) {
      console.error('[onboarding-sync] completion alert failed', err instanceof Error ? err.message : err);
    }
  }
}
