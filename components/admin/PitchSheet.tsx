'use client';

// components/admin/PitchSheet.tsx
// The sales view of one audit: three money numbers, the top-3 table, and the
// first three plan actions — one screen for a call, plus "Copy as text" for a
// text or email (lib/pitch.ts). Same data as the full readout, less of it.
import { useState } from 'react';
import { Copy } from 'lucide-react';
import { btn } from '@/components/admin/ui';
import { pitchNumbers, pitchText } from '@/lib/pitch';
import type { PlanDraft } from '@/lib/planRules';
import { section, type AuditRow } from '@/lib/auditShared';
import { CompetitorTable } from '@/components/admin/CompetitorTable';

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-neutral-950">{value}</p>
      {sub ? <p className="mt-0.5 text-sm text-neutral-600">{sub}</p> : null}
    </div>
  );
}

export function PitchSheet({ audit, drafts }: { audit: Pick<AuditRow, 'results' | 'subject' | 'createdAt'>; drafts: PlanDraft[] }) {
  const [copied, setCopied] = useState(false);
  const n = pitchNumbers(audit);
  const comps = section(audit.results.competitors);
  const maps = section(audit.results.maps);
  const city = audit.subject.city;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pitchText(audit, drafts));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-neutral-600">
          <b className="text-neutral-950">{audit.subject.business}</b> · “{audit.subject.keyword}” in {city}
        </p>
        <button type="button" onClick={copy} className={btn('secondary', 'sm')}>
          <Copy size={13} /> {copied ? 'Copied' : 'Copy as text'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Big
          label="Searches they're missing"
          value={n.missedSearches === null ? 'not measured' : `${n.missedSearches.toLocaleString('en-US')}/mo`}
          sub={n.missedAdValue === null ? undefined : `${usd(n.missedAdValue)}/mo if bought as ads`}
        />
        <Big
          label="Reviews vs the top 3"
          value={n.myReviews === null ? '–' : `${n.myReviews}`}
          sub={n.top3AvgReviews === null ? undefined : `top 3 average ${n.top3AvgReviews}${n.velocity !== null ? ` · adding ~${n.velocity}/mo` : ''}`}
        />
        <Big
          label="Google Maps"
          value={n.found === null ? 'not measured' : n.found && n.rank !== null ? `#${n.rank}` : 'Not in top 20'}
          sub={n.gridShare === null ? undefined : `in the top 3 from ${Math.round(n.gridShare * 100)}% of ${city}`}
        />
      </div>
      {comps && comps.items.length ? (
        <CompetitorTable items={comps.items} selfLabel="them" />
      ) : maps && maps.top.length ? (
        <p className="text-sm text-neutral-700">Top 3: {maps.top.filter((c) => !c.self).map((c) => `${c.name} (${c.reviews ?? '–'})`).join(', ')}</p>
      ) : null}
      {drafts.length ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-900/70">What we'd do first</p>
          <ol className="mt-2 space-y-1.5 text-sm text-blue-950">
            {drafts.slice(0, 3).map((d) => (
              <li key={d.key}>
                <b>{d.title}.</b> {d.why}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
