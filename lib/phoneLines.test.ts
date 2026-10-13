// lib/phoneLines.test.ts
// Run with: npm run test:phone. Pure validation only; SQL lives untested on purpose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAreaCode, validateLineSettings } from './phoneLines';

test('validateLineSettings normalizes the forward number and trims the message', () => {
  const s = validateLineSettings({ forwardTo: '(515) 555-0134', recordCalls: 'yes', consentNotice: false, textBackEnabled: true, textBackMessage: '  We missed you!  ' }, '+15155550199');
  assert.deepEqual(s, {
    forwardTo: '+15155550134', recordCalls: true, consentNotice: false, textBackEnabled: true, textBackMessage: 'We missed you!',
    screenCalls: true, callConnectEnabled: true, timeZone: 'America/Chicago',
  });
});

test('validateLineSettings refuses a bad forward number, a loop to the tracking number, and an over-long text', () => {
  assert.throws(() => validateLineSettings({ forwardTo: '555-0134' }, null), /forward/i);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550199' }, '+15155550199'), /itself/i);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', textBackMessage: 'x'.repeat(321) }, null), /320/);
});

test('validateLineSettings refuses a forward-to that is the line\'s own number, however it is typed', () => {
  assert.throws(() => validateLineSettings({ forwardTo: '(515) 555-0199' }, '+15155550199'), /itself/i);
  assert.throws(() => validateLineSettings({ forwardTo: '1 515 555 0199' }, '+15155550199'), /itself/i);
  // A different number on the same line is fine, and no line yet means no loop to check.
  assert.equal(validateLineSettings({ forwardTo: '515-555-0198' }, '+15155550199').forwardTo, '+15155550198');
  assert.equal(validateLineSettings({ forwardTo: '515-555-0199' }, null).forwardTo, '+15155550199');
});

test('validateLineSettings turns an empty message into null (use the default) and defaults the toggles on', () => {
  const s = validateLineSettings({ forwardTo: '+15155550134', textBackMessage: '   ' }, null);
  assert.equal(s.textBackMessage, null);
  assert.equal(s.recordCalls, true);
  assert.equal(s.consentNotice, true);
  assert.equal(s.textBackEnabled, true);
});

test('validateLineSettings accepts a message of exactly 320 characters', () => {
  assert.equal(validateLineSettings({ forwardTo: '+15155550134', textBackMessage: 'x'.repeat(320) }, null).textBackMessage?.length, 320);
});

test('validateAreaCode wants exactly three digits not starting with 0 or 1', () => {
  assert.equal(validateAreaCode(' 515 '), '515');
  assert.equal(validateAreaCode(319), '319');
  assert.throws(() => validateAreaCode('51'), /area code/i);
  assert.throws(() => validateAreaCode('015'), /area code/i);
  assert.throws(() => validateAreaCode(''), /area code/i);
});

test('validateLineSettings keeps the call screening, call connect and time zone choices', () => {
  const s = validateLineSettings({ forwardTo: '+15155550134', screenCalls: false, callConnectEnabled: 'false', timeZone: 'America/Denver' }, null);
  assert.equal(s.screenCalls, false);
  assert.equal(s.callConnectEnabled, false);
  assert.equal(s.timeZone, 'America/Denver');
});

test('validateLineSettings defaults the time zone to Central and refuses one outside the US list', () => {
  assert.equal(validateLineSettings({ forwardTo: '+15155550134' }, null).timeZone, 'America/Chicago');
  assert.equal(validateLineSettings({ forwardTo: '+15155550134', timeZone: '' }, null).timeZone, 'America/Chicago');
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', timeZone: 'Europe/London' }, null), /US time zone/);
  assert.throws(() => validateLineSettings({ forwardTo: '+15155550134', timeZone: 'CST' }, null), /US time zone/);
});
