// app/api/welcome/[token]/password/route.ts
// The onboarding portal's last step: the verified client creates their AxeonPROOF
// password. Gated by the portal's email-code device cookie, so only someone who
// proved the client's inbox can set it.
import { NextResponse } from 'next/server';
import { setPasswordForOnboarding } from '@/lib/proofAuth';
import { withProofSession } from '@/lib/proofServer';
import { clientIp, isDeviceVerified, loadOnboarding, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`proof-set:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return notFound();
  if (!(await isDeviceVerified(onboarding.token))) {
    return NextResponse.json({ ok: false, error: 'Verify this device first.', reason: 'unverified' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== 'string') return NextResponse.json({ ok: false, error: 'Enter a password.' }, { status: 400 });
  try {
    const account = await setPasswordForOnboarding(onboarding, body.password);
    return withProofSession(NextResponse.json({ ok: true }), account);
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Could not save the password.' }, { status: 400 });
  }
}
