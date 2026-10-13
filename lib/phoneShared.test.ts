// lib/phoneShared.test.ts
// Run with: npm run test:phone   (tsx --test, no database or Twilio needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  areaCodeOf, callOutcome, callResultLabel, callerKey, callerLabel, formatCallLength, formatCallWhen,
  formatPhone, isStartWord, isStopWord, maskNumber, normalizePhone, textBackMessage, TEXT_BACK_DEFAULT, toDashboardCall,
} from './phoneShared';

test('normalizePhone turns any US spelling into E.164 and rejects the rest', () => {
  assert.equal(normalizePhone('(515) 555-0134'), '+15155550134');
  assert.equal(normalizePhone('515.555.0134'), '+15155550134');
  assert.equal(normalizePhone('1 515 555 0134'), '+15155550134');
  assert.equal(normalizePhone('+15155550134'), '+15155550134');
  assert.equal(normalizePhone('555-0134'), null);
  assert.equal(normalizePhone('anonymous'), null);
  assert.equal(normalizePhone('sip:bob@example.com'), null);
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(5155550134), null);
});

test('formatPhone, maskNumber and areaCodeOf read an E.164 number', () => {
  assert.equal(formatPhone('+15155550134'), '(515) 555-0134');
  assert.equal(maskNumber('+15155550134'), '(515) 555-01··');
  assert.equal(areaCodeOf('+15155550134'), '515');
  assert.equal(areaCodeOf('nope'), null);
});

test('maskNumber does not throw on a non-US number and hides its last two digits', () => {
  assert.equal(maskNumber('+447700900123'), '+4477009001··');
});

test('isStopWord matches the carrier opt-out words only, any case, trimmed', () => {
  for (const w of ['STOP', 'stop', ' Stop ', 'STOPALL', 'unsubscribe', 'CANCEL', 'end', 'QUIT']) assert.equal(isStopWord(w), true, w);
  assert.equal(isStopWord('please stop calling'), false);
  assert.equal(isStopWord('START'), false);
  assert.equal(isStopWord(''), false);
  assert.equal(isStopWord(undefined), false);
});

test('isStartWord matches the resubscribe words only, any case, trimmed', () => {
  for (const w of ['START', 'start', ' Unstop ', 'yes', 'YES']) assert.equal(isStartWord(w), true, w);
  assert.equal(isStartWord('Yes please'), false);
  assert.equal(isStartWord('STOP'), false);
  assert.equal(isStartWord(''), false);
  assert.equal(isStartWord(undefined), false);
});

test('textBackMessage uses the custom text when set, otherwise the default with the business name', () => {
  assert.equal(textBackMessage('A-1 Auto Detailing', null), TEXT_BACK_DEFAULT.replace('{business}', 'A-1 Auto Detailing'));
  assert.equal(textBackMessage(null, null), TEXT_BACK_DEFAULT.replace('{business}', 'us'));
  assert.equal(textBackMessage('A-1', '  Hey, we missed you & we will call back.  '), 'Hey, we missed you & we will call back.');
  assert.equal(textBackMessage('A-1', '   '), TEXT_BACK_DEFAULT.replace('{business}', 'A-1'));
  assert.ok(textBackMessage('A-1', null).length <= 160);
});

test('textBackMessage never escapes or adds markup to the business name', () => {
  assert.ok(textBackMessage('A & B <Co>', null).includes('A & B <Co>'));
});

test('callOutcome treats only a completed dial as answered', () => {
  assert.equal(callOutcome('completed'), 'answered');
  for (const s of ['busy', 'no-answer', 'failed', 'canceled', undefined, 42]) assert.equal(callOutcome(s), 'missed', String(s));
});

test('callerKey keeps any E.164 caller and falls back to unknown', () => {
  assert.equal(callerKey('(515) 555-0134'), '+15155550134');
  assert.equal(callerKey('+447700900123'), '+447700900123');
  assert.equal(callerKey(' +447700900123 '), '+447700900123');
  assert.equal(callerKey('anonymous'), 'unknown');
  assert.equal(callerKey(undefined), 'unknown');
  assert.equal(callerKey('sip:foo@bar'), 'unknown');
});

test('callerLabel shows Unknown or a masked number', () => {
  assert.equal(callerLabel('unknown'), 'Unknown');
  assert.equal(callerLabel('+15155550134'), '(515) 555-01··');
  assert.equal(callerLabel('+447700900123'), '+4477009001··');
});

test('formatCallLength renders m:ss or a dash', () => {
  assert.equal(formatCallLength(134), '2:14');
  assert.equal(formatCallLength(7), '0:07');
  assert.equal(formatCallLength(null), '—');
});

test('formatCallWhen renders weekday and time in Central', () => {
  assert.match(formatCallWhen('2026-10-12T19:05:00Z'), /Mon.*2:05 PM/);
});

test('callResultLabel says answered, missed, or missed and texted back', () => {
  assert.equal(callResultLabel({ outcome: 'answered', textBackSentAt: null }), 'Answered');
  assert.equal(callResultLabel({ outcome: 'missed', textBackSentAt: '2026-10-12T19:06:00Z' }), 'Missed · texted back');
  assert.equal(callResultLabel({ outcome: 'missed', textBackSentAt: null }), 'Missed');
});

test('toDashboardCall keeps only the safe fields and masks the caller', () => {
  const d = toDashboardCall({
    id: 1, callSid: 'CA1', fromNumber: '+15155550134', toNumber: '+15155559999', outcome: 'missed', dialStatus: 'no-answer',
    startedAt: '2026-10-12T19:05:00Z', durationSeconds: null, hasRecording: false, recordingSeconds: null, textBackSentAt: null,
  });
  assert.deepEqual(Object.keys(d).sort(), ['callSid', 'caller', 'durationSeconds', 'hasRecording', 'id', 'outcome', 'startedAt', 'textBackSentAt']);
  assert.equal(d.caller, '(515) 555-01··');
  assert.equal(JSON.stringify(d).includes('5155550134'), false);
});
