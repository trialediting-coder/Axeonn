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

/** Online booking and the website chat are in AxeonCORE and up (ruling S5-R12); Essentials never gets them. */
export const bookingChatIncluded = (tier: Onboarding['tier']): boolean => (TIER_RANK[tier] ?? 0) >= TIER_RANK.axeoncore;

/** What an admin write gets for a plan without booking and chat. */
/**
 * Admin booking writes (ruling S5-R13): changing the booking settings needs a
 * plan with online booking; marking an existing booking done or cancelling it
 * works on any plan, so a downgraded client can still cancel a customer.
 */
export const adminBookingWriteAllowed = (action: 'settings' | 'done' | 'cancel', tier: Onboarding['tier']): boolean =>
  action !== 'settings' || bookingChatIncluded(tier);

export const PLAN_REFUSAL = 'Online booking and the website chat are part of AxeonCORE and up. Upgrade this client first.';

/** The client behind a site key, only when they are open and on AxeonCORE or above. */
export async function publicClient(siteKey: string): Promise<Onboarding | null> {
  if (!isValidSiteKey(siteKey)) return null;
  const id = await onboardingIdForSiteKey(siteKey);
  if (!id) return null;
  const onboarding = await getOnboardingById(id);
  if (!onboarding || onboarding.status === 'closed') return null;
  return bookingChatIncluded(onboarding.tier) ? onboarding : null;
}

/**
 * A JSON object body of at most `max` bytes, or null. A declared content-length
 * over `max` is refused before anything is read; without the header (or when it
 * lies) the stream is read only up to `max` bytes and then cancelled, so a large
 * body is never buffered whole.
 */
export async function readJsonBody(req: Request, max = 4096): Promise<Record<string, unknown> | null> {
  const declared = req.headers.get('content-length');
  if (declared !== null && /^\s*\d+\s*$/.test(declared) && Number(declared) > max) return null;
  const bytes = await readCapped(req, max);
  if (!bytes || bytes.byteLength === 0) return null;
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The body's bytes, or null once more than `max` arrive (the rest is never read) or the stream fails. */
async function readCapped(req: Request, max: number): Promise<Uint8Array | null> {
  if (!req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}
