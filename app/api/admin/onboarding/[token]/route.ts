// app/api/admin/onboarding/[token]/route.ts
// Admin-only actions on one onboarding:
//   PATCH { itemKey, status }     mark an item done / reopen it (Axeon-side rows, or a client row on their behalf)
//   PATCH { status }              active | complete | closed  (closed = link dead)
//   POST  { action: 'welcome' }   resend the welcome email
//   POST  { action: 'nudge' }     email the client the list of open items
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import {
  computeProgress,
  getItemStates,
  getOnboardingByToken,
  markNudgeSent,
  orderedItems,
  setItemStatusByAdmin,
  setOnboardingStatus,
  welcomeUrl,
} from '@/lib/onboarding';
import { sendWelcomeFor } from '@/lib/onboardingFulfillment';
import { sendNudgeEmail } from '@/lib/email';

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
      const states = await getItemStates(onboarding.id);
      const open = orderedItems(onboarding.tier).client.filter((i) => states[i.key]?.status !== 'done');
      if (open.length === 0) throw new Error('Nothing is open for this client');
      const sent = await sendNudgeEmail({
        to: onboarding.clientEmail,
        clientName: onboarding.clientName,
        url: welcomeUrl(onboarding.token),
        openItems: open.map((i) => i.title),
      });
      if (!sent) throw new Error('Email is not configured (RESEND_API_KEY)');
      await markNudgeSent(onboarding.id);
    } else {
      throw new Error('Unknown action');
    }
    return NextResponse.json(await present(token));
  } catch (err) {
    return jsonError(err);
  }
}
