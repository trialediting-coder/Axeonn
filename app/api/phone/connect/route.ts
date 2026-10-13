// app/api/phone/connect/route.ts
// Call connect. Twilio fetches this when the owner answers our call about a new
// website lead (startConnectCall in lib/phoneLines.ts), and again with Digits
// when they press a key. ?lead=<id> is inside the signed URL, and the lead must
// belong to the client whose tracked number placed the call (From), so one
// client's lead can never ring through another client's line.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, recordCall } from '@/lib/phoneLines';
import { getSubmission, markConnectPressed } from '@/lib/leads';
import { connectDialTwiml, connectNoAnswerTwiml, connectWhisperTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { webhookUrl } from '@/lib/twilio';
import { normalizePhone } from '@/lib/phoneShared';
import { connectDecision, detailsWereTexted, parseId } from '@/lib/leadShared';
import { errText } from '@/lib/dbRows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATH = '/api/phone/connect';
const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, PATH, { withQuery: true });
  if (!read.ok) return read.response;
  const p = read.params;
  const leadId = parseId(new URL(req.url).searchParams.get('lead'));
  const from = normalizePhone(p.From);
  if (!leadId || !from) return twiml(hangupTwiml());

  let line;
  let lead;
  try {
    line = await lineForNumber(from);
    lead = line ? await getSubmission(line.onboardingId, leadId) : null;
  } catch (err) {
    // A database failure is a 500, as in slice 1 (R16): it shows in Twilio's debugger and is never mistaken for a refusal.
    console.error('[phone/connect] lookup', leadId, errText(err));
    return new Response(null, { status: 500 });
  }
  if (!line) return twiml(hangupTwiml());
  // S2-R1: "we texted you" only when the owner text is recorded as sent; anything else, NULL included, points to the email.
  const textedDetails = detailsWereTexted(lead?.alertTextStatus);

  // Gather posts back here only when a key was pressed; the first request has no Digits.
  if (p.Digits === undefined) {
    if (!lead?.phone) return twiml(hangupTwiml());
    if (p.CallSid) {
      // startConnectCall writes this row; if that write was lost, upsert it here as a connect row so it never lands as inbound.
      await recordCall(line.onboardingId, {
        callSid: p.CallSid,
        fromNumber: lead.phone,
        toNumber: line.phoneNumber,
        outcome: 'missed',
        dialStatus: 'queued',
        durationSeconds: null,
        direction: 'connect',
        leadId,
      }).catch((err) => console.error('[phone/connect] row fallback', leadId, errText(err)));
    }
    return twiml(connectWhisperTwiml({ leadName: lead.name, gatherUrl: webhookUrl(`${PATH}?lead=${leadId}`), textedDetails }));
  }

  const decision = connectDecision({ digits: p.Digits, lead, lineOnboardingId: line.onboardingId });
  if (decision.action === 'no_press') return twiml(connectNoAnswerTwiml({ textedDetails }));
  if (decision.action === 'reject') {
    console.warn('[phone/connect] not dialed', leadId, decision.reason);
    return twiml(hangupTwiml());
  }

  // The bridge matters more than the marker: a failed write is logged and the lead is still dialed.
  await markConnectPressed(line.onboardingId, leadId, p.CallSid ?? '').catch((err) => console.error('[phone/connect] press not saved', leadId, errText(err)));
  return twiml(
    connectDialTwiml({
      leadPhone: decision.phone,
      callerId: line.phoneNumber,
      statusUrl: webhookUrl(`/api/phone/connect/status?lead=${leadId}`),
      recordingUrl: line.recordCalls ? webhookUrl('/api/phone/recording') : null,
      noticeUrl: line.recordCalls && line.consentNotice ? webhookUrl('/api/phone/connect/notice') : null,
    }),
  );
}
