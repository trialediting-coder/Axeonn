// lib/pushShared.test.ts
// Run with: npm run test:inbox
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSubscription, leadPushMessage, needsHomeScreenInstall, ownerAlertText, planOwnerFallback, urlBase64ToUint8Array } from './pushShared';

test('a push says what happened and where to look, nothing else (Review Focus 1)', () => {
  assert.deepEqual(leadPushMessage('text', 42), { title: 'New text from a lead', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('call', 42), { title: 'Missed call from a lead', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('form', 42), { title: 'New form from your website', body: 'Open AxeonPROOF to see it and reply.', url: '/proof?tab=leads&contact=42' });
  assert.deepEqual(leadPushMessage('messenger', 7).title, 'New Facebook message from a lead');
  assert.deepEqual(leadPushMessage('instagram', 7).title, 'New Instagram message from a lead');
});

test('the owner text has no lead details either', () => {
  assert.equal(
    ownerAlertText('text', 42, 'https://app.axeonstudio.co/'),
    'New text from a lead. See it and reply in AxeonPROOF: https://app.axeonstudio.co/proof?tab=leads&contact=42',
  );
  assert.equal(
    ownerAlertText('call', 9, 'https://app.axeonstudio.co'),
    'Missed call from a lead. See it and reply in AxeonPROOF: https://app.axeonstudio.co/proof?tab=leads&contact=9',
  );
});

test('subscriptions: https on a known push service, base64url keys', () => {
  const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/abc', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://web.push.apple.com/QGx', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'https://wns2-by3p.notify.windows.com/w/?token=x', keys }), true);
  assert.equal(isValidSubscription({ endpoint: 'http://fcm.googleapis.com/fcm/send/abc', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://169.254.169.254/latest', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://evil.example.com/fcm.googleapis.com', keys }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'has space', auth: 'x' } }), false);
  assert.equal(isValidSubscription({ endpoint: 'https://fcm.googleapis.com/x' }), false);
  assert.equal(isValidSubscription(null), false);
});

test('urlBase64ToUint8Array decodes a VAPID key', () => {
  assert.deepEqual([...urlBase64ToUint8Array('AQID')], [1, 2, 3]);
  assert.deepEqual([...urlBase64ToUint8Array('-_8')], [251, 255]);
});

test('iPhones need PROOF on the Home Screen before push works', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  assert.equal(needsHomeScreenInstall(iphone, false), true);
  assert.equal(needsHomeScreenInstall(iphone, true), false);
  assert.equal(needsHomeScreenInstall('Mozilla/5.0 (Linux; Android 15) Chrome/130.0 Mobile', false), false);
});

test('planOwnerFallback: push first; a text outside quiet hours and an email only when no device took it, once per 30 minutes', () => {
  const day = new Date('2026-10-13T18:00:00Z'); // 1 pm Central
  const night = new Date('2026-10-14T03:00:00Z'); // 10 pm Central
  const early = new Date('2026-10-13T12:59:00Z'); // 7:59 am Central
  const base = { pushed: 0, alertedRecently: false, inboxEnabled: true, lineTimeZone: 'America/Chicago' as string | null, now: day };
  assert.deepEqual(planOwnerFallback(base), { sms: true, email: true });
  // A device took the push: nothing else goes.
  assert.deepEqual(planOwnerFallback({ ...base, pushed: 1 }), { sms: false, email: false });
  assert.deepEqual(planOwnerFallback({ ...base, pushed: 3 }), { sms: false, email: false });
  // Already texted or emailed about this lead in the window: nothing.
  assert.deepEqual(planOwnerFallback({ ...base, alertedRecently: true }), { sms: false, email: false });
  // Not on a plan with the inbox: nothing.
  assert.deepEqual(planOwnerFallback({ ...base, inboxEnabled: false }), { sms: false, email: false });
  // Quiet hours (8 pm to 8 am client-local): the email still goes, the text does not.
  assert.deepEqual(planOwnerFallback({ ...base, now: night }), { sms: false, email: true });
  assert.deepEqual(planOwnerFallback({ ...base, now: early }), { sms: false, email: true });
  // 10 pm Central is 8 pm Pacific: quiet there too; 1 pm Central is 11 am Pacific: fine.
  assert.deepEqual(planOwnerFallback({ ...base, now: night, lineTimeZone: 'America/Los_Angeles' }), { sms: false, email: true });
  assert.deepEqual(planOwnerFallback({ ...base, lineTimeZone: 'America/Los_Angeles' }), { sms: true, email: true });
  // No tracked line: no text (there is nothing to send it from), the email still goes.
  assert.deepEqual(planOwnerFallback({ ...base, lineTimeZone: null }), { sms: false, email: true });
});
