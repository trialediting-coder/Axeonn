// app/api/admin/calls/route.ts
// Admin-only: list the call deck, or import prospects from the spreadsheet CSV.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { csvToImportRows, importCallLeads, listCallLeads } from '@/lib/callLeads';
import { isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const MAX_CSV_BYTES = 2_000_000;

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'The call deck needs the database (POSTGRES_URL).' }, { status: 503 });
  try {
    return NextResponse.json({ leads: await listCallLeads() });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'The call deck needs the database (POSTGRES_URL).' }, { status: 503 });
  try {
    const body = await readBody(req);
    const csv = typeof body.csv === 'string' ? body.csv : '';
    if (!csv.trim()) throw new Error('Paste or upload the CSV first.');
    if (csv.length > MAX_CSV_BYTES) throw new Error('That CSV is too large (2 MB max).');
    const rows = csvToImportRows(csv);
    if (rows.length === 0) throw new Error('No rows found. The first line must be the header row.');
    const result = await importCallLeads(rows);
    return NextResponse.json({ ...result, total: rows.length });
  } catch (err) {
    return jsonError(err);
  }
}
