import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildAvoidTitlesClause } from './anthropic';

describe('buildAvoidTitlesClause', () => {
  it('returns an empty-list note when there are no prior titles', () => {
    assert.strictEqual(buildAvoidTitlesClause([]), 'No prior posts exist yet — any real, relevant topic is fine.');
  });

  it('lists prior titles to avoid when present', () => {
    const clause = buildAvoidTitlesClause(['How HVAC Companies Win Local SEO', 'A Second Post']);
    assert.ok(clause.includes('How HVAC Companies Win Local SEO'));
    assert.ok(clause.includes('A Second Post'));
  });
});
