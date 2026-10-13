// Run with: npm run test:phone
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptTwiml, afterDialTwiml, connectDialTwiml, connectLeadNoAnswerTwiml, connectNoAnswerTwiml, connectWhisperTwiml, emptyTwiml, escapeXml, forwardTwiml,
  hangupTwiml, recordingNoticeTwiml, screenTwiml,
} from './phoneTwiml';

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

const XML = '<?xml version="1.0" encoding="UTF-8"?>';

test('forwardTwiml wraps the forward number in a screened <Number> when screenUrl is set', () => {
  const xml = forwardTwiml({ forwardTo: '+15155550134', consentNotice: false, recordCalls: false, statusUrl: 'https://x.co/s', recordingUrl: 'https://x.co/r', screenUrl: 'https://x.co/api/phone/voice/screen?line=7' });
  assert.equal(xml, `${XML}<Response><Dial action="https://x.co/s" method="POST" timeout="20"><Number url="https://x.co/api/phone/voice/screen?line=7" method="POST">+15155550134</Number></Dial></Response>`);
});

test('screenTwiml asks for 1 with the business name and hangs up when nobody presses', () => {
  assert.equal(
    screenTwiml({ businessName: 'Medina Concrete', acceptUrl: 'https://x.co/a' }),
    `${XML}<Response><Gather numDigits="1" timeout="5" action="https://x.co/a" method="POST"><Say voice="Polly.Joanna">Call for Medina Concrete. Press 1 to accept.</Say></Gather><Hangup/></Response>`,
  );
  assert.match(screenTwiml({ businessName: '  ', acceptUrl: 'https://x.co/a' }), /<Say voice="Polly\.Joanna">Call from your tracked phone number\. Press 1 to accept\.<\/Say>/);
  assert.match(screenTwiml({ businessName: "Tom & Jerry's <Shop>", acceptUrl: 'https://x.co/a' }), /Call for Tom &amp; Jerry&apos;s &lt;Shop&gt;\. Press 1/);
});

test('acceptTwiml is an empty document (Twilio bridges) and hangupTwiml hangs up', () => {
  assert.equal(acceptTwiml(), `${XML}<Response></Response>`);
  assert.equal(hangupTwiml(), `${XML}<Response><Hangup/></Response>`);
});

test('connectWhisperTwiml says the lead name safely inside a Gather and falls through to where the details went', () => {
  assert.equal(
    connectWhisperTwiml({ leadName: 'Jane <b>&</b>', gatherUrl: 'https://x.co/api/phone/connect?lead=42', textedDetails: true }),
    `${XML}<Response><Gather numDigits="1" timeout="8" action="https://x.co/api/phone/connect?lead=42" method="POST"><Say voice="Polly.Joanna">New lead from your website: Jane b b. Press 1 to call them now.</Say></Gather><Say voice="Polly.Joanna">Okay. We texted you their details.</Say><Hangup/></Response>`,
  );
  assert.match(connectWhisperTwiml({ leadName: '', gatherUrl: 'https://x.co/c', textedDetails: false }), /your website: someone\. Press 1.*We emailed you their details\./);
});

test('connectNoAnswerTwiml says where the details went and hangs up', () => {
  assert.equal(connectNoAnswerTwiml({ textedDetails: true }), `${XML}<Response><Say voice="Polly.Joanna">Okay. We texted you their details.</Say><Hangup/></Response>`);
  assert.equal(connectNoAnswerTwiml({ textedDetails: false }), `${XML}<Response><Say voice="Polly.Joanna">Okay. We emailed you their details.</Say><Hangup/></Response>`);
});

test('connectLeadNoAnswerTwiml tells the owner the lead did not pick up and hangs up', () => {
  assert.equal(connectLeadNoAnswerTwiml(), `${XML}<Response><Say voice="Polly.Joanna">They didn't pick up. Their details are in your email.</Say><Hangup/></Response>`);
});

test('connectDialTwiml dials the lead from the tracked number, recorded with the notice to the lead, or plain', () => {
  assert.equal(
    connectDialTwiml({ leadPhone: '+15155550134', callerId: '+15155550199', statusUrl: 'https://x.co/st?lead=42', recordingUrl: 'https://x.co/r', noticeUrl: 'https://x.co/n' }),
    `${XML}<Response><Dial callerId="+15155550199" action="https://x.co/st?lead=42" method="POST" timeout="25" record="record-from-answer-dual" recordingStatusCallback="https://x.co/r" recordingStatusCallbackMethod="POST"><Number url="https://x.co/n" method="POST">+15155550134</Number></Dial></Response>`,
  );
  assert.equal(
    connectDialTwiml({ leadPhone: '+15155550134', callerId: '+15155550199', statusUrl: 'https://x.co/st?lead=42', recordingUrl: null, noticeUrl: null }),
    `${XML}<Response><Dial callerId="+15155550199" action="https://x.co/st?lead=42" method="POST" timeout="25"><Number>+15155550134</Number></Dial></Response>`,
  );
});

test('recordingNoticeTwiml plays the notice and ends, so the lead is bridged after it', () => {
  assert.equal(recordingNoticeTwiml(), `${XML}<Response><Say voice="Polly.Joanna">This call may be recorded for quality.</Say></Response>`);
});
