// lib/callLeads.ts
// The call deck behind /admin/calls: one row per business we might call, with
// everything we know about them, the owner's notes, and what happened on the
// last call. Rows come in from the Iowa detailer spreadsheet (CSV import) and
// are updated one card at a time while calling.
import { ensureSchema, sql } from '@/lib/db';

export const OUTCOMES = ['none', 'no_answer', 'voicemail', 'interested', 'callback', 'not_now', 'not_fit', 'booked', 'client'] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const isOutcome = (v: unknown): v is Outcome => typeof v === 'string' && (OUTCOMES as readonly string[]).includes(v);

export const PRIORITIES = ['CLIENT', 'A', 'B', 'C', 'D'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface CallLead {
  id: number;
  business: string;
  city: string;
  region: string;
  niche: string;
  contact: string;
  phone: string;
  website: string;
  siteStatus: string;
  rating: number | null;
  reviews: number | null;
  priority: Priority;
  axeonStatus: string;
  source: string;
  mapsUrl: string;
  why: string;
  notes: string;
  outcome: Outcome;
  callCount: number;
  lastCalledAt: string | null;
  updatedAt: string;
}

interface Row {
  id: number;
  business: string;
  city: string;
  region: string;
  niche: string;
  contact: string;
  phone: string;
  website: string;
  site_status: string;
  rating: string | number | null;
  reviews: number | null;
  priority: string;
  axeon_status: string;
  source: string;
  maps_url: string;
  why: string;
  notes: string;
  outcome: string;
  call_count: number;
  last_called_at: string | null;
  updated_at: string;
}

const toLead = (r: Row): CallLead => ({
  id: r.id,
  business: r.business,
  city: r.city,
  region: r.region,
  niche: r.niche ?? '',
  contact: r.contact ?? '',
  phone: r.phone,
  website: r.website,
  siteStatus: r.site_status,
  rating: r.rating === null || r.rating === undefined ? null : Number(r.rating),
  reviews: r.reviews,
  priority: (PRIORITIES as readonly string[]).includes(r.priority) ? (r.priority as Priority) : 'D',
  axeonStatus: r.axeon_status,
  source: r.source,
  mapsUrl: r.maps_url,
  why: r.why,
  notes: r.notes,
  outcome: isOutcome(r.outcome) ? r.outcome : 'none',
  callCount: r.call_count,
  lastCalledAt: r.last_called_at ? new Date(r.last_called_at).toISOString() : null,
  updatedAt: new Date(r.updated_at).toISOString(),
});

const PRIORITY_ORDER: Record<Priority, number> = { CLIENT: 4, A: 0, B: 1, C: 2, D: 3 };

/** Every lead, best prospects first: A, B, C, D, then clients; more reviews first inside a tier. */
export async function listCallLeads(): Promise<CallLead[]> {
  await ensureSchema();
  const res = await sql<Row>`SELECT * FROM call_leads ORDER BY business ASC;`;
  return res.rows.map(toLead).sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return (b.reviews ?? 0) - (a.reviews ?? 0) || a.business.localeCompare(b.business);
  });
}

export async function getCallLead(id: number): Promise<CallLead | null> {
  await ensureSchema();
  const res = await sql<Row>`SELECT * FROM call_leads WHERE id = ${id} LIMIT 1;`;
  return res.rows[0] ? toLead(res.rows[0]) : null;
}

export interface CallLeadPatch {
  notes?: string;
  outcome?: Outcome;
  /** True when a call was just made: bumps call_count and stamps last_called_at. */
  calledNow?: boolean;
}

const MAX_NOTES = 4000;

export async function updateCallLead(id: number, patch: CallLeadPatch): Promise<CallLead | null> {
  await ensureSchema();
  const notes = patch.notes === undefined ? null : patch.notes.slice(0, MAX_NOTES);
  const outcome = patch.outcome ?? null;
  const called = patch.calledNow === true;
  const res = await sql<Row>`
    UPDATE call_leads SET
      notes = COALESCE(${notes}, notes),
      outcome = COALESCE(${outcome}, outcome),
      call_count = call_count + ${called ? 1 : 0},
      last_called_at = CASE WHEN ${called} THEN now() ELSE last_called_at END,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;
  return res.rows[0] ? toLead(res.rows[0]) : null;
}

// ───────────────────────────── CSV import ─────────────────────────────

export interface ImportRow {
  business: string;
  city: string;
  region: string;
  niche: string;
  contact: string;
  phone: string;
  website: string;
  siteStatus: string;
  rating: number | null;
  reviews: number | null;
  priority: Priority;
  axeonStatus: string;
  source: string;
  mapsUrl: string;
  why: string;
  notes: string;
}

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CR/LF line ends. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  priority: ['priority'],
  business: ['business', 'name', 'company'],
  city: ['city'],
  region: ['region'],
  niche: ['niche', 'industry', 'vertical'],
  contact: ['contact', 'key contact', 'owner'],
  phone: ['phone'],
  website: ['website', 'url', 'domain'],
  siteStatus: ['site status', 'site_status', 'website status'],
  rating: ['google rating', 'rating'],
  reviews: ['reviews', 'review count', 'google reviews'],
  axeonStatus: ['axeon status', 'status'],
  source: ['source'],
  mapsUrl: ['maps url', 'maps', 'google maps url'],
  why: ['why this priority', 'why'],
  notes: ['notes', 'note'],
};

const num = (v: string | undefined): number | null => {
  if (v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
};

/** Turns the spreadsheet CSV into import rows. Header names are matched loosely; unknown columns are ignored. */
export function csvToImportRows(text: string): ImportRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (key: keyof ImportRow): number => {
    for (const alias of HEADER_ALIASES[key]) {
      const i = header.indexOf(alias);
      if (i !== -1) return i;
    }
    return -1;
  };
  const idx = Object.fromEntries((Object.keys(HEADER_ALIASES) as (keyof ImportRow)[]).map((k) => [k, col(k)])) as Record<keyof ImportRow, number>;
  if (idx.business === -1) throw new Error('The CSV needs a "Business" column.');
  const get = (r: string[], k: keyof ImportRow) => (idx[k] === -1 ? '' : (r[idx[k]] ?? '').trim());
  const out: ImportRow[] = [];
  for (const r of table.slice(1)) {
    const business = get(r, 'business');
    if (!business) continue;
    const pr = get(r, 'priority').toUpperCase();
    const reviews = num(get(r, 'reviews'));
    out.push({
      business: business.slice(0, 200),
      city: get(r, 'city').slice(0, 100),
      region: get(r, 'region').slice(0, 100),
      niche: get(r, 'niche').slice(0, 60),
      contact: get(r, 'contact').slice(0, 120),
      phone: get(r, 'phone').slice(0, 40),
      website: get(r, 'website').slice(0, 500),
      siteStatus: get(r, 'siteStatus').slice(0, 60),
      rating: num(get(r, 'rating')),
      reviews: reviews === null ? null : Math.round(reviews),
      priority: (PRIORITIES as readonly string[]).includes(pr) ? (pr as Priority) : 'D',
      axeonStatus: get(r, 'axeonStatus').slice(0, 120),
      source: get(r, 'source').slice(0, 120),
      mapsUrl: get(r, 'mapsUrl').slice(0, 500),
      why: get(r, 'why').slice(0, 500),
      notes: get(r, 'notes').slice(0, MAX_NOTES),
    });
  }
  return out;
}

/**
 * Upserts by (business, phone). Re-importing the spreadsheet refreshes the facts
 * (reviews, site status, priority) but never overwrites notes, outcome, or call history.
 */
export async function importCallLeads(rows: ImportRow[]): Promise<{ inserted: number; updated: number }> {
  await ensureSchema();
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    const res = await sql<{ inserted: boolean }>`
      INSERT INTO call_leads (business, city, region, niche, contact, phone, website, site_status, rating, reviews, priority, axeon_status, source, maps_url, why, notes)
      VALUES (${r.business}, ${r.city}, ${r.region}, ${r.niche}, ${r.contact}, ${r.phone}, ${r.website}, ${r.siteStatus}, ${r.rating}, ${r.reviews}, ${r.priority}, ${r.axeonStatus}, ${r.source}, ${r.mapsUrl}, ${r.why}, ${r.notes})
      ON CONFLICT (lower(business), phone) DO UPDATE SET
        city = EXCLUDED.city,
        region = EXCLUDED.region,
        niche = CASE WHEN EXCLUDED.niche = '' THEN call_leads.niche ELSE EXCLUDED.niche END,
        contact = CASE WHEN EXCLUDED.contact = '' THEN call_leads.contact ELSE EXCLUDED.contact END,
        website = CASE WHEN EXCLUDED.website = '' THEN call_leads.website ELSE EXCLUDED.website END,
        site_status = EXCLUDED.site_status,
        rating = COALESCE(EXCLUDED.rating, call_leads.rating),
        reviews = COALESCE(EXCLUDED.reviews, call_leads.reviews),
        priority = EXCLUDED.priority,
        axeon_status = EXCLUDED.axeon_status,
        source = EXCLUDED.source,
        maps_url = CASE WHEN EXCLUDED.maps_url = '' THEN call_leads.maps_url ELSE EXCLUDED.maps_url END,
        why = EXCLUDED.why,
        notes = CASE WHEN call_leads.notes = '' THEN EXCLUDED.notes ELSE call_leads.notes END,
        updated_at = now()
      RETURNING (xmax = 0) AS inserted;
    `;
    if (res.rows[0]?.inserted) inserted += 1;
    else updated += 1;
  }
  return { inserted, updated };
}
