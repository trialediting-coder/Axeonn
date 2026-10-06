// app/api/welcome/[token]/code/route.ts
// Public: emails a fresh 6-digit code to the address on the onboarding. The
// token in the URL is the first factor, the inbox is the second. Limits: per IP
// (route), 60s resend cooldown and a lifetime cap per onboarding (lib/onboarding).
import { NextResponse } from 'next/server';
import { issueVerificationCode, maskEmail } from '@/lib/onboarding';
import { sendVerificationCodeEmail } from '@/lib/email';
import { clientIp, loadOnboarding, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`code:${clientIp(req)}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again in a few minutes.' }, { status: 429 });
  }
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return notFound();

  const issued = await issueVerificationCode(onboarding);
  if (!issued.ok) {
    if (issued.reason === 'cooldown') {
      return NextResponse.json({ ok: false, error: 'We just sent a code. Give it a minute, then try again.' }, { status: 429 });
    }
    if (issued.reason === 'limit') {
      return NextResponse.json(
        { ok: false, error: 'Too many codes have been sent for this link. Call us at (515) 493-8017 and we will sort it out.' },
        { status: 429 }
      );
    }
    return notFound();
  }

  try {
    await sendVerificationCodeEmail({ to: onboarding.clientEmail, code: issued.code });
  } catch (err) {
    console.error('[welcome] code email failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'We could not send the email right now. Try again shortly.' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, sentTo: maskEmail(onboarding.clientEmail) });
}
