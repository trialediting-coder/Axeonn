// lib/twilio.ts
// The slice of Twilio Axeon uses, over fetch: buy a local number per client, put
// it in that client's Messaging Service (which carries their 10DLC campaign),
// send a text, and prove a webhook really came from Twilio. One master account;
// no subaccounts (see the spec). Server-only.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.twilio.com/2010-04-01';
const MESSAGING = 'https://messaging.twilio.com/v1';

const sid = () => process.env.TWILIO_ACCOUNT_SID ?? '';
const token = () => process.env.TWILIO_AUTH_TOKEN ?? '';

export function isTwilioConfigured(): boolean {
  return Boolean(sid() && token());
}

/** The public URL Twilio will call. Must match what the number is configured with, byte for byte, or signatures fail. */
export function webhookUrl(path: string): string {
  const origin = (process.env.PHONE_WEBHOOK_ORIGIN || 'https://axeonstudio.co').replace(/\/+$/, '');
  return `${origin}${path}`;
}

/** HMAC-SHA1 of the URL followed by every POST param (sorted by key, key then value), base64. Twilio's own scheme. */
export function twilioSignature(url: string, params: Record<string, string>, authToken: string): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return createHmac('sha1', authToken).update(data, 'utf8').digest('base64');
}

export function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string | null, authToken: string = token()): boolean {
  if (!signature || !authToken) return false;
  const expected = Buffer.from(twilioSignature(url, params, authToken));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function formParams(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(body)) out[k] = v;
  return out;
}

const authHeader = () => `Basic ${Buffer.from(`${sid()}:${token()}`).toString('base64')}`;

async function call<T>(url: string, init: { method: 'GET' | 'POST' | 'DELETE'; form?: Record<string, string> }): Promise<T> {
  if (!isTwilioConfigured()) throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  const path = new URL(url).pathname;
  const res = await fetch(url, {
    method: init.method,
    headers: {
      authorization: authHeader(),
      ...(init.form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; code?: number };
    throw new Error(`Twilio ${res.status}${err.code ? ` (${err.code})` : ''}: ${err.message ?? 'request failed'}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`Twilio ${path}: bad JSON (${res.status})`);
  }
}

export async function createMessagingService(input: { friendlyName: string; inboundUrl: string }): Promise<{ sid: string }> {
  const r = await call<{ sid: string }>(`${MESSAGING}/Services`, {
    method: 'POST',
    form: { FriendlyName: input.friendlyName, InboundRequestUrl: input.inboundUrl, InboundMethod: 'POST', UseInboundWebhookOnNumber: 'false' },
  });
  return { sid: r.sid };
}

export async function searchLocalNumbers(areaCode: string): Promise<string[]> {
  const q = new URLSearchParams({ AreaCode: areaCode, SmsEnabled: 'true', VoiceEnabled: 'true', PageSize: '10' });
  const r = await call<{ available_phone_numbers: Array<{ phone_number: string }> }>(`${API}/Accounts/${sid()}/AvailablePhoneNumbers/US/Local.json?${q}`, { method: 'GET' });
  return r.available_phone_numbers.map((n) => n.phone_number);
}

export async function buyNumber(input: { phoneNumber: string; friendlyName: string; voiceUrl: string; smsUrl: string }): Promise<{ sid: string; phoneNumber: string }> {
  const r = await call<{ sid: string; phone_number: string }>(`${API}/Accounts/${sid()}/IncomingPhoneNumbers.json`, {
    method: 'POST',
    form: { PhoneNumber: input.phoneNumber, FriendlyName: input.friendlyName, VoiceUrl: input.voiceUrl, VoiceMethod: 'POST', SmsUrl: input.smsUrl, SmsMethod: 'POST' },
  });
  return { sid: r.sid, phoneNumber: r.phone_number };
}

export async function attachNumberToService(serviceSid: string, phoneNumberSid: string): Promise<void> {
  await call(`${MESSAGING}/Services/${serviceSid}/PhoneNumbers`, { method: 'POST', form: { PhoneNumberSid: phoneNumberSid } });
}

export async function sendSms(input: { serviceSid: string; to: string; body: string }): Promise<{ sid: string; status: string }> {
  const r = await call<{ sid: string; status: string }>(`${API}/Accounts/${sid()}/Messages.json`, {
    method: 'POST',
    form: { MessagingServiceSid: input.serviceSid, To: input.to, Body: input.body },
  });
  return { sid: r.sid, status: r.status };
}

export async function releaseNumber(phoneNumberSid: string): Promise<void> {
  await call(`${API}/Accounts/${sid()}/IncomingPhoneNumbers/${phoneNumberSid}.json`, { method: 'DELETE' });
}

/** GET a call recording's audio (the Recording URL plus .mp3) with account auth; returns the raw Response so a route can stream it. */
export async function fetchRecording(recordingUrl: string): Promise<Response> {
  if (!isTwilioConfigured()) throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  const res = await fetch(`${recordingUrl}.mp3`, { method: 'GET', headers: { authorization: authHeader() }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Twilio recording fetch failed (${res.status})`);
  return res;
}
