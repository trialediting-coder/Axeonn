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
      content: `# Title\n\n## One\n\n## Two\n\n${longBody} We also run your Google Ads campaigns for you.`,
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
});
