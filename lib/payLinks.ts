// lib/payLinks.ts
// Personalized pay links: an admin mints /pay/<token> for one client with the
// scope locked (build + add-ons + deposit/balance/full, or a monthly plan). The
// client opens it, sees exactly what they owe, and is handed to Stripe Checkout.
//
// The row is the *intent*; the money still lives on Stripe. The webhook flips a
// link to "paid" when its Checkout Session completes (metadata.pay_link).
// Links expire (default 30 days) and can be disabled from the admin console.
import { randomInt } from 'node:crypto';
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';
import { ADDON_KEYS, TIER_KEYS, isCatalogKey, isPlanKey, type CatalogKey, type PlanKey } from '@/lib/billing';
import { isPaymentKind, type PaymentKind } from '@/lib/billingMath';

export type PayLinkKind = PaymentKind | 'plan';
export type PayLinkStatus = 'open' | 'paid' | 'disabled';
/** Status plus the derived "expired" state, for display. */
export type PayLinkState = PayLinkStatus | 'expired';

export interface PayLinkInput {
  clientEmail: string;
  clientName?: string;
  kind: PayLinkKind;
  /** Required unless kind is 'plan'. */
  tier?: CatalogKey;
  addOns?: CatalogKey[];
  /** Required when kind is 'plan'. */
  planKey?: PlanKey;
  /** Short note shown to the client on the page ("Deposit for the Smith Roofing site"). */
  note?: string;
  expiresInDays?: number;
}

export interface PayLink {
  id: number;
  token: string;
  clientEmail: string;
  clientName: string | null;
  kind: PayLinkKind;
  tier: CatalogKey | null;
  addOns: CatalogKey[];
  planKey: PlanKey | null;
  note: string | null;
  status: PayLinkStatus;
  checkoutSessionId: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PayLinkRow {
  id: number;
  token: string;
  client_email: string;
  client_name: string | null;
  kind: PayLinkKind;
  tier: string | null;
  add_ons: string[] | null;
  plan_key: string | null;
  note: string | null;
  status: PayLinkStatus;
  checkout_session_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// No 0/O/1/I/L so a token survives being read over the phone or typed from a text.
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH = 8;
const DEFAULT_EXPIRY_DAYS = 30;
const MAX_EXPIRY_DAYS = 180;
const MAX_NOTE_LENGTH = 200;

export function generateToken(): string {
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  return out;
}

export function isValidToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z2-9]{8}$/.test(value);
}

export function payLinkUrl(token: string): string {
  return `${SITE_URL}/pay/${token}`;
}

export function payLinkState(link: PayLink): PayLinkState {
  if (link.status !== 'open') return link.status;
  return new Date(link.expiresAt).getTime() < Date.now() ? 'expired' : 'open';
}

function rowToLink(row: PayLinkRow): PayLink {
  return {
    id: row.id,
    token: row.token,
    clientEmail: row.client_email,
    clientName: row.client_name,
    kind: row.kind,
    tier: isCatalogKey(row.tier) ? row.tier : null,
    addOns: (row.add_ons ?? []).filter(isCatalogKey),
    planKey: isPlanKey(row.plan_key) ? row.plan_key : null,
    note: row.note,
    status: row.status,
    checkoutSessionId: row.checkout_session_id,
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Turn an admin form body into a valid input, or throw a message safe to show the admin. */
export function validatePayLinkInput(raw: Record<string, unknown>): PayLinkInput {
  const email = typeof raw.clientEmail === 'string' ? raw.clientEmail.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid client email is required');

  const clientName = typeof raw.clientName === 'string' && raw.clientName.trim() ? raw.clientName.trim() : undefined;

  const kind = raw.kind;
  if (!(isPaymentKind(kind) || kind === 'plan')) throw new Error('kind must be deposit, balance, full, or plan');

  const note = typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : undefined;
  if (note && note.length > MAX_NOTE_LENGTH) throw new Error(`Note must be ${MAX_NOTE_LENGTH} characters or fewer`);

  const days =
    raw.expiresInDays === undefined || raw.expiresInDays === '' ? DEFAULT_EXPIRY_DAYS : Number(raw.expiresInDays);
  if (!Number.isInteger(days) || days < 1 || days > MAX_EXPIRY_DAYS) {
    throw new Error(`Expiry must be between 1 and ${MAX_EXPIRY_DAYS} days`);
  }

  if (kind === 'plan') {
    if (!isPlanKey(raw.planKey)) throw new Error('Choose a monthly plan');
    return { clientEmail: email, clientName, kind, planKey: raw.planKey, note, expiresInDays: days };
  }

  const tier = raw.tier;
  if (!isCatalogKey(tier) || !TIER_KEYS.includes(tier)) throw new Error('Choose a build');
  const addOns: CatalogKey[] = [];
  for (const key of Array.isArray(raw.addOns) ? raw.addOns : []) {
    if (!isCatalogKey(key) || !ADDON_KEYS.includes(key)) throw new Error('Unknown add-on');
    if (!addOns.includes(key)) addOns.push(key);
  }
  const filtered = tier === 'axeoncore' ? addOns.filter((k) => k !== 'addon-videography') : addOns;
  return { clientEmail: email, clientName, kind, tier, addOns: filtered, note, expiresInDays: days };
}

function requireDatabase(): void {
  if (!isDatabaseConfigured()) {
    throw new Error('Personalized pay links need the database (POSTGRES_URL). Attach Vercel Postgres first.');
  }
}

export async function createPayLink(input: PayLinkInput): Promise<PayLink> {
  requireDatabase();
  await ensureSchema();
  const expiresAt = new Date(Date.now() + (input.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 86_400_000).toISOString();
  const addOns = input.addOns ?? [];

  // 31^8 tokens, so a collision is vanishingly rare; retry a few times anyway.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateToken();
    const res = await sql<PayLinkRow>`
      INSERT INTO pay_links (token, client_email, client_name, tier, add_ons, kind, plan_key, note, expires_at)
      VALUES (
        ${token}, ${input.clientEmail}, ${input.clientName ?? null}, ${input.tier ?? null},
        ${addOns as unknown as string}::text[], ${input.kind}, ${input.planKey ?? null}, ${input.note ?? null},
        ${expiresAt}
      )
      ON CONFLICT (token) DO NOTHING
      RETURNING *;
    `;
    if (res.rows[0]) return rowToLink(res.rows[0]);
  }
  throw new Error('Could not allocate a unique pay link token; try again');
}

export async function getPayLink(token: string): Promise<PayLink | null> {
  if (!isDatabaseConfigured() || !isValidToken(token)) return null;
  await ensureSchema();
  const res = await sql<PayLinkRow>`SELECT * FROM pay_links WHERE token = ${token} LIMIT 1;`;
  return res.rows[0] ? rowToLink(res.rows[0]) : null;
}

export async function listPayLinks(limit: number = 50): Promise<PayLink[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<PayLinkRow>`SELECT * FROM pay_links ORDER BY created_at DESC LIMIT ${limit};`;
  return res.rows.map(rowToLink);
}

/** Called from the webhook when the link's Checkout Session completes. Idempotent. */
export async function markPayLinkPaid(token: string, checkoutSessionId: string): Promise<void> {
  if (!isDatabaseConfigured() || !isValidToken(token)) return;
  await ensureSchema();
  await sql`
    UPDATE pay_links
    SET status = 'paid', checkout_session_id = ${checkoutSessionId}, updated_at = now()
    WHERE token = ${token} AND status <> 'paid';
  `;
}

export async function setPayLinkStatus(token: string, status: 'open' | 'disabled'): Promise<PayLink | null> {
  requireDatabase();
  if (!isValidToken(token)) return null;
  await ensureSchema();
  const res = await sql<PayLinkRow>`
    UPDATE pay_links SET status = ${status}, updated_at = now()
    WHERE token = ${token} AND status <> 'paid'
    RETURNING *;
  `;
  return res.rows[0] ? rowToLink(res.rows[0]) : null;
}
