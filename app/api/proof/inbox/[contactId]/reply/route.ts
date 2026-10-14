// app/api/proof/inbox/[contactId]/reply/route.ts
// POST { body }: text the lead from the client's tracked number (lib/inboxReply.ts).
// 'held' means quiet hours: it goes out at 8 am (sendAt, for the reply box). A
// refusal comes back as a plain sentence the reply box shows as-is. A send that
// threw is a 502: 'send_failed' (nothing went out, try again) or 'unclear' (it
// may have gone out; the box clears and the thread refreshes). Any other throw
// (the database) is a 502 with a plain sentence, logged redacted.
// Slice 6: { body, via? }. A thread whose latest inbound touch is a Facebook or
// Instagram DM is answered there (lib/metaInbox.ts metaReplyFor): sent is
// { ok, status: 'sent', channel } (plus a note when it went out but was not
// recorded); a refusal is { error, reason: 'meta', canText, channel } with
// 400 / 409 / 502 / 503; a send Meta may have delivered is slice 4's 'unclear'
// 502, so the box clears the same way. via 'sms' ("Text them instead") skips Meta.
import { NextResponse } from 'next/server';
import { parseContactId, REPLY_REFUSAL_COPY, REPLY_UNCLEAR_COPY } from '@/lib/contactsShared';
import { replyToContact } from '@/lib/inboxReply';
import { metaReplyFor } from '@/lib/metaInbox';
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
  const body = (await req.json().catch(() => null)) as { body?: unknown; via?: unknown } | null;
  try {
    // Slice 6: a thread whose latest inbound touch is a Facebook or Instagram DM is answered there, inside
    // Meta's 24-hour window. Null: not a Meta thread, or the client pressed "Text them instead" (via 'sms').
    const meta = await metaReplyFor({
      onboardingId: auth.account.onboardingId,
      contactId,
      text: typeof body?.body === 'string' ? body.body : '',
      via: body?.via === 'sms' ? 'sms' : null,
    });
    if (meta) {
      if (meta.ok) return NextResponse.json({ ok: true, status: 'sent', channel: meta.channel, ...(meta.note ? { note: meta.note } : {}) }, { headers: NO_STORE });
      if (meta.unclear) return NextResponse.json({ error: meta.error, status: 'unclear', channel: meta.channel }, { status: 502, headers: NO_STORE });
      return NextResponse.json({ error: meta.error, reason: 'meta', canText: meta.canText, channel: meta.channel }, { status: meta.status, headers: NO_STORE });
    }
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
