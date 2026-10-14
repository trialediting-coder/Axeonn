// lib/contactsShared.test.ts
// Run with: npm run test:inbox   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canReplyNow, cleanName, contactKeyFor, contactWho, decodeCursor, encodeCursor, eventSummary, inboxEnabled, isLeadActivity, maskEmail,
  mergeDecision, messageEventKind, nextSystemStage, noteForAction, outcomeForStage, parseContactId, quietNotice, relativeWhen,
  replyBlocker, sequenceEffects, shortName, sourceForKind, systemStageFor, textingState, toDashboardContact, toDashboardEvent,
  validateReplyBody, heldReplyStatus, unmatchedTaps, QUIET_WINDOW, HELD_REPLY_COPY, REPLY_REFUSAL_COPY, REPLY_UNCLEAR_COPY, isReplyRefusal,
  type Contact, type ContactEvent,
} from './contactsShared';
import { LEAD_ACTIONS, STAGE_EFFECTS } from './sequenceShared';

const base: Contact = {
  id: 1, onboardingId: 7, phone: '+15155550134', email: null, name: null, stage: 'new', source: 'call',
  utmSource: null, utmMedium: null, utmCampaign: null,
  firstSeenAt: '2026-10-01T15:00:00.000Z', lastActivityAt: '2026-10-01T15:00:00.000Z', stageChangedAt: null, quoteSentAt: null,
};
const contact = (over: Partial<Contact>): Contact => ({ ...base, ...over });
const event = (over: Partial<ContactEvent>): ContactEvent => ({
  id: 10, contactId: 1, onboardingId: 7, kind: 'call', refTable: 'phone_calls', refId: 5, refPart: 0, summary: '', payload: {},
  createdAt: '2026-10-01T15:00:00.000Z', ...over,
});

test('contactKeyFor: E.164 phone and lowercase email, nothing for a withheld caller or junk', () => {
  assert.deepEqual(contactKeyFor({ phone: '(515) 555-0134', email: ' Sarah@Example.COM ' }), { phone: '+15155550134', email: 'sarah@example.com' });
  assert.deepEqual(contactKeyFor({ email: 'a@b.co' }), { phone: null, email: 'a@b.co' });
  assert.deepEqual(contactKeyFor({ phone: '+447700900123' }), { phone: '+447700900123', email: null });
  assert.equal(contactKeyFor({ phone: 'anonymous' }), null);
  assert.equal(contactKeyFor({ phone: 'unknown' }), null);
  assert.equal(contactKeyFor({ phone: '', email: 'nope' }), null);
  assert.equal(contactKeyFor({ email: 42 }), null);
  assert.equal(contactKeyFor({}), null);
});

test('names and ids are cleaned', () => {
  assert.equal(cleanName('  Mike   Rogers '), 'Mike Rogers');
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName('x'.repeat(200))?.length, 80);
  assert.equal(parseContactId('42'), 42);
  assert.equal(parseContactId(42), 42);
  assert.equal(parseContactId('0'), null);
  assert.equal(parseContactId('4.2'), null);
  assert.equal(parseContactId('1; drop'), null);
  assert.equal(parseContactId(undefined), null);
});

test('the system only moves a contact forward and never off Won or Lost', () => {
  assert.equal(nextSystemStage('new', 'contacted'), 'contacted');
  assert.equal(nextSystemStage('contacted', 'booked'), 'booked');
  assert.equal(nextSystemStage('booked', 'contacted'), null);
  assert.equal(nextSystemStage('won', 'booked'), null);
  assert.equal(nextSystemStage('lost', 'contacted'), null);
  assert.equal(nextSystemStage('contacted', 'contacted'), null);
});

test('what moves a stage by itself: an answered call, a typed text, a booking', () => {
  assert.equal(systemStageFor('call', { outcome: 'answered' }), 'contacted');
  assert.equal(systemStageFor('call', { outcome: 'missed' }), null);
  assert.equal(systemStageFor('text_out', { messageKind: 'manual' }), 'contacted');
  assert.equal(systemStageFor('text_out', { messageKind: 'text_back' }), null);
  assert.equal(systemStageFor('booking', {}), 'booked');
  assert.equal(systemStageFor('form', {}), null);
});

test('stages drive the follow-ups through slice 3 STAGE_EFFECTS, one source of truth', () => {
  for (const a of LEAD_ACTIONS) {
    assert.deepEqual(sequenceEffects(a, true), { stop: STAGE_EFFECTS[a].stop, start: STAGE_EFFECTS[a].start });
    assert.deepEqual(sequenceEffects(a, false), { stop: STAGE_EFFECTS[a].stop, start: [] });
  }
  // Slice 3's real table: every tap but Job done also stops a running review request.
  assert.deepEqual(sequenceEffects('contacted', true), { stop: ['new_lead', 'quote', 'review'], start: [] });
  assert.deepEqual(sequenceEffects('won', true), { stop: ['new_lead', 'quote'], start: ['review'] });
  assert.deepEqual(sequenceEffects('quote_sent', true), { stop: ['new_lead', 'review'], start: ['quote'] });
  assert.equal(noteForAction('won'), 'Tapped "Job done"');
  assert.equal(noteForAction('quote_sent'), 'Tapped "Quote sent"');
});

test('only Won and Lost are outcomes for the close rate (Review Focus 5)', () => {
  assert.equal(outcomeForStage('won'), 'won');
  assert.equal(outcomeForStage('lost'), 'lost');
  assert.equal(outcomeForStage('booked'), null);
  assert.equal(outcomeForStage('new'), null);
});

test('mergeDecision keeps the older contact and takes the best of both (Review Focus 2)', () => {
  const older = contact({ id: 9, phone: '+15155550134', firstSeenAt: '2026-10-01T15:00:00.000Z', lastActivityAt: '2026-10-02T15:00:00.000Z' });
  const newer = contact({
    id: 4, phone: null, email: 'sarah@example.com', name: 'Sarah K', stage: 'booked', source: 'form', stageChangedAt: '2026-10-06T10:00:00.000Z',
    utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'spring', firstSeenAt: '2026-10-05T15:00:00.000Z', lastActivityAt: '2026-10-06T15:00:00.000Z',
    quoteSentAt: '2026-10-05T16:00:00.000Z',
  });
  const plan = mergeDecision(newer, older);
  assert.equal(plan.keepId, 9);
  assert.equal(plan.dropId, 4);
  assert.equal(plan.merged.phone, '+15155550134');
  assert.equal(plan.merged.email, 'sarah@example.com');
  assert.equal(plan.merged.name, 'Sarah K');
  assert.equal(plan.merged.stage, 'booked');
  assert.equal(plan.merged.stageChangedAt, '2026-10-06T10:00:00.000Z');
  assert.equal(plan.merged.source, 'call');
  assert.equal(plan.merged.utmSource, 'google');
  assert.equal(plan.merged.firstSeenAt, '2026-10-01T15:00:00.000Z');
  assert.equal(plan.merged.lastActivityAt, '2026-10-06T15:00:00.000Z');
  assert.equal(plan.merged.quoteSentAt, '2026-10-05T16:00:00.000Z');
});

test('mergeDecision: same first-seen time keeps the lower id; between Won and Lost the later mark wins', () => {
  const a = contact({ id: 3, stage: 'won', stageChangedAt: '2026-10-03T00:00:00.000Z', quoteSentAt: '2026-10-02T00:00:00.000Z' });
  const b = contact({ id: 2, phone: null, email: 'b@example.com', stage: 'lost', stageChangedAt: '2026-10-04T00:00:00.000Z', quoteSentAt: '2026-10-01T00:00:00.000Z' });
  const plan = mergeDecision(a, b);
  assert.equal(plan.keepId, 2);
  assert.equal(plan.merged.stage, 'lost');
  assert.equal(plan.merged.phone, '+15155550134');
  assert.equal(plan.merged.quoteSentAt, '2026-10-01T00:00:00.000Z');
});

test('which texts become which timeline events', () => {
  assert.equal(messageEventKind('inbound', 'inbound'), 'text_in');
  assert.equal(messageEventKind('outbound', 'alert'), null);
  assert.equal(messageEventKind('outbound', 'sequence'), 'sequence');
  assert.equal(messageEventKind('outbound', 'reminder'), 'reminder');
  assert.equal(messageEventKind('outbound', 'text_back'), 'text_out');
  assert.equal(messageEventKind('outbound', 'manual'), 'text_out');
  assert.equal(messageEventKind('outbound', 'confirm'), 'text_out');
  assert.equal(sourceForKind('text_in'), 'text');
  assert.equal(sourceForKind('form'), 'form');
});

test('automatic sends and bookkeeping do not count as the lead doing something', () => {
  assert.equal(isLeadActivity('call', {}), true);
  assert.equal(isLeadActivity('text_out', { automatic: false }), true);
  assert.equal(isLeadActivity('text_out', { automatic: true }), false);
  assert.equal(isLeadActivity('sequence', {}), false);
  assert.equal(isLeadActivity('alert', {}), false);
  assert.equal(isLeadActivity('note', {}), false);
});

test('one-line summaries', () => {
  assert.equal(eventSummary('call', { outcome: 'missed', textedBack: true }), 'missed, texted back');
  assert.equal(eventSummary('call', { outcome: 'missed', textedBack: false }), 'missed');
  assert.equal(eventSummary('call', { outcome: 'answered', durationSeconds: 134 }), 'answered · 2:14');
  assert.equal(eventSummary('call', { outcome: 'answered', durationSeconds: 134, direction: 'connect' }), 'you called them back · 2:14');
  assert.equal(eventSummary('call', { outcome: 'missed', direction: 'connect' }), 'call-back did not connect');
  assert.equal(eventSummary('text_in', { body: 'still open Saturday?' }), '"still open Saturday?"');
  assert.equal(eventSummary('text_in', { body: 'x'.repeat(80) }), `"${'x'.repeat(59)}…"`);
  assert.equal(eventSummary('text_out', { automatic: true, messageKind: 'text_back' }), 'texted back automatically');
  assert.equal(eventSummary('text_out', { automatic: false, body: 'On my way' }), '"On my way"');
  assert.equal(eventSummary('form', { message: 'water heater quote' }), '"water heater quote"');
  assert.equal(eventSummary('form', {}), 'sent your form');
  assert.equal(eventSummary('click', { name: 'call', path: '/services' }), 'tapped call button on services');
  assert.equal(eventSummary('sequence', { channel: 'email' }), 'follow-up email sent');
  assert.equal(eventSummary('note', { text: 'Tapped "Job done"' }), 'Tapped "Job done"');
  assert.equal(eventSummary('alert', { channel: 'sms' }), 'you were sent a text about this lead');
  assert.equal(eventSummary('alert', { channel: 'email' }), 'you were emailed about this lead');
  assert.equal(eventSummary('alert', { channel: 'push' }), 'you were sent a notification');
});

test('toDashboardContact masks the number and the email (Review Focus 1)', () => {
  const both = toDashboardContact(contact({ email: 'sarah.k@example.com', name: 'Sarah Kim', quoteSentAt: '2026-10-02T00:00:00.000Z' }), { kind: 'call', summary: 'missed, texted back' }, false);
  const json = JSON.stringify(both);
  assert.equal(both.who, '(515) 555-01··');
  assert.doesNotMatch(json, /0134/);
  assert.doesNotMatch(json, /\+1515/);
  assert.doesNotMatch(json, /example\.com/);
  assert.doesNotMatch(json, /2026-10-02/); // the quote time itself stays server-side
  assert.equal(both.lastVerb, 'Called');
  assert.equal(both.lastSummary, 'missed, texted back');
  assert.equal(both.hasEmail, true);
  assert.equal(both.quoteSent, true);
  const emailOnly = toDashboardContact(contact({ phone: null, email: 'sarah.k@example.com', source: 'form' }), null, false);
  assert.equal(emailOnly.who, 'sarah.k@…');
  assert.equal(emailOnly.hasPhone, false);
  assert.equal(emailOnly.quoteSent, false);
  assert.equal(emailOnly.sourceLabel, 'Your website form');
  assert.equal(toDashboardContact(contact({ utmSource: 'google', utmMedium: 'cpc' }), null, true).sourceLabel, 'Google Ads');
  assert.equal(maskEmail('averyveryverylongname@x.co'), 'averyveryver@…');
  assert.equal(shortName('Mike Rogers'), 'Mike R.');
  assert.equal(shortName('Cher'), 'Cher');
  assert.equal(shortName(null), null);
});

test('toDashboardEvent: calls carry the sid for the recording route, texts their words, forms their fields', () => {
  const call = toDashboardEvent(event({ kind: 'call', summary: 'answered · 2:14', payload: { callSid: 'CA1', outcome: 'answered', durationSeconds: 134, hasRecording: true } }));
  assert.deepEqual(call.call, { callSid: 'CA1', outcome: 'answered', durationSeconds: 134, hasRecording: true });
  assert.equal(call.text, null);
  const typed = toDashboardEvent(event({ kind: 'text_out', payload: { body: 'On my way', automatic: false, messageKind: 'manual' } }));
  assert.equal(typed.text, 'On my way');
  assert.equal(typed.automatic, false);
  const email = toDashboardEvent(event({ kind: 'sequence', payload: { channel: 'email', step: 0 } }));
  assert.equal(email.text, null);
  assert.equal(email.automatic, true);
  const form = toDashboardEvent(event({ kind: 'form', payload: { name: 'Sarah', message: 'Leaky faucet', page: '/contact' } }));
  assert.deepEqual(form.fields, [{ label: 'Name', value: 'Sarah' }, { label: 'Message', value: 'Leaky faucet' }, { label: 'Page', value: 'contact' }]);
});

test('toDashboardEvent: an attachment-only Facebook or Instagram DM reads "Sent a photo", never an empty bubble', () => {
  const photo = toDashboardEvent(event({ kind: 'messenger', summary: '[photo]', payload: { direction: 'in', body: '', attachments: ['image'] } }));
  assert.equal(photo.text, 'Sent a photo');
  assert.equal(photo.metaDirection, 'in');
  const many = toDashboardEvent(event({ kind: 'instagram', summary: '[photo] [photo]', payload: { direction: 'in', body: '', attachments: ['image', 'image'] } }));
  assert.equal(many.text, 'Sent 2 photos');
  const mixed = toDashboardEvent(event({ kind: 'instagram', payload: { direction: 'in', body: '', attachments: ['image', 'audio'] } }));
  assert.equal(mixed.text, 'Sent 2 attachments');
  const unknown = toDashboardEvent(event({ kind: 'messenger', payload: { direction: 'in', body: '', attachments: ['fallback'] } }));
  assert.equal(unknown.text, 'Sent an attachment');
  const none = toDashboardEvent(event({ kind: 'messenger', payload: { direction: 'in' } }));
  assert.equal(none.text, 'Sent an attachment');
  // Words win when there are any; a URL-looking attachment type is never echoed.
  const worded = toDashboardEvent(event({ kind: 'messenger', payload: { direction: 'in', body: 'Here it is', attachments: ['image'] } }));
  assert.equal(worded.text, 'Here it is');
  assert.equal(toDashboardEvent(event({ kind: 'messenger', payload: { direction: 'in', body: '', attachments: ['https://evil.example/x'] } })).text, 'Sent an attachment');
  // An empty SMS stays as it was (slice 4).
  assert.equal(toDashboardEvent(event({ kind: 'text_in', payload: { body: '' } })).text, '');
});

test('cursors round-trip and reject junk', () => {
  const c = encodeCursor('2026-10-13T14:05:00.123Z', 42);
  assert.deepEqual(decodeCursor(c), { at: '2026-10-13T14:05:00.123Z', id: 42 });
  assert.equal(decodeCursor('abc'), null);
  assert.equal(decodeCursor('1_0'), null);
  assert.equal(decodeCursor(null), null);
});

test('canReplyNow: quiet from 8 pm to 8 am Central, held to 8 am (Review Focus 4)', () => {
  // October 2026 is CDT, UTC-5.
  assert.deepEqual(canReplyNow(new Date('2026-10-13T13:00:00Z'), 'America/Chicago'), { ok: true }); // 8:00 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T00:59:00Z'), 'America/Chicago'), { ok: true }); // 7:59 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T01:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 8:00 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-14T02:30:45Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // 9:30 pm
  assert.deepEqual(canReplyNow(new Date('2026-10-13T12:59:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-13T13:00:00.000Z' }); // 7:59 am
  assert.deepEqual(canReplyNow(new Date('2026-10-14T05:00:00Z'), 'America/Chicago'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' }); // midnight
  // A wrong zone falls back to Central rather than throwing.
  assert.deepEqual(canReplyNow(new Date('2026-10-14T01:00:00Z'), 'Mars/Olympus'), { ok: false, sendAt: '2026-10-14T13:00:00.000Z' });
  assert.equal(QUIET_WINDOW, '8 pm to 8 am');
  assert.match(quietNotice('2026-10-14T13:00:00.000Z', 'America/Chicago', true), /^Quiet hours \(8 pm to 8 am\): your text goes out Wed 8:00\sAM\.$/);
  assert.match(quietNotice('2026-10-14T13:00:00.000Z', 'Mars/Olympus', false), /8 pm to 8 am.*Wed 8:00\sAM/);
});

test('replyBlocker: the order a reply is refused in (Review Focus 4)', () => {
  assert.equal(replyBlocker({ hasPhone: false, optedOut: true, texting: 'none' }), 'no_phone');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: true, texting: 'pending' }), 'opted_out');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'none' }), 'no_line');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'pending' }), 'sms_pending');
  assert.equal(replyBlocker({ hasPhone: true, optedOut: false, texting: 'ready' }), null);
  assert.equal(textingState(null), 'none');
  assert.equal(textingState({ status: 'released', smsStatus: 'ready' }), 'none');
  assert.equal(textingState({ status: 'active', smsStatus: 'pending' }), 'pending');
  assert.equal(textingState({ status: 'active', smsStatus: 'ready' }), 'ready');
});

test('reply bodies: trimmed, not empty, at most two texts long', () => {
  assert.deepEqual(validateReplyBody('  On my way  '), { ok: true, body: 'On my way' });
  assert.deepEqual(validateReplyBody('   '), { ok: false, reason: 'empty' });
  assert.deepEqual(validateReplyBody(7), { ok: false, reason: 'empty' });
  assert.deepEqual(validateReplyBody('x'.repeat(321)), { ok: false, reason: 'too_long' });
});

test('relativeWhen in Central time', () => {
  const now = new Date('2026-10-13T19:00:00Z'); // 2:00 pm CDT, a Tuesday
  assert.equal(relativeWhen('2026-10-13T18:59:40Z', now), 'just now');
  assert.equal(relativeWhen('2026-10-13T18:58:00Z', now), '2 min ago');
  assert.match(relativeWhen('2026-10-13T14:05:00Z', now), /^9:05\sAM$/);
  assert.equal(relativeWhen('2026-10-12T14:05:00Z', now), 'Mon');
  assert.equal(relativeWhen('2026-09-30T14:05:00Z', now), 'Sep 30');
});

test('the inbox is AxeonCORE and up', () => {
  assert.equal(inboxEnabled('essentials'), false);
  assert.equal(inboxEnabled('axeoncore'), true);
  assert.equal(inboxEnabled('axeongrowth'), true);
});

test('heldReplyStatus: an interrupted or unclear send reads "may have gone out", never "did not go out"', () => {
  assert.equal(heldReplyStatus('held', null), 'held');
  assert.equal(heldReplyStatus('sending', null), 'held');
  assert.equal(heldReplyStatus('failed', 'interrupted'), 'unclear');
  assert.equal(heldReplyStatus('failed', 'unclear: socket hang up'), 'unclear');
  assert.equal(heldReplyStatus('failed', 'Twilio 21610'), 'failed');
  assert.equal(heldReplyStatus('failed', 'no_phone'), 'failed');
  assert.equal(heldReplyStatus('failed', null), 'failed');
});

test('heldReplyStatus: a held reply refused because they opted out says so, never "send it again"', () => {
  assert.equal(heldReplyStatus('failed', 'opted_out'), 'opted_out');
  assert.equal(HELD_REPLY_COPY.opted_out, 'This person asked not to be texted.');
  assert.equal(/send it again/i.test(HELD_REPLY_COPY.opted_out), false);
  assert.equal(heldReplyStatus('failed', 'number_changed'), 'failed');
});

test('live reply copy: unclear asks for a refresh, a definite failure asks to try again', () => {
  assert.equal(REPLY_UNCLEAR_COPY, 'This text may have gone out. Refresh and check the thread before you send it again.');
  assert.equal(REPLY_REFUSAL_COPY.send_failed, 'Your text did not go out. Try again.');
  assert.equal(isReplyRefusal('send_failed'), true);
});

test('unmatchedTaps: BIGSERIAL ids arrive as strings and still match the attached set', () => {
  const rows = [{ id: '11' }, { id: '12' }, { id: 13 }] as Array<{ id: number | string }>;
  assert.deepEqual(unmatchedTaps(rows, new Set([11, 13])), [{ id: '12' }]);
  assert.deepEqual(unmatchedTaps(rows, new Set()), rows);
});

test('contactWho: a DM-only contact reads by channel, never "Unknown"; a named one does not double its name', () => {
  assert.equal(contactWho({ phone: null, email: null, source: 'messenger' }), 'Facebook message');
  assert.equal(contactWho({ phone: null, email: null, source: 'instagram' }), 'Instagram message');
  assert.equal(contactWho({ phone: null, email: null }), 'Unknown');
  assert.equal(contactWho({ phone: '+15155550134', email: null, source: 'messenger' }), contactWho({ phone: '+15155550134', email: null }));
  const dm = toDashboardContact(contact({ phone: null, name: 'Mike Rogers', source: 'messenger' }), null, false);
  assert.equal(dm.who, 'Facebook message');
  assert.equal(dm.name, 'Mike Rogers');
});
