// lib/leadStages.test.ts
// Run with: npm run test:sequences. The store and the engine are fakes: no database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLeadStage, type LeadRecord, type LeadStore, type StageDeps } from './leadStages';
import type { LeadAction, LeadStage } from './sequenceShared';

function fakes(lead: LeadRecord | null, startOk = true) {
  const log: string[] = [];
  const store: LeadStore = {
    refTable: 'form_submissions',
    async find(onboardingId, id) {
      log.push(`find ${onboardingId}/${id}`);
      return lead;
    },
    async setStage(_o, id, stage: LeadStage, action: LeadAction) {
      log.push(`stage ${id} ${stage} ${action}`);
    },
  };
  const deps: StageDeps = {
    store,
    async stopRunsFor(_o, match, reason) {
      log.push(`stop ${match.phone ?? '-'} ${match.email ?? '-'} ${(match.kinds ?? []).join('+')} ${reason}`);
      return 2;
    },
    async startRun(_o, kind, contact, ref) {
      log.push(`start ${kind} ${contact.phone ?? '-'} ${ref.table}#${ref.id}`);
      return startOk ? { started: true, runId: 99 } : { started: false, reason: 'disabled' };
    },
  };
  return { log, deps };
}

const mike: LeadRecord = { name: 'Mike Smith', phone: '+15155550134', email: 'mike@example.com', stage: 'new' };

test('Job done stops the follow-ups and starts the review request for that lead', async () => {
  const { log, deps } = fakes(mike);
  const r = await applyLeadStage(4, 7, 'won', deps);
  assert.deepEqual(r, { stage: 'won', started: ['review'], stopped: 2 });
  assert.deepEqual(log, [
    'find 4/7',
    'stage 7 won won',
    'stop +15155550134 mike@example.com new_lead+quote stage:won',
    'start review +15155550134 form_submissions#7',
  ]);
});

test('Booked stops the follow-ups and starts nothing', async () => {
  const { log, deps } = fakes(mike);
  const r = await applyLeadStage(4, 7, 'booked', deps);
  assert.deepEqual(r, { stage: 'booked', started: [], stopped: 2 });
  assert.ok(!log.some((l) => l.startsWith('start')));
});

test('Quote sent ends the new-lead follow-up before the quote follow-up begins', async () => {
  const { log, deps } = fakes(mike);
  const r = await applyLeadStage(4, 7, 'quote_sent', deps);
  assert.deepEqual(r, { stage: 'contacted', started: ['quote'], stopped: 2 });
  assert.deepEqual(log.slice(2), ['stop +15155550134 mike@example.com new_lead stage:quote_sent', 'start quote +15155550134 form_submissions#7']);
});

test('a refused start (template off) is not reported as started', async () => {
  const { deps } = fakes(mike, false);
  assert.deepEqual((await applyLeadStage(4, 7, 'won', deps)).started, []);
});

test('a lead from another client, or a made-up id, changes nothing', async () => {
  const { log, deps } = fakes(null);
  await assert.rejects(() => applyLeadStage(4, 999, 'won', deps), /not in your list/);
  assert.deepEqual(log, ['find 4/999']);
});

test('the store is asked for the lead under the signed-in client, and every write carries that client', async () => {
  const calls: { find: [number, number][]; setStage: [number, number, LeadStage, LeadAction][]; stop: number[]; start: number[] } = {
    find: [],
    setStage: [],
    stop: [],
    start: [],
  };
  const store: LeadStore = {
    refTable: 'form_submissions',
    async find(onboardingId, id) {
      calls.find.push([onboardingId, id]);
      return mike;
    },
    async setStage(onboardingId, id, stage, action) {
      calls.setStage.push([onboardingId, id, stage, action]);
    },
  };
  const deps: StageDeps = {
    store,
    async stopRunsFor(onboardingId) {
      calls.stop.push(onboardingId);
      return 0;
    },
    async startRun(onboardingId) {
      calls.start.push(onboardingId);
      return { started: true, runId: 1 };
    },
  };
  const r = await applyLeadStage(12, 345, 'lost', deps);
  assert.deepEqual(calls.find, [[12, 345]]);
  assert.deepEqual(calls.setStage, [[12, 345, 'lost', 'lost']]);
  assert.deepEqual(calls.stop, [12]);
  assert.deepEqual(calls.start, []);
  assert.deepEqual(r, { stage: 'lost', started: [], stopped: 0 });

  await applyLeadStage(12, 345, 'won', deps);
  assert.deepEqual(calls.setStage[1], [12, 345, 'won', 'won']);
  assert.deepEqual(calls.start, [12]);
});
