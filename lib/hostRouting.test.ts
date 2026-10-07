// lib/hostRouting.test.ts
// Run with: npm run test:onboarding
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideHostRoute } from './hostRouting';

const SITE = 'https://axeonstudio.co';
const APP = 'https://app.axeonstudio.co';
const route = (host: string, pathname: string, search = '') =>
  decideHostRoute({ host, pathname, search, siteOrigin: SITE, appOrigin: APP });

test('the bare app address shows AxeonPROOF without changing the URL', () => {
  assert.deepEqual(route('app.axeonstudio.co', '/'), { type: 'rewrite', path: '/proof' });
  assert.deepEqual(route('app.axeonstudio.co', '/proof'), { type: 'redirect', url: `${APP}/`, permanent: false });
});

test('the app host serves the admin, portals, AxeonPROOF pages, APIs and assets', () => {
  for (const p of ['/admin', '/admin/login', '/admin/onboarding/ABC', '/welcome/ABCDEFGHJKMNPQRSTUVW', '/proof/forgot', '/proof/reset/x', '/api/proof/login', '/api/stripe/webhook', '/_next/static/x.js', '/icon.png']) {
    assert.deepEqual(route('app.axeonstudio.co', p), { type: 'next' }, p);
  }
});

test('marketing paths on the app host go back to the main site, keeping the query', () => {
  assert.deepEqual(route('app.axeonstudio.co', '/pricing', '?a=1'), { type: 'redirect', url: `${SITE}/pricing?a=1`, permanent: true });
  assert.deepEqual(route('app.axeonstudio.co', '/sitemap.xml'), { type: 'redirect', url: `${SITE}/sitemap.xml`, permanent: true });
  assert.deepEqual(route('app.axeonstudio.co', '/robots.txt'), { type: 'robots-disallow' });
});

test('app links on the main site forward to the app host', () => {
  assert.deepEqual(route('axeonstudio.co', '/admin/billing'), { type: 'redirect', url: `${APP}/admin/billing`, permanent: true });
  assert.deepEqual(route('axeonstudio.co', '/welcome/ABCDEFGHJKMNPQRSTUVW'), { type: 'redirect', url: `${APP}/welcome/ABCDEFGHJKMNPQRSTUVW`, permanent: true });
  assert.deepEqual(route('axeonstudio.co', '/proof'), { type: 'redirect', url: `${APP}/`, permanent: true });
});

test('the main site, its APIs, previews and localhost are untouched', () => {
  for (const [host, p] of [
    ['axeonstudio.co', '/'],
    ['axeonstudio.co', '/pricing'],
    ['axeonstudio.co', '/api/stripe/webhook'],
    ['axeonstudio.co', '/api/get-started/lead'],
    ['axeon-git-main-hatem21.vercel.app', '/admin'],
    ['localhost:3000', '/'],
  ]) {
    assert.deepEqual(route(host, p), { type: 'next' }, `${host}${p}`);
  }
});

test('without APP_URL the app host equals the main site and nothing is rerouted', () => {
  assert.deepEqual(decideHostRoute({ host: 'axeonstudio.co', pathname: '/admin', search: '', siteOrigin: SITE, appOrigin: SITE }), { type: 'next' });
});
