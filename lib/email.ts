// lib/email.ts
import { Resend } from 'resend';
import { WEEKDAY_LABELS, buttonLabel, campaignLabel, hourLabel, sourceLabel, type TrafficDetail, type TrafficSummary } from '@/lib/projectsShared';

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

/** The weekly post passed the automatic checks and is waiting for a person to approve it. */
export async function sendDraftReadyNotification(post: { title: string; id: number }): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Blog draft ready for your review: ${post.title}`,
    html: `
      <p>This week's blog post passed the automatic checks and is saved as a <b>draft</b>. It will not go live until you publish it.</p>
      <p><strong>${escapeHtml(post.title)}</strong></p>
      <p>Before publishing: check every number and source, and add one real detail from your own work in Iowa (a client result, a local example, a screenshot). That is what makes the post worth ranking.</p>
      <p><a href="https://app.axeonstudio.co/admin/posts/${post.id}/edit">Review, edit and publish</a></p>
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

// A PNG, because Gmail and Outlook drop SVG. Served from the main site's /public.
const EMAIL_LOGO_URL = 'https://axeonstudio.co/email/axeon-mark.png';

function clientLayout(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0a0a0a;line-height:1.55">
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px"><tr>
        <td style="vertical-align:middle;padding-right:10px"><img src="${EMAIL_LOGO_URL}" width="26" height="22" alt="" style="display:block;border:0"></td>
        <td style="vertical-align:middle;font-size:22px;font-weight:800;letter-spacing:-.02em;color:#0a0a0a">Axeon</td>
      </tr></table>
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
        <p style="margin:0 0 12px;font-size:14px;color:#525252">Your Welcome Packet (what happens and when, who to contact, what is included) is on the same page, or here: <a href="${escapeHtml(input.url)}/packet" style="color:#2563eb">Welcome Packet</a>.</p>
        <p style="margin:16px 0 0;font-size:14px;color:#525252">We will never ask for a password in this page or by email. Access to Google and other accounts goes through their own invites, which you simply accept.</p>
      `
    ),
  });
  return true;
}

/**
 * For a client who was live before AxeonPROOF existed: here is your dashboard.
 * Same secure link as the welcome; no checklist talk, no "about N minutes".
 */
export async function sendDashboardInviteEmail(input: {
  to: string;
  clientName: string | null;
  businessName: string | null;
  url: string;
  /** True when they already chose a password: the copy says "sign in" instead of "choose a password". */
  hasAccount: boolean;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const first = input.clientName?.split(' ')[0];
  const biz = input.businessName ? escapeHtml(input.businessName) : 'your business';
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: 'Your AxeonPROOF dashboard is ready',
    html: clientLayout(
      'Your numbers, in one place.',
      `
        <p style="margin:0 0 12px">${first ? `Hi ${escapeHtml(first)},` : 'Hi there,'}</p>
        <p style="margin:0 0 12px">We set up AxeonPROOF for ${biz}: a private dashboard with your website visits, the buttons customers press, how many reach out, and every update and monthly report from us. On the 1st of each month the same numbers land in your inbox.</p>
        <p style="margin:0 0 12px">${
          input.hasAccount
            ? 'Sign in with your business email and the password you already chose.'
            : 'Open the link below. On a new device we email you a 6-digit code first, then you choose a password for next time.'
        }</p>
        ${button(input.url, input.hasAccount ? 'Open AxeonPROOF' : 'Set up my dashboard')}
        <p style="margin:0 0 12px;font-size:14px;color:#525252">Or copy this link: <a href="${escapeHtml(input.url)}" style="color:#2563eb">${escapeHtml(input.url)}</a></p>
        <p style="margin:16px 0 0;font-size:14px;color:#525252">We will never ask for a password by email. Nothing changes about how we work together; this just lets you see it.</p>
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

/** AxeonPROOF "forgot password" link. Throws when mail is not configured or Resend refuses it. */
export async function sendPasswordResetEmail(input: { to: string; url: string }): Promise<void> {
  const resend = getClient();
  if (!resend) throw new Error('Email is not configured (RESEND_API_KEY)');
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: 'Reset your AxeonPROOF password',
    html: clientLayout(
      'Reset your password',
      `
        <p style="margin:0 0 12px">Someone asked to reset the AxeonPROOF password for this email. If it was you, use the button below. The link works once and expires in 60 minutes.</p>
        ${button(input.url, 'Choose a new password')}
        <p style="margin:0;font-size:14px;color:#525252">If you didn't ask for this, ignore this email. Your password stays the same.</p>
      `
    ),
  });
}

// ───────────────────────────── Owner alerts ─────────────────────────────
// They go to ADMIN_EMAIL from the same From as the other owner alerts.

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
  savedTo: 'airtable' | 'nowhere';
}): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;
  const who = input.businessName || input.contactName || input.email;
  const saved =
    input.savedTo === 'airtable'
      ? input.returning
        ? 'They were already in Airtable, so their record was updated (status unchanged).'
        : 'Saved in Airtable as a <b>Lead</b>.'
      : '<b>Not saved to Airtable</b> (it failed or is not connected). Copy these details by hand.';
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

// ───────────────────────────── Agreements ─────────────────────────────

function requireClient(): Resend {
  const resend = getClient();
  if (!resend) throw new Error('Email is not configured (RESEND_API_KEY)');
  return resend;
}

const firstName = (name: string | null | undefined) => {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `Hi ${escapeHtml(first)},` : 'Hi there,';
};

/** "Please review and sign": sent when Axeon creates an agreement in the admin. */
export async function sendAgreementEmail(input: {
  to: string;
  contactName: string;
  businessName: string;
  planLabel: string;
  number: string;
  url: string;
}): Promise<void> {
  await sendChecked(requireClient(), {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `Your Axeon agreement is ready to sign (${input.number})`,
    html: clientLayout(
      'Your agreement is ready to sign.',
      `
        <p style="margin:0 0 12px">${firstName(input.contactName)}</p>
        <p style="margin:0 0 12px">Here is the Client Services Agreement for <b>${escapeHtml(input.businessName)}</b> on the ${escapeHtml(
          input.planLabel
        )} plan. Read it, sign by typing your name, then pay the setup fee and first month. It takes about five minutes.</p>
        ${button(input.url, 'Review and sign')}
        <p style="margin:0 0 12px;font-size:14px;color:#525252">As soon as payment goes through, you get your setup page by email and we start building.</p>
      `
    ),
  });
}

/** The client's signed copy, plus a heads-up to the owner. */
export async function sendAgreementSignedEmails(input: {
  to: string;
  contactName: string;
  businessName: string;
  number: string;
  url: string;
  signedName: string;
}): Promise<void> {
  const resend = requireClient();
  await sendChecked(resend, {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `Signed: your Axeon agreement (${input.number})`,
    html: clientLayout(
      'Signed. Here is your copy.',
      `
        <p style="margin:0 0 12px">${firstName(input.contactName)}</p>
        <p style="margin:0 0 12px">Thanks. Your agreement is signed and countersigned by Axeon Studio. Keep this email: the link below always opens your signed copy, which you can print or save as a PDF.</p>
        ${button(input.url, 'View my signed agreement')}
        <p style="margin:0 0 12px;font-size:14px;color:#525252">If you have not paid yet, the same page has a button to finish payment.</p>
      `
    ),
  });
  if (ADMIN_NOTIFICATION_EMAIL) {
    await sendChecked(resend, {
      from: FROM_ADDRESS,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `${input.businessName} signed agreement ${input.number}`,
      html: `<p><b>${escapeHtml(input.signedName)}</b> signed agreement ${escapeHtml(input.number)} for <b>${escapeHtml(
        input.businessName
      )}</b>. Payment comes next; onboarding starts by itself once it clears.</p><p><a href="${escapeHtml(input.url)}">Open the signed copy</a></p>`,
    });
  }
}

// ───────────────────────────── Updates & reports ─────────────────────────────

type EmailLine = { title: string; body: string };

function linesHtml(lines: EmailLine[]): string {
  if (!lines.length) return '';
  return `<ol style="margin:0 0 16px;padding-left:20px">${lines
    .map((l) => `<li style="margin:0 0 8px">${l.title ? `<b>${escapeHtml(l.title)}.</b> ` : ''}${escapeHtml(l.body)}</li>`)
    .join('')}</ol>`;
}

const h2 = (text: string) =>
  `<h2 style="margin:24px 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#525252">${escapeHtml(text)}</h2>`;
const para = (text: string) => (text ? `<p style="margin:0 0 12px">${escapeHtml(text)}</p>` : '');

export async function sendProjectUpdateEmail(input: {
  to: string;
  clientName: string | null;
  number: number;
  title: string;
  summary: string;
  type: string;
  status: string;
  link: string;
  changes: EmailLine[];
  why: string;
  actionNeeded: string;
  nextUp: string;
  proofUrl: string;
}): Promise<void> {
  await sendChecked(requireClient(), {
    from: CLIENT_FROM_ADDRESS,
    replyTo: CLIENT_REPLY_TO,
    to: input.to,
    subject: `Update #${input.number}: ${input.title}`,
    html: clientLayout(
      escapeHtml(input.title),
      `
        <p style="margin:0 0 12px">${firstName(input.clientName)}</p>
        ${para(input.summary)}
        <p style="margin:0 0 16px;font-size:14px;color:#525252">${escapeHtml(input.type)} · ${escapeHtml(input.status)}${
          input.link ? ` · <a href="${escapeHtml(input.link)}" style="color:#2563eb">See it</a>` : ''
        }</p>
        ${input.changes.length ? h2('What changed') + linesHtml(input.changes) : ''}
        ${input.why ? h2('Why this matters for your business') + para(input.why) : ''}
        ${h2('What we need from you')}
        ${para(input.actionNeeded || 'Nothing right now.')}
        ${input.nextUp ? h2("What's next") + para(input.nextUp) : ''}
        ${button(input.proofUrl, 'Open AxeonPROOF')}
      `
    ),
  });
}

/** Tiles two to a row, so they read on a phone. */
function statTiles(stats: Array<{ label: string; value: string; sub?: string | null }>): string {
  const tile = (s: { label: string; value: string; sub?: string | null }) => `<td width="50%" style="padding:12px;border:1px solid #e5e5e5;border-radius:8px;vertical-align:top">
        <div style="font-size:12px;color:#525252">${escapeHtml(s.label)}</div>
        <div style="font-size:24px;font-weight:800">${escapeHtml(s.value)}</div>
        ${s.sub ? `<div style="font-size:12px;color:#525252">${escapeHtml(s.sub)}</div>` : ''}
      </td>`;
  const rows: string[] = [];
  for (let i = 0; i < stats.length; i += 2) {
    rows.push(`<tr>${tile(stats[i])}${stats[i + 1] ? tile(stats[i + 1]) : '<td width="50%"></td>'}</tr>`);
  }
  return `<table role="presentation" cellspacing="6" style="width:100%;margin:0 0 8px">${rows.join('')}</table>`;
}

/** A two-column "name · count" list for the traffic breakdowns. */
function countList(rows: Array<{ label: string; count: number }>): string {
  if (!rows.length) return '';
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 8px;font-size:14px">${rows
    .map(
      (r) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;white-space:nowrap">${r.count}</td>
      </tr>`
    )
    .join('')}</table>`;
}

const pageName = (path: string) => (path === '/' ? 'Home page' : path);

/** Top two of a 24-hour or 7-day histogram, as words. */
function peaks(counts: number[], label: (i: number) => string): string[] {
  return counts
    .map((n, i) => ({ n, i }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
    .map((x) => label(x.i));
}

/** "Most often on Saturdays and Fridays, around 9am and 2pm." or empty. */
export function whenTheyReachOut(d: TrafficDetail): string {
  const days = peaks(d.conversionDays, (i) => `${WEEKDAY_LABELS[i]}s`);
  const hours = peaks(d.conversionHours, (i) => hourLabel(i));
  if (!days.length && !hours.length) return '';
  const parts: string[] = [];
  if (days.length) parts.push(`on ${days.join(' and ')}`);
  if (hours.length) parts.push(`around ${hours.join(' and ')}`);
  return `Most often ${parts.join(', ')}.`;
}

/** The "used your site" paragraph: visits, phones, time, bounce. */
export function usageSentence(t: TrafficSummary, d: TrafficDetail): string {
  const totalDev = d.devices.phone + d.devices.tablet + d.devices.desktop;
  const phonePct = totalDev ? Math.round(((d.devices.phone + d.devices.tablet) / totalDev) * 100) : null;
  const bits: string[] = [];
  bits.push(`${d.sessions} ${d.sessions === 1 ? 'visit' : 'visits'} from ${t.visitors} ${t.visitors === 1 ? 'person' : 'people'}`);
  if (d.returningVisitors) bits.push(`${d.returningVisitors} came back more than once`);
  if (phonePct != null) bits.push(`${phonePct}% were on a phone or tablet`);
  let out = bits.join('; ') + '.';
  if (d.avgSeconds) {
    const t2 = d.avgSeconds >= 90 ? `${Math.round(d.avgSeconds / 60)} min` : `${d.avgSeconds} sec`;
    out += ` A typical visit lasted about ${t2} over ${d.pagesPerSession} ${d.pagesPerSession === 1 ? 'page' : 'pages'}`;
    out += d.avgScroll ? `, reading about ${d.avgScroll}% of the way down.` : '.';
  }
  if (d.sessions >= 10) out += ` ${d.bounceRate}% left after one page without pressing anything.`;
  if (d.speedMs) out += ` Pages loaded in about ${(d.speedMs / 1000).toFixed(1)} seconds for a typical visitor.`;
  return out;
}

function detailSections(t: TrafficSummary, d: TrafficDetail): string {
  const landing = d.landing
    .filter((l) => l.sessions > 0)
    .slice(0, 5)
    .map((l) => ({ label: `${pageName(l.path)}${l.conversions ? ` · ${l.conversions} reached out` : ''}`, count: l.sessions }));
  const places = d.places.slice(0, 5).map((p) => ({ label: `${p.city}${p.conversions ? ` · ${p.conversions} reached out` : ''}`, count: p.sessions }));
  const campaigns = d.campaigns
    .slice(0, 5)
    .map((c) => ({ label: `${campaignLabel(c)}${c.conversions ? ` · ${c.conversions} reached out` : ''}`, count: c.sessions }));
  const when = whenTheyReachOut(d);
  return `
    ${h2('How people used your site')}${para(usageSentence(t, d))}
    ${landing.length ? h2('Pages visitors landed on') + countList(landing) : ''}
    ${campaigns.length ? h2('Campaigns that sent visitors') + countList(campaigns) : ''}
    ${places.length ? h2('Where visitors are') + countList(places) : ''}
    ${when ? h2('When customers reach out') + para(when) : ''}
  `;
}

function trafficSections(t: TrafficSummary): string {
  const buttons = t.buttons.slice(0, 6).map((b) => ({ label: buttonLabel(b.name), count: b.count }));
  const sources = t.sources.slice(0, 5).map((x) => ({ label: sourceLabel(x.host), count: x.count }));
  const pages = t.pages.slice(0, 5).map((pg) => ({ label: pageName(pg.path), count: pg.count }));
  const d = t.detail && t.detail.sessions > 0 ? t.detail : null;
  return `
    ${buttons.length ? h2('Most clicked buttons') + countList(buttons) : ''}
    ${sources.length ? h2('Where visitors came from') + countList(sources) : ''}
    ${pages.length ? h2('Most visited pages') + countList(pages) : ''}
    ${d ? detailSections(t, d) : ''}
    ${closeRateNote(t)}
  `;
}

/** The fine print under the numbers: where the close rate came from. */
export function closeRateNote(t: TrafficSummary): string {
  const e = t.closeRateEstimate;
  if (!e || t.conversions === 0) {
    return `<p style="margin:12px 0 0;font-size:13px;color:#737373">“Estimated new customers” counts ${t.closeRate}% of the people who called, texted, emailed, sent a form or booked from your site. Tell us your real number and we will use that instead.</p>`;
  }
  const reasons = e.factors.map((f) => `<li style="margin:0 0 4px">${escapeHtml(f.label)}${f.effect ? ` (+${f.effect})` : ''}</li>`).join('');
  const who = t.assistedContacts
    ? `${t.conversions} people who reached out (${t.directContacts} pressed call, text, form, book or directions on the site; about ${t.assistedContacts} more read your number on a computer and most likely called from their phone)`
    : `${t.conversions} people who reached out`;
  return `
    <p style="margin:12px 0 4px;font-size:13px;color:#737373">How we got to ${e.rate}%: of the ${who}, we estimate ${e.low}% to ${e.high}% became customers, so about ${t.estimatedCustomers} (likely ${t.customersLow} to ${t.customersHigh}). The reasons:</p>
    <ul style="margin:0 0 8px;padding-left:18px;font-size:13px;color:#737373">${reasons}</ul>
    <p style="margin:0;font-size:13px;color:#737373">Know your real number? Reply with it and we will use that from now on.</p>
  `;
}

export interface MonthlyReportEmailInput {
  to: string;
  clientName: string | null;
  monthLabel: string;
  stats: Array<{ label: string; value: string; sub?: string | null }>;
  traffic?: TrafficSummary | null;
  done: EmailLine[];
  next: EmailLine[];
  fromYou: string;
  note: string;
  proofUrl: string;
}

/** The report email as subject + HTML, with no sending, so a sample can be rendered anywhere. */
export function renderMonthlyReportEmail(input: MonthlyReportEmailInput): { subject: string; html: string } {
  const t = input.traffic ?? null;
  const intro = t
    ? `How your website did in ${escapeHtml(input.monthLabel)}: who visited, which buttons they pressed, and how many likely became customers.`
    : `Calls, leads and booked jobs for ${escapeHtml(input.monthLabel)}, and what we are doing next. Customers, not clicks.`;
  return {
    subject: `Your ${input.monthLabel} report from Axeon`,
    html: clientLayout(
      `${escapeHtml(input.monthLabel)} in numbers.`,
      `
        <p style="margin:0 0 12px">${firstName(input.clientName)}</p>
        <p style="margin:0 0 16px">${intro}</p>
        ${statTiles(input.stats)}
        ${input.note ? para(input.note) : ''}
        ${t ? trafficSections(t) : ''}
        ${input.done.length ? h2('What we did this month') + linesHtml(input.done) : ''}
        ${input.next.length ? h2("Next month's plan") + linesHtml(input.next) : ''}
        ${input.fromYou ? h2('From you') + para(input.fromYou) : ''}
        ${button(input.proofUrl, 'Open AxeonPROOF')}
      `
    ),
  };
}

export async function sendMonthlyReportEmail(input: MonthlyReportEmailInput): Promise<void> {
  const { subject, html } = renderMonthlyReportEmail(input);
  await sendChecked(requireClient(), { from: CLIENT_FROM_ADDRESS, replyTo: CLIENT_REPLY_TO, to: input.to, subject, html });
}

/** Owner digest after the 1st-of-the-month job: who got a report, who was skipped and why. */
export async function sendMonthlyReportsDigest(input: {
  monthLabel: string;
  sent: string[];
  skipped: Array<{ name: string; reason: string }>;
  failed: Array<{ name: string; error: string }>;
  adminUrl: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;
  const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p>None.</p>');
  const subject = input.failed.length
    ? `${input.monthLabel} client reports: ${input.sent.length} sent, ${input.failed.length} failed`
    : `${input.monthLabel} client reports: ${input.sent.length} sent`;
  await sendChecked(resend, {
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject,
    html: `
      <p>The automatic ${escapeHtml(input.monthLabel)} reports went out this morning.</p>
      <p><b>Sent (${input.sent.length})</b></p>${list(input.sent)}
      <p><b>Skipped (${input.skipped.length})</b></p>${list(input.skipped.map((s) => `${s.name}: ${s.reason}`))}
      ${input.failed.length ? `<p><b>Failed (${input.failed.length})</b></p>${list(input.failed.map((f) => `${f.name}: ${f.error}`))}` : ''}
      <p>A skipped client has no website numbers for the month (snippet not installed yet) and nothing typed in. Add the snippet or type their report on their admin page and press “Send now”.</p>
      <p><a href="${escapeHtml(input.adminUrl)}">Open the client board</a></p>
    `,
  });
}
