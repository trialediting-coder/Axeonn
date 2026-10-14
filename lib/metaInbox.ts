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
import { profileName } from '@/lib/meta';
import { getOnboardingById } from '@/lib/onboarding';
import { pageForId } from '@/lib/metaPages';
import { messagePreview, secretRedact, type MetaAttachment, type MetaChannel, type MetaInboundMessage } from '@/lib/metaShared';

const PLATFORM: Record<MetaChannel, string> = { messenger: 'Facebook', instagram: 'Instagram' };
const redactedErr = (err: unknown) => secretRedact(errText(err));

/** Attachments are kept as metadata only (type, and Meta's URL when it is a sane length); nothing is ever fetched. */
const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_URL = 2048;
const storedAttachments = (list: MetaAttachment[]): MetaAttachment[] =>
  list.slice(0, MAX_ATTACHMENTS).map((a) => ({ type: a.type.slice(0, 40), url: a.url && a.url.length <= MAX_ATTACHMENT_URL ? a.url : null }));

type RecordResult = 'recorded' | 'duplicate' | 'unknown_page' | 'inbox_off';

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
  if (created) {
    const name = await profileName(e.channel, e.senderId, page.pageToken);
    if (name) await upsertContactByExternalId({ onboardingId: page.onboardingId, channel: e.channel, externalId: e.senderId, name, at: sentAt });
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
  return 'recorded';
}

/** Runs inside after(): one bad message never stops the rest, and nothing here can change the 200 Meta already got. */
export async function processInbound(events: MetaInboundMessage[], now: Date = new Date()): Promise<Record<RecordResult | 'failed', number>> {
  const tally: Record<RecordResult | 'failed', number> = { recorded: 0, duplicate: 0, unknown_page: 0, inbox_off: 0, failed: 0 };
  for (const e of events) {
    try {
      tally[await recordOne(e, now)] += 1;
    } catch (err) {
      tally.failed += 1;
      console.error('[meta:inbound]', PLATFORM[e.channel], redactedErr(err));
    }
  }
  if (tally.unknown_page) console.error('[meta:inbound] messages for a page no client has connected', tally.unknown_page);
  if (tally.inbox_off) console.error('[meta:inbound] messages for a client whose plan has no inbox', tally.inbox_off);
  return tally;
}
