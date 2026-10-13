// lib/pastCustomersShared.test.ts
// Run with: npm run test:sequences
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAST_CUSTOMERS_MAX_ROWS, columnsFor, parseCsv, parseJobDate, parsePastCustomers } from './pastCustomersShared';

test('parseCsv handles quotes, doubled quotes, CRLF, a BOM and blank lines', () => {
  const text = '﻿name,phone\r\n"Smith, Mike","(515) 555-0134"\r\n\r\n"Said ""hi""",5155550135';
  assert.deepEqual(parseCsv(text), [
    ['name', 'phone'],
    ['Smith, Mike', '(515) 555-0134'],
    ['Said "hi"', '5155550135'],
  ]);
  assert.deepEqual(parseCsv(''), []);
});

test('columnsFor finds the columns by header words, and "Last name" is not a job date', () => {
  assert.deepEqual(columnsFor(['Customer Name', 'Mobile', 'E-mail', 'Last job date']), { name: 0, phone: 1, email: 2, lastJob: 3 });
  assert.deepEqual(columnsFor(['First name', 'Last name', 'Phone']), { name: 0, phone: 2 });
  assert.deepEqual(columnsFor(['Client', 'Cell phone', 'Last visit']), { name: 0, phone: 1, lastJob: 2 });
});

test('parseJobDate reads the two common spellings and refuses impossible dates', () => {
  assert.equal(parseJobDate('2025-11-02'), '2025-11-02');
  assert.equal(parseJobDate('3/14/2026'), '2026-03-14');
  assert.equal(parseJobDate('3/14/26'), '2026-03-14');
  assert.equal(parseJobDate('2/30/2026'), null);
  assert.equal(parseJobDate('last spring'), null);
  assert.equal(parseJobDate(''), null);
});

test('parsePastCustomers keeps rows with a US number, dedupes, and says why it skipped the rest', () => {
  const csv = [
    'Customer Name,Mobile,E-mail,Last job date',
    'Mike Smith,515-555-0134,Mike@Example.com,3/14/2026',
    'No Phone,,x@y.co,',
    'Dup,(515) 555-0134,,',
    'Ann Lee,5155550199,,2025-11-02',
  ].join('\n');
  assert.deepEqual(parsePastCustomers(csv), {
    rows: [
      { name: 'Mike Smith', phone: '+15155550134', email: 'mike@example.com', lastJobAt: '2026-03-14' },
      { name: 'Ann Lee', phone: '+15155550199', email: null, lastJobAt: '2025-11-02' },
    ],
    skipped: [
      { line: 3, reason: 'no US cell number' },
      { line: 4, reason: 'same number as an earlier row' },
    ],
  });
});

test('parsePastCustomers reads a file with no header as name, phone, email, last job', () => {
  assert.deepEqual(parsePastCustomers('Mike,5155550134,mike@x.co,2026-01-05').rows, [
    { name: 'Mike', phone: '+15155550134', email: 'mike@x.co', lastJobAt: '2026-01-05' },
  ]);
});

test('parsePastCustomers stops at the row cap', () => {
  const lines = ['name,phone'];
  for (let i = 0; i <= PAST_CUSTOMERS_MAX_ROWS; i++) lines.push(`C${i},515${String(2000000 + i).padStart(7, '0')}`);
  const out = parsePastCustomers(lines.join('\n'));
  assert.equal(out.rows.length, PAST_CUSTOMERS_MAX_ROWS);
  assert.equal(out.skipped.length, 1);
  assert.match(out.skipped[0].reason, /2000/);
});
