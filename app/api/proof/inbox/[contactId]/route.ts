// app/api/proof/inbox/[contactId]/route.ts
// GET: one lead's page (header, stage, timeline, held replies), pre-masked.
// PUT { name }: the client types the person's name (spec: names come from forms,
// chat, or the client; never a carrier lookup). An empty name clears it.
import { NextResponse } from 'next/server';
import { contactTimeline, setContactName } from '@/lib/contacts';
import { parseContactId } from '@/lib/contactsShared';
import { inboxAccount, inboxFailure, NO_STORE, requireJson } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ contactId: string }> };
const notFound = () => NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return notFound();
  try {
    const view = await contactTimeline(auth.account.onboardingId, contactId);
    return view ? NextResponse.json(view, { headers: NO_STORE }) : notFound();
  } catch (err) {
    return inboxFailure('[proof/inbox/contact]', err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const notJson = requireJson(req);
  if (notJson) return notJson;
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return notFound();
  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  if (!body || (typeof body.name !== 'string' && body.name !== null)) {
    return NextResponse.json({ error: 'Type a name, or leave it empty to clear it' }, { status: 400, headers: NO_STORE });
  }
  try {
    const contact = await setContactName(auth.account.onboardingId, contactId, body.name);
    return contact ? NextResponse.json({ ok: true, name: contact.name }, { headers: NO_STORE }) : notFound();
  } catch (err) {
    return inboxFailure('[proof/inbox/name]', err);
  }
}
