// lib/welcomeApi.ts
// Shared plumbing for the public /api/welcome/<token>/* routes: token lookup,
// the device cookie, and a best-effort per-IP limiter (same approach as
// /api/get-started/lead). Everything answers with the same generic 404 for a
// missing, malformed, or closed token so a scanner learns nothing.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  DEVICE_COOKIE_TTL_MS,
  deviceCookieName,
  getOnboardingByToken,
  normalizeToken,
  signDeviceCookie,
  verifyDeviceCookie,
  type Onboarding,
} from '@/lib/onboarding';

export const notFound = () => NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  return first.trim() || 'unknown';
}

const hits = new Map<string, number[]>();

/** True when `key` has exceeded `max` hits in the last `windowMs`. Per server instance. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return recent.length > max;
}

export async function loadOnboarding(rawToken: string): Promise<Onboarding | null> {
  try {
    return await getOnboardingByToken(normalizeToken(rawToken));
  } catch (err) {
    console.error('[welcome]', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Has this device completed the email code for this token? */
export async function isDeviceVerified(token: string): Promise<boolean> {
  const jar = await cookies();
  return verifyDeviceCookie(jar.get(deviceCookieName(token))?.value, token);
}

/** Sets the signed device cookie on a response. Path-wide so the API routes see it too. */
export function withDeviceCookie(res: NextResponse, token: string): NextResponse {
  const expiresAt = Date.now() + DEVICE_COOKIE_TTL_MS;
  res.cookies.set({
    name: deviceCookieName(token),
    value: signDeviceCookie(token, expiresAt),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
  return res;
}
