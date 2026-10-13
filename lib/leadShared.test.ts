// lib/leadShared.test.ts
// Run with: npm run test:leads   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEAD_ALERT_MAX, backLink, connectDecision, connectWhisperText, describeDelivery, isQuietHours, leadAlertText, pagePath, parseId, planLeadDelivery,
  replyPage, safeRedirect, spokenName, toDashboardSubmission, validateLeadInput, type FormSubmission, type LeadLineView,
} from './leadShared';


test('validateLeadInput keeps a normal form and normalizes phone, email and page', () => {
  const v = validateLeadInput({
    site: 'ax_abcdefghjkmnpq', name: '  Jane   Doe ', phone: '(515) 555-0134', email: ' Jane@Example.COM ',
    message: 'Need a quote\r\nfor a driveway', page: 'https://client.com/quote?x=1', utm_source: 'google', company_website: '',
  });
  assert.deepEqual(v, {
    ok: true,
    lead: { name: 'Jane Doe', phone: '+15155550134', email: 'jane@example.com', message: 'Need a quote\nfor a driveway', page: '/quote', utmSource: 'google', utmMedium: null, utmCampaign: null },
  });
});

test('validateLeadInput treats a filled honeypot as spam and needs a phone or an email', () => {
  assert.deepEqual(validateLeadInput({ name: 'Bot', email: 'a@b.co', company_website: 'http://spam.example' }), { ok: false, reason: 'spam' });
  const none = validateLeadInput({ name: 'Jane', message: 'hi' });
  assert.ok(!none.ok && none.reason === 'invalid' && /phone number or email/.test(none.error));
});

test('validateLeadInput treats a filled _gotcha as spam and ignores an empty one', () => {
  assert.deepEqual(validateLeadInput({ name: 'Bot', email: 'a@b.co', _gotcha: 'x' }), { ok: false, reason: 'spam' });
  assert.ok(validateLeadInput({ name: 'Jane', email: 'a@b.co', _gotcha: '' }).ok);
});

test('validateLeadInput keeps a lead whose phone is not a US number when there is an email, with the phone as typed in the message', () => {
  const v = validateLeadInput({ name: 'Ann', phone: '+44 7700 900123', email: 'ann@example.co.uk', message: 'Hello' });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.phone, null);
    assert.equal(v.lead.message, 'Hello\nPhone as typed: +44 7700 900123');
  }
  const bad = validateLeadInput({ name: 'Ann', phone: '555-0134' });
  assert.ok(!bad.ok && bad.reason === 'invalid' && /check your phone/.test(bad.error));
});

test('validateLeadInput accepts the field names client sites already use and appends extra fields to the message', () => {
  const v = validateLeadInput({ first_name: 'Jose', last_name: 'García', tel: '515-555-0134', service: 'Driveway', 'square-feet': 800, _gotcha: '', redirect: '/thanks' });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.name, 'Jose García');
    assert.equal(v.lead.phone, '+15155550134');
    assert.equal(v.lead.message, 'service: Driveway\nsquare feet: 800');
  }
});

test('validateLeadInput caps long fields and never keeps control characters', () => {
  const v = validateLeadInput({ name: `A\u0000B${'x'.repeat(300)}`, email: 'a@b.co', message: 'm'.repeat(5000) });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.lead.name.length, 100);
    assert.ok(!v.lead.name.includes('\u0000'));
    assert.equal(v.lead.message.length, 2000);
  }
});

test('pagePath keeps only the path of a page URL', () => {
  assert.equal(pagePath('https://client.com/quote?x=1#top'), '/quote');
  assert.equal(pagePath('quote'), '/quote');
  assert.equal(pagePath('/'), '/');
  assert.equal(pagePath(''), '');
  assert.equal(pagePath(5), '');
});

test("isQuietHours follows the client's own zone, across daylight saving", () => {
  // July, Central daylight time (UTC-5).
  assert.equal(isQuietHours(new Date('2026-07-15T00:59:00Z'), 'America/Chicago'), false); // 7:59 pm
  assert.equal(isQuietHours(new Date('2026-07-15T01:00:00Z'), 'America/Chicago'), true); // 8:00 pm
  assert.equal(isQuietHours(new Date('2026-07-15T12:59:00Z'), 'America/Chicago'), true); // 7:59 am
  assert.equal(isQuietHours(new Date('2026-07-15T13:00:00Z'), 'America/Chicago'), false); // 8:00 am
  // January, Central standard time (UTC-6).
  assert.equal(isQuietHours(new Date('2026-01-15T01:59:00Z'), 'America/Chicago'), false); // 7:59 pm
  assert.equal(isQuietHours(new Date('2026-01-15T02:00:00Z'), 'America/Chicago'), true); // 8:00 pm
  // The morning the clocks spring forward (2026-03-08): 8 am is 13:00Z, not 14:00Z.
  assert.equal(isQuietHours(new Date('2026-03-08T12:30:00Z'), 'America/Chicago'), true); // 7:30 am CDT
  assert.equal(isQuietHours(new Date('2026-03-08T13:00:00Z'), 'America/Chicago'), false); // 8:00 am CDT
  // One instant, three clients.
  const t = new Date('2026-07-15T01:30:00Z');
  assert.equal(isQuietHours(t, 'America/New_York'), true); // 9:30 pm
  assert.equal(isQuietHours(t, 'America/Los_Angeles'), false); // 6:30 pm
  assert.equal(isQuietHours(new Date('2026-07-15T06:00:00Z'), 'Pacific/Honolulu'), true); // 8:00 pm
  // A bad zone falls back to Central instead of throwing.
  assert.equal(isQuietHours(new Date('2026-07-15T01:00:00Z'), 'Mars/Base'), true);
  assert.equal(isQuietHours(new Date('2026-07-15T17:00:00Z'), ''), false);
});

const LINE: LeadLineView = { phoneNumber: '+15155550199', forwardTo: '+15155550100', smsStatus: 'ready', callConnectEnabled: true, timeZone: 'America/Chicago' };
const NOON = new Date('2026-07-15T17:00:00Z');
const TEN_PM = new Date('2026-07-16T03:00:00Z');

test('planLeadDelivery texts and calls the owner for AxeonCORE and up in the daytime', () => {
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'send', connect: 'call' });
  assert.deepEqual(planLeadDelivery({ tier: 'axeongrowth', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'send', connect: 'call' });
});

test('planLeadDelivery holds the text and the call at night, and never for Essentials', () => {
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: LINE, leadPhone: '+15155550134', now: TEN_PM }), { text: 'quiet_hours', connect: 'quiet_hours' });
  assert.deepEqual(planLeadDelivery({ tier: 'essentials', line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'plan', connect: 'plan' });
  assert.deepEqual(planLeadDelivery({ tier: 'axeoncore', line: null, leadPhone: '+15155550134', now: NOON }), { text: 'no_line', connect: 'no_line' });
});

test('planLeadDelivery explains every other reason it will not call', () => {
  const at = (line: Partial<LeadLineView>, leadPhone: string | null) => planLeadDelivery({ tier: 'axeoncore', line: { ...LINE, ...line }, leadPhone, now: NOON });
  assert.deepEqual(at({ smsStatus: 'pending' }, '+15155550134'), { text: 'sms_pending', connect: 'call' });
  assert.equal(at({ callConnectEnabled: false }, '+15155550134').connect, 'off');
  assert.equal(at({}, null).connect, 'no_phone');
  assert.equal(at({}, '+15155550100').connect, 'same_number'); // the owner's own cell
  assert.equal(at({}, '+15155550199').connect, 'same_number'); // the tracked number itself
  assert.deepEqual(planLeadDelivery({ tier: 'gold' as never, line: LINE, leadPhone: '+15155550134', now: NOON }), { text: 'plan', connect: 'plan' });
});

test('describeDelivery reads as one line for the admin card', () => {
  assert.equal(describeDelivery({ email: 'sent', text: 'sms_pending', connect: 'started' }), "Email: sent · Text: waiting on 10DLC approval · Call connect: calling the owner's cell now");
  assert.equal(
    describeDelivery({ email: 'off', text: 'quiet_hours', connect: 'same_number' }),
    "Email: not configured (RESEND_API_KEY) · Text: skipped, quiet hours (8 pm to 8 am) · Call connect: the lead's phone is the owner's own number",
  );
});

test('leadAlertText fits one alert in two SMS segments and keeps who and how to reach them', () => {
  const t = leadAlertText({ name: 'Jane Doe', phone: '+15155550134', email: 'jane@example.com', message: 'word '.repeat(200), page: '/quote' });
  assert.ok(t.length <= LEAD_ALERT_MAX, String(t.length));
  assert.ok(t.startsWith('New website lead: Jane Doe, (515) 555-0134, jane@example.com. "word word'));
  assert.ok(t.endsWith('..." Page: /quote'));
  assert.equal(leadAlertText({ name: '', phone: null, email: 'a@b.co', message: '', page: '' }), 'New website lead: Someone, a@b.co.');
  assert.equal(leadAlertText({ name: 'Al', phone: '+15155550134', email: null, message: 'Fix\n\nmy   deck', page: '/' }), 'New website lead: Al, (515) 555-0134. "Fix my deck" Page: /');
});

test('spokenName keeps letters only, so the voice never reads markup, links or numbers', () => {
  assert.equal(spokenName('Jane & "Bob" <b>'), 'Jane Bob b');
  assert.equal(spokenName("Mary-Kate O'Neil"), "Mary-Kate O'Neil");
  assert.equal(spokenName('José Núñez'), 'José Núñez');
  assert.equal(spokenName('12345 !!!'), 'someone');
  assert.equal(spokenName('x'.repeat(80)).length, 40);
  assert.equal(connectWhisperText('Jane'), 'New lead from your website: Jane. Press 1 to call them now.');
});

test('parseId accepts a positive whole number and nothing else', () => {
  assert.equal(parseId('42'), 42);
  for (const bad of ['0', '-1', '4.2', '042', 'abc', '', null, undefined, '1'.repeat(16)]) assert.equal(parseId(bad), null, String(bad));
});

test('safeRedirect only follows the form back to the site it came from', () => {
  const origin = 'https://www.client.com';
  assert.equal(safeRedirect('https://client.com/thanks', origin, null), 'https://client.com/thanks');
  assert.equal(safeRedirect('/thanks', origin, null), 'https://www.client.com/thanks');
  assert.equal(safeRedirect('thanks.html', null, 'https://client.com/contact/'), 'https://client.com/contact/thanks.html');
  assert.equal(safeRedirect('https://evil.example/x', origin, null), null);
  assert.equal(safeRedirect('//evil.example/x', origin, null), null);
  assert.equal(safeRedirect('javascript:alert(1)', origin, null), null);
  assert.equal(safeRedirect('/thanks', null, null), null);
  assert.equal(safeRedirect('/thanks', 'null', null), null);
  assert.equal(safeRedirect(undefined, origin, null), null);
});

test('backLink and replyPage: only http(s) links back, and everything shown is escaped', () => {
  assert.equal(backLink('https://client.com/contact'), 'https://client.com/contact');
  assert.equal(backLink('javascript:alert(1)'), null);
  assert.equal(backLink(null), null);
  const html = replyPage({ heading: 'Thanks', text: '<script>x</script>', backUrl: 'https://client.com/?a=1&b="2"' });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /<p>&lt;script&gt;x&lt;\/script&gt;<\/p>/);
  assert.match(html, /href="https:\/\/client\.com\/\?a=1&amp;b=&quot;2&quot;"/);
  assert.doesNotMatch(replyPage({ heading: 'Thanks', text: 'ok', backUrl: null }), /Back to the site/);
});

test('toDashboardSubmission sends the dashboard a masked phone and no email or message', () => {
  const s: FormSubmission = {
    id: 7, onboardingId: 3, name: '', phone: '+15155550134', email: 'jane@example.com', message: 'secret', page: '/quote',
    utmSource: null, utmMedium: null, utmCampaign: null, isTest: false, connectPressedAt: '2026-07-15T17:01:00.000Z', createdAt: '2026-07-15T17:00:00.000Z',
  };
  const d = toDashboardSubmission(s);
  assert.deepEqual(d, { id: 7, at: '2026-07-15T17:00:00.000Z', name: 'Someone', phone: '(515) 555-01··', page: '/quote', calledBack: true });
  const json = JSON.stringify(d);
  assert.ok(!json.includes('5550134') && !json.includes('jane@') && !json.includes('secret'));
  assert.equal(toDashboardSubmission({ ...s, phone: null, connectPressedAt: null }).calledBack, false);
});

test('leadAlertText stays GSM-7 ASCII and under 300 characters, truncated or not', () => {
  const nasty = { name: 'José “Pepe” Núñez', phone: '+15155550134', email: 'jose@example.com', message: `It’s a — big job… ${'café '.repeat(200)}`, page: '/café' };
  for (const lead of [nasty, { ...nasty, message: 'short — ok…' }, { ...nasty, name: 'x'.repeat(100), message: 'm'.repeat(2000) }]) {
    const t = leadAlertText(lead);
    assert.ok(!/[^ -~]/.test(t), t);
    assert.ok(t.length <= 300, String(t.length));
  }
  const cut = leadAlertText(nasty);
  assert.ok(cut.includes('..."') && cut.length <= 300);
  assert.ok(leadAlertText({ ...nasty, message: 'short — ok…' }).includes('"short - ok..."'));
});

test('connectDecision only dials the lead of this client when the owner pressed 1', () => {
  const lead = { id: 5, onboardingId: 3, phone: '+15155550134' };
  assert.deepEqual(connectDecision({ digits: '1', lead, lineOnboardingId: 3 }), { action: 'dial', phone: '+15155550134' });
  assert.deepEqual(connectDecision({ digits: '1', lead, lineOnboardingId: 4 }), { action: 'reject', reason: 'wrong_client' });
  assert.deepEqual(connectDecision({ digits: '1', lead: null, lineOnboardingId: 3 }), { action: 'reject', reason: 'missing_lead' });
  assert.deepEqual(connectDecision({ digits: '1', lead: { ...lead, phone: null }, lineOnboardingId: 3 }), { action: 'reject', reason: 'no_phone' });
  for (const digits of [undefined, null, '', '2', '11']) assert.deepEqual(connectDecision({ digits, lead, lineOnboardingId: 3 }), { action: 'no_press' }, String(digits));
});
