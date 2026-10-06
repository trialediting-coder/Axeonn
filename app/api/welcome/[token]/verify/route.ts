// app/api/welcome/[token]/verify/route.ts
// Public: checks the 6-digit code and, on success, sets the signed device cookie
// that lets this browser open the portal for 30 days. Five wrong tries lock the
// code; the client asks for a new one.
import { NextResponse } from 'next/server';
import { isValidCodeFormat, verifyCode } from '@/lib/onboarding';
import { clientIp, loadOnboarding, notFound, rateLimited, withDeviceCookie } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`verify:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return notFound();

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (!isValidCodeFormat(code)) {
    return NextResponse.json({ ok: false, error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const result = await verifyCode(onboarding, code);
  if (result === 'ok') return withDeviceCookie(NextResponse.json({ ok: true }), onboarding.token);
  const messages = {
    wrong: 'That code is not right. Check the email and try again.',
    expired: 'That code has expired. Request a new one.',
    locked: 'Too many wrong tries. Request a new code.',
  } as const;
  return NextResponse.json({ ok: false, error: messages[result], reason: result }, { status: 400 });
}
