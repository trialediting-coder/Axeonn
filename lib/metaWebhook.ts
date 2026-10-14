// lib/metaWebhook.ts
// What /api/meta/webhook does before anything else: answer Meta's GET
// verification handshake, and for a POST read the raw bytes, prove they came
// from Meta (X-Hub-Signature-256 over the raw body), and only then parse.
// Returns plain Responses so it is testable without Next.
import { parseWebhookBody, verifyChallenge, type MetaInboundMessage } from '@/lib/metaShared';
import { metaUnavailable, metaVerifyToken, verifySignature } from '@/lib/meta';

/** Meta batches up to ~1,000 events per POST; 1 MB is far above a real delivery. */
export const META_MAX_BODY = 1024 * 1024;

export type MetaRead = { ok: true; events: MetaInboundMessage[] } | { ok: false; response: Response };

/** GET: echo hub.challenge when hub.mode=subscribe and hub.verify_token matches META_VERIFY_TOKEN. */
export function answerVerification(req: Request): Response {
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  const challenge = verifyChallenge(new URL(req.url).searchParams, metaVerifyToken());
  if (challenge === null) return new Response('Forbidden', { status: 403 });
  return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
}

/**
 * The raw bytes, read as a stream so a chunked body with no Content-Length is
 * never buffered past the cap. A stream that fails reads as empty (and then
 * fails the signature check).
 */
export async function readRaw(req: Request, max: number): Promise<Buffer | 'too_big'> {
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel().catch(() => undefined);
        return 'too_big';
      }
      chunks.push(value);
    }
  } catch {
    return Buffer.alloc(0);
  }
  return Buffer.concat(chunks, total);
}

/** POST: 503 unconfigured, 413 oversize, 403 bad signature; otherwise the parsed DMs (possibly none). */
export async function readMetaWebhook(req: Request): Promise<MetaRead> {
  const unavailable = metaUnavailable();
  if (unavailable) return { ok: false, response: unavailable };
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > META_MAX_BODY) return { ok: false, response: new Response(null, { status: 413 }) };
  const raw = await readRaw(req, META_MAX_BODY);
  if (raw === 'too_big') return { ok: false, response: new Response(null, { status: 413 }) };
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'), process.env.META_APP_SECRET ?? '')) {
    return { ok: false, response: new Response(null, { status: 403 }) };
  }
  try {
    return { ok: true, events: parseWebhookBody(JSON.parse(raw.toString('utf8'))) };
  } catch {
    // Signed by Meta but not JSON: acknowledge so Meta does not retry it forever.
    // Only the size is logged: V8's JSON.parse message quotes the body, which can hold someone's DM.
    console.error('[meta:webhook] unreadable body', raw.length);
    return { ok: true, events: [] };
  }
}
