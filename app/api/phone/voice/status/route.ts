// The <Dial> action: Twilio posts DialCallStatus when the forwarded leg ends.
// This is where a call becomes a row and a missed call becomes a text. Twilio
// retries on a failure, so recordCall is an upsert and sendTextBack claims the
// call atomically and checks the 24-hour window before sending.
import { after } from 'next/server';
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { lineForNumber, recordCall, sendTextBack } from '@/lib/phoneLines';
import { afterDialTwiml, emptyTwiml, TWIML_HEADERS } from '@/lib/phoneTwiml';
import { callOutcome, callerKey, normalizePhone, portalTextBack } from '@/lib/phoneShared';
import { getItemStates, getOnboardingById } from '@/lib/onboarding';
import { startMissedCallFollowUp, stopRunsFor } from '@/lib/sequences';
import { projectCall } from '@/lib/contacts';
import { notifyLeadActivity } from '@/lib/leadNotify';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';
import { withTimeout } from '@/lib/timeout';

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
  const outcome = callOutcome(p.DialCallStatus, p.DialBridged);
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
  // Into the leads inbox, started before any text-back so that, when it finishes within
  // its 2 seconds, a brand-new caller is created as a caller (and matched to a tap on the
  // site's call button) rather than as a texter. An answered call moves the contact to
  // Contacted. Never fails the webhook, and never holds the TwiML more than 2 seconds
  // (S4-R5): one that loses the race may finish after the text-back, in after(), so a
  // serverless function is not frozen before it is written.
  const callSid = p.CallSid;
  let slow = false;
  const projection = projectCall(callSid).catch((err) => {
    console.error('[phone/status] inbox', callSid, redactDigits(errText(err)));
    return null;
  });
  await withTimeout(projection, 2000, () => {
    slow = true;
    console.error('[phone/status] inbox slow, not waited for', callSid);
  });
  if (slow) after(projection.then(() => undefined));
  if (outcome === 'answered') {
    // They got through: the new-lead and quote follow-ups have done their job. Never changes the TwiML.
    if (from !== 'unknown') {
      try {
        await stopRunsFor(line.onboardingId, { phone: from, kinds: ['new_lead', 'quote'] }, 'answered');
      } catch (err) {
        console.error('[phone/status] stopRunsFor', err instanceof Error ? err.message : err);
      }
    }
    return twiml(emptyTwiml());
  }

  // The call row is saved; a text-back problem must not make Twilio retry the whole webhook.
  let textedBack = false;
  if (from !== 'unknown') {
    try {
      const onboarding = await getOnboardingById(line.onboardingId).catch(() => null);
      // A message set on the line in admin wins; otherwise the one the client wrote in the portal.
      const portal = line.textBackMessage ? null : await getItemStates(line.onboardingId).then((s) => portalTextBack(s['phone-setup']?.data?.textBack)).catch(() => null);
      textedBack = await sendTextBack(portal ? { ...line, textBackMessage: portal } : line, onboarding?.businessName ?? null, from, p.CallSid);
    } catch (err) {
      console.error('[phone/status] sendTextBack', err instanceof Error ? err.message : err);
    }
  }
  // Refresh the inbox line to "missed, texted back", after the response.
  if (textedBack) {
    after(() => projectCall(callSid).then(() => undefined, (err) => console.error('[phone/status] inbox', callSid, redactDigits(errText(err)))));
  }
  // A missed caller who has not replied in 30 minutes gets the new-lead follow-up (the wait lives in the engine).
  if (from !== 'unknown') {
    try {
      await startMissedCallFollowUp(line.onboardingId, p.CallSid, from, textedBack);
    } catch (err) {
      console.error('[phone/status] follow-up not started', err instanceof Error ? err.message : err);
    }
  }
  // Only missed calls reach here (answered returned above): push first, then a text and an email.
  // After the response; a slow projection is waited for there rather than dropping the alert.
  const onboardingId = line.onboardingId;
  after(async () => {
    try {
      const projected = await projection;
      if (projected) await notifyLeadActivity(onboardingId, projected.contactId, 'call');
    } catch (err) {
      console.error('[phone/status] alert', callSid, redactDigits(errText(err)));
    }
  });
  return twiml(afterDialTwiml({ textedBack }));
}
