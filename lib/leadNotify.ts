// lib/leadNotify.ts
// Telling the owner a lead just did something (spec, slice 4 "Push" and
// "Cross-slice decisions"): a push to every device they turned notifications on
// for; if none took it, a text to their cell through their own line (never
// 8 pm to 8 am: quiet hours apply to every automated text) and an email, at
// most once per lead per OWNER_TEXT_THROTTLE_MINUTES. Each channel fails on its
// own and the result says what actually went. Forms use pushLeadAlert only:
// deliverLead (lib/leads.ts) already owns their text and email. The decision is
// planOwnerFallback (lib/pushShared.ts). Logs carry ids only. Server-only.
import { alertedRecently, recordAlert } from '@/lib/contacts';
import { inboxEnabled, OWNER_TEXT_THROTTLE_MINUTES } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { sendLeadActivityEmail } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { getOnboardingById } from '@/lib/onboarding';
import { getLine, sendOwnerAlert, type PhoneLine } from '@/lib/phoneLines';
import { pushToClient } from '@/lib/push';
import { LEAD_ALERT_TITLES, leadLink, leadPushMessage, ownerAlertText, planOwnerFallback, type LeadActivity } from '@/lib/pushShared';
import { redactDigits } from '@/lib/sequenceSchedule';

export interface NotifyResult {
  /** Devices that accepted the push. */
  pushed: number;
  sms: boolean;
  email: boolean;
}

const log = (what: string, contactId: number, err: unknown) => console.error(`[leadNotify] ${what}`, contactId, redactDigits(errText(err)));

const note = (onboardingId: number, contactId: number, channel: 'sms' | 'push' | 'email') =>
  recordAlert(onboardingId, contactId, channel).catch((err) => log(`alert not noted (${channel})`, contactId, err));

/** Push to the client's devices. How many took it; 0 when push is off or failed. Never throws. */
export async function pushLeadAlert(onboardingId: number, contactId: number, what: LeadActivity): Promise<number> {
  try {
    const n = await pushToClient(onboardingId, leadPushMessage(what, contactId));
    if (n > 0) await note(onboardingId, contactId, 'push');
    return n;
  } catch (err) {
    log('push', contactId, err);
    return 0;
  }
}

/** For inbound texts and missed calls (and later Messenger / Instagram). Never throws. */
export async function notifyLeadActivity(onboardingId: number, contactId: number, what: LeadActivity, now: Date = new Date()): Promise<NotifyResult> {
  const out: NotifyResult = { pushed: await pushLeadAlert(onboardingId, contactId, what), sms: false, email: false };
  if (out.pushed > 0) return out;
  try {
    let recent = false;
    try {
      recent = await alertedRecently(onboardingId, contactId, OWNER_TEXT_THROTTLE_MINUTES);
    } catch (err) {
      // Cannot tell: alert anyway. A second text beats a missed lead.
      log('throttle check failed', contactId, err);
    }
    if (recent) return out;
    const onboarding = await getOnboardingById(onboardingId).catch((err) => {
      log('onboarding lookup failed', contactId, err);
      return null;
    });
    if (!onboarding) return out;
    let line: PhoneLine | null = null;
    try {
      line = await getLine(onboardingId);
    } catch (err) {
      // No text without the line; the email still goes.
      log('line lookup failed', contactId, err);
    }
    const plan = planOwnerFallback({
      pushed: out.pushed,
      alertedRecently: recent,
      inboxEnabled: inboxEnabled(onboarding.tier),
      lineTimeZone: line && line.status === 'active' ? line.timeZone : null,
      now,
    });

    if (plan.sms && line) {
      try {
        // sendOwnerAlert -> sendClientSms keeps the 10DLC, US-number and opt-out gates.
        const r = await sendOwnerAlert(line, ownerAlertText(what, contactId, APP_ORIGIN));
        if (r.sent) {
          out.sms = true;
          await note(onboardingId, contactId, 'sms');
        }
      } catch (err) {
        log('owner text', contactId, err);
      }
    }

    if (plan.email) {
      try {
        const sent = await sendLeadActivityEmail({
          to: onboarding.clientEmail,
          businessName: onboarding.businessName,
          title: LEAD_ALERT_TITLES[what],
          url: `${APP_ORIGIN}${leadLink(contactId)}`,
        });
        if (sent) {
          out.email = true;
          await note(onboardingId, contactId, 'email');
        }
      } catch (err) {
        log('email', contactId, err);
      }
    }
  } catch (err) {
    log('fallback', contactId, err);
  }
  return out;
}
