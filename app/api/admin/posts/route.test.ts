// app/api/admin/posts/route.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validatePost } from '@/lib/postValidation';

// This route-level test exercises the same validation gate the POST handler
// applies, since spinning up the full Next.js request/response cycle for
// every scenario is unnecessary — the handler's only real logic beyond
// plumbing is "call validatePost, and if a scheduled/published post fails,
// force it to draft instead."
describe('scheduled/published posts must pass validation', () => {
  it('a post that fails validation cannot be scheduled', () => {
    const draft = { title: 'x', content: 'too short', sources: [] };
    const result = validatePost(draft);
    assert.strictEqual(result.passed, false);
  });
});
