// app/api/admin/onboarding/[token]/v2/route.ts
// Admin-only: everything set on an AxeonPROOF v2 client (lib/proofV2Actions.ts),
// including the v1/v2 switch. POST { action, ... }; answers with the fresh view.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { runAdminAction } from '@/lib/proofV2Actions';
import { loadV2View } from '@/lib/proofV2';
import { signSummaryToken, summaryUrl } from '@/lib/proofSummaryLink';
import { previousMonth, monthOf } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { token } = await ctx.params;
    const onboarding = await getOnboardingByToken(token);
    if (!onboarding) throw new Error('Onboarding not found');
    const body = await readBody(req);
    if (body.action === 'summaryLink') {
      // For checking what the client will see: a real, signed link for last month. Nothing is sent or logged as a client open.
      const link = summaryUrl(signSummaryToken({ onboardingId: onboarding.id, month: previousMonth(monthOf()), recipient: 'owner' }));
      return NextResponse.json({ ok: true, link });
    }
    const message = await runAdminAction(onboarding, body);
    const fresh = await getOnboardingByToken(token);
    const view = fresh && fresh.proofVersion === 2 ? await loadV2View(fresh) : null;
    return NextResponse.json({ ok: true, message, proofVersion: fresh?.proofVersion ?? 1, industry: fresh?.industry ?? null, view });
  } catch (err) {
    return jsonError(err);
  }
}
