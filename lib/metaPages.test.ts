// lib/metaPages.test.ts
// Run with: npm run test:meta. Only the mapper: SQL stays untested on purpose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPublicPage, type PageRow } from './metaPages';

const ROW: PageRow = {
  id: '3',
  onboarding_id: 42,
  page_id: '106000000000001',
  page_name: 'Gonzalez Auto Detailing',
  ig_user_id: '17841400000000001',
  ig_username: 'gonzalezdetailing',
  fb_user_id: '1234567890',
  token_enc: 'v1.AAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBB.CCCC',
  status: 'active',
  last_error: null,
  connected_at: new Date('2026-10-13T12:00:00Z'),
  updated_at: '2026-10-13T12:00:00Z',
};

test('toPublicPage never carries the sealed token or the Facebook user id', () => {
  const page = toPublicPage(ROW);
  assert.deepEqual(Object.keys(page).sort(), ['connectedAt', 'igUserId', 'igUsername', 'lastError', 'pageId', 'pageName', 'status']);
  const json = JSON.stringify(page);
  assert.equal(json.includes('v1.'), false);
  assert.equal(json.includes('1234567890'), false);
  assert.equal(page.connectedAt, '2026-10-13T12:00:00.000Z');
});
