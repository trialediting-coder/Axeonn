// app/api/proof/inbox/[contactId]/email/route.ts
// GET: opens the client's mail app to this lead (spec: email replies open the
// mail app; PROOF sends no email to leads in this slice). A redirect, so the
// address is never in the inbox page's data; only a tap on "Email" reveals it,
// to the signed-in owner, in their own mail app.
import { NextResponse } from 'next/server';
import { getContact } from '@/lib/contacts';
import { parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return NextResponse.json({ error: 'No email for this lead' }, { status: 404, headers: NO_STORE });
  try {
    const contact = await getContact(auth.account.onboardingId, contactId);
    if (!contact?.email) return NextResponse.json({ error: 'No email for this lead' }, { status: 404, headers: NO_STORE });
    return new Response(null, { status: 302, headers: { Location: `mailto:${encodeURIComponent(contact.email)}`, ...NO_STORE } });
  } catch (err) {
    return inboxFailure('[proof/inbox/email]', err);
  }
}
