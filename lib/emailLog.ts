// lib/emailLog.ts
// One row per email the app hands to Resend (lib/email.ts records every send,
// accepted or rejected), shown to the owner at /admin/emails. Only who, what and
// when: never the body, which can hold setup links and reset URLs.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { kindsInCategory, loggedSubject, recipientsText, type EmailCategory, type EmailKind } from '@/lib/emailLogShared';

export interface EmailLogEntry {
  id: number;
  kind: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  resendId: string | null;
  createdAt: string;
}

interface Row {
  id: number;
  kind: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error: string | null;
  resend_id: string | null;
  created_at: string | Date;
}

const toEntry = (r: Row): EmailLogEntry => ({
  id: r.id,
  kind: r.kind,
  recipient: r.recipient,
  subject: r.subject,
  status: r.status,
  error: r.error,
  resendId: r.resend_id,
  createdAt: new Date(r.created_at).toISOString(),
});

/**
 * Records one send. Never throws: a log hiccup must not turn a delivered
 * email into an error the client or the admin sees.
 */
export async function recordEmail(input: {
  kind: EmailKind;
  to: string | string[] | undefined;
  subject: string | undefined;
  resendId?: string | null;
  error?: string | null;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await ensureSchema();
    const subject = loggedSubject(input.kind, input.subject ?? '');
    const status = input.error ? 'failed' : 'sent';
    await sql`
      INSERT INTO email_log (kind, recipient, subject, status, error, resend_id)
      VALUES (${input.kind}, ${recipientsText(input.to)}, ${subject}, ${status}, ${input.error ?? null}, ${input.resendId ?? null})
    `;
  } catch (err) {
    console.error('[emailLog] could not record a send', err);
  }
}

export const EMAIL_LOG_PAGE = 200;

/** Newest first, optionally narrowed to one category, a status, and a recipient or subject search. */
export async function listEmailLog(filter: { category?: EmailCategory | null; status?: 'sent' | 'failed' | null; q?: string | null } = {}): Promise<EmailLogEntry[]> {
  await ensureSchema();
  const kinds = filter.category ? kindsInCategory(filter.category) : null;
  const like = filter.q?.trim() ? `%${filter.q.trim().toLowerCase()}%` : null;
  const { rows } = await sql<Row>`
    SELECT id, kind, recipient, subject, status, error, resend_id, created_at
    FROM email_log
    WHERE (${kinds === null}::boolean OR kind = ANY(${(kinds ?? []) as unknown as string}::text[]))
      AND (${filter.status ?? null}::text IS NULL OR status = ${filter.status ?? null})
      AND (${like}::text IS NULL OR recipient LIKE ${like} OR lower(subject) LIKE ${like})
    ORDER BY created_at DESC, id DESC
    LIMIT ${EMAIL_LOG_PAGE}
  `;
  return rows.map(toEntry);
}
