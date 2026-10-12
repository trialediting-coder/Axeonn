// lib/emailDns.ts
// Looks up a client's mail DNS and grades it for Google Workspace: MX points at
// Google, one SPF record that includes Google, the DKIM key Google generates
// (selector "google"), and a DMARC policy. The lookups are here; the grading is
// pure (gradeDns) so the tests run without a network. Server-only.
import { resolveMx, resolveTxt } from 'node:dns/promises';
import type { DnsCheckResult, DnsReport } from '@/lib/businessEmailShared';

export interface RawDns {
  mx: string[];
  /** TXT records on the domain itself, each joined into one string. */
  rootTxt: string[];
  dkimTxt: string[];
  dmarcTxt: string[];
}

const LOOKUP_TIMEOUT_MS = 4000;
/**
 * Codes that mean "nothing published there", not "the lookup broke". On the
 * domain itself ENOTFOUND is not counted: a domain that does not resolve at all
 * (a typo, an expired registration, or no DNS reachable) must not read as
 * "every record missing".
 */
const NO_RECORD = new Set(['ENODATA']);
const NO_NAME = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN']);

async function lookup<T>(fn: () => Promise<T>, empty: T, emptyCodes: Set<string>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DNS lookup timed out')), LOOKUP_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code && emptyCodes.has(code)) return empty;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDns(domain: string): Promise<RawDns> {
  const txt = (name: string, codes: Set<string>) => lookup(async () => (await resolveTxt(name)).map((parts) => parts.join('')), [] as string[], codes);
  try {
    const [mx, rootTxt, dkimTxt, dmarcTxt] = await Promise.all([
      lookup(async () => (await resolveMx(domain)).sort((a, b) => a.priority - b.priority).map((r) => r.exchange.toLowerCase()), [] as string[], NO_RECORD),
      txt(domain, NO_RECORD),
      txt(`google._domainkey.${domain}`, NO_NAME),
      txt(`_dmarc.${domain}`, NO_NAME),
    ]);
    return { mx, rootTxt, dkimTxt, dmarcTxt };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ENOTFOUND' || code === 'NXDOMAIN') throw new Error(`${domain} does not resolve. Check the spelling, and that the domain is registered and paid up.`);
    throw new Error(`Could not look up ${domain} right now (${code ?? (err instanceof Error ? err.message : 'DNS error')}). Try again in a minute.`);
  }
}

const isGoogleMx = (host: string) => /(^|\.)(google\.com|googlemail\.com)\.?$/.test(host);

export function gradeDns(domain: string, raw: RawDns, now: Date = new Date()): DnsReport {
  const mx: DnsCheckResult = (() => {
    if (raw.mx.length === 0) return { status: 'fail', note: 'No MX record, so email to this domain bounces.' };
    const google = raw.mx.filter(isGoogleMx);
    if (google.length === raw.mx.length) return { status: 'pass', note: `Delivers to Google (${raw.mx[0]}).` };
    if (google.length > 0) return { status: 'warn', note: `Mixed: some MX records point away from Google (${raw.mx.filter((h) => !isGoogleMx(h)).join(', ')}).` };
    return { status: 'fail', note: `MX points to ${raw.mx[0]}, not Google.` };
  })();

  const spfRecords = raw.rootTxt.filter((t) => /^v=spf1(\s|$)/i.test(t.trim()));
  const spf: DnsCheckResult = (() => {
    if (spfRecords.length === 0) return { status: 'fail', note: 'No SPF record. Add: v=spf1 include:_spf.google.com ~all' };
    if (spfRecords.length > 1) return { status: 'fail', note: 'More than one SPF record. Merge them into one, or receivers ignore both.' };
    if (!/include:_spf\.google\.com/i.test(spfRecords[0])) return { status: 'warn', note: `SPF does not include Google: ${spfRecords[0]}` };
    return { status: 'pass', note: 'SPF includes Google.' };
  })();

  const dkim: DnsCheckResult = raw.dkimTxt.some((t) => /(^|;)\s*p=[A-Za-z0-9+/=]{20,}/.test(t))
    ? { status: 'pass', note: 'Google DKIM key published (selector "google").' }
    : { status: 'fail', note: 'No DKIM key at google._domainkey. Generate it in Google Admin (Gmail, Authenticate email), publish it, then press Start authentication.' };

  const dmarcRecord = raw.dmarcTxt.find((t) => /^v=DMARC1/i.test(t.trim()));
  const dmarc: DnsCheckResult = (() => {
    if (!dmarcRecord) return { status: 'fail', note: 'No DMARC record. Add a TXT record at _dmarc: v=DMARC1; p=none' };
    const policy = /(^|;)\s*p=(\w+)/i.exec(dmarcRecord)?.[2]?.toLowerCase();
    if (policy === 'quarantine' || policy === 'reject') return { status: 'pass', note: `DMARC enforced (p=${policy}).` };
    return { status: 'warn', note: 'DMARC is monitoring only (p=none). Move to p=quarantine after 2 to 4 clean weeks.' };
  })();

  return { checkedAt: now.toISOString(), domain, checks: { mx, spf, dkim, dmarc } };
}

export async function checkDomainEmail(domain: string): Promise<DnsReport> {
  return gradeDns(domain, await fetchDns(domain));
}
