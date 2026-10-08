// lib/email.ts
import { Resend } from 'resend';
import { WEEKDAY_LABELS, buttonLabel, campaignLabel, hourLabel, sourceLabel, type TrafficDetail, type TrafficSummary } from '@/lib/projectsShared';
import { TAGLINE, alwaysOnSentence, headlineSentence, reportHighlights } from '@/lib/reportCopy';
import type { OnboardingTier } from '@/data/onboardingItems';

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

// ───────────────────────────── Report look (Axeon brand) ─────────────────────────────
// Same language as axeonstudio.co: Plus Jakarta Sans, blue-600 accents, near-black
// ink. Built to survive every mail app's dark mode: the base is light background
// with dark text (which stays readable whether a client inverts fully, partially,
// or not at all), blue is used for accents rather than white-on-dark blocks, and a
// real dark theme is supplied for clients that honour prefers-color-scheme or
// Gmail's data-ogsc hooks. Web fonts load where allowed and fall back to the
// system sans elsewhere.

const BRAND = {
  blue: '#2563eb',
  blueDeep: '#1d4ed8',
  blueTint: '#eaf1ff',
  ink: '#0a0a0a',
  body: '#262626',
  muted: '#6b7280',
  faint: '#9ca3af',
  line: '#e5e7eb',
  wash: '#f4f6fa',
  green: '#059669',
};
const FONT = "'Plus Jakarta Sans',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

/** The dark theme, applied by clients that honour prefers-color-scheme and by Gmail on Android (data-ogsc). */
const DARK_CSS = `
  .ax-wash { background:#0b0e14 !important; }
  .ax-card { background:#12151d !important; }
  .ax-ink { color:#f5f7fa !important; }
  .ax-body { color:#d4d8e0 !important; }
  .ax-muted { color:#9aa3b2 !important; }
  .ax-faint { color:#6b7280 !important; }
  .ax-rule { border-top-color:#262b36 !important; }
  .ax-tile { background:#171b25 !important; border-color:#262b36 !important; }
  .ax-hero { background:#13213f !important; border-color:#2b4a8f !important; }
  .ax-box { background:#171b25 !important; }
  .ax-track { background:#1c2740 !important; }
  .ax-band { background:#0b0e14 !important; }
  .ax-pill { background:#13213f !important; }
  .ax-blue { color:#7aa7ff !important; }
  .ax-green { color:#4ade80 !important; }
`;

/** A full HTML document: light base, dark theme attached, the Axeon font loaded where allowed. */
function brandDocument(input: { subject: string; headerHtml: string; bodyHtml: string; footerHtml: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; background:${BRAND.wash}; }
  a { color:${BRAND.blue}; }
  @media (max-width: 600px) { .tile { display:block !important; width:100% !important; } .pad { padding-left:20px !important; padding-right:20px !important; } }
  @media (prefers-color-scheme: dark) { ${DARK_CSS} }
  ${DARK_CSS.replace(/\n\s*\./g, '\n  [data-ogsc] .').replace(/\[data-ogsc\] \.ax-wash|\[data-ogsc\] \.ax-card|\[data-ogsc\] \.ax-band/g, (m) => m.replace('[data-ogsc]', '[data-ogsb]'))}
</style>
</head>
<body class="ax-wash" style="margin:0;padding:0;background:${BRAND.wash}">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="ax-wash" style="background:${BRAND.wash}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" class="ax-card" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:${FONT};color:${BRAND.body};line-height:1.55">
  <tr><td class="pad" style="padding:28px 32px 8px">
    ${input.headerHtml}
  </td></tr>
  <tr><td class="pad" style="padding:8px 32px 8px">
    ${input.bodyHtml}
  </td></tr>
  <tr><td class="pad ax-band" style="background:${BRAND.wash};padding:22px 32px;border-top:1px solid ${BRAND.line}">
    ${input.footerHtml}
  </td></tr>
</table>
<p class="ax-faint" style="margin:16px 0 0;font-family:${FONT};font-size:12px;color:${BRAND.faint};text-align:center">Axeon Studio · West Des Moines, Iowa</p>
</td></tr></table>
</body>
</html>`;
}

/** The mark (blue on transparent, so it works on light and dark) and the wordmark in ink. */
const brandLogo = (product?: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0"><tr>
    <td style="vertical-align:middle;padding-right:10px"><img src="${EMAIL_LOGO_URL}" width="26" height="22" alt="" style="display:block;border:0"></td>
    <td class="ax-ink" style="vertical-align:middle;font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:-.02em;color:${BRAND.ink};line-height:1">Axeon${
      product ? `<span class="ax-blue" style="color:${BRAND.blue};font-weight:800">${escapeHtml(product)}</span>` : ''
    }</td>
  </tr></table>`;

const rH2 = (text: string) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:26px 0 10px"><tr>
     <td class="ax-blue" style="font-family:${FONT};font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:${BRAND.blue};white-space:nowrap;padding-right:12px">${escapeHtml(text)}</td>
     <td width="100%" class="ax-rule" style="border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:1px">&nbsp;</td>
   </tr></table>`;

const rPara = (text: string, extra = '', cls = 'ax-body') =>
  text ? `<p class="${cls}" style="margin:0 0 12px;font-size:15px;color:${cls === 'ax-ink' ? BRAND.ink : BRAND.body};${extra}">${escapeHtml(text)}</p>` : '';

/** Positive change in green, the rest muted. */
const subHtml = (sub: string | null | undefined) => {
  if (!sub) return '';
  return `<div class="ax-muted" style="font-size:12px;line-height:1.4;color:${BRAND.muted};margin-top:6px">${escapeHtml(sub).replace(
    /\+(\d+)(%?) vs last month/g,
    `<span class="ax-green" style="color:${BRAND.green};font-weight:700">+$1$2 vs last month</span>`
  )}</div>`;
};

/**
 * Two tiles to a row. The first two are the headline: blue-tinted with a blue
 * border and a blue number. The rest are plain with a thin border.
 */
function rTiles(stats: Array<{ label: string; value: string; sub?: string | null }>): string {
  const tile = (st: { label: string; value: string; sub?: string | null }, i: number) => {
    const hero = i < 2;
    return `<td class="tile" width="50%" style="padding:0 6px 12px;vertical-align:top">
      <div class="${hero ? 'ax-hero' : 'ax-tile'}" style="background:${hero ? BRAND.blueTint : '#ffffff'};border:${hero ? '2px' : '1px'} solid ${hero ? BRAND.blue : BRAND.line};border-radius:12px;padding:${hero ? '15px 15px 13px' : '16px 16px 14px'}">
        <div class="${hero ? 'ax-blue' : 'ax-muted'}" style="font-size:12px;font-weight:700;letter-spacing:.02em;color:${hero ? BRAND.blueDeep : BRAND.muted}">${escapeHtml(st.label)}</div>
        <div class="${hero ? 'ax-blue' : 'ax-ink'}" style="font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.02em;margin-top:6px;color:${hero ? BRAND.blue : BRAND.ink}">${escapeHtml(st.value)}</div>
        ${subHtml(st.sub)}
      </div>
    </td>`;
  };
  const rows: string[] = [];
  for (let i = 0; i < stats.length; i += 2) {
    rows.push(`<tr>${tile(stats[i], i)}${stats[i + 1] ? tile(stats[i + 1], i + 1) : '<td class="tile" width="50%"></td>'}</tr>`);
  }
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px -6px 0;width:calc(100% + 12px)">${rows.join('')}</table>`;
}

/** Rows with a proportional blue bar behind the count, so the biggest line is obvious at a glance. */
function rBars(rows: Array<{ label: string; count: number }>): string {
  if (!rows.length) return '';
  const max = Math.max(1, ...rows.map((r) => r.count));
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 6px;font-size:14px">${rows
    .map((r) => {
      const pct = Math.max(4, Math.round((r.count / max) * 100));
      return `<tr>
        <td style="padding:7px 0;vertical-align:middle">
          <div class="ax-body" style="color:${BRAND.body}">${escapeHtml(r.label)}</div>
          <div class="ax-track" style="height:5px;background:${BRAND.blueTint};border-radius:3px;margin-top:5px;overflow:hidden"><div style="height:5px;width:${pct}%;background:${BRAND.blue};border-radius:3px"></div></div>
        </td>
        <td width="56" class="ax-ink" style="padding:7px 0 7px 12px;text-align:right;font-weight:800;color:${BRAND.ink};white-space:nowrap;vertical-align:middle">${r.count.toLocaleString('en-US')}</td>
      </tr>`;
    })
    .join('')}</table>`;
}

/** Wins with a blue check. */
const rWins = (wins: string[]) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px">${wins
    .map(
      (w) => `<tr>
      <td class="ax-blue" style="vertical-align:top;padding:0 10px 8px 0;color:${BRAND.blue};font-weight:800;font-size:15px;line-height:1.5">&#10003;</td>
      <td class="ax-body" style="vertical-align:top;padding:0 0 8px;font-size:15px;color:${BRAND.body}">${escapeHtml(w)}</td>
    </tr>`
    )
    .join('')}</table>`;

/** Numbered steps in blue circles for "what we did" and "what's next". */
const rSteps = (lines: EmailLine[]) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px">${lines
    .map(
      (l, i) => `<tr>
      <td style="vertical-align:top;padding:2px 12px 10px 0"><div style="width:22px;height:22px;border-radius:11px;background:${BRAND.blue};color:#ffffff;font-size:12px;font-weight:800;text-align:center;line-height:22px">${i + 1}</div></td>
      <td class="ax-body" style="vertical-align:top;padding:0 0 10px;font-size:15px;color:${BRAND.body}">${l.title ? `<b class="ax-ink" style="color:${BRAND.ink}">${escapeHtml(l.title)}.</b> ` : ''}${escapeHtml(l.body)}</td>
    </tr>`
    )
    .join('')}</table>`;

const rButton = (href: string, label: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 4px"><tr><td style="background:${BRAND.blue};border-radius:999px">
     <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(label)}</a>
   </td></tr></table>`;

/** What the work produced: the buttons pressed, the pages that brought people, the campaigns. */
function producedSections(t: TrafficSummary): string {
  const buttons = t.buttons.slice(0, 6).map((b) => ({ label: buttonLabel(b.name), count: b.count }));
  const d = t.detail && t.detail.sessions > 0 ? t.detail : null;
  const landing = (d?.landing ?? [])
    .filter((l) => l.sessions > 0)
    .slice(0, 5)
    .map((l) => ({ label: `${pageName(l.path)}${l.conversions ? ` · ${l.conversions} reached out` : ''}`, count: l.sessions }));
  const campaigns = (d?.campaigns ?? [])
    .slice(0, 5)
    .map((c) => ({ label: `${campaignLabel(c)}${c.conversions ? ` · ${c.conversions} reached out` : ''}`, count: c.sessions }));
  return `
    ${buttons.length ? rH2('What people pressed') + rBars(buttons) : ''}
    ${landing.length ? rH2('Pages that brought them in') + rBars(landing) : ''}
    ${campaigns.length ? rH2('Campaigns that sent visitors') + rBars(campaigns) : ''}
  `;
}

/** Who found the site and how they used it. */
function audienceSections(t: TrafficSummary): string {
  const sources = t.sources.slice(0, 5).map((x) => ({ label: sourceLabel(x.host), count: x.count }));
  const pages = t.pages.slice(0, 5).map((pg) => ({ label: pageName(pg.path), count: pg.count }));
  const d = t.detail && t.detail.sessions > 0 ? t.detail : null;
  const places = (d?.places ?? []).slice(0, 5).map((p) => ({ label: `${p.city}${p.conversions ? ` · ${p.conversions} reached out` : ''}`, count: p.sessions }));
  const when = d ? whenTheyReachOut(d) : '';
  return `
    ${sources.length ? rH2('Where they found you') + rBars(sources) : ''}
    ${places.length ? rH2('Where they are') + rBars(places) : ''}
    ${d ? rH2('How they used your site') + rPara(usageSentence(t, d)) : ''}
    ${pages.length ? rH2('Most visited pages') + rBars(pages) : ''}
    ${when ? rH2('When customers reach out') + rPara(when) : ''}
  `;
}

/** The fine print under the numbers: where the close rate came from. */
export function closeRateNote(t: TrafficSummary): string {
  const e = t.closeRateEstimate;
  if (!e || t.conversions === 0) {
    return `<p class="ax-muted" style="margin:20px 0 0;font-size:13px;color:${BRAND.muted}">“Estimated new customers” counts ${t.closeRate}% of the people who called, texted, emailed, sent a form or booked from your site. Tell us your real number and we will use that instead.</p>`;
  }
  const reasons = e.factors.map((f) => `<li style="margin:0 0 4px">${escapeHtml(f.label)}${f.effect ? ` <span class="ax-green" style="color:${BRAND.green};font-weight:700">+${f.effect}</span>` : ''}</li>`).join('');
  const who = t.assistedContacts
    ? `${t.conversions} people who reached out (${t.directContacts} pressed call, text, form, book or directions on the site; about ${t.assistedContacts} more read your number on a computer and most likely called from their phone)`
    : `${t.conversions} people who reached out`;
  return `
    <div class="ax-box" style="margin:22px 0 0;padding:14px 16px;background:${BRAND.wash};border-radius:12px">
      <p class="ax-muted" style="margin:0 0 6px;font-size:13px;color:${BRAND.muted}">How we got to ${e.rate}%: of the ${who}, we estimate ${e.low}% to ${e.high}% became customers, so about ${t.estimatedCustomers} (likely ${t.customersLow} to ${t.customersHigh}). The reasons:</p>
      <ul class="ax-muted" style="margin:0 0 8px;padding-left:18px;font-size:13px;color:${BRAND.muted}">${reasons}</ul>
      <p class="ax-muted" style="margin:0;font-size:13px;color:${BRAND.muted}">Know your real number? Reply with it and we will use that from now on.</p>
    </div>
  `;
}

export interface MonthlyReportEmailInput {
  to: string;
  clientName: string | null;
  businessName?: string | null;
  tier?: OnboardingTier | null;
  monthLabel: string;
  prevMonthLabel?: string | null;
  stats: Array<{ label: string; value: string; sub?: string | null }>;
  traffic?: TrafficSummary | null;
  prevTraffic?: TrafficSummary | null;
  avgJobValue?: number | null;
  /** Typed-in report fields the wins draw on. */
  rank?: number | null;
  keyword?: string;
  reviews?: number | null;
  rating?: number | null;
  prevRank?: number | null;
  done: EmailLine[];
  next: EmailLine[];
  fromYou: string;
  note: string;
  proofUrl: string;
}

/**
 * The report email as subject + HTML, with no sending, so a sample can be
 * rendered anywhere. Framed as "here is what Axeon did for you": outcome first,
 * then the work, then what it produced, then who found them.
 */
export function renderMonthlyReportEmail(input: MonthlyReportEmailInput): { subject: string; html: string } {
  const t = input.traffic ?? null;
  const business = input.businessName?.trim() || 'your business';
  const typed = { rank: input.rank ?? null, keyword: input.keyword ?? '', reviews: input.reviews ?? null, rating: input.rating ?? null };
  const headline = t
    ? headlineSentence({
        business,
        monthLabel: input.monthLabel,
        prevMonthLabel: input.prevMonthLabel,
        traffic: t,
        prev: input.prevTraffic,
        avgJobValue: input.avgJobValue,
      })
    : `Calls, leads and booked jobs for ${input.monthLabel}, and what we are doing next.`;
  const wins = t ? reportHighlights({ traffic: t, prev: input.prevTraffic, report: typed, prevReport: input.prevRank != null ? { rank: input.prevRank } : null }) : [];
  const subject = t && t.conversions > 0
    ? `${t.conversions} ${t.conversions === 1 ? 'person' : 'people'} reached out to ${business} in ${input.monthLabel}. Here is how.`
    : `What Axeon did for ${business} in ${input.monthLabel}`;
  const didSomething = input.done.length > 0;
  const headerHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td style="vertical-align:middle">${brandLogo('PROOF')}</td>
      <td style="vertical-align:middle;text-align:right"><span class="ax-pill ax-blue" style="display:inline-block;padding:6px 12px;border-radius:999px;background:${BRAND.blueTint};color:${BRAND.blueDeep};font-size:12px;font-weight:700;letter-spacing:.04em">${escapeHtml(input.monthLabel)}</span></td>
    </tr></table>
    <h1 class="ax-ink" style="margin:26px 0 0;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.02em;color:${BRAND.ink}">Here is what Axeon did for you in ${escapeHtml(input.monthLabel)}.</h1>
    <p class="ax-body" style="margin:14px 0 0;font-family:${FONT};font-size:16px;line-height:1.5;color:${BRAND.body}">${escapeHtml(headline)}</p>
  `;
  const bodyHtml = `
    <p class="ax-body" style="margin:10px 0 14px;font-size:15px;color:${BRAND.body}">${firstName(input.clientName)}</p>
    ${rTiles(input.stats)}
    ${input.note ? rPara(input.note, 'margin-top:6px;font-weight:600', 'ax-ink') : ''}
    ${wins.length ? rH2("This month's wins") + rWins(wins) : ''}
    ${rH2('What Axeon did this month')}
    ${didSomething ? rSteps(input.done) : ''}
    ${input.tier ? `<p class="ax-muted" style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${BRAND.muted}">${escapeHtml(alwaysOnSentence(input.tier))}</p>` : ''}
    ${t ? producedSections(t) : ''}
    ${t ? audienceSections(t) : ''}
    ${input.next.length ? rH2('What we are doing next month') + rSteps(input.next) : ''}
    ${input.fromYou ? rH2('One thing we need from you') + rPara(input.fromYou) : ''}
    ${t ? closeRateNote(t) : ''}
    <div style="margin:26px 0 20px">${rButton(input.proofUrl, 'See it all in AxeonPROOF')}</div>
  `;
  const footerHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td style="vertical-align:middle">${brandLogo()}</td>
      <td class="ax-ink" style="vertical-align:middle;text-align:right;font-family:${FONT};font-size:14px;font-weight:800;color:${BRAND.ink};letter-spacing:-.01em">${TAGLINE}</td>
    </tr></table>
    <p class="ax-muted" style="margin:14px 0 0;font-family:${FONT};font-size:13px;color:${BRAND.muted}">Questions? Reply to this email or call <a class="ax-blue" href="tel:+15154938017" style="color:${BRAND.blue};text-decoration:none">(515) 493-8017</a>.</p>
  `;
  return { subject, html: brandDocument({ subject, headerHtml, bodyHtml, footerHtml }) };
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
