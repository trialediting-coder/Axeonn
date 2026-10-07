// lib/proofAuth.ts
// AxeonPROOF client accounts: email + password sign-in at app.axeonstudio.co.
//
// - One account per client email, linked to their onboarding. The client sets the
//   password as the last step of their onboarding portal (proved by the portal's
//   email code), so nobody can claim an account without access to the inbox.
// - Passwords are bcrypt hashed (cost 11). 10 to 200 characters, not the email.
// - Sessions are a signed, httpOnly cookie (no session table). The signature covers
//   the password's set-time, so changing the password signs out every device.
// - 8 wrong passwords lock the account for 15 minutes; routes add per-IP limits.
// - Password reset: a 32-byte random token emailed as a link, stored only as a
//   SHA-256 hash, single use, valid 60 minutes. "Forgot password" never reveals
//   whether an email has an account.
// - A closed onboarding disables the account.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import type { Onboarding } from '@/lib/onboarding';

export const PROOF_COOKIE = 'axeon_proof';
export const PROOF_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;
export const MAX_FAILED_LOGINS = 8;
export const LOCK_MS = 15 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;
const BCRYPT_COST = 11;

export interface ClientAccount {
  id: number;
  onboardingId: number;
  email: string;
  passwordSetAt: string;
}

interface AccountRow {
  id: number;
  onboarding_id: number;
  email: string;
  password_hash: string;
  password_set_at: string;
  failed_attempts: number;
  locked_until: string | null;
}

const toAccount = (r: AccountRow): ClientAccount => ({
  id: r.id,
  onboardingId: r.onboarding_id,
  email: r.email,
  passwordSetAt: new Date(r.password_set_at).toISOString(),
});

// ───────────────────────────── Pure helpers (tested) ─────────────────────────────

export function normalizeLoginEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 200) : '';
}

/** A message safe to show, or null when the password is acceptable. */
export function passwordProblem(password: unknown, email: string): string | null {
  if (typeof password !== 'string') return 'Enter a password.';
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (password.trim().toLowerCase() === email.trim().toLowerCase()) return "Your password can't be your email.";
  if (/^(.)\1+$/.test(password)) return 'Pick something harder to guess.';
  return null;
}

function sessionSecret(): string {
  const secret = process.env.ONBOARDING_COOKIE_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET must be set for AxeonPROOF sign-in');
  return `proof-session:${secret}`;
}

/** `${accountId}.${version}.${expiresAtMs}.${hmac}` where version is the password set-time in ms. */
export function signProofSession(accountId: number, version: number, expiresAtMs: number, secret: string = sessionSecret()): string {
  const payload = `${accountId}.${version}.${expiresAtMs}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readProofSession(
  value: string | undefined | null,
  secret: string = sessionSecret(),
  now: number = Date.now()
): { accountId: number; version: number } | null {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const [idStr, versionStr, expStr, sig] = parts;
  const accountId = Number(idStr);
  const version = Number(versionStr);
  const exp = Number(expStr);
  if (!Number.isInteger(accountId) || accountId <= 0 || !Number.isFinite(version) || !Number.isFinite(exp)) return null;
  if (exp < now) return null;
  const expected = createHmac('sha256', secret).update(`${idStr}.${versionStr}.${expStr}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { accountId, version };
}

export const hashResetToken = (token: string) => createHash('sha256').update(`proof-reset:${token}`).digest('hex');

export function isValidResetTokenFormat(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

// A real hash to compare against when the email has no account, so a wrong email
// takes as long as a wrong password and timing reveals nothing. Made once, lazily.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(randomBytes(16).toString('hex'), BCRYPT_COST));

// ───────────────────────────── Database ─────────────────────────────

function requireDatabase(): void {
  if (!isDatabaseConfigured()) throw new Error('AxeonPROOF needs the database (POSTGRES_URL).');
}

/** The account for a signed-in session, or null if the session is stale, the account gone, or the onboarding closed. */
export async function getAccountForSession(session: { accountId: number; version: number }): Promise<ClientAccount | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<AccountRow>`
    SELECT a.* FROM client_accounts a
    JOIN onboardings o ON o.id = a.onboarding_id
    WHERE a.id = ${session.accountId} AND o.status <> 'closed'
    LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row) return null;
  if (new Date(row.password_set_at).getTime() !== session.version) return null;
  return toAccount(row);
}

export async function hasAccountForOnboarding(onboardingId: number): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  await ensureSchema();
  const res = await sql`SELECT 1 FROM client_accounts WHERE onboarding_id = ${onboardingId} LIMIT 1;`;
  return res.rows.length > 0;
}

/**
 * Sets (or changes) the password for a portal's client. Called only from the
 * portal route, after the client proved their inbox with the email code.
 */
export async function setPasswordForOnboarding(onboarding: Onboarding, password: string): Promise<ClientAccount> {
  requireDatabase();
  const email = normalizeLoginEmail(onboarding.clientEmail);
  const problem = passwordProblem(password, email);
  if (problem) throw new Error(problem);
  await ensureSchema();
  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const res = await sql<AccountRow>`
    INSERT INTO client_accounts (onboarding_id, email, password_hash, password_set_at)
    VALUES (${onboarding.id}, ${email}, ${hash}, now())
    ON CONFLICT (email) DO UPDATE SET
      onboarding_id = EXCLUDED.onboarding_id,
      password_hash = EXCLUDED.password_hash,
      password_set_at = now(),
      failed_attempts = 0,
      locked_until = NULL,
      reset_token_hash = NULL,
      reset_expires_at = NULL,
      updated_at = now()
    RETURNING *;
  `;
  return toAccount(res.rows[0]);
}

export type LoginResult = { ok: true; account: ClientAccount } | { ok: false; reason: 'invalid' | 'locked' };

/** Checks a password. Every wrong answer looks the same to the caller except a lock. */
export async function verifyLogin(rawEmail: unknown, password: unknown): Promise<LoginResult> {
  requireDatabase();
  const email = normalizeLoginEmail(rawEmail);
  await ensureSchema();
  const res = await sql<AccountRow>`
    SELECT a.* FROM client_accounts a
    JOIN onboardings o ON o.id = a.onboarding_id
    WHERE a.email = ${email} AND o.status <> 'closed'
    LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row || typeof password !== 'string' || password.length > PASSWORD_MAX) {
    await bcrypt.compare(typeof password === 'string' ? password.slice(0, PASSWORD_MAX) : '', await getDummyHash());
    return { ok: false, reason: 'invalid' };
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) return { ok: false, reason: 'locked' };

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) {
    const attempts = row.failed_attempts + 1;
    const lock = attempts >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MS).toISOString() : null;
    await sql`
      UPDATE client_accounts SET
        failed_attempts = ${lock ? 0 : attempts},
        locked_until = ${lock},
        updated_at = now()
      WHERE id = ${row.id};
    `;
    return { ok: false, reason: lock ? 'locked' : 'invalid' };
  }
  await sql`
    UPDATE client_accounts SET failed_attempts = 0, locked_until = NULL, last_login_at = now(), updated_at = now()
    WHERE id = ${row.id};
  `;
  return { ok: true, account: toAccount(row) };
}

/** Mints a reset token for an email, or null when there is no active account. The caller always answers "sent". */
export async function createResetToken(rawEmail: unknown): Promise<{ token: string; email: string } | null> {
  if (!isDatabaseConfigured()) return null;
  const email = normalizeLoginEmail(rawEmail);
  if (!email) return null;
  await ensureSchema();
  const token = randomBytes(32).toString('base64url');
  const res = await sql<{ email: string }>`
    UPDATE client_accounts a SET
      reset_token_hash = ${hashResetToken(token)},
      reset_expires_at = ${new Date(Date.now() + RESET_TTL_MS).toISOString()},
      updated_at = now()
    FROM onboardings o
    WHERE a.email = ${email} AND o.id = a.onboarding_id AND o.status <> 'closed'
    RETURNING a.email;
  `;
  return res.rows[0] ? { token, email: res.rows[0].email } : null;
}

/** Spends a reset token on a new password. Throws a message safe to show. */
export async function resetPassword(token: unknown, password: unknown): Promise<ClientAccount> {
  requireDatabase();
  if (!isValidResetTokenFormat(token)) throw new Error('This reset link is not valid. Request a new one.');
  await ensureSchema();
  const res = await sql<AccountRow>`
    SELECT * FROM client_accounts
    WHERE reset_token_hash = ${hashResetToken(token)} AND reset_expires_at > now()
    LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row) throw new Error('This reset link has expired or was already used. Request a new one.');
  const problem = passwordProblem(password, row.email);
  if (problem) throw new Error(problem);
  const hash = await bcrypt.hash(password as string, BCRYPT_COST);
  const updated = await sql<AccountRow>`
    UPDATE client_accounts SET
      password_hash = ${hash}, password_set_at = now(),
      reset_token_hash = NULL, reset_expires_at = NULL,
      failed_attempts = 0, locked_until = NULL, updated_at = now()
    WHERE id = ${row.id}
    RETURNING *;
  `;
  return toAccount(updated.rows[0]);
}
