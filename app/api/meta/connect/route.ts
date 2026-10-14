// app/api/meta/connect/route.ts
// Starts Facebook Login for one client: /api/meta/connect?token=<onboarding token>
// from the portal's "Connect Facebook" button (device must be verified), or
// &from=admin from the admin card (admin session required). The signed state
// carries the onboarding token; a nonce cookie ties the callback to this browser.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { inboxEnabled } from '@/lib/contactsShared';
import { metaUnavailable, newNonce, oauthUrl, signState } from '@/lib/meta';
import { META_NONCE_COOKIE } from '@/lib/metaShared';
import { welcomeUrl } from '@/lib/onboarding';
import { isDeviceVerified, loadOnboarding, notFound } from '@/lib/welcomeApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  const url = new URL(req.url);
  const onboarding = await loadOnboarding(url.searchParams.get('token') ?? '');
  // DMs land in the leads inbox, so the inbox's plan gate is the Meta gate too.
  if (!onboarding || onboarding.status === 'closed' || !inboxEnabled(onboarding.tier)) return notFound();
  const from = url.searchParams.get('from') === 'admin' ? 'admin' : 'portal';
  if (from === 'admin') {
    if (!(await requireAdmin(req))) return notFound();
  } else if (!(await isDeviceVerified(onboarding.token))) {
    // Not verified on this device yet: the portal asks for the email code, then they press Connect again.
    return NextResponse.redirect(welcomeUrl(onboarding.token), 303);
  }
  const nonce = newNonce();
  const res = NextResponse.redirect(oauthUrl(signState({ token: onboarding.token, nonce, from })), 303);
  res.cookies.set({
    name: META_NONCE_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/meta',
    maxAge: 15 * 60,
  });
  return res;
}
