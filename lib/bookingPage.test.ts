// lib/bookingPage.test.ts
// Run with: npm run test:booking
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonForScript, renderBookingPage, renderCancelPage, renderNoticePage } from './bookingPage';

const cfg = { site: 'ax_abcdefghjkmnpq', api: '/api/book/ax_abcdefghjkmnpq', business: 'A-1 Auto Detailing', services: ['Full detail'], timeZone: 'America/Chicago', embed: false };

test('the booking page escapes the business name and loads only our own script', () => {
  const page = renderBookingPage({ ...cfg, business: "Bob's <script>alert(1)</script> & Sons" });
  assert.ok(!page.includes('<script>alert(1)</script>'));
  assert.ok(page.includes('Bob&#39;s &lt;script&gt;alert(1)&lt;/script&gt; &amp; Sons'));
  assert.ok(page.includes('<script src="/book-page.js" defer></script>'));
  assert.ok(page.includes('<meta name="robots" content="noindex,nofollow">'));
  assert.ok(!/googletagmanager|clarity\.ms|apollo|\/t\.js/.test(page));
});

test('embedded, the page drops its header so the client site supplies the heading', () => {
  const embedded = renderBookingPage({ ...cfg, embed: true });
  assert.ok(embedded.includes('<body class="embed">'));
  assert.ok(!embedded.includes('<h1>'));
  assert.ok(renderBookingPage(cfg).includes('<h1>A-1 Auto Detailing</h1>'));
});

test('jsonForScript cannot close the script tag and still parses back', () => {
  const value = { business: '</script><script>alert(1)</script> & co' };
  const out = jsonForScript(value);
  assert.ok(!out.includes('</script>'));
  assert.ok(!out.includes('&'));
  assert.deepEqual(JSON.parse(out), value);
});

test('the cancel page asks first with a POST form; the other states have no form', () => {
  const p = renderCancelPage({ state: 'confirm', business: 'A&B <Detail>', when: 'Tue, Oct 13 at 2:00 PM', service: 'Full detail', action: '/b/ax_abcdefghjkmnpq/cancel/tok' });
  assert.match(p, /<form method="post" action="\/b\/ax_abcdefghjkmnpq\/cancel\/tok">/);
  assert.ok(p.includes('A&amp;B &lt;Detail&gt;'));
  assert.ok(!p.includes('<script'));
  for (const state of ['already', 'past', 'not_found'] as const) assert.ok(!renderCancelPage({ state }).includes('<form'));
  assert.match(renderCancelPage({ state: 'cancelled', business: 'A-1', when: 'Tue, Oct 13 at 2:00 PM' }), /is cancelled/);
  assert.match(renderNoticePage({ title: 'Online booking', message: 'Not <here>' }), /Not &lt;here&gt;/);
});
