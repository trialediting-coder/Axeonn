import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canGoLive,
  dateOfDay,
  deriveMilestones,
  fillDbrText,
  monthlySummaryDue,
  napProgress,
  NAP_DIRECTORIES,
  pageGate,
  pipelineTotals,
  programDay,
  scheduleStatus,
  stagingState,
  textSimilarity,
  validateDbrSteps,
  DEFAULT_DBR_STEPS,
  dbrStartBlock,
  defaultDbrSteps,
  frontDeskRoutine,
  valueFor,
  weeklySummaryDue,
  type MilestoneFacts,
} from './proofV2Shared';
import { ALL_STEPS, DELIVERY_SCHEDULE } from '../data/deliverySchedule';

const START = '2026-10-01';
const facts = (over: Partial<MilestoneFacts> = {}): MilestoneFacts => ({
  startAt: START,
  settings: {},
  autoDone: {},
  line: null,
  mcat: { missed: 0, textedBack: 0, under30: 0, medianSeconds: null },
  dbr: { imported: 0, status: 'none', sent: 0, booked: 0, pipelineDollars: null },
  reviewEngine: { enabled: false, sent: 0, newReviews: null },
  nap: { synced: 0, total: 40 },
  pages: { planned: 0, published: 0, indexed: 0 },
  openPins: 0,
  ...over,
});
const at = (iso: string) => new Date(`${iso}T15:00:00Z`);
const phase = (m: ReturnType<typeof deriveMilestones>, key: string) => m.find((x) => x.key === key)!;

test('the schedule file is the single source: six phases, unique step keys, days inside each phase', () => {
  assert.equal(DELIVERY_SCHEDULE.length, 6);
  assert.equal(new Set(ALL_STEPS.map((s) => s.key)).size, ALL_STEPS.length);
  for (const p of DELIVERY_SCHEDULE) for (const s of p.steps) assert.ok(s.day >= p.from && s.day <= p.to, `${s.key} day ${s.day} outside ${p.key}`);
});

test('program day and planned dates count from the start date', () => {
  assert.equal(programDay(START, at('2026-10-01')), 1);
  assert.equal(programDay(START, at('2026-10-15')), 15);
  assert.equal(dateOfDay(START, 14), '2026-10-14');
});

test('day 1: every phase has its dates, phase 1 is current, later phases are scheduled', () => {
  const m = deriveMilestones(facts(), at('2026-10-01'));
  assert.equal(m.length, 6);
  assert.equal(phase(m, 'p1').status, 'in_progress');
  assert.ok(phase(m, 'p1').current);
  assert.equal(phase(m, 'p2').status, 'scheduled');
  assert.equal(phase(m, 'p2').metric, 'Starts Oct 4');
  assert.equal(phase(m, 'p6').status, 'scheduled');
  assert.equal(phase(m, 'p6').steps.at(-1)!.date, '2027-03-29');
  assert.ok(m.every((x) => x.steps.every((s) => s.state !== 'done')));
});

test('Axeon work marked done early is shown to the client on its scheduled date', () => {
  const settings = { steps: { 'p2-qa': { doneAt: '2026-10-05T10:00:00Z' } } };
  const before = deriveMilestones(facts({ settings }), at('2026-10-08'));
  const qa = phase(before, 'p2').steps.find((s) => s.key === 'p2-qa')!;
  assert.equal(qa.state, 'upcoming');
  assert.equal(qa.doneDate, null);
  assert.equal(qa.actualDoneAt, '2026-10-05T10:00:00Z');
  const after = deriveMilestones(facts({ settings }), at('2026-10-10'));
  assert.equal(phase(after, 'p2').steps.find((s) => s.key === 'p2-qa')!.doneDate, '2026-10-10');
});

test('a client approval or live event shows the day it happens', () => {
  const m = deriveMilestones(facts({ settings: { reviews: { wireframe: { sharedAt: '2026-10-03T12:00:00Z', approvedAt: '2026-10-04T12:00:00Z' } } }, autoDone: { wireframe_approved: '2026-10-04T12:00:00Z' } }), at('2026-10-04'));
  const step = phase(m, 'p2').steps.find((s) => s.key === 'p2-wireframe')!;
  assert.equal(step.state, 'done');
  assert.equal(step.doneDate, '2026-10-04');
});

test('the admin can move the start date or one step, and the dates follow', () => {
  const moved = deriveMilestones(facts({ startAt: '2026-10-11' }), at('2026-10-11'));
  assert.equal(phase(moved, 'p2').from, '2026-10-14');
  const one = deriveMilestones(facts({ settings: { steps: { 'p1-a2p-approved': { date: '2026-10-09', note: 'Carrier review' } } } }), at('2026-10-02'));
  const st = phase(one, 'p1').steps.find((s) => s.key === 'p1-a2p-approved')!;
  assert.equal(st.date, '2026-10-09');
  assert.ok(st.shifted);
  assert.equal(st.note, 'Carrier review');
  assert.equal(phase(one, 'p1').to, '2026-10-09');
});

test('phase 1 completes from the real line state and reports the 30-second auto-text', () => {
  const autoDone = { line_provisioned: '2026-10-01T10:00:00Z', a2p_filed: '2026-10-01T11:00:00Z', a2p_approved: '2026-10-03T10:00:00Z', text_back_live: '2026-10-03T10:00:00Z' };
  const m = deriveMilestones(
    facts({ autoDone, line: { number: '+15155550100', smsReady: true, textBackOn: true }, mcat: { missed: 5, textedBack: 4, under30: 4, medianSeconds: 9 } }),
    at('2026-10-05')
  );
  assert.equal(phase(m, 'p1').status, 'completed');
  assert.equal(phase(m, 'p1').metric, '4/4 missed calls auto-texted in under 30s');
  assert.ok(phase(m, 'p2').current);
});

test('a phase past its window with nothing done is pending, and an admin override wins', () => {
  const m = deriveMilestones(facts(), at('2026-11-20'));
  assert.equal(phase(m, 'p3').status, 'pending');
  const o = deriveMilestones(facts({ settings: { phases: { p3: { status: 'in_progress', note: 'List coming Friday' } } } }), at('2026-11-20'));
  assert.equal(phase(o, 'p3').status, 'in_progress');
  assert.equal(phase(o, 'p3').note, 'List coming Friday');
  assert.ok(phase(o, 'p3').overridden);
});

test('phase 3 metric: booked count, with a dollar figure only when a value exists', () => {
  const live = { goLiveAt: '2026-10-14' };
  const counted = deriveMilestones(facts({ settings: live, dbr: { imported: 320, status: 'running', sent: 410, booked: 7, pipelineDollars: null } }), at('2026-10-20'));
  assert.equal(phase(counted, 'p3').metric, '7 booked');
  const valued = deriveMilestones(facts({ settings: live, dbr: { imported: 320, status: 'done', sent: 900, booked: 7, pipelineDollars: 2450 } }), at('2026-10-30'));
  assert.equal(phase(valued, 'p3').metric, '7 booked · $2,450 pipeline (est.)');
});

test('phase 5 shows N/total indexed; phase 6 shows the booked review date', () => {
  const m = deriveMilestones(facts({ pages: { planned: 40, published: 30, indexed: 24 }, settings: { sabr: { scheduledAt: '2027-03-25' } } }), at('2027-01-15'));
  assert.equal(phase(m, 'p5').metric, '24/40 pages indexed · 30 published');
  assert.equal(phase(m, 'p6').metric, 'Review on Mar 25');
});

test('staging: 48-hour window, early approval, change requests hold go-live', () => {
  const readyAt = '2026-10-11T15:00:00Z';
  assert.equal(stagingState(undefined).phase, 'not_ready');
  assert.equal(stagingState({ readyAt }, new Date('2026-10-12T15:00:00Z')).phase, 'in_review');
  assert.equal(stagingState({ readyAt }, new Date('2026-10-12T15:00:00Z')).endsAt, '2026-10-13T15:00:00.000Z');
  assert.equal(stagingState({ readyAt }, new Date('2026-10-13T15:00:01Z')).phase, 'window_closed');
  assert.equal(stagingState({ readyAt, approvedAt: '2026-10-11T20:00:00Z' }).phase, 'approved');
  assert.equal(stagingState({ readyAt, changesRequestedAt: '2026-10-12T09:00:00Z' }, new Date('2026-10-20T00:00:00Z')).phase, 'changes_requested');
  // A change request from before staging was marked ready again does not count.
  assert.equal(stagingState({ readyAt, changesRequestedAt: '2026-10-10T09:00:00Z' }, new Date('2026-10-12T00:00:00Z')).phase, 'in_review');

  const now = new Date('2026-10-12T15:00:00Z');
  assert.equal(canGoLive({}, now).ok, false);
  assert.equal(canGoLive({ staging: { readyAt } }, now).ok, false);
  assert.equal(canGoLive({ staging: { readyAt, approvedAt: '2026-10-12T10:00:00Z' } }, now).ok, false, 'DNS first');
  assert.equal(canGoLive({ staging: { readyAt, approvedAt: '2026-10-12T10:00:00Z' }, dnsCutoverAt: '2026-10-12T12:00:00Z' }, now).ok, true);
  assert.equal(canGoLive({ staging: { readyAt }, dnsCutoverAt: 'x' }, new Date('2026-10-14T00:00:00Z')).ok, true, 'window ran out');
});

test('citations: 40 directories, n/a leaves the total', () => {
  assert.equal(NAP_DIRECTORIES.length, 40);
  assert.deepEqual(napProgress(undefined), { synced: 0, submitted: 0, total: 40 });
  assert.deepEqual(napProgress({ google: 'synced', yelp: 'submitted', avvo: 'na', justia: 'na' }), { synced: 1, submitted: 1, total: 38 });
});

const filler = (seed: string, n: number) => Array.from({ length: n }, (_, i) => `${seed}${i}`).join(' ');

test('page gate: own intro and body required, near-copies blocked', () => {
  const base = { id: 1, title: 'Implants in Ankeny', intro: filler('ankeny', 45), body: filler('implant', 160) };
  assert.equal(pageGate(base, []).ok, true);
  const short = pageGate({ ...base, intro: 'Too short.' }, []);
  assert.equal(short.ok, false);
  assert.match(short.problems[0], /Intro has 2 words/);
  const copy = { id: 2, title: 'Implants in Altoona', intro: base.intro.replace(/ankeny/g, 'altoona'), body: base.body };
  const gated = pageGate(copy, [base]);
  assert.equal(gated.ok, false);
  assert.equal(gated.closest, 'Implants in Ankeny');
  assert.ok(textSimilarity('a b c d e f', 'a b c d e f') === 1);
  assert.ok(textSimilarity('one two three four', 'five six seven eight') === 0);
});

test('DBR: exactly three texts within 7 days, STOP line on the first, names filled', () => {
  assert.equal(validateDbrSteps(DEFAULT_DBR_STEPS).length, 3);
  assert.throws(() => validateDbrSteps(DEFAULT_DBR_STEPS.slice(0, 2)));
  assert.throws(() => validateDbrSteps([{ day: 0, body: 'x'.repeat(30) }, { day: 0, body: 'y'.repeat(30) }, { day: 9, body: 'z'.repeat(30) }]));
  const s = validateDbrSteps([{ day: 0, body: 'Hi {name}, it is {business}, checking in.' }, { day: 3, body: 'Second note from {business} here.' }, { day: 7, body: 'Last note from {business} here.' }]);
  assert.match(s[0].body, /Reply STOP to opt out\.$/);
  assert.equal(fillDbrText('Hi {name}, it is {business}.', { name: 'Dana Smith', business: 'Hintz Family Dentistry' }), 'Hi Dana, it is Hintz Family Dentistry.');
  assert.equal(fillDbrText('Hi {name}, it is {business}.', { name: null, business: 'X' }), 'Hi, it is X.');
});

test('monthly summary: the 1st from 8 AM in the client time zone, once per month', () => {
  const tz = 'America/Chicago';
  // 2026-11-01 14:00Z = 8:00 AM CST (DST ended at 2 AM that morning).
  assert.equal(monthlySummaryDue(new Date('2026-11-01T14:00:00Z'), tz, undefined), '2026-10');
  assert.equal(monthlySummaryDue(new Date('2026-11-01T13:00:00Z'), tz, undefined), null, '7 AM local');
  assert.equal(monthlySummaryDue(new Date('2026-11-01T15:00:00Z'), tz, '2026-10'), null, 'already sent');
  assert.equal(monthlySummaryDue(new Date('2026-11-02T14:00:00Z'), tz, undefined), null, 'only the 1st');
  assert.equal(monthlySummaryDue(new Date('2027-01-01T14:00:00Z'), tz, undefined), '2026-12');
  assert.equal(weeklySummaryDue(new Date('2026-10-19T13:00:00Z'), tz, undefined), '2026-10-19');
  assert.equal(weeklySummaryDue(new Date('2026-10-19T13:00:00Z'), tz, '2026-10-19'), null);
  assert.equal(weeklySummaryDue(new Date('2026-10-20T13:00:00Z'), tz, undefined), null);
});

test('pipeline: entered value beats the average; no value means counts only', () => {
  assert.deepEqual(valueFor('contact:1', { 'contact:1': 900 }, 300), { value: 900, basis: 'entered' });
  assert.deepEqual(valueFor('contact:2', {}, 300), { value: 300, basis: 'average' });
  assert.deepEqual(valueFor('contact:2', {}, null), { value: null, basis: null });
  const t = pipelineTotals([
    { key: 'a', source: 'dbr', label: '', at: '', value: 300, valueBasis: 'average' },
    { key: 'b', source: 'dbr', label: '', at: '', value: 900, valueBasis: 'entered' },
    { key: 'c', source: 'web', label: '', at: '', value: null, valueBasis: null },
  ]);
  assert.deepEqual(t, { dbr: 2, web: 1, dbrDollars: 1200, webDollars: null, anyValue: true });
});

test('schedule status: on track only when nothing is late, and a late step is put down to who it waits on', () => {
  const day1 = scheduleStatus(deriveMilestones(facts(), at('2026-10-01')));
  assert.deepEqual([day1.n, day1.title, day1.tone], [1, 'Phone infrastructure', 'on_track']);
  assert.deepEqual(day1.next, { title: 'Tracked phone number set up', date: '2026-10-01' });

  // Phase 1 done on time, layout shared but not approved past its date: waiting on the client.
  const autoDone = { line_provisioned: '2026-10-01T10:00:00Z', a2p_filed: '2026-10-02T10:00:00Z', a2p_approved: '2026-10-03T10:00:00Z', text_back_live: '2026-10-03T10:00:00Z' };
  const line = { number: '+15155550100', smsReady: true, textBackOn: true };
  const client = scheduleStatus(deriveMilestones(facts({ autoDone, line }), at('2026-10-07')));
  assert.deepEqual([client.n, client.tone], [2, 'waiting_client']);

  // Carrier approval late, nothing else: waiting on the carriers.
  const carrier = scheduleStatus(deriveMilestones(facts({ autoDone: { line_provisioned: '2026-10-01T10:00:00Z', a2p_filed: '2026-10-02T10:00:00Z' } }), at('2026-10-03T23:00:00Z'.slice(0, 10))));
  assert.equal(carrier.tone, 'on_track'); // due today, not late yet
  const carrierLate = scheduleStatus(deriveMilestones(facts({ autoDone: { line_provisioned: '2026-10-01T10:00:00Z', a2p_filed: '2026-10-02T10:00:00Z', text_back_live: '2026-10-03T10:00:00Z' } }), at('2026-10-04')));
  assert.equal(carrierLate.tone, 'waiting_carrier');

  // Axeon's own step late (the number itself): behind, never "on track".
  const behind = scheduleStatus(deriveMilestones(facts(), at('2026-10-03')));
  assert.equal(behind.tone, 'behind');
});

test('law: every win-back text carries the attorney-advertising line', () => {
  const plain = [{ day: 0, body: 'Hi {name}, it is {business}, checking in.' }, { day: 3, body: 'Second note from {business} here.' }, { day: 7, body: 'Last note from {business} here.' }];
  const law = validateDbrSteps(plain, 'law');
  for (const s of law) assert.match(s.body, /Attorney advertising\./);
  assert.match(law[0].body, /Reply STOP to opt out\. Attorney advertising\.$/);
  for (const s of validateDbrSteps(plain, 'dental')) assert.doesNotMatch(s.body, /Attorney advertising/);
  // Already there: not added twice.
  assert.equal(validateDbrSteps(defaultDbrSteps('law'), 'law').map((s) => s.body.match(/Attorney advertising/g)!.length).join(), '1,1,1');
  assert.throws(() => validateDbrSteps([{ day: 0, body: 'x'.repeat(300) + ' Reply STOP' }, ...plain.slice(1)], 'law'), /leave room/);
});

test('law: the sprint waits for the firm to review these exact texts', () => {
  const steps = validateDbrSteps(defaultDbrSteps('law'), 'law');
  assert.match(dbrStartBlock('law', steps, undefined)!, /reviews its own win-back texts/);
  const review = { reviewedAt: '2026-10-19T10:00:00Z', reviewedBy: 'J. Partner', steps };
  assert.equal(dbrStartBlock('law', steps, review), null);
  const edited = steps.map((s, i) => (i === 1 ? { ...s, body: s.body.replace('checking in', 'saying hello') } : s));
  assert.match(dbrStartBlock('law', edited, review)!, /changed after the firm reviewed/);
  // Other kinds of practice never need it.
  for (const i of ['dental', 'med_spa', 'accounting', 'other', null] as const) assert.equal(dbrStartBlock(i, steps, undefined), null);
});

test('default win-back texts per industry: three, valid, no health, case or money details', () => {
  for (const i of ['dental', 'med_spa', 'law', 'accounting', 'other', null] as const) {
    const s = validateDbrSteps(defaultDbrSteps(i), i);
    assert.equal(s.length, 3);
    for (const x of s) assert.doesNotMatch(x.body, /treatment plan|diagnos|case number|balance|refund/i);
  }
});

test('the schedule and the routine are worded for the client', () => {
  const dental = deriveMilestones(facts({ industry: 'dental' }), new Date('2026-10-02T12:00:00Z'));
  const law = deriveMilestones(facts({ industry: 'law' }), new Date('2026-10-02T12:00:00Z'));
  const neutral = deriveMilestones(facts(), new Date('2026-10-02T12:00:00Z'));
  const step = (ms: typeof dental, key: string) => ms.flatMap((m) => m.steps).find((x) => x.key === key)!;
  assert.equal(step(dental, 'p3-import').title, 'Past-patient list imported');
  assert.equal(step(law, 'p3-import').title, 'Past-client list imported');
  assert.equal(step(neutral, 'p3-import').title, 'Past-customer list imported');
  assert.match(step(law, 'p1-number').client, /front office/);
  assert.match(law.find((m) => m.key === 'p5')!.summary, /practice areas/);
  for (const m of [...dental, ...law, ...neutral]) for (const t of [m.summary, m.metric, ...m.steps.flatMap((x) => [x.title, x.client])]) assert.doesNotMatch(t, /\{[A-Za-z]+\}/, t);
  assert.match(frontDeskRoutine('law').find((r) => r.key === 'weekly')!.what, /office manager/);
  assert.match(frontDeskRoutine('dental').find((r) => r.key === 'weekly')!.what, /practice manager/);
});
