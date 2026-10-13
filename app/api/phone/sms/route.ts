// An inbound text to the tracking number. Stored; a STOP word is mirrored into
// phone_opt_outs so our own sends stop too (Twilio already blocks and confirms),
// and a START word clears it. Replies with an empty <Response/>: no auto-reply.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { clearOptOut, lineForNumber, markOptedOut, recordMessage } from '@/lib/phoneLines';
import { emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callerKey, isStartWord, isStopWord, normalizePhone } from '@/lib/phoneShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/sms');
  if (!read.ok) return read.response;
  const p = read.params;
  const to = normalizePhone(p.To);
  try {
    const line = to ? await lineForNumber(to) : null;
    if (line && p.MessageSid) {
      const from = callerKey(p.From);
      await recordMessage(line.onboardingId, {
        messageSid: p.MessageSid,
        direction: 'inbound',
        fromNumber: from,
        toNumber: line.phoneNumber,
        body: (p.Body ?? '').slice(0, 1600),
        kind: 'inbound',
        status: 'received',
      });
      if (from !== 'unknown') {
        if (isStopWord(p.Body)) await markOptedOut(line.onboardingId, from);
        if (isStartWord(p.Body)) await clearOptOut(line.onboardingId, from);
      }
    }
  } catch (err) {
    console.error('[phone/sms]', err instanceof Error ? err.message : err);
    return new Response(null, { status: 500 });
  }
  return new Response(emptyTwiml(), { status: 200, headers: TWIML_HEADERS });
}
