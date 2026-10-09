// lib/clientNotes.ts
// Two personal, plain-text notes from the owner, each sent once: 30 days after
// launch ("anything feel off?") and 90 days after ("would you recommend us?").
// A daily cron (app/api/cron/client-notes) sends whichever is due. Launch is the
// project's target launch date, else kickoff, else the day the client signed
// up. Clients set up quietly (no welcome sent) are never written to, same as
// the nudges; closed clients neither. A note that missed its window by a month
// is skipped rather than sent late.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { sendClientNoteEmail } from '@/lib/email';
import { feedbackUrl } from '@/lib/feedback';
import { listOnboardings, type Onboarding } from '@/lib/onboarding';
import { getProjectDetails, type ProjectDetails } from '@/lib/projects';

export type NoteKind = 'note30' | 'note90';
const DAY = 86_400_000;
/** Day the note is due after launch, and the last day it may still go out. */
export const NOTE_WINDOWS: Record<NoteKind, { from: number; until: number }> = {
  note30: { from: 30, until: 60 },
  note90: { from: 90, until: 120 },
};

export function launchDate(o: Pick<Onboarding, 'createdAt'>, d: Pick<ProjectDetails, 'kickoffAt' | 'targetLaunchAt'>): number {
  const pick = d.targetLaunchAt || d.kickoffAt;
  const t = pick ? new Date(`${pick}T12:00:00Z`).getTime() : new Date(o.createdAt).getTime();
  return Number.isFinite(t) ? t : new Date(o.createdAt).getTime();
}

/** Which note is due today, if any. Pure. */
export function noteDue(
  o: Pick<Onboarding, 'status' | 'welcomeSentAt' | 'createdAt'>,
  d: Pick<ProjectDetails, 'kickoffAt' | 'targetLaunchAt'>,
  sent: { note30SentAt: string | null; note90SentAt: string | null },
  now: number = Date.now()
): NoteKind | null {
  if (o.status === 'closed' || !o.welcomeSentAt) return null;
  const age = (now - launchDate(o, d)) / DAY;
  for (const kind of ['note30', 'note90'] as const) {
    const w = NOTE_WINDOWS[kind];
    const already = kind === 'note30' ? sent.note30SentAt : sent.note90SentAt;
    if (!already && age >= w.from && age < w.until) return kind;
  }
  return null;
}

export interface NotesRun {
  sent: Array<{ token: string; kind: NoteKind }>;
  skipped: Array<{ token: string; reason: string }>;
}

/** The daily run. */
export async function sendClientNotes(now: Date = new Date()): Promise<NotesRun> {
  const out: NotesRun = { sent: [], skipped: [] };
  if (!isDatabaseConfigured()) return out;
  await ensureSchema();
  const all = await listOnboardings(500);
  for (const o of all) {
    if (o.status === 'closed' || !o.welcomeSentAt) continue;
    const [details, flags] = await Promise.all([
      getProjectDetails(o.id),
      sql<{ note30_sent_at: string | null; note90_sent_at: string | null }>`SELECT note30_sent_at, note90_sent_at FROM onboardings WHERE id = ${o.id};`,
    ]);
    const row = flags.rows[0];
    const kind = noteDue(o, details, { note30SentAt: row?.note30_sent_at ?? null, note90SentAt: row?.note90_sent_at ?? null }, now.getTime());
    if (!kind) continue;
    try {
      const sent = await sendClientNoteEmail({
        to: o.clientEmail,
        clientName: o.clientName,
        businessName: o.businessName,
        kind,
        feedbackUrl: feedbackUrl({ onboardingId: o.id, kind, month: null }),
      });
      if (!sent) {
        out.skipped.push({ token: o.token.slice(0, 4), reason: 'email not configured' });
        continue;
      }
      if (kind === 'note30') await sql`UPDATE onboardings SET note30_sent_at = ${now.toISOString()} WHERE id = ${o.id};`;
      else await sql`UPDATE onboardings SET note90_sent_at = ${now.toISOString()} WHERE id = ${o.id};`;
      out.sent.push({ token: o.token.slice(0, 4), kind });
    } catch (err) {
      out.skipped.push({ token: o.token.slice(0, 4), reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
}

/** For the admin card: when each note went out. */
export async function noteStatus(onboardingId: number): Promise<{ note30SentAt: string | null; note90SentAt: string | null }> {
  if (!isDatabaseConfigured()) return { note30SentAt: null, note90SentAt: null };
  await ensureSchema();
  const res = await sql<{ note30_sent_at: string | Date | null; note90_sent_at: string | Date | null }>`SELECT note30_sent_at, note90_sent_at FROM onboardings WHERE id = ${onboardingId};`;
  const r = res.rows[0];
  const iso = (v: string | Date | null | undefined) => (v ? new Date(v).toISOString() : null);
  return { note30SentAt: iso(r?.note30_sent_at), note90SentAt: iso(r?.note90_sent_at) };
}
