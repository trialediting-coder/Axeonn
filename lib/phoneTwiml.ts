// The three TwiML documents the phone webhooks answer with. Strings, not a
// library: there are three of them and every attribute is tested. Client-safe
// by accident (no Node imports), but only the routes use it.

export const TWIML_HEADERS = { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' } as const;

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>';
const VOICE = 'Polly.Joanna';

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Inbound call: optional recording notice, then ring the client's phone. Caller ID stays the caller's, so the client sees who it is. */
export function forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string }): string {
  // The notice only makes sense when the call is actually recorded (R12).
  const say = input.consentNotice && input.recordCalls ? `<Say voice="${VOICE}">This call may be recorded for quality.</Say>` : '';
  const record = input.recordCalls
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  return `${HEAD}<Response>${say}<Dial action="${escapeXml(input.statusUrl)}" method="POST" timeout="20"${record}>${escapeXml(input.forwardTo)}</Dial></Response>`;
}

/** After the dial ends unanswered. */
export function afterDialTwiml(input: { textedBack: boolean }): string {
  const say = input.textedBack ? `<Say voice="${VOICE}">Sorry we missed you. We just sent you a text, reply there and we will get right back to you.</Say>` : '';
  return `${HEAD}<Response>${say}<Hangup/></Response>`;
}

export function emptyTwiml(): string {
  return `${HEAD}<Response></Response>`;
}
