// app/api/admin/sample-report/route.ts
// POST { to, kind? } emails a made-up sample to an address of the admin's
// choosing, through Resend like the real thing: the monthly report (default),
// the day-30 survey, or the day-90 note (lib/sampleReport.ts). Nothing is saved
// and no client is involved.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { renderClientNoteEmail, renderMonthlyReportEmail, sendClientNoteEmail, sendMonthlyReportEmail } from '@/lib/email';
import { sampleMonthlyReportInput, sampleNoteInput } from '@/lib/sampleReport';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await readBody(req);
    const to = typeof body.to === 'string' ? body.to.trim().toLowerCase() : '';
    if (!EMAIL.test(to)) throw new Error('Enter the email address to send the sample to');
    const kind = body.kind === 'note30' || body.kind === 'note90' ? body.kind : 'report';
    if (kind === 'report') {
      const input = sampleMonthlyReportInput(to);
      await sendMonthlyReportEmail(input);
      return NextResponse.json({ ok: true, to, subject: renderMonthlyReportEmail(input).subject });
    }
    const input = sampleNoteInput(to, kind);
    if (!(await sendClientNoteEmail(input))) throw new Error('Email is not configured (RESEND_API_KEY)');
    return NextResponse.json({ ok: true, to, subject: renderClientNoteEmail(input).subject });
  } catch (err) {
    return jsonError(err);
  }
}
