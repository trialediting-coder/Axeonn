'use client';

// components/proof/RankingCard.tsx
// The client's Google standing on the PROOF overview: today's Maps rank for
// their keyword, every audit since kickoff as a line (baseline marked), the
// latest 5×5 grid, and "Scan now" with this month's remaining scans. Client
// scans never feed the official numbers; the copy says why the line matters
// more than any single day.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { GridMap } from '@/components/admin/AuditReadout';
import type { AuditTrigger, GridResult, Leak, ProgressTile } from '@/lib/auditShared';
import { PlanChecklist, type ClientPlanItem } from '@/components/proof/PlanChecklist';

export interface RankingData {
  keyword: string;
  city: string;
  baselineRank: number | null;
  points: Array<{ at: string; rank: number | null; trigger: AuditTrigger }>;
  latest: { at: string; rank: number | null; found: boolean; rating: number | null; reviews: number | null } | null;
  grid: { at: string; result: GridResult } | null;
  cap: number;
  used: number;
  /** Baseline (kickoff deep audit) → now, four numbers (lib/auditShared.ts progressFrom). */
  progress: ProgressTile[];
  /** The 90-day plan, client view (dropped items left out). */
  plan: ClientPlanItem[];
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
const nextMonthLabel = () => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/** Rank over time; rank 1 at the top, "not found" drawn at the bottom edge as a hollow dot. */
function Trend({ points, baseline }: { points: RankingData['points']; baseline: number | null }) {
  const W = 320;
  const H = 96;
  const pad = 10;
  const ranks = points.map((p) => p.rank ?? 21);
  const max = Math.max(5, ...ranks, baseline ?? 0);
  const x = (i: number) => (points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1));
  const y = (r: number) => pad + ((r - 1) * (H - pad * 2)) / (max - 1 || 1);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rank ?? 21).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label="Maps rank over time">
      {baseline !== null ? <line x1={pad} x2={W - pad} y1={y(baseline)} y2={y(baseline)} stroke="#a3a3a3" strokeDasharray="4 4" /> : null}
      {points.length > 1 ? <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" /> : null}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.rank ?? 21)} r="3.5" fill={p.rank === null ? '#fff' : '#2563eb'} stroke="#2563eb" strokeWidth="1.5">
          <title>{`${day(p.at)}: ${p.rank === null ? 'not in top 20' : `#${p.rank}`}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function RankingCard({ data, api }: { data: RankingData; api: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  /** `found: null` means the scan could not reach Google; the server did not count it. */
  const [result, setResult] = useState<{ rank: number | null; found: boolean | null; leaks: Leak[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const left = Math.max(0, data.cap - data.used);

  async function scan() {
    if (!api) return;
    setBusy(true);
    setError(null);
    const res = await fetch(api, { method: 'POST' });
    const json = (await res.json().catch(() => ({}))) as { rank?: number | null; found?: boolean | null; leaks?: Leak[]; error?: string };
    setBusy(false);
    if (!res.ok) return setError(json.error ?? 'The scan did not go through. Nothing was used.');
    setResult({ rank: json.rank ?? null, found: json.found === undefined ? null : json.found, leaks: json.leaks ?? [] });
    router.refresh();
  }

  return (
    <section className="proof-rise mt-4 rounded-2xl bg-white p-5 shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.04)] sm:mt-6 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <MapPin size={12} /> Google Maps · “{data.keyword}” in {data.city}
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            {data.latest ? (data.latest.found && data.latest.rank !== null ? `#${data.latest.rank}` : 'Not in top 20') : 'Measured after kickoff'}
            {data.latest ? <span className="ml-2 text-sm font-semibold text-neutral-500">{day(data.latest.at)}</span> : null}
          </p>
          {data.latest && data.latest.rating !== null ? (
            <p className="text-sm text-neutral-600">
              {data.latest.rating} ★ · {data.latest.reviews ?? '–'} reviews
              {data.baselineRank !== null ? <> · started at #{data.baselineRank}</> : null}
            </p>
          ) : null}
        </div>
        {api && data.cap > 0 ? (
          <div className="text-right">
            <button
              type="button"
              onClick={scan}
              disabled={busy || left === 0}
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Checking Google…' : 'Scan now'}
            </button>
            <p className="mt-1 text-xs text-neutral-500">{left > 0 ? `${left} of ${data.cap} left this month` : `Next scans unlock ${nextMonthLabel()}`}</p>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {result && result.found === null ? (
        <p className="mt-3 text-sm font-semibold text-amber-800">We couldn’t check Google just now. Nothing was used; try again in a minute.</p>
      ) : result ? (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
          <p className="font-semibold">Right now: {result.found && result.rank !== null ? `#${result.rank}` : 'not in the top 20'}.</p>
          {result.leaks.slice(0, 3).map((l, i) => (
            <p key={i} className="mt-1">
              <b>{l.headline}.</b> {l.detail}
            </p>
          ))}
        </div>
      ) : null}

      {data.progress.some((t) => t.baseline !== null || t.now !== null) ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.progress.map((t) => (
            <div key={t.key} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{t.label}</p>
              <p className="mt-0.5 text-lg font-bold text-neutral-950">
                {t.baseline === null ? '–' : t.key === 'rank' ? `#${t.baseline}` : t.baseline}
                <span className="mx-1 text-neutral-400">→</span>
                <span className={t.better === true ? 'text-emerald-700' : t.better === false ? 'text-amber-700' : ''}>{t.now === null ? '–' : t.key === 'rank' ? `#${t.now}` : t.now}</span>
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {data.points.length > 0 ? (
        <div className="mt-4">
          <Trend points={data.points} baseline={data.baselineRank} />
          <p className="mt-1 text-xs text-neutral-500">
            Rankings move a spot or two day to day. The line is what matters.{data.baselineRank !== null ? ' Dashed line: where you started.' : ''}
          </p>
        </div>
      ) : null}

      {data.grid ? (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Where you show up across {data.city} · measured {day(data.grid.at)}
          </p>
          <div className="mt-2">
            <GridMap grid={data.grid.result} />
          </div>
        </div>
      ) : null}

      <PlanChecklist items={data.plan} />
    </section>
  );
}
