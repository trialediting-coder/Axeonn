// lib/chatLoop.test.ts
// Run with: npm run test:chat   (the model is a fake; nothing leaves the machine)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runToolLoop, type CreateMessage, type ModelReply } from './chatLoop';
import { CHAT_TOOLS, type ApiMessage } from './chatShared';

function fakeModel(replies: ModelReply[]) {
  const seen: ApiMessage[][] = [];
  const create: CreateMessage = async (req) => {
    seen.push(structuredClone(req.messages));
    const next = replies.shift();
    if (!next) throw new Error('no more replies');
    return next;
  };
  return { create, seen };
}

const start: ApiMessage[] = [{ role: 'user', content: 'Can I book Tuesday?' }];

test('runToolLoop runs a tool, feeds the result back, and returns the final text', async () => {
  const { create, seen } = fakeModel([
    { stop_reason: 'tool_use', content: [{ type: 'text', text: 'Let me look.' }, { type: 'tool_use', id: 't1', name: 'offer_booking', input: {} }] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'I have Tue at 2:00 PM.' }] },
  ]);
  const out = await runToolLoop({ create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start, execute: async (name) => ({ available: true, name }) });
  assert.equal(out.text, 'I have Tue at 2:00 PM.');
  assert.deepEqual(out.calls, [{ name: 'offer_booking', input: {}, result: { available: true, name: 'offer_booking' }, isError: false }]);
  assert.equal(seen[1].length, 3);
  assert.equal(seen[1][1].role, 'assistant');
  assert.deepEqual((seen[1][2].content as Array<Record<string, unknown>>)[0], {
    type: 'tool_result',
    tool_use_id: 't1',
    content: JSON.stringify({ available: true, name: 'offer_booking' }),
  });
  assert.equal(start.length, 1); // the caller's array is not mutated
});

test('a tool that throws becomes an error result the model sees, not a crash', async () => {
  const { create, seen } = fakeModel([
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'book_slot', input: { starts_at: 'x' } }] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Sorry, that did not work.' }] },
  ]);
  const out = await runToolLoop({
    create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start,
    execute: async () => {
      throw new Error('database down');
    },
  });
  assert.equal(out.calls[0].isError, true);
  const result = (seen[1][2].content as Array<Record<string, unknown>>)[0];
  assert.equal(result.is_error, true);
  assert.ok(!String(result.content).includes('database down'));
});

test('runToolLoop stops running tools after maxRounds; a closing call that still asks for tools gives no text', async () => {
  const toolTurn: ModelReply = { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't', name: 'offer_booking', input: {} }] };
  const { create } = fakeModel([toolTurn, toolTurn, toolTurn]);
  const out = await runToolLoop({ create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start, execute: async () => ({}), maxRounds: 2 });
  assert.equal(out.text, '');
  assert.equal(out.calls.length, 2);
});

test('when every round asks for tools, a closing call with tools off reports what happened', async () => {
  const reqs: Array<{ tool_choice?: unknown; last: ApiMessage }> = [];
  const replies: ModelReply[] = [
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'offer_booking', input: {} }] },
    { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't2', name: 'book_slot', input: { starts_at: 'x' } }] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: "You're booked for Tue, Oct 13 at 2:00 PM." }] },
  ];
  const create: CreateMessage = async (req) => {
    reqs.push({ tool_choice: req.tool_choice, last: structuredClone(req.messages[req.messages.length - 1]) });
    return replies.shift() as ModelReply;
  };
  const out = await runToolLoop({
    create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start, maxRounds: 2,
    execute: async (name) => (name === 'book_slot' ? { ok: true, when: 'Tue, Oct 13 at 2:00 PM' } : { available: true }),
  });
  assert.equal(out.text, "You're booked for Tue, Oct 13 at 2:00 PM.");
  assert.equal(out.calls.length, 2);
  assert.equal(reqs.length, 3);
  assert.equal(reqs[0].tool_choice, undefined);
  assert.deepEqual(reqs[2].tool_choice, { type: 'none' });
  // The closing call sees the book_slot result.
  assert.equal((reqs[2].last.content as Array<Record<string, unknown>>)[0].tool_use_id, 't2');
});

test('a closing call that throws still returns the calls that ran', async () => {
  let n = 0;
  const create: CreateMessage = async () => {
    n += 1;
    if (n > 1) throw new Error('overloaded');
    return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'book_slot', input: {} }] };
  };
  const out = await runToolLoop({ create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start, maxRounds: 1, execute: async () => ({ ok: true, when: 'Tue' }) });
  assert.equal(out.text, '');
  assert.equal(out.calls.length, 1);
  assert.equal(out.calls[0].isError, false);
});
