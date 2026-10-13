// app/api/admin/audits/[id]/route.ts
// One audit: read it (with ?raw=1 for the stored DataForSEO responses), attach
// it to a client who signed, or delete it.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { attachAuditToOnboarding, deleteAudit, getAudit } from '@/lib/audits';
import { getOnboardingById } from '@/lib/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const idOf = async (ctx: { params: Promise<{ id: string }> }) => {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Which audit?');
  return id;
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const audit = await getAudit(await idOf(ctx), new URL(req.url).searchParams.get('raw') === '1');
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const id = await idOf(ctx);
    const body = await readBody(req);
    if (body.action !== 'attach') throw new Error('Unknown action');
    const onboardingId = Number(body.onboardingId);
    if (!Number.isInteger(onboardingId) || onboardingId <= 0) throw new Error('Pick the client to attach this audit to');
    if (!(await getOnboardingById(onboardingId))) throw new Error('That client no longer exists');
    return NextResponse.json(await attachAuditToOnboarding(id, onboardingId));
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    await deleteAudit(await idOf(ctx));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
