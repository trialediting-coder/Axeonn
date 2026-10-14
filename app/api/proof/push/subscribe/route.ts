// app/api/proof/push/subscribe/route.ts
// POST { subscription }: saves this browser for lead notifications, for the
// signed-in client (AxeonCORE and up). Only real push-service endpoints are
// accepted (lib/pushShared.ts isValidSubscription). Scoped to the signed-in
// account; the same browser re-subscribing updates its one row (by endpoint).
import { NextResponse } from 'next/server';
import { errText } from '@/lib/dbRows';
import { inboxAccount, NO_STORE, requireJson } from '@/lib/inboxServer';
import { isPushConfigured, savePushSubscription } from '@/lib/push';
import { isValidSubscription } from '@/lib/pushShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const notJson = requireJson(req);
  if (notJson) return notJson;
  const auth = await inboxAccount();
  if (!auth.ok) return auth.response;
  if (!isPushConfigured()) return NextResponse.json({ error: 'Notifications are not switched on yet' }, { status: 503, headers: NO_STORE });
  const body = (await req.json().catch(() => null)) as { subscription?: unknown } | null;
  const sub = body?.subscription;
  if (!isValidSubscription(sub)) return NextResponse.json({ error: 'This browser sent a subscription we cannot use' }, { status: 400, headers: NO_STORE });
  try {
    await savePushSubscription(auth.account.id, sub);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error('[proof/push/subscribe]', errText(err));
    return NextResponse.json({ error: 'That did not save. Try again.' }, { status: 502, headers: NO_STORE });
  }
}
