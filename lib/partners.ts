// lib/partners.ts
// Storage for /admin/partners. Rules and types live in lib/partnersShared.ts.
import { ensureSchema, sql } from '@/lib/db';
import {
  PARTNER_DEALS,
  PARTNER_KINDS,
  PARTNER_STATUSES,
  REFERRAL_STATUSES,
  type Partner,
  type PartnerInput,
  type PartnerReferral,
  type ReferralInput,
} from '@/lib/partnersShared';

interface PartnerRow {
  id: number;
  name: string;
  firm: string;
  kind: string;
  email: string;
  phone: string;
  status: string;
  deal: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ReferralRow {
  id: number;
  partner_id: number;
  practice: string;
  status: string;
  monthly_cents: number;
  notes: string;
  created_at: string;
}

const oneOf = <T extends string>(list: readonly T[], v: string, fallback: T): T => ((list as readonly string[]).includes(v) ? (v as T) : fallback);

const toReferral = (r: ReferralRow): PartnerReferral => ({
  id: r.id,
  partnerId: r.partner_id,
  practice: r.practice,
  status: oneOf(REFERRAL_STATUSES, r.status, 'referred'),
  monthlyCents: r.monthly_cents,
  notes: r.notes,
  createdAt: new Date(r.created_at).toISOString(),
});

const toPartner = (r: PartnerRow, referrals: PartnerReferral[]): Partner => ({
  id: r.id,
  name: r.name,
  firm: r.firm,
  kind: oneOf(PARTNER_KINDS, r.kind, 'other'),
  email: r.email,
  phone: r.phone,
  status: oneOf(PARTNER_STATUSES, r.status, 'prospect'),
  deal: oneOf(PARTNER_DEALS, r.deal, 'share'),
  notes: r.notes,
  referrals,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
});

export async function listPartners(): Promise<Partner[]> {
  await ensureSchema();
  const [partners, referrals] = await Promise.all([
    sql<PartnerRow>`SELECT * FROM partners ORDER BY updated_at DESC;`,
    sql<ReferralRow>`SELECT * FROM partner_referrals ORDER BY created_at DESC;`,
  ]);
  const byPartner = new Map<number, PartnerReferral[]>();
  for (const r of referrals.rows) byPartner.set(r.partner_id, [...(byPartner.get(r.partner_id) ?? []), toReferral(r)]);
  return partners.rows.map((p) => toPartner(p, byPartner.get(p.id) ?? []));
}

export async function createPartner(p: PartnerInput): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO partners (name, firm, kind, email, phone, status, deal, notes)
    VALUES (${p.name}, ${p.firm}, ${p.kind}, ${p.email}, ${p.phone}, ${p.status}, ${p.deal}, ${p.notes});
  `;
}

export async function updatePartner(id: number, p: PartnerInput): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE partners SET name = ${p.name}, firm = ${p.firm}, kind = ${p.kind}, email = ${p.email}, phone = ${p.phone},
      status = ${p.status}, deal = ${p.deal}, notes = ${p.notes}, updated_at = now()
    WHERE id = ${id};
  `;
}

export async function addReferral(partnerId: number, r: ReferralInput): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO partner_referrals (partner_id, practice, status, monthly_cents, notes)
    VALUES (${partnerId}, ${r.practice}, ${r.status}, ${r.monthlyCents}, ${r.notes});
  `;
  await sql`UPDATE partners SET updated_at = now() WHERE id = ${partnerId};`;
}

export async function updateReferral(id: number, r: ReferralInput): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE partner_referrals SET practice = ${r.practice}, status = ${r.status}, monthly_cents = ${r.monthlyCents}, notes = ${r.notes}
    WHERE id = ${id};
  `;
}
