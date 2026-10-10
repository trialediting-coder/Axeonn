'use client';

// components/proof/LeadLog.tsx
// "People who reached out": every contact click on the client's site this month
// and last, with the page and campaign behind it, and two taps per lead:
// Booked, or Not yet (a lead that has not booked is pending, not lost). From
// OBSERVED_MIN_MARKED marks the client's own rate is blended into the estimate,
// and from OBSERVED_FULL_MARKED it sets the rate (lib/siteStats.ts). Works as a
// stacked list on a phone, a row per lead on wider screens.
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { DEVICE_LABELS, OBSERVED_FULL_MARKED, OBSERVED_MIN_MARKED, buttonLabel, campaignLabel, type LeadOutcome, type LeadRow } from '@/lib/projectsShared';

export interface LeadMonth {
  month: string;
  label: string;
  rows: LeadRow[];
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const pageName = (path: string | null) => (!path || path === '/' ? 'Home page' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

function detailLine(r: LeadRow): string {
  const bits = [pageName(r.path)];
  if (r.utm_source) bits.push(campaignLabel({ source: r.utm_source, medium: r.utm_medium ?? '', campaign: r.utm_campaign ?? '' }));
  if (r.city) bits.push(r.city);
  if (r.device) bits.push(DEVICE_LABELS[r.device as keyof typeof DEVICE_LABELS] ?? r.device);
  return bits.join(' · ');
}

export function LeadLog({ months, api }: { months: LeadMonth[]; api: string | null }) {
  const [outcomes, setOutcomes] = useState<Record<number, LeadOutcome | null>>(() =>
    Object.fromEntries(months.flatMap((m) => m.rows.map((r) => [r.id, r.outcome])))
  );
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = months.reduce((n, m) => n + m.rows.length, 0);
  const marked = Object.values(outcomes).filter(Boolean).length;
  const won = Object.values(outcomes).filter((o) => o === 'won').length;

  async function mark(id: number, outcome: LeadOutcome) {
    if (!api || busy != null) return;
    const before = outcomes[id] ?? null;
    const next = before === outcome ? null : outcome; // a second tap clears it
    setOutcomes((o) => ({ ...o, [id]: next }));
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'lead-outcome', id, outcome: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
    } catch (err) {
      setOutcomes((o) => ({ ...o, [id]: before }));
      setError(err instanceof Error ? err.message : 'Could not save that');
    } finally {
      setBusy(null);
    }
  }

  const toGo = Math.max(0, OBSERVED_MIN_MARKED - marked);
  return (
    <section className="mt-4 rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold text-neutral-950">People who reached out</h2>
          <span className="text-sm text-neutral-500">
            {total} {total === 1 ? 'lead' : 'leads'}
            {won ? ` · ${won} booked` : ''}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Every call, text, email, form and booking from your site, with the page and campaign behind it. Tap{' '}
          <span className="font-semibold text-neutral-700">Booked</span> on the ones that turned into a job and{' '}
          <span className="font-semibold text-neutral-700">Not yet</span> on the rest.
          {toGo > 0
            ? ` After ${OBSERVED_MIN_MARKED} marks your own rate starts counting toward the estimate; after ${OBSERVED_FULL_MARKED} it sets it.`
            : marked >= OBSERVED_FULL_MARKED
              ? ' Your own rate now sets the estimate.'
              : ` Your own rate now counts toward the estimate; after ${OBSERVED_FULL_MARKED} marks it sets it.`}
        </p>
      </div>
      {months.map((m) =>
        m.rows.length ? (
          <div key={m.month}>
            <h3 className="bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:px-6">{m.label}</h3>
            <ul className="divide-y divide-neutral-100">
              {m.rows.map((r) => {
                const o = outcomes[r.id] ?? null;
                return (
                  <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-semibold text-neutral-950">{buttonLabel(r.name)}</span>
                        <span className="text-neutral-500">{when(r.at)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{detailLine(r)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => mark(r.id, 'won')}
                        disabled={!api || busy === r.id}
                        aria-pressed={o === 'won'}
                        className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition sm:flex-none ${
                          o === 'won'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:text-emerald-700'
                        } disabled:opacity-60`}
                      >
                        <Check size={14} /> Booked
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(r.id, 'lost')}
                        disabled={!api || busy === r.id}
                        aria-pressed={o === 'lost'}
                        className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition sm:flex-none ${
                          o === 'lost'
                            ? 'border-neutral-800 bg-neutral-800 text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                        } disabled:opacity-60`}
                      >
                        <X size={14} /> Not yet
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null
      )}
      {error ? <p className="px-4 py-3 text-sm text-red-600 sm:px-6">{error}</p> : null}
    </section>
  );
}
