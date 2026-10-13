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
  /** `line` is the physical 1-based line of the file where the row starts (blank lines count). */
  skipped: { line: number; reason: string }[];
}

interface RawRow {
  cells: string[];
  /** Physical line where the row starts. */
  line: number;
  /** A quote opened on this row never closed before the next line break. */
  unclosed: boolean;
  /** A line with nothing on it (or only spaces): dropped, not reported. */
  blankLine: boolean;
}

const LINE_BREAK = /\r\n|\n|\r/g;

/**
 * RFC 4180 scan. Quoted fields may hold commas, line breaks and doubled quotes.
 * A quote still open at the end of its row ends the row at its first line break
 * (flagged `unclosed`), and the text after that break is scanned as normal rows.
 */
function scanCsv(text: string): RawRow[] {
  const s = text.replace(/^﻿/, '');
  const out: RawRow[] = [];
  let i = 0;
  let line = 1;
  while (i < s.length) {
    const rowLine = line;
    const rowStart = i;
    const cells: string[] = [];
    let field = '';
    let quoted = false;
    let sawQuote = false;
    while (i < s.length) {
      const ch = s[i];
      if (quoted) {
        if (ch === '"') {
          if (s[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            quoted = false;
            i++;
          }
          continue;
        }
        if (ch === '\n') line++;
        field += ch;
        i++;
        continue;
      }
      if (ch === '"' && field === '') {
        quoted = true;
        sawQuote = true;
        i++;
      } else if (ch === ',') {
        cells.push(field);
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        i += ch === '\r' && s[i + 1] === '\n' ? 2 : 1;
        line++;
        break;
      } else {
        field += ch;
        i++;
      }
    }
    if (quoted) {
      LINE_BREAK.lastIndex = rowStart;
      const nl = LINE_BREAK.exec(s);
      i = nl ? nl.index + nl[0].length : s.length;
      out.push({ cells: [], line: rowLine, unclosed: true, blankLine: false });
      line = rowLine + 1;
      continue;
    }
    cells.push(field);
    out.push({ cells, line: rowLine, unclosed: false, blankLine: cells.length === 1 && cells[0].trim() === '' && !sawQuote });
  }
  return out;
}

/** RFC 4180: quoted fields may hold commas, newlines and doubled quotes. Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  return scanCsv(text)
    .filter((r) => !r.unclosed && r.cells.some((c) => c.trim() !== ''))
    .map((r) => r.cells);
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
  const all = scanCsv(text).filter((r) => !r.blankLine);
  if (!all.length) return { rows: [], skipped: [] };
  const first = all[0];
  // A header is a first row with no number in it at all. A row that holds a number is data.
  const hasHeader = !first.unclosed && !first.cells.every((c) => c.trim() === '') && !first.cells.some((c) => normalizePhone(c));
  let cols: { name?: number; phone?: number; email?: number; lastJob?: number };
  if (hasHeader) {
    cols = columnsFor(first.cells);
    if (cols.phone === undefined) return { rows: [], skipped: [{ line: first.line, reason: 'no phone column' }] };
  } else {
    cols = { name: 0, phone: 1, email: 2, lastJob: 3 };
  }
  const body = hasHeader ? all.slice(1) : all;
  const rows: PastCustomerInput[] = [];
  const skipped: { line: number; reason: string }[] = [];
  const seen = new Set<string>();
  for (const r of body) {
    const line = r.line;
    if (r.unclosed) {
      skipped.push({ line, reason: 'unclosed quote' });
      continue;
    }
    if (r.cells.every((c) => c.trim() === '')) {
      skipped.push({ line, reason: 'blank row' });
      continue;
    }
    const cell = (c: number | undefined) => (c === undefined ? '' : (r.cells[c] ?? '').trim());
    const phone = normalizePhone(cell(cols.phone));
    if (!phone) {
      skipped.push({ line, reason: 'no US cell number' });
      continue;
    }
    if (seen.has(phone)) {
      skipped.push({ line, reason: 'same number as an earlier row' });
      continue;
    }
    if (rows.length >= PAST_CUSTOMERS_MAX_ROWS) {
      skipped.push({ line, reason: `over ${PAST_CUSTOMERS_MAX_ROWS} rows` });
      continue;
    }
    seen.add(phone);
    rows.push({ name: cell(cols.name).slice(0, 80), phone, email: normalizeEmail(cell(cols.email)), lastJobAt: parseJobDate(cell(cols.lastJob)) });
  }
  return { rows, skipped };
}
