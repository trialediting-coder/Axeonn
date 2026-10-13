// Run with: npm run test:phone
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { afterDialTwiml, emptyTwiml, escapeXml, forwardTwiml } from './phoneTwiml';

test('escapeXml handles all five XML specials and leaves plain text alone', () => {
  assert.equal(escapeXml(`Tom & Jerry's "<shop>"`), 'Tom &amp; Jerry&apos;s &quot;&lt;shop&gt;&quot;');
  assert.equal(escapeXml('plain'), 'plain');
});

test('forwardTwiml dials the forward number with recording and the status action', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: true, recordCalls: true, statusUrl: 'https://x.co/api/phone/voice/status', recordingUrl: 'https://x.co/api/phone/recording' });
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Response>'));
  assert.match(xml, /<Say voice="Polly\.Joanna">This call may be recorded for quality\.<\/Say>/);
  assert.match(xml, /<Dial action="https:\/\/x\.co\/api\/phone\/voice\/status" method="POST" timeout="20" record="record-from-answer-dual" recordingStatusCallback="https:\/\/x\.co\/api\/phone\/recording" recordingStatusCallbackMethod="POST">\+15155550134<\/Dial>/);
  assert.ok(xml.endsWith('</Response>'));
});

test('forwardTwiml drops the notice and the recording when switched off', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: false, recordCalls: false, statusUrl: 'https://x.co/s', recordingUrl: 'https://x.co/r' });
  assert.doesNotMatch(xml, /<Say/);
  assert.doesNotMatch(xml, /record=/);
  assert.doesNotMatch(xml, /recordingStatusCallback/);
  assert.match(xml, /<Dial action="https:\/\/x\.co\/s" method="POST" timeout="20">\+15155550134<\/Dial>/);
});

test('forwardTwiml plays no notice when recording is off, even if consentNotice is on', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: true, recordCalls: false, statusUrl: 'https://x.co/s', recordingUrl: 'https://x.co/r' });
  assert.doesNotMatch(xml, /<Say/);
  assert.doesNotMatch(xml, /record=/);
  assert.doesNotMatch(xml, /recordingStatusCallback/);
});

test('afterDialTwiml tells the caller about the text when one went out, otherwise hangs up', () => {
  assert.match(afterDialTwiml({ textedBack: true }), /<Say voice="Polly\.Joanna">Sorry we missed you\. We just sent you a text, reply there and we will get right back to you\.<\/Say><Hangup\/>/);
  assert.equal(afterDialTwiml({ textedBack: false }), '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
});

test('emptyTwiml is a bare Response', () => {
  assert.equal(emptyTwiml(), '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});
