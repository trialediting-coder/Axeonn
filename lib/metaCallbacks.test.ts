// lib/metaCallbacks.test.ts
// Run with: npm run test:meta. The deauthorize / data-deletion handler with the
// real signed_request check and stubbed storage: no database, nothing touches Meta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { CALLBACK_MAX_BODY, deletionStatusUrl, handleMetaCallback, type MetaCallbackDeps } from './metaCallbacks';
import { parseSignedRequest } from './meta';

const SECRET = 'test-app-secret';
// Same pinned sample as lib/meta.test.ts: user_id 1234567890, signed with test-app-secret.
const SIGNED_REQUEST = 'qXFiff8rijiwPr0x61V6WYd8r7JGivtZjHuhEXakOaE.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTc2MDAwMDAwMCwidXNlcl9pZCI6IjEyMzQ1Njc4OTAifQ';

function stubs(over: Partial<MetaCallbackDeps> = {}) {
  const calls = { forget: [] as string[], record: [] as number[] };
  const deps: MetaCallbackDeps = {
    unavailable: () => null,
    databaseReady: () => true,
    parse: (s) => parseSignedRequest(s, SECRET),
    forget: async (id) => {
      calls.forget.push(id);
      return { pagesRemoved: 2, messagesRemoved: 0, contactsRemoved: 0, contactsCleared: 0 };
    },
    record: async (n) => {
      calls.record.push(n);
      return 'AbCdEfGhIjKlMnOp';
    },
    ...over,
  };
  return { deps, calls };
}

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request('https://axeonstudio.co/api/meta/data-deletion', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });
}

const form = (signed: string) => `signed_request=${encodeURIComponent(signed)}`;

test('data-deletion: a good signed_request forgets that user and answers { url, confirmation_code }', async () => {
  const { deps, calls } = stubs();
  const res = await handleMetaCallback(post(form(SIGNED_REQUEST)), 'data-deletion', deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    url: 'https://axeonstudio.co/meta/deletion?code=AbCdEfGhIjKlMnOp',
    confirmation_code: 'AbCdEfGhIjKlMnOp',
  });
  assert.deepEqual(calls.forget, ['1234567890']);
  assert.deepEqual(calls.record, [2]);
});

test('deauthorize: forgets the user, records no deletion receipt', async () => {
  const { deps, calls } = stubs();
  const res = await handleMetaCallback(post(form(SIGNED_REQUEST)), 'deauthorize', deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.deepEqual(calls.forget, ['1234567890']);
  assert.deepEqual(calls.record, []);
});

test('a missing, tampered or wrongly signed request is a 400 and deletes nothing', async () => {
  const [sig, payload] = SIGNED_REQUEST.split('.');
  const forged = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '999' })).toString('base64url');
  const otherSecret = `${createHmac('sha256', 'not-the-secret').update(forged).digest('base64url')}.${forged}`;
  for (const body of ['', 'signed_request=', form('bad.sig'), form(`${sig}.${forged}`), form(`${sig}.${payload}x`), form(otherSecret), 'user_id=1234567890']) {
    const { deps, calls } = stubs();
    for (const kind of ['deauthorize', 'data-deletion'] as const) {
      const res = await handleMetaCallback(post(body), kind, deps);
      assert.equal(res.status, 400, `${kind} ${body}`);
    }
    assert.deepEqual(calls.forget, [], body);
    assert.deepEqual(calls.record, [], body);
  }
});

test('Meta not configured: 503 before the body is read; no database: 503 after the signature check', async () => {
  const off = stubs({ unavailable: () => Response.json({ error: 'Meta is not configured' }, { status: 503 }) });
  assert.equal((await handleMetaCallback(post(form(SIGNED_REQUEST)), 'data-deletion', off.deps)).status, 503);
  assert.deepEqual(off.calls.forget, []);
  const noDb = stubs({ databaseReady: () => false });
  assert.equal((await handleMetaCallback(post(form(SIGNED_REQUEST)), 'data-deletion', noDb.deps)).status, 503);
  assert.deepEqual(noDb.calls.forget, []);
});

test('an oversized body is refused without parsing', async () => {
  const { deps, calls } = stubs();
  const res = await handleMetaCallback(post(form(SIGNED_REQUEST), { 'content-length': String(CALLBACK_MAX_BODY + 1) }), 'data-deletion', deps);
  assert.equal(res.status, 400);
  assert.deepEqual(calls.forget, []);
});

test('a storage failure is a 500 and the log never carries the signed_request, the user id or a token', async () => {
  const logged: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void logged.push(args.map(String).join(' '));
  try {
    const { deps } = stubs({
      forget: async () => {
        throw new Error('connection reset while running DELETE ... access_token=EAAsecretsecretsecret123');
      },
    });
    const res = await handleMetaCallback(post(form(SIGNED_REQUEST)), 'data-deletion', deps);
    assert.equal(res.status, 500);
    const body = JSON.stringify(await res.json());
    assert.equal(body.includes('1234567890'), false);
  } finally {
    console.error = original;
  }
  const all = logged.join('\n');
  assert.ok(all.includes('[meta:data-deletion] failed'));
  for (const secret of [SIGNED_REQUEST, SIGNED_REQUEST.split('.')[0], '1234567890', 'EAAsecretsecretsecret123']) {
    assert.equal(all.includes(secret), false, secret);
  }
});

test('the status URL is on the marketing host and the code is URL-safe', () => {
  assert.equal(deletionStatusUrl('AbCd_-12'), 'https://axeonstudio.co/meta/deletion?code=AbCd_-12');
  assert.equal(deletionStatusUrl('a b&c', 'http://localhost:3000'), 'http://localhost:3000/meta/deletion?code=a%20b%26c');
});
