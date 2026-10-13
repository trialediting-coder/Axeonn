// lib/auditParse.test.ts
// Run with: npx tsx --test lib/auditParse.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBusinessInfo, parseMapsItems, parseOrganicItems } from './auditParse';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => JSON.parse(readFileSync(path.join(here, '__fixtures__', 'dataforseo', name), 'utf8')) as { tasks: Array<{ result: unknown[] }> };
const result = (name: string) => fixture(name).tasks[0].result[0];

test('parseMapsItems skips ads, uses rank_group, and normalises rating / cid / categories', () => {
  const items = parseMapsItems(result('maps.json'));
  assert.deepEqual(items.map((i) => [i.rank, i.name]), [[1, 'Example Shine Co'], [2, 'Sample Detail Works'], [3, 'Demo Mobile Detail'], [7, 'Joes Auto Spa']]);
  assert.equal(items[0].rating, 4.9);
  assert.equal(items[0].reviews, 212);
  assert.equal(items[1].cid, '222', 'numeric cid becomes a string');
  assert.equal(items[1].domain, null);
  assert.deepEqual(items[0].categories, ['Car detailing service', 'Car wash']);
  assert.equal(items[0].gbpUrl, 'https://maps.google.com/?cid=111');
  assert.equal(items[3].lat, 41.735);
});

test('parseMapsItems survives a null result or no items', () => {
  assert.deepEqual(parseMapsItems(null), []);
  assert.deepEqual(parseMapsItems(undefined), []);
  assert.deepEqual(parseMapsItems({ keyword: 'x', items: null }), []);
  assert.deepEqual(parseMapsItems({ items: [{ type: 'maps_search', title: '', rank_group: 1 }] }), [], 'nameless rows are dropped');
});

test('parseOrganicItems keeps organic rows only', () => {
  const rows = parseOrganicItems(result('organic.json'));
  assert.deepEqual(rows, [
    { rank: 1, domain: 'yelp.test', title: 'Top 10 Best Auto Detailing in Ankeny' },
    { rank: 2, domain: 'www.subjectspa.com', title: "Joe's Auto Spa | Ankeny" },
  ]);
  assert.deepEqual(parseOrganicItems(null), []);
});

test('parseBusinessInfo returns one MapsItem (rank 0) or null', () => {
  const b = parseBusinessInfo(result('business_info.json'));
  assert.equal(b?.name, 'Joes Auto Spa');
  assert.equal(b?.reviews, 18);
  assert.equal(b?.placeId, 'ChIJsubj');
  assert.equal(b?.rank, 0);
  assert.equal(parseBusinessInfo({ items: [] }), null);
  assert.equal(parseBusinessInfo(null), null);
});
