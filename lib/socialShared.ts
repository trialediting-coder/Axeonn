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
