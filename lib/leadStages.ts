// lib/leadStages.ts
// The PROOF taps (Quote sent, Booked, Job done, Not a fit) → a lead's stage and
// the follow-ups that start or stop with it (STAGE_EFFECTS in lib/sequenceShared.ts).
// Storage sits behind LeadStore: slice 3 keeps the stage on form_submissions;
// slice 4 adds a contacts store with the same shape, makes it the default, and
// nothing else here changes. Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { errText, iso, type DbTime } from '@/lib/dbRows';
import { sendSequenceStartFailedNotification } from '@/lib/email';
import { getOnboardingById } from '@/lib/onboarding';
import { redactDigits } from '@/lib/sequenceSchedule';
import { startRun, stopRunsFor, type RunContact, type RunRef, type RunStopReason, type StartResult } from '@/lib/sequences';
import { STAGE_EFFECTS, isLeadStage, type LeadAction, type LeadStage, type SequenceKind } from '@/lib/sequenceShared';

export interface LeadRecord extends RunContact {
  stage: LeadStage;
  /** When Quote sent was first tapped; null until then. A second tap does not restart the quote follow-up. */
  quoteSentAt: string | null;
}

/** The id is not one of this client's (live) leads. Its message is safe to show the client. */
export class LeadNotFoundError extends Error {
  constructor() {
    super('That lead is not in your list');
    this.name = 'LeadNotFoundError';
  }
}

export const STAGE_ENGINE_WARNING = "Saved. The automatic follow-up didn't start; Axeon has been told.";

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
    // Admin test leads are never staged from the client side.
    const { rows } = await sql<{ name: string | null; phone: string | null; email: string | null; stage: string; quote_sent_at: DbTime | null }>`
      SELECT name, phone, email, stage, quote_sent_at FROM form_submissions
      WHERE id = ${id} AND onboarding_id = ${onboardingId} AND NOT is_test LIMIT 1;
    `;
    const r = rows[0];
    return r
      ? { name: r.name, phone: r.phone, email: r.email, stage: isLeadStage(r.stage) ? r.stage : 'new', quoteSentAt: r.quote_sent_at ? iso(r.quote_sent_at) : null }
      : null;
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
  /** Tells Axeon the follow-up engine failed on a tap. Must never throw. */
  notifyStartFailed: (onboardingId: number, input: { leadId: number; action: LeadAction; error: string }) => Promise<void>;
}

async function notifyStartFailed(onboardingId: number, input: { leadId: number; action: LeadAction; error: string }): Promise<void> {
  try {
    const onboarding = await getOnboardingById(onboardingId);
    await sendSequenceStartFailedNotification({ businessName: onboarding?.businessName ?? null, ...input });
  } catch (err) {
    console.error('[leadStages] Axeon not told about the failed follow-up', onboardingId, input.leadId, redactDigits(errText(err)).slice(0, 300));
  }
}

const defaultDeps: StageDeps = {
  store: formSubmissionStore,
  startRun: (onboardingId, kind, contact, ref) => startRun(onboardingId, kind, contact, ref),
  stopRunsFor,
  notifyStartFailed,
};

export interface StageResult {
  stage: LeadStage;
  started: SequenceKind[];
  stopped: number;
  /** Set when the stage was saved but the follow-up engine failed (STAGE_ENGINE_WARNING). */
  warning?: string;
}

export async function applyLeadStage(onboardingId: number, id: number, action: LeadAction, deps: StageDeps = defaultDeps): Promise<StageResult> {
  // Looked up under the signed-in client's onboarding id: another client's lead is "not found", and nothing is written.
  const lead = await deps.store.find(onboardingId, id);
  if (!lead) throw new LeadNotFoundError();
  const effect = STAGE_EFFECTS[action];
  await deps.store.setStage(onboardingId, id, effect.stage, action);
  // Idempotent taps: a follow-up starts only on a real change (Quote sent: the first tap; others: a new stage).
  const changed = action === 'quote_sent' ? lead.quoteSentAt === null : lead.stage !== effect.stage;
  let stopped = 0;
  const started: SequenceKind[] = [];
  try {
    // Stop first, then start: "Quote sent" ends the new-lead follow-up before the quote one begins.
    if (effect.stop.length) {
      stopped = await deps.stopRunsFor(onboardingId, { phone: lead.phone, email: lead.email, kinds: effect.stop }, `stage:${action}`);
    }
    if (changed) {
      for (const kind of effect.start) {
        const r = await deps.startRun(onboardingId, kind, { name: lead.name, phone: lead.phone, email: lead.email }, { table: deps.store.refTable, id });
        if (r.started) started.push(kind);
      }
    }
  } catch (err) {
    // The stage is saved; the client sees a plain warning, never the engine's error text. Axeon gets an email.
    const error = redactDigits(errText(err)).slice(0, 300);
    console.error('[leadStages] follow-up update failed', onboardingId, id, action, error);
    await deps.notifyStartFailed(onboardingId, { leadId: id, action, error });
    return { stage: effect.stage, started: [], stopped, warning: STAGE_ENGINE_WARNING };
  }
  return { stage: effect.stage, started, stopped };
}
