// app/api/welcome/[token]/front-desk/route.ts
// AxeonPROOF v2 setup item: the client signs off the front-desk routine
// (lib/proofV2Shared.ts FRONT_DESK_ROUTINE). Cookie-gated like every portal write.
import { NextResponse } from 'next/server';
import { runClientAction } from '@/lib/proofV2Actions';
import { clientIp, isDeviceVerified, loadOnboarding, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`frontdesk:${clientIp(req)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ ok: false, error: 'Slow down a little and try again.' }, { status: 429 });
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return notFound();
  if (!(await isDeviceVerified(onboarding.token))) return NextResponse.json({ ok: false, error: 'Verify this device first.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    await runClientAction(onboarding, { action: 'frontDesk', name: body.name });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Could not save' }, { status: 400 });
  }
}
