// lib/email.ts
import { Resend } from 'resend';

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL;
// Resend rejects sends from a domain that hasn't been verified in the
// Resend dashboard -- configurable so a real deploy can point at a verified
// domain without a code change, and so this isn't silently hardcoded to a
// domain that was never actually set up.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Axeon Insights <insights@axeonstudio.co>';

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
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New post scheduled: ${post.title}`,
    html: `
      <p>The weekly autonomous pipeline generated and validated a new post.</p>
      <p><strong>${escapeHtml(post.title)}</strong></p>
      <p>It will auto-publish in 24 hours unless you review/edit/cancel it first.</p>
      <p><a href="https://axeonstudio.co/admin/posts/${post.id}/edit">Review and edit</a></p>
    `,
  });
}

// postWasCreated distinguishes "generated, checked, and saved as a draft
// for review" from "the pipeline threw before any post existed" -- the cron
// route's outer catch handles the latter and there is no draft to view.
export async function sendFailedGenerationNotification(
  reasons: string[],
  postWasCreated: boolean = true
): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  const body = postWasCreated
    ? `
      <p>This week's autonomous post generation failed validation and was saved as a draft — nothing was scheduled or published.</p>
      <ul>${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      <p><a href="https://axeonstudio.co/admin">View drafts</a></p>
    `
    : `
      <p>This week's autonomous post generation failed before a draft could be created — nothing was saved, scheduled, or published.</p>
      <ul>${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
    `;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: 'Weekly post generation did not pass review',
    html: body,
  });
}

// Billing alerts fired from app/api/stripe/webhook/route.ts after signature
// verification. Customer names and emails are customer-typed strings, so they
// go through escapeHtml like everything else.
export async function sendBillingNotification(input: {
  subject: string;
  lines: string[];
  link?: { label: string; href: string };
}): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  const items = input.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  const link = input.link
    ? `<p><a href="${escapeHtml(input.link.href)}">${escapeHtml(input.link.label)}</a></p>`
    : '';

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: input.subject,
    html: `<ul>${items}</ul>${link}`,
  });
}

// ───────────────────────────── Client onboarding portal ─────────────────────────────
// Client-facing mail for /welcome/<token> (lib/onboarding.ts). These go to the
// client, not the owner, so they use a friendlier From and a plain layout that
// survives every mail app. Client names and business names are client-typed
// strings and go through escapeHtml.

const CLIENT_FROM_ADDRESS = process.env.RESEND_CLIENT_FROM_EMAIL || 'Axeon Studio <hello@axeonstudio.co>';
const CLIENT_REPLY_TO = process.env.RESEND_CLIENT_REPLY_TO || 'hello@axeonstudio.co';

export function isClientEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendPayload = Parameters<Resend['emails']['send']>[0];

/**
 * Resend reports rejections (unverified domain, bad address, rate limit) in the
 * returned `error`, not by throwing. Client-facing mail must surface that, or the
 * admin would show "welcome sent" for an email that never left.
 */
async function sendChecked(resend: Resend, payload: SendPayload): Promise<void> {
  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(`Resend rejected the email: ${error.message}`);
}

function clientLayout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0a0a0a;line-height:1.55">
      <p style="margin:0 0 24px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;font-weight:700">Axeon Studio</p>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:800">${title}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:13px;color:#737373">Questions? Reply to this email or call (515) 493-8017.</p>
    </div>
  `;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${escapeHtml(label)}</a></p>`;
}

/** The link that starts onboarding, sent by the Stripe webhook or from the admin board. */
export async function sendWelcomeEmail(input: {
  to: string;
  clientName: string | null;
  tierLabel: string;
  url: string;
  /** Rough minutes for the client's part, shown in the copy. */
  minutes: number;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const first = input.clientName?.split(' ')[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : 'Hi there,';
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `Welcome to Axeon: your ${input.tierLabel} setup (about ${input.minutes} minutes)`,
    html: clientLayout(
      'Welcome aboard. Here is your setup page.',
      `
        <p style="margin:0 0 12px">${greeting}</p>
        <p style="margin:0 0 12px">Thanks for choosing Axeon Studio. We have already started on your ${escapeHtml(
          input.tierLabel
        )} build. To finish setup we need a few quick things from you, about ${input.minutes} minutes total, and you can do them on your phone.</p>
        <p style="margin:0 0 12px">Your setup page is private to you. Opening it on a new device asks for a 6-digit code that we send to this email address.</p>
        ${button(input.url, 'Open my setup page')}
        <p style="margin:0 0 12px;font-size:14px;color:#525252">Or copy this link: <a href="${escapeHtml(input.url)}" style="color:#2563eb">${escapeHtml(input.url)}</a></p>
        <p style="margin:16px 0 0;font-size:14px;color:#525252">We will never ask for a password in this page or by email. Access to Google and other accounts goes through their own invites, which you simply accept.</p>
      `
    ),
  });
  return true;
}

/** The one-time code for the portal. Throws when mail is not configured, since the client cannot proceed without it. */
export async function sendVerificationCodeEmail(input: { to: string; code: string }): Promise<void> {
  const resend = getClient();
  if (!resend) throw new Error('Email is not configured (RESEND_API_KEY)');
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `${input.code} is your Axeon setup code`,
    html: clientLayout(
      'Your setup code',
      `
        <p style="margin:0 0 12px">Enter this code on your Axeon setup page. It works once and expires in 10 minutes.</p>
        <p style="margin:20px 0;font-size:36px;letter-spacing:.3em;font-weight:800;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${escapeHtml(
          input.code
        )}</p>
        <p style="margin:0;font-size:14px;color:#525252">If you did not request this, you can ignore this email. Nobody can use the code without your setup link.</p>
      `
    ),
  });
}

/** A gentle reminder listing what is still open, sent from the admin board. */
export async function sendNudgeEmail(input: {
  to: string;
  clientName: string | null;
  url: string;
  openItems: string[];
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const first = input.clientName?.split(' ')[0];
  const items = input.openItems.map((t) => `<li style="margin:0 0 6px">${escapeHtml(t)}</li>`).join('');
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `Quick one: ${input.openItems.length === 1 ? 'one thing' : `${input.openItems.length} things`} left to finish your Axeon setup`,
    html: clientLayout(
      'Almost there.',
      `
        <p style="margin:0 0 12px">${first ? `Hi ${escapeHtml(first)},` : 'Hi there,'}</p>
        <p style="margin:0 0 12px">Your build is moving. A few items on your setup page still need you, and each one takes a minute or two:</p>
        <ul style="margin:0 0 12px;padding-left:20px">${items}</ul>
        ${button(input.url, 'Finish my setup')}
      `
    ),
  });
  return true;
}

// ───────────────────────────── Owner alerts ─────────────────────────────
// These replace the Gmail steps of the retired n8n workflows. They go to
// ADMIN_EMAIL from the same From as the other owner alerts.

/** A new or returning website lead from /get-started. */
export async function sendLeadNotification(input: {
  returning: boolean;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  packageName: string;
  services: string[];
  budget: string;
  timeline: string;
  goal: string;
  savedTo: 'airtable' | 'n8n' | 'nowhere';
}): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;
  const who = input.businessName || input.contactName || input.email;
  const saved =
    input.savedTo === 'airtable'
      ? input.returning
        ? 'They were already in Airtable, so their record was updated (status unchanged).'
        : 'Saved in Airtable as a <b>Lead</b>.'
      : input.savedTo === 'n8n'
        ? 'Forwarded to n8n.'
        : '<b>Not saved anywhere: Airtable and n8n both failed.</b> Copy these details by hand.';
  await sendChecked(resend, {
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    replyTo: input.email,
    subject: `${input.returning ? 'Returning lead' : 'New website lead'}: ${who} (${input.packageName || 'no package'})`,
    html: `
      <p><b>${escapeHtml(input.contactName || 'Someone')}</b>${input.businessName ? ` from <b>${escapeHtml(input.businessName)}</b>` : ''} filled out the Get Started form.</p>
      <p>Recommended: <b>${escapeHtml(input.packageName || 'n/a')}</b><br>
      Services: ${escapeHtml(input.services.join(', ') || 'none')}<br>
      Budget: ${escapeHtml(input.budget || 'n/a')} · Timeline: ${escapeHtml(input.timeline || 'n/a')}<br>
      Goal: ${escapeHtml(input.goal || 'n/a')}<br>
      Email: ${escapeHtml(input.email)}<br>
      Phone: ${escapeHtml(input.phone || '(none)')}</p>
      <p>${saved} Reply to this email to answer them directly.</p>
    `,
  });
}

/** Sent once when a client finishes every item on their onboarding checklist. */
export async function sendOnboardingCompleteNotification(input: {
  displayName: string;
  planLabel: string;
  adminUrl: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;
  await sendChecked(resend, {
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `${input.displayName} finished their setup`,
    html: `
      <p><b>${escapeHtml(input.displayName)}</b> (${escapeHtml(input.planLabel)}) finished every item on their onboarding checklist.</p>
      <p><a href="${escapeHtml(input.adminUrl)}">Open their answers in the admin</a></p>
    `,
  });
}
