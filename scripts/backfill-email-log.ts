// scripts/backfill-email-log.ts
// One-time: copies the emails Resend still remembers into the admin email log
// (/admin/emails), so the log covers more than what was sent after it shipped.
// Safe to run again: emails already in the log (same Resend id) are skipped.
//
//   npm run email-log:backfill
//
// Needs RESEND_API_KEY and POSTGRES_URL in .env.local. How far back it reaches
// depends on how long your Resend plan keeps sent emails.
import { Resend } from 'resend';
import { ensureSchema, sql } from '../lib/db';
import { emailKindLabel, kindFromSubject, loggedSubject, recipientsText } from '../lib/emailLogShared';

// Resend's own word for an email that never reached the inbox.
const FAILED_EVENTS = new Set(['bounced', 'failed', 'suppressed', 'canceled']);

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing from .env.local');
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is missing from .env.local');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await ensureSchema();

  let after: string | undefined;
  let seen = 0;
  let added = 0;
  let oldest: string | null = null;
  const byKind = new Map<string, number>();

  for (;;) {
    const { data, error } = await resend.emails.list(after ? { limit: 100, after } : { limit: 100 });
    if (error) throw new Error(`Resend refused the list: ${error.message}`);
    if (!data) break;

    for (const e of data.data) {
      seen += 1;
      if (!oldest || e.created_at < oldest) oldest = e.created_at;
      const kind = kindFromSubject(e.subject);
      const failed = FAILED_EVENTS.has(e.last_event);
      const { rowCount } = await sql`
        INSERT INTO email_log (kind, recipient, subject, status, error, resend_id, created_at)
        SELECT ${kind}, ${recipientsText(e.to)}, ${loggedSubject(kind, e.subject)}, ${failed ? 'failed' : 'sent'},
               ${failed ? `Resend: ${e.last_event}` : null}, ${e.id}, ${e.created_at}
        WHERE NOT EXISTS (SELECT 1 FROM email_log WHERE resend_id = ${e.id})
      `;
      if (rowCount) {
        added += 1;
        byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
      }
    }

    if (!data.has_more || data.data.length === 0) break;
    after = data.data[data.data.length - 1].id;
    await pause(600); // Resend allows a couple of requests a second
  }

  console.log(`Resend returned ${seen} emails${oldest ? `, oldest from ${new Date(oldest).toDateString()}` : ''}.`);
  console.log(`Added ${added} to the email log (${seen - added} were already there).`);
  for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${emailKindLabel(kind)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
