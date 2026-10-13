// app/api/admin/onboarding/[token]/phone/route.ts
// Admin-only: the client's tracked phone line (lib/phoneLines.ts).
//   GET                                           line, recent calls, this month's cost
//   POST { action: 'provision', areaCode, forwardTo }   buy the number
//   POST { action: 'sms', status: 'pending'|'ready' }    flip the 10DLC gate
//   POST { action: 'test-lead', phone }                  fake website lead, delivered for real (lib/leads.ts)
//   PUT  { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage, screenCalls, callConnectEnabled, timeZone }
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { getLine, monthCost, provisionLine, recentCalls, setSmsStatus, updateLineSettings, validateAreaCode, validateLineSettings } from '@/lib/phoneLines';
import { sendTestLead } from '@/lib/leads';
import { describeDelivery } from '@/lib/leadShared';
import { monthOf } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

async function payload(onboardingId: number) {
  const line = await getLine(onboardingId);
  if (!line) return { line: null, calls: [], cost: null };
  const [calls, cost] = await Promise.all([recentCalls(onboardingId, 30, { includeConnect: true }), monthCost(onboardingId, monthOf())]);
  return { line, calls, cost };
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await payload(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    if (body.action === 'provision') {
      await provisionLine(onboarding, { areaCode: validateAreaCode(body.areaCode), forwardTo: String(body.forwardTo ?? '') });
      return NextResponse.json(await payload(onboarding.id));
    }
    if (body.action === 'sms') {
      await setSmsStatus(onboarding.id, body.status === 'ready' ? 'ready' : 'pending');
      return NextResponse.json(await payload(onboarding.id));
    }
    if (body.action === 'test-lead') {
      // Awaited, not after(): the admin wants to see what happened.
      const report = await sendTestLead(onboarding, body.phone);
      return NextResponse.json({ ...(await payload(onboarding.id)), testLead: describeDelivery(report) });
    }
    throw new Error('Unknown action');
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    const line = await getLine(onboarding.id);
    await updateLineSettings(onboarding.id, validateLineSettings(await readBody(req), line?.phoneNumber ?? null));
    return NextResponse.json(await payload(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}
