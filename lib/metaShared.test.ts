// lib/metaShared.test.ts
// Run with: npm run test:meta. Payloads follow the samples in Meta's Messenger
// Platform "Webhook events: messages" and Instagram Messaging webhook docs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captionProblem,
  connectNotice,
  connectOutcome,
  messagePreview,
  metaKindLabel,
  metaTextProblem,
  parseWebhookBody,
  truncateUtf8,
  replyDecision,
  secretRedact,
  verifyChallenge,
  withinMessagingWindow,
} from './metaShared';

const MESSENGER = {
  object: 'page',
  entry: [
    {
      id: '106000000000001',
      time: 1760000000500,
      messaging: [
        {
          sender: { id: '7000000000000001' },
          recipient: { id: '106000000000001' },
          timestamp: 1760000000000,
          message: { mid: 'm_AG5Hz2Uq7tuwNEhXfYYKj8mJEM_QPpz5jdCK48PnKAjSdjfipqxqMvK8ma6AC8fplwlqLP_5cgXIbu7I3rBN0P', text: 'Do you detail boats?' },
        },
        {
          sender: { id: '7000000000000002' },
          recipient: { id: '106000000000001' },
          timestamp: 1760000001000,
          message: { mid: 'm_photo', attachments: [{ type: 'image', payload: { url: 'https://scontent.xx.fbcdn.net/v/t1.15752-9/abc.jpg' } }] },
        },
        // An echo of a message the page itself sent: never a lead.
        { sender: { id: '106000000000001' }, recipient: { id: '7000000000000001' }, timestamp: 1760000002000, message: { mid: 'm_echo', text: 'Yes we do', is_echo: true } },
        // A read receipt: no message object.
        { sender: { id: '7000000000000001' }, recipient: { id: '106000000000001' }, timestamp: 1760000003000, read: { watermark: 1760000002000 } },
      ],
    },
  ],
};

const INSTAGRAM = {
  object: 'instagram',
  entry: [
    {
      id: '17841400000000001',
      time: 1760000100000,
      messaging: [
        {
          sender: { id: '1200000000000001' },
          recipient: { id: '17841400000000001' },
          timestamp: 1760000099000,
          message: { mid: 'aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDAw', text: 'Price for a full interior?', attachments: [{ type: 'ig_reel', payload: { url: 'https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1' } }] },
        },
      ],
    },
  ],
};

test('parseWebhookBody normalizes Messenger messages and skips echoes and read receipts', () => {
  const events = parseWebhookBody(MESSENGER);
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], {
    channel: 'messenger',
    pageOrIgId: '106000000000001',
    senderId: '7000000000000001',
    mid: MESSENGER.entry[0].messaging[0].message!.mid,
    text: 'Do you detail boats?',
    attachments: [],
    timestamp: 1760000000000,
  });
  assert.deepEqual(events[1].attachments, [{ type: 'image', url: 'https://scontent.xx.fbcdn.net/v/t1.15752-9/abc.jpg' }]);
  assert.equal(events[1].text, '');
});

test('parseWebhookBody normalizes Instagram messages under object "instagram"', () => {
  const [e] = parseWebhookBody(INSTAGRAM);
  assert.equal(e.channel, 'instagram');
  assert.equal(e.pageOrIgId, '17841400000000001');
  assert.equal(e.senderId, '1200000000000001');
  assert.equal(e.text, 'Price for a full interior?');
  assert.equal(e.attachments[0].type, 'ig_reel');
});

test('parseWebhookBody refuses other objects, junk, and keeps a duplicated mid once', () => {
  assert.deepEqual(parseWebhookBody({ object: 'user', entry: [] }), []);
  assert.deepEqual(parseWebhookBody(null), []);
  assert.deepEqual(parseWebhookBody('{"object":"page"}'), []);
  assert.deepEqual(parseWebhookBody({ object: 'page', entry: [{ messaging: [{ message: { text: 'no mid or sender' } }] }] }), []);
  const dup = { object: 'page', entry: [MESSENGER.entry[0], MESSENGER.entry[0]] };
  assert.equal(parseWebhookBody(dup).length, 2);
});

test('parseWebhookBody falls back to entry.id and entry.time when the event lacks them', () => {
  const [e] = parseWebhookBody({ object: 'page', entry: [{ id: '55', time: 1760000000000, messaging: [{ sender: { id: '9' }, message: { mid: 'm1', text: 'hi' } }] }] });
  assert.equal(e.pageOrIgId, '55');
  assert.equal(e.timestamp, 1760000000000);
});

test('messagePreview reads attachments as words and caps the line', () => {
  assert.equal(messagePreview({ text: '', attachments: [{ type: 'image', url: null }, { type: 'video', url: null }] }), '[photo] [video]');
  assert.equal(messagePreview({ text: 'Look  at\nthis', attachments: [{ type: 'audio', url: null }] }), 'Look at this [voice message]');
  assert.equal(messagePreview({ text: '', attachments: [{ type: 'mystery', url: null }] }), '[attachment]');
  assert.equal(messagePreview({ text: '', attachments: [] }), '[message]');
  const long = messagePreview({ text: 'x'.repeat(300), attachments: [] });
  assert.equal(long.length, 140);
  assert.ok(long.endsWith('…'));
});

test('withinMessagingWindow allows replies until a minute before 24 hours have passed', () => {
  const last = Date.parse('2026-10-13T12:00:00Z');
  assert.equal(withinMessagingWindow(last, last + 60_000), true);
  assert.equal(withinMessagingWindow(new Date(last).toISOString(), last + 23 * 3600_000), true);
  assert.equal(withinMessagingWindow(last, last + 24 * 3600_000 - 61_000), true);
  assert.equal(withinMessagingWindow(last, last + 24 * 3600_000 - 60_000), false);
  assert.equal(withinMessagingWindow(last, last + 25 * 3600_000), false);
  assert.equal(withinMessagingWindow(null, last), false);
  assert.equal(withinMessagingWindow('not a date', last), false);
});

test('verifyChallenge answers only subscribe requests with the right token', () => {
  const q = (s: string) => new URLSearchParams(s);
  assert.equal(verifyChallenge(q('hub.mode=subscribe&hub.verify_token=s3cret&hub.challenge=1158201444'), 's3cret'), '1158201444');
  assert.equal(verifyChallenge(q('hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1'), 's3cret'), null);
  assert.equal(verifyChallenge(q('hub.mode=unsubscribe&hub.verify_token=s3cret&hub.challenge=1'), 's3cret'), null);
  assert.equal(verifyChallenge(q('hub.mode=subscribe&hub.verify_token=s3cret'), 's3cret'), null);
  assert.equal(verifyChallenge(q('hub.mode=subscribe&hub.verify_token=&hub.challenge=1'), ''), null);
});

test('captionProblem enforces 2,200 characters and 30 hashtags', () => {
  assert.equal(captionProblem('Fresh ceramic coat on a 2024 F-150 #detailing #desmoines'), null);
  assert.equal(captionProblem(''), null);
  assert.match(captionProblem('x'.repeat(2201)) ?? '', /2,200 characters\. This one is 2,201/);
  const tags = Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(' ');
  assert.match(captionProblem(tags) ?? '', /up to 30 hashtags\. This caption has 31/);
  assert.equal(captionProblem(Array.from({ length: 30 }, (_, i) => `#t${i}`).join(' ')), null);
});

test('secretRedact masks token parameters, JSON token fields and bare EAA tokens', () => {
  const url = 'https://graph.facebook.com/v21.0/me/messages?access_token=EAAGm0PX4ZCpsBAabc123&appsecret_proof=deadbeef&x=1';
  assert.equal(secretRedact(url), 'https://graph.facebook.com/v21.0/me/messages?access_token=…&appsecret_proof=…&x=1');
  assert.equal(secretRedact('client_secret=abc&code=AQBx'), 'client_secret=…&code=…');
  assert.equal(secretRedact('{"access_token":"EAAB1234567890abcdef","id":"1"}'), '{"access_token":"…","id":"1"}');
  assert.equal(secretRedact('Invalid OAuth access token - Cannot parse access token: EAAGm0PX4ZCpsBAJZBexample'), 'Invalid OAuth access token - Cannot parse access token: EAA…');
  assert.equal(secretRedact('nothing secret here'), 'nothing secret here');
});

test('replyDecision routes by the last inbound touch and enforces the window before any send', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
  assert.deepEqual(replyDecision({ lastMeta: null, lastOtherInboundAt: hoursAgo(1), hasPhone: true, now }), { route: 'sms' });
  assert.deepEqual(replyDecision({ lastMeta: { channel: 'messenger', at: hoursAgo(2) }, lastOtherInboundAt: null, hasPhone: false, now }), { route: 'meta', channel: 'messenger' });
  assert.deepEqual(replyDecision({ lastMeta: { channel: 'instagram', at: hoursAgo(5) }, lastOtherInboundAt: hoursAgo(1), hasPhone: true, now }), { route: 'sms' });
  assert.deepEqual(replyDecision({ lastMeta: { channel: 'messenger', at: hoursAgo(2) }, lastOtherInboundAt: null, hasPhone: true, now, via: 'sms' }), { route: 'sms' });
  assert.deepEqual(replyDecision({ lastMeta: { channel: 'messenger', at: hoursAgo(30) }, lastOtherInboundAt: null, hasPhone: true, now }), {
    route: 'blocked',
    channel: 'messenger',
    canText: true,
    message: 'Facebook only lets you reply within 24 hours of their last message. Text them instead?',
  });
  const ig = replyDecision({ lastMeta: { channel: 'instagram', at: hoursAgo(30) }, lastOtherInboundAt: null, hasPhone: false, now });
  assert.equal(ig.route, 'blocked');
  assert.equal(ig.route === 'blocked' && ig.canText, false);
  assert.match(ig.route === 'blocked' ? ig.message : '', /^Instagram only lets you reply within 24 hours/);
});

test('metaKindLabel names both directions', () => {
  assert.equal(metaKindLabel('messenger'), 'Facebook message');
  assert.equal(metaKindLabel('instagram', 'out'), 'Instagram reply');
  assert.equal(metaKindLabel('call'), 'call');
});

test('connectNotice maps the callback flags and ignores anything else', () => {
  assert.equal(connectNotice('connected')?.tone, 'ok');
  assert.match(connectNotice('no-pages')?.text ?? '', /tick your business page/);
  assert.equal(connectNotice('cancelled')?.tone, 'warn');
  assert.equal(connectNotice('toString'), null);
  assert.equal(connectNotice(undefined), null);
});

test('metaTextProblem: Messenger 2000 characters, Instagram 1000 UTF-8 bytes', () => {
  assert.equal(metaTextProblem('messenger', 'x'.repeat(2000)), null);
  assert.match(metaTextProblem('messenger', 'x'.repeat(2001)) ?? '', /2000 characters\. This one is 2001/);
  assert.equal(metaTextProblem('messenger', '😀'.repeat(2000)), null);
  assert.equal(metaTextProblem('instagram', 'x'.repeat(1000)), null);
  assert.match(metaTextProblem('instagram', 'x'.repeat(1001)) ?? '', /1000 bytes.*This one is 1001/);
  assert.equal(metaTextProblem('instagram', '😀'.repeat(250)), null);
  assert.match(metaTextProblem('instagram', '😀'.repeat(251)) ?? '', /This one is 1004/);
  assert.match(metaTextProblem('instagram', 'é'.repeat(501)) ?? '', /This one is 1002/);
});

test('truncateUtf8 never splits a surrogate pair or a multi-byte character', () => {
  assert.equal(truncateUtf8('😀😀😀', 9), '😀😀');
  assert.equal(truncateUtf8('aé', 2), 'a');
  assert.equal(truncateUtf8('abc', 10), 'abc');
  const t = truncateUtf8('a😀'.repeat(300), 1000);
  assert.ok(new TextEncoder().encode(t).length <= 1000);
  assert.equal(t, Buffer.from(t, 'utf8').toString('utf8'));
});

test('messagePreview and the webhook text cut on whole characters', () => {
  const p = messagePreview({ text: '😀'.repeat(200), attachments: [] });
  assert.equal(Array.from(p).length, 140);
  assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(p));
  const [e] = parseWebhookBody({ object: 'page', entry: [{ id: '1', messaging: [{ sender: { id: '2' }, message: { mid: 'm', text: '😀'.repeat(4001) } }] }] });
  assert.equal(Array.from(e.text).length, 4000);
});

test('connectOutcome: partial when some pages failed, error when none were saved', () => {
  assert.equal(connectOutcome(2, 0), 'connected');
  assert.equal(connectOutcome(1, 1), 'partial');
  assert.equal(connectOutcome(0, 2), 'error');
  assert.equal(connectOutcome(0, 0), 'error');
  assert.equal(connectNotice('partial')?.tone, 'warn');
  assert.match(connectNotice('partial')?.text ?? '', /not coming in/);
});
