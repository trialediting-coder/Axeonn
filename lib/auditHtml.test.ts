// lib/auditHtml.test.ts
// Run with: npx tsx --test lib/auditHtml.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlChecks, isPrivateAddress, isPublicHostname } from './auditHtml';

test('htmlChecks finds tel links, forms, title, description and JSON-LD types', () => {
  const html = `<!doctype html><html><head><TITLE> Joe&#39;s Auto Spa &amp; Wash </TITLE>
    <META content='Ankeny detailing since 2010' NAME="description">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"LocalBusiness","name":"x"},{"@type":["WebSite","Thing"]}]}</script>
    <script type='application/ld+json'>not json</script>
    </head><body><A HREF='tel:+15155550100'>Call</A><FORM action="/contact"><input></FORM></body></html>`;
  const c = htmlChecks(html);
  assert.equal(c.clickToCall, true);
  assert.equal(c.form, true);
  assert.equal(c.title, "Joe's Auto Spa & Wash");
  assert.equal(c.metaDescription, 'Ankeny detailing since 2010');
  assert.deepEqual(c.schema, ['LocalBusiness', 'WebSite', 'Thing']);
});

test('htmlChecks on a bare page', () => {
  const c = htmlChecks('<html><body><p>hi</p></body></html>');
  assert.deepEqual(c, { clickToCall: false, form: false, title: null, metaDescription: null, schema: [] });
});

test('isPrivateAddress covers loopback, RFC1918, link-local, CGNAT and IPv6 locals', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:10.0.0.1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '172.32.0.1', '100.128.0.1', '2606:4700::1111']) assert.equal(isPrivateAddress(ip), false, ip);
});

test('isPublicHostname rejects local names', () => {
  assert.equal(isPublicHostname('localhost'), false);
  assert.equal(isPublicHostname('db.internal'), false);
  assert.equal(isPublicHostname('printer.local'), false);
  assert.equal(isPublicHostname('subjectspa.com'), true);
});
