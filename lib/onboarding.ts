// lib/onboarding.ts
// Client onboarding portal: one token per paying client at /welcome/<token>.
//
// Security model (owner decision 2026-10-06):
//   - The link holds a 20-character random token (~99 bits). Guessing is out of reach.
//   - The first visit on any device asks for a 6-digit code emailed to the address
//     that paid through Stripe. Codes are stored hashed, live 10 minutes, work once,
//     and lock after 5 wrong tries. A verified device gets a signed cookie for 30 days.
//   - Nothing in the portal is ever a password or login. Access to Google, Meta, and
//     registrars goes through each platform's own invite flow; the portal only
//     records "accepted". assertNoCredentialFields() guards the item definitions.
//   - Once onboarding is complete or closed, the portal turns read-only.
//
// Postgres is the source of truth (tables in lib/db.ts). Item definitions live in
// data/onboardingItems.ts; a missing onboarding_items row means "pending".
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { APP_ORIGIN } from '@/lib/hostRouting';
import {
  ONBOARDING_ITEMS,
  TIER_RANK,
  getItem,
  isOnboardingTier,
  itemsForTier,
  type ItemField,
  type OnboardingItem,
  type OnboardingTier,
} from '@/data/onboardingItems';

export type OnboardingStatus = 'active' | 'complete' | 'closed';
export type ItemStatus = 'pending' | 'done';
export type CompletedBy = 'client' | 'axeon';

export interface Onboarding {
  id: number;
  token: string;
  tier: OnboardingTier;
  clientEmail: string;
  clientName: string | null;
  businessName: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  checkoutSessionId: string | null;
  status: OnboardingStatus;
  welcomeSentAt: string | null;
  nudgeSentAt: string | null;
  lastClientActivityAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemState {
  itemKey: string;
  status: ItemStatus;
  data: Record<string, unknown>;
  completedBy: CompletedBy | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface Progress {
  clientTotal: number;
  clientDone: number;
  axeonTotal: number;
  axeonDone: number;
  /** Client-side completion, 0..100. This is what the client's progress bar shows. */
  percent: number;
}

export interface OnboardingInput {
  tier: OnboardingTier;
  clientEmail: string;
  clientName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  stripeCustomerId?: string | null;
  checkoutSessionId?: string | null;
}

interface OnboardingRow {
  id: number;
  token: string;
  tier: string;
  client_email: string;
  client_name: string | null;
  business_name: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  checkout_session_id: string | null;
  status: OnboardingStatus;
  code_hash: string | null;
  code_expires_at: string | null;
  code_attempts: number;
  code_sent_at: string | null;
  code_sends: number;
  welcome_sent_at: string | null;
  nudge_sent_at: string | null;
  last_client_activity_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  onboarding_id: number;
  item_key: string;
  status: ItemStatus;
  data: Record<string, unknown> | null;
  completed_by: CompletedBy | null;
  completed_at: string | null;
  updated_at: string;
}

// ───────────────────────────── Tokens, codes, cookies ─────────────────────────────

// No 0/O/1/I/L so the token survives being read over the phone. 31^20 ≈ 2^99.
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const TOKEN_LENGTH = 20;
const TOKEN_RE = /^[A-HJ-NP-Z2-9]{20}$/;

export const CODE_TTL_MS = 10 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_COOLDOWN_MS = 60 * 1000;
export const CODE_MAX_SENDS = 12;
export const DEVICE_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Edits stop being accepted this long after completion; the link then shows a read-only page. */
export const READ_ONLY_AFTER_DAYS = 60;

export function generateOnboardingToken(): string {
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  return out;
}

export function isValidOnboardingToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_RE.test(value);
}

export function normalizeToken(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Portal link. Lives on the app host (app.axeonstudio.co); the main domain forwards old links. */
export function welcomeUrl(token: string): string {
  return `${APP_ORIGIN}/welcome/${token}`;
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function isValidCodeFormat(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

/** Codes are never stored in clear; the token salts the hash so a leaked DB row is useless alone. */
export function hashCode(code: string, token: string): string {
  return createHash('sha256').update(`${token}:${code}`).digest('hex');
}

function cookieSecret(): string {
  const secret = process.env.ONBOARDING_COOKIE_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET (or ONBOARDING_COOKIE_SECRET) must be set for the onboarding portal');
  return secret;
}

export function deviceCookieName(token: string): string {
  return `axeon_welcome_${token}`;
}

/** `${token}.${expiresAtMs}.${hmac}`: self-contained, nothing to store or clean up. */
export function signDeviceCookie(token: string, expiresAtMs: number, secret: string = cookieSecret()): string {
  const payload = `${token}.${expiresAtMs}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyDeviceCookie(
  value: string | undefined | null,
  token: string,
  secret: string = cookieSecret(),
  now: number = Date.now()
): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [cookieToken, expStr, sig] = parts;
  if (cookieToken !== token) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = createHmac('sha256', secret).update(`${cookieToken}.${expStr}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ───────────────────────────── Display helpers ─────────────────────────────

/** "jane@smithroofing.com" -> "j*****@smithroofing.com": the URL gets forwarded. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user[0]}${'*'.repeat(Math.min(6, Math.max(2, user.length - 1)))}@${domain}`;
}

/** Keeps the last 4 digits: "(515) 555-0134" -> "•••• 0134". */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
}

/** Masks a saved value for display when its field is sensitive. */
export function displayValue(field: ItemField, value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value == null || value === '') return '';
  const str = String(value);
  if (!field.sensitive) return str;
  if (field.type === 'tel') return maskPhone(str);
  // Free text that may hold numbers (e.g. "Mike 515-555-0134"): mask each phone-like run.
  return str.replace(/(\+?\d[\d\s().-]{6,}\d)/g, (m) => maskPhone(m));
}

// ───────────────────────────── Tier mapping ─────────────────────────────

/**
 * Stripe metadata carries a catalog key (core-web-build, axeoncore, axeongrowth)
 * or a plan lookup_key (core-web-build-monthly, axeoncore-monthly,
 * axeongrowth-monthly), all seeded by scripts/stripe-seed.mjs.
 */
export function tierFromStripeKey(key: string | null | undefined): OnboardingTier | null {
  if (!key) return null;
  const base = key.replace(/-monthly$/, '');
  if (base === 'core-web-build') return 'essentials';
  if (base === 'axeoncore') return 'axeoncore';
  if (base === 'axeongrowth') return 'axeongrowth';
  return null;
}

// ───────────────────────────── Validation ─────────────────────────────

const MAX_TEXT = 300;
const MAX_TEXTAREA = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREDENTIAL_RE = /\b(password|passcode|passphrase|login|log in|pin code|secret|credential)\b/i;

/**
 * Test-time guard: no item may ask for a credential. Throws listing offenders.
 * Called from lib/onboarding.test.ts so a bad edit to the data file fails CI.
 */
export function assertNoCredentialFields(items: readonly OnboardingItem[] = ONBOARDING_ITEMS): void {
  const offenders: string[] = [];
  for (const item of items) {
    for (const field of item.fields ?? []) {
      if (CREDENTIAL_RE.test(field.label) || CREDENTIAL_RE.test(field.key)) {
        offenders.push(`${item.key}.${field.key}`);
      }
    }
  }
  if (offenders.length) throw new Error(`Onboarding fields must never collect credentials: ${offenders.join(', ')}`);
}

function cleanString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // Strip control characters; keep newlines for textareas.
  return value.replace(/[^\S\r\n]+/g, ' ').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
}

/**
 * Turns a client submission into clean data for one item, or throws a message
 * safe to show the client. Unknown keys are dropped; only declared fields survive.
 */
export function validateItemData(item: OnboardingItem, raw: unknown): Record<string, unknown> {
  if (item.kind !== 'confirm') return {};
  const body = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of item.fields ?? []) {
    const value = body[field.key];
    if (field.type === 'multi') {
      const options = field.options ?? [];
      const picked = Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && options.includes(v)) : [];
      if (field.required && picked.length === 0) throw new Error(`Pick at least one option for "${field.label}".`);
      out[field.key] = Array.from(new Set(picked));
      continue;
    }
    const str = cleanString(value, field.type === 'textarea' ? MAX_TEXTAREA : MAX_TEXT);
    if (!str) {
      if (field.required) throw new Error(`"${field.label}" is required.`);
      out[field.key] = '';
      continue;
    }
    if (field.type === 'select' && !(field.options ?? []).includes(str)) {
      throw new Error(`Choose one of the options for "${field.label}".`);
    }
    if (field.type === 'email' && !EMAIL_RE.test(str)) throw new Error(`Enter a valid email for "${field.label}".`);
    if (field.type === 'tel' && str.replace(/\D/g, '').length < 10) {
      throw new Error(`Enter a full phone number for "${field.label}".`);
    }
    if (field.type === 'url' && !/^https?:\/\/\S+$/i.test(str)) {
      throw new Error(`"${field.label}" should start with https://`);
    }
    out[field.key] = str;
  }
  return out;
}

/** Prefill values for a fresh confirm card from what Stripe already told us. */
export function prefillFor(item: OnboardingItem, onboarding: Pick<Onboarding, 'businessName' | 'clientName' | 'clientEmail' | 'phone'>) {
  const out: Record<string, string> = {};
  for (const field of item.fields ?? []) {
    if (!field.prefill) continue;
    const v = onboarding[field.prefill];
    if (v) out[field.key] = v;
  }
  return out;
}

// ───────────────────────────── Progress ─────────────────────────────

export function computeProgress(tier: OnboardingTier, states: Record<string, ItemState | undefined>): Progress {
  const items = itemsForTier(tier);
  let clientTotal = 0;
  let clientDone = 0;
  let axeonTotal = 0;
  let axeonDone = 0;
  for (const item of items) {
    const done = states[item.key]?.status === 'done';
    if (item.kind === 'axeon') {
      axeonTotal += 1;
      if (done) axeonDone += 1;
    } else {
      clientTotal += 1;
      if (done) clientDone += 1;
    }
  }
  const percent = clientTotal === 0 ? 100 : Math.round((clientDone / clientTotal) * 100);
  return { clientTotal, clientDone, axeonTotal, axeonDone, percent };
}

// ───────────────────────────── Nudge schedule ─────────────────────────────

/** Days after the portal opens when a reminder goes out if client items are still open. */
export const NUDGE_DAYS = [1, 3, 7] as const;

/**
 * Which nudge step (1, 3 or 7) is due right now, or null. At most one email per
 * step: a step is due once its day has passed and no nudge (automatic or from the
 * admin button) went out since that day. Skips clients who touched the portal in
 * the last 24 hours, closed or finished portals, and portals whose welcome email
 * never went out (nudging before the welcome would confuse people).
 */
export function nudgeStepDue(
  o: Pick<Onboarding, 'status' | 'welcomeSentAt' | 'nudgeSentAt' | 'lastClientActivityAt' | 'createdAt'>,
  progress: Pick<Progress, 'clientDone' | 'clientTotal'>,
  now: number = Date.now()
): number | null {
  if (o.status !== 'active' || !o.welcomeSentAt) return null;
  if (progress.clientDone >= progress.clientTotal) return null;
  const DAY = 86_400_000;
  const created = new Date(o.createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const age = (now - created) / DAY;
  const step = [...NUDGE_DAYS].reverse().find((d) => age >= d);
  if (!step) return null;
  const stepAt = created + step * DAY;
  const lastNudge = o.nudgeSentAt ? new Date(o.nudgeSentAt).getTime() : 0;
  if (lastNudge >= stepAt) return null;
  const lastActive = o.lastClientActivityAt ? new Date(o.lastClientActivityAt).getTime() : 0;
  if (now - lastActive < DAY) return null;
  return step;
}

/** The portal is editable while active, and for a grace period after completion. */
export function isEditable(onboarding: Pick<Onboarding, 'status' | 'completedAt'>, now: number = Date.now()): boolean {
  if (onboarding.status === 'closed') return false;
  if (onboarding.status === 'active') return true;
  if (!onboarding.completedAt) return true;
  return now - new Date(onboarding.completedAt).getTime() < READ_ONLY_AFTER_DAYS * 86_400_000;
}

/** Items in the client's view: things to do first (pending before done), then Axeon's list. */
export function orderedItems(tier: OnboardingTier): { client: OnboardingItem[]; axeon: OnboardingItem[] } {
  const items = itemsForTier(tier);
  return {
    client: items.filter((i) => i.kind !== 'axeon'),
    axeon: items.filter((i) => i.kind === 'axeon'),
  };
}

export function itemBelongsToTier(itemKey: string, tier: OnboardingTier): boolean {
  const item = getItem(itemKey);
  return Boolean(item && TIER_RANK[item.tier] <= TIER_RANK[tier]);
}

// ───────────────────────────── Admin input ─────────────────────────────

export function validateOnboardingInput(raw: Record<string, unknown>): OnboardingInput {
  const email = typeof raw.clientEmail === 'string' ? raw.clientEmail.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) throw new Error('A valid client email is required');
  if (!isOnboardingTier(raw.tier)) throw new Error('Choose a plan: essentials, axeoncore, or axeongrowth');
  const opt = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  return {
    tier: raw.tier,
    clientEmail: email,
    clientName: opt(raw.clientName),
    businessName: opt(raw.businessName),
    phone: opt(raw.phone, 40),
    stripeCustomerId: opt(raw.stripeCustomerId, 80),
    checkoutSessionId: opt(raw.checkoutSessionId, 120),
  };
}

// ───────────────────────────── Database ─────────────────────────────

function requireDatabase(): void {
  if (!isDatabaseConfigured()) {
    throw new Error('The onboarding portal needs the database (POSTGRES_URL). Attach Vercel Postgres first.');
  }
}

const iso = (v: string | null) => (v ? new Date(v).toISOString() : null);

function rowToOnboarding(row: OnboardingRow): Onboarding {
  return {
    id: row.id,
    token: row.token,
    tier: isOnboardingTier(row.tier) ? row.tier : 'essentials',
    clientEmail: row.client_email,
    clientName: row.client_name,
    businessName: row.business_name,
    phone: row.phone,
    stripeCustomerId: row.stripe_customer_id,
    checkoutSessionId: row.checkout_session_id,
    status: row.status,
    welcomeSentAt: iso(row.welcome_sent_at),
    nudgeSentAt: iso(row.nudge_sent_at),
    lastClientActivityAt: iso(row.last_client_activity_at),
    completedAt: iso(row.completed_at),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function rowToState(row: ItemRow): ItemState {
  return {
    itemKey: row.item_key,
    status: row.status,
    data: row.data && typeof row.data === 'object' ? row.data : {},
    completedBy: row.completed_by,
    completedAt: iso(row.completed_at),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function createOnboarding(input: OnboardingInput): Promise<Onboarding> {
  requireDatabase();
  await ensureSchema();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateOnboardingToken();
    const res = await sql<OnboardingRow>`
      INSERT INTO onboardings (
        token, tier, client_email, client_name, business_name, phone, stripe_customer_id, checkout_session_id
      )
      VALUES (
        ${token}, ${input.tier}, ${input.clientEmail}, ${input.clientName ?? null}, ${input.businessName ?? null},
        ${input.phone ?? null}, ${input.stripeCustomerId ?? null}, ${input.checkoutSessionId ?? null}
      )
      ON CONFLICT (token) DO NOTHING
      RETURNING *;
    `;
    if (res.rows[0]) return rowToOnboarding(res.rows[0]);
  }
  throw new Error('Could not allocate a unique onboarding token');
}

export async function getOnboardingByToken(rawToken: string): Promise<Onboarding | null> {
  const token = normalizeToken(rawToken);
  if (!isValidOnboardingToken(token) || !isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<OnboardingRow>`SELECT * FROM onboardings WHERE token = ${token} LIMIT 1;`;
  return res.rows[0] ? rowToOnboarding(res.rows[0]) : null;
}

export async function getOnboardingById(id: number): Promise<Onboarding | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<OnboardingRow>`SELECT * FROM onboardings WHERE id = ${id} LIMIT 1;`;
  return res.rows[0] ? rowToOnboarding(res.rows[0]) : null;
}

export async function findOnboardingForCheckout(sessionId: string): Promise<Onboarding | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<OnboardingRow>`SELECT * FROM onboardings WHERE checkout_session_id = ${sessionId} LIMIT 1;`;
  return res.rows[0] ? rowToOnboarding(res.rows[0]) : null;
}

/** The newest onboarding still open for this email, so a second payment does not mint a second portal. */
export async function findOpenOnboardingByEmail(email: string): Promise<Onboarding | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<OnboardingRow>`
    SELECT * FROM onboardings
    WHERE lower(client_email) = ${email.toLowerCase()} AND status <> 'closed'
    ORDER BY created_at DESC LIMIT 1;
  `;
  return res.rows[0] ? rowToOnboarding(res.rows[0]) : null;
}

export async function listOnboardings(limit = 100): Promise<Array<Onboarding & { progress: Progress }>> {
  requireDatabase();
  await ensureSchema();
  const res = await sql<OnboardingRow>`SELECT * FROM onboardings ORDER BY created_at DESC LIMIT ${limit};`;
  const onboardings = res.rows.map(rowToOnboarding);
  if (onboardings.length === 0) return [];
  const ids = onboardings.map((o) => o.id);
  const itemRes = await sql<ItemRow>`
    SELECT onboarding_id, item_key, status, data, completed_by, completed_at, updated_at
    FROM onboarding_items WHERE onboarding_id = ANY(${ids as unknown as string}::int[]);
  `;
  const byId = new Map<number, Record<string, ItemState>>();
  for (const row of itemRes.rows) {
    const bucket = byId.get(row.onboarding_id) ?? {};
    bucket[row.item_key] = rowToState(row);
    byId.set(row.onboarding_id, bucket);
  }
  return onboardings.map((o) => ({ ...o, progress: computeProgress(o.tier, byId.get(o.id) ?? {}) }));
}

export async function getItemStates(onboardingId: number): Promise<Record<string, ItemState>> {
  await ensureSchema();
  const res = await sql<ItemRow>`
    SELECT onboarding_id, item_key, status, data, completed_by, completed_at, updated_at
    FROM onboarding_items WHERE onboarding_id = ${onboardingId};
  `;
  const out: Record<string, ItemState> = {};
  for (const row of res.rows) out[row.item_key] = rowToState(row);
  return out;
}

/** Flip to complete when every client item is done; back to active if something reopens. */
async function recomputeStatus(onboarding: Onboarding): Promise<void> {
  if (onboarding.status === 'closed') return;
  const states = await getItemStates(onboarding.id);
  const progress = computeProgress(onboarding.tier, states);
  const complete = progress.clientDone >= progress.clientTotal;
  if (complete && onboarding.status !== 'complete') {
    await sql`UPDATE onboardings SET status = 'complete', completed_at = now(), updated_at = now() WHERE id = ${onboarding.id};`;
  } else if (!complete && onboarding.status === 'complete') {
    await sql`UPDATE onboardings SET status = 'active', completed_at = NULL, updated_at = now() WHERE id = ${onboarding.id};`;
  }
}

/**
 * The client saves a confirm card (data + done) or taps an accept button (done).
 * Validation happens here so no route can skip it.
 */
export async function saveClientItem(
  onboarding: Onboarding,
  itemKey: string,
  rawData: unknown,
  markDone: boolean
): Promise<ItemState> {
  if (!isEditable(onboarding)) throw new Error('This setup is finished and can no longer be edited.');
  const item = getItem(itemKey);
  if (!item || !itemBelongsToTier(itemKey, onboarding.tier)) throw new Error('Unknown item');
  if (item.kind === 'axeon') throw new Error('Axeon handles this one');
  const data = validateItemData(item, rawData);
  const status: ItemStatus = markDone ? 'done' : 'pending';
  await ensureSchema();
  const res = await sql<ItemRow>`
    INSERT INTO onboarding_items (onboarding_id, item_key, status, data, completed_by, completed_at)
    VALUES (
      ${onboarding.id}, ${itemKey}, ${status}, ${JSON.stringify(data)}::jsonb,
      ${markDone ? 'client' : null}, ${markDone ? new Date().toISOString() : null}
    )
    ON CONFLICT (onboarding_id, item_key) DO UPDATE SET
      status = EXCLUDED.status,
      data = EXCLUDED.data,
      completed_by = EXCLUDED.completed_by,
      completed_at = EXCLUDED.completed_at,
      updated_at = now()
    RETURNING onboarding_id, item_key, status, data, completed_by, completed_at, updated_at;
  `;
  await sql`UPDATE onboardings SET last_client_activity_at = now(), updated_at = now() WHERE id = ${onboarding.id};`;
  await recomputeStatus(onboarding);
  return rowToState(res.rows[0]);
}

/** Admin marks any item done or reopens it; client data is kept. */
export async function setItemStatusByAdmin(onboarding: Onboarding, itemKey: string, status: ItemStatus): Promise<ItemState> {
  if (!itemBelongsToTier(itemKey, onboarding.tier)) throw new Error('Unknown item');
  await ensureSchema();
  const res = await sql<ItemRow>`
    INSERT INTO onboarding_items (onboarding_id, item_key, status, completed_by, completed_at)
    VALUES (${onboarding.id}, ${itemKey}, ${status}, ${status === 'done' ? 'axeon' : null}, ${status === 'done' ? new Date().toISOString() : null})
    ON CONFLICT (onboarding_id, item_key) DO UPDATE SET
      status = EXCLUDED.status,
      completed_by = CASE WHEN EXCLUDED.status = 'done' THEN 'axeon' ELSE NULL END,
      completed_at = EXCLUDED.completed_at,
      updated_at = now()
    RETURNING onboarding_id, item_key, status, data, completed_by, completed_at, updated_at;
  `;
  await recomputeStatus(onboarding);
  return rowToState(res.rows[0]);
}

export async function setOnboardingStatus(onboarding: Onboarding, status: OnboardingStatus): Promise<void> {
  await ensureSchema();
  if (status === 'complete') {
    await sql`UPDATE onboardings SET status = 'complete', completed_at = COALESCE(completed_at, now()), updated_at = now() WHERE id = ${onboarding.id};`;
  } else {
    await sql`UPDATE onboardings SET status = ${status}, updated_at = now() WHERE id = ${onboarding.id};`;
  }
}

export async function markWelcomeSent(id: number): Promise<void> {
  await sql`UPDATE onboardings SET welcome_sent_at = now(), updated_at = now() WHERE id = ${id};`;
}

/**
 * Claims the one-time "client finished" alert. Returns true exactly once per
 * onboarding, even if two requests race, because the UPDATE only matches while
 * the column is still empty.
 */
export async function claimCompletionNotice(id: number): Promise<boolean> {
  await ensureSchema();
  const res = await sql<{ id: number }>`
    UPDATE onboardings SET completion_notified_at = now()
    WHERE id = ${id} AND status = 'complete' AND completion_notified_at IS NULL
    RETURNING id;
  `;
  return res.rows.length > 0;
}

export async function markNudgeSent(id: number): Promise<void> {
  await sql`UPDATE onboardings SET nudge_sent_at = now(), updated_at = now() WHERE id = ${id};`;
}

// ───────────────────────────── Email code flow ─────────────────────────────

export type IssueCodeResult = { ok: true; code: string } | { ok: false; reason: 'cooldown' | 'limit' | 'closed' };

/**
 * Mints a fresh code for this onboarding, replacing any outstanding one.
 * Enforces a 60s resend cooldown and a lifetime cap per onboarding; the route adds a per-IP limit.
 */
export async function issueVerificationCode(onboarding: Onboarding): Promise<IssueCodeResult> {
  if (onboarding.status === 'closed') return { ok: false, reason: 'closed' };
  await ensureSchema();
  const res = await sql<Pick<OnboardingRow, 'code_sent_at' | 'code_sends'>>`
    SELECT code_sent_at, code_sends FROM onboardings WHERE id = ${onboarding.id} LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row) return { ok: false, reason: 'closed' };
  if (row.code_sent_at && Date.now() - new Date(row.code_sent_at).getTime() < CODE_RESEND_COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown' };
  }
  if (row.code_sends >= CODE_MAX_SENDS) return { ok: false, reason: 'limit' };

  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await sql`
    UPDATE onboardings SET
      code_hash = ${hashCode(code, onboarding.token)},
      code_expires_at = ${expires},
      code_attempts = 0,
      code_sent_at = now(),
      code_sends = code_sends + 1,
      updated_at = now()
    WHERE id = ${onboarding.id};
  `;
  return { ok: true, code };
}

export type VerifyCodeResult = 'ok' | 'wrong' | 'expired' | 'locked';

/** One shot per call; the stored hash is cleared on success so a code never works twice. */
export async function verifyCode(onboarding: Onboarding, code: string): Promise<VerifyCodeResult> {
  await ensureSchema();
  const res = await sql<Pick<OnboardingRow, 'code_hash' | 'code_expires_at' | 'code_attempts'>>`
    SELECT code_hash, code_expires_at, code_attempts FROM onboardings WHERE id = ${onboarding.id} LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row || !row.code_hash || !row.code_expires_at) return 'expired';
  if (new Date(row.code_expires_at).getTime() < Date.now()) return 'expired';
  if (row.code_attempts >= CODE_MAX_ATTEMPTS) return 'locked';

  const expected = Buffer.from(row.code_hash, 'hex');
  const actual = Buffer.from(hashCode(code, onboarding.token), 'hex');
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!match) {
    await sql`UPDATE onboardings SET code_attempts = code_attempts + 1, updated_at = now() WHERE id = ${onboarding.id};`;
    return row.code_attempts + 1 >= CODE_MAX_ATTEMPTS ? 'locked' : 'wrong';
  }
  await sql`
    UPDATE onboardings SET code_hash = NULL, code_expires_at = NULL, code_attempts = 0,
      last_client_activity_at = now(), updated_at = now()
    WHERE id = ${onboarding.id};
  `;
  return 'ok';
}
