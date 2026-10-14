// app/u/[token]/route.ts
// The unsubscribe link at the foot of every follow-up email (lib/email.ts
// sendSequenceEmail). No login and no page: the signed token carries the client
// and the address (lib/unsubscribe.ts), the opt-out is recorded for that client,
// and a plain HTML page confirms it. GET is the link; POST is the one-click
// List-Unsubscribe that Gmail and Apple Mail send (RFC 8058). Emails only:
// a texted STOP is handled by the phone webhook and stops texts only.
import { getOnboardingById } from '@/lib/onboarding';
import { replyPage } from '@/lib/leadShared';
import { markEmailOptedOut, parseUnsubscribeToken, unsubscribeSecret } from '@/lib/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };

const page = (status: number, heading: string, text: string) => new Response(replyPage({ heading, text, backUrl: null }), { status, headers: HEADERS });

async function unsubscribe(ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const ref = parseUnsubscribeToken(token, unsubscribeSecret());
  if (!ref) return page(400, 'This link does not work.', 'It may have been cut off. Reply to the email and ask not to be contacted, and they will take you off their list.');
  try {
    await markEmailOptedOut(ref.onboardingId, ref.email);
  } catch (err) {
    console.error('unsubscribe: not recorded', ref.onboardingId, err instanceof Error ? err.message : err);
    return page(500, 'Something went wrong.', 'You are not unsubscribed yet. Please try the link again in a minute.');
  }
  const onboarding = await getOnboardingById(ref.onboardingId).catch(() => null);
  const business = onboarding?.businessName?.trim() || 'this business';
  return page(200, `You won't get more emails from ${business}.`, `${ref.email} is unsubscribed. If you reply to an earlier email, they can still answer you.`);
}

export function GET(_req: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  return unsubscribe(ctx);
}

export function POST(_req: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  return unsubscribe(ctx);
}
