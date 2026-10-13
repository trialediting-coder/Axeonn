// lib/leadEmail.test.ts
// Run with: npm run test:leads. Renders the client's lead email; nothing is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderClientLeadAlert } from './email';

const lead = {
  name: 'Jane <script>alert(1)</script>\r\nBcc: x@y.z',
  phone: '+15155550134',
  email: 'jane@example.com',
  message: 'Hi & <b>bold</b>\nsecond line',
  page: '/quote',
};

test('renderClientLeadAlert escapes everything the visitor typed and keeps the subject on one line', () => {
  const { subject, html } = renderClientLeadAlert({ businessName: 'Medina Concrete', lead, proofUrl: 'https://app.axeonstudio.co/?tab=leads', test: false });
  assert.ok(!/[\r\n]/.test(subject));
  assert.ok(subject.startsWith('New website lead: Jane'));
  assert.ok(!html.includes('<script>'));
  assert.match(html, /Jane &lt;script&gt;alert\(1\)&lt;\/script&gt; Bcc: x@y\.z/);
  assert.match(html, /Hi &amp; &lt;b&gt;bold&lt;\/b&gt;<br>second line/);
  assert.match(html, /href="tel:\+15155550134"[^>]*>\(515\) 555-0134</);
  assert.match(html, /href="mailto:jane@example\.com"/);
  assert.match(html, /Reply to this email to answer them\./);
  assert.match(html, /href="https:\/\/app\.axeonstudio\.co\/\?tab=leads"/);
  assert.doesNotMatch(html, /Questions\? Reply to this email/); // replies go to the lead, so the footer must not invite questions by reply
});

test('renderClientLeadAlert marks a test and says how to reach a lead who left no email', () => {
  const { subject, html } = renderClientLeadAlert({ businessName: null, lead: { ...lead, name: '', email: null }, proofUrl: 'https://app.axeonstudio.co/?tab=leads', test: true });
  assert.equal(subject, '[Test] New website lead: Someone');
  assert.match(html, /This is a test Axeon sent to check your setup/);
  assert.match(html, /They left no email, so call or text them\./);
  assert.match(html, /Email: none left/);
});
