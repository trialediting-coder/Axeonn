// lib/meta.test.ts
// Run with: npm run test:meta. fetch is always a stub here; nothing touches Meta.
// The pinned hex/base64url values were computed once with node:crypto from the
// documented schemes (X-Hub-Signature-256, appsecret_proof, signed_request) so a
// refactor cannot change a scheme silently.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  META_SCOPES,
  MetaApiError,
  graph,
  appSecretProof,
  containerStatus,
  createReelContainer,
  exchangeCode,
  isMetaConfigured,
  listPages,
  mediaInsights,
  oauthUrl,
  parseSignedRequest,
  sendMessage,
  signState,
  verifySignature,
  verifyState,
  type FetchLike,
} from './meta';

const SECRET = 'test-app-secret';
const BODY = '{"object":"page","entry":[{"id":"111","time":1760000000000,"messaging":[{"sender":{"id":"222"},"recipient":{"id":"111"},"timestamp":1760000000000,"message":{"mid":"m_abc","text":"Do you do boats?"}}]}]}';
const BODY_SIG = 'sha256=ad0b775360013941702c09c300010f569708f9019d3e32c9ced3069be7e38239';
const SIGNED_REQUEST = 'qXFiff8rijiwPr0x61V6WYd8r7JGivtZjHuhEXakOaE.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTc2MDAwMDAwMCwidXNlcl9pZCI6IjEyMzQ1Njc4OTAifQ';

function env(vars: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const before: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    before[k] = process.env[k];
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  }
  const restore = () => {
    for (const k of Object.keys(before)) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  };
  const out = fn();
  if (out instanceof Promise) return out.finally(restore);
  restore();
}

// APP_ORIGIN (lib/hostRouting.ts) is read once, at import, from APP_URL: run these with APP_URL unset (the
// default for `npm run test:meta`) so the redirect URI is https://axeonstudio.co/api/meta/callback.
const CONFIGURED = { META_APP_ID: '1234', META_APP_SECRET: SECRET, META_VERIFY_TOKEN: 'verify-me', SECRETS_KEY: Buffer.alloc(32, 7).toString('base64'), META_LOGIN_CONFIG_ID: undefined };

/** A fetch stub that records each call and answers from a queue. */
function stub(...answers: Array<{ status?: number; json: unknown }>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const f: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const a = answers.shift() ?? { json: {} };
    return new Response(JSON.stringify(a.json), { status: a.status ?? 200, headers: { 'content-type': 'application/json' } });
  };
  return { f, calls };
}

test('verifySignature accepts the documented sha256= HMAC of the raw body and refuses anything else', () => {
  assert.equal(verifySignature(BODY, BODY_SIG, SECRET), true);
  assert.equal(verifySignature(Buffer.from(BODY, 'utf8'), BODY_SIG, SECRET), true);
  assert.equal(verifySignature(BODY + ' ', BODY_SIG, SECRET), false);
  assert.equal(verifySignature(BODY, BODY_SIG.replace('sha256=', 'sha1='), SECRET), false);
  assert.equal(verifySignature(BODY, 'sha256=00', SECRET), false);
  assert.equal(verifySignature(BODY, null, SECRET), false);
  assert.equal(verifySignature(BODY, BODY_SIG, 'other-secret'), false);
  assert.equal(verifySignature(BODY, BODY_SIG, ''), false);
});

test('appSecretProof is HMAC-SHA256(app secret, token) in hex', () => {
  assert.equal(appSecretProof('EAAtest', SECRET), '545c00459922319a6658d712eb8b84a1afb328fa4d94f9f8c70dca9a8b3566e2');
});

test('isMetaConfigured needs all four variables and a 32-byte SECRETS_KEY', () =>
  env(CONFIGURED, () => {
    assert.equal(isMetaConfigured(), true);
    for (const missing of ['META_APP_ID', 'META_APP_SECRET', 'META_VERIFY_TOKEN', 'SECRETS_KEY']) {
      env({ [missing]: undefined }, () => assert.equal(isMetaConfigured(), false, missing));
    }
    env({ SECRETS_KEY: 'short' }, () => assert.equal(isMetaConfigured(), false));
  }));

test('signState round-trips, expires after 15 minutes, and refuses a changed payload or secret', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const s = signState({ token: 'abcdefghijklmnopqrst', nonce: 'n0nce', from: 'portal' }, SECRET, now);
  assert.deepEqual(verifyState(s, SECRET, now + 60_000), { token: 'abcdefghijklmnopqrst', nonce: 'n0nce', from: 'portal' });
  assert.equal(verifyState(s, SECRET, now + 15 * 60_000 + 1), null);
  assert.equal(verifyState(s, 'other', now), null);
  const [payload, sig] = s.split('.');
  const forged = Buffer.from(JSON.stringify({ t: 'zzzzzzzzzzzzzzzzzzzz', n: 'n0nce', f: 'admin', e: now + 60_000 })).toString('base64url');
  assert.equal(verifyState(`${forged}.${sig}`, SECRET, now), null);
  assert.equal(verifyState(`${payload}.${sig}.x`, SECRET, now), null);
  assert.equal(verifyState(null, SECRET, now), null);
  assert.equal(verifyState(signState({ token: 't', nonce: 'n', from: 'admin' }, SECRET, now), SECRET, now)?.from, 'admin');
});

test('oauthUrl asks for every scope with our redirect URI and state', () =>
  env(CONFIGURED, () => {
    const u = new URL(oauthUrl('STATE123'));
    assert.equal(u.origin + u.pathname, 'https://www.facebook.com/v21.0/dialog/oauth');
    assert.equal(u.searchParams.get('client_id'), '1234');
    assert.equal(u.searchParams.get('redirect_uri'), 'https://axeonstudio.co/api/meta/callback');
    assert.equal(u.searchParams.get('state'), 'STATE123');
    assert.deepEqual(u.searchParams.get('scope')?.split(','), [...META_SCOPES]);
    for (const s of ['pages_messaging', 'instagram_manage_messages', 'instagram_content_publish', 'pages_manage_metadata']) assert.ok(META_SCOPES.includes(s as never), s);
  }));

test('oauthUrl uses a Facebook Login for Business configuration instead of scopes when one is set', () =>
  env({ ...CONFIGURED, META_LOGIN_CONFIG_ID: '987654321' }, () => {
    const u = new URL(oauthUrl('S'));
    assert.equal(u.searchParams.get('config_id'), '987654321');
    assert.equal(u.searchParams.get('scope'), null);
    assert.equal(u.searchParams.get('response_type'), 'code');
  }));

test('sendMessage posts the documented body with the page token and appsecret_proof in the query', () =>
  env(CONFIGURED, async () => {
    const { f, calls } = stub({ json: { recipient_id: '7000000000000001', message_id: 'm_out_1' } });
    const r = await sendMessage({ pageToken: 'EAAtest', recipientId: '7000000000000001', text: 'Yes, Saturday works.' }, f);
    assert.deepEqual(r, { messageId: 'm_out_1' });
    const u = new URL(calls[0].url);
    assert.equal(u.origin + u.pathname, 'https://graph.facebook.com/v21.0/me/messages');
    assert.equal(u.searchParams.get('access_token'), 'EAAtest');
    assert.equal(u.searchParams.get('appsecret_proof'), appSecretProof('EAAtest', SECRET));
    assert.equal(calls[0].init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { recipient: { id: '7000000000000001' }, message: { text: 'Yes, Saturday works.' }, messaging_type: 'RESPONSE' });
  }));

test('a Graph error becomes a MetaApiError with the code and no token in the message', () =>
  env(CONFIGURED, async () => {
    const { f } = stub({ status: 400, json: { error: { message: 'Error validating access token: EAAGm0PX4ZCpsBAJZBsecretsecret has expired', type: 'OAuthException', code: 190, error_subcode: 463 } } });
    await assert.rejects(
      sendMessage({ pageToken: 'EAAGm0PX4ZCpsBAJZBsecretsecret', recipientId: '1', text: 'hi' }, f),
      (err: unknown) => {
        assert.ok(err instanceof MetaApiError);
        assert.equal(err.code, 190);
        assert.equal(err.subcode, 463);
        assert.equal(err.tokenInvalid, true);
        assert.equal(err.message.includes('EAAGm0PX4ZCpsBAJZBsecretsecret'), false);
        assert.match(err.message, /Meta 400 \(190\/463\).*\(\/me\/messages\)/);
        return true;
      }
    );
  }));

test('the window-closed error is recognised', () =>
  env(CONFIGURED, async () => {
    const { f } = stub({ status: 400, json: { error: { message: 'This message is sent outside of allowed window.', code: 10, error_subcode: 2018278 } } });
    await assert.rejects(sendMessage({ pageToken: 'EAAtest', recipientId: '1', text: 'hi' }, f), (err: unknown) => err instanceof MetaApiError && err.outsideWindow);
  }));

test('a network failure that echoes the URL is redacted too', () =>
  env(CONFIGURED, async () => {
    const f: FetchLike = async (url) => {
      throw new TypeError(`fetch failed for ${url}`);
    };
    await assert.rejects(exchangeCode('AQDsecretcode', f), (err: unknown) => {
      assert.ok(err instanceof MetaApiError);
      assert.equal(err.message.includes('AQDsecretcode'), false);
      assert.equal(err.message.includes(SECRET), false);
      return true;
    });
  }));

test('exchangeCode sends the code, our redirect URI and the secret to /oauth/access_token', () =>
  env(CONFIGURED, async () => {
    const { f, calls } = stub({ json: { access_token: 'EAAshort', token_type: 'bearer' } });
    assert.equal(await exchangeCode('AQDcode', f), 'EAAshort');
    const u = new URL(calls[0].url);
    assert.equal(u.pathname, '/v21.0/oauth/access_token');
    assert.equal(u.searchParams.get('code'), 'AQDcode');
    assert.equal(u.searchParams.get('client_secret'), SECRET);
    assert.equal(u.searchParams.get('redirect_uri'), 'https://axeonstudio.co/api/meta/callback');
  }));

test('listPages keeps pages that came with a token', () =>
  env(CONFIGURED, async () => {
    const { f } = stub({ json: { data: [{ id: '1', name: 'Gonzalez Auto Detailing', access_token: 'EAApage1' }, { id: '2', name: 'No token' }] } });
    assert.deepEqual(await listPages('EAAuser', f), [{ id: '1', name: 'Gonzalez Auto Detailing', accessToken: 'EAApage1' }]);
  }));

test('createReelContainer, containerStatus and mediaInsights read the documented shapes', () =>
  env(CONFIGURED, async () => {
    const { f, calls } = stub(
      { json: { id: '17900000000000001' } },
      { json: { status_code: 'FINISHED', status: 'Finished: Media has been uploaded and it is ready to be published.', id: '17900000000000001' } },
      { json: { data: [{ name: 'reach', period: 'lifetime', values: [{ value: 1840 }] }, { name: 'views', period: 'lifetime', values: [{ value: 2610 }] }] } }
    );
    assert.equal(await createReelContainer({ igUserId: '17841400000000001', pageToken: 'EAApage', videoUrl: 'https://x.public.blob.vercel-storage.com/social/1/a.mp4', caption: 'Before and after' }, f), '17900000000000001');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { media_type: 'REELS', video_url: 'https://x.public.blob.vercel-storage.com/social/1/a.mp4', caption: 'Before and after', share_to_feed: true });
    assert.equal(new URL(calls[0].url).pathname, '/v21.0/17841400000000001/media');
    assert.equal((await containerStatus('17900000000000001', 'EAApage', f)).code, 'FINISHED');
    assert.deepEqual(await mediaInsights('17900000000000002', 'EAApage', f), { reach: 1840, plays: 2610 });
    assert.equal(new URL(calls[2].url).searchParams.get('metric'), 'reach,views');
  }));

test('parseSignedRequest checks the HMAC and returns the user id', () => {
  assert.deepEqual(parseSignedRequest(SIGNED_REQUEST, SECRET), { userId: '1234567890' });
  assert.equal(parseSignedRequest(SIGNED_REQUEST, 'other'), null);
  const [sig, payload] = SIGNED_REQUEST.split('.');
  assert.equal(parseSignedRequest(`${sig}.${payload}x`, SECRET), null);
  assert.equal(parseSignedRequest('garbage', SECRET), null);
  assert.equal(parseSignedRequest(null, SECRET), null);
});

test('verifySignature fails closed on empty, prefix-less, non-hex and truncated headers', () => {
  const hex = BODY_SIG.slice('sha256='.length);
  for (const bad of ['', 'sha256=', hex, 'sha256=zz', `sha256=${hex.slice(0, -2)}`, `sha256=${hex}00`, `SHA256=${hex}`]) {
    assert.equal(verifySignature(BODY, bad, SECRET), false, bad);
  }
});

test('a signed state is bound to its onboarding token and cannot be re-pointed at another client', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const a = signState({ token: 'client-a-token-000000', nonce: 'n1', from: 'portal' }, SECRET, now);
  assert.equal(verifyState(a, SECRET, now)?.token, 'client-a-token-000000');
  const [, sig] = a.split('.');
  const swapped = Buffer.from(JSON.stringify({ t: 'client-b-token-000000', n: 'n1', f: 'portal', e: now + 60_000 })).toString('base64url');
  assert.equal(verifyState(`${swapped}.${sig}`, SECRET, now), null);
});

test('outsideWindow is only the window errors; a bare code 10 is a permission error', () => {
  const win = new MetaApiError('Meta 400 (10/2018278): outside', 400, 10, 2018278);
  assert.equal(win.outsideWindow, true);
  assert.equal(win.permissionDenied, false);
  assert.equal(new MetaApiError('x', 400, 10, 2534022).outsideWindow, true);
  const perm = new MetaApiError('Meta 400 (10): (#10) Application does not have permission for this action', 400, 10, null);
  assert.equal(perm.outsideWindow, false);
  assert.equal(perm.permissionDenied, true);
  assert.equal(new MetaApiError('Meta 403 (200): perms', 403, 200, null).permissionDenied, true);
  assert.equal(new MetaApiError('Meta 400 (190): expired', 400, 190, 463).permissionDenied, true);
  assert.equal(new MetaApiError('Meta 400 (100): bad', 400, 100, null).permissionDenied, false);
});

test('graph times out a fetch that never resolves and reports a MetaApiError', async () => {
  const never: FetchLike = (_u, init) => new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(init.signal!.reason)));
  await assert.rejects(graph('/me', { timeoutMs: 20 }, never), (e: unknown) => e instanceof MetaApiError && /timed out \(\/me\)/.test(e.message) && e.status === 0);
  const ctl = new AbortController();
  const p = graph('/me', { signal: ctl.signal }, never);
  ctl.abort();
  await assert.rejects(p, (e: unknown) => e instanceof MetaApiError && /timed out/.test(e.message));
});

test('mediaInsights retries reach alone when Meta rejects the metric pair with (#100)', () =>
  env(CONFIGURED, async () => {
    const { f, calls } = stub(
      { status: 400, json: { error: { message: '(#100) metric not supported', code: 100 } } },
      { json: { data: [{ name: 'reach', values: [{ value: 55 }] }] } }
    );
    assert.deepEqual(await mediaInsights('1', 'EAApage', f), { reach: 55, plays: null });
    assert.equal(new URL(calls[1].url).searchParams.get('metric'), 'reach');
  }));

test('verifySignature accepts only sha256= plus exactly 64 hex characters', () => {
  const hex = BODY_SIG.slice('sha256='.length);
  assert.equal(verifySignature(BODY, `sha256=${hex.toUpperCase()}`, SECRET), true);
  assert.equal(verifySignature(BODY, `sha256=${hex}zz`, SECRET), false);
  assert.equal(verifySignature(BODY, `sha256=${hex}0`, SECRET), false);
  assert.equal(verifySignature(BODY, `sha256=${hex.slice(0, 63)}`, SECRET), false);
});
