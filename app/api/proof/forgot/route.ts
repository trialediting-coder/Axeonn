// app/api/proof/forgot/route.ts
// AxeonPROOF "forgot password": emails a reset link when the email has an
// account. Always answers the same way, so it never reveals who is a client.
import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/proofAuth';
import { sendPasswordResetEmail } from '@/lib/email';
import { APP_ORIGIN, PROOF_PATH } from '@/lib/hostRouting';
import { clientIp, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

const SENT = { ok: true, message: 'If that email has an AxeonPROOF account, a reset link is on its way.' };

export async function POST(req: Request) {
  if (rateLimited(`proof-forgot:${clientIp(req)}`, 6, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again in a few minutes.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  try {
    const reset = await createResetToken(body.email);
    if (reset) {
      await sendPasswordResetEmail({ to: reset.email, url: `${APP_ORIGIN}${PROOF_PATH}/reset/${reset.token}` });
    }
  } catch (err) {
    console.error('[proof] forgot failed', err instanceof Error ? err.message : err);
  }
  return NextResponse.json(SENT);
}
