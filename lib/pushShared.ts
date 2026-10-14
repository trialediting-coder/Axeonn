// lib/pushShared.ts
// Lead notifications: what a push says and where it opens, the key conversion
// the browser needs, and the subscription shape the server accepts. Client-safe.
// A push never carries a phone number, a name or the words of a message: a fixed
// title, one fixed line, and a link inside PROOF. The same goes for the text and
// the email the owner gets when push is not on (lib/leadNotify.ts).

export type LeadActivity = 'text' | 'call' | 'form' | 'messenger' | 'instagram';

export interface PushMessage {
  title: string;
  body: string;
  /** A path inside PROOF. /proof works on both hosts (lib/hostRouting.ts sends it to the app). */
  url: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const LEAD_ALERT_TITLES: Record<LeadActivity, string> = {
  text: 'New text from a lead',
  call: 'Missed call from a lead',
  form: 'New form from your website',
  messenger: 'New Facebook message from a lead',
  instagram: 'New Instagram message from a lead',
};

export const leadLink = (contactId: number): string => `/proof?tab=leads&contact=${contactId}`;

export function leadPushMessage(what: LeadActivity, contactId: number): PushMessage {
  return { title: LEAD_ALERT_TITLES[what], body: 'Open AxeonPROOF to see it and reply.', url: leadLink(contactId) };
}

/** The fallback text to the owner's cell when no device has push on. */
export function ownerAlertText(what: LeadActivity, contactId: number, appOrigin: string): string {
  return `${LEAD_ALERT_TITLES[what]}. See it and reply in AxeonPROOF: ${appOrigin.replace(/\/$/, '')}${leadLink(contactId)}`;
}

// The browsers' push services. The server POSTs to whatever endpoint a browser
// registered, so only these hosts are accepted (no posting to arbitrary URLs).
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** True for an https URL on one of the browser push services. */
export function isKnownPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

export function isValidSubscription(raw: unknown): raw is PushSubscriptionInput {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } | null };
  if (typeof s.endpoint !== 'string' || s.endpoint.length > 2048) return false;
  if (!isKnownPushEndpoint(s.endpoint)) return false;
  const k = s.keys;
  return (
    !!k &&
    typeof k.p256dh === 'string' && typeof k.auth === 'string' &&
    k.p256dh.length <= 200 && k.auth.length <= 100 &&
    B64URL.test(k.p256dh) && B64URL.test(k.auth)
  );
}

/** The VAPID public key (base64url) as the bytes pushManager.subscribe wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** iOS only delivers web push to a site added to the Home Screen and opened from there. */
export function needsHomeScreenInstall(userAgent: string, standalone: boolean): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) && !standalone;
}
