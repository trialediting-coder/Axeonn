// lib/posts.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from './posts';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.strictEqual(slugify('How HVAC Companies Win Local SEO'), 'how-hvac-companies-win-local-seo');
  });

  it('strips punctuation', () => {
    assert.strictEqual(slugify("What's the Best CRM for Roofers?"), 'whats-the-best-crm-for-roofers');
  });

  it('collapses repeated whitespace/hyphens', () => {
    assert.strictEqual(slugify('Too   Many    Spaces'), 'too-many-spaces');
  });
});
