// lib/social.ts
// Reels posting for AxeonGROWTH. The admin uploads a video to Vercel Blob,
// writes a caption and picks a time; one social_posts row per platform. The
// hourly cron (app/api/cron/social) publishes due rows: Instagram through the
// container flow (create → wait for FINISHED → media_publish), Facebook through
// one /{page-id}/videos call. The container is checked once per run, never
// waited on inside one: a container still processing is looked at again next
// hour. The same cron refreshes Instagram reach and views daily. Server-only.
import { del } from '@vercel/blob';
import { ensureSchema, sql } from '@/lib/db';
import { errText, iso, type DbTime } from '@/lib/dbRows';
import type { Onboarding } from '@/lib/onboarding';
import { containerStatus, createReelContainer, mediaInsights, mediaPermalink, MetaApiError, publishContainer, publishPageVideo } from '@/lib/meta';
import { markNeedsReconnect, pageForId, pagesFor } from '@/lib/metaPages';
import { secretRedact, type DashboardReel, type SocialPlatform, type SocialPost, type SocialStatus } from '@/lib/metaShared';
import { nextSocialStep, shouldGiveUp, toDashboardReel, validateScheduleTime, type SocialInput } from '@/lib/socialShared';

const isoOrNull = (t: DbTime | null): string | null => (t ? iso(t) : null);

interface PostRow {
  id: number;
  onboarding_id: number;
  platform: SocialPlatform;
  page_id: string;
  video_url: string;
  caption: string;
  scheduled_at: DbTime | null;
  status: SocialStatus;
  container_id: string | null;
  remote_id: string | null;
  permalink: string | null;
  error: string | null;
  attempts: number;
  reach: number | null;
  plays: number | null;
  published_at: DbTime | null;
  created_at: DbTime;
}

function toPost(r: PostRow): SocialPost {
  return {
    id: r.id,
    platform: r.platform,
    pageId: r.page_id,
    videoUrl: r.video_url,
    caption: r.caption,
    scheduledAt: isoOrNull(r.scheduled_at),
    status: r.status,
    remoteId: r.remote_id,
    permalink: r.permalink,
    error: r.error,
    reach: r.reach,
    plays: r.plays,
    publishedAt: isoOrNull(r.published_at),
    createdAt: iso(r.created_at),
  };
}

export function assertGrowth(onboarding: Pick<Onboarding, 'tier'>): void {
  if (onboarding.tier !== 'axeongrowth') throw new Error('Reels posting is part of AxeonGROWTH.');
}

export async function listSocialPosts(onboardingId: number, limit = 50): Promise<SocialPost[]> {
  await ensureSchema();
  const res = await sql<PostRow>`SELECT * FROM social_posts WHERE onboarding_id = ${onboardingId} ORDER BY COALESCE(scheduled_at, created_at) DESC LIMIT ${limit};`;
  return res.rows.map(toPost);
}

/** One row per platform. Instagram needs a page with a linked Instagram professional account. */
export async function createSocialPosts(onboarding: Onboarding, input: SocialInput): Promise<SocialPost[]> {
  assertGrowth(onboarding);
  const pages = (await pagesFor(onboarding.id)).filter((p) => p.status === 'active');
  if (!pages.length) throw new Error('Connect the client\'s Facebook page first.');
  const page = pages[0];
  if (input.platforms.includes('instagram') && !page.igUserId) throw new Error('This Facebook page has no Instagram professional account linked. Post to Facebook only, or link Instagram in Meta Business Suite and reconnect.');
  const status: SocialStatus = input.scheduledAt ? 'scheduled' : 'draft';
  const out: SocialPost[] = [];
  for (const platform of input.platforms) {
    const res = await sql<PostRow>`
      INSERT INTO social_posts (onboarding_id, platform, page_id, video_url, caption, scheduled_at, status)
      VALUES (${onboarding.id}, ${platform}, ${page.pageId}, ${input.videoUrl}, ${input.caption}, ${input.scheduledAt}, ${status})
      RETURNING *;
    `;
    out.push(toPost(res.rows[0]));
  }
  return out;
}

/** Schedules a draft or retries a failed post at a new time. Never touches a row the cron holds right now. */
export async function scheduleSocialPost(onboardingId: number, id: number, rawTime: unknown): Promise<void> {
  const at = validateScheduleTime(rawTime);
  await ensureSchema();
  const res = await sql`
    UPDATE social_posts SET scheduled_at = ${at}, status = 'scheduled', error = NULL, attempts = 0, container_id = NULL, updated_at = now()
    WHERE id = ${id} AND onboarding_id = ${onboardingId} AND status IN ('draft', 'scheduled', 'failed')
      AND (locked_until IS NULL OR locked_until < now());
  `;
  if (!res.rowCount) throw new Error('That post is being posted right now, was already published, or no longer exists.');
}

/** Deletes a post that has not gone out, and its video when no other post uses it. Published posts stay on record. */
export async function deleteSocialPost(onboardingId: number, id: number): Promise<void> {
  await ensureSchema();
  const res = await sql<{ video_url: string }>`
    DELETE FROM social_posts WHERE id = ${id} AND onboarding_id = ${onboardingId} AND status IN ('draft', 'scheduled', 'failed')
      AND (locked_until IS NULL OR locked_until < now())
    RETURNING video_url;
  `;
  const url = res.rows[0]?.video_url;
  if (!url) throw new Error('Published posts, and posts going out right now, cannot be deleted here. Remove published ones on Instagram or Facebook.');
  const still = await sql`SELECT 1 FROM social_posts WHERE onboarding_id = ${onboardingId} AND video_url = ${url} LIMIT 1;`;
  if (!still.rowCount) {
    try {
      await del(url);
    } catch (err) {
      console.error('[social] blob delete failed', errText(err));
    }
  }
}

export async function publishedReels(onboardingId: number, limit = 12): Promise<DashboardReel[]> {
  await ensureSchema();
  const res = await sql<PostRow>`
    SELECT * FROM social_posts WHERE onboarding_id = ${onboardingId} AND status = 'published'
    ORDER BY published_at DESC LIMIT ${limit};
  `;
  return res.rows.map(toPost).map(toDashboardReel).filter((r): r is DashboardReel => r !== null);
}

export interface CronDeps {
  now: () => Date;
}

const realDeps: CronDeps = { now: () => new Date() };
const POSTS_PER_RUN = 5;
const INSIGHTS_PER_RUN = 25;
const RECONNECT_ERROR = 'Not posted: the Facebook page needs to be reconnected. Ask the client to reconnect it, then schedule this post again.';

async function markPublished(id: number, remoteId: string | null, permalink: string | null, note: string | null = null) {
  await sql`
    UPDATE social_posts SET status = 'published', remote_id = ${remoteId}, permalink = ${permalink}, error = ${note},
      published_at = now(), locked_until = NULL, updated_at = now()
    WHERE id = ${id};
  `;
}

async function markProblem(post: PostRow, err: unknown) {
  const status = err instanceof MetaApiError ? err.status : 0;
  const message = secretRedact(errText(err)).slice(0, 400);
  if (err instanceof MetaApiError && err.tokenInvalid) await markNeedsReconnect(post.page_id, message);
  const giveUp = (err instanceof MetaApiError && err.tokenInvalid) || shouldGiveUp(post.attempts, status);
  await sql`
    UPDATE social_posts SET attempts = attempts + 1, error = ${message}, status = ${giveUp ? 'failed' : 'scheduled'},
      container_id = ${giveUp ? null : post.container_id}, locked_until = NULL, updated_at = now()
    WHERE id = ${post.id};
  `;
  return giveUp;
}

async function release(id: number) {
  await sql`UPDATE social_posts SET locked_until = NULL, updated_at = now() WHERE id = ${id};`;
}

type Outcome = 'published' | 'failed' | 'waiting' | 'reconnect';

async function runOne(post: PostRow, deps: CronDeps): Promise<Outcome> {
  const step = nextSocialStep({ platform: post.platform, status: post.status, scheduledAt: isoOrNull(post.scheduled_at), containerId: post.container_id }, deps.now().getTime());
  if (step === 'skip') {
    await release(post.id);
    return 'waiting';
  }
  const page = await pageForId(post.page_id);
  if (!page || page.onboardingId !== post.onboarding_id) {
    await sql`UPDATE social_posts SET status = 'failed', error = 'The Facebook page is no longer connected.', locked_until = NULL, updated_at = now() WHERE id = ${post.id};`;
    return 'failed';
  }
  if (page.status !== 'active') {
    // Skipped without calling Meta: the sealed token is known bad. Failed (not left scheduled) so it cannot hold a slot every hour.
    await sql`UPDATE social_posts SET status = 'failed', error = ${RECONNECT_ERROR}, container_id = NULL, locked_until = NULL, updated_at = now() WHERE id = ${post.id};`;
    return 'reconnect';
  }
  let containerId = post.container_id;
  try {
    if (step === 'publish_facebook') {
      const videoId = await publishPageVideo({ pageId: page.pageId, pageToken: page.pageToken, videoUrl: post.video_url, description: post.caption });
      await markPublished(post.id, videoId, `https://www.facebook.com/${encodeURIComponent(page.pageId)}/videos/${encodeURIComponent(videoId)}`);
      return 'published';
    }
    if (!page.igUserId) {
      await sql`UPDATE social_posts SET status = 'failed', error = 'No Instagram account is linked to this page anymore.', locked_until = NULL, updated_at = now() WHERE id = ${post.id};`;
      return 'failed';
    }
    if (!containerId) {
      containerId = await createReelContainer({ igUserId: page.igUserId, pageToken: page.pageToken, videoUrl: post.video_url, caption: post.caption });
      // Saved before any status check, so a timeout here never creates a second container next hour.
      await sql`UPDATE social_posts SET container_id = ${containerId}, updated_at = now() WHERE id = ${post.id};`;
    }
    // One look per run. Still processing → release and check again next run (no waiting inside this one).
    const { code, detail } = await containerStatus(containerId, page.pageToken);
    if (code === 'FINISHED') {
      const mediaId = await publishContainer({ igUserId: page.igUserId, pageToken: page.pageToken, containerId });
      await markPublished(post.id, mediaId, await mediaPermalink(mediaId, page.pageToken));
      return 'published';
    }
    if (code === 'PUBLISHED') {
      // Published on an earlier run whose database write was lost; Instagram does not return the media id again.
      await markPublished(post.id, null, null, 'Posted. Instagram did not send back the post link.');
      return 'published';
    }
    if (code === 'ERROR' || code === 'EXPIRED') {
      const why = code === 'EXPIRED' ? 'Instagram did not finish processing the video within 24 hours.' : `Instagram could not process the video${detail ? `: ${detail}` : '.'}`;
      await sql`UPDATE social_posts SET status = 'failed', error = ${why.slice(0, 400)}, container_id = NULL, locked_until = NULL, updated_at = now() WHERE id = ${post.id};`;
      return 'failed';
    }
    await release(post.id);
    return 'waiting';
  } catch (err) {
    // Keep a container created earlier in this run: writing back the row's old (null) id would make the next run create a second one.
    return (await markProblem({ ...post, container_id: containerId }, err)) ? 'failed' : 'waiting';
  }
}

async function refreshInsights(deps: CronDeps): Promise<number> {
  const due = await sql<PostRow>`
    SELECT p.* FROM social_posts p JOIN onboardings o ON o.id = p.onboarding_id
    WHERE p.status = 'published' AND p.platform = 'instagram' AND p.remote_id IS NOT NULL
      AND o.tier = 'axeongrowth' AND o.status <> 'closed'
      AND p.published_at > now() - interval '90 days'
      AND (p.insights_at IS NULL OR p.insights_at < now() - interval '20 hours')
    ORDER BY p.insights_at NULLS FIRST LIMIT ${INSIGHTS_PER_RUN};
  `;
  let updated = 0;
  for (const post of due.rows) {
    try {
      const page = await pageForId(post.page_id);
      if (!page || page.onboardingId !== post.onboarding_id || page.status !== 'active') {
        // No usable token: look again tomorrow, without calling Meta.
        await sql`UPDATE social_posts SET insights_at = ${deps.now().toISOString()} WHERE id = ${post.id};`;
        continue;
      }
      const { reach, plays } = await mediaInsights(post.remote_id!, page.pageToken);
      await sql`UPDATE social_posts SET reach = COALESCE(${reach}, reach), plays = COALESCE(${plays}, plays), insights_at = ${deps.now().toISOString()}, updated_at = now() WHERE id = ${post.id};`;
      updated += 1;
    } catch (err) {
      console.error('[social] insights', post.id, secretRedact(errText(err)));
      // Try again tomorrow rather than every hour.
      await sql`UPDATE social_posts SET insights_at = ${deps.now().toISOString()} WHERE id = ${post.id};`;
    }
  }
  return updated;
}

/**
 * The hourly cron. Claims up to five due posts with a 10-minute lease (FOR UPDATE SKIP LOCKED,
 * re-checked in the outer WHERE) so an overlapping run cannot double-post. AxeonGROWTH only.
 * `reconnect` counts posts skipped because their page needs reconnecting.
 */
export async function runSocialCron(deps: CronDeps = realDeps): Promise<{ published: number; failed: number; waiting: number; reconnect: number; insights: number }> {
  await ensureSchema();
  const claimed = await sql<PostRow>`
    UPDATE social_posts SET locked_until = now() + interval '10 minutes'
    WHERE id IN (
      SELECT p.id FROM social_posts p JOIN onboardings o ON o.id = p.onboarding_id
      WHERE p.status = 'scheduled' AND p.scheduled_at <= now() AND o.tier = 'axeongrowth' AND o.status <> 'closed'
        AND (p.locked_until IS NULL OR p.locked_until < now())
      ORDER BY p.scheduled_at LIMIT ${POSTS_PER_RUN}
      FOR UPDATE OF p SKIP LOCKED
    )
    AND (locked_until IS NULL OR locked_until < now())
    RETURNING *;
  `;
  const tally = { published: 0, failed: 0, waiting: 0, reconnect: 0, insights: 0 };
  for (const post of claimed.rows) tally[await runOne(post, deps)] += 1;
  tally.insights = await refreshInsights(deps);
  return tally;
}
