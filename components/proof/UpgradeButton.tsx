'use client';

// components/proof/UpgradeButton.tsx
// The one button on a locked tab. Posts to /api/proof/upgrade; after that it
// reads "Requested" and stays that way. In the admin preview it is disabled,
// since the admin is not the client.
import { useState } from 'react';
import { Check } from 'lucide-react';
import type { OnboardingTier } from '@/data/onboardingItems';

export function UpgradeButton({ tier, label, requestedAt, preview }: { tier: OnboardingTier; label: string; requestedAt: string | null; preview: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>(requestedAt ? 'done' : 'idle');
  const [when, setWhen] = useState<string | null>(requestedAt);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/proof/upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; at?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setWhen(data.at ?? new Date().toISOString());
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Could not send that');
    }
  }

  if (state === 'done') {
    const day = when ? new Date(when).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    return (
      <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="flex items-center gap-2 font-semibold">
          <Check size={16} /> Requested{day ? ` on ${day}` : ''}.
        </p>
        <p className="mt-1 text-emerald-800">We will switch it on within one business day and confirm by email. Nothing changes until then.</p>
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={ask}
        disabled={preview || state === 'busy'}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {state === 'busy' ? 'Sending…' : label}
      </button>
      {preview ? <p className="mt-2 text-xs text-neutral-500">Clients can press this. In the admin preview it is switched off.</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
