// app/api/meta/webhook/route.ts
// Meta's webhook for Messenger (object "page") and Instagram (object "instagram").
// GET answers the subscription handshake. POST verifies X-Hub-Signature-256 on the
// raw body, answers 200 at once, and records the messages after the response:
// Meta retries a slow or failed delivery and eventually disables the
// subscription, so nothing slow happens before the 200.
import { after } from 'next/server';
import { answerVerification, readMetaWebhook } from '@/lib/metaWebhook';
import { processInbound } from '@/lib/metaInbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return answerVerification(req);
}

export async function POST(req: Request) {
  const read = await readMetaWebhook(req);
  if (!read.ok) return read.response;
  if (read.events.length) after(() => processInbound(read.events).then(() => undefined));
  return new Response('EVENT_RECEIVED', { status: 200, headers: { 'content-type': 'text/plain' } });
}
