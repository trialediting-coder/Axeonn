// lib/industryWords.test.ts
// Run with: npm run test:onboarding. The per-industry words, the agreement
// specialty mapping, the portal's first question and the one-time dashboard invite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRIES, INDUSTRY_LABELS, INDUSTRY_OPTIONS, INDUSTRY_WORDS, fillWords, industryFromLabel, industryFromSpecialty, wordsFor } from '../data/industryWords';
import { ONBOARDING_ITEMS, PRACTICE_TYPE_ITEM, getItem, itemForIndustry } from '../data/onboardingItems';
import { orderedItems, prefillFor, validateItemData } from './onboarding';
import { autoInviteBlock } from './onboardingFulfillment';
import { dashboardInviteLine, renderExecSummaryEmail, renderLaunchCertificateEmail, renderWeeklySummaryEmail } from './email';

test('words per industry: people, pages and the first booking', () => {
  const w = (i: (typeof INDUSTRIES)[number]) => INDUSTRY_WORDS[i];
  assert.deepEqual(INDUSTRIES.map((i) => w(i).people), ['patients', 'clients', 'clients', 'clients', 'customers']);
  assert.deepEqual(INDUSTRIES.map((i) => w(i).pages), ['procedures', 'treatments', 'practice areas', 'services', 'services']);
  assert.deepEqual(INDUSTRIES.map((i) => w(i).booking), ['exam', 'consultation', 'case review', 'client meeting', 'appointment']);
  for (const i of INDUSTRIES) for (const [k, v] of Object.entries(w(i))) assert.ok(typeof v === 'string' && v.trim(), `${i}.${k} is empty`);
});

test('missing or unknown industry falls back to the neutral words', () => {
  assert.equal(wordsFor(null), INDUSTRY_WORDS.other);
  assert.equal(wordsFor(undefined), INDUSTRY_WORDS.other);
  assert.equal(wordsFor('plumbing'), INDUSTRY_WORDS.other);
  assert.equal(wordsFor('law'), INDUSTRY_WORDS.law);
});

test('fillWords swaps tokens, capitalised or not, and leaves unknown ones', () => {
  assert.equal(fillWords('{People} book {pages}; {person}', wordsFor('dental')), 'Patients book procedures; patient');
  assert.equal(fillWords('Your {frontDesk}, {unknown}', wordsFor('law')), 'Your front office, {unknown}');
  assert.equal(fillWords('{name} at {business}', wordsFor('law')), '{name} at {business}', 'DBR placeholders are not word tokens');
});

test('industryFromSpecialty maps only clear specialties from the agreement', () => {
  const cases: [string, string | null][] = [
    ['General dentistry', 'dental'],
    ['Orthodontics', 'dental'],
    ['Pediatric Dentist', 'dental'],
    ['Med spa', 'med_spa'],
    ['Medical spa / aesthetics', 'med_spa'],
    ['Botox and injectables', 'med_spa'],
    ['Personal injury law', 'law'],
    ['Estate planning attorney', 'law'],
    ['Criminal defense', 'law'],
    ['CPA', 'accounting'],
    ['Tax preparation', 'accounting'],
    ['Bookkeeping & payroll', 'accounting'],
    ['Tax law', null],
    ['Chiropractic', null],
    ['', null],
  ];
  for (const [text, want] of cases) assert.equal(industryFromSpecialty(text), want, text);
  assert.equal(industryFromSpecialty(null), null);
  assert.equal(industryFromSpecialty(undefined), null);
});

test('the first setup question: CORE and GROWTH only, first, required, labels round-trip', () => {
  const item = getItem(PRACTICE_TYPE_ITEM)!;
  assert.equal(item.tier, 'axeoncore');
  assert.equal(orderedItems('axeoncore').client[0].key, PRACTICE_TYPE_ITEM);
  assert.equal(orderedItems('axeongrowth').client[0].key, PRACTICE_TYPE_ITEM);
  assert.ok(!orderedItems('essentials').client.some((i) => i.key === PRACTICE_TYPE_ITEM));
  assert.ok(!orderedItems('website').client.some((i) => i.key === PRACTICE_TYPE_ITEM));
  assert.equal(item.later, undefined, 'asked in round 1');
  assert.throws(() => validateItemData(item, {}), /required/);
  assert.deepEqual([...item.fields![0].options!], [...INDUSTRY_OPTIONS]);
  for (const i of INDUSTRIES) {
    assert.equal(industryFromLabel(INDUSTRY_LABELS[i]), i);
    assert.deepEqual(validateItemData(item, { industry: INDUSTRY_LABELS[i] }), { industry: INDUSTRY_LABELS[i] });
  }
  assert.equal(industryFromLabel('Plumber'), null);
});

test('the first question is prefilled from the agreement industry, empty without one', () => {
  const item = getItem(PRACTICE_TYPE_ITEM)!;
  const base = { businessName: 'X', clientName: 'Y', clientEmail: 'y@x.com', phone: null };
  assert.deepEqual(prefillFor(item, { ...base, industry: 'law' }), { industry: 'Law firm' });
  assert.deepEqual(prefillFor(item, { ...base, industry: null }), {});
});

test('every portal card is filled: no token survives for any industry, and options never hold tokens', () => {
  const token = /\{[A-Za-z]+\}/;
  for (const raw of ONBOARDING_ITEMS) {
    for (const f of raw.fields ?? []) for (const o of f.options ?? []) assert.doesNotMatch(o, token, `${raw.key}.${f.key} option "${o}"`);
    for (const industry of [...INDUSTRIES, null]) {
      const item = itemForIndustry(raw, industry);
      const texts = [item.title, item.description, ...(item.steps ?? []), ...(item.fields ?? []).flatMap((f) => [f.label, f.hint ?? '', f.placeholder ?? '', ...Object.values(f.optionHints ?? {})])];
      for (const t of texts) assert.doesNotMatch(t, token, `${raw.key} (${industry}): ${t}`);
    }
  }
  assert.equal(itemForIndustry(getItem('services')!, 'dental').title, 'The procedures you want more of');
  assert.equal(itemForIndustry(getItem('services')!, 'law').fields![0].label, 'Practice areas, most important first');
  assert.equal(itemForIndustry(getItem('past-customers')!, 'dental').title, 'A check-in text to past patients every quarter');
});

test('auto dashboard invite: production, CORE/GROWTH, after the client confirmed, once', () => {
  const ready = { tier: 'axeoncore' as const, status: 'active' as const, industry: 'dental' as const, industryConfirmedAt: '2026-10-19T10:00:00Z', dashboardInviteSentAt: null };
  const env = { production: true, alreadyEmailed: false };
  assert.equal(autoInviteBlock(ready, env), null);
  assert.equal(autoInviteBlock({ ...ready, tier: 'axeongrowth' }, env), null);
  assert.equal(autoInviteBlock(ready, { ...env, production: false }), 'not_production');
  assert.equal(autoInviteBlock({ ...ready, tier: 'essentials' }, env), 'plan');
  assert.equal(autoInviteBlock({ ...ready, tier: 'website' }, env), 'plan');
  assert.equal(autoInviteBlock({ ...ready, status: 'closed' }, env), 'closed');
  // Prefilled from the agreement but not confirmed by the client yet: no invite.
  assert.equal(autoInviteBlock({ ...ready, industryConfirmedAt: null }, env), 'not_confirmed');
  assert.equal(autoInviteBlock({ ...ready, industry: null }, env), 'not_confirmed');
  // Idempotent: a recorded invite (automatic or the admin's button), or one already in the email log, blocks a second.
  assert.equal(autoInviteBlock({ ...ready, dashboardInviteSentAt: '2026-10-19T10:01:00Z' }, env), 'already_sent');
  assert.equal(autoInviteBlock(ready, { ...env, alreadyEmailed: true }), 'already_emailed');
});

test('the invite and the v2 emails use the client words', () => {
  assert.match(dashboardInviteLine({ businessName: 'Lee Dental', industry: 'dental', proofVersion: 2 }), /booked exam, which page or listing each new patient came from and where your build is on your 180-day delivery schedule/);
  assert.match(dashboardInviteLine({ businessName: 'Lee Law', industry: 'law', proofVersion: 1 }), /booked case review, which page or listing each new client came from\./);
  assert.match(dashboardInviteLine({ businessName: 'A-1', industry: null }), /the buttons customers press/, 'clients live before PROOF keep the original wording');
  assert.match(renderLaunchCertificateEmail({ businessName: 'X', goLiveAt: '2026-10-19', liveItems: [], url: 'https://x', industry: 'dental' }).html, /past patients/);
  const sum = { businessName: 'X', monthLabel: 'October 2026', rescued: 1, missed: 2, newReviews: null, reviewRequests: 0, dbrBooked: 1, webBooked: 1, pipelineDollars: null, impressions: null, url: 'https://x' };
  assert.match(renderExecSummaryEmail({ ...sum, industry: 'law' }).html, /Case reviews booked/);
  assert.match(renderExecSummaryEmail(sum).html, /Appointments booked/);
  const week = { businessName: null, managerName: null, waiting: 0, missed: 0, autoTexted: 0, staffReplied: 0, booked: 0, archived: 0, url: 'https://x' };
  assert.match(renderWeeklySummaryEmail({ ...week, industry: 'accounting' }).html, /front office/);
  assert.match(renderWeeklySummaryEmail({ ...week, industry: 'accounting' }).html, /the firm/);
});
