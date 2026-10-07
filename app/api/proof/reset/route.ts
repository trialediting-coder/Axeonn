// app/api/proof/reset/route.ts
// Spends an emailed reset token on a new password and signs the client in.
import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/proofAuth';
import { withProofSession } from '@/lib/proofServer';
import { clientIp, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (rateLimited(`proof-reset:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
  try {
    const account = await resetPassword(body.token, body.password);
    return withProofSession(NextResponse.json({ ok: true }), account);
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Could not reset the password.' }, { status: 400 });
  }
}
