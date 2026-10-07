// app/api/admin/agreements/route.ts
// Admin-only: list agreements, create one (and email the client the sign link),
// resend the email, or void an unsigned one.
import { NextResponse } from 'next/server';
import { TIER_LABELS } from '@/data/onboardingItems';
import { requireAdmin } from '@/lib/adminAuth';
import {
  agreementUrl,
  createAgreement,
  getAgreement,
  listAgreements,
  setAgreementStatus,
  validateAgreementInput,
  type Agreement,
} from '@/lib/agreements';
import { jsonError, readBody } from '@/lib/billingApi';
import { sendAgreementEmail } from '@/lib/email';

export const runtime = 'nodejs';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const withUrl = (a: Agreement) => ({ ...a, url: agreementUrl(a.token) });

async function emailAgreement(a: Agreement): Promise<string | null> {
  try {
    await sendAgreementEmail({
      to: a.clientEmail,
      contactName: a.contactName || a.signerName,
      businessName: a.legalName,
      planLabel: TIER_LABELS[a.tier],
      number: a.number,
      url: agreementUrl(a.token),
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Email failed';
  }
}

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    return NextResponse.json({ agreements: (await listAgreements()).map(withUrl) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const body = await readBody(req);
    const agreement = await createAgreement(validateAgreementInput(body));
    const emailError = body.sendEmail === false ? null : await emailAgreement(agreement);
    return NextResponse.json({ agreement: withUrl(agreement), emailed: body.sendEmail !== false && !emailError, emailError }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const body = await readBody(req);
    const agreement = typeof body.token === 'string' ? await getAgreement(body.token) : null;
    if (!agreement) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    if (body.action === 'void') {
      if (agreement.status !== 'sent') throw new Error('Only an unsigned agreement can be voided.');
      await setAgreementStatus(agreement.token, 'void');
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'resend') {
      if (agreement.status === 'void') throw new Error('This agreement was voided.');
      const emailError = await emailAgreement(agreement);
      if (emailError) throw new Error(emailError);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}
