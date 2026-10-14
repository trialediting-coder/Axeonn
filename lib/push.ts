// lib/push.ts
// Web push to the client's own devices (spec, "Cross-slice decisions": push via
// web-push). VAPID keys come from WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY,
// generated once with `npx web-push generate-vapid-keys`. Without them every
// send reports 0 devices and callers fall back to a text and an email. A
// subscription the push service says is gone (404/410) is deleted. Server-only.
import webpush from 'web-push';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { isKnownPushEndpoint, type PushMessage, type PushSubscriptionInput } from '@/lib/pushShared';

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || 'mailto:hello@axeonstudio.co', publicKey, privateKey);
  } catch (err) {
    console.error('[push] VAPID keys rejected', errText(err));
    configured = false;
    return false;
  }
  configured = true;
  return true;
}

/** One row per browser; a browser that re-subscribes (or moves to another login) keeps one row. */
export async function savePushSubscription(accountId: number, sub: PushSubscriptionInput): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO push_subscriptions (account_id, endpoint, p256dh, auth)
    VALUES (${accountId}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET account_id = EXCLUDED.account_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;`;
}

/** Sends to every device of one client login. Returns how many accepted it. Never throws. */
export async function sendPush(accountId: number, msg: PushMessage): Promise<number> {
  try {
    if (!isPushConfigured() || !isDatabaseConfigured()) return 0;
    await ensureSchema();
    const { rows } = await sql<{ id: number; endpoint: string; p256dh: string; auth: string }>`
      SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE account_id = ${accountId};`;
    const payload = JSON.stringify(msg);
    const results = await Promise.all(
      rows.map(async (s) => {
        // Defence in depth: never post to a host that is not a browser push service, even if a row got in.
        if (!isKnownPushEndpoint(s.endpoint)) return 0;
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' });
          return 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await sql`DELETE FROM push_subscriptions WHERE id = ${s.id};`.catch((delErr) => console.error('[push] dead subscription not removed', s.id, errText(delErr)));
          } else {
            console.error('[push] send failed', status ?? '', errText(err));
          }
          return 0;
        }
      }),
    );
    return results.reduce<number>((n, r) => n + r, 0);
  } catch (err) {
    console.error('[push] sendPush failed', errText(err));
    return 0;
  }
}

/** A client has one PROOF login (client_accounts.onboarding_id is unique). Never throws. */
export async function pushToClient(onboardingId: number, msg: PushMessage): Promise<number> {
  try {
    if (!isPushConfigured() || !isDatabaseConfigured()) return 0;
    await ensureSchema();
    const { rows } = await sql<{ id: number }>`SELECT id FROM client_accounts WHERE onboarding_id = ${onboardingId} LIMIT 1;`;
    return rows[0] ? await sendPush(Number(rows[0].id), msg) : 0;
  } catch (err) {
    console.error('[push] pushToClient failed', errText(err));
    return 0;
  }
}
