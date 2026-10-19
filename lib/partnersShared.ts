// lib/partnersShared.ts
// Referral partners (/admin/partners): CPAs, practice consultants and billing
// firms who send us practices. Pure types and rules only, so the console and the
// tests can use them without the database (lib/partners.ts does the storage).
//
// Two deals, from the partner brief (public/partners/axeon-partner-brief.pdf):
//   'share'  - 15% of the practice's monthly plan fee, every month the practice
//              stays a client (never ad spend or one-time items), disclosed to
//              the practice in writing (the Technology Advisory Agreement).
//   'credit' - the partner takes nothing; the practice gets the value as a fee
//              credit instead.
// Not the client-to-client referral reward, which lives in lib/referral.ts.

export const PARTNER_KINDS = ['cpa', 'consultant', 'billing', 'other'] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];
export const PARTNER_KIND_LABELS: Record<PartnerKind, string> = {
  cpa: 'CPA firm',
  consultant: 'Practice consultant',
  billing: 'Billing firm',
  other: 'Other',
};

export const PARTNER_STATUSES = ['prospect', 'contacted', 'brief_sent', 'signed', 'active', 'paused'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];
export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  prospect: 'Prospect',
  contacted: 'Contacted',
  brief_sent: 'Brief sent',
  signed: 'Agreement signed',
  active: 'Referring',
  paused: 'Paused',
};

export const PARTNER_DEALS = ['share', 'credit'] as const;
export type PartnerDeal = (typeof PARTNER_DEALS)[number];
export const PARTNER_DEAL_LABELS: Record<PartnerDeal, string> = {
  share: '15% advisory share',
  credit: 'Credit to the practice',
};

export const REFERRAL_STATUSES = ['referred', 'audit_sent', 'call_booked', 'signed', 'lost', 'ended'] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];
export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  referred: 'Referred',
  audit_sent: 'Audit sent',
  call_booked: 'Call booked',
  signed: 'Client',
  lost: 'Lost',
  ended: 'Ended',
};

/** The advisory share partners on the 'share' deal earn. */
export const PARTNER_SHARE = 0.15;

/** Where the partner brief PDF is served (public, so it can be emailed as a link). */
export const PARTNER_BRIEF_PATH = '/partners/axeon-partner-brief.pdf';

export interface PartnerReferral {
  id: number;
  partnerId: number;
  practice: string;
  status: ReferralStatus;
  /** The practice's monthly plan fee once signed (the share base), in cents. */
  monthlyCents: number;
  notes: string;
  createdAt: string;
}

export interface Partner {
  id: number;
  name: string;
  firm: string;
  kind: PartnerKind;
  email: string;
  phone: string;
  status: PartnerStatus;
  deal: PartnerDeal;
  notes: string;
  referrals: PartnerReferral[];
  createdAt: string;
  updatedAt: string;
}

const pick = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** What a partner earns a month: 15% of each signed referral's plan fee, on the share deal only. */
export function monthlyShareCents(p: Pick<Partner, 'deal' | 'referrals'>): number {
  if (p.deal !== 'share') return 0;
  const base = p.referrals.filter((r) => r.status === 'signed').reduce((sum, r) => sum + r.monthlyCents, 0);
  return Math.round(base * PARTNER_SHARE);
}

export type PartnerInput = Pick<Partner, 'name' | 'firm' | 'kind' | 'email' | 'phone' | 'status' | 'deal' | 'notes'>;

export function validatePartnerInput(raw: Record<string, unknown>): PartnerInput {
  const name = text(raw.name, 120);
  const firm = text(raw.firm, 160);
  if (!name && !firm) throw new Error('Add a name or a firm');
  const email = text(raw.email, 200).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email does not look right');
  return {
    name,
    firm,
    kind: pick(PARTNER_KINDS, raw.kind, 'cpa'),
    email,
    phone: text(raw.phone, 40),
    status: pick(PARTNER_STATUSES, raw.status, 'prospect'),
    deal: pick(PARTNER_DEALS, raw.deal, 'share'),
    notes: text(raw.notes, 2000),
  };
}

export type ReferralInput = Pick<PartnerReferral, 'practice' | 'status' | 'monthlyCents' | 'notes'>;

export function validateReferralInput(raw: Record<string, unknown>): ReferralInput {
  const practice = text(raw.practice, 160);
  if (!practice) throw new Error('Add the practice name');
  const dollars = Number(raw.monthly ?? 0);
  return {
    practice,
    status: pick(REFERRAL_STATUSES, raw.status, 'referred'),
    monthlyCents: Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0,
    notes: text(raw.notes, 1000),
  };
}
