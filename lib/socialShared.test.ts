// lib/socialShared.test.ts
// Run with: npm run test:meta
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blobPathFor, isBlobPathFor, isBlobVideoUrl, nextSocialStep, shouldGiveUp, toDashboardReel, validateScheduleTime, validateSocialInput } from './socialShared';
import type { SocialPost } from './metaShared';

const NOW = Date.parse('2026-10-13T12:00:00Z');
const VIDEO = 'https://abc123.public.blob.vercel-storage.com/social/42/before-after-x1y2.mp4';

test('blob paths are per client and never carry the portal token', () => {
  assert.equal(blobPathFor(42, 'Before & After (final).MP4'), 'social/42/before-after-final-.mp4');
  assert.equal(isBlobPathFor(42, 'social/42/before-after-final-.mp4'), true);
  assert.equal(isBlobPathFor(42, 'social/43/x.mp4'), false);
  assert.equal(isBlobPathFor(42, 'social/42/../43/x.mp4'), false);
  assert.equal(isBlobPathFor(42, 'social/42/ABCDEFGHIJKLMNOPQRST.mp4'), false);
});

test('only this client\'s Vercel Blob videos may be posted', () => {
  assert.equal(isBlobVideoUrl(VIDEO, 42), true);
  assert.equal(isBlobVideoUrl(VIDEO, 7), false);
  assert.equal(isBlobVideoUrl('http://abc123.public.blob.vercel-storage.com/social/42/a.mp4', 42), false);
  assert.equal(isBlobVideoUrl('https://evil.example.com/social/42/a.mp4', 42), false);
  assert.equal(isBlobVideoUrl('not a url', 42), false);
});

test('validateSocialInput keeps known platforms once, trims the caption, and allows drafts', () => {
  const input = validateSocialInput({ platforms: ['instagram', 'instagram', 'tiktok', 'facebook'], videoUrl: ` ${VIDEO} `, caption: '  Fresh coat #detailing \r\n' }, 42, NOW);
  assert.deepEqual(input, { platforms: ['instagram', 'facebook'], videoUrl: VIDEO, caption: 'Fresh coat #detailing', scheduledAt: null });
  const scheduled = validateSocialInput({ platforms: ['facebook'], videoUrl: VIDEO, caption: '', scheduledAt: '2026-10-14T15:00:00Z' }, 42, NOW);
  assert.equal(scheduled.scheduledAt, '2026-10-14T15:00:00.000Z');
});

test('validateSocialInput refuses no platform, a foreign video, and a caption Instagram would reject', () => {
  assert.throws(() => validateSocialInput({ platforms: [], videoUrl: VIDEO }, 42, NOW), /Instagram, Facebook, or both/);
  assert.throws(() => validateSocialInput({ platforms: ['instagram'], videoUrl: 'https://example.com/a.mp4' }, 42, NOW), /Upload the video first/);
  assert.throws(() => validateSocialInput({ platforms: ['instagram'], videoUrl: VIDEO, caption: 'x'.repeat(2201) }, 42, NOW), /2,200 characters/);
});

test('validateScheduleTime allows a few minutes of lag and up to 60 days ahead', () => {
  assert.equal(validateScheduleTime('2026-10-13T11:57:00Z', NOW), '2026-10-13T11:57:00.000Z');
  assert.throws(() => validateScheduleTime('2026-10-13T11:00:00Z', NOW), /already passed/);
  assert.throws(() => validateScheduleTime('2027-01-01T00:00:00Z', NOW), /within the next 60 days/);
  assert.throws(() => validateScheduleTime('tomorrow', NOW), /Pick a date/);
});

test('nextSocialStep walks Instagram through container then check, and Facebook straight to publish', () => {
  const due = '2026-10-13T11:00:00Z';
  assert.equal(nextSocialStep({ platform: 'instagram', status: 'scheduled', scheduledAt: due, containerId: null }, NOW), 'create_container');
  assert.equal(nextSocialStep({ platform: 'instagram', status: 'scheduled', scheduledAt: due, containerId: '179' }, NOW), 'check_container');
  assert.equal(nextSocialStep({ platform: 'facebook', status: 'scheduled', scheduledAt: due, containerId: null }, NOW), 'publish_facebook');
  assert.equal(nextSocialStep({ platform: 'instagram', status: 'scheduled', scheduledAt: '2026-10-13T13:00:00Z', containerId: null }, NOW), 'skip');
  assert.equal(nextSocialStep({ platform: 'instagram', status: 'draft', scheduledAt: null, containerId: null }, NOW), 'skip');
  assert.equal(nextSocialStep({ platform: 'facebook', status: 'published', scheduledAt: due, containerId: null }, NOW), 'skip');
});

test('shouldGiveUp ends on a 4xx at once and on anything else after three tries', () => {
  assert.equal(shouldGiveUp(0, 400), true);
  assert.equal(shouldGiveUp(0, 500), false);
  assert.equal(shouldGiveUp(1, 0), false);
  assert.equal(shouldGiveUp(2, 503), true);
});

test('toDashboardReel shows published posts only', () => {
  const base: SocialPost = { id: 1, platform: 'instagram', pageId: '1', videoUrl: VIDEO, caption: 'c', scheduledAt: null, status: 'published', remoteId: '9', permalink: 'https://www.instagram.com/reel/abc/', error: null, reach: 10, plays: 20, publishedAt: '2026-10-12T15:00:00.000Z', createdAt: '2026-10-12T14:00:00.000Z' };
  assert.deepEqual(toDashboardReel(base), { platform: 'instagram', caption: 'c', publishedAt: '2026-10-12T15:00:00.000Z', permalink: 'https://www.instagram.com/reel/abc/', reach: 10, plays: 20 });
  assert.equal(toDashboardReel({ ...base, status: 'failed' }), null);
});
