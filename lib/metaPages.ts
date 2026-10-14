// lib/metaPages.ts
// The Facebook pages (and their linked Instagram accounts) a client connected.
// Page tokens are sealed with lib/secretBox.ts on the way in and opened only
// inside pageForId, for the webhook, the Send API and the reels cron. Every
// other reader gets MetaPagePublic, which has no token field. Server-only.
import { createHash, randomBytes } from 'node:crypto';
import { ensureSchema, sql } from '@/lib/db';
import { iso, type DbId, type DbTime } from '@/lib/dbRows';
import { open, seal } from '@/lib/secretBox';
import { unsubscribePage } from '@/lib/meta';
import { secretRedact, type MetaPagePublic } from '@/lib/metaShared';

export interface PageRow {
  id: DbId;
  onboarding_id: number;
  page_id: string;
  page_name: string;
  ig_user_id: string | null;
  ig_username: string | null;
  fb_user_id: string | null;
  token_enc: string;
  status: 'active' | 'needs_reconnect';
  last_error: string | null;
  connected_at: DbTime;
  updated_at: DbTime;
}

/** Server-only shape: the decrypted page token travels with the page, never further than the Graph call. */
export interface MetaPageWithToken extends MetaPagePublic {
  onboardingId: number;
  pageToken: string;
}

/** The only mapper API routes and pages may use. Builds a fresh object so no column can leak through. */
export function toPublicPage(row: PageRow): MetaPagePublic {
  return {
    pageId: row.page_id,
    pageName: row.page_name,
    igUserId: row.ig_user_id,
    igUsername: row.ig_username,
    status: row.status,
    lastError: row.last_error,
    connectedAt: iso(row.connected_at),
  };
}

export async function savePage(input: {
  onboardingId: number;
  pageId: string;
  pageName: string;
  igUserId: string | null;
  igUsername: string | null;
  fbUserId: string;
  pageToken: string;
  /** The Instagram lookup failed (not "no Instagram"): keep the link already stored instead of erasing it. */
  keepExistingIg?: boolean;
}): Promise<MetaPagePublic> {
  const keepIg = input.keepExistingIg === true;
  await ensureSchema();
  const sealed = seal(input.pageToken);
  // A page already connected to a different client is never moved silently.
  const res = await sql<PageRow>`
    INSERT INTO meta_pages (onboarding_id, page_id, page_name, ig_user_id, ig_username, fb_user_id, token_enc, status, last_error, connected_at, updated_at)
    VALUES (${input.onboardingId}, ${input.pageId}, ${input.pageName.slice(0, 200)}, ${input.igUserId}, ${input.igUsername}, ${input.fbUserId}, ${sealed}, 'active', NULL, now(), now())
    ON CONFLICT (page_id) DO UPDATE SET
      page_name = EXCLUDED.page_name,
      ig_user_id = CASE WHEN ${keepIg} THEN COALESCE(EXCLUDED.ig_user_id, meta_pages.ig_user_id) ELSE EXCLUDED.ig_user_id END,
      ig_username = CASE WHEN ${keepIg} THEN COALESCE(EXCLUDED.ig_username, meta_pages.ig_username) ELSE EXCLUDED.ig_username END,
      fb_user_id = EXCLUDED.fb_user_id,
      token_enc = EXCLUDED.token_enc,
      status = 'active',
      last_error = NULL,
      updated_at = now()
    WHERE meta_pages.onboarding_id = EXCLUDED.onboarding_id
    RETURNING *;
  `;
  if (!res.rows[0]) throw new Error(`The Facebook page "${input.pageName}" is already connected to another Axeon client.`);
  return toPublicPage(res.rows[0]);
}

/** The page that owns a webhook id: a Facebook page id (Messenger) or a linked Instagram account id (Instagram). */
export async function pageForId(pageOrIgId: string): Promise<MetaPageWithToken | null> {
  if (!pageOrIgId) return null;
  await ensureSchema();
  const res = await sql<PageRow>`
    SELECT * FROM meta_pages WHERE page_id = ${pageOrIgId} OR ig_user_id = ${pageOrIgId}
    ORDER BY updated_at DESC LIMIT 1;
  `;
  const row = res.rows[0];
  if (!row) return null;
  return { ...toPublicPage(row), onboardingId: row.onboarding_id, pageToken: open(row.token_enc) };
}

export async function pagesFor(onboardingId: number): Promise<MetaPagePublic[]> {
  await ensureSchema();
  const res = await sql<PageRow>`SELECT * FROM meta_pages WHERE onboarding_id = ${onboardingId} ORDER BY connected_at;`;
  return res.rows.map(toPublicPage);
}

/** Stops the page's webhooks (best effort) and forgets its token. Messages already received stay in the inbox. */
export async function disconnect(onboardingId: number, pageId: string): Promise<boolean> {
  await ensureSchema();
  const res = await sql<PageRow>`SELECT * FROM meta_pages WHERE onboarding_id = ${onboardingId} AND page_id = ${pageId};`;
  const row = res.rows[0];
  if (!row) return false;
  try {
    await unsubscribePage(row.page_id, open(row.token_enc));
  } catch (err) {
    console.error('[meta] unsubscribe failed', row.page_id, secretRedact(err instanceof Error ? err.message : String(err)));
  }
  await sql`DELETE FROM meta_pages WHERE onboarding_id = ${onboardingId} AND page_id = ${pageId};`;
  return true;
}

/** Meta said the token is no good (code 190). The admin card shows it; the client is asked to reconnect. */
export async function markNeedsReconnect(pageId: string, error: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE meta_pages SET status = 'needs_reconnect', last_error = ${secretRedact(error).slice(0, 300)}, updated_at = now() WHERE page_id = ${pageId};`;
}

/** Deauthorize and data-deletion callbacks: forget every page the person connected. Returns how many. */
export async function removePagesForUser(fbUserId: string): Promise<number> {
  await ensureSchema();
  const res = await sql`DELETE FROM meta_pages WHERE fb_user_id = ${fbUserId};`;
  return res.rowCount ?? 0;
}

/** Stores the outcome of a data-deletion request under a random code Meta shows the person. No Facebook id is kept. */
export async function recordDeletion(removed: number): Promise<string> {
  await ensureSchema();
  const code = randomBytes(12).toString('base64url');
  await sql`INSERT INTO meta_deletions (code_hash, pages_removed) VALUES (${hashCode(code)}, ${removed});`;
  return code;
}

export async function deletionStatus(code: string): Promise<{ pagesRemoved: number; at: string } | null> {
  if (!/^[A-Za-z0-9_-]{16}$/.test(code)) return null;
  await ensureSchema();
  const res = await sql<{ pages_removed: number; created_at: DbTime }>`SELECT pages_removed, created_at FROM meta_deletions WHERE code_hash = ${hashCode(code)};`;
  const row = res.rows[0];
  return row ? { pagesRemoved: row.pages_removed, at: iso(row.created_at) } : null;
}

function hashCode(code: string): string {
  return createHash('sha256').update(`meta-deletion:${code}`).digest('hex');
}
