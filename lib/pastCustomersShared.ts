// lib/pastCustomersShared.ts
// The past-customer list behind the quarterly check-in text: CSV in, clean rows
// out. Client-safe so the admin card can preview a file before uploading it;
// lib/pastCustomers.ts stores the same parse on the server.
import { normalizePhone } from '@/lib/phoneShared';
import { normalizeEmail } from '@/lib/sequenceShared';

export const PAST_CUSTOMERS_MAX_ROWS = 2000;

export interface PastCustomerInput {
  name: string;
  /** E.164. */
  phone: string;
  email: string | null;
  /** YYYY-MM-DD. */
  lastJobAt: string | null;
}

export interface ParsedCustomers {
  rows: PastCustomerInput[];
  skipped: { line: number; reason: string }[];
}

/** RFC 4180: quoted fields may hold commas, newlines and doubled quotes. Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function columnsFor(header: string[]): { name?: number; phone?: number; email?: number; lastJob?: number } {
  const cols: { name?: number; phone?: number; email?: number; lastJob?: number } = {};
  header.forEach((h, i) => {
    const k = h.trim().toLowerCase();
    if (/phone|mobile|cell/.test(k)) {
      if (cols.phone === undefined) cols.phone = i;
    } else if (/e-?mail/.test(k)) {
      if (cols.email === undefined) cols.email = i;
    } else if (/name|customer|client/.test(k)) {
      if (cols.name === undefined) cols.name = i;
    } else if (/last|date|job|visit/.test(k)) {
      if (cols.lastJob === undefined) cols.lastJob = i;
    }
  });
  return cols;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseJobDate(raw: string): string | null {
  const s = raw.trim();
  let y: number;
  let m: number;
  let d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (us) {
    m = Number(us[1]);
    d = Number(us[2]);
    y = Number(us[3]);
    if (y < 100) y += 2000;
  } else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parsePastCustomers(text: string): ParsedCustomers {
  const all = parseCsv(text);
  if (!all.length) return { rows: [], skipped: [] };
  const head = columnsFor(all[0]);
  const hasHeader = head.phone !== undefined && !normalizePhone(all[0][head.phone] ?? '');
  const cols = hasHeader ? head : { name: 0, phone: 1, email: 2, lastJob: 3 };
  const body = hasHeader ? all.slice(1) : all;
  const rows: PastCustomerInput[] = [];
  const skipped: { line: number; reason: string }[] = [];
  const seen = new Set<string>();
  body.forEach((r, i) => {
    const line = i + (hasHeader ? 2 : 1);
    const cell = (c: number | undefined) => (c === undefined ? '' : (r[c] ?? '').trim());
    const phone = normalizePhone(cell(cols.phone));
    if (!phone) return void skipped.push({ line, reason: 'no US cell number' });
    if (seen.has(phone)) return void skipped.push({ line, reason: 'same number as an earlier row' });
    if (rows.length >= PAST_CUSTOMERS_MAX_ROWS) return void skipped.push({ line, reason: `over ${PAST_CUSTOMERS_MAX_ROWS} rows` });
    seen.add(phone);
    rows.push({ name: cell(cols.name).slice(0, 80), phone, email: normalizeEmail(cell(cols.email)), lastJobAt: parseJobDate(cell(cols.lastJob)) });
  });
  return { rows, skipped };
}
