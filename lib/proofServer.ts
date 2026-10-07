// lib/proofServer.ts
// Cookie plumbing for AxeonPROOF sign-in, used by the /api/proof routes and the
// /proof page (shown at app.axeonstudio.co). Server-only.
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import {
  PROOF_COOKIE,
  PROOF_SESSION_TTL_MS,
  getAccountForSession,
  readProofSession,
  signProofSession,
  type ClientAccount,
} from '@/lib/proofAuth';

/** The signed-in client, or null. */
export async function getSignedInClient(): Promise<ClientAccount | null> {
  const jar = await cookies();
  const session = readProofSession(jar.get(PROOF_COOKIE)?.value);
  if (!session) return null;
  try {
    return await getAccountForSession(session);
  } catch (err) {
    console.error('[proof] session lookup failed', err instanceof Error ? err.message : err);
    return null;
  }
}

export function withProofSession(res: NextResponse, account: ClientAccount): NextResponse {
  const expiresAt = Date.now() + PROOF_SESSION_TTL_MS;
  res.cookies.set({
    name: PROOF_COOKIE,
    value: signProofSession(account.id, new Date(account.passwordSetAt).getTime(), expiresAt),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
  return res;
}

export function withoutProofSession(res: NextResponse): NextResponse {
  res.cookies.set({ name: PROOF_COOKIE, value: '', path: '/', maxAge: 0 });
  return res;
}
