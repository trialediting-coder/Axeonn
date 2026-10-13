// app/api/admin/audits/route.ts
// Admin-only prospect audits (lib/audits.ts).
//   GET  ?q=&limit=                                   audits not attached to a client, newest first
//   POST { business, city, state?, keyword, website?, grid?, callLeadId? }   run one now and save it
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { isDatabaseConfigured } from '@/lib/db';
import { listProspectAudits, runAudit } from '@/lib/audits';
import { validateSubjectInput } from '@/lib/auditShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const noDb = () => NextResponse.json({ error: 'Audits need the database (POSTGRES_URL).' }, { status: 503 });

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return noDb();
  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));
    return NextResponse.json({ audits: await listProspectAudits(url.searchParams.get('q') ?? '', limit) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return noDb();
  try {
    const body = await readBody(req);
    const subject = validateSubjectInput(body);
    const callLeadId = Number.isInteger(Number(body.callLeadId)) && Number(body.callLeadId) > 0 ? Number(body.callLeadId) : null;
    const audit = await runAudit(subject, { trigger: 'admin', callLeadId, grid: body.grid === true || body.grid === 'true' });
    return NextResponse.json({ audit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    const status = /budget/.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
