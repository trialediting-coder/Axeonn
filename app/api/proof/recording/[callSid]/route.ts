// app/api/proof/recording/[callSid]/route.ts
// Signed-in client: streams one of their own call recordings. The Twilio URL
// never reaches the browser; the mp3 is fetched with our credentials and passed
// through. The lookup is scoped to the client's onboarding, so another client's
// call sid returns 404.
import { NextResponse } from 'next/server';
import { recordingUrlForCall } from '@/lib/phoneLines';
import { getSignedInClient } from '@/lib/proofServer';
import { fetchRecording } from '@/lib/twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ callSid: string }> }) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const { callSid } = await ctx.params;
    const url = await recordingUrlForCall(account.onboardingId, callSid);
    if (!url) return NextResponse.json({ error: 'No recording for that call' }, { status: 404 });
    const range = req.headers.get('range') ?? undefined;
    const upstream = await fetchRecording(url, { range });
    const headers: Record<string, string> = { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes' };
    const contentRange = upstream.headers.get('content-range');
    const contentLength = upstream.headers.get('content-length');
    if (contentRange) headers['Content-Range'] = contentRange;
    if (contentLength) headers['Content-Length'] = contentLength;
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    console.error('proof recording', err);
    return NextResponse.json({ error: 'Recording unavailable right now' }, { status: 502 });
  }
}
