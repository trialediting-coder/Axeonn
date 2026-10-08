// app/api/admin/calls/[id]/route.ts
// Admin-only: save notes and the outcome of a call for one prospect.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { isOutcome, updateCallLead, type CallLeadPatch } from '@/lib/callLeads';

export const runtime = 'nodejs';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  try {
    const body = await readBody(req);
    const patch: CallLeadPatch = {};
    if (body.notes !== undefined) {
      if (typeof body.notes !== 'string') throw new Error('notes must be text');
      patch.notes = body.notes;
    }
    if (body.outcome !== undefined) {
      if (!isOutcome(body.outcome)) throw new Error('Unknown outcome');
      patch.outcome = body.outcome;
    }
    if (body.calledNow === true) patch.calledNow = true;
    const lead = await updateCallLead(id, patch);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (err) {
    return jsonError(err);
  }
}
