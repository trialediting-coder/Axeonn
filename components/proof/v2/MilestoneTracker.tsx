// components/proof/v2/MilestoneTracker.tsx
// AxeonPROOF v2: the client's delivery schedule (data/deliverySchedule.ts) as six
// rows. Every phase shows its dates from day 1; the phase on now is highlighted
// and opens to its steps; finished steps carry the date done. Tapping any phase
// opens its steps. Fits one phone screen with the current phase open.
import { Check, ChevronDown, Circle, Clock } from 'lucide-react';
import type { Milestone, PhaseStatus, StepView } from '@/lib/proofV2Shared';
import { shortDate } from '@/lib/proofV2Shared';

const STATUS: Record<PhaseStatus, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  in_progress: { label: 'In progress', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  scheduled: { label: 'Scheduled', cls: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
};

export function StatusPill({ status }: { status: PhaseStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${s.cls}`}>{s.label}</span>;
}

export function StepRow({ step }: { step: StepView }) {
  const done = step.state === 'done';
  return (
    <li className="flex gap-2.5 py-1.5">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-500 text-white' : step.state === 'current' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
        {done ? <Check size={10} className="stroke-[3]" /> : step.state === 'current' ? <Clock size={10} /> : <Circle size={6} className="fill-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-[13px] font-medium leading-snug ${done ? 'text-neutral-900' : 'text-neutral-800'}`}>{step.title}</p>
          <span className={`shrink-0 text-[11px] ${done ? 'font-semibold text-emerald-700' : 'text-neutral-500'}`}>
            {done ? `Done ${shortDate(step.doneDate!)}` : step.state === 'waiting' ? `Planned ${shortDate(step.date)}` : shortDate(step.date)}
          </span>
        </div>
        <p className="hidden text-xs leading-snug text-neutral-500 sm:block">{step.client}</p>
        {step.note ? <p className="text-xs text-amber-800">{step.note}</p> : null}
      </div>
    </li>
  );
}

export function MilestoneTracker({
  milestones,
  day,
  startAt,
  expandAll = false,
  bare = false,
}: {
  milestones: Milestone[];
  day: number;
  startAt: string;
  expandAll?: boolean;
  /** Inside another card (the Overview status card): no card of its own. */
  bare?: boolean;
}) {
  const current = milestones.find((m) => m.current);
  return (
    <section className={bare ? '' : 'proof-rise rounded-2xl bg-white shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.04)]'}>
      <div className={`${bare ? 'hidden' : 'flex'} items-baseline justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-6 sm:py-4`}>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-950">Your delivery schedule</h2>
          <p className="truncate text-xs text-neutral-500">
            Day {Math.min(day, 180)} of 180 · started {shortDate(startAt)}
            {current ? <span className="hidden sm:inline"> · now: {current.title}</span> : null}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-neutral-500">{milestones.filter((m) => m.status === 'completed').length}/6 done</span>
      </div>
      <ol className="divide-y divide-neutral-100">
        {milestones.map((m, i) => (
          <li key={m.key} className={m.current ? 'bg-blue-50/60' : ''}>
            <details open={expandAll || m.current} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3 [&::-webkit-details-marker]:hidden">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.status === 'completed' ? 'bg-emerald-500 text-white' : m.current ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {m.status === 'completed' ? <Check size={14} className="stroke-[3]" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-950">{m.title}</p>
                    <span className="hidden shrink-0 text-[11px] text-neutral-400 sm:inline">{m.days}</span>
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    <span className="sm:hidden">{shortDate(m.from)}–{shortDate(m.to)} · </span>
                    <span className="hidden sm:inline">{shortDate(m.from)} to {shortDate(m.to)} · </span>
                    {m.metric}
                  </p>
                </div>
                <StatusPill status={m.status} />
                <ChevronDown size={14} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-3 pl-14 sm:px-6 sm:pl-16">
                <p className="hidden pb-1 text-xs text-neutral-500 sm:block">{m.summary}</p>
                {m.note ? <p className="pb-1 text-xs font-medium text-amber-800">{m.note}</p> : null}
                <ul className="divide-y divide-neutral-100/70">
                  {m.steps.map((s) => (
                    <StepRow key={s.key} step={s} />
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
