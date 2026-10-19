// components/proof/LeadStageTaps.tsx
// The taps on a form lead in the client's Leads tab: Quote sent, Talked to them,
// Booked, Completed, Not a fit. Each one sets the lead's stage and starts or stops
// the automatic follow-ups (POST /api/proof/leads/stage, lib/leadStages.ts). Taps
// set a stage; they do not toggle off. Completed asks first: it sends a review
// request. With no api (the admin "View as client" page) the taps are read-only
// chips that still show where the lead stands.
// The leads inbox (slice 4) reuses it with target="contact": the same taps post
// { contactId, action }, and onSaved lets the inbox refresh its list.
'use client';

import { useState } from 'react';
import { LEAD_ACTIONS, LEAD_ACTION_LABELS, STAGE_EFFECTS, stageTapActive, type LeadAction, type LeadStage, type SequenceKind } from '@/lib/sequenceShared';

export function LeadStageTaps({
  id,
  stage,
  quoteSent: initialQuoteSent,
  api,
  target = 'form',
  onSaved,
}: {
  id: number;
  stage: LeadStage;
  quoteSent: boolean;
  api: string | null;
  /** 'form' posts { id, action } (a form lead, slice 3); 'contact' posts { contactId, action } (an inbox contact, slice 4). */
  target?: 'form' | 'contact';
  /** Called after a tap saved, e.g. to refresh the inbox list. */
  onSaved?: () => void;
}) {
  const [current, setCurrent] = useState<{ stage: LeadStage; quoteSent: boolean }>({ stage, quoteSent: initialQuoteSent });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function tap(action: LeadAction) {
    if (!api || busy || stageTapActive(action, current.stage, current.quoteSent)) return;
    if (action === 'won' && !window.confirm('Mark this as completed? If review requests are on, they get one message in about two hours asking for a Google review.')) return;
    const before = current;
    setCurrent({ stage: STAGE_EFFECTS[action].stage, quoteSent: before.quoteSent || action === 'quote_sent' });
    setBusy(true);
    setProblem(null);
    setNote(null);
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target === 'contact' ? { contactId: id, action } : { id, action }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; warning?: string; started?: SequenceKind[] };
      if (!res.ok) throw new Error(data.error ?? 'Could not save that. Try again.');
      const started = data.started ?? [];
      // A warning means the stage saved but the follow-up did not start; say so in the server's plain words.
      if (data.warning) setProblem(data.warning);
      else if (started.includes('quote')) setNote('Quote follow-up is on. It stops as soon as they reply.');
      else if (started.includes('review')) setNote('The review request goes out in about two hours.');
      onSaved?.();
    } catch (err) {
      setCurrent(before);
      setProblem(err instanceof Error ? err.message : 'Could not save that');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {LEAD_ACTIONS.map((a) => {
          const on = stageTapActive(a, current.stage, current.quoteSent);
          const look = on
            ? a === 'lost'
              ? 'border-neutral-800 bg-neutral-800 text-white'
              : 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-neutral-200 bg-white text-neutral-700';
          const base = 'inline-flex min-h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition';
          if (!api) {
            return (
              <span key={a} className={`${base} ${look} ${on ? '' : 'opacity-60'}`}>
                {LEAD_ACTION_LABELS[a]}
              </span>
            );
          }
          return (
            <button
              key={a}
              type="button"
              onClick={() => void tap(a)}
              disabled={busy}
              aria-pressed={on}
              className={`${base} ${look} ${on ? '' : 'hover:border-neutral-400'} disabled:opacity-60`}
            >
              {LEAD_ACTION_LABELS[a]}
            </button>
          );
        })}
      </div>
      {note ? <p className="text-xs text-emerald-700">{note}</p> : null}
      {problem ? (
        <p role="alert" className="text-xs text-red-600">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
