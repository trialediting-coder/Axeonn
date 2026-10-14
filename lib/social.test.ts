// lib/social.test.ts
// Run with: npm run test:meta. The tier gate only; the cron's SQL is not unit-tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertGrowth } from './social';

test('reels posting is AxeonGROWTH only', () => {
  assert.throws(() => assertGrowth({ tier: 'essentials' }), /AxeonGROWTH/);
  assert.throws(() => assertGrowth({ tier: 'axeoncore' }), /AxeonGROWTH/);
  assert.doesNotThrow(() => assertGrowth({ tier: 'axeongrowth' }));
});

test('publish calls take a per-call timeout and a timeout reads as unclear, never "not posted"', async () => {
  const { publishPageVideo, publishContainer } = await import('./meta');
  const { publishOutcome } = await import('./socialShared');
  const hang = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  const started = Date.now();
  await assert.rejects(publishPageVideo({ pageId: '1', pageToken: 't', videoUrl: 'https://x/v.mp4', description: '', timeoutMs: 20 }, hang), (err: { status?: number }) => {
    assert.equal(publishOutcome(err.status ?? 0), 'unclear');
    return true;
  });
  await assert.rejects(publishContainer({ igUserId: '1', pageToken: 't', containerId: 'c', timeoutMs: 20 }, hang), (err: { status?: number }) => publishOutcome(err.status ?? 0) === 'unclear');
  assert.ok(Date.now() - started < 5_000, 'the override replaced the default timeout');
});
