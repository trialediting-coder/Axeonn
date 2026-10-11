// lib/businessEmailShared.ts
// The business email every plan includes (you@yourbusiness.com, on Google
// Workspace). Types and pure helpers shared by the server (lib/businessEmail.ts),
// the admin panel and the client's Email tab. Client-safe: no Node imports.
//
// How a mailbox reaches the client (owner decision 2026-10-11):
//   1. The client lists the addresses they want on the setup page (the "domain" card).
//   2. Axeon creates each user in Google Workspace with "Send sign-in instructions"
//      to the person's own email and "Ask for a password change at next sign-in".
//      Google delivers the login; Axeon never sees, stores or sends a password.
//   3. Axeon marks the mailbox Active here and sends the "your email is live" email.
//   4. AxeonPROOF's Email tab shows the mailboxes, the spam-protection checks, and
//      takes requests (new mailbox, locked out), which email the owner.

export type MailboxStatus = 'pending' | 'active';

export interface Mailbox {
  address: string;
  /** Who uses it ("Mike", "Shared inbox"). */
  person: string;
  status: MailboxStatus;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type DnsCheckKey = 'mx' | 'spf' | 'dkim' | 'dmarc';

export interface DnsCheckResult {
  status: CheckStatus;
  /** One plain sentence on what was found. */
  note: string;
}

export interface DnsReport {
  checkedAt: string;
  domain: string;
  checks: Record<DnsCheckKey, DnsCheckResult>;
}

export type EmailRequestKind = 'add' | 'locked-out' | 'other';

export interface EmailRequest {
  id: string;
  kind: EmailRequestKind;
  detail: string;
  at: string;
  resolvedAt: string | null;
}

export interface BusinessEmailSetup {
  domain: string | null;
  mailboxes: Mailbox[];
  /** When the "your email is live" email went to the client. */
  liveSentAt: string | null;
  dns: DnsReport | null;
  requests: EmailRequest[];
}

export const emptySetup = (): BusinessEmailSetup => ({ domain: null, mailboxes: [], liveSentAt: null, dns: null, requests: [] });

/** Client-facing names for each check, in display order. */
export const DNS_CHECKS: ReadonlyArray<{ key: DnsCheckKey; label: string; plain: string }> = [
  { key: 'mx', label: 'Mail delivery (MX)', plain: 'Email sent to your address arrives in Google.' },
  { key: 'spf', label: 'Sender check (SPF)', plain: 'Other inboxes can tell Google is allowed to send for you.' },
  { key: 'dkim', label: 'Signature (DKIM)', plain: 'Every email you send is signed, so it lands in the inbox, not spam.' },
  { key: 'dmarc', label: 'Spoofing protection (DMARC)', plain: 'Stops scammers from sending email that pretends to be you.' },
];

export const REQUEST_KINDS: ReadonlyArray<{ kind: EmailRequestKind; label: string; placeholder: string }> = [
  { kind: 'add', label: 'Add a mailbox', placeholder: 'sarah@ for Sarah, our new office manager' },
  { kind: 'locked-out', label: 'Someone is locked out', placeholder: 'mike@ cannot sign in' },
  { kind: 'other', label: 'Something else', placeholder: 'Forward info@ to my phone, change a name, anything' },
];

/** How long a DNS check is trusted before the Email tab runs a fresh one. */
export const DNS_STALE_MS = 6 * 60 * 60 * 1000;
export const MAX_MAILBOXES = 50;
export const MAX_OPEN_REQUESTS = 5;
const MAX_DETAIL = 500;

const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const LOCAL_RE = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/;

/** "https://www.A1Detail.com/about" -> "a1detail.com". Null when it is not a domain. */
export function normalizeDomain(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .replace(/\.$/, '');
  return DOMAIN_RE.test(host) ? host : null;
}

/** "mike" or "Mike@a1detail.com" -> "mike@a1detail.com". Throws a message safe to show. */
export function normalizeAddress(raw: unknown, domain: string | null): string {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!value) throw new Error('Enter an address');
  const at = value.indexOf('@');
  const local = at === -1 ? value : value.slice(0, at);
  const host = at === -1 ? domain : normalizeDomain(value.slice(at + 1));
  if (!host) throw new Error(domain ? `"${value}" is not a valid address` : 'Set the domain first, or type the full address');
  if (!LOCAL_RE.test(local) || local.includes('..')) throw new Error(`"${value}" is not a valid address`);
  if (domain && host !== domain) throw new Error(`${local}@${host} is not on ${domain}`);
  return `${local}@${host}`;
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

/** The admin's edit of the domain and mailbox list. Duplicate addresses are refused. */
export function validateSetupInput(raw: Record<string, unknown>): Pick<BusinessEmailSetup, 'domain' | 'mailboxes'> {
  const domainRaw = typeof raw.domain === 'string' ? raw.domain.trim() : '';
  const domain = domainRaw ? normalizeDomain(domainRaw) : null;
  if (domainRaw && !domain) throw new Error(`"${domainRaw}" is not a domain. Use something like a1detail.com`);
  const list = Array.isArray(raw.mailboxes) ? raw.mailboxes : [];
  if (list.length > MAX_MAILBOXES) throw new Error(`At most ${MAX_MAILBOXES} mailboxes`);
  const seen = new Set<string>();
  const mailboxes: Mailbox[] = [];
  for (const entry of list) {
    const m = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    if (typeof m.address === 'string' && !m.address.trim()) continue; // an empty row the admin never filled in
    const address = normalizeAddress(m.address, domain);
    if (seen.has(address)) throw new Error(`${address} is listed twice`);
    seen.add(address);
    mailboxes.push({ address, person: clean(m.person, 80), status: m.status === 'active' ? 'active' : 'pending' });
  }
  return { domain, mailboxes };
}

/** A client's request from the Email tab. */
export function validateRequestInput(raw: Record<string, unknown>): { kind: EmailRequestKind; detail: string } {
  const kind = REQUEST_KINDS.find((k) => k.kind === raw.kind)?.kind;
  if (!kind) throw new Error('Pick what you need');
  const detail = clean(raw.detail, MAX_DETAIL);
  if (detail.length < 2) throw new Error('Add a few words so we know what to do');
  if (/\b(password|passcode|pin)\b\s*[:=]?\s*\S{4,}/i.test(detail)) {
    throw new Error('Please do not type a password here. We reset it in Google and Google emails new sign-in instructions.');
  }
  return { kind, detail };
}

/** Old or partial JSON from the database becomes a complete setup. */
export function normalizeSetup(raw: unknown): BusinessEmailSetup {
  const base = emptySetup();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<BusinessEmailSetup>;
  return {
    domain: typeof r.domain === 'string' ? r.domain : null,
    mailboxes: Array.isArray(r.mailboxes) ? r.mailboxes.filter((m) => m && typeof m.address === 'string') : [],
    liveSentAt: typeof r.liveSentAt === 'string' ? r.liveSentAt : null,
    dns: r.dns && typeof r.dns === 'object' && r.dns.checks ? r.dns : null,
    requests: Array.isArray(r.requests) ? r.requests.filter((q) => q && typeof q.id === 'string') : [],
  };
}

export const activeMailboxes = (s: BusinessEmailSetup) => s.mailboxes.filter((m) => m.status === 'active');
export const openRequests = (s: BusinessEmailSetup) => s.requests.filter((q) => !q.resolvedAt);

/** Opens Gmail signed in to the client's Workspace domain. */
export const gmailUrl = (domain: string | null) => (domain ? `https://mail.google.com/a/${domain}` : 'https://mail.google.com');

/** True when the report is missing, for another domain, or older than DNS_STALE_MS. */
export function dnsIsStale(s: BusinessEmailSetup, now: number = Date.now()): boolean {
  if (!s.domain) return false;
  if (!s.dns || s.dns.domain !== s.domain) return true;
  return now - new Date(s.dns.checkedAt).getTime() > DNS_STALE_MS;
}

/** One word for the whole report: every check passing is "protected". */
export function dnsSummary(report: DnsReport | null): 'protected' | 'finishing' | 'attention' | 'unknown' {
  if (!report) return 'unknown';
  const statuses = DNS_CHECKS.map((c) => report.checks[c.key]?.status);
  if (statuses.every((s) => s === 'pass')) return 'protected';
  if (statuses.includes('fail')) return 'attention';
  return 'finishing';
}

/** The app download links in the live email and the Email tab. */
export const SETUP_GUIDES: ReadonlyArray<{ label: string; href: string; note: string }> = [
  { label: 'iPhone and iPad', href: 'https://apps.apple.com/us/app/gmail-email-by-google/id422689480', note: 'Get the Gmail app, tap Add account, choose Google.' },
  { label: 'Android', href: 'https://play.google.com/store/apps/details?id=com.google.android.gm', note: 'Open Gmail, tap your photo, then Add another account.' },
];
export const OUTLOOK_NOTE = 'Outlook on a computer: File, then Add Account, type your new address and sign in with Google.';
