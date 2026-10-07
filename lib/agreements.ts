// lib/agreements.ts
// Client Services Agreements: created in the admin, signed online by the client
// at app.axeonstudio.co/sign/<token>, then paid through Stripe (setup + monthly),
// which starts onboarding through the existing webhook.
//
// What makes a signature hold up: the exact text is fixed by AGREEMENT_VERSION
// plus the filled-in fields; on signing we store a SHA-256 of that text, the
// typed name and title, the consent checkbox, time, IP and browser. Axeon's
// countersignature is applied automatically at the same moment.
import { createHash, randomInt } from 'node:crypto';
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import {
  AGREEMENT_INTRO,
  AGREEMENT_SECTIONS,
  AGREEMENT_VERSION,
  PLAN_DEFAULT_FEES,
  SCHEDULE_A,
  SCHEDULE_A_DEFINITIONS,
} from '@/data/agreementTemplate';
import { TIER_LABELS, isOnboardingTier, type OnboardingTier } from '@/data/onboardingItems';
import { APP_ORIGIN } from '@/lib/hostRouting';

export const agreementUrl = (token: string) => `${APP_ORIGIN}/sign/${token}`;

export type AgreementStatus = 'sent' | 'signed' | 'paid' | 'void';

export interface AgreementFields {
  clientEmail: string;
  contactName: string;
  legalName: string;
  entityType: string;
  entityState: string;
  signerName: string;
  signerTitle: string;
  address: string;
  tier: OnboardingTier;
  setupCents: number;
  monthlyCents: number;
  addOns: string;
  hourlyRate: string;
  axeonEntity: string;
  effectiveDate: string; // YYYY-MM-DD
}

export interface Agreement extends AgreementFields {
  id: number;
  token: string;
  number: string;
  version: string;
  status: AgreementStatus;
  textHash: string | null;
  signedName: string | null;
  signedTitle: string | null;
  signedAt: string | null;
  signedIp: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ───────────────────────────── Pure helpers ─────────────────────────────

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const newAgreementToken = () => Array.from({ length: 20 }, () => TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)]).join('');
export const isAgreementToken = (v: unknown): v is string => typeof v === 'string' && /^[A-HJ-NP-Z2-9]{20}$/.test(v);

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function prettyDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
}

/** Every value that appears in the agreement, as shown. */
export function agreementValues(a: AgreementFields) {
  return {
    effectiveDate: prettyDate(a.effectiveDate),
    axeonEntity: a.axeonEntity,
    hourlyRate: a.hourlyRate,
    plan: TIER_LABELS[a.tier],
    fees: `${money(a.setupCents)} to start · ${money(a.monthlyCents)} / month`,
    addOns: a.addOns.trim() || 'None',
  };
}

export const fillTemplate = (text: string, v: Record<string, string>) => text.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? '');

/** The full agreement as plain text: exactly what the client reads and signs. */
export function agreementText(a: AgreementFields & { number: string }): string {
  const v = agreementValues(a);
  const s = SCHEDULE_A[a.tier];
  return [
    `Client Services Agreement · Agreement No. ${a.number} · Version ${AGREEMENT_VERSION}`,
    fillTemplate(AGREEMENT_INTRO, v),
    `Client legal name: ${a.legalName}`,
    `Entity type & state: ${a.entityType} · ${a.entityState}`,
    `Authorized signer: ${a.signerName}, ${a.signerTitle}`,
    `Business address: ${a.address}`,
    `Plan: ${v.plan}`,
    `Fees: ${v.fees}`,
    'Initial Term: 3 months, then month-to-month',
    `Add-ons: ${v.addOns}`,
    ...AGREEMENT_SECTIONS.flatMap((sec) => [sec.heading, ...sec.paragraphs.map((p) => fillTemplate(p, v))]),
    'Schedule A · Services included in the Plan',
    s.title,
    ...(s.lead ? [s.lead] : []),
    ...s.items,
    `Add-ons selected: ${v.addOns}`,
    ...SCHEDULE_A_DEFINITIONS,
  ].join('\n');
}

export const hashAgreementText = (text: string) => createHash('sha256').update(text).digest('hex');

export function validateAgreementInput(raw: Record<string, unknown>): AgreementFields {
  const s = (k: string, max = 200) => (typeof raw[k] === 'string' ? (raw[k] as string).trim().slice(0, max) : '');
  const email = s('clientEmail').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid client email');
  if (!isOnboardingTier(raw.tier)) throw new Error('Choose a plan');
  const tier = raw.tier;
  const cents = (k: string, fallback: number) => {
    const v = raw[k];
    if (v === undefined || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : fallback;
  };
  const fields: AgreementFields = {
    clientEmail: email,
    contactName: s('contactName', 120),
    legalName: s('legalName'),
    entityType: s('entityType', 40),
    entityState: s('entityState', 40),
    signerName: s('signerName', 120),
    signerTitle: s('signerTitle', 80),
    address: s('address', 300),
    tier,
    setupCents: cents('setup', PLAN_DEFAULT_FEES[tier].setupCents),
    monthlyCents: cents('monthly', PLAN_DEFAULT_FEES[tier].monthlyCents),
    addOns: s('addOns', 500),
    hourlyRate: s('hourlyRate', 40),
    axeonEntity: s('axeonEntity', 80),
    effectiveDate: /^\d{4}-\d{2}-\d{2}$/.test(s('effectiveDate')) ? s('effectiveDate') : new Date().toISOString().slice(0, 10),
  };
  for (const [key, label] of [
    ['legalName', 'Client legal name'],
    ['entityType', 'Entity type'],
    ['entityState', 'State'],
    ['signerName', 'Signer name'],
    ['signerTitle', 'Signer title'],
    ['address', 'Business address'],
    ['hourlyRate', 'Hourly rate'],
    ['axeonEntity', "Axeon's entity type"],
  ] as const) {
    if (!fields[key]) throw new Error(`${label} is required`);
  }
  if (fields.monthlyCents <= 0) throw new Error('Monthly fee must be more than $0');
  return fields;
}

// ───────────────────────────── Database ─────────────────────────────

interface Row {
  id: number;
  token: string;
  number: string;
  version: string;
  status: AgreementStatus;
  fields: AgreementFields;
  text_hash: string | null;
  signed_name: string | null;
  signed_title: string | null;
  signed_at: string | null;
  signed_ip: string | null;
  paid_at: string | null;
  created_at: string;
}

const iso = (v: string | null) => (v ? new Date(v).toISOString() : null);
const toAgreement = (r: Row): Agreement => ({
  ...r.fields,
  id: r.id,
  token: r.token,
  number: r.number,
  version: r.version,
  status: r.status,
  textHash: r.text_hash,
  signedName: r.signed_name,
  signedTitle: r.signed_title,
  signedAt: iso(r.signed_at),
  signedIp: r.signed_ip,
  paidAt: iso(r.paid_at),
  createdAt: new Date(r.created_at).toISOString(),
});

function requireDb() {
  if (!isDatabaseConfigured()) throw new Error('Agreements need the database (POSTGRES_URL).');
}

export async function createAgreement(fields: AgreementFields): Promise<Agreement> {
  requireDb();
  await ensureSchema();
  const year = fields.effectiveDate.slice(0, 4);
  const count = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM agreements WHERE number LIKE ${`AX-${year}-%`};`;
  const number = `AX-${year}-${String((count.rows[0]?.n ?? 0) + 1).padStart(3, '0')}`;
  const res = await sql<Row>`
    INSERT INTO agreements (token, number, version, status, client_email, fields)
    VALUES (${newAgreementToken()}, ${number}, ${AGREEMENT_VERSION}, 'sent', ${fields.clientEmail}, ${JSON.stringify(fields)}::jsonb)
    RETURNING *;
  `;
  return toAgreement(res.rows[0]);
}

export async function getAgreement(token: string): Promise<Agreement | null> {
  if (!isAgreementToken(token) || !isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<Row>`SELECT * FROM agreements WHERE token = ${token} LIMIT 1;`;
  return res.rows[0] ? toAgreement(res.rows[0]) : null;
}

export async function listAgreements(limit = 100): Promise<Agreement[]> {
  requireDb();
  await ensureSchema();
  const res = await sql<Row>`SELECT * FROM agreements ORDER BY created_at DESC LIMIT ${limit};`;
  return res.rows.map(toAgreement);
}

/** The latest signed agreement for an email (used for the welcome packet's fees). */
export async function latestSignedAgreementFor(email: string): Promise<Agreement | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<Row>`
    SELECT * FROM agreements WHERE client_email = ${email.toLowerCase()} AND status IN ('signed', 'paid')
    ORDER BY signed_at DESC LIMIT 1;
  `;
  return res.rows[0] ? toAgreement(res.rows[0]) : null;
}

/** Records the client's signature. Throws a message safe to show. */
export async function signAgreement(
  a: Agreement,
  input: { name: unknown; title: unknown; consent: unknown; ip: string; userAgent: string }
): Promise<Agreement> {
  if (a.status !== 'sent') throw new Error(a.status === 'void' ? 'This agreement was withdrawn.' : 'This agreement is already signed.');
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 120) : '';
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 80) : '';
  if (name.length < 3) throw new Error('Type your full name to sign.');
  if (input.consent !== true) throw new Error('Check the box to agree to sign electronically.');
  const textHash = hashAgreementText(agreementText(a));
  const res = await sql<Row>`
    UPDATE agreements SET status = 'signed', text_hash = ${textHash}, signed_name = ${name},
      signed_title = ${title || a.signerTitle}, signed_at = now(), signed_ip = ${input.ip.slice(0, 64)},
      signed_ua = ${input.userAgent.slice(0, 300)}, updated_at = now()
    WHERE id = ${a.id} AND status = 'sent'
    RETURNING *;
  `;
  if (!res.rows[0]) throw new Error('This agreement is already signed.');
  return toAgreement(res.rows[0]);
}

export async function setAgreementStatus(token: string, status: 'paid' | 'void'): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await ensureSchema();
  if (status === 'paid') {
    await sql`UPDATE agreements SET status = 'paid', paid_at = COALESCE(paid_at, now()), updated_at = now() WHERE token = ${token} AND status IN ('signed', 'paid');`;
  } else {
    await sql`UPDATE agreements SET status = 'void', updated_at = now() WHERE token = ${token} AND status = 'sent';`;
  }
}
