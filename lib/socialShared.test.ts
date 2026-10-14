// lib/socialShared.test.ts
// Run with: npm run test:meta
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blobPathFor, isBlobPathFor, isBlobVideoUrl, isTransientMetaCode, keepContainerOnGiveUp, matchPageVideo, nextSocialStep, parseUnclearAction, platformsForPage, PUBLISH_TIMEOUT_MS,
  publishOutcome, retryBlockedReason, runBounded, shouldGiveUp, toDashboardReel, unclearActionProblem, unclearContainerVerdict, unclearPublishNote, validateScheduleTime, validateSocialInput,
} from './socialShared';
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
  const base: SocialPost = { id: 1, platform: 'instagram', pageId: '1', videoUrl: VIDEO, caption: 'c', scheduledAt: null, status: 'published', remoteId: '9', permalink: 'https://www.instagram.com/reel/abc/', error: null, reach: 10, plays: 20, publishedAt: '2026-10-12T15:00:00.000Z', createdAt: '2026-10-12T14:00:00.000Z', publishUnclear: false };
  assert.deepEqual(toDashboardReel(base), { platform: 'instagram', caption: 'c', publishedAt: '2026-10-12T15:00:00.000Z', permalink: 'https://www.instagram.com/reel/abc/', reach: 10, plays: 20 });
  assert.equal(toDashboardReel({ ...base, status: 'failed' }), null);
});

test('a publish error is "not posted" only on a clear 4xx; timeouts, 5xx and no id are unclear', () => {
  assert.equal(publishOutcome(400), 'not_posted');
  assert.equal(publishOutcome(403), 'not_posted');
  assert.equal(publishOutcome(0), 'unclear');
  assert.equal(publishOutcome(500), 'unclear');
  assert.equal(publishOutcome(503), 'unclear');
  assert.equal(publishOutcome(200), 'unclear');
  assert.equal(unclearPublishNote('facebook'), 'This may have posted. Check the Facebook page before you retry.');
  assert.match(unclearPublishNote('instagram'), /^This may have posted\. Check the Instagram account/);
  assert.ok(PUBLISH_TIMEOUT_MS >= 30_000 && PUBLISH_TIMEOUT_MS <= 45_000);
});

test('a container is cleared on give-up only when Meta clearly refused it', () => {
  assert.equal(keepContainerOnGiveUp(400, false), false);
  assert.equal(keepContainerOnGiveUp(400, true), true);
  assert.equal(keepContainerOnGiveUp(0, false), true);
  assert.equal(keepContainerOnGiveUp(502, false), true);
  // A transient 4xx (code 2, or the rate limits 4/17/32/613) may hide a publish that went through: the container is kept.
  for (const code of [2, 4, 17, 32, 613]) {
    assert.equal(isTransientMetaCode(code), true);
    assert.equal(keepContainerOnGiveUp(400, false, code), true, `code ${code}`);
  }
  assert.equal(keepContainerOnGiveUp(400, false, 100), false);
  assert.equal(keepContainerOnGiveUp(400, false, null), false);
  assert.equal(isTransientMetaCode(null), false);
});

test('an unclear Instagram publish is settled from the container status: PUBLISHED posted, ERROR/EXPIRED safe to retry, anything else left (F1)', () => {
  assert.equal(unclearContainerVerdict('PUBLISHED'), 'posted');
  assert.equal(unclearContainerVerdict('ERROR'), 'retry_safe');
  assert.equal(unclearContainerVerdict('EXPIRED'), 'retry_safe');
  assert.equal(unclearContainerVerdict('FINISHED'), 'wait');
  assert.equal(unclearContainerVerdict('IN_PROGRESS'), 'wait');
  assert.equal(unclearContainerVerdict('SOMETHING_NEW'), 'wait');
});

test('an unclear Facebook publish matches one page video on the exact caption near the scheduled time, or nothing (F1)', () => {
  const post = { caption: 'Before and after on a 2024 F-150.', scheduledAt: '2026-10-13T12:00:00.000Z' };
  const v = (id: string, created: string, description: string | null = post.caption, title: string | null = null) => ({ id, description, title, created_time: created });
  const none = new Set<string>();
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000')], post, none), '1');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000', null, post.caption)], post, none), '1', 'the title counts too');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000', `  ${post.caption}\r\n`)], { ...post, caption: `${post.caption}\n` }, none), '1', 'whitespace at the ends is ignored');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000', 'Something else')], post, none), null);
  assert.equal(matchPageVideo([v('1', '2026-10-13T11:50:00+0000')], post, none), null, 'before the window');
  assert.equal(matchPageVideo([v('1', '2026-10-13T15:30:00+0000')], post, none), null, 'after the window');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000'), v('2', '2026-10-13T12:40:00+0000')], post, none), null, 'two matches is ambiguous');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000'), v('2', '2026-10-13T12:40:00+0000')], post, new Set(['1'])), '2', 'a video another post claims is skipped');
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000', '')], { ...post, caption: '' }, none), null, 'no caption, no match');
  assert.equal(matchPageVideo([v('1', 'not a date')], post, none), null);
  assert.equal(matchPageVideo([v('1', '2026-10-13T12:20:00+0000')], { ...post, scheduledAt: null }, none), null);
});

test('"It posted" and "Allow a retry" are only for a failed post that may have posted (F1)', () => {
  const p = { status: 'failed' as const, publishUnclear: true, remoteId: null };
  assert.equal(unclearActionProblem(p), null);
  assert.equal(unclearActionProblem({ ...p, publishUnclear: false }), 'That post is not waiting on a check.');
  assert.equal(unclearActionProblem({ ...p, status: 'scheduled' as const }), 'That post is not waiting on a check.');
  assert.equal(unclearActionProblem({ ...p, status: 'published' as const }), 'Already posted.');
  assert.equal(unclearActionProblem({ ...p, remoteId: '99' }), 'Already posted.');
  assert.equal(parseUnclearAction('posted'), 'posted');
  assert.equal(parseUnclearAction('retry'), 'retry');
  assert.equal(parseUnclearAction('delete'), null);
  assert.equal(parseUnclearAction(undefined), null);
});

test('a post that went out, or may have, can never be retried', () => {
  const p = { status: 'failed' as const, remoteId: null, publishUnclear: false, platform: 'facebook' as const };
  assert.equal(retryBlockedReason(p), null);
  assert.equal(retryBlockedReason({ ...p, remoteId: '123' }), 'Already posted.');
  assert.equal(retryBlockedReason({ ...p, status: 'published' }), 'Already posted.');
  assert.equal(retryBlockedReason({ ...p, publishUnclear: true }), 'This may have posted. Check the Facebook page before you retry.');
});

test('Instagram is dropped for a page without a linked account instead of failing the save', () => {
  assert.deepEqual(platformsForPage(['instagram', 'facebook'], { igUserId: null }), ['facebook']);
  assert.deepEqual(platformsForPage(['instagram', 'facebook'], { igUserId: '178' }), ['instagram', 'facebook']);
  assert.throws(() => platformsForPage(['instagram'], { igUserId: null }), /Choose Facebook/);
});

test('runBounded: one post that throws (a bad token) is recorded on that post and the others still run', async () => {
  const ran: string[] = [];
  const recorded: string[] = [];
  const { results, skipped } = await runBounded(['a', 'bad', 'c', 'worse', 'e'], {
    now: () => 0,
    stopAt: 1_000_000,
    perItemMs: 1,
    run: async (x) => {
      if (x === 'bad' || x === 'worse') throw new Error(`cannot open token for ${x}`);
      ran.push(x);
      return 'published';
    },
    onError: async (x, err) => {
      if (x === 'worse') throw new Error('db down too');
      recorded.push(`${x}:${(err as Error).message}`);
      return 'failed';
    },
    onSkip: async () => {},
    fallback: 'failed',
  });
  assert.deepEqual(ran, ['a', 'c', 'e']);
  assert.deepEqual(recorded, ['bad:cannot open token for bad']);
  assert.deepEqual(results, ['published', 'failed', 'published', 'failed', 'published']);
  assert.equal(skipped, 0);
});

test('runBounded starts nothing that cannot finish before the deadline and releases the rest', async () => {
  let clock = 0;
  const released: number[] = [];
  const { results, skipped } = await runBounded([1, 2, 3, 4], {
    now: () => clock,
    stopAt: 200,
    perItemMs: 75,
    run: async (n) => {
      clock += 60;
      return n;
    },
    onError: async () => -1,
    onSkip: async (n) => {
      released.push(n);
    },
    fallback: -1,
  });
  // 0+75 ok, 60+75 ok, 120+75 ok, 180+75 > 200 → stop.
  assert.deepEqual(results, [1, 2, 3]);
  assert.equal(skipped, 1);
  assert.deepEqual(released, [4]);
});
