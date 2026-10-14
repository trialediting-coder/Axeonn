// lib/sendGate.ts
// A small limiter for outbound sends: at most `concurrency` at once, and each
// start at least `gapMs` after the previous one. lib/sequences.ts runs its
// emails through one (2 at a time, 600 ms apart: Resend's default rate limit).
// Pure; the clock and sleep are injectable for tests.

export type SendGate = <T>(fn: () => Promise<T>) => Promise<T>;

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function sendGate(concurrency: number, gapMs: number, sleep: (ms: number) => Promise<void> = realSleep, clock: () => number = Date.now): SendGate {
  const limit = Math.max(1, Math.floor(concurrency));
  let active = 0;
  let nextStart = -Infinity;
  const waiting: Array<() => void> = [];

  async function acquire(): Promise<void> {
    if (active < limit) active += 1;
    else await new Promise<void>((r) => waiting.push(r)); // the releaser hands its slot over
    const now = clock();
    const at = Math.max(now, nextStart);
    nextStart = at + gapMs;
    if (at > now) await sleep(at - now);
  }

  function release(): void {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  }

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  };
}
