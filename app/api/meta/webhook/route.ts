// app/api/meta/webhook/route.ts
// Meta's webhook for Messenger (object "page") and Instagram (object "instagram").
// GET answers the subscription handshake. POST verifies X-Hub-Signature-256 on the
// raw body, answers 200 at once, and records the messages after the response:
// Meta retries a slow or failed delivery and eventually disables the
// subscription, so nothing slow happens before the 200.
import { after } from 'next/server';
import { answerVerification, readMetaWebhook } from '@/lib/metaWebhook';
import { processInbound } from '@/lib/metaInbox';
import { errText } from '@/lib/dbRows';
import { secretRedact } from '@/lib/metaShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** The after() work: a batch of new senders, each with a best-effort name lookup, plus one retry pass. */
export const maxDuration = 60;

export async function GET(req: Request) {
  return answerVerification(req);
}

export async function POST(req: Request) {
  const read = await readMetaWebhook(req);
  if (!read.ok) return read.response;
  if (read.events.length) {
    const events = read.events;
    after(() =>
      processInbound(events).then(
        () => undefined,
        // processInbound catches per message; this is anything outside that, logged with ids only.
        (err) => console.error('[meta:inbound] LOST batch', events.map((e) => ({ channel: e.channel, mid: e.mid, page: e.pageOrIgId, sender: e.senderId, at: e.timestamp })), secretRedact(errText(err))),
      ),
    );
  }
  return new Response('EVENT_RECEIVED', { status: 200, headers: { 'content-type': 'text/plain' } });
}
