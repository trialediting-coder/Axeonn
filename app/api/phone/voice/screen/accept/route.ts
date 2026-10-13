// app/api/phone/voice/screen/accept/route.ts
// The screen's <Gather> action. Only a 1 bridges (an empty document ends the
// whisper and Twilio connects the caller); any other key hangs up the owner's
// leg, which the parent <Dial> reports as a missed call.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { acceptTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/screen/accept');
  if (!read.ok) return read.response;
  return new Response(read.params.Digits === '1' ? acceptTwiml() : hangupTwiml(), { status: 200, headers: TWIML_HEADERS });
}
