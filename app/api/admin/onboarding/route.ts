// app/api/admin/onboarding/route.ts
// Admin-only: list onboardings and mint one by hand (legacy clients, AxeonGROWTH,
// or anyone who paid outside Stripe Checkout). Minting also sends the welcome email.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { listOnboardings, validateOnboardingInput, welcomeUrl } from '@/lib/onboarding';
import { ensureOnboardingForPurchase } from '@/lib/onboardingFulfillment';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rows = await listOnboardings(100);
    return NextResponse.json({ onboardings: rows.map((o) => ({ ...o, url: welcomeUrl(o.token) })) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const input = validateOnboardingInput(await readBody(req));
    const result = await ensureOnboardingForPurchase(input);
    if (!result) throw new Error('The onboarding portal needs the database (POSTGRES_URL).');
    return NextResponse.json(
      {
        url: welcomeUrl(result.onboarding.token),
        onboarding: result.onboarding,
        created: result.created,
        welcomeSent: result.welcomeSent,
      },
      { status: result.created ? 201 : 200 }
    );
  } catch (err) {
    return jsonError(err);
  }
}
