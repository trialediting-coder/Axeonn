// lib/businessEmail.test.ts
// Run with: npm run test:onboarding   (no database, network or Resend needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dnsIsStale,
  dnsSummary,
  gmailUrl,
  normalizeAddress,
  normalizeDomain,
  normalizeSetup,
  openRequests,
  validateRequestInput,
  validateSetupInput,
  type BusinessEmailSetup,
} from './businessEmailShared';
import { gradeDns, type RawDns } from './emailDns';
import { getItem } from '../data/onboardingItems';
import { assertNoCredentialFields, validateItemData } from './onboarding';

const GOOD: RawDns = {
  mx: ['smtp.google.com'],
  rootTxt: ['google-site-verification=abc', 'v=spf1 include:_spf.google.com ~all'],
  dkimTxt: ['v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA'],
  dmarcTxt: ['v=DMARC1; p=quarantine; rua=mailto:x@a1detail.com'],
};

test('normalizeDomain strips scheme, www, paths and refuses junk', () => {
  assert.equal(normalizeDomain('https://www.A1Detail.com/about?x=1'), 'a1detail.com');
  assert.equal(normalizeDomain('shop.a1detail.co.uk.'), 'shop.a1detail.co.uk');
  assert.equal(normalizeDomain('a1detail'), null);
  assert.equal(normalizeDomain('not a domain.com'), null);
  assert.equal(normalizeDomain(42), null);
});

test('normalizeAddress completes a bare name and keeps everyone on the domain', () => {
  assert.equal(normalizeAddress('Mike', 'a1detail.com'), 'mike@a1detail.com');
  assert.equal(normalizeAddress(' Info@A1Detail.com ', 'a1detail.com'), 'info@a1detail.com');
  assert.throws(() => normalizeAddress('mike@gmail.com', 'a1detail.com'), /not on a1detail\.com/);
  assert.throws(() => normalizeAddress('mike', null), /Set the domain first/);
  assert.throws(() => normalizeAddress('mi..ke', 'a1detail.com'), /not a valid address/);
  assert.throws(() => normalizeAddress('', 'a1detail.com'), /Enter an address/);
});

test('validateSetupInput normalizes, skips blank rows and refuses duplicates', () => {
  const out = validateSetupInput({
    domain: 'www.a1detail.com',
    mailboxes: [
      { address: 'mike', person: '  Mike   (owner) ', status: 'active' },
      { address: '', person: 'never filled in' },
      { address: 'info@a1detail.com', status: 'weird' },
    ],
  });
  assert.equal(out.domain, 'a1detail.com');
  assert.deepEqual(out.mailboxes, [
    { address: 'mike@a1detail.com', person: 'Mike (owner)', status: 'active' },
    { address: 'info@a1detail.com', person: '', status: 'pending' },
  ]);
  assert.throws(() => validateSetupInput({ domain: 'a1detail.com', mailboxes: [{ address: 'mike' }, { address: 'MIKE@a1detail.com' }] }), /listed twice/);
  assert.throws(() => validateSetupInput({ domain: 'nope' }), /not a domain/);
});

test('validateRequestInput takes a kind and a line, and refuses a typed password', () => {
  assert.deepEqual(validateRequestInput({ kind: 'add', detail: ' sarah@ for Sarah\n' }), { kind: 'add', detail: 'sarah@ for Sarah' });
  assert.throws(() => validateRequestInput({ kind: 'hack', detail: 'x y' }), /Pick what you need/);
  assert.throws(() => validateRequestInput({ kind: 'other', detail: ' ' }), /few words/);
  assert.throws(() => validateRequestInput({ kind: 'locked-out', detail: 'mike@ password: Hunter22!' }), /do not type a password/);
  assert.doesNotThrow(() => validateRequestInput({ kind: 'locked-out', detail: 'Mike forgot his password' }));
});

test('gradeDns passes a finished Google Workspace domain', () => {
  const r = gradeDns('a1detail.com', GOOD, new Date('2026-10-11T12:00:00Z'));
  assert.equal(r.domain, 'a1detail.com');
  assert.equal(r.checkedAt, '2026-10-11T12:00:00.000Z');
  for (const c of Object.values(r.checks)) assert.equal(c.status, 'pass', c.note);
  assert.equal(dnsSummary(r), 'protected');
});

test('gradeDns explains each thing that is missing or wrong', () => {
  const empty = gradeDns('a1detail.com', { mx: [], rootTxt: [], dkimTxt: [], dmarcTxt: [] });
  assert.deepEqual(Object.values(empty.checks).map((c) => c.status), ['fail', 'fail', 'fail', 'fail']);
  assert.match(empty.checks.spf.note, /include:_spf\.google\.com/);
  assert.equal(dnsSummary(empty), 'attention');

  const old = gradeDns('a1detail.com', { ...GOOD, mx: ['mx1.secureserver.net'] });
  assert.equal(old.checks.mx.status, 'fail');
  assert.match(old.checks.mx.note, /secureserver/);
  assert.equal(gradeDns('a1detail.com', { ...GOOD, mx: ['aspmx.l.google.com', 'mx.other.net'] }).checks.mx.status, 'warn');
  assert.equal(gradeDns('a1detail.com', { ...GOOD, mx: ['ASPMX.L.GOOGLE.COM'.toLowerCase(), 'alt1.aspmx.l.google.com'] }).checks.mx.status, 'pass');
  assert.equal(gradeDns('a1detail.com', { ...GOOD, mx: ['google.com.evil.net'] }).checks.mx.status, 'fail');

  const twoSpf = gradeDns('a1detail.com', { ...GOOD, rootTxt: ['v=spf1 include:_spf.google.com ~all', 'v=spf1 include:secureserver.net ~all'] });
  assert.equal(twoSpf.checks.spf.status, 'fail');
  assert.equal(gradeDns('a1detail.com', { ...GOOD, rootTxt: ['v=spf1 include:secureserver.net ~all'] }).checks.spf.status, 'warn');

  assert.equal(gradeDns('a1detail.com', { ...GOOD, dkimTxt: ['v=DKIM1; p='] }).checks.dkim.status, 'fail');

  const monitoring = gradeDns('a1detail.com', { ...GOOD, dmarcTxt: ['v=DMARC1; p=none'] });
  assert.equal(monitoring.checks.dmarc.status, 'warn');
  assert.equal(dnsSummary(monitoring), 'finishing');
  assert.equal(gradeDns('a1detail.com', { ...GOOD, dmarcTxt: ['v=DMARC1;p=reject'] }).checks.dmarc.status, 'pass');
});

test('dnsIsStale refreshes old, missing or other-domain reports, never without a domain', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');
  const base = normalizeSetup({ domain: 'a1detail.com' });
  assert.equal(dnsIsStale(base, now), true);
  const fresh: BusinessEmailSetup = { ...base, dns: gradeDns('a1detail.com', GOOD, new Date(now - 60_000)) };
  assert.equal(dnsIsStale(fresh, now), false);
  assert.equal(dnsIsStale({ ...fresh, dns: gradeDns('a1detail.com', GOOD, new Date(now - 7 * 3_600_000)) }, now), true);
  assert.equal(dnsIsStale({ ...fresh, domain: 'other.com' }, now), true);
  assert.equal(dnsIsStale(normalizeSetup(null), now), false);
});

test('normalizeSetup survives null and partial JSON; open requests exclude resolved ones', () => {
  assert.deepEqual(normalizeSetup(null), { domain: null, mailboxes: [], liveSentAt: null, dns: null, requests: [] });
  const s = normalizeSetup({
    requests: [
      { id: 'a', kind: 'add', detail: 'x', at: '2026-10-01T00:00:00Z', resolvedAt: null },
      { id: 'b', kind: 'other', detail: 'y', at: '2026-10-02T00:00:00Z', resolvedAt: '2026-10-03T00:00:00Z' },
      { nope: true },
    ],
    dns: { broken: true },
  });
  assert.equal(s.requests.length, 2);
  assert.equal(s.dns, null);
  assert.deepEqual(openRequests(s).map((q) => q.id), ['a']);
  assert.equal(gmailUrl('a1detail.com'), 'https://mail.google.com/a/a1detail.com');
  assert.equal(gmailUrl(null), 'https://mail.google.com');
});

test('the setup card asks for addresses and where Google sends sign-ins, never a credential', () => {
  const card = getItem('domain')!;
  assert.doesNotThrow(() => assertNoCredentialFields([card]));
  const data = validateItemData(card, {
    domainStatus: 'Yes, I own one',
    domainName: 'a1detail.com',
    mailboxes: 'mike@ for Mike, info@ shared',
    signInEmails: 'Mike: mike.smith@gmail.com',
    currentEmail: 'No, this is new',
  });
  assert.equal(data.mailboxes, 'mike@ for Mike, info@ shared');
  assert.throws(() => validateItemData(card, { domainStatus: 'Not sure', currentEmail: 'Not sure', signInEmails: 'x' }), /addresses you want/);
  assert.equal(getItem('business-email')?.kind, 'axeon');
});
