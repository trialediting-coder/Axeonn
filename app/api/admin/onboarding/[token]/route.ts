// app/api/admin/onboarding/[token]/route.ts
// Admin-only actions on one onboarding:
//   PATCH { itemKey, status }     mark an item done / reopen it (Axeon-side rows, or a client row on their behalf)
//   PATCH { status }              active | complete | closed  (closed = link dead)
//   POST  { action: 'welcome' }   resend the welcome email
//   POST  { action: 'nudge' }     email the client the list of open items
//   POST  { action: 'invite' }    email a live client their AxeonPROOF dashboard link
import { NextResponse, after } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import {
  computeProgress,
  getItemStates,
  getOnboardingByToken,
  setItemStatusByAdmin,
  setOnboardingStatus,
  welcomeUrl,
} from '@/lib/onboarding';
import { sendDashboardInviteFor, sendNudgeFor, sendWelcomeFor } from '@/lib/onboardingFulfillment';
import { afterOnboardingChange } from '@/lib/onboardingSync';

export const runtime = 'nodejs';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

async function present(token: string) {
  const onboarding = await load(token);
  const states = await getItemStates(onboarding.id);
  return { onboarding: { ...onboarding, url: welcomeUrl(onboarding.token) }, states, progress: computeProgress(onboarding.tier, states) };
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await present((await ctx.params).token));
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { token } = await ctx.params;
    const body = await readBody(req);
    const onboarding = await load(token);
    if (typeof body.itemKey === 'string') {
      if (body.status !== 'done' && body.status !== 'pending') throw new Error('status must be done or pending');
      await setItemStatusByAdmin(onboarding, body.itemKey, body.status);
    } else if (body.status === 'active' || body.status === 'complete' || body.status === 'closed') {
      await setOnboardingStatus(onboarding, body.status);
    } else {
      throw new Error('Nothing to update');
    }
    after(() => afterOnboardingChange(onboarding.token));
    return NextResponse.json(await present(token));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { token } = await ctx.params;
    const body = await readBody(req);
    const onboarding = await load(token);
    if (body.action === 'welcome') {
      const sent = await sendWelcomeFor(onboarding);
      if (!sent) throw new Error('Email is not configured (RESEND_API_KEY)');
    } else if (body.action === 'nudge') {
      await sendNudgeFor(onboarding);
    } else if (body.action === 'invite') {
      await sendDashboardInviteFor(onboarding);
    } else {
      throw new Error('Unknown action');
    }
    return NextResponse.json(await present(token));
  } catch (err) {
    return jsonError(err);
  }
}
