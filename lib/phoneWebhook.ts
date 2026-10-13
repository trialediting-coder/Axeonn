// lib/phoneWebhook.ts
// What every /api/phone route does first: read the form body, prove it came
// from Twilio, hand back the params. Signature is computed over the public URL
// (webhookUrl), not req.url, because Vercel rewrites the host internally.
import { formParams, verifyTwilioSignature, webhookUrl } from '@/lib/twilio';

const MAX_BODY = 8192;

export type TwilioRead = { ok: true; params: Record<string, string> } | { ok: false; response: Response };

export async function readTwilioRequest(req: Request, path: string): Promise<TwilioRead> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY) return { ok: false, response: new Response(null, { status: 413 }) };
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) return { ok: false, response: new Response(null, { status: 413 }) };
  const params = formParams(text);
  if (!verifyTwilioSignature(webhookUrl(path), params, req.headers.get('x-twilio-signature'))) return { ok: false, response: new Response(null, { status: 403 }) };
  return { ok: true, params };
}
