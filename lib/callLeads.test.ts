// lib/callLeads.test.ts
// Run with: npm run test:onboarding   (tsx --test, no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvToImportRows, isOutcome, parseCsv } from './callLeads';

test('parseCsv handles quoted commas, doubled quotes and CRLF', () => {
  const rows = parseCsv('a,b,c\r\n"x, y","say ""hi""",3\r\n\r\n');
  assert.deepEqual(rows, [
    ['a', 'b', 'c'],
    ['x, y', 'say "hi"', '3'],
  ]);
});

test('csvToImportRows maps the spreadsheet columns and normalizes values', () => {
  const csv = [
    'Priority,Business,City,Region,Phone,Website,Site status,Google rating,Reviews,Axeon status,Source,Maps URL,Why this priority,Notes',
    'A,Example Detailing,Ames,Other Iowa,(515) 555-0100,,No website,4.9,42,Not contacted,Google Maps,https://maps.example/x,"No real site, proven business",',
    'zz,"Shine, Inc",,,515-555-0101,https://example.com,Has website,,,,HubSpot,,,"HubSpot site status: weak"',
    ',,,,,,,,,,,,,',
  ].join('\n');
  const rows = csvToImportRows(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].business, 'Example Detailing');
  assert.equal(rows[0].priority, 'A');
  assert.equal(rows[0].rating, 4.9);
  assert.equal(rows[0].reviews, 42);
  assert.equal(rows[0].why, 'No real site, proven business');
  assert.equal(rows[1].business, 'Shine, Inc');
  assert.equal(rows[1].priority, 'D', 'unknown priority falls back to D');
  assert.equal(rows[1].rating, null);
  assert.equal(rows[1].reviews, null);
  assert.equal(rows[1].notes, 'HubSpot site status: weak');
});

test('csvToImportRows accepts header aliases and rejects a sheet without a business column', () => {
  const rows = csvToImportRows('name,phone,review count\nAcme,555,12');
  assert.equal(rows[0].business, 'Acme');
  assert.equal(rows[0].reviews, 12);
  assert.throws(() => csvToImportRows('foo,bar\n1,2'), /Business/);
});

test('isOutcome only accepts known outcomes', () => {
  assert.equal(isOutcome('interested'), true);
  assert.equal(isOutcome('won'), false);
  assert.equal(isOutcome(3), false);
});
