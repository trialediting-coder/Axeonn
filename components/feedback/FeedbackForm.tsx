'use client';

// components/feedback/FeedbackForm.tsx
// The rest of the survey and the one-sentence box on /f/<token>. Each question
// is a row of tap buttons; Send posts everything to /api/feedback with the
// signed token. With no questions left it is just the sentence box.
import { useState, type FormEvent } from 'react';
import { btn } from '@/components/admin/ui';
import type { FeedbackAnswers, FeedbackRating, SurveyQuestion } from '@/lib/feedbackShared';

export function FeedbackForm({ token, rating, questions = [] }: { token: string; rating: FeedbackRating | null; questions?: readonly SurveyQuestion[] }) {
  const [comment, setComment] = useState('');
  const [picked, setPicked] = useState<FeedbackRating | null>(rating);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const survey = questions.length > 0;
  const canSend = Boolean(comment.trim()) || Boolean(picked && !rating) || Object.keys(answers).length > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating: picked, comment, answers }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Could not send that');
    }
  }

  if (state === 'done') {
    return <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Got it. Thank you.</p>;
  }
  const pill = (on: boolean) =>
    `min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'}`;
  return (
    <form onSubmit={submit} className="mt-5 space-y-5">
      {questions.map((q, i) => (
        <fieldset key={q.key}>
          <legend className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            {i + 1} of {questions.length}
          </legend>
          <p className="mt-1 text-base font-semibold text-neutral-950">{q.text}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <button key={o.value} type="button" onClick={() => setAnswers((x) => ({ ...x, [q.key]: o.value }))} aria-pressed={answers[q.key] === o.value} className={pill(answers[q.key] === o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {!rating && !survey ? (
        <div className="flex flex-wrap gap-2">
          {(['yes', 'sortof', 'no'] as const).map((r) => (
            <button key={r} type="button" onClick={() => setPicked(r)} aria-pressed={picked === r} className={pill(picked === r)}>
              {r === 'yes' ? 'Going well' : r === 'sortof' ? 'Mostly' : 'Something is off'}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={survey ? 'Anything else? Optional.' : 'One sentence is plenty.'}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <button type="submit" disabled={state === 'busy' || !canSend} className={btn('primary')}>
        {state === 'busy' ? 'Sending…' : 'Send'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
