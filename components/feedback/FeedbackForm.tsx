'use client';

// components/feedback/FeedbackForm.tsx
// The one-sentence box on /f/<token>. Posts to /api/feedback with the signed token.
import { useState, type FormEvent } from 'react';
import { btn } from '@/components/admin/ui';
import type { FeedbackRating } from '@/lib/feedbackShared';

export function FeedbackForm({ token, rating }: { token: string; rating: FeedbackRating | null }) {
  const [comment, setComment] = useState('');
  const [picked, setPicked] = useState<FeedbackRating | null>(rating);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating: picked, comment }),
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
  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      {!rating ? (
        <div className="flex flex-wrap gap-2">
          {(['yes', 'sortof', 'no'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setPicked(r)}
              aria-pressed={picked === r}
              className={`min-h-10 rounded-lg border px-4 text-sm font-semibold ${picked === r ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-200 bg-white text-neutral-800'}`}
            >
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
        placeholder="One sentence is plenty."
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <button type="submit" disabled={state === 'busy' || (!comment.trim() && !picked)} className={btn('primary')}>
        {state === 'busy' ? 'Sending…' : 'Send'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
