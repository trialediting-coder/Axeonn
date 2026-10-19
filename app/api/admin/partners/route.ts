// app/api/admin/partners/route.ts
// Admin-only: the referral partners list (/admin/partners). GET lists them with
// their referrals; POST runs one action: create or update a partner, add or
// update a referred practice.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { addReferral, createPartner, listPartners, updatePartner, updateReferral } from '@/lib/partners';
import { validatePartnerInput, validateReferralInput } from '@/lib/partnersShared';

export const runtime = 'nodejs';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const idOf = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error('Missing id');
  return n;
};

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    return NextResponse.json({ partners: await listPartners() });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const body = await readBody(req);
    switch (body.action) {
      case 'createPartner':
        await createPartner(validatePartnerInput(body));
        break;
      case 'updatePartner':
        await updatePartner(idOf(body.id), validatePartnerInput(body));
        break;
      case 'addReferral':
        await addReferral(idOf(body.partnerId), validateReferralInput(body));
        break;
      case 'updateReferral':
        await updateReferral(idOf(body.id), validateReferralInput(body));
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ partners: await listPartners() });
  } catch (err) {
    return jsonError(err);
  }
}
