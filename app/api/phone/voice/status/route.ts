// The <Dial> action: Twilio posts DialCallStatus when the forwarded leg ends.
// This is where a call becomes a row and a missed call becomes a text. Twilio
// retries on a failure, so recordCall is an upsert and sendTextBack claims the
// call atomically and checks the 24-hour window before sending.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, recordCall, sendTextBack } from '@/lib/phoneLines';
import { afterDialTwiml, emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callOutcome, callerKey, normalizePhone } from '@/lib/phoneShared';
import { getOnboardingById } from '@/lib/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });
const fail = (tag: string, err: unknown) => {
  console.error(tag, err instanceof Error ? err.message : err);
  return new Response(null, { status: 500 });
};

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/voice/status');
  if (!read.ok) return read.response;
  const p = read.params;
  const to = normalizePhone(p.To);
  let line;
  try {
    line = to ? await lineForNumber(to) : null;
  } catch (err) {
    return fail('[phone/status] line lookup', err);
  }
  if (!line || !p.CallSid) return twiml(emptyTwiml());

  const from = callerKey(p.From);
  const outcome = callOutcome(p.DialCallStatus);
  const seconds = p.DialCallDuration ? Number.parseInt(p.DialCallDuration, 10) : null;
  try {
    await recordCall(line.onboardingId, {
      callSid: p.CallSid,
      fromNumber: from,
      toNumber: line.phoneNumber,
      outcome,
      dialStatus: p.DialCallStatus ?? '',
      durationSeconds: seconds !== null && Number.isFinite(seconds) ? seconds : null,
    });
  } catch (err) {
    return fail('[phone/status] recordCall', err);
  }
  if (outcome === 'answered') return twiml(emptyTwiml());

  // The call row is saved; a text-back problem must not make Twilio retry the whole webhook.
  let textedBack = false;
  if (from !== 'unknown') {
    try {
      const onboarding = await getOnboardingById(line.onboardingId);
      textedBack = await sendTextBack(line, onboarding?.businessName ?? null, from, p.CallSid);
    } catch (err) {
      console.error('[phone/status] sendTextBack', err instanceof Error ? err.message : err);
    }
  }
  return twiml(afterDialTwiml({ textedBack }));
}
