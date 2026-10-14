// lib/sequenceAdmin.ts
// Words for the admin Sequences card: stop reasons, the upload result, and why a
// manual follow-up did not start. Pure and client-safe (no database, no server imports).
import type { StopReason } from '@/lib/sequenceShared';

/** Exhaustive on purpose: adding a StopReason without a label fails the type check. */
export const STOP_REASON_LABELS: Record<StopReason, string> = {
  replied: 'Contact replied',
  answered: 'Call was answered',
  opted_out: 'Contact opted out',
  stage: 'Stopped by a tap',
  template_off: 'Sequence was turned off',
  missing_link: 'A link the message needs was removed',
  plan: 'Plan no longer includes follow-ups',
  failed: 'Sending failed',
  cancelled: 'Cancelled',
  template_changed: 'Template was edited; this run stopped',
  bad_number: "Number can't receive texts",
};

export function stopReasonLabel(reason: string): string {
  if (reason.startsWith('stage:')) return `Stopped by a tap: ${reason.slice('stage:'.length)}`;
  return Object.prototype.hasOwnProperty.call(STOP_REASON_LABELS, reason) ? STOP_REASON_LABELS[reason as StopReason] : reason;
}

/** "line N" is the physical line of the file. */
export function importNotice(imported: number, skipped: { line: number; reason: string }[]): string {
  const saved = `Saved ${imported} customer${imported === 1 ? '' : 's'}.`;
  if (!skipped.length) return saved;
  const list = skipped.slice(0, 3).map((s) => `line ${s.line} (${s.reason})`).join(', ');
  const parts = [saved, `Skipped ${skipped.length}: ${list}${skipped.length > 3 ? ', and more' : ''}.`];
  if (skipped.length === 1 && skipped[0].line === 1 && skipped[0].reason === 'no phone column') {
    parts.push("If your file has no header row, make sure the first row's phone is a US number.");
  }
  return parts.join(' ');
}

const REFUSALS: Record<string, string> = {
  plan: 'This plan does not include follow-ups.',
  disabled: 'New lead follow-up is turned off. Turn it on first.',
  no_contact: 'This lead has no phone or email to follow up with.',
  opted_out: 'This contact opted out of messages.',
  missing_link: 'The new-lead follow-up uses a link that is not set. Add the link first.',
  already_active: 'A follow-up is already running for this contact.',
  no_steps: 'Nothing could be scheduled: no step can be sent to this contact (check texting approval).',
  duplicate: 'A follow-up already started for this lead.',
};

export function startLeadNotice(result: { started: true; runId: number } | { started: false; reason: string }): string {
  return result.started ? 'Follow-up started.' : (REFUSALS[result.reason] ?? `Follow-up did not start (${result.reason}).`);
}
