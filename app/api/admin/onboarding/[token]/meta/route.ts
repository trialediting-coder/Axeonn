// app/api/admin/onboarding/[token]/meta/route.ts
// Admin-only: the client's connected Facebook pages (lib/metaPages.ts).
//   GET                      { pages }   (never a token)
//   DELETE { pageId }        disconnect one page
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { metaUnavailable } from '@/lib/meta';
import { disconnect, pagesFor } from '@/lib/metaPages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json({ pages: await pagesFor(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    const pageId = typeof body.pageId === 'string' ? body.pageId : '';
    if (!(await disconnect(onboarding.id, pageId))) throw new Error('That page is not connected to this client.');
    return NextResponse.json({ pages: await pagesFor(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}
