// app/api/proof/inbox/[contactId]/reply/route.ts
// POST { body }: text the lead from the client's tracked number (lib/inboxReply.ts).
// 'held' means quiet hours: it goes out at 8 am (sendAt, for the reply box). A
// refusal comes back as a plain sentence the reply box shows as-is. A send that
// threw is a 502: 'send_failed' (nothing went out, try again) or 'unclear' (it
// may have gone out; the box clears and the thread refreshes). Any other throw
// (the database) is a 502 with a plain sentence, logged redacted.
import { NextResponse } from 'next/server';
import { parseContactId, REPLY_REFUSAL_COPY, REPLY_UNCLEAR_COPY } from '@/lib/contactsShared';
import { replyToContact } from '@/lib/inboxReply';
import { inboxAccount, inboxFailure, NO_STORE, requireJson } from '@/lib/inboxServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ contactId: string }> }) {
  const notJson = requireJson(req);
  if (notJson) return notJson;
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  const contactId = parseContactId((await ctx.params).contactId);
  if (!contactId) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { body?: unknown } | null;
  try {
    const result = await replyToContact(auth.account.onboardingId, contactId, body?.body);
    if (!result) return NextResponse.json({ error: 'That lead is not in your inbox' }, { status: 404, headers: NO_STORE });
    if (result.status === 'unclear') return NextResponse.json({ error: REPLY_UNCLEAR_COPY, status: 'unclear' }, { status: 502, headers: NO_STORE });
    if (result.status === 'refused') {
      const status = result.reason === 'empty' || result.reason === 'too_long' ? 400 : result.reason === 'send_failed' ? 502 : 409;
      return NextResponse.json({ error: REPLY_REFUSAL_COPY[result.reason], reason: result.reason }, { status, headers: NO_STORE });
    }
    return NextResponse.json(result.status === 'held' ? { ok: true, status: 'held', sendAt: result.sendAt } : { ok: true, status: 'sent' }, { headers: NO_STORE });
  } catch (err) {
    return inboxFailure('[proof/inbox/reply]', err);
  }
}
