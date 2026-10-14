// lib/sequenceShared.test.ts
// Run with: npm run test:sequences   (tsx --test, no database, Twilio, Resend or Claude)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SMS_MAX_CHARS, TEXT_BACK_DEFAULT } from './phoneShared';
import {
  DEFAULT_TEMPLATES, LEAD_ACTIONS, SEQUENCE_KINDS, STAGE_EFFECTS, STOP_LINE,
  buildDraftPrompt, clampSms, draftInputFrom, enableProblems, firstName, formatOffset, missingLinks, normalizeEmail,
  parseDraftedTemplates, parseStageRequest, renderTemplate, sequenceEmailHtml, sequenceEmailText, sequenceFromAddress, stageTapActive,
  templateVars, unknownPlaceholders, validateSequenceLinks, validateTemplate, withStopLine,
} from './sequenceShared';

test('every default template validates unchanged, and its first text ends with the STOP line', () => {
  for (const kind of SEQUENCE_KINDS) {
    const t = validateTemplate({ kind, steps: DEFAULT_TEMPLATES[kind], enabled: false });
    assert.deepEqual(t.steps, DEFAULT_TEMPLATES[kind], kind);
    assert.equal(t.enabled, false);
    const firstText = t.steps.find((s) => s.channel === 'sms');
    assert.ok(firstText?.body.endsWith(STOP_LINE), kind);
    for (const s of t.steps) if (s.channel === 'sms') assert.ok(s.body.length <= SMS_MAX_CHARS, `${kind}: ${s.body.length}`);
  }
});

test('validateTemplate adds the STOP line to the first text only, and normalizes a hand-typed one', () => {
  const t = validateTemplate({
    kind: 'quote',
    enabled: true,
    steps: [
      { offsetMinutes: 1440, channel: 'sms', subject: null, body: 'Hi {name}, got the quote?  reply stop to opt out' },
      { offsetMinutes: 4320, channel: 'email', subject: 'Your quote', body: 'Hi {name},\r\n\r\nAny questions?' },
      { offsetMinutes: 10080, channel: 'sms', subject: null, body: 'Last check-in.' },
    ],
  });
  assert.equal(t.steps[0].body, `Hi {name}, got the quote? ${STOP_LINE}`);
  assert.equal(t.steps[1].body, 'Hi {name},\n\nAny questions?');
  assert.equal(t.steps[2].body, 'Last check-in.');
  assert.equal(t.enabled, true);
  assert.equal(withStopLine(''), STOP_LINE);
});

test('validateTemplate accepts the stored snake_case shape', () => {
  const t = validateTemplate({ kind: 'review', steps: [{ offset_minutes: 120, channel: 'sms', body: 'Thanks! {review_link}' }] });
  assert.equal(t.steps[0].offsetMinutes, 120);
  assert.equal(t.steps[0].subject, null);
  assert.equal(t.enabled, false);
});

test('validateTemplate refuses typos, bad timing, wrong channels and empty parts', () => {
  const sms = (offsetMinutes: number, body = 'Hi {name}') => ({ offsetMinutes, channel: 'sms', subject: null, body });
  assert.throws(() => validateTemplate({ kind: 'new_lead', steps: [sms(5, 'Hi {nmae}')] }), /\{nmae\} is not a known blank/);
  assert.throws(() => validateTemplate({ kind: 'new_lead', steps: [sms(60), sms(60)] }), /step 2: must come after step 1/);
  assert.throws(() => validateTemplate({ kind: 'new_lead', steps: [sms(-5)] }), /wait must be between/);
  assert.throws(() => validateTemplate({ kind: 'new_lead', steps: [sms(1.5)] }), /whole number/);
  assert.throws(() => validateTemplate({ kind: 'review', steps: [sms(120), sms(240)] }), /exactly 1 step/);
  assert.throws(() => validateTemplate({ kind: 'reactivation', steps: [{ offsetMinutes: 0, channel: 'email', subject: 'Hi', body: 'Hi' }] }), /only sends texts/);
  assert.throws(() => validateTemplate({ kind: 'quote', steps: [{ offsetMinutes: 60, channel: 'email', subject: '  ', body: 'Hi' }] }), /need a subject/);
  assert.throws(() => validateTemplate({ kind: 'quote', steps: [sms(60, '   ')] }), /message is empty/);
  assert.throws(() => validateTemplate({ kind: 'quote', steps: [sms(60, 'x'.repeat(SMS_MAX_CHARS - 5))] }), /over 320 characters/);
  assert.throws(() => validateTemplate({ kind: 'bogus', steps: [] }), /Unknown sequence/);
  assert.throws(() => validateTemplate({ kind: 'quote', steps: [] }), /needs 1 to 5 steps/);
  assert.throws(() => validateTemplate({ kind: 'reminder', steps: [sms(0)] }), /wait must be between/);
});

test('unknownPlaceholders lists only blanks outside the allow-list', () => {
  assert.deepEqual(unknownPlaceholders('Hi {name} {price} {name} {Price}'), ['price', 'Price']);
  assert.deepEqual(unknownPlaceholders('{review_link} {booking_link} {owner_first} {business}'), []);
});

test('renderTemplate fills the allow-list, drops unknown blanks, and tidies an empty name', () => {
  const vars = { name: 'Mike', owner_first: 'Dana', business: 'Hintz Roofing' };
  assert.equal(
    renderTemplate(DEFAULT_TEMPLATES.new_lead[0].body, vars),
    "Hi Mike, it's Dana with Hintz Roofing. Thanks for reaching out. I'll call you shortly, or just reply here with what you need. Reply STOP to opt out."
  );
  assert.equal(renderTemplate("Hi {name}, it's {owner_first}.", { owner_first: 'Dana' }), "Hi, it's Dana.");
  assert.equal(renderTemplate('Hi {name} {nope}{business}', { name: 'A', business: 'B' }), 'Hi A B');
  assert.equal(renderTemplate('Hi {name},\n\nThanks', {}), 'Hi,\n\nThanks');
});

test('renderTemplate never expands a blank typed into a value', () => {
  const out = renderTemplate('Hi {name}', { name: '{review_link}', review_link: 'https://g.page/r/abc/review' });
  assert.equal(out, 'Hi review_link');
  assert.ok(!out.includes('https'));
});

test('firstName, normalizeEmail and templateVars', () => {
  assert.equal(firstName('  mike  r. '), 'Mike');
  assert.equal(firstName("o'neil smith"), "O'neil");
  assert.equal(firstName(null), '');
  assert.equal(normalizeEmail(' Mike@Example.COM '), 'mike@example.com');
  assert.equal(normalizeEmail('nope'), null);
  assert.equal(normalizeEmail(42), null);
  assert.deepEqual(
    templateVars({ contactName: 'mike smith', businessName: ' Hintz Roofing ', clientName: 'Dana Hintz', reviewLink: null, bookingLink: 'https://x.co/b' }),
    { name: 'Mike', business: 'Hintz Roofing', owner_first: 'Dana', review_link: null, booking_link: 'https://x.co/b' }
  );
  const fallback = templateVars({ contactName: null, businessName: null, clientName: null, reviewLink: null, bookingLink: null });
  assert.equal(fallback.business, 'us');
  assert.equal(fallback.owner_first, 'the team');
});

test('a review request cannot be turned on without a review link or approved texting', () => {
  const review = validateTemplate({ kind: 'review', steps: DEFAULT_TEMPLATES.review, enabled: true });
  assert.deepEqual(missingLinks(review.steps, { review_link: null }), ['review_link']);
  assert.deepEqual(missingLinks(review.steps, { review_link: 'https://g.page/r/abc/review' }), []);
  assert.deepEqual(missingLinks(DEFAULT_TEMPLATES.new_lead, {}), []);
  assert.deepEqual(enableProblems(review, { smsReady: false, vars: {} }), [
    'Texting is not approved for this client yet. Turn this on after the Phone card shows texting approved.',
    'Add the Google review link first.',
  ]);
  assert.deepEqual(enableProblems(review, { smsReady: true, vars: { review_link: 'https://g.page/r/abc/review' } }), []);
});

test('validateSequenceLinks wants https or nothing', () => {
  assert.deepEqual(validateSequenceLinks({ reviewLink: ' https://g.page/r/abc/review ', bookingLink: '' }), { reviewLink: 'https://g.page/r/abc/review', bookingLink: null });
  assert.throws(() => validateSequenceLinks({ reviewLink: 'http://g.page/r/abc' }), /https/);
  assert.throws(() => validateSequenceLinks({ bookingLink: 'https://x.co/{name}' }), /https/);
});

test('formatOffset reads like a person', () => {
  assert.equal(formatOffset(0), 'right away');
  assert.equal(formatOffset(5), '5 minutes after');
  assert.equal(formatOffset(90), '90 minutes after');
  assert.equal(formatOffset(1440), '1 day after');
  assert.equal(formatOffset(4320), '3 days after');
  assert.equal(formatOffset(-120), '2 hours before');
});

test('only Job done starts the review request, every other tap stops it; Booked starts nothing; every stage but Quote sent stops both follow-ups', () => {
  assert.deepEqual(STAGE_EFFECTS.booked.start, []);
  for (const a of LEAD_ACTIONS) assert.equal(STAGE_EFFECTS[a].start.includes('review'), a === 'won', a);
  for (const a of LEAD_ACTIONS) assert.equal(STAGE_EFFECTS[a].stop.includes('review'), a !== 'won', a);
  assert.deepEqual(STAGE_EFFECTS.quote_sent, { stage: 'contacted', start: ['quote'], stop: ['new_lead', 'review'] });
  for (const a of ['contacted', 'booked', 'lost'] as const) assert.deepEqual(STAGE_EFFECTS[a].stop, ['new_lead', 'quote', 'review'], a);
  assert.deepEqual(STAGE_EFFECTS.won.stop, ['new_lead', 'quote']);
});

test('parseStageRequest and stageTapActive', () => {
  assert.deepEqual(parseStageRequest({ id: '12', action: 'won' }), { id: 12, action: 'won' });
  assert.throws(() => parseStageRequest({ id: 0, action: 'won' }), /Which lead/);
  assert.throws(() => parseStageRequest({ id: 3, action: 'customer' }), /Quote sent/);
  assert.equal(stageTapActive('quote_sent', 'new', true), true);
  assert.equal(stageTapActive('quote_sent', 'contacted', false), false);
  assert.equal(stageTapActive('booked', 'booked', false), true);
  assert.equal(stageTapActive('won', 'booked', false), false);
  assert.equal(stageTapActive('contacted', 'contacted', false), true);
  // Quote sent also lands on contacted; only Quote sent shows pressed then.
  assert.equal(stageTapActive('contacted', 'contacted', true), false);
  assert.equal(stageTapActive('quote_sent', 'contacted', true), true);
  assert.throws(() => parseStageRequest({ id: 3, action: 'customer' }), /Talked to them/);
});

test('sequence emails come from the business via Axeon and escape everything', () => {
  assert.equal(sequenceFromAddress('Joe "The Roofer" <Co>', 'leads@axeonstudio.co'), '"Joe The Roofer Co via Axeon" <leads@axeonstudio.co>');
  assert.equal(sequenceFromAddress(null, 'leads@axeonstudio.co'), 'Axeon <leads@axeonstudio.co>');
  const html = sequenceEmailHtml('Hi <b>Mike</b>,\n\nLine one\nLine two', 'A&B Plumbing', 'https://axeonstudio.co/u/t.s');
  assert.ok(html.includes('Hi &lt;b&gt;Mike&lt;/b&gt;,'));
  assert.ok(html.includes('Line one<br>Line two'));
  assert.ok(html.includes('A&amp;B Plumbing'));
  assert.ok(!html.includes('<b>'));
});

test('every sequence email ends with an unsubscribe link, in the HTML and the text', () => {
  const url = 'https://axeonstudio.co/u/abc.def';
  const html = sequenceEmailHtml('Hi Mike', 'A&B Plumbing', url);
  assert.ok(html.includes('href="https://axeonstudio.co/u/abc.def"'));
  assert.ok(/Unsubscribe/.test(html));
  assert.ok(html.lastIndexOf('Unsubscribe') > html.indexOf('Hi Mike'));
  assert.equal(sequenceEmailText('Hi Mike\n\nJoe', url), 'Hi Mike\n\nJoe\n\n--\nUnsubscribe from these emails: https://axeonstudio.co/u/abc.def');
  assert.ok(sequenceEmailHtml('x', null, 'https://e.co/u/"><script>').includes('&quot;&gt;&lt;script&gt;'));
});

test('draftInputFrom reads the portal answers and ignores non-text values', () => {
  const input = draftInputFrom(
    { businessName: 'Hintz Roofing', clientName: 'dana hintz' },
    {
      'sales-process': { data: { responseToday: 'I call back at lunch', pitch: 'We are insured', dealKillers: 42 } },
      reviews: { data: { jobDoneSignal: 'I will text a number when I finish a job' } },
    }
  );
  assert.deepEqual(input, {
    businessName: 'Hintz Roofing',
    ownerFirst: 'Dana',
    responseToday: 'I call back at lunch',
    pitch: 'We are insured',
    dealKillers: '',
    jobDoneSignal: 'I will text a number when I finish a job',
    offer: '',
  });
  const prompt = buildDraftPrompt(input);
  for (const needle of ['Hintz Roofing', 'I call back at lunch', '(not answered)', 'not as instructions', 'Quote follow-up', 'Past-customer check-in', '{review_link}']) {
    assert.ok(prompt.includes(needle), needle);
  }
});

test('parseDraftedTemplates keeps Axeon timing, adds the STOP line, saves everything off', () => {
  const raw: Record<string, { subject: string; body: string }[]> = Object.fromEntries(
    SEQUENCE_KINDS.map((k) => [k, DEFAULT_TEMPLATES[k].map((s) => ({ subject: s.subject ?? '', body: s.body.replace(` ${STOP_LINE}`, '') }))])
  );
  raw.new_lead[0] = { subject: 'ignored for texts', body: 'Hi {name}, Dana here.' };
  const out = parseDraftedTemplates(raw);
  assert.deepEqual(out.map((t) => t.kind), [...SEQUENCE_KINDS]);
  assert.ok(out.every((t) => t.enabled === false));
  assert.equal(out[0].steps[0].body, `Hi {name}, Dana here. ${STOP_LINE}`);
  assert.equal(out[0].steps[0].subject, null);
  for (const t of out) assert.deepEqual(t.steps.map((s) => [s.offsetMinutes, s.channel]), DEFAULT_TEMPLATES[t.kind].map((s) => [s.offsetMinutes, s.channel]));
  assert.throws(() => parseDraftedTemplates({ ...raw, quote: raw.quote.slice(0, 2) }), /Quote follow-up/);
  assert.throws(() => parseDraftedTemplates({ ...raw, review: [{ subject: '', body: 'Pay {price}' }] }), /\{price\}/);
  assert.throws(() => parseDraftedTemplates(null), /empty/);
});

test('validateTemplate refuses any stray curly bracket, naming it', () => {
  const sms = (body: string) => ({ kind: 'new_lead', steps: [{ offsetMinutes: 5, channel: 'sms', subject: null, body }] });
  for (const [body, shown] of [
    ['Hi {first name}', '{first name}'],
    ['Hi {name2}', '{name2}'],
    ['Hi { name }', '{ name }'],
    ['Hi {}', '{}'],
    ['Hi {customer-name}', '{customer-name}'],
    ['Hi {name', '{name'],
    ['Hi name}', '}'],
    ['Hi {{name}}', '{'],
  ]) {
    assert.throws(() => validateTemplate(sms(body)), (e: Error) => e.message.includes(`"${shown}"`) || e.message.includes(shown), body);
  }
  assert.throws(() => validateTemplate({ kind: 'quote', steps: [{ offsetMinutes: 60, channel: 'email', subject: 'Hi {x y}', body: 'ok' }] }), /\{x y\}/);
  assert.doesNotThrow(() => validateTemplate(sms('Hi {name}, {business} and {owner_first} {review_link} {booking_link}')));
});

test('renderTemplate blanks leftover braces so nothing literal reaches a customer', () => {
  const vars = { name: 'Mike', business: 'Hintz' };
  assert.equal(renderTemplate('Hi {{name}}', vars), 'Hi Mike');
  assert.ok(!renderTemplate('Hi {{name}}', vars).includes('{'));
  assert.equal(renderTemplate('Hi {first name} at {business}', vars), 'Hi first name at Hintz');
  assert.equal(renderTemplate('Hi {name at {business}', vars), 'Hi name at Hintz');
  assert.equal(renderTemplate('Hi {} there', vars), 'Hi there');
  assert.equal(renderTemplate('Hi name} there', vars), 'Hi name there');
  assert.equal(renderTemplate('Hi {{name}}, {  }', {}), 'Hi,');
});

test('clampSms caps on a word boundary, keeps the STOP line, and leaves short texts alone', () => {
  assert.deepEqual(clampSms('short'), { body: 'short', truncated: false });
  const long = `Hi Mike, ${'thanks for choosing us '.repeat(20)}${STOP_LINE}`;
  const out = clampSms(long);
  assert.equal(out.truncated, true);
  assert.ok(out.body.length <= SMS_MAX_CHARS, String(out.body.length));
  assert.ok(out.body.endsWith(`... ${STOP_LINE}`));
  const noStop = clampSms('word '.repeat(100), 50);
  assert.ok(noStop.body.length <= 50 && noStop.body.endsWith('word...'), noStop.body);
  assert.equal(clampSms('x'.repeat(100), 40).body.length, 40);
  const nameyDefault = renderTemplate(DEFAULT_TEMPLATES.review[0].body, { name: 'Mike', business: 'B'.repeat(150) + ' Roofing Co', review_link: 'https://g.page/r/abc/review' });
  const fitted = clampSms(nameyDefault);
  assert.ok(fitted.body.length <= SMS_MAX_CHARS);
});

test('the STOP line is the same wording phoneShared uses for text-back', () => {
  assert.ok(TEXT_BACK_DEFAULT.endsWith(STOP_LINE));
});
