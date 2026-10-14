// lib/inboxServer.ts
// The guard every /api/proof/inbox route starts with: a signed-in client whose
// plan includes the inbox. Scoping happens in each query (lib/contacts.ts takes
// the onboarding id), so another client's contact id is a plain 404. Server-only.
import { NextResponse } from 'next/server';
import { inboxEnabled } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { getOnboardingById } from '@/lib/onboarding';
import type { ClientAccount } from '@/lib/proofAuth';
import { getSignedInClient } from '@/lib/proofServer';
import { redactDigits } from '@/lib/sequenceSchedule';

export type InboxAuth = { ok: true; account: ClientAccount } | { ok: false; response: NextResponse };

export const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;
export const INBOX_TIER_ERROR = 'The leads inbox comes with AxeonCORE';

export async function inboxAccount(): Promise<InboxAuth> {
  const account = await getSignedInClient();
  if (!account) return { ok: false, response: NextResponse.json({ error: 'Please sign in again' }, { status: 401, headers: NO_STORE }) };
  const onboarding = await getOnboardingById(account.onboardingId).catch(() => null);
  if (!onboarding || !inboxEnabled(onboarding.tier)) {
    return { ok: false, response: NextResponse.json({ error: INBOX_TIER_ERROR }, { status: 403, headers: NO_STORE }) };
  }
  return { ok: true, account };
}

/**
 * JSON only on the inbox's writes (as slice 3's stage route): a form post from
 * another site (a simple cross-site request, text/plain) is refused before
 * anything is read, so no other page can make the client send a text.
 */
export function requireJson(req: Request): NextResponse | null {
  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  return type === 'application/json' ? null : NextResponse.json({ error: 'Send JSON' }, { status: 415, headers: NO_STORE });
}

/** Anything unexpected: logged with digits redacted, never shown; the browser gets a plain sentence. */
export function inboxFailure(tag: string, err: unknown): NextResponse {
  console.error(tag, redactDigits(errText(err)).slice(0, 300));
  return NextResponse.json({ error: 'That did not work. Try again in a minute.' }, { status: 502, headers: NO_STORE });
}
