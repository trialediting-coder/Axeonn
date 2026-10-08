// app/api/admin/sample-report/route.ts
// POST { to } emails the made-up sample monthly report (lib/sampleReport.ts) to
// an address of the admin's choosing, through Resend like every real report.
// Nothing is saved and no client is involved.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { renderMonthlyReportEmail, sendMonthlyReportEmail } from '@/lib/email';
import { sampleMonthlyReportInput } from '@/lib/sampleReport';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await readBody(req);
    const to = typeof body.to === 'string' ? body.to.trim().toLowerCase() : '';
    if (!EMAIL.test(to)) throw new Error('Enter the email address to send the sample to');
    const input = sampleMonthlyReportInput(to);
    await sendMonthlyReportEmail(input);
    return NextResponse.json({ ok: true, to, subject: renderMonthlyReportEmail(input).subject });
  } catch (err) {
    return jsonError(err);
  }
}
