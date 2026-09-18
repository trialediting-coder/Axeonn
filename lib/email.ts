// lib/email.ts
import { Resend } from 'resend';

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// post.title and critique reasons ultimately derive from Task 12's
// generatePost, which uses a live web_search tool — the text can contain
// fragments of scraped web content, not just the model's own synthesis.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendScheduledNotification(post: { title: string; slug: string; id: number }): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: 'Axeon Insights <insights@axeonstudio.co>',
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New post scheduled: ${post.title}`,
    html: `
      <p>The weekly autonomous pipeline generated and validated a new post.</p>
      <p><strong>${escapeHtml(post.title)}</strong></p>
      <p>It will auto-publish in 24 hours unless you review/edit/cancel it first.</p>
      <p><a href="https://axeonstudio.co/insights/admin/posts/${post.id}/edit">Review and edit</a></p>
    `,
  });
}

export async function sendFailedGenerationNotification(reasons: string[]): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: 'Axeon Insights <insights@axeonstudio.co>',
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: 'Weekly post generation did not pass review',
    html: `
      <p>This week's autonomous post generation failed validation and was saved as a draft — nothing was scheduled or published.</p>
      <ul>${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      <p><a href="https://axeonstudio.co/insights/admin">View drafts</a></p>
    `,
  });
}
