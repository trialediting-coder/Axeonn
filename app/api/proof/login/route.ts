// app/api/proof/login/route.ts
// AxeonPROOF sign-in: { email, password } -> signed session cookie.
// One generic error for a wrong email or password; a lock after repeated misses.
import { NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/proofAuth';
import { withProofSession } from '@/lib/proofServer';
import { clientIp, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (rateLimited(`proof-login:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  try {
    const result = await verifyLogin(body.email, body.password);
    if (!result.ok) {
      const error =
        result.reason === 'locked'
          ? 'Too many wrong passwords. Wait 15 minutes, or reset your password.'
          : 'That email or password is not right.';
      return NextResponse.json({ ok: false, error }, { status: 401 });
    }
    return withProofSession(NextResponse.json({ ok: true }), result.account);
  } catch (err) {
    console.error('[proof] login failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'Sign-in is unavailable right now. Try again shortly.' }, { status: 503 });
  }
}
