// lib/postValidation.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validatePost } from './postValidation';

describe('validatePost', () => {
  it('fails a post under the word-count floor', () => {
    const result = validatePost({
      title: 'Too Short',
      content: '# Too Short\n\nJust a few words here.',
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('word count')));
  });

  it('fails a post missing an H1', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'No H1 Post',
      content: `## Only an H2\n\n${longBody}`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('H1')));
  });

  it('fails a post with fewer than two H2s', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'One H2 Post',
      content: `# Title\n\n## Only One H2\n\n${longBody}`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('H2')));
  });

  it('fails a post that names a not-live service', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'Ads Post',
      content: `# Title\n\n## One\n\n## Two\n\n${longBody} We also run ChatGPT Ads for you.`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.toLowerCase().includes('not-live')));
  });

  it('fails a post citing a source without a real-looking URL', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'Bad Source Post',
      content: `# Title\n\n## One\n\n## Two\n\n${longBody}`,
      sources: [{ claim: 'made up stat', url: 'not-a-url' }],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('source')));
  });

  it('passes a well-formed, compliant post', () => {
    const longBody = 'Axeon Studio builds custom web infrastructure. '.repeat(200);
    const result = validatePost({
      title: 'A Good Post',
      content: `# A Good Post\n\n## Section One\n\n${longBody}\n\n## Section Two\n\nMore real content here about SEO and AEO for local service businesses, written with enough depth to pass the word count floor comfortably.`,
      sources: [{ claim: 'real stat', url: 'https://www.searchenginejournal.com/some-article' }],
    });
    assert.strictEqual(result.passed, true);
    assert.deepStrictEqual(result.reasons, []);
  });

  const compliant = (extra: string) => {
    const longBody = 'Axeon Studio installs patient intake for private practices. '.repeat(160);
    return validatePost({
      title: 'Pricing Post',
      content: `# Title\n\n## One\n\n${longBody}\n\n## Two\n\n${extra}`,
      sources: [],
    });
  };

  it('accepts the published prices and the 12-month agreement wording', () => {
    const result = compliant(
      'AxeonCORE is from $799/mo and AxeonGROWTH is from $1,999/month plus ad spend ($500/month minimum). ' +
        'Local Services Ads on AxeonCORE is +$750/month and the AI receptionist is +$199/mo. ' +
        'Plans run on a 12-month agreement; month-to-month is available with the $3,000 implementation fee paid upfront. ' +
        'The 90-day performance commitment: live in 30 days, 60-second replies, review requests on every visit, or walk away. Videography is $1,500.',
    );
    assert.deepStrictEqual(result.reasons, []);
    assert.strictEqual(result.passed, true);
  });

  for (const [label, text] of [
    ['retired $149 plan', 'Essentials is $149/month.'],
    ['retired $299 plan', 'AxeonCORE costs $299 a month.'],
    ['retired $999 plan', 'The top plan is $999 plus ad spend.'],
    ['retired $99 to start', 'Every plan is $99 to start.'],
    ['retired $1,500 to start', 'AxeonGROWTH is $1,500 to start.'],
    ['first month free', 'Your first month free when you sign today.'],
    ['an unpublished monthly price', 'It costs $1,200/mo.'],
    ['an invented 24-month term', 'Plans run on a 24-month agreement.'],
    ['an invented 3-month minimum', 'There is a 3-month minimum.'],
    ['a no-contract claim', 'There are no contracts and you can cancel anytime.'],
    ['the retired guarantee', 'Backed by our 90-day guarantee.'],
    ['a commitment turned into a number', 'Our commitment is 20 new patients in your first 90 days.'],
  ] as const) {
    it(`rejects ${label}`, () => {
      const result = compliant(text);
      assert.strictEqual(result.passed, false, `${label} should fail`);
    });
  }
});

