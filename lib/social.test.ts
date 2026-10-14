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
