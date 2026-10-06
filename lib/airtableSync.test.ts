// lib/airtableSync.test.ts
// Run with: npm run test:onboarding   (pure field builders; no Airtable calls)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compactFields, formulaString } from './airtable';
import { newLeadFields, nextPipelineStatus, portalFields, returningLeadFields } from './airtableSync';
import type { LeadPayload } from './getStarted';
import type { Onboarding } from './onboarding';

const NOW = new Date('2026-10-06T21:05:00Z'); // 4:05 PM Central

const lead: LeadPayload = {
  businessName: 'A-1 Auto Detailing',
  contactName: 'Mike Reyes',
  email: '  Mike@A1Detailing.com ',
  phone: '515-555-0134',
  website: '',
  services: ['Website', 'SEO'],
  packageId: 'axeoncore',
  packageName: 'AxeonCORE',
  packagePrice: 299,
  answers: { businessType: 'Home & trade services', hasWebsite: 'No', goal: 'More calls and leads', budget: 'Under $1,000', timeline: 'As soon as possible' },
  company_fax: '',
};

test('a new lead becomes a Lead row with every answer and no blank fields', () => {
  const f = newLeadFields(lead, NOW);
  assert.equal(f.Email, 'mike@a1detailing.com');
  assert.equal(f.Status, 'Lead');
  assert.equal(f['Lead Source'], 'Website Form');
  assert.equal(f['Business Name'], 'A-1 Auto Detailing');
  assert.deepEqual(f.Services, ['Website', 'SEO']);
  assert.equal(f['Monthly Budget'], 'Under $1,000');
  assert.equal(f['Package Price'], 299);
  assert.equal('Website' in f, false, 'empty website is not sent');
  assert.match(String(f.Notes), /^Website form Oct 6, 2026 4:05 PM\. Recommended: AxeonCORE\.$/);
});

test('a lead with no business or contact name falls back to the email for the primary field', () => {
  const f = newLeadFields({ ...lead, businessName: '', contactName: '' }, NOW);
  assert.equal(f['Business Name'], 'mike@a1detailing.com');
});

test('a returning lead keeps its status, merges services and appends a note', () => {
  const f = returningLeadFields(lead, { Services: ['Meta Ads', 'Website'], Notes: 'Called once.', Status: 'Active' }, NOW);
  assert.equal('Status' in f, false, 'status is never changed for a returning lead');
  assert.deepEqual(f.Services, ['Meta Ads', 'Website', 'SEO']);
  assert.match(String(f.Notes), /^Called once\.\n\nWebsite form resubmitted Oct 6, 2026 4:05 PM\./);
  assert.match(String(f.Notes), /Services picked: Website, SEO\.$/);
});

test('the portal only moves the pipeline forward and never touches Active or Paused', () => {
  assert.equal(nextPipelineStatus('Lead', 'active'), 'Onboarding');
  assert.equal(nextPipelineStatus('Call Booked', 'active'), 'Onboarding');
  assert.equal(nextPipelineStatus('Signed & Paid', 'active'), 'Onboarding');
  assert.equal(nextPipelineStatus(undefined, 'active'), 'Onboarding');
  assert.equal(nextPipelineStatus('Onboarding', 'active'), undefined);
  assert.equal(nextPipelineStatus('Onboarding', 'complete'), 'Access Complete');
  assert.equal(nextPipelineStatus('Lead', 'complete'), 'Access Complete');
  assert.equal(nextPipelineStatus('Access Complete', 'active'), undefined);
  assert.equal(nextPipelineStatus('Active', 'active'), undefined);
  assert.equal(nextPipelineStatus('Active', 'complete'), undefined);
  assert.equal(nextPipelineStatus('Paused', 'complete'), undefined);
  assert.equal(nextPipelineStatus('Lead', 'closed'), undefined);
});

test('portal fields carry plan, status, admin link, and a 0..1 progress that keeps 0', () => {
  const o = {
    token: 'ABCDEFGHJKMNPQRSTUVW',
    tier: 'axeoncore',
    status: 'active',
    lastClientActivityAt: null,
  } as unknown as Onboarding;
  const f = portalFields(o, { clientTotal: 12, clientDone: 0, axeonTotal: 8, axeonDone: 0, percent: 0 });
  assert.equal(f.Plan, 'AxeonCORE');
  assert.equal(f['Portal Status'], 'In progress');
  assert.equal(f['Portal Progress'], 0);
  assert.match(String(f['Portal Admin Link']), /\/admin\/onboarding\/ABCDEFGHJKMNPQRSTUVW$/);
  assert.equal('Portal Last Activity' in f, false);
  const done = portalFields({ ...o, status: 'complete' } as Onboarding, { clientTotal: 12, clientDone: 12, axeonTotal: 8, axeonDone: 3, percent: 100 });
  assert.equal(done['Portal Status'], 'Complete');
  assert.equal(done['Portal Progress'], 1);
});

test('formula strings escape quotes and backslashes so an email cannot break the filter', () => {
  assert.equal(formulaString("o'brien@x.com"), "o\\'brien@x.com");
  assert.equal(formulaString('a\\b'), 'a\\\\b');
});

test('compactFields drops empty values but keeps 0 and false', () => {
  assert.deepEqual(compactFields({ a: '', b: null, c: undefined, d: [], e: 0, f: false, g: 'x' }), { e: 0, f: false, g: 'x' });
});
