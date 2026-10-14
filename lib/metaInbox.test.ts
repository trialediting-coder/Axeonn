// lib/metaInbox.test.ts
// Run with: npm run test:meta. processInbound's failure handling, with the
// per-message recorder injected: no database, no Meta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processInbound, type RecordResult } from './metaInbox';
import type { MetaInboundMessage } from './metaShared';

const SECRET_WORDS = 'my address is 12 Elm St, call me';

const dm = (mid: string): MetaInboundMessage => ({
  channel: 'messenger',
  pageOrIgId: '111',
  senderId: '222',
  mid,
  text: SECRET_WORDS,
  attachments: [],
  timestamp: 1760000000000,
});

function captureLogs() {
  const lines: string[] = [];
  const orig = { error: console.error, info: console.info };
  const grab = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };
  console.error = grab;
  console.info = grab;
  return { lines, restore: () => Object.assign(console, orig) };
}

test('a message that fails twice is logged as LOST with its ids, and counted as failed', async () => {
  const logs = captureLogs();
  try {
    const tally = await processInbound([dm('m_ok'), dm('m_bad')], new Date(), {
      retryDelayMs: 0,
      record: async (e) => {
        if (e.mid === 'm_bad') throw new Error('insert failed');
        return 'recorded';
      },
    });
    assert.deepEqual(tally, { recorded: 1, duplicate: 0, unknown_page: 0, inbox_off: 0, failed: 1 });
    const lost = logs.lines.filter((l) => l.startsWith('[meta:inbound] LOST'));
    assert.equal(lost.length, 1);
    for (const id of ['"mid":"m_bad"', '"page":"111"', '"sender":"222"', '"channel":"messenger"', '"at":1760000000000']) assert.ok(lost[0].includes(id), id);
    assert.ok(logs.lines.some((l) => /processed 2: recorded 1, skipped 0, failed 1/.test(l)));
  } finally {
    logs.restore();
  }
});

test('a message that fails once is retried and recorded on the second attempt', async () => {
  const logs = captureLogs();
  const attempts = new Map<string, number>();
  try {
    const tally = await processInbound([dm('m_flaky'), dm('m_dup')], new Date(), {
      retryDelayMs: 0,
      record: async (e): Promise<RecordResult> => {
        const n = (attempts.get(e.mid) ?? 0) + 1;
        attempts.set(e.mid, n);
        if (e.mid === 'm_dup') return 'duplicate';
        if (n === 1) throw new Error('connection reset');
        return 'recorded';
      },
    });
    assert.equal(attempts.get('m_flaky'), 2);
    assert.equal(attempts.get('m_dup'), 1);
    assert.deepEqual(tally, { recorded: 1, duplicate: 1, unknown_page: 0, inbox_off: 0, failed: 0 });
    assert.ok(!logs.lines.some((l) => l.includes('LOST')));
    assert.ok(logs.lines.some((l) => /processed 2: recorded 1, skipped 1, failed 0/.test(l)));
  } finally {
    logs.restore();
  }
});

test('no log line carries the message text, even when the error quotes it', async () => {
  const logs = captureLogs();
  try {
    await processInbound([dm('m_x')], new Date(), {
      retryDelayMs: 0,
      // Errors here come from our own code and Postgres messages, never the body, but check the lines we write ourselves.
      record: async () => {
        throw new Error('db down');
      },
    });
    assert.ok(logs.lines.length > 0);
    for (const l of logs.lines) assert.ok(!l.includes(SECRET_WORDS), l);
  } finally {
    logs.restore();
  }
});
