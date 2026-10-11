// app/api/admin/onboarding/[token]/email/route.ts
// Admin-only: the client's business email (lib/businessEmail.ts).
//   GET                                  the current setup
//   PUT  { domain, mailboxes }           save the domain and mailbox list
//   POST { action: 'check' }             look the domain's DNS up now
//   POST { action: 'live' }              email the client their Active mailboxes
//   POST { action: 'resolve', id }       mark a client request handled
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { getBusinessEmail, refreshDns, resolveEmailRequest, saveBusinessEmail, sendLiveEmail } from '@/lib/businessEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json({ setup: await getBusinessEmail(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json({ setup: await saveBusinessEmail(onboarding.id, await readBody(req)) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    if (body.action === 'check') return NextResponse.json({ setup: await refreshDns(onboarding.id) });
    if (body.action === 'live') return NextResponse.json({ setup: await sendLiveEmail(onboarding) });
    if (body.action === 'resolve') return NextResponse.json({ setup: await resolveEmailRequest(onboarding.id, body.id) });
    throw new Error('Unknown action');
  } catch (err) {
    return jsonError(err);
  }
}
