// lib/unsubscribe.ts
// The unsubscribe link at the foot of every follow-up email (lib/email.ts
// sendSequenceEmail). The token carries its own data, so the /u/<token> route
// needs no lookup table: base64url("<onboardingId>:<email>") + "." +
// base64url(HMAC-SHA256(secret, "unsub|<onboardingId>:<email>")), with the same
// secret /api/lead hashes IPs with; the "unsub|" prefix keeps these signatures
// from ever matching another use of that secret. A tap lands in email_opt_outs
// for that client only.
// Emails only. A texted STOP is separate (lib/phoneLines.ts) and stops the whole run.
// Server-only (node:crypto).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ensureSchema, sql } from '@/lib/db';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { normalizeEmail } from '@/lib/sequenceShared';

/** The deployment's secret, or '' when none is set (then no links are made and no token verifies). */
export const unsubscribeSecret = (): string => process.env.TRACKING_SALT || process.env.AUTH_SECRET || '';

const MAX_TOKEN = 700;
/** Domain separation: the secret is shared with other features, so what is signed here always starts with this. */
export const UNSUBSCRIBE_MAC_PREFIX = 'unsub|';
const mac = (payload: string, secret: string): Buffer => createHmac('sha256', secret).update(`${UNSUBSCRIBE_MAC_PREFIX}${payload}`).digest();

/** '' when there is no secret or the address is not a valid email. */
export function unsubscribeToken(onboardingId: number, email: string, secret: string): string {
  const e = normalizeEmail(email);
  if (!secret || !e || !Number.isInteger(onboardingId) || onboardingId <= 0) return '';
  const payload = `${onboardingId}:${e}`;
  return `${Buffer.from(payload).toString('base64url')}.${mac(payload, secret).toString('base64url')}`;
}

/** The client and address a token was made for, or null for anything not signed with this secret. */
export function parseUnsubscribeToken(token: unknown, secret: string): { onboardingId: number; email: string } | null {
  if (!secret || typeof token !== 'string' || !token || token.length > MAX_TOKEN) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const payload = Buffer.from(parts[0], 'base64url').toString('utf8');
  const given = Buffer.from(parts[1], 'base64url');
  const expected = mac(payload, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const colon = payload.indexOf(':');
  if (colon <= 0) return null;
  const idText = payload.slice(0, colon);
  const email = payload.slice(colon + 1);
  const onboardingId = Number(idText);
  if (!/^\d+$/.test(idText) || !Number.isInteger(onboardingId) || onboardingId <= 0) return null;
  if (normalizeEmail(email) !== email) return null;
  return { onboardingId, email };
}

/** "https://axeonstudio.co/u/<token>", or null when no secret is configured (then no email may be sent). */
export function unsubscribeUrl(onboardingId: number, email: string, origin: string = SITE_ORIGIN, secret: string = unsubscribeSecret()): string | null {
  const token = unsubscribeToken(onboardingId, email, secret);
  return token ? `${origin.replace(/\/$/, '')}/u/${token}` : null;
}

export async function isEmailOptedOut(onboardingId: number, email: string): Promise<boolean> {
  const e = normalizeEmail(email);
  if (!e) return false;
  await ensureSchema();
  const { rows } = await sql`SELECT 1 FROM email_opt_outs WHERE onboarding_id = ${onboardingId} AND email = ${e} LIMIT 1;`;
  return rows.length > 0;
}

/** Records the opt-out and stops this address's active runs' email steps from ever sending (they are checked before each send). */
export async function markEmailOptedOut(onboardingId: number, email: string): Promise<void> {
  const e = normalizeEmail(email);
  if (!e) return;
  await ensureSchema();
  await sql`INSERT INTO email_opt_outs (onboarding_id, email) VALUES (${onboardingId}, ${e}) ON CONFLICT DO NOTHING;`;
}
