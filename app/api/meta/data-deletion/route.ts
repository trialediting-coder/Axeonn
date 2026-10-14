// app/api/meta/data-deletion/route.ts
// Meta's "Data Deletion Request callback URL". Meta POSTs signed_request when a
// person asks Facebook to delete what Axeon holds about them. We delete it at
// once and answer with Meta's required JSON { url, confirmation_code }, where
// url is the /meta/deletion status page (lib/metaCallbacks.ts).
import { handleMetaCallback } from '@/lib/metaCallbacks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handleMetaCallback(req, 'data-deletion');
}
