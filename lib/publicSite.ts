// Shared by the public endpoints clients' websites call (online booking, website
// chat): open CORS, a capped JSON body reader, and one lookup from a site key to
// a client allowed to use them. An unknown key, a malformed key, a closed client
// and an Essentials client all come back null, so a caller can never tell them apart.
import { NextResponse } from 'next/server';
import { TIER_RANK } from '@/data/onboardingItems';
import { getOnboardingById, type Onboarding } from '@/lib/onboarding';
import { isValidSiteKey, onboardingIdForSiteKey } from '@/lib/siteStats';

export const PUBLIC_CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'cache-control': 'no-store',
} as const;

export const corsJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: PUBLIC_CORS });
export const corsPreflight = () => new Response(null, { status: 204, headers: PUBLIC_CORS });

/** The client behind a site key, only when they are open and on AxeonCORE or above. */
export async function publicClient(siteKey: string): Promise<Onboarding | null> {
  if (!isValidSiteKey(siteKey)) return null;
  const id = await onboardingIdForSiteKey(siteKey);
  if (!id) return null;
  const onboarding = await getOnboardingById(id);
  if (!onboarding || onboarding.status === 'closed') return null;
  return TIER_RANK[onboarding.tier] >= TIER_RANK.axeoncore ? onboarding : null;
}

/** A JSON object body of at most `max` characters, or null. */
export async function readJsonBody(req: Request, max = 4096): Promise<Record<string, unknown> | null> {
  const text = await req.text().catch(() => '');
  if (!text || text.length > max) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
