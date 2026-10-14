// lib/metaInbox.ts
// Messenger and Instagram DMs in the leads inbox. Inbound: the webhook hands
// verified, parsed messages to processInbound (after the 200 has gone back to
// Meta), which records each one once (meta_messages.mid is UNIQUE), files it
// under a contact keyed by PSID / IGSID, writes the timeline event through slice
// 4's lib/contacts.ts, and alerts the client through slice 4's
// notifyLeadActivity. Outbound: metaReplyFor decides whether an inbox reply goes
// through Meta, enforces the 24-hour window before the Send API is called, and
// records the reply. Server-only.
import { sql } from '@/lib/db';
import { errText, type DbId } from '@/lib/dbRows';
import { addContactEvent, upsertContactByExternalId } from '@/lib/contacts';
import { inboxEnabled } from '@/lib/contactsShared';
import { notifyLeadActivity } from '@/lib/leadNotify';
import { isMetaConfigured, metaSendFailure, profileName, sendMessage } from '@/lib/meta';
import { getOnboardingById } from '@/lib/onboarding';
import { markNeedsReconnect, pageForId } from '@/lib/metaPages';
import { messagePreview, metaTextProblem, replyDecision, secretRedact, type MetaAttachment, type MetaChannel, type MetaInboundMessage } from '@/lib/metaShared';

const PLATFORM: Record<MetaChannel, string> = { messenger: 'Facebook', instagram: 'Instagram' };
const redactedErr = (err: unknown) => secretRedact(errText(err));

/** Attachments are kept as metadata only (type, and Meta's URL when it is a sane length); nothing is ever fetched. */
const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_URL = 2048;
const storedAttachments = (list: MetaAttachment[]): MetaAttachment[] =>
  list.slice(0, MAX_ATTACHMENTS).map((a) => ({ type: a.type.slice(0, 40), url: a.url && a.url.length <= MAX_ATTACHMENT_URL ? a.url : null }));

export type RecordResult = 'recorded' | 'duplicate' | 'unknown_page' | 'inbox_off';

async function recordOne(e: MetaInboundMessage, now: Date): Promise<RecordResult> {
  const page = await pageForId(e.pageOrIgId);
  if (!page) return 'unknown_page';
  // A client who left, or whose plan no longer has the inbox, gets nothing stored and no alert.
  const onboarding = await getOnboardingById(page.onboardingId);
  if (!onboarding || onboarding.status === 'closed' || !inboxEnabled(onboarding.tier)) return 'inbox_off';
  const sentAt = (e.timestamp > 0 ? new Date(e.timestamp) : now).toISOString();
  const attachments = storedAttachments(e.attachments);
  // Dedupe on mid: Meta redelivers on any slow or failed response.
  const inserted = await sql<{ id: DbId }>`
    INSERT INTO meta_messages (onboarding_id, channel, direction, page_id, person_id, mid, body, attachments, sent_at)
    VALUES (${page.onboardingId}, ${e.channel}, 'in', ${page.pageId}, ${e.senderId}, ${e.mid}, ${e.text}, ${JSON.stringify(attachments)}::jsonb, ${sentAt})
    ON CONFLICT (mid) DO NOTHING
    RETURNING id;
  `;
  let messageId: number;
  let contactId: number | null = null;
  let created = false;
  if (inserted.rows[0]) {
    messageId = Number(inserted.rows[0].id);
  } else {
    // A redelivery. If an earlier run stored the message but died before the
    // timeline event, finish it now; the event insert below is idempotent and
    // decides (once, across concurrent deliveries) whether anyone is alerted.
    const prior = await sql<{ id: DbId; contact_id: DbId | null }>`
      SELECT id, contact_id FROM meta_messages
      WHERE mid = ${e.mid} AND onboarding_id = ${page.onboardingId} AND direction = 'in'
      LIMIT 1;
    `;
    if (!prior.rows[0]) return 'duplicate';
    messageId = Number(prior.rows[0].id);
    if (prior.rows[0].contact_id != null) contactId = Number(prior.rows[0].contact_id);
  }

  if (contactId === null) {
    // Two first messages at once from a new sender land on one contact: the partial unique index decides.
    const contact = await upsertContactByExternalId({ onboardingId: page.onboardingId, channel: e.channel, externalId: e.senderId, name: null, at: sentAt });
    contactId = contact.id;
    created = contact.created;
    await sql`UPDATE meta_messages SET contact_id = ${contactId} WHERE id = ${messageId} AND contact_id IS NULL;`;
  }
  const ev = await addContactEvent({
    onboardingId: page.onboardingId,
    contactId,
    kind: e.channel,
    refTable: 'meta_messages',
    refId: messageId,
    summary: messagePreview(e),
    // body is what slice 4's toDashboardEvent shows as the bubble; direction picks the side and the label (Task 7).
    payload: { direction: 'in', body: e.text, attachments: attachments.map((a) => a.type) },
    createdAt: sentAt,
  });
  if (!ev?.insertedEvent) return 'duplicate';
  // Push first; with no device, the owner text (outside quiet hours) and the email. Never throws, carries no message words.
  await notifyLeadActivity(page.onboardingId, contactId, e.channel);
  // The name last: a slow Graph call (10 s timeout) must never delay the recording or the alert.
  if (created) {
    const name = await profileName(e.channel, e.senderId, page.pageToken);
    if (name) await upsertContactByExternalId({ onboardingId: page.onboardingId, channel: e.channel, externalId: e.senderId, name, at: sentAt });
  }
  return 'recorded';
}

type Tally = Record<RecordResult | 'failed', number>;

/** Ids only, never the words: enough to find the conversation in Meta Business Suite and replay it. */
const lostLine = (e: MetaInboundMessage) => ({ channel: e.channel, mid: e.mid, page: e.pageOrIgId, sender: e.senderId, at: e.timestamp });

/** Seams for tests; production uses the defaults. */
export interface InboundDeps {
  record?: (e: MetaInboundMessage, now: Date) => Promise<RecordResult>;
  /** Wait before the one retry of a failed message. */
  retryDelayMs?: number;
}

/**
 * Runs inside after(): one bad message never stops the rest, and nothing here
 * can change the 200 Meta already got, so Meta will not redeliver. A message
 * that throws is retried once (the mid dedupe makes that safe); if it fails
 * again it is logged as "[meta:inbound] LOST" with its ids so it can be found
 * and replayed. No log line here carries message text.
 */
export async function processInbound(events: MetaInboundMessage[], now: Date = new Date(), deps: InboundDeps = {}): Promise<Tally> {
  const record = deps.record ?? recordOne;
  const retryDelayMs = deps.retryDelayMs ?? 1000;
  const tally: Tally = { recorded: 0, duplicate: 0, unknown_page: 0, inbox_off: 0, failed: 0 };
  const retry: MetaInboundMessage[] = [];
  for (const e of events) {
    try {
      tally[await record(e, now)] += 1;
    } catch (err) {
      console.error('[meta:inbound] failed, will retry', PLATFORM[e.channel], e.mid, redactedErr(err));
      retry.push(e);
    }
  }
  if (retry.length) {
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    for (const e of retry) {
      try {
        tally[await record(e, now)] += 1;
      } catch (err) {
        tally.failed += 1;
        console.error('[meta:inbound] LOST', lostLine(e), redactedErr(err));
      }
    }
  }
  if (tally.unknown_page) console.error('[meta:inbound] messages for a page no client has connected', tally.unknown_page);
  if (tally.inbox_off) console.error('[meta:inbound] messages for a client whose plan has no inbox', tally.inbox_off);
  const skipped = tally.duplicate + tally.unknown_page + tally.inbox_off;
  const summary = `[meta:inbound] processed ${events.length}: recorded ${tally.recorded}, skipped ${skipped}, failed ${tally.failed}`;
  if (tally.failed) console.error(summary);
  else console.info(summary);
  return tally;
}

export type MetaReplyResult =
  /** note: it went out, but recording it failed, so it may not show in the thread yet. */
  | { ok: true; channel: MetaChannel; note?: string }
  /** unclear: Meta may have delivered it; the box clears instead of offering a resend (slice 4's 'unclear'). */
  | { ok: false; status: number; error: string; canText: boolean; channel: MetaChannel | null; unclear?: true };

/**
 * Called first by POST /api/proof/inbox/[contactId]/reply. Null means "not a
 * Meta thread, carry on with slice 4's SMS path". Otherwise the reply was sent
 * through Meta (ok) or refused with the status and sentence the reply box shows.
 * Every query is scoped by the onboarding id, so another client's contact is a
 * null here and a 404 from slice 4's replyToContact. The reply goes only to the
 * PSID / IGSID of this contact's latest inbound DM, through the page that
 * received it, and only when that page is this client's and active.
 * Quiet hours do not apply: holding a Messenger reply could carry it past the
 * 24-hour window, and Messenger is not a text message.
 */
export async function metaReplyFor(input: { onboardingId: number; contactId: number; text: string; via?: 'sms' | null; now?: number }): Promise<MetaReplyResult | null> {
  if (input.via === 'sms') return null;
  const now = input.now ?? Date.now();
  const [lastMetaRes, lastOtherRes, contactRes] = await Promise.all([
    sql<{ channel: MetaChannel; page_id: string; person_id: string; sent_at: Date | string }>`
      SELECT channel, page_id, person_id, sent_at FROM meta_messages
      WHERE onboarding_id = ${input.onboardingId} AND contact_id = ${input.contactId} AND direction = 'in'
      ORDER BY sent_at DESC LIMIT 1;
    `,
    sql<{ at: Date | string | null }>`
      SELECT max(created_at) AS at FROM contact_events
      WHERE onboarding_id = ${input.onboardingId} AND contact_id = ${input.contactId} AND kind IN ('call', 'text_in', 'form', 'chat', 'booking');
    `,
    sql<{ phone: string | null }>`SELECT phone FROM contacts WHERE id = ${input.contactId} AND onboarding_id = ${input.onboardingId};`,
  ]);
  const last = lastMetaRes.rows[0];
  if (!last) return null;
  const hasPhone = Boolean(contactRes.rows[0]?.phone);
  const otherAt = lastOtherRes.rows[0]?.at;
  const decision = replyDecision({
    lastMeta: { channel: last.channel, at: new Date(last.sent_at).toISOString() },
    lastOtherInboundAt: otherAt ? new Date(otherAt).toISOString() : null,
    hasPhone,
    now,
  });
  if (decision.route === 'sms') return null;
  if (decision.route === 'blocked') return { ok: false, status: 409, error: decision.message, canText: decision.canText, channel: decision.channel };
  const channel = decision.channel;
  const name = PLATFORM[channel];
  const text = input.text.trim();
  if (!text) return { ok: false, status: 400, error: 'Type a message first.', canText: hasPhone, channel };
  const tooLong = metaTextProblem(channel, text);
  if (tooLong) return { ok: false, status: 400, error: tooLong, canText: hasPhone, channel };
  if (!isMetaConfigured()) return { ok: false, status: 503, error: `${name} replies are not switched on yet.`, canText: hasPhone, channel };
  const page = await pageForId(last.page_id);
  if (!page || page.onboardingId !== input.onboardingId || page.status === 'needs_reconnect') {
    return { ok: false, status: 409, error: `This ${name} page needs to be reconnected before you can reply here. Ask Axeon to reconnect it.`, canText: hasPhone, channel };
  }

  let messageId: string;
  try {
    ({ messageId } = await sendMessage({ pageToken: page.pageToken, recipientId: last.person_id, text }));
  } catch (err) {
    const failure = metaSendFailure(err, channel, hasPhone);
    console.error('[meta:reply]', failure.kind, redactedErr(err));
    if (failure.kind === 'reconnect') {
      try {
        await markNeedsReconnect(page.pageId, errText(err));
      } catch (markErr) {
        console.error('[meta:reply] could not mark the page', redactedErr(markErr));
      }
    }
    return { ok: false, status: failure.status, error: failure.error, canText: failure.canText, channel, ...(failure.kind === 'unclear' ? { unclear: true as const } : {}) };
  }

  // Meta has the message. Nothing below may turn this into a failure the box would offer to resend.
  try {
    const out = await sql<{ id: DbId }>`
      INSERT INTO meta_messages (onboarding_id, contact_id, channel, direction, page_id, person_id, mid, body, sent_at)
      VALUES (${input.onboardingId}, ${input.contactId}, ${channel}, 'out', ${page.pageId}, ${last.person_id}, ${messageId}, ${text}, ${new Date(now).toISOString()})
      ON CONFLICT (mid) DO NOTHING
      RETURNING id;
    `;
    await addContactEvent({
      onboardingId: input.onboardingId,
      contactId: input.contactId,
      kind: channel,
      refTable: 'meta_messages',
      refId: out.rows[0] ? Number(out.rows[0].id) : null,
      summary: messagePreview({ text, attachments: [] }),
      payload: { direction: 'out', body: text },
      createdAt: new Date(now).toISOString(),
      // A reply the client typed is contact: New moves to Contacted through slice 4's advanceStage
      // (forms mirror it, slice 3's new-lead and quote follow-ups stop), as a typed text does.
      systemStage: 'contacted',
    });
  } catch (err) {
    console.error('[meta:reply] sent but not recorded', redactedErr(err));
    return { ok: true, channel, note: `Sent on ${name}. It may not show in this thread, so check ${name} before sending it again.` };
  }
  return { ok: true, channel };
}
