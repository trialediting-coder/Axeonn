// An inbound text to the tracking number. Stored; a STOP word is mirrored into
// phone_opt_outs so our own sends stop too (Twilio already blocks and confirms),
// and a START word clears it. A text from a known number stops that person's
// new-lead and quote follow-ups (a human is talking now); a STOP word stops all
// of their follow-ups. Replies with an empty <Response/>: no auto-reply.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { clearOptOut, lineForNumber, markOptedOut, recordMessage } from '@/lib/phoneLines';
import { emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callerKey, isStartWord, isStopWord, normalizePhone } from '@/lib/phoneShared';
import { stopRunsFor } from '@/lib/sequences';
import { projectMessage } from '@/lib/contacts';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';

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
      await projectMessage(p.MessageSid).catch((err) => {
        console.error('[phone/sms] inbox', p.MessageSid, redactDigits(errText(err)));
        return null;
      });
      if (from !== 'unknown') {
        if (isStopWord(p.Body)) await markOptedOut(line.onboardingId, from);
        if (isStartWord(p.Body)) await clearOptOut(line.onboardingId, from);
        // Logged, not thrown: the message is saved, and the cron re-checks replies before every send.
        // A reply ends the chase (new_lead, quote) but not a booked reminder or a review request; STOP ends everything.
        try {
          if (isStopWord(p.Body)) await stopRunsFor(line.onboardingId, { phone: from }, 'opted_out');
          else await stopRunsFor(line.onboardingId, { phone: from, kinds: ['new_lead', 'quote'] }, 'replied');
        } catch (err) {
          console.error('[phone/sms] stopRunsFor', err instanceof Error ? err.message : err);
        }
      }
    }
  } catch (err) {
    console.error('[phone/sms]', err instanceof Error ? err.message : err);
    return new Response(null, { status: 500 });
  }
  return new Response(emptyTwiml(), { status: 200, headers: TWIML_HEADERS });
}
