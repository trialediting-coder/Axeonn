// lib/ein.ts
// The client's EIN, typed once on the signing page (lean setup, 2026-10-19): the
// phone carriers need it to approve texting from the client's tracked number
// (A2P 10DLC). Stored on the agreement row only, never in the agreement text,
// emails or logs, and shown as the last 4 everywhere. Pure, so the signing
// page, the server and the tests share it.
import type { OnboardingTier } from '@/data/onboardingItems';

/** "12-3456789", "123456789" or "12 3456789" -> "12-3456789"; anything else -> null. */
export function normalizeEin(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(digits) || /^0+$/.test(digits)) return null;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

/** "12-3456789" -> "••-•••6789". */
export function maskEin(ein: string | null | undefined): string | null {
  if (!ein) return null;
  const digits = ein.replace(/\D/g, '');
  return digits.length === 9 ? `••-•••${digits.slice(5)}` : null;
}

/** Only AxeonCORE / AxeonGROWTH agreements on the 2026-10-19 template ask for it (they include texting). */
export function agreementNeedsEin(a: { tier: OnboardingTier; version?: string; scope?: 'website' }): boolean {
  if (a.scope === 'website') return false;
  if (a.tier !== 'axeoncore' && a.tier !== 'axeongrowth') return false;
  return (a.version ?? '2026-10-19') >= '2026-10-19';
}

export const EIN_HINT = 'Phone carriers require it to approve texting from your number.';
