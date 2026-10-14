// lib/chatCrawl.test.ts
// Run with: npm run test:chat   (no network: the fetcher is a fake site)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectPages, extractText, hostLockCheck, sameSite, robotsDisallows, sameOriginLinks, sitemapLocs, type CrawlFetcher } from './chatCrawl';

test('extractText keeps readable words and drops scripts, styles, nav and markup', () => {
  const html = `<html><head><title> A-1 &amp; Sons | Detailing </title><style>p{color:red}</style></head>
    <body><nav><a href="/">Home</a><a href="/about">About</a></nav>
    <h1>Full&nbsp;detail</h1><p>Interior and exterior, from $199.</p><script>var secret = 1;</script>
    <!-- hidden --><footer><p>Open Mon&ndash;Sat. Call (515) 555-0134. It&#39;s easy.</p></footer></body></html>`;
  const { title, text } = extractText(html);
  assert.equal(title, 'A-1 & Sons | Detailing');
  assert.ok(text.includes('Full detail'));
  assert.ok(text.includes('Interior and exterior, from $199.'));
  assert.ok(text.includes('Open Mon–Sat. Call (515) 555-0134. It\'s easy.'));
  assert.ok(!text.includes('secret'));
  assert.ok(!text.includes('color:red'));
  assert.ok(!text.includes('About'));
  assert.ok(!text.includes('hidden'));
  assert.ok(!/<|>/.test(text));
});

test('sameOriginLinks keeps this origin only, without hashes, queries, files or repeats', () => {
  const html = `<a href="/services">S</a><a href='/services#top'>S again</a><a href="/services?ref=nav">S query</a>
    <a href="https://shop.test/about">About</a><a href="https://www.shop.test/contact">www is another origin</a>
    <a href="https://other.test/">Other</a><a href="mailto:x@shop.test">mail</a><a href="tel:+15155550134">call</a>
    <a href="/menu.pdf">PDF</a><a href=/gallery>bare</a><a href="javascript:void(0)">js</a>`;
  assert.deepEqual(sameOriginLinks(html, 'https://shop.test/'), ['https://shop.test/services', 'https://shop.test/about', 'https://shop.test/gallery']);
});

test('robotsDisallows reads the group for everyone or for our bot, longest rule wins', () => {
  assert.equal(robotsDisallows('User-agent: *\nDisallow: /', '/'), true);
  assert.equal(robotsDisallows('User-agent: *\nDisallow:', '/'), false);
  assert.equal(robotsDisallows('User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nAllow: /', '/'), false);
  assert.equal(robotsDisallows('User-agent: AxeonAuditBot\nDisallow: /\n\nUser-agent: *\nAllow: /', '/'), true);
  const rules = 'User-agent: *\nDisallow: /private\nAllow: /private/ok\nDisallow: /*.pdf$';
  assert.equal(robotsDisallows(rules, '/private/x'), true);
  assert.equal(robotsDisallows(rules, '/private/ok'), false);
  assert.equal(robotsDisallows(rules, '/'), false);
  assert.equal(robotsDisallows(rules, '/menu.pdf'), true);
  assert.equal(robotsDisallows(rules, '/menu.pdfx'), false);
  assert.equal(robotsDisallows('', '/'), false);
});

test('sitemapLocs splits pages from child sitemaps and drops other origins', () => {
  const xml = '<urlset><url><loc>https://shop.test/</loc></url><url><loc> https://shop.test/services </loc></url><url><loc>https://other.test/x</loc></url><sitemap><loc>https://shop.test/post-sitemap.xml</loc></sitemap></urlset>';
  assert.deepEqual(sitemapLocs(xml, 'https://shop.test'), { pages: ['https://shop.test/', 'https://shop.test/services'], sitemaps: ['https://shop.test/post-sitemap.xml'] });
});

const LONG = 'We detail cars, trucks and boats in Des Moines and the towns around it every day of the week.';

function fakeSite(pages: Record<string, { status?: number; html: string; finalUrl?: string }>) {
  const fetched: string[] = [];
  const fetcher: CrawlFetcher = async (url) => {
    fetched.push(url);
    const hit = pages[url];
    return hit ? { status: hit.status ?? 200, html: hit.html, finalUrl: hit.finalUrl ?? url } : { status: 404, html: '', finalUrl: url };
  };
  return { fetcher, fetched };
}

test('collectPages follows same-origin links, skips robots-disallowed paths and other sites', async () => {
  const { fetcher, fetched } = fakeSite({
    'https://shop.test/': { html: `<title>Home</title><p>${LONG}</p><a href="/services">S</a><a href="/private/x">P</a><a href="https://other.test/">O</a>` },
    'https://shop.test/robots.txt': { html: 'User-agent: *\nDisallow: /private' },
    'https://shop.test/services': { html: `<title>Services</title><p>Full detail from $199. ${LONG}</p><a href="/">Home</a>` },
  });
  const out = await collectPages('https://shop.test/', fetcher);
  assert.equal(out.blocked, false);
  assert.deepEqual(out.pages.map((p) => [p.url, p.title]), [['https://shop.test/', 'Home'], ['https://shop.test/services', 'Services']]);
  assert.ok(!fetched.includes('https://shop.test/private/x'));
  assert.ok(!fetched.some((u) => u.startsWith('https://other.test')));
});

test('collectPages refuses to crawl when robots.txt disallows the homepage', async () => {
  const { fetcher } = fakeSite({
    'https://shop.test/': { html: `<p>${LONG}</p><a href="/services">S</a>` },
    'https://shop.test/robots.txt': { html: 'User-agent: *\nDisallow: /' },
  });
  assert.deepEqual(await collectPages('https://shop.test/', fetcher), { pages: [], blocked: true, errors: 0 });
});

test('collectPages stops at the page cap and at the time budget, and uses the sitemap', async () => {
  const site: Record<string, { html: string }> = {
    'https://shop.test/': { html: `<p>${LONG}</p>` + Array.from({ length: 50 }, (_, i) => `<a href="/p${i}">p${i}</a>`).join('') },
    'https://shop.test/sitemap.xml': { html: '<urlset><url><loc>https://shop.test/from-sitemap</loc></url></urlset>' },
    'https://shop.test/from-sitemap': { html: `<title>Sitemap page</title><p>${LONG}</p>` },
  };
  for (let i = 0; i < 50; i += 1) site[`https://shop.test/p${i}`] = { html: `<p>Page ${i}. ${LONG}</p>` };
  const capped = await collectPages('https://shop.test/', fakeSite(site).fetcher, { maxPages: 40 });
  assert.equal(capped.pages.length, 40);
  assert.equal(capped.pages[1].url, 'https://shop.test/from-sitemap');

  let clock = 0;
  const slow: CrawlFetcher = async (url) => {
    clock += 10_000;
    return fakeSite(site).fetcher(url);
  };
  const timed = await collectPages('https://shop.test/', slow, { budgetMs: 45_000, now: () => clock });
  assert.ok(timed.pages.length < 5);
});

test('collectPages throws a plain message when the homepage will not load', async () => {
  await assert.rejects(collectPages('https://shop.test/', fakeSite({}).fetcher), /Could not load https:\/\/shop.test\/ \(status 404\)/);
});
test('collectPages refuses a homepage that redirects to another website', async () => {
  const { fetcher } = fakeSite({ 'https://shop.test/': { html: `<p>${LONG}</p>`, finalUrl: 'https://evil.test/' } });
  await assert.rejects(collectPages('https://shop.test/', fetcher), /redirects to another website/);
});

test('collectPages accepts the www variant but drops pages that redirect off-site', async () => {
  const { fetcher } = fakeSite({
    'https://shop.test/': { html: `<p>${LONG}</p><a href="/a">a</a>`, finalUrl: 'https://www.shop.test/' },
    'https://www.shop.test/a': { html: `<p>${LONG}</p>`, finalUrl: 'https://evil.test/a' },
  });
  const out = await collectPages('https://shop.test/', fetcher);
  assert.deepEqual(out.pages.map((p) => p.url), ['https://www.shop.test/']);
});

test('hostLockCheck allows the host and its www variant, and refuses other hosts, IP literals, localhost and non-http schemes', async () => {
  const seen: string[] = [];
  const check = hostLockCheck('https://shop.test/', async (u) => { seen.push(u.hostname); });
  await check(new URL('https://shop.test/x'));
  await check(new URL('http://www.shop.test/'));
  for (const bad of ['https://other.test/', 'http://127.0.0.1/', 'http://localhost/', 'http://169.254.169.254/', 'ftp://shop.test/', 'https://shop.test.evil.test/']) {
    await assert.rejects(check(new URL(bad)), /own website/, bad);
  }
  assert.deepEqual(seen, ['shop.test', 'www.shop.test']);
  assert.equal(sameSite('https://shop.test', 'https://SHOP.test:8443/'), true);
});

test('hostLockCheck still runs the public-address check on allowed hosts', async () => {
  const check = hostLockCheck('https://shop.test/', async () => { throw new Error('That address is not a public website'); });
  await assert.rejects(check(new URL('https://shop.test/')), /not a public website/);
});

test('collectPages caps text per page', async () => {
  const { fetcher } = fakeSite({ 'https://shop.test/': { html: `<p>${'word '.repeat(10_000)}</p>` } });
  const out = await collectPages('https://shop.test/', fetcher);
  assert.ok(out.pages[0].text.length <= 20_000);
});
