// app/api/phone/connect/status/route.ts
// Two Twilio callbacks for one call connect call land here. The <Dial> action
// (DialCallStatus) when the owner-to-lead bridge ends: did the lead pick up.
// The call's own status callback (CallStatus) when the owner's leg ends. The
// row was written when the call started (startConnectCall); these update it.
// The recording arrives at /api/phone/recording under the same CallSid.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, markConnectEnded, recordCall } from '@/lib/phoneLines';
import { getSubmission } from '@/lib/leads';
import { emptyTwiml, hangupTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callOutcome, normalizePhone } from '@/lib/phoneShared';
import { parseId } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATH = '/api/phone/connect/status';
const twiml = (xml: string) => new Response(xml, { status: 200, headers: TWIML_HEADERS });

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, PATH, { withQuery: true });
  if (!read.ok) return read.response;
  const p = read.params;
  const leadId = parseId(new URL(req.url).searchParams.get('lead'));
  const from = normalizePhone(p.From);
  if (!p.CallSid || !leadId || !from) return twiml(hangupTwiml());
  try {
    const line = await lineForNumber(from);
    if (!line) return twiml(hangupTwiml());
    if (p.DialCallStatus) {
      const lead = await getSubmission(line.onboardingId, leadId);
      if (lead?.phone) {
        const seconds = p.DialCallDuration ? Number.parseInt(p.DialCallDuration, 10) : null;
        // An upsert, so it is also the fallback when startConnectCall's insert was lost: hence direction and leadId.
        await recordCall(line.onboardingId, {
          callSid: p.CallSid,
          fromNumber: lead.phone,
          toNumber: line.phoneNumber,
          outcome: callOutcome(p.DialCallStatus),
          dialStatus: p.DialCallStatus,
          durationSeconds: seconds !== null && Number.isFinite(seconds) ? seconds : null,
          direction: 'connect',
          leadId,
        });
      }
      return twiml(hangupTwiml());
    }
    if (p.CallStatus) await markConnectEnded(p.CallSid, p.CallStatus);
  } catch (err) {
    // A database failure is a 500, as in slice 1 (R16), so Twilio logs it and retries where it can.
    console.error('[phone/connect/status]', leadId, err instanceof Error ? err.message : err);
    return new Response(null, { status: 500 });
  }
  return twiml(emptyTwiml());
}
