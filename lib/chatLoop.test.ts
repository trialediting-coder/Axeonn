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

test('runToolLoop gives up after maxRounds with no text', async () => {
  const toolTurn: ModelReply = { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't', name: 'offer_booking', input: {} }] };
  const { create } = fakeModel([toolTurn, toolTurn, toolTurn]);
  const out = await runToolLoop({ create, model: 'm', system: 's', tools: CHAT_TOOLS, messages: start, execute: async () => ({}), maxRounds: 2 });
  assert.equal(out.text, '');
  assert.equal(out.calls.length, 2);
});
