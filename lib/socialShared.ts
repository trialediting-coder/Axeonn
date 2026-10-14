// lib/socialShared.ts
// Client-safe rules for reels posting (AxeonGROWTH): what a valid post is, where
// its video may live, and what the hourly cron does next with each row. The
// admin Social card validates with the same functions the API uses.
import { captionProblem, SOCIAL_PLATFORMS, type DashboardReel, type SocialPlatform, type SocialPost, type SocialStatus } from '@/lib/metaShared';

/** Vercel Blob public URLs: https://<store>.public.blob.vercel-storage.com/<path>. Only our own uploads are posted. */
export const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';
/** Instagram reels: MP4 or MOV, up to 300 MB (the smaller of the IG and Facebook limits). */
export const REEL_MAX_BYTES = 300 * 1024 * 1024;
export const REEL_CONTENT_TYPES = ['video/mp4', 'video/quicktime'] as const;
export const SCHEDULE_MAX_DAYS = 60;
/** A post that fails this many times for a reason that might pass (network, 5xx) is marked failed. */
export const MAX_ATTEMPTS = 3;

export interface SocialInput {
  platforms: SocialPlatform[];
  videoUrl: string;
  caption: string;
  /** ISO time, or null to save as a draft. */
  scheduledAt: string | null;
}

/** The Blob path every upload for a client must use: social/<onboarding id>/<file>. Never the portal token. */
export function blobPathFor(onboardingId: number, filename: string): string {
  const clean = filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'reel.mp4';
  return `social/${onboardingId}/${clean}`;
}

export function isBlobPathFor(onboardingId: number, pathname: string): boolean {
  return new RegExp(`^social/${onboardingId}/[a-z0-9.-]{1,80}$`).test(pathname);
}

export function isBlobVideoUrl(raw: string, onboardingId: number): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.hostname.endsWith(BLOB_HOST_SUFFIX) && u.pathname.startsWith(`/social/${onboardingId}/`);
  } catch {
    return false;
  }
}

/** A schedule time the cron can honour: not more than 5 minutes in the past, not more than 60 days out. */
export function validateScheduleTime(raw: unknown, now: number = Date.now()): string {
  const t = typeof raw === 'string' ? Date.parse(raw) : NaN;
  if (!Number.isFinite(t)) throw new Error('Pick a date and time to post it.');
  if (t < now - 5 * 60_000) throw new Error('That time has already passed.');
  if (t > now + SCHEDULE_MAX_DAYS * 86_400_000) throw new Error(`Schedule it within the next ${SCHEDULE_MAX_DAYS} days.`);
  return new Date(t).toISOString();
}

export function validateSocialInput(raw: unknown, onboardingId: number, now: number = Date.now()): SocialInput {
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const platforms = Array.isArray(body.platforms) ? [...new Set(body.platforms.filter((p): p is SocialPlatform => SOCIAL_PLATFORMS.includes(p as SocialPlatform)))] : [];
  if (!platforms.length) throw new Error('Choose Instagram, Facebook, or both.');
  const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
  if (!isBlobVideoUrl(videoUrl, onboardingId)) throw new Error('Upload the video first.');
  const caption = typeof body.caption === 'string' ? body.caption.replace(/\r\n/g, '\n').trim() : '';
  const problem = captionProblem(caption);
  if (problem) throw new Error(problem);
  const scheduledAt = body.scheduledAt == null || body.scheduledAt === '' ? null : validateScheduleTime(body.scheduledAt, now);
  return { platforms, videoUrl, caption, scheduledAt };
}

export type SocialStep = 'skip' | 'create_container' | 'check_container' | 'publish_facebook';

/** What the cron does with one row right now. Pure so the order of the flow is pinned by tests. */
export function nextSocialStep(post: { platform: SocialPlatform; status: SocialStatus; scheduledAt: string | null; containerId: string | null }, now: number): SocialStep {
  if (post.status !== 'scheduled' || !post.scheduledAt || Date.parse(post.scheduledAt) > now) return 'skip';
  if (post.platform === 'facebook') return 'publish_facebook';
  return post.containerId ? 'check_container' : 'create_container';
}

/** True when a failure should end the post: Meta refused it outright (4xx), or it has failed MAX_ATTEMPTS times. */
export function shouldGiveUp(attemptsSoFar: number, httpStatus: number): boolean {
  if (httpStatus >= 400 && httpStatus < 500) return true;
  return attemptsSoFar + 1 >= MAX_ATTEMPTS;
}

export function toDashboardReel(p: SocialPost): DashboardReel | null {
  if (p.status !== 'published' || !p.publishedAt) return null;
  return { platform: p.platform, caption: p.caption, publishedAt: p.publishedAt, permalink: p.permalink, reach: p.reach, plays: p.plays };
}

// ---- Publishing safety (fix round 1) ----

/** Facebook /videos and Instagram media_publish can take a while (Meta may fetch the file before answering), so they get longer than graph()'s 10 s. */
export const PUBLISH_TIMEOUT_MS = 40_000;
/** The cron stops starting new work after this long; app/api/cron/social maxDuration is 300 s. */
export const CRON_STOP_AFTER_MS = 280_000;
/** Worst case for one more post: create container + status + publish (40 s) + permalink, each Graph call capped. */
export const PER_POST_BUDGET_MS = 75_000;
/** Worst case for one insights refresh: reach,views then reach alone, 10 s each. */
export const PER_INSIGHT_BUDGET_MS = 25_000;

/** The note on a post whose publish call went out and got no clear answer. */
export function unclearPublishNote(platform: SocialPlatform): string {
  return platform === 'facebook' ? 'This may have posted. Check the Facebook page before you retry.' : 'This may have posted. Check the Instagram account before you retry.';
}

/**
 * After a publish call fails: only a clear 4xx means Meta refused it ("not posted, safe to retry").
 * A timeout or network error (status 0), a 5xx, or a 2xx without an id may have posted.
 */
export function publishOutcome(httpStatus: number): 'not_posted' | 'unclear' {
  return httpStatus >= 400 && httpStatus < 500 ? 'not_posted' : 'unclear';
}

/**
 * Graph error codes that are a passing condition, not a refusal of this post: 2 (temporary
 * service error) and the rate limits 4, 17, 32 and 613. Meta may send them on an HTTP 4xx.
 */
export const TRANSIENT_META_CODES: readonly number[] = [2, 4, 17, 32, 613];

export function isTransientMetaCode(code: number | null | undefined): boolean {
  return typeof code === 'number' && TRANSIENT_META_CODES.includes(code);
}

/**
 * Whether a post that is being given up keeps its Instagram container: cleared only when Meta
 * clearly refused it (a 4xx that is not a dead token and not a transient code, which may have
 * hidden a publish that went through). A kept container is checked before any new one is made.
 */
export function keepContainerOnGiveUp(httpStatus: number, tokenInvalid: boolean, code: number | null = null): boolean {
  return tokenInvalid || isTransientMetaCode(code) || publishOutcome(httpStatus) === 'unclear';
}

// ---- Settling an unclear publish (final fix wave, F1) ----

/** How far back the cron keeps looking for an unclear post, counted from its scheduled time. After that, only the admin buttons settle it. */
export const UNCLEAR_LOOKBACK_DAYS = 7;
/** A Facebook video counts as this post only when it appeared within this window of the scheduled time (the cron runs hourly, and Facebook may take a while to fetch the file). */
export const FB_MATCH_BEFORE_MS = 5 * 60_000;
export const FB_MATCH_AFTER_MS = 3 * 60 * 60_000;
/** Worst case for settling one unclear post: one Graph read (10 s) plus the writes. */
export const PER_SETTLE_BUDGET_MS = 15_000;

/**
 * What an Instagram container's status says about a publish whose answer was lost:
 * PUBLISHED means it went out; ERROR or EXPIRED means it never can, so a retry is safe;
 * anything else (FINISHED, IN_PROGRESS) proves nothing yet, so the post is left as it is.
 */
export function unclearContainerVerdict(code: string): 'posted' | 'retry_safe' | 'wait' {
  if (code === 'PUBLISHED') return 'posted';
  if (code === 'ERROR' || code === 'EXPIRED') return 'retry_safe';
  return 'wait';
}

export interface PageVideo {
  id: string;
  description?: string | null;
  title?: string | null;
  created_time?: string | null;
}

const sameText = (a: string | null | undefined, b: string) => typeof a === 'string' && a.replace(/\r\n/g, '\n').trim() === b;

/**
 * The page video that is this unclear Facebook post, or null. Matched only when the description
 * or title equals the caption exactly, it appeared within the window around the scheduled time,
 * no other post already claims it, and exactly one video fits. A post with no caption is never
 * matched (nothing reliable to match on); the admin buttons settle it instead.
 */
export function matchPageVideo(videos: readonly PageVideo[], post: { caption: string; scheduledAt: string | null }, takenIds: ReadonlySet<string>): string | null {
  const caption = post.caption.replace(/\r\n/g, '\n').trim();
  const at = post.scheduledAt ? Date.parse(post.scheduledAt) : NaN;
  if (!caption || !Number.isFinite(at)) return null;
  const hits = videos.filter((v) => {
    if (!v.id || takenIds.has(v.id)) return false;
    const created = v.created_time ? Date.parse(v.created_time) : NaN;
    if (!Number.isFinite(created) || created < at - FB_MATCH_BEFORE_MS || created > at + FB_MATCH_AFTER_MS) return false;
    return sameText(v.description, caption) || sameText(v.title, caption);
  });
  return hits.length === 1 ? hits[0].id : null;
}

/** The admin's two answers on a post that may have posted. Null when allowed; otherwise why not. */
export function unclearActionProblem(p: Pick<SocialPost, 'status' | 'publishUnclear' | 'remoteId'>): string | null {
  if (p.status === 'published' || p.remoteId) return 'Already posted.';
  if (p.status !== 'failed' || !p.publishUnclear) return 'That post is not waiting on a check.';
  return null;
}

export type UnclearAction = 'posted' | 'retry';

export function parseUnclearAction(raw: unknown): UnclearAction | null {
  return raw === 'posted' || raw === 'retry' ? raw : null;
}

/** Why a post may not be scheduled again (it went out, or may have), or null when a retry is safe. */
export function retryBlockedReason(p: Pick<SocialPost, 'status' | 'remoteId' | 'publishUnclear' | 'platform'>): string | null {
  if (p.status === 'published' || p.remoteId) return 'Already posted.';
  if (p.publishUnclear) return unclearPublishNote(p.platform);
  return null;
}

/** The channels a post can really go to: Instagram is dropped when the page has no linked Instagram account. */
export function platformsForPage(platforms: readonly SocialPlatform[], page: { igUserId: string | null }): SocialPlatform[] {
  const out = platforms.filter((p) => p !== 'instagram' || Boolean(page.igUserId));
  if (!out.length) throw new Error('This Facebook page has no Instagram professional account linked. Choose Facebook, or link Instagram in Meta Business Suite and reconnect.');
  return out;
}

export interface BoundedRun<T, R> {
  now: () => number;
  /** No item is started unless now() + perItemMs still fits before stopAt. */
  stopAt: number;
  perItemMs: number;
  run: (item: T) => Promise<R>;
  /** Records a failure on that item. If it throws too, `fallback` is used and the loop still goes on. */
  onError: (item: T, err: unknown) => Promise<R>;
  /** Called for each item left over when time runs out (release its lease). Errors are ignored. */
  onSkip: (item: T) => Promise<void>;
  fallback: R;
}

/** Runs items one by one so a throw on one never stops the rest, and stops before the time budget runs out. */
export async function runBounded<T, R>(items: readonly T[], o: BoundedRun<T, R>): Promise<{ results: R[]; skipped: number }> {
  const results: R[] = [];
  let skipped = 0;
  for (let i = 0; i < items.length; i++) {
    if (o.now() + o.perItemMs > o.stopAt) {
      for (const rest of items.slice(i)) {
        skipped += 1;
        try {
          await o.onSkip(rest);
        } catch {
          // The lease runs out on its own.
        }
      }
      break;
    }
    const item = items[i];
    try {
      results.push(await o.run(item));
    } catch (err) {
      try {
        results.push(await o.onError(item, err));
      } catch (inner) {
        console.error('[social] could not record a failure', inner instanceof Error ? inner.message : String(inner));
        results.push(o.fallback);
      }
    }
  }
  return { results, skipped };
}
