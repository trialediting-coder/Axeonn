// lib/meta.ts
// The slice of Meta's Graph API Axeon uses, over fetch (no SDK): Facebook Login
// for a client's page, the Messenger/Instagram webhook signature, the Send API,
// and Instagram reels publishing. Every call takes an optional fetch so tests
// never touch the network. Tokens travel only in the query string or body Meta
// documents, every request carries appsecret_proof, and every error is passed
// through secretRedact so no token reaches a log or a response. Server-only.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { secretRedact, type MetaChannel } from '@/lib/metaShared';
import { isSecretsConfigured } from '@/lib/secretBox';
import { APP_ORIGIN } from '@/lib/hostRouting';

export const GRAPH_VERSION = 'v21.0';
const GRAPH_TIMEOUT_MS = 10_000;
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

/**
 * The spec's three scopes plus what Meta requires around them:
 * pages_show_list (list pages), pages_manage_metadata (subscribe a page to the
 * webhook), pages_read_engagement (read the linked Instagram account),
 * pages_manage_posts (page video), instagram_manage_insights (reel reach).
 */
export const META_SCOPES = [
  'pages_show_list',
  'pages_manage_metadata',
  'pages_read_engagement',
  'pages_messaging',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_manage_messages',
  'instagram_content_publish',
  'instagram_manage_insights',
] as const;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const appId = () => process.env.META_APP_ID ?? '';
const appSecret = () => process.env.META_APP_SECRET ?? '';
export const metaVerifyToken = () => process.env.META_VERIFY_TOKEN ?? '';

/** All four must be set: the app, its secret, the webhook verify token, and the key that seals page tokens. */
export function isMetaConfigured(): boolean {
  return Boolean(appId() && appSecret() && metaVerifyToken() && isSecretsConfigured());
}

/** Every Meta route starts with this: null when configured, otherwise the 503 to return. */
export function metaUnavailable(): Response | null {
  return isMetaConfigured() ? null : Response.json({ error: 'Meta is not configured' }, { status: 503 });
}

/**
 * Must match a "Valid OAuth Redirect URI" in the Meta app, byte for byte. On the
 * app host (APP_URL, e.g. https://app.axeonstudio.co) because that is where the
 * portal and admin live, so the nonce cookie set by /api/meta/connect comes back.
 */
export function metaRedirectUri(): string {
  return `${APP_ORIGIN}/api/meta/callback`;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: number | null,
    readonly subcode: number | null
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
  /** Code 190: the token expired or the person removed the app. The page must be reconnected. */
  get tokenInvalid(): boolean {
    return this.code === 190;
  }
  /**
   * The 24-hour window has closed: code 10 with subcode 2018278 (Messenger) or
   * 2534022 (Instagram). A bare code 10 is a permission error, not a window error.
   */
  get outsideWindow(): boolean {
    return this.subcode === 2018278 || this.subcode === 2534022 || (this.code === 10 && /allowed window|24.?hour/i.test(this.message));
  }
  /** Permission or auth failure that is not a window error (code 10/200, or 190): never advise "text them instead". */
  get permissionDenied(): boolean {
    return !this.outsideWindow && (this.code === 10 || this.code === 200 || this.code === 190);
  }
}

/** HMAC-SHA256 of the access token with the app secret, hex. Meta's "appsecret_proof". */
export function appSecretProof(accessToken: string, secret: string = appSecret()): string {
  return createHmac('sha256', secret).update(accessToken).digest('hex');
}

/**
 * Meta signs every webhook POST: X-Hub-Signature-256 = "sha256=" + hex HMAC-SHA256
 * of the raw request body with the app secret. Checked on the raw bytes, before parsing.
 */
export function verifySignature(rawBody: Buffer | string, header: string | null, secret: string): boolean {
  if (!header || !secret || !/^sha256=[0-9a-fA-F]{64}$/.test(header)) return false;
  const given = Buffer.from(header.slice('sha256='.length), 'hex');
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface ConnectState {
  /** The onboarding token the connection is for. */
  token: string;
  /** Random, also set as a cookie on the browser that started the flow. */
  nonce: string;
  /** Where to land afterwards. */
  from: 'portal' | 'admin';
}

export const STATE_TTL_MS = 15 * 60 * 1000;
const stateKey = (secret: string) => createHmac('sha256', secret).update('axeon-meta-state').digest();

export function newNonce(): string {
  return randomBytes(16).toString('base64url');
}

/** OAuth `state`: base64url JSON { t, n, f, e } + "." + HMAC. Self-contained; nothing stored. */
export function signState(s: ConnectState, secret: string = appSecret(), now: number = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ t: s.token, n: s.nonce, f: s.from, e: now + STATE_TTL_MS })).toString('base64url');
  const sig = createHmac('sha256', stateKey(secret)).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyState(state: string | null, secret: string = appSecret(), now: number = Date.now()): ConnectState | null {
  if (!state || !secret) return null;
  const [payload, sig, extra] = state.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  const expected = Buffer.from(createHmac('sha256', stateKey(secret)).update(payload).digest('base64url'));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { t?: unknown; n?: unknown; f?: unknown; e?: unknown };
    if (typeof p.t !== 'string' || typeof p.n !== 'string' || typeof p.e !== 'number' || p.e < now) return null;
    return { token: p.t, nonce: p.n, from: p.f === 'admin' ? 'admin' : 'portal' };
  } catch {
    return null;
  }
}

/**
 * Facebook Login dialog: https://www.facebook.com/v21.0/dialog/oauth?client_id&redirect_uri&state&scope.
 * A Business-type app using "Facebook Login for Business" asks for a saved
 * configuration instead of a scope list: set META_LOGIN_CONFIG_ID and the
 * dialog gets config_id (the configuration lists the same permissions).
 */
export function oauthUrl(state: string): string {
  const q = new URLSearchParams({ client_id: appId(), redirect_uri: metaRedirectUri(), state, response_type: 'code' });
  const configId = process.env.META_LOGIN_CONFIG_ID;
  if (configId) q.set('config_id', configId);
  else q.set('scope', META_SCOPES.join(','));
  return `${DIALOG}?${q}`;
}

type GraphInit = {
  method?: 'GET' | 'POST' | 'DELETE';
  query?: Record<string, string>;
  json?: unknown;
  /** Adds access_token and appsecret_proof to the query string. */
  token?: string;
  /** Abort after this long (default 10 s). */
  timeoutMs?: number;
  /** Caller's own abort signal, combined with the timeout. */
  signal?: AbortSignal;
};

/** One Graph API request. Errors come back as MetaApiError with every secret masked. */
export async function graph<T>(path: string, init: GraphInit = {}, f: FetchLike = fetch): Promise<T> {
  const query = new URLSearchParams(init.query ?? {});
  if (init.token) {
    query.set('access_token', init.token);
    query.set('appsecret_proof', appSecretProof(init.token));
  }
  const qs = query.toString();
  const url = `${GRAPH}${path}${qs ? `?${qs}` : ''}`;
  let res: Response;
  // A ref'd timer (AbortSignal.timeout's is unref'd) so a hung request is always cut off, and cleared once the call settles.
  const timer = new AbortController();
  const timeoutId = setTimeout(() => timer.abort(), init.timeoutMs ?? GRAPH_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timer.signal]) : timer.signal;
  try {
    res = await f(url, {
      method: init.method ?? 'GET',
      headers: init.json !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
      cache: 'no-store',
      signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (signal.aborted || (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError'))) {
      throw new MetaApiError(`Meta request timed out (${path})`, 0, null, null);
    }
    throw new MetaApiError(secretRedact(`Meta request failed: ${err instanceof Error ? err.message : String(err)} (${path})`), 0, null, null);
  }
  const body = (await res.json().catch(() => null)) as (Record<string, unknown> & { error?: { message?: string; code?: number; error_subcode?: number } }) | null;
  clearTimeout(timeoutId);
  if (!res.ok || body?.error) {
    const e = body?.error ?? {};
    const code = typeof e.code === 'number' ? e.code : null;
    const sub = typeof e.error_subcode === 'number' ? e.error_subcode : null;
    const label = code !== null ? ` (${code}${sub !== null ? `/${sub}` : ''})` : '';
    throw new MetaApiError(secretRedact(`Meta ${res.status}${label}: ${e.message ?? 'request failed'} (${path})`), res.status, code, sub);
  }
  if (body === null) throw new MetaApiError(`Meta ${res.status}: bad JSON (${path})`, res.status, null, null);
  return body as T;
}

/** GET /oauth/access_token?client_id&redirect_uri&client_secret&code → short-lived user token. */
export async function exchangeCode(code: string, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ access_token: string }>(
    '/oauth/access_token',
    { query: { client_id: appId(), redirect_uri: metaRedirectUri(), client_secret: appSecret(), code } },
    f
  );
  return r.access_token;
}

/** GET /oauth/access_token?grant_type=fb_exchange_token → long-lived user token (about 60 days). */
export async function longLivedToken(shortToken: string, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ access_token: string }>(
    '/oauth/access_token',
    { query: { grant_type: 'fb_exchange_token', client_id: appId(), client_secret: appSecret(), fb_exchange_token: shortToken } },
    f
  );
  return r.access_token;
}

/** GET /me?fields=id: the app-scoped user id, so a deauthorize or deletion callback can find their pages. */
export async function metaUserId(userToken: string, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ id: string }>('/me', { query: { fields: 'id' }, token: userToken }, f);
  return r.id;
}

export interface GraphPage {
  id: string;
  name: string;
  /** Long-lived when listed with a long-lived user token. Sealed before it is stored; never logged. */
  accessToken: string;
}

/** GET /me/accounts: the pages the person granted in the login dialog, each with its page token. */
export async function listPages(userToken: string, f: FetchLike = fetch): Promise<GraphPage[]> {
  const r = await graph<{ data?: Array<{ id: string; name?: string; access_token?: string }> }>(
    '/me/accounts',
    { query: { fields: 'id,name,access_token', limit: '100' }, token: userToken },
    f
  );
  return (r.data ?? []).filter((p) => p.id && p.access_token).map((p) => ({ id: p.id, name: p.name ?? 'Facebook page', accessToken: p.access_token! }));
}

/** GET /{page-id}?fields=instagram_business_account{id,username}: the Instagram professional account linked to the page. */
export async function igAccountFor(pageId: string, pageToken: string, f: FetchLike = fetch): Promise<{ id: string; username: string | null } | null> {
  const r = await graph<{ instagram_business_account?: { id: string; username?: string } }>(
    `/${encodeURIComponent(pageId)}`,
    { query: { fields: 'instagram_business_account{id,username}' }, token: pageToken },
    f
  );
  const ig = r.instagram_business_account;
  return ig?.id ? { id: ig.id, username: ig.username ?? null } : null;
}

/** POST /{page-id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks: the page starts sending us webhooks. */
export async function subscribePage(pageId: string, pageToken: string, f: FetchLike = fetch): Promise<void> {
  await graph(`/${encodeURIComponent(pageId)}/subscribed_apps`, { method: 'POST', query: { subscribed_fields: 'messages,messaging_postbacks' }, token: pageToken }, f);
}

/** DELETE /{page-id}/subscribed_apps: stop webhooks for a disconnected page. */
export async function unsubscribePage(pageId: string, pageToken: string, f: FetchLike = fetch): Promise<void> {
  await graph(`/${encodeURIComponent(pageId)}/subscribed_apps`, { method: 'DELETE', token: pageToken }, f);
}

/**
 * The person's display name, best effort. Messenger: GET /{psid}?fields=first_name,last_name
 * (User Profile API). Instagram: GET /{igsid}?fields=name,username. Null on any failure.
 */
export async function profileName(channel: MetaChannel, userId: string, pageToken: string, f: FetchLike = fetch): Promise<string | null> {
  try {
    if (channel === 'messenger') {
      const r = await graph<{ first_name?: string; last_name?: string }>(`/${encodeURIComponent(userId)}`, { query: { fields: 'first_name,last_name' }, token: pageToken }, f);
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
      return name || null;
    }
    const r = await graph<{ name?: string; username?: string }>(`/${encodeURIComponent(userId)}`, { query: { fields: 'name,username' }, token: pageToken }, f);
    return (r.name?.trim() || (r.username ? `@${r.username}` : '')) || null;
  } catch {
    return null;
  }
}

/**
 * Send API: POST /me/messages?access_token=<page token>
 * { recipient: { id }, message: { text }, messaging_type: 'RESPONSE' }.
 * The same endpoint serves Instagram with the linked page's token. Callers must
 * have checked the 24-hour window first (lib/metaShared.ts replyDecision).
 */
export async function sendMessage(input: { pageToken: string; recipientId: string; text: string }, f: FetchLike = fetch): Promise<{ messageId: string }> {
  const r = await graph<{ message_id?: string }>(
    '/me/messages',
    { method: 'POST', token: input.pageToken, json: { recipient: { id: input.recipientId }, message: { text: input.text }, messaging_type: 'RESPONSE' } },
    f
  );
  if (!r.message_id) throw new MetaApiError('Meta accepted the message but returned no id (/me/messages)', 200, null, null);
  return { messageId: r.message_id };
}

export type MetaSendFailure = {
  /** reconnect: token invalid (mark the page); permission: code 10/200; window: 24 hours passed; not_sent: Meta refused; unclear: it may have gone out. */
  kind: 'reconnect' | 'permission' | 'window' | 'not_sent' | 'unclear';
  status: number;
  error: string;
  canText: boolean;
};

const SEND_PLATFORM: Record<MetaChannel, string> = { messenger: 'Facebook', instagram: 'Instagram' };

/**
 * What a throw from sendMessage means for the inbox reply box. The SMS rule
 * (lib/inboxReply.ts liveSendFailure) carried over: only a Graph 4xx error
 * means nothing went out; a timeout, a dropped connection, a 5xx or a 2xx
 * without a message id may have been delivered, so it is 'unclear' and the box
 * clears instead of offering a resend. A permission or token problem never
 * suggests texting instead: the page has to be reconnected.
 */
export function metaSendFailure(err: unknown, channel: MetaChannel, hasPhone: boolean): MetaSendFailure {
  const name = SEND_PLATFORM[channel];
  if (err instanceof MetaApiError && err.tokenInvalid) {
    return { kind: 'reconnect', status: 502, error: `${name} stopped accepting replies from this page, so it needs to be reconnected. Ask Axeon to reconnect it.`, canText: false };
  }
  if (err instanceof MetaApiError && err.outsideWindow) {
    return { kind: 'window', status: 409, error: `${name} only lets you reply within 24 hours of their last message.${hasPhone ? ' Text them instead?' : ''}`, canText: hasPhone };
  }
  if (err instanceof MetaApiError && err.permissionDenied) {
    return {
      kind: 'permission',
      status: 502,
      error: `${name} would not let this page send the reply. The page needs to be reconnected or its messaging permissions turned back on. Ask Axeon to check it.`,
      canText: false,
    };
  }
  if (err instanceof MetaApiError && err.status >= 400 && err.status < 500) {
    return { kind: 'not_sent', status: 502, error: `${name} did not take the message. Try again in a minute.`, canText: hasPhone };
  }
  return { kind: 'unclear', status: 502, error: `${name} may have taken this message. Refresh and check the thread before you send it again.`, canText: false };
}

/** POST /{ig-user-id}/media media_type=REELS, video_url, caption → container id. Meta fetches the video from video_url. */
export async function createReelContainer(input: { igUserId: string; pageToken: string; videoUrl: string; caption: string }, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ id: string }>(
    `/${encodeURIComponent(input.igUserId)}/media`,
    { method: 'POST', token: input.pageToken, json: { media_type: 'REELS', video_url: input.videoUrl, caption: input.caption, share_to_feed: true } },
    f
  );
  return r.id;
}

export type ContainerStatus = 'IN_PROGRESS' | 'FINISHED' | 'PUBLISHED' | 'ERROR' | 'EXPIRED';

/** GET /{container-id}?fields=status_code,status */
export async function containerStatus(containerId: string, pageToken: string, f: FetchLike = fetch): Promise<{ code: ContainerStatus; detail: string | null }> {
  const r = await graph<{ status_code?: string; status?: string }>(`/${encodeURIComponent(containerId)}`, { query: { fields: 'status_code,status' }, token: pageToken }, f);
  const known: ContainerStatus[] = ['IN_PROGRESS', 'FINISHED', 'PUBLISHED', 'ERROR', 'EXPIRED'];
  const code = known.includes(r.status_code as ContainerStatus) ? (r.status_code as ContainerStatus) : 'IN_PROGRESS';
  return { code, detail: r.status ?? null };
}

/** POST /{ig-user-id}/media_publish creation_id → the published media id. */
export async function publishContainer(input: { igUserId: string; pageToken: string; containerId: string }, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ id: string }>(`/${encodeURIComponent(input.igUserId)}/media_publish`, { method: 'POST', token: input.pageToken, json: { creation_id: input.containerId } }, f);
  return r.id;
}

/** GET /{media-id}?fields=permalink, best effort. */
export async function mediaPermalink(mediaId: string, pageToken: string, f: FetchLike = fetch): Promise<string | null> {
  try {
    const r = await graph<{ permalink?: string }>(`/${encodeURIComponent(mediaId)}`, { query: { fields: 'permalink' }, token: pageToken }, f);
    return r.permalink ?? null;
  } catch {
    return null;
  }
}

/**
 * Facebook page video: POST /{page-id}/videos with file_url and description.
 * Chosen over /{page-id}/video_reels for v1: one call from a hosted URL, where
 * video_reels needs a three-step resumable upload session (start, upload to
 * rupload.facebook.com, finish). Facebook surfaces short vertical videos as
 * reels either way.
 */
export async function publishPageVideo(input: { pageId: string; pageToken: string; videoUrl: string; description: string }, f: FetchLike = fetch): Promise<string> {
  const r = await graph<{ id: string }>(
    `/${encodeURIComponent(input.pageId)}/videos`,
    { method: 'POST', token: input.pageToken, json: { file_url: input.videoUrl, description: input.description } },
    f
  );
  return r.id;
}

/**
 * GET /{media-id}/insights?metric=reach,views (Instagram). Meta retired the
 * `plays` metric for all versions on 2025-04-21 in favour of `views`. The stored
 * field keeps the name `plays` (social_posts.plays, DashboardReel.plays); it
 * holds views. If Meta rejects the pair with (#100), retry reach alone so reach
 * still lands. Missing metrics come back null.
 */
export async function mediaInsights(mediaId: string, pageToken: string, f: FetchLike = fetch): Promise<{ reach: number | null; plays: number | null }> {
  type Insights = { data?: Array<{ name: string; values?: Array<{ value?: number }>; total_value?: { value?: number } }> };
  const path = `/${encodeURIComponent(mediaId)}/insights`;
  let r: Insights;
  try {
    r = await graph<Insights>(path, { query: { metric: 'reach,views' }, token: pageToken }, f);
  } catch (err) {
    if (!(err instanceof MetaApiError) || err.code !== 100) throw err;
    r = await graph<Insights>(path, { query: { metric: 'reach' }, token: pageToken }, f);
  }
  const pick = (name: string): number | null => {
    const m = r.data?.find((d) => d.name === name);
    const v = m?.values?.[0]?.value ?? m?.total_value?.value;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };
  return { reach: pick('reach'), plays: pick('views') };
}

/**
 * Meta's deauthorize and data-deletion callbacks POST a form field
 * signed_request = base64url(HMAC-SHA256(payload, app secret)) + "." + base64url(JSON payload).
 */
export function parseSignedRequest(signed: string | null, secret: string = appSecret()): { userId: string } | null {
  if (!signed || !secret) return null;
  const [sig, payload, extra] = signed.split('.');
  if (!sig || !payload || extra !== undefined) return null;
  const given = Buffer.from(sig, 'base64url');
  const expected = createHmac('sha256', secret).update(payload).digest();
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { algorithm?: string; user_id?: unknown };
    if (data.algorithm?.toUpperCase() !== 'HMAC-SHA256' || typeof data.user_id !== 'string' || !data.user_id) return null;
    return { userId: data.user_id };
  } catch {
    return null;
  }
}
