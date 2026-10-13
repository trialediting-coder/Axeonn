// The TwiML documents the phone webhooks answer with. Strings, not a library:
// every attribute is tested. Client-safe by accident (no Node imports), but only
// the routes use it.
import { connectWhisperText } from '@/lib/leadShared';

export const TWIML_HEADERS = { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' } as const;

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>';
const VOICE = 'Polly.Joanna';

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Inbound call: optional recording notice, then ring the client's phone. Caller ID stays the caller's, so the
 * client sees who it is. With screenUrl (call screening), the owner's leg first runs that TwiML: press 1 to accept.
 */
export function forwardTwiml(input: { forwardTo: string; consentNotice: boolean; recordCalls: boolean; statusUrl: string; recordingUrl: string; screenUrl?: string }): string {
  // The notice only makes sense when the call is actually recorded (R12).
  const say = input.consentNotice && input.recordCalls ? `<Say voice="${VOICE}">This call may be recorded for quality.</Say>` : '';
  const record = input.recordCalls
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  const target = input.screenUrl
    ? `<Number url="${escapeXml(input.screenUrl)}" method="POST">${escapeXml(input.forwardTo)}</Number>`
    : escapeXml(input.forwardTo);
  return `${HEAD}<Response>${say}<Dial action="${escapeXml(input.statusUrl)}" method="POST" timeout="20"${record}>${target}</Dial></Response>`;
}

/** After the dial ends unanswered. */
export function afterDialTwiml(input: { textedBack: boolean }): string {
  const say = input.textedBack ? `<Say voice="${VOICE}">Sorry we missed you. We just sent you a text, reply there and we will get right back to you.</Say>` : '';
  return `${HEAD}<Response>${say}<Hangup/></Response>`;
}

export function emptyTwiml(): string {
  return `${HEAD}<Response></Response>`;
}

export function hangupTwiml(): string {
  return `${HEAD}<Response><Hangup/></Response>`;
}

/**
 * Call screening, on the owner's leg of a forwarded call. A person presses 1 and
 * the Gather action bridges; voicemail never does, so the leg hangs up and the
 * parent <Dial> reports no-answer: a real missed call, and the text-back fires.
 */
export function screenTwiml(input: { businessName: string | null; acceptUrl: string }): string {
  const name = input.businessName?.trim();
  const who = name ? `Call for ${name}.` : 'Call from your tracked phone number.';
  return `${HEAD}<Response><Gather numDigits="1" timeout="5" action="${escapeXml(input.acceptUrl)}" method="POST"><Say voice="${VOICE}">${escapeXml(who)} Press 1 to accept.</Say></Gather><Hangup/></Response>`;
}

/** The screen's Gather action after a 1: an empty document ends the whisper and Twilio bridges the call. */
export function acceptTwiml(): string {
  return emptyTwiml();
}

const detailsSay = (textedDetails: boolean) => `<Say voice="${VOICE}">Okay. We ${textedDetails ? 'texted' : 'emailed'} you their details.</Say>`;

/** Call connect, when the owner picks up: the lead's name, press 1. No key in 8 seconds: where the details went, then hang up. */
export function connectWhisperTwiml(input: { leadName: string; gatherUrl: string; textedDetails: boolean }): string {
  return `${HEAD}<Response><Gather numDigits="1" timeout="8" action="${escapeXml(input.gatherUrl)}" method="POST"><Say voice="${VOICE}">${escapeXml(connectWhisperText(input.leadName))}</Say></Gather>${detailsSay(input.textedDetails)}<Hangup/></Response>`;
}

/** Call connect, the owner pressed something other than 1. */
export function connectNoAnswerTwiml(input: { textedDetails: boolean }): string {
  return `${HEAD}<Response>${detailsSay(input.textedDetails)}<Hangup/></Response>`;
}

/**
 * Call connect, the owner pressed 1: dial the lead from the tracked number, so
 * the lead sees the business calling. noticeUrl plays the recording notice to
 * the lead when they pick up; null recordingUrl means the call is not recorded.
 */
export function connectDialTwiml(input: { leadPhone: string; callerId: string; statusUrl: string; recordingUrl: string | null; noticeUrl: string | null }): string {
  const record = input.recordingUrl
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(input.recordingUrl)}" recordingStatusCallbackMethod="POST"`
    : '';
  const number = input.noticeUrl
    ? `<Number url="${escapeXml(input.noticeUrl)}" method="POST">${escapeXml(input.leadPhone)}</Number>`
    : `<Number>${escapeXml(input.leadPhone)}</Number>`;
  return `${HEAD}<Response><Dial callerId="${escapeXml(input.callerId)}" action="${escapeXml(input.statusUrl)}" method="POST" timeout="25"${record}>${number}</Dial></Response>`;
}

/** Played to the lead's leg of a recorded call connect call; when it ends, Twilio bridges. */
export function recordingNoticeTwiml(): string {
  return `${HEAD}<Response><Say voice="${VOICE}">This call may be recorded for quality.</Say></Response>`;
}
