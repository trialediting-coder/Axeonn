// lib/metaShared.ts
// Client-safe types and pure helpers for slice 6 (Facebook Messenger and
// Instagram DMs into the leads inbox, reels posting for AxeonGROWTH). No Node
// imports, no database: the admin cards, the PROOF tab and the server modules
// (lib/meta.ts, lib/metaInbox.ts, lib/social.ts) all use these.

export type MetaChannel = 'messenger' | 'instagram';

export interface MetaAttachment {
  type: string;
  url: string | null;
}

/** One inbound DM, normalized from either webhook shape. */
export interface MetaInboundMessage {
  channel: MetaChannel;
  /** The Facebook page id (Messenger) or Instagram account id (Instagram) the message was sent to. */
  pageOrIgId: string;
  /** PSID (Messenger) or IGSID (Instagram): the person, scoped to that page or account. */
  senderId: string;
  mid: string;
  text: string;
  attachments: MetaAttachment[];
  /** Milliseconds since epoch from Meta; 0 when Meta sent none. */
  timestamp: number;
}

/** A connected page as the admin card and APIs see it. Deliberately has no token field. */
export interface MetaPagePublic {
  pageId: string;
  pageName: string;
  igUserId: string | null;
  igUsername: string | null;
  status: 'active' | 'needs_reconnect';
  lastError: string | null;
  connectedAt: string;
}

export type SocialPlatform = 'instagram' | 'facebook';
export type SocialStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = ['instagram', 'facebook'];

export interface SocialPost {
  id: number;
  platform: SocialPlatform;
  pageId: string;
  videoUrl: string;
  caption: string;
  scheduledAt: string | null;
  status: SocialStatus;
  remoteId: string | null;
  permalink: string | null;
  error: string | null;
  reach: number | null;
  plays: number | null;
  publishedAt: string | null;
  createdAt: string;
}

/** What the client's PROOF Ads tab lists: published reels only. */
export interface DashboardReel {
  platform: SocialPlatform;
  caption: string;
  publishedAt: string;
  permalink: string | null;
  reach: number | null;
  plays: number | null;
}

/** Meta's standard messaging window: replies are allowed for 24 hours after the person's last message. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Margin so a reply typed at 23:59:59 is not sent after the window closes. */
export const WINDOW_SAFETY_MS = 60 * 1000;
/** Send API text limits: Messenger 2000 characters; Instagram 1000 bytes of UTF-8. */
export const META_TEXT_MAX: Record<MetaChannel, number> = { messenger: 2000, instagram: 1000 };

/** Cuts to at most `max` UTF-8 bytes without splitting a code point (so never a surrogate pair). */
export function truncateUtf8(text: string, max: number): string {
  const enc = new TextEncoder();
  let out = '';
  let used = 0;
  for (const ch of text) {
    const n = enc.encode(ch).length;
    if (used + n > max) break;
    out += ch;
    used += n;
  }
  return out;
}

/** Null when the Send API will take the reply; otherwise the sentence to show. */
export function metaTextProblem(channel: MetaChannel, text: string): string | null {
  if (channel === 'instagram') {
    const bytes = new TextEncoder().encode(text).length;
    return bytes > META_TEXT_MAX.instagram ? `Instagram replies can be up to ${META_TEXT_MAX.instagram} bytes (about ${META_TEXT_MAX.instagram} letters; emoji and accents count more). This one is ${bytes}.` : null;
  }
  const length = [...text].length;
  return length > META_TEXT_MAX.messenger ? `Facebook replies can be up to ${META_TEXT_MAX.messenger} characters. This one is ${length}.` : null;
}
/** Instagram's documented caption limits. */
export const IG_CAPTION_MAX = 2200;
export const IG_HASHTAG_MAX = 30;

const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Turns a verified webhook body into the DMs worth recording. Messenger posts
 * object "page", Instagram posts object "instagram"; both carry entry[].messaging[]
 * with sender.id, recipient.id, timestamp and message { mid, text, attachments }.
 * Echoes (our own sends, or the owner replying in Meta Business Suite), reads,
 * deliveries, reactions and postbacks without a message are skipped. Duplicate
 * mids inside one delivery are kept once.
 */
export function parseWebhookBody(json: unknown): MetaInboundMessage[] {
  const body = obj(json);
  if (!body) return [];
  const object = body.object;
  if (object !== 'page' && object !== 'instagram') return [];
  const channel: MetaChannel = object === 'instagram' ? 'instagram' : 'messenger';
  const out: MetaInboundMessage[] = [];
  const seen = new Set<string>();
  for (const rawEntry of arr(body.entry)) {
    const entry = obj(rawEntry);
    if (!entry) continue;
    for (const rawEvent of arr(entry.messaging)) {
      const event = obj(rawEvent);
      const message = obj(event?.message);
      if (!event || !message) continue;
      if (message.is_echo === true || message.is_deleted === true) continue;
      const mid = str(message.mid);
      const senderId = str(obj(event.sender)?.id);
      const pageOrIgId = str(obj(event.recipient)?.id) || str(entry.id);
      if (!mid || !senderId || !pageOrIgId || seen.has(mid)) continue;
      seen.add(mid);
      const attachments: MetaAttachment[] = arr(message.attachments)
        .map(obj)
        .filter((a): a is Record<string, unknown> => a !== null)
        .map((a) => ({ type: str(a.type) || 'file', url: str(obj(a.payload)?.url) || null }));
      const timestamp = Number(event.timestamp ?? entry.time ?? 0);
      out.push({
        channel,
        pageOrIgId,
        senderId,
        mid,
        text: Array.from(str(message.text)).slice(0, 4000).join(''),
        attachments,
        timestamp: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0,
      });
    }
  }
  return out;
}

const ATTACHMENT_WORDS: Record<string, string> = {
  image: '[photo]',
  video: '[video]',
  audio: '[voice message]',
  file: '[file]',
  share: '[shared post]',
  ig_reel: '[shared reel]',
  reel: '[shared reel]',
  story_mention: '[story mention]',
  location: '[location]',
  sticker: '[sticker]',
};

/** "[photo]", "[video]"… for the inbox line; unknown types read "[attachment]". */
export function attachmentWord(type: string): string {
  return ATTACHMENT_WORDS[type] ?? '[attachment]';
}

/** The one line the inbox shows: the text, then a word per attachment, cut to 140 characters. */
export function messagePreview(m: Pick<MetaInboundMessage, 'text' | 'attachments'>): string {
  const parts = [m.text.replace(/\s+/g, ' ').trim(), ...m.attachments.map((a) => attachmentWord(a.type))].filter(Boolean);
  const line = parts.join(' ') || '[message]';
  return Array.from(line).length > 140 ? `${Array.from(line).slice(0, 139).join('')}…` : line;
}

const time = (v: string | number | Date): number => (v instanceof Date ? v.getTime() : typeof v === 'number' ? v : new Date(v).getTime());

/** True while Meta still allows a standard reply: within 24 hours (less a minute) of the person's last message. */
export function withinMessagingWindow(lastInboundAt: string | number | Date | null | undefined, now: number | Date = Date.now()): boolean {
  if (lastInboundAt == null || lastInboundAt === '') return false;
  const last = time(lastInboundAt);
  if (!Number.isFinite(last)) return false;
  return time(now) - last < MESSAGING_WINDOW_MS - WINDOW_SAFETY_MS;
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Meta's subscription handshake: answer hub.challenge only for mode "subscribe" and our verify token. */
export function verifyChallenge(query: URLSearchParams, verifyToken: string): string | null {
  if (!verifyToken) return null;
  if (query.get('hub.mode') !== 'subscribe') return null;
  const given = query.get('hub.verify_token') ?? '';
  const challenge = query.get('hub.challenge');
  if (!challenge || !sameString(given, verifyToken)) return null;
  return challenge;
}

/** Null when Instagram will take the caption; otherwise the sentence the admin card shows. */
export function captionProblem(caption: string): string | null {
  const length = [...caption].length;
  if (length > IG_CAPTION_MAX) return `Captions can be up to ${IG_CAPTION_MAX.toLocaleString('en-US')} characters. This one is ${length.toLocaleString('en-US')}.`;
  const tags = caption.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  if (tags > IG_HASHTAG_MAX) return `Instagram allows up to ${IG_HASHTAG_MAX} hashtags. This caption has ${tags}.`;
  return null;
}

/**
 * Masks anything token-shaped before a string reaches a log, an error, or a
 * response: the values of access_token, client_secret, fb_exchange_token,
 * input_token, appsecret_proof and code parameters, and bare Meta tokens (EAA…).
 */
export function secretRedact(text: string): string {
  return text
    .replace(/((?:access_token|client_secret|fb_exchange_token|input_token|appsecret_proof|code)=)[^&\s"']+/gi, '$1…')
    .replace(/("(?:access_token|client_secret|appsecret_proof)"\s*:\s*")[^"]*"/gi, '$1…"')
    .replace(/\bEAA[A-Za-z0-9]{12,}/g, 'EAA…');
}

export type ReplyDecision =
  | { route: 'sms' }
  | { route: 'meta'; channel: MetaChannel }
  | { route: 'blocked'; channel: MetaChannel; canText: boolean; message: string };

const PLATFORM_NAME: Record<MetaChannel, string> = { messenger: 'Facebook', instagram: 'Instagram' };

/**
 * Which way the inbox reply box sends. Meta only when the contact's most recent
 * inbound touch was a Messenger or Instagram message; the 24-hour window is
 * checked here, before any Send API call. `via: 'sms'` is the "Text them
 * instead" button and always goes to the SMS path.
 */
export function replyDecision(input: {
  lastMeta: { channel: MetaChannel; at: string } | null;
  lastOtherInboundAt: string | null;
  hasPhone: boolean;
  now: number;
  via?: 'sms' | null;
}): ReplyDecision {
  if (input.via === 'sms' || !input.lastMeta) return { route: 'sms' };
  const metaAt = time(input.lastMeta.at);
  if (input.lastOtherInboundAt && time(input.lastOtherInboundAt) > metaAt) return { route: 'sms' };
  const channel = input.lastMeta.channel;
  if (withinMessagingWindow(metaAt, input.now)) return { route: 'meta', channel };
  const name = PLATFORM_NAME[channel];
  return {
    route: 'blocked',
    channel,
    canText: input.hasPhone,
    message: input.hasPhone
      ? `${name} only lets you reply within 24 hours of their last message. Text them instead?`
      : `${name} only lets you reply within 24 hours of their last message. If they write again, you can answer here.`,
  };
}

/** Timeline label for the two new contact_events kinds. */
export function metaKindLabel(kind: string, direction: 'in' | 'out' = 'in'): string {
  if (kind === 'messenger') return direction === 'out' ? 'Facebook reply' : 'Facebook message';
  if (kind === 'instagram') return direction === 'out' ? 'Instagram reply' : 'Instagram message';
  return kind;
}

export const SOCIAL_STATUS_LABEL: Record<SocialStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Posted',
  failed: 'Failed',
};

/** The portal checklist item the callback marks done (data/onboardingItems.ts). */
export const META_CONNECT_ITEM = 'meta-connect';
/** Short-lived cookie that ties the OAuth callback to the browser that pressed Connect. */
export const META_NONCE_COOKIE = 'axeon_meta_nonce';

export type ConnectResult = 'connected' | 'partial' | 'no-pages' | 'cancelled' | 'error';

const NOTICES: Record<ConnectResult, { tone: 'ok' | 'warn'; text: string }> = {
  connected: { tone: 'ok', text: 'Facebook and Instagram are connected. New messages will show up with your leads.' },
  partial: {
    tone: 'warn',
    text: 'Some of your pages are connected, but Facebook would not finish setting up the others, so their messages are not coming in yet. Axeon can see which ones and will reconnect them with you.',
  },
  'no-pages': { tone: 'warn', text: 'Facebook did not share a page with us. Press Connect again and tick your business page when Facebook asks.' },
  cancelled: { tone: 'warn', text: 'No problem. You can connect Facebook any time from this page.' },
  error: { tone: 'warn', text: 'We could not connect Facebook just now. Try again, or call us and we will walk you through it.' },
};

/**
 * The callback's verdict once every granted page was tried: a page counts as
 * saved only when it is stored and subscribed to our webhook. None saved is an
 * error; some saved and some failed is partial, never "connected".
 */
export function connectOutcome(saved: number, failed: number): ConnectResult {
  if (saved <= 0) return 'error';
  return failed > 0 ? 'partial' : 'connected';
}

/** The banner for ?meta=<result> after the callback redirects back; null for anything else. */
export function connectNotice(flag: unknown): { tone: 'ok' | 'warn'; text: string } | null {
  return typeof flag === 'string' && Object.hasOwn(NOTICES, flag) ? NOTICES[flag as ConnectResult] : null;
}

/** Inbound touches other than a DM that send the reply by text instead (the same list metaReplyFor's SQL uses). */
export const OTHER_INBOUND_KINDS: readonly string[] = ['call', 'text_in', 'form', 'chat', 'booking'];

/**
 * replyDecision's inputs, read from the timeline the inbox page already has
 * (slice 4's DashboardEvent with metaDirection). The reply box uses it only to
 * pick its wording; the server decides again in metaReplyFor.
 */
export function replyContextFrom(events: ReadonlyArray<{ kind: string; at: string; metaDirection: 'in' | 'out' | null }>): {
  lastMeta: { channel: MetaChannel; at: string } | null;
  lastOtherInboundAt: string | null;
} {
  let lastMeta: { channel: MetaChannel; at: string } | null = null;
  let lastOther: string | null = null;
  for (const e of events) {
    if ((e.kind === 'messenger' || e.kind === 'instagram') && e.metaDirection === 'in') {
      if (!lastMeta || time(e.at) >= time(lastMeta.at)) lastMeta = { channel: e.kind, at: e.at };
    } else if (OTHER_INBOUND_KINDS.includes(e.kind)) {
      if (!lastOther || time(e.at) >= time(lastOther)) lastOther = e.at;
    }
  }
  return { lastMeta, lastOtherInboundAt: lastOther };
}
