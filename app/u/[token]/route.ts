// app/u/[token]/route.ts
// The unsubscribe link at the foot of every follow-up email (lib/email.ts
// sendSequenceEmail). No login: the signed token carries the client and the
// address (lib/unsubscribe.ts). GET only confirms ("Yes, unsubscribe" posts
// back here), so a mail filter that opens links cannot unsubscribe anyone;
// POST records the opt-out, and is also the one-click List-Unsubscribe target
// that Gmail and Apple Mail call (RFC 8058). This covers email; a texted STOP
// is handled by the phone webhook and stops the person's runs.
import { getOnboardingById } from '@/lib/onboarding';
import { replyPage } from '@/lib/leadShared';
import { markEmailOptedOut, parseUnsubscribeToken, unsubscribeSecret } from '@/lib/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

const HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const page = (status: number, heading: string, text: string) => new Response(replyPage({ heading, text, backUrl: null }), { status, headers: HEADERS });

const badLink = () =>
  page(400, 'This link does not work.', 'It may have been cut off. Reply to the email and ask not to be contacted, and they will take you off their list.');

async function businessName(onboardingId: number): Promise<string> {
  const onboarding = await getOnboardingById(onboardingId).catch(() => null);
  return onboarding?.businessName?.trim() || 'this business';
}

function confirmPage(token: string, business: string, email: string): string {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    `<title>Unsubscribe</title><style>body{font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#0a0a0a;line-height:1.5}button{font:inherit;padding:.6rem 1.1rem;border:0;border-radius:6px;background:#0a0a0a;color:#fff;cursor:pointer}</style></head>` +
    `<body><h1>Stop emails from ${esc(business)}?</h1><p>${esc(email)} will not get any more follow-up emails from them.</p>` +
    `<form method="post" action="/u/${esc(encodeURIComponent(token))}"><button type="submit">Yes, unsubscribe</button></form></body></html>`
  );
}

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  const { token } = await ctx.params;
  const ref = parseUnsubscribeToken(token, unsubscribeSecret());
  if (!ref) return badLink();
  return new Response(confirmPage(token, await businessName(ref.onboardingId), ref.email), { status: 200, headers: HEADERS });
}

export async function POST(_req: Request, ctx: Ctx): Promise<Response> {
  const { token } = await ctx.params;
  const ref = parseUnsubscribeToken(token, unsubscribeSecret());
  if (!ref) return badLink();
  try {
    await markEmailOptedOut(ref.onboardingId, ref.email);
  } catch (err) {
    console.error('unsubscribe: not recorded', ref.onboardingId, err instanceof Error ? err.message : err);
    return page(500, 'Something went wrong.', 'You are not unsubscribed yet. Please try again in a minute.');
  }
  const business = await businessName(ref.onboardingId);
  return page(200, `You won't get more emails from ${business}.`, `${ref.email} is unsubscribed. If you reply to an earlier email, they can still answer you.`);
}
