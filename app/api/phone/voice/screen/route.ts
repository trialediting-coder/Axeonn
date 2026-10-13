// app/api/phone/voice/screen/route.ts
// Call screening. The forwarded leg of an inbound call: when the owner's phone
// picks up, this says "Call for <business>. Press 1 to accept." A person presses
// 1 and the call bridges (screen/accept). Voicemail never does, so the leg
// hangs up, the parent <Dial> reports no-answer, and the missed-call text-back
// fires. This closes slice 1's voicemail gap. ?line=<id> is in the signed URL.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { getLineById } from '@/lib/phoneLines';
import { getOnboardingById } from '@/lib/onboarding';
import { screenTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { parseId } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/screen', { withQuery: true });
  if (!read.ok) return read.response;
  const lineId = parseId(new URL(req.url).searchParams.get('line'));
  let businessName: string | null = null;
  try {
    const line = lineId ? await getLineById(lineId) : null;
    businessName = line ? ((await getOnboardingById(line.onboardingId))?.businessName ?? null) : null;
  } catch (err) {
    // Only the name is looked up, so a database failure must not drop a live customer's call:
    // screening still works as "Call from your tracked phone number."
    console.error('[phone/screen]', lineId, err instanceof Error ? err.message : err);
  }
  return new Response(screenTwiml({ businessName, acceptUrl: webhookUrl('/api/phone/voice/screen/accept') }), { status: 200, headers: TWIML_HEADERS });
}
