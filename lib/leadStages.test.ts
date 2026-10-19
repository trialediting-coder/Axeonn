// lib/leadStages.test.ts
// Run with: npm run test:sequences. The store and the engine are fakes: no database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLeadStage, LeadNotFoundError, makeContactStore, makeFormContactStore, STAGE_ENGINE_WARNING, type LeadRecord, type LeadStore, type StageDeps } from './leadStages';
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
    async notifyStartFailed(_o, input) {
      log.push(`notify ${input.leadId} ${input.action}`);
    },
  };
  return { log, deps };
}

const mike: LeadRecord = { name: 'Mike Smith', phone: '+15155550134', email: 'mike@example.com', stage: 'new', quoteSentAt: null };

test('Completed stops the follow-ups and starts the review request for that lead', async () => {
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
  assert.deepEqual(log.slice(2), ['stop +15155550134 mike@example.com new_lead+review stage:quote_sent', 'start quote +15155550134 form_submissions#7']);
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
    async notifyStartFailed() {},
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

/** A store that remembers the stage and quote time between taps, like the real table. */
function statefulFakes(opts: { stopThrows?: boolean; startThrows?: boolean } = {}) {
  const row: LeadRecord = { ...mike };
  const starts: string[] = [];
  const saved: string[] = [];
  const notified: { onboardingId: number; leadId: number; action: LeadAction; error: string }[] = [];
  const deps: StageDeps = {
    store: {
      refTable: 'form_submissions',
      async find() {
        return { ...row };
      },
      async setStage(_o, _id, stage, action) {
        row.stage = stage;
        if (action === 'quote_sent' && !row.quoteSentAt) row.quoteSentAt = '2026-10-13T15:00:00.000Z';
        saved.push(stage);
      },
    },
    async stopRunsFor() {
      if (opts.stopThrows) throw new Error('relation "sequence_runs" does not exist');
      return 1;
    },
    async startRun(_o, kind) {
      if (opts.startThrows) throw new Error('connection terminated unexpectedly');
      starts.push(kind);
      return { started: true, runId: starts.length };
    },
    async notifyStartFailed(onboardingId, input) {
      notified.push({ onboardingId, ...input });
    },
  };
  return { deps, starts, saved, notified };
}

test('won twice starts review once', async () => {
  const { deps, starts } = statefulFakes();
  assert.deepEqual((await applyLeadStage(4, 7, 'won', deps)).started, ['review']);
  const second = await applyLeadStage(4, 7, 'won', deps);
  assert.deepEqual(second.started, []);
  assert.equal(second.stage, 'won');
  assert.deepEqual(starts, ['review']);
});

test('quote_sent twice starts quote once', async () => {
  const { deps, starts } = statefulFakes();
  assert.deepEqual((await applyLeadStage(4, 7, 'quote_sent', deps)).started, ['quote']);
  assert.deepEqual((await applyLeadStage(4, 7, 'quote_sent', deps)).started, []);
  assert.deepEqual(starts, ['quote']);
});

test('quote_sent on a lead already contacted still starts the quote follow-up the first time', async () => {
  const { deps, starts } = statefulFakes();
  await applyLeadStage(4, 7, 'contacted', deps);
  assert.deepEqual((await applyLeadStage(4, 7, 'quote_sent', deps)).started, ['quote']);
  assert.deepEqual(starts, ['quote']);
});

test('engine throw returns a warning, tells Axeon, and the stage is still saved', async () => {
  assert.equal(STAGE_ENGINE_WARNING, "Saved. The automatic follow-up didn't start; Axeon has been told.");
  for (const o of [{ stopThrows: true }, { startThrows: true }]) {
    const { deps, saved, notified } = statefulFakes(o);
    const r = await applyLeadStage(4, 7, 'won', deps);
    assert.equal(r.stage, 'won');
    assert.deepEqual(r.started, []);
    assert.equal(r.warning, STAGE_ENGINE_WARNING);
    assert.ok(!JSON.stringify(r).includes('relation') && !JSON.stringify(r).includes('connection'));
    assert.deepEqual(saved, ['won']);
    assert.equal(notified.length, 1);
    assert.deepEqual({ ...notified[0], error: undefined }, { onboardingId: 4, leadId: 7, action: 'won', error: undefined });
  }
});

test('a successful tap carries no warning and tells no one', async () => {
  const { deps, notified } = statefulFakes();
  assert.equal((await applyLeadStage(4, 7, 'booked', deps)).warning, undefined);
  assert.deepEqual(notified, []);
});

// ───────────── Slice 4: the contacts-backed stores (fake contacts module) ─────────────


function contactFakes(contactIdFor: number | null) {
  const log: string[] = [];
  const base: LeadStore = {
    refTable: 'form_submissions',
    async find(onboardingId, id) {
      log.push(`form find ${onboardingId}/${id}`);
      return mike;
    },
    async setStage(onboardingId, id, stage, action) {
      log.push(`form stage ${onboardingId}/${id} ${stage} ${action}`);
    },
  };
  const contacts = {
    async contactIdForRef(onboardingId: number, refTable: string, refId: number) {
      log.push(`ref ${onboardingId} ${refTable}#${refId}`);
      return contactIdFor;
    },
    async writeContactStage(onboardingId: number, contactId: number, stage: LeadStage, action: LeadAction) {
      log.push(`contact stage ${onboardingId}/${contactId} ${stage} ${action}`);
    },
    async getContact(onboardingId: number, contactId: number) {
      log.push(`contact find ${onboardingId}/${contactId}`);
      return contactId === 77 ? { name: 'Sarah', phone: '+15155550199', email: 'sarah@example.com', stage: 'contacted' as LeadStage, quoteSentAt: null } : null;
    },
  };
  return { log, base, contacts };
}

test('a form tap stages the form exactly as slice 3, then the contact it was projected onto', async () => {
  const { log, base, contacts } = contactFakes(12);
  const store = makeFormContactStore(base, contacts);
  assert.equal(store.refTable, 'form_submissions');
  assert.deepEqual(await store.find(3, 5), mike);
  await store.setStage(3, 5, 'won', 'won');
  assert.deepEqual(log, ['form find 3/5', 'form stage 3/5 won won', 'ref 3 form_submissions#5', 'contact stage 3/12 won won']);
});

test('a form not yet projected onto a contact is staged exactly as in slice 3', async () => {
  const { log, base, contacts } = contactFakes(null);
  await makeFormContactStore(base, contacts).setStage(3, 5, 'contacted', 'quote_sent');
  assert.deepEqual(log, ['form stage 3/5 contacted quote_sent', 'ref 3 form_submissions#5']);
});

test('an inbox contact tap runs through applyLeadStage, and its runs carry ref_table contacts', async () => {
  const { log: clog, contacts } = contactFakes(null);
  const { log, deps } = fakes(null);
  const store = makeContactStore(contacts);
  assert.equal(store.refTable, 'contacts');
  const res = await applyLeadStage(3, 77, 'won', { ...deps, store });
  assert.equal(res.stage, 'won');
  assert.deepEqual(clog, ['contact find 3/77', 'contact stage 3/77 won won']);
  assert.ok(log.some((l) => l.startsWith('start review +15155550199 contacts#77')), log.join('\n'));
});

test('another client\'s contact id is not found and nothing is written', async () => {
  const { log: clog, contacts } = contactFakes(null);
  const { deps } = fakes(null);
  await assert.rejects(() => applyLeadStage(3, 999, 'won', { ...deps, store: makeContactStore(contacts) }), LeadNotFoundError);
  assert.deepEqual(clog, ['contact find 3/999']);
});
