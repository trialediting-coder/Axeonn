// Twilio calls this when the tracking number rings. We answer with TwiML that
// forwards the call to the client's phone. An unknown number gets a plain
// hang-up, never an error, so nothing about which numbers exist leaks.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber } from '@/lib/phoneLines';
import { afterDialTwiml, forwardTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { normalizePhone } from '@/lib/phoneShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice');
  if (!read.ok) return read.response;
  const to = normalizePhone(read.params.To);
  let line;
  try {
    line = to ? await lineForNumber(to) : null;
  } catch (err) {
    console.error('[phone/voice]', err instanceof Error ? err.message : err);
    return new Response(null, { status: 500 });
  }
  if (!line) return twiml(afterDialTwiml({ textedBack: false }));
  return twiml(
    forwardTwiml({
      forwardTo: line.forwardTo,
      consentNotice: line.consentNotice,
      recordCalls: line.recordCalls,
      statusUrl: webhookUrl('/api/phone/voice/status'),
      recordingUrl: webhookUrl('/api/phone/recording'),
      screenUrl: line.screenCalls ? webhookUrl(`/api/phone/voice/screen?line=${line.id}`) : undefined,
    }),
  );
}
