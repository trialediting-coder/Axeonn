// app/api/welcome/[token]/items/route.ts
// Public but cookie-gated: the verified client saves one checklist item. Confirm
// cards send { itemKey, data, done }, accept buttons send { itemKey, done: true }.
// Validation lives in lib/onboarding.saveClientItem so no route can skip it.
import { NextResponse } from 'next/server';
import { saveClientItem } from '@/lib/onboarding';
import { clientIp, isDeviceVerified, loadOnboarding, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`items:${clientIp(req)}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Slow down a little and try again.' }, { status: 429 });
  }
  const onboarding = await loadOnboarding(token);
  if (!onboarding) return notFound();
  if (!(await isDeviceVerified(onboarding.token))) {
    return NextResponse.json({ ok: false, error: 'Verify this device first.', reason: 'unverified' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { itemKey?: unknown; data?: unknown; done?: unknown } | null;
  if (!body || typeof body.itemKey !== 'string') {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  try {
    const state = await saveClientItem(onboarding, body.itemKey, body.data ?? {}, body.done === true);
    return NextResponse.json({ ok: true, item: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
