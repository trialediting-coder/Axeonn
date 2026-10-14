// lib/metaCallbacks.ts
// Meta's two required callbacks, shared by app/api/meta/deauthorize and
// app/api/meta/data-deletion. Meta POSTs a form field signed_request (HMAC-SHA256
// under META_APP_SECRET, checked in constant time by lib/meta.ts). A good one
// forgets everything held under that Meta user id (lib/metaPages.ts
// forgetMetaUser); a bad or missing one is a 400 and touches nothing. The
// data-deletion callback answers with Meta's required JSON { url, confirmation_code }.
// The signed_request, tokens and the user id are never logged. Server-only.
import { isDatabaseConfigured } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { metaUnavailable, parseSignedRequest } from '@/lib/meta';
import { forgetMetaUser, recordDeletion, type MetaForgetResult } from '@/lib/metaPages';
import { secretRedact } from '@/lib/metaShared';

export type MetaCallbackKind = 'deauthorize' | 'data-deletion';

/** Meta's form is a few hundred bytes; anything far bigger is refused before it is read. */
export const CALLBACK_MAX_BODY = 64 * 1024;

/** The status page Meta shows the person: on the marketing host (hostRouting keeps /meta there). */
export function deletionStatusUrl(code: string, origin: string = SITE_ORIGIN): string {
  return `${origin}/meta/deletion?code=${encodeURIComponent(code)}`;
}

export interface MetaCallbackDeps {
  unavailable: () => Response | null;
  databaseReady: () => boolean;
  parse: (signed: string | null) => { userId: string } | null;
  forget: (userId: string) => Promise<MetaForgetResult>;
  record: (pagesRemoved: number) => Promise<string>;
}

const realDeps: MetaCallbackDeps = {
  unavailable: metaUnavailable,
  databaseReady: isDatabaseConfigured,
  parse: (signed) => parseSignedRequest(signed),
  forget: forgetMetaUser,
  record: recordDeletion,
};

async function signedRequestFrom(req: Request): Promise<string | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > CALLBACK_MAX_BODY) return null;
  const form = await req.formData().catch(() => null);
  const value = form?.get('signed_request');
  return typeof value === 'string' ? value : null;
}

export async function handleMetaCallback(req: Request, kind: MetaCallbackKind, deps: MetaCallbackDeps = realDeps): Promise<Response> {
  const unavailable = deps.unavailable();
  if (unavailable) return unavailable;
  const parsed = deps.parse(await signedRequestFrom(req));
  if (!parsed) return Response.json({ error: 'Bad signed_request' }, { status: 400 });
  if (!deps.databaseReady()) return Response.json({ error: 'Not available' }, { status: 503 });
  try {
    const result = await deps.forget(parsed.userId);
    if (kind === 'deauthorize') return Response.json({ ok: true });
    const code = await deps.record(result.pagesRemoved);
    return Response.json({ url: deletionStatusUrl(code), confirmation_code: code });
  } catch (err) {
    // The error text only: never the request, the user id or a token.
    console.error(`[meta:${kind}] failed`, secretRedact(errText(err)).slice(0, 300));
    return Response.json({ error: 'Could not complete the request' }, { status: 500 });
  }
}
