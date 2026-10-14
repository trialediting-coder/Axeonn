// lib/sendGate.test.ts
// Run with: npm run test:sequences
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendGate } from './sendGate';

/** A fake clock: sleep advances it, so the test runs instantly. */
function fakeTime() {
  let now = 0;
  return {
    clock: () => now,
    sleep: async (ms: number) => {
      now += ms;
    },
  };
}

test('never more than `concurrency` sends at once', async () => {
  const t = fakeTime();
  const gate = sendGate(2, 0, t.sleep, t.clock);
  let active = 0;
  let peak = 0;
  const releases: Array<() => void> = [];
  const job = () =>
    gate(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((r) => releases.push(r));
      active -= 1;
    });
  const all = Promise.all([job(), job(), job(), job(), job()]);
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setImmediate(r));
    releases.shift()?.();
  }
  await all;
  assert.equal(peak, 2);
});

test('starts are at least `gapMs` apart', async () => {
  // Real timers: concurrent sleepers make a fake clock lie. Windows timers are ~15 ms coarse, hence the slack.
  const gate = sendGate(2, 100);
  const starts: number[] = [];
  await Promise.all([1, 2, 3, 4].map(() => gate(async () => void starts.push(performance.now()))));
  starts.sort((a, b) => a - b);
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 80, `gap ${starts[i] - starts[i - 1]}`);
});

test('a throwing send frees its slot and passes the error on', async () => {
  const t = fakeTime();
  const gate = sendGate(1, 0, t.sleep, t.clock);
  await assert.rejects(gate(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(await gate(async () => 'next'), 'next');
});
