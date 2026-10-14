// app/api/meta/deauthorize/route.ts
// Meta's "Deauthorize callback URL": POSTed (form field signed_request) when a
// person removes the Axeon app from their Facebook settings. We forget every
// page they connected and anything stored under their Meta id (lib/metaCallbacks.ts).
import { handleMetaCallback } from '@/lib/metaCallbacks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handleMetaCallback(req, 'deauthorize');
}
