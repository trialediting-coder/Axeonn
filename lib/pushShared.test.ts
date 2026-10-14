// lib/pushShared.test.ts
// Run with: npm run test:inbox
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSubscription, leadPushMessage, needsHomeScreenInstall, ownerAlertText, urlBase64ToUint8Array } from './pushShared';

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
