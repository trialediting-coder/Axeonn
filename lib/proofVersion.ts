// lib/proofVersion.ts
// Which AxeonPROOF dashboard a new client gets. Owner 2026-10-19: "only apply this
// to new clients, keep the old dash for old clients". Pure, so it is tested
// (lib/proofVersion.test.ts) and shared by the Stripe webhook and the admin mint.
//
//   - Existing onboardings are never touched: the column defaults to 1.
//   - v2 is the AxeonCORE / AxeonGROWTH program; Website and Essentials stay on v1.
//   - A client who signed an agreement older than 2026-10-19 stays on v1.
//   - A new CORE/GROWTH client on the 2026-10-19 agreement (or minted with no
//     agreement, after v2 shipped) gets v2.
//   - A "quiet" admin mint is a client who was live before the portal existed: v1.
// The admin can switch any client between v1 and v2 on their admin page.
import type { OnboardingTier } from '@/data/onboardingItems';
import type { ProofVersion } from '@/data/dashboardVersions';

/** The agreement version that ships with PROOF v2 (data/agreementTemplate.ts AGREEMENT_VERSION at release). */
export const PROOF_V2_AGREEMENT_VERSION = '2026-10-19';

export function proofVersionFor(input: { tier: OnboardingTier; agreementVersion?: string | null; legacy?: boolean }): ProofVersion {
  if (input.tier !== 'axeoncore' && input.tier !== 'axeongrowth') return 1;
  if (input.legacy) return 1;
  // Agreement versions are ISO dates (YYYY-MM-DD), so string order is date order.
  if (typeof input.agreementVersion === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.agreementVersion)) {
    return input.agreementVersion >= PROOF_V2_AGREEMENT_VERSION ? 2 : 1;
  }
  return 2;
}
