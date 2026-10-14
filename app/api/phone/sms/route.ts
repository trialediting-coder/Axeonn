// An inbound text to the tracking number. Stored; a STOP word is mirrored into
// phone_opt_outs so our own sends stop too (Twilio already blocks and confirms),
// and a START word clears it. A text from a known number stops that person's
// new-lead and quote follow-ups (a human is talking now); a STOP word stops all
// of their follow-ups. A text from the line's own forward-to number is the
// owner (answering an alert), not a lead: no inbox row and no lead alert.
// Replies with an empty <Response/>: no auto-reply.
import { after } from 'next/server';
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { clearOptOut, lineForNumber, markOptedOut, recordMessage } from '@/lib/phoneLines';
import { emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callerKey, isStartWord, isStopWord, normalizePhone } from '@/lib/phoneShared';
import { stopRunsFor } from '@/lib/sequences';
import { projectMessage } from '@/lib/contacts';
import { notifyLeadActivity } from '@/lib/leadNotify';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';
import { withTimeout } from '@/lib/timeout';

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
      const messageSid = p.MessageSid;
      const fromOwner = from !== 'unknown' && from === normalizePhone(line.forwardTo);
      if (!fromOwner) {
        // Awaited (Task 10 reads the result) but never more than 2 seconds (S4-R5). One that loses
        // the race finishes in after(), so a serverless function is not frozen before it is written.
        let slow = false;
        const projection = projectMessage(messageSid).catch((err) => {
          console.error('[phone/sms] inbox', messageSid, redactDigits(errText(err)));
          return null;
        });
        await withTimeout(projection, 2000, () => {
          slow = true;
          console.error('[phone/sms] inbox slow, not waited for', messageSid);
        });
        if (slow) after(projection.then(() => undefined));
        // After Twilio has its answer: push first, then a text and an email if push is not on. Not for STOP / START.
        // A slow projection is waited for there rather than dropping the alert; a withheld sender projects to null.
        if (!isStopWord(p.Body) && !isStartWord(p.Body)) {
          const onboardingId = line.onboardingId;
          after(async () => {
            try {
              const projected = await projection;
              if (projected) await notifyLeadActivity(onboardingId, projected.contactId, 'text');
            } catch (err) {
              console.error('[phone/sms] alert', messageSid, redactDigits(errText(err)));
            }
          });
        }
      }
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
