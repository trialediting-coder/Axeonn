// lib/siteCrawl.test.ts
// Run with: npx tsx --test lib/siteCrawl.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverageFor, crawlSite, pickInternalLinks } from './siteCrawl';

const HOME = 'https://subjectspa.com/';
const html = `<html><head><title>Home</title></head><body>
  <nav><a href="/services/ceramic-coating">Ceramic</a><a href='https://subjectspa.com/about#team'>About</a><a href="/about">About again</a></nav>
  <a href="${HOME}">Home</a><a href="mailto:x@y.com">mail</a><a href="tel:+15155550100">call</a>
  <a href="https://www.subjectspa.com/contact">Contact</a><a href="https://facebook.com/subjectspa">FB</a>
  <a href="/brochure.pdf">PDF</a><a href="/gallery.jpg">img</a><a href="javascript:void(0)">js</a>
</body></html>`;

test('pickInternalLinks: same host only, http(s) only, no hash, no files, no repeats, keeps order (Review Focus 5)', () => {
  assert.deepEqual(pickInternalLinks(html, HOME), [
    'https://subjectspa.com/services/ceramic-coating',
    'https://subjectspa.com/about',
    'https://www.subjectspa.com/contact',
  ]);
  assert.equal(pickInternalLinks(html, HOME, 1).length, 1);
});

test('coverageFor: every head term (keyword minus city and filler) must appear in one page title, h1 or path', () => {
  const pages = [
    { url: 'https://subjectspa.com/', title: 'Subject Auto Spa | Ankeny', h1: 'Detailing done right' },
    { url: 'https://subjectspa.com/services/ceramic-coating', title: 'Ceramic Coating', h1: null },
  ];
  assert.deepEqual(coverageFor(pages, 'ceramic coating ankeny', 'Ankeny'), { covered: true, url: 'https://subjectspa.com/services/ceramic-coating' });
  assert.deepEqual(coverageFor(pages, 'auto detailing near me', 'Ankeny'), { covered: true, url: 'https://subjectspa.com/' });
  assert.deepEqual(coverageFor(pages, 'paint correction', 'Ankeny'), { covered: false, url: null });
});

test('crawlSite: pages, broken links, thin and untitled counts, coverage, with an injected fetcher', async () => {
  const fetched: string[] = [];
  const fake = async (u: string) => {
    fetched.push(u);
    if (u === HOME) return { status: 200, html, ms: 10 };
    if (u.endsWith('/contact')) return { status: 404, html: '', ms: 5 };
    if (u.endsWith('/about')) return { status: 200, html: '<html><body><p>short</p></body></html>', ms: 5 };
    return { status: 200, html: `<html><head><title>Ceramic Coating</title></head><body><h1>Ceramic Coating in Ankeny</h1><a href="tel:1">c</a>${'word '.repeat(200)}</body></html>`, ms: 7 };
  };
  const r = await crawlSite(HOME, ['ceramic coating ankeny', 'paint correction'], 'Ankeny', fake);
  assert.ok(r.ok);
  assert.equal(r.data.pages.length, 4);
  assert.deepEqual(r.data.broken, ['https://www.subjectspa.com/contact']);
  assert.equal(r.data.thin, 2, 'home (few words) and about are thin');
  assert.equal(r.data.untitled, 1, 'about has no title');
  assert.deepEqual(r.data.coverage.map((c) => [c.keyword, c.covered]), [['ceramic coating ankeny', true], ['paint correction', false]]);
  assert.equal(fetched[0], HOME);
});

// ── Final-review fixes ──
import { fetchPage } from './auditSources';

test('fetchPage re-checks every redirect hop and refuses a private destination (review Critical 1)', async () => {
  const seen: string[] = [];
  const fakeFetch = (async (input: string | URL | Request) => {
    const u = String(input);
    seen.push(u);
    if (u === 'https://subjectspa.com/') return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1:8080/admin' } });
    return new Response('<html><title>secret</title></html>', { status: 200 });
  }) as typeof fetch;
  const check = async (u: URL) => {
    if (u.hostname === '127.0.0.1') throw new Error('That address is not a public website');
  };
  await assert.rejects(() => fetchPage('https://subjectspa.com/', { fetchImpl: fakeFetch, check }), /not a public website/);
  assert.deepEqual(seen, ['https://subjectspa.com/'], 'the private hop was never fetched');
  const ok = await fetchPage('https://subjectspa.com/', {
    fetchImpl: (async (input: string | URL | Request) => (String(input) === 'https://subjectspa.com/' ? new Response(null, { status: 301, headers: { location: 'https://www.subjectspa.com/home' } }) : new Response('<html><title>Home</title></html>', { status: 200 }))) as typeof fetch,
    check: async () => undefined,
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.finalUrl, 'https://www.subjectspa.com/home');
});
