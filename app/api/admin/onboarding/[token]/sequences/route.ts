// app/api/admin/onboarding/[token]/sequences/route.ts
// Admin-only: the client's follow-up sequences (lib/sequences.ts).
//   GET                                                 templates, links, run counts, customer counts
//   PUT  { kind, steps, enabled }                        save one template; turning it on is checked first
//   POST { action: 'draft' }                             Claude drafts all five from the portal answers, saved off
//   POST { action: 'links', reviewLink, bookingLink }    the Google review link and the booking link (warns when a cleared link is in use)
//   POST { action: 'import', csv, attest: true }         past-customer CSV with the consent attestation
//   POST { action: 'start_lead', id }                    start the new-lead follow-up for one recent form lead
// Nothing here sends a message; the 15-minute cron sends.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { draftSequenceTemplates } from '@/lib/anthropic';
import { jsonError, readBody } from '@/lib/billingApi';
import { getSubmission } from '@/lib/leads';
import { getItemStates, getOnboardingByToken } from '@/lib/onboarding';
import { importCsv } from '@/lib/pastCustomers';
import { getLine } from '@/lib/phoneLines';
import { getSequenceSettings, getTemplates, saveSequenceSettings, saveTemplate, sequencesAdminData, startLeadFollowUp } from '@/lib/sequences';
import { importNotice, startLeadNotice } from '@/lib/sequenceAdmin';
import { SEQUENCE_LABELS, draftInputFrom, enableProblems, missingLinks, templateVars, validateSequenceLinks, validateTemplate } from '@/lib/sequenceShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // a Claude draft takes 10 to 30 seconds

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  if (onboarding.tier === 'essentials') throw new Error('Follow-up sequences are part of AxeonCORE and up');
  return onboarding;
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await sequencesAdminData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    const template = validateTemplate(await readBody(req));
    if (template.enabled) {
      const [line, settings] = await Promise.all([getLine(onboarding.id), getSequenceSettings(onboarding.id)]);
      const vars = templateVars({ contactName: null, businessName: onboarding.businessName, clientName: onboarding.clientName, reviewLink: settings.reviewLink, bookingLink: settings.bookingLink });
      const problems = enableProblems(template, { smsReady: line?.smsStatus === 'ready', vars });
      if (problems.length) throw new Error(problems.join(' '));
    }
    await saveTemplate(onboarding.id, template, 'axeon');
    return NextResponse.json({ ...(await sequencesAdminData(onboarding.id)), notice: template.enabled ? 'Saved and on.' : 'Saved. It is off.' });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    if (body.action === 'draft') {
      // All five are parsed and validated (parseDraftedTemplates) before any is saved.
      const drafted = await draftSequenceTemplates(draftInputFrom(onboarding, await getItemStates(onboarding.id)));
      for (const t of drafted) await saveTemplate(onboarding.id, validateTemplate({ ...t, enabled: false }), 'claude');
      return NextResponse.json({ ...(await sequencesAdminData(onboarding.id)), notice: 'Drafted all five. Every sequence is off until you read it and turn it on.' });
    }
    if (body.action === 'links') {
      const links = validateSequenceLinks(body);
      const [before, templates] = await Promise.all([getSequenceSettings(onboarding.id), getTemplates(onboarding.id)]);
      await saveSequenceSettings(onboarding.id, links);
      // Clearing a link an enabled template uses: saved, but its running follow-ups will stop ('missing_link'). Say so.
      const vars = templateVars({ contactName: null, businessName: onboarding.businessName, clientName: onboarding.clientName, reviewLink: links.reviewLink, bookingLink: links.bookingLink });
      const cleared = (before.reviewLink && !links.reviewLink) || (before.bookingLink && !links.bookingLink);
      const hit = cleared ? templates.filter((t) => t.enabled && missingLinks(t.steps, vars).length > 0) : [];
      const warning = hit.length
        ? `${hit.map((t) => SEQUENCE_LABELS[t.kind].title).join(', ')} ${hit.length === 1 ? 'uses' : 'use'} the link you cleared. Running follow-ups of ${hit.length === 1 ? 'it' : 'them'} will stop before that step.`
        : undefined;
      return NextResponse.json({ ...(await sequencesAdminData(onboarding.id)), notice: 'Links saved.', ...(warning ? { warning } : {}) });
    }
    if (body.action === 'import') {
      if (body.attest !== true) throw new Error('Tick the consent box first');
      const r = await importCsv(onboarding.id, typeof body.csv === 'string' ? body.csv : '', new Date());
      return NextResponse.json({ ...(await sequencesAdminData(onboarding.id)), notice: importNotice(r.imported, r.skipped) });
    }
    if (body.action === 'start_lead') {
      const id = typeof body.id === 'number' && Number.isInteger(body.id) && body.id > 0 ? body.id : null;
      const lead = id ? await getSubmission(onboarding.id, id) : null;
      if (!lead) throw new Error('That lead is not on this client');
      if (lead.isTest) throw new Error('That is a test lead');
      const result = await startLeadFollowUp(onboarding.id, { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email });
      return NextResponse.json({ ...(await sequencesAdminData(onboarding.id)), notice: startLeadNotice(result) });
    }
    throw new Error('Unknown action');
  } catch (err) {
    return jsonError(err);
  }
}
