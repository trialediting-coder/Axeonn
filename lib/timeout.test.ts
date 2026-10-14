import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '@/lib/timeout';

test('withTimeout returns the value when the promise is quicker', async () => {
  let timedOut = false;
  assert.equal(await withTimeout(Promise.resolve(7), 50, () => { timedOut = true; }), 7);
  assert.equal(timedOut, false);
});

test('withTimeout gives undefined and calls onTimeout when the promise is slow', async () => {
  let timedOut = false;
  const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 200));
  assert.equal(await withTimeout(slow, 10, () => { timedOut = true; }), undefined);
  assert.equal(timedOut, true);
});

test('withTimeout passes a quicker rejection through', async () => {
  await assert.rejects(withTimeout(Promise.reject(new Error('boom')), 50), /boom/);
});
