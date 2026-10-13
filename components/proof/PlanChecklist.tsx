// components/proof/PlanChecklist.tsx
// The client's view of the 90-day plan: what Axeon is doing and what they are
// doing, with a status chip and "now → target". No competitor numbers, no costs.
import { fmtPlanValue, type PlanOwner, type PlanStatus, type PlanValue } from '@/lib/planRules';

export interface ClientPlanItem {
  id: number;
  title: string;
  owner: PlanOwner;
  status: PlanStatus;
  metric: string | null;
  current: PlanValue;
  target: PlanValue;
}

const STATUS: Record<PlanStatus, { label: string; cls: string }> = {
  open: { label: 'Up next', cls: 'bg-neutral-100 text-neutral-600' },
  on_track: { label: 'In progress', cls: 'bg-emerald-50 text-emerald-700' },
  slipping: { label: 'Needs a push', cls: 'bg-amber-50 text-amber-800' },
  done: { label: 'Done', cls: 'bg-blue-50 text-blue-700' },
  dropped: { label: '', cls: '' },
};
const fmt = (v: PlanValue, metric: string | null): string | null => (v === null || typeof v === 'boolean' ? null : fmtPlanValue(v, metric));

function Group({ title, items }: { title: string; items: ClientPlanItem[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((i) => {
          const now = fmt(i.current, i.metric);
          const target = fmt(i.target, i.metric);
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${i.status === 'done' ? 'bg-blue-500' : i.status === 'slipping' ? 'bg-amber-400' : i.status === 'on_track' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
              <span className={i.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-800'}>{i.title}</span>
              {now && target && i.status !== 'done' ? (
                <span className="text-xs text-neutral-500">
                  {now} → {target}
                </span>
              ) : null}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PlanChecklist({ items }: { items: ClientPlanItem[] }) {
  const live = items.filter((i) => i.status !== 'dropped');
  if (!live.length) return null;
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Group title="What Axeon is doing" items={live.filter((i) => i.owner === 'axeon')} />
      <Group title="What you're doing" items={live.filter((i) => i.owner === 'client')} />
    </div>
  );
}
