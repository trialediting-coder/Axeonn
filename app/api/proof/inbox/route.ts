// app/api/proof/inbox/route.ts
// GET: the signed-in client's leads, newest activity first, 50 at a time
// (?cursor= from the previous page). Pre-masked rows only.
import { NextResponse } from 'next/server';
import { listInbox } from '@/lib/contacts';
import { decodeCursor } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const raw = new URL(req.url).searchParams.get('cursor');
  const cursor = raw ? decodeCursor(raw) : null;
  if (raw && !cursor) return NextResponse.json({ error: 'That page marker is not valid' }, { status: 400, headers: NO_STORE });
  try {
    return NextResponse.json(await listInbox(auth.account.onboardingId, { limit: 50, cursor }), { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/inbox]', err);
  }
}
