// lib/proofSummaryLink.ts
// The no-password link in the monthly executive summary (AxeonPROOF v2). It opens
// one read-only page (app/proof/summary/[token]) for one client and one month,
// and nothing else: no session is created, no other client or tab is reachable.
//
// Token: `s1.<onboardingId>.<YYYY-MM>.<recipient>.<expiresAtMs>.<hmac>` where the
// HMAC-SHA256 covers everything before it, keyed off AUTH_SECRET with its own
// purpose prefix (so a dashboard session cookie can never pass as one, or the
// reverse). Links live 45 days: long enough to open late, short enough that an
// old forwarded email stops working.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { APP_ORIGIN } from '@/lib/hostRouting';

export const SUMMARY_LINK_TTL_MS = 45 * 24 * 60 * 60 * 1000;
export type SummaryRecipient = 'owner' | 'manager';
const RECIPIENT_CODE: Record<SummaryRecipient, string> = { owner: 'o', manager: 'm' };

function linkSecret(): string {
  const secret = process.env.ONBOARDING_COOKIE_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET must be set for AxeonPROOF summary links');
  return `proof-summary:${secret}`;
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function signSummaryToken(
  input: { onboardingId: number; month: string; recipient: SummaryRecipient; expiresAtMs?: number },
  secret: string = linkSecret(),
  now: number = Date.now()
): string {
  if (!Number.isInteger(input.onboardingId) || input.onboardingId <= 0) throw new Error('Bad onboarding id');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) throw new Error('Bad month');
  const exp = input.expiresAtMs ?? now + SUMMARY_LINK_TTL_MS;
  const payload = `s1.${input.onboardingId}.${input.month}.${RECIPIENT_CODE[input.recipient]}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function readSummaryToken(
  token: unknown,
  secret: string = linkSecret(),
  now: number = Date.now()
): { onboardingId: number; month: string; recipient: SummaryRecipient } | null {
  if (typeof token !== 'string' || token.length > 200) return null;
  const parts = token.split('.');
  if (parts.length !== 6 || parts[0] !== 's1') return null;
  const [, idStr, month, r, expStr, sig] = parts;
  if (!/^[1-9]\d{0,9}$/.test(idStr) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || (r !== 'o' && r !== 'm') || !/^\d{1,16}$/.test(expStr)) return null;
  const exp = Number(expStr);
  if (exp < now) return null;
  const expected = sign(parts.slice(0, 5).join('.'), secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { onboardingId: Number(idStr), month, recipient: r === 'o' ? 'owner' : 'manager' };
}

export const summaryUrl = (token: string) => `${APP_ORIGIN}/proof/summary/${encodeURIComponent(token)}`;
