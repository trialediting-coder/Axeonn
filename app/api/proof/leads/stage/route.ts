// app/api/proof/leads/stage/route.ts
// POST { id, action } from the signed-in client's Leads tab: Quote sent, Talked
// to them, Booked, Job done or Not a fit on one of their form leads. Moves the
// stage and starts or stops the follow-ups that go with it (lib/leadStages.ts).
// Only the client's own leads: applyLeadStage looks the id up with their
// onboarding id. Every plan; since slice 4 the form's contact follows
// (formContactStore, the default store).
// POST { contactId, action } (slice 4, AxeonCORE and up): the same taps on an
// inbox contact, through the same applyLeadStage with the contact store.
import { NextResponse } from 'next/server';
import { readBody } from '@/lib/billingApi';
import { inboxEnabled } from '@/lib/contactsShared';
import { errText } from '@/lib/dbRows';
import { INBOX_TIER_ERROR } from '@/lib/inboxServer';
import { applyLeadStage, contactStageDeps, defaultDeps, LeadNotFoundError, type StageDeps } from '@/lib/leadStages';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';
import { redactDigits } from '@/lib/sequenceSchedule';
import { parseStageRequest } from '@/lib/sequenceShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  // JSON only: a form post from another site (a simple cross-site request) is refused before anything is read.
  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return NextResponse.json({ error: 'Send JSON' }, { status: 415 });
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  let parsed: ReturnType<typeof parseStageRequest>;
  // { contactId } is the inbox; anything else is slice 3's { id } form-lead tap.
  let inbox = false;
  try {
    const raw = await readBody(req);
    inbox = raw.contactId !== undefined;
    // parseStageRequest's own messages are written for the client; the inbox path reuses it with the contact id.
    parsed = parseStageRequest(inbox ? { id: raw.contactId, action: raw.action } : raw);
  } catch (err) {
    return bad(errText(err));
  }
  const { id, action } = parsed;
  let deps: StageDeps = defaultDeps;
  if (inbox) {
    const onboarding = await getOnboardingById(account.onboardingId).catch(() => null);
    if (!onboarding || !inboxEnabled(onboarding.tier)) return NextResponse.json({ error: INBOX_TIER_ERROR }, { status: 403 });
    deps = contactStageDeps;
  }
  try {
    // A follow-up failure is not an error here: the stage is saved and the result carries a warning (200).
    const result = await applyLeadStage(account.onboardingId, id, action, deps);
    return NextResponse.json(inbox ? { ok: true, contactId: id, ...result } : { ok: true, id, ...result });
  } catch (err) {
    if (err instanceof LeadNotFoundError) return bad(err.message);
    // Anything else (a database error) is logged, never shown.
    console.error('[proof/leads/stage]', account.onboardingId, inbox ? 'contact' : 'form', id, action, redactDigits(errText(err)));
    return bad('Could not save that. Please try again.');
  }
}
