// lib/bookingPage.test.ts
// Run with: npm run test:booking
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOOKING_PAGE_CSP, CANCEL_PAGE_CSP, cancelPageHeaders, jsonForScript, renderBookingPage, renderCancelPage, renderNoticePage } from './bookingPage';

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

test('the cancel page cannot be framed; the booking page still can', () => {
  assert.match(CANCEL_PAGE_CSP, /frame-ancestors 'none'/);
  assert.ok(!CANCEL_PAGE_CSP.includes('frame-ancestors *'));
  assert.equal(CANCEL_PAGE_CSP.replace("frame-ancestors 'none'", 'frame-ancestors *'), BOOKING_PAGE_CSP, 'otherwise the same policy');
  const h = cancelPageHeaders();
  assert.equal(h['content-security-policy'], CANCEL_PAGE_CSP);
  assert.equal(h['x-frame-options'], 'DENY');
  assert.equal(h['cache-control'], 'no-store');
  assert.match(BOOKING_PAGE_CSP, /frame-ancestors \*$/);
});

test('the embedded page reports its content height, so the frame can shrink, and book.js applies every report', async () => {
  const { readFileSync } = await import('node:fs');
  const pageJs = readFileSync(new URL('../public/book-page.js', import.meta.url), 'utf8');
  assert.ok(!pageJs.includes('documentElement.scrollHeight'), 'never the document height, which cannot drop below the frame');
  const src = pageJs.match(/function contentHeight\(\) \{[\s\S]*?\n  \}/);
  assert.ok(src, 'contentHeight is defined');
  const measure = (body: { scrollHeight: number; rect: number }) =>
    new Function('document', `${src[0]}; return contentHeight();`)({
      body: { scrollHeight: body.scrollHeight, getBoundingClientRect: () => ({ height: body.rect }) },
      documentElement: { scrollHeight: 1200 },
    }) as number;
  assert.equal(measure({ scrollHeight: 900, rect: 899.4 }), 900);
  assert.equal(measure({ scrollHeight: 410, rect: 409.2 }), 410, 'a shorter card reports a shorter height');
  assert.match(pageJs, /height: contentHeight\(\)/);
  const bookJs = readFileSync(new URL('../public/book.js', import.meta.url), 'utf8');
  assert.match(bookJs, /m\.frame\.style\.height = Math\.max\(320, Math\.min\(4000, Number\(e\.data\.height\) \|\| 0\)\) \+ 'px'/);
});

// readJsonBody (lib/publicSite.ts), the body reader of /api/book/<site> and /api/chat/<site>.
function fakeRequest(chunks: string[], contentLength: string | null) {
  const log = { pulls: 0, cancelled: false };
  const enc = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      log.pulls += 1;
      if (i < chunks.length) controller.enqueue(enc.encode(chunks[i++]));
      else controller.close();
    },
    cancel() {
      log.cancelled = true;
    },
  }, { highWaterMark: 0 });
  const headers = new Headers();
  if (contentLength !== null) headers.set('content-length', contentLength);
  return { req: { headers, body } as unknown as Request, log };
}

test('readJsonBody refuses a declared content-length over the cap without reading the body', async () => {
  const { readJsonBody } = await import('./publicSite');
  const { req, log } = fakeRequest(['{"a":1}'], '99999');
  assert.equal(await readJsonBody(req, 4096), null);
  assert.equal(log.pulls, 0, 'nothing was read');
});

test('readJsonBody caps the bytes it reads when the header is missing or lies', async () => {
  const { readJsonBody } = await import('./publicSite');
  const big = 'x'.repeat(2000);
  for (const header of [null, '10']) {
    const { req, log } = fakeRequest([big, big, big, big, big, big], header);
    assert.equal(await readJsonBody(req, 4096), null);
    assert.ok(log.pulls <= 3, `stopped reading at the cap (pulled ${log.pulls})`);
    assert.equal(log.cancelled, true, 'the rest of the stream is cancelled');
  }
  // Multi-byte text counts in bytes, not characters.
  const { req } = fakeRequest([JSON.stringify({ m: 'é'.repeat(30) })], null);
  assert.equal(await readJsonBody(req, 40), null);
});

test('readJsonBody still reads a small JSON object, and refuses anything that is not one', async () => {
  const { readJsonBody } = await import('./publicSite');
  const ok = fakeRequest(['{"name":"Jane",', '"phone":"515"}'], '29');
  assert.deepEqual(await readJsonBody(ok.req, 4096), { name: 'Jane', phone: '515' });
  assert.equal(await readJsonBody(fakeRequest(['[1,2]'], null).req), null);
  assert.equal(await readJsonBody(fakeRequest(['not json'], null).req), null);
  assert.equal(await readJsonBody(fakeRequest([], null).req), null);
});

test('admin booking writes: settings need a booking plan, done/cancel of an existing booking work on any plan (S5-R13)', async () => {
  const { adminBookingWriteAllowed } = await import('./publicSite');
  assert.equal(adminBookingWriteAllowed('settings', 'essentials'), false);
  assert.equal(adminBookingWriteAllowed('settings', 'axeoncore'), true);
  for (const action of ['done', 'cancel'] as const) {
    assert.equal(adminBookingWriteAllowed(action, 'essentials'), true);
    assert.equal(adminBookingWriteAllowed(action, 'axeoncore'), true);
  }
  const { readFileSync } = await import('node:fs');
  const route = readFileSync(new URL('../app/api/admin/onboarding/[token]/booking/route.ts', import.meta.url), 'utf8');
  const post = route.slice(route.indexOf('export async function POST'));
  assert.ok(post.indexOf('requireAdmin') < post.indexOf('load('), 'admin auth runs first');
  assert.ok(!post.includes('loadIncluded('), 'POST is not plan-gated');
  const put = route.slice(route.indexOf('export async function PUT'), route.indexOf('export async function POST'));
  assert.ok(put.includes('loadIncluded('), 'the settings write stays plan-gated');
});
