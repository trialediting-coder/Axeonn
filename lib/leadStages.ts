// lib/leadStages.ts
// The PROOF taps (Quote sent, Booked, Job done, Not a fit) → a lead's stage and
// the follow-ups that start or stop with it (STAGE_EFFECTS in lib/sequenceShared.ts).
// Storage sits behind LeadStore: slice 3 keeps the stage on form_submissions;
// slice 4 adds a contacts store with the same shape, makes it the default, and
// nothing else here changes. Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { startRun, stopRunsFor, type RunContact, type RunRef, type RunStopReason, type StartResult } from '@/lib/sequences';
import { STAGE_EFFECTS, isLeadStage, type LeadAction, type LeadStage, type SequenceKind } from '@/lib/sequenceShared';

export interface LeadRecord extends RunContact {
  stage: LeadStage;
}

export interface LeadStore {
  /** The ref_table that runs started from this store carry. */
  refTable: string;
  /** Null when the id is not this client's: the caller learns nothing about other clients. */
  find(onboardingId: number, id: number): Promise<LeadRecord | null>;
  setStage(onboardingId: number, id: number, stage: LeadStage, action: LeadAction): Promise<void>;
}

export const formSubmissionStore: LeadStore = {
  refTable: 'form_submissions',
  async find(onboardingId, id) {
    await ensureSchema();
    const { rows } = await sql<{ name: string | null; phone: string | null; email: string | null; stage: string }>`
      SELECT name, phone, email, stage FROM form_submissions WHERE id = ${id} AND onboarding_id = ${onboardingId} LIMIT 1;
    `;
    const r = rows[0];
    return r ? { name: r.name, phone: r.phone, email: r.email, stage: isLeadStage(r.stage) ? r.stage : 'new' } : null;
  },
  async setStage(onboardingId, id, stage, action) {
    await sql`
      UPDATE form_submissions
      SET stage = ${stage},
          stage_changed_at = now(),
          quote_sent_at = CASE WHEN ${action}::text = 'quote_sent' THEN COALESCE(quote_sent_at, now()) ELSE quote_sent_at END
      WHERE id = ${id} AND onboarding_id = ${onboardingId};
    `;
  },
};

export interface StageDeps {
  store: LeadStore;
  startRun: (onboardingId: number, kind: SequenceKind, contact: RunContact, ref: RunRef) => Promise<StartResult>;
  stopRunsFor: (onboardingId: number, match: { phone?: string | null; email?: string | null; kinds?: SequenceKind[] }, reason: RunStopReason) => Promise<number>;
}

const defaultDeps: StageDeps = {
  store: formSubmissionStore,
  startRun: (onboardingId, kind, contact, ref) => startRun(onboardingId, kind, contact, ref),
  stopRunsFor,
};

export interface StageResult {
  stage: LeadStage;
  started: SequenceKind[];
  stopped: number;
}

export async function applyLeadStage(onboardingId: number, id: number, action: LeadAction, deps: StageDeps = defaultDeps): Promise<StageResult> {
  // Looked up under the signed-in client's onboarding id: another client's lead is "not found", and nothing is written.
  const lead = await deps.store.find(onboardingId, id);
  if (!lead) throw new Error('That lead is not in your list');
  const effect = STAGE_EFFECTS[action];
  await deps.store.setStage(onboardingId, id, effect.stage, action);
  // Stop first, then start: "Quote sent" ends the new-lead follow-up before the quote one begins.
  const stopped = effect.stop.length
    ? await deps.stopRunsFor(onboardingId, { phone: lead.phone, email: lead.email, kinds: effect.stop }, `stage:${action}`)
    : 0;
  const started: SequenceKind[] = [];
  for (const kind of effect.start) {
    const r = await deps.startRun(onboardingId, kind, { name: lead.name, phone: lead.phone, email: lead.email }, { table: deps.store.refTable, id });
    if (r.started) started.push(kind);
  }
  return { stage: effect.stage, started, stopped };
}
