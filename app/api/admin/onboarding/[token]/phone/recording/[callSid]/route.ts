// app/api/admin/onboarding/[token]/phone/recording/[callSid]/route.ts
// Admin-only: streams one call recording. The Twilio URL never reaches the
// browser; the mp3 is fetched with our credentials and passed through.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { recordingUrlForCall } from '@/lib/phoneLines';
import { fetchRecording } from '@/lib/twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ token: string; callSid: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { token, callSid } = await ctx.params;
    const onboarding = await getOnboardingByToken(token);
    if (!onboarding) throw new Error('Onboarding not found');
    const url = await recordingUrlForCall(onboarding.id, callSid);
    if (!url) return NextResponse.json({ error: 'No recording for that call' }, { status: 404 });
    const upstream = await fetchRecording(url);
    return new Response(upstream.body, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return jsonError(err);
  }
}
