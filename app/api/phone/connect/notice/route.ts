// app/api/phone/connect/notice/route.ts
// The lead's leg of a recorded call connect call: when the lead picks up they
// hear the recording notice, then Twilio bridges them to the owner.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { recordingNoticeTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/connect/notice');
  if (!read.ok) return read.response;
  return new Response(recordingNoticeTwiml(), { status: 200, headers: TWIML_HEADERS });
}
