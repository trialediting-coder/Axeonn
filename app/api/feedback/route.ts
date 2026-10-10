// app/api/feedback/route.ts
// POST { token, rating?, comment?, answers? } from the /f/<token> page. The token is the
// only credential: it names one client, one kind and one month, signed with
// the server secret, so nothing else can be written.
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { readFeedbackToken, recordFeedback } from '@/lib/feedback';
import { getOnboardingById } from '@/lib/onboarding';
import { clientIp, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (rateLimited(`feedback:${clientIp(req)}`, 20, 60_000)) throw new Error('Too many requests, try again in a minute');
    const body = await readBody(req);
    const ref = readFeedbackToken(body.token);
    if (!ref) throw new Error('This link has expired');
    const onboarding = await getOnboardingById(ref.onboardingId);
    if (!onboarding) throw new Error('This link has expired');
    const entry = await recordFeedback(ref, { rating: body.rating, comment: body.comment, answers: body.answers, referredBy: body.referredBy }, { businessName: onboarding.businessName || onboarding.clientEmail, token: onboarding.token });
    if (!entry && typeof body.referredBy !== 'string') throw new Error('Write a sentence or pick an answer first');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
