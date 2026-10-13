'use client';

// components/admin/PlanPanel.tsx
// The 90-Day Plan card on a client's admin page: ranked actions with owner,
// status, current → target and due date; edit title / owner / target inline,
// Done, Drop, Add action. Writes go through the project route
// (kind: plan-update / plan-add), which returns the refreshed plan.
import { useState } from 'react';
import { adminInput, btn } from '@/components/admin/ui';
import type { PlanItem, PlanOwner, PlanStatus } from '@/lib/plans';
import { fmtPlanValue as fmt } from '@/lib/planRules';

const STATUS: Record<PlanStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-neutral-100 text-neutral-700' },
  on_track: { label: 'On track', cls: 'bg-emerald-50 text-emerald-700' },
  slipping: { label: 'Slipping', cls: 'bg-amber-50 text-amber-800' },
  done: { label: 'Done', cls: 'bg-blue-50 text-blue-700' },
  dropped: { label: 'Dropped', cls: 'bg-neutral-100 text-neutral-400' },
};
const due = (d: string | null) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

export function PlanPanel({ token, items, onPlan }: { token: string; items: PlanItem[]; onPlan: (items: PlanItem[]) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: '', owner: 'axeon' as PlanOwner, target: '' });
  const [adding, setAdding] = useState(false);
  const [add, setAdd] = useState({ title: '', owner: 'axeon' as PlanOwner, why: '' });
  const api = `/api/admin/onboarding/${token}/project`;

  async function post(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => ({}))) as { plan?: PlanItem[]; error?: string };
      if (!res.ok || !json.plan) throw new Error(json.error ?? 'Could not save');
      onPlan(json.plan);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      return false;
    } finally {
      setBusy(null);
    }
  }

  const startEdit = (i: PlanItem) => {
    setEditing(i.id);
    setDraft({ title: i.title, owner: i.owner, target: typeof i.target === 'number' ? String(i.target) : '' });
  };
  const saveEdit = async (i: PlanItem) => {
    const target = typeof i.target === 'number' ? (draft.target === '' ? i.target : Number(draft.target)) : i.target;
    if (typeof target === 'number' && !Number.isFinite(target)) return setError('Target must be a number');
    if (await post({ kind: 'plan-update', id: i.id, title: draft.title, owner: draft.owner, target }, `edit-${i.id}`)) setEditing(null);
  };

  const visible = items.filter((i) => i.status !== 'dropped');
  const dropped = items.length - visible.length;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-neutral-950">90-Day Plan</h3>
          <p className="mt-1 text-xs text-neutral-500">Drafted from the deep audit, re-checked by every audit. Your edits stick; the numbers keep moving.</p>
        </div>
        <button type="button" onClick={() => setAdding((v) => !v)} className={btn('secondary', 'sm')}>
          {adding ? 'Cancel' : 'Add action'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}

      {adding ? (
        <form
          className="mt-3 grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[1fr_120px_1fr_auto]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await post({ kind: 'plan-add', ...add }, 'add')) {
              setAdding(false);
              setAdd({ title: '', owner: 'axeon', why: '' });
            }
          }}
        >
          <input className={adminInput} placeholder="What gets done" value={add.title} onChange={(e) => setAdd((a) => ({ ...a, title: e.target.value }))} required />
          <select className={adminInput} value={add.owner} onChange={(e) => setAdd((a) => ({ ...a, owner: e.target.value as PlanOwner }))}>
            <option value="axeon">Axeon</option>
            <option value="client">Client</option>
          </select>
          <input className={adminInput} placeholder="Why (optional)" value={add.why} onChange={(e) => setAdd((a) => ({ ...a, why: e.target.value }))} />
          <button type="submit" disabled={busy === 'add'} className={btn('primary', 'sm')}>
            Add
          </button>
        </form>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Run a deep audit to draft the plan.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100">
          {visible.map((i) => (
            <li key={i.id} className="py-3">
              {editing === i.id ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_110px_auto_auto]">
                  <input className={adminInput} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                  <select className={adminInput} value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value as PlanOwner }))}>
                    <option value="axeon">Axeon</option>
                    <option value="client">Client</option>
                  </select>
                  {typeof i.target === 'number' ? <input className={adminInput} value={draft.target} onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))} inputMode="decimal" aria-label="Target" /> : <span />}
                  <button type="button" onClick={() => void saveEdit(i)} disabled={busy === `edit-${i.id}`} className={btn('primary', 'sm')}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className={btn('ghost', 'sm')}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <span className={`mt-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${i.owner === 'axeon' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'}`}>{i.owner === 'axeon' ? 'Axeon' : 'Client'}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${i.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{i.title}</p>
                    {i.why ? <p className="text-xs text-neutral-500">{i.why}</p> : null}
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {i.metric ? <>{fmt(i.current, i.metric)} → <b>{fmt(i.target, i.metric)}</b> · </> : null}
                      {i.dueAt ? `due ${due(i.dueAt)}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>
                  <span className="flex gap-1">
                    {i.status !== 'done' ? (
                      <button type="button" onClick={() => void post({ kind: 'plan-update', id: i.id, status: 'done' }, `done-${i.id}`)} className={btn('ghost', 'sm')}>
                        Done
                      </button>
                    ) : (
                      <button type="button" onClick={() => void post({ kind: 'plan-update', id: i.id, status: 'open' }, `reopen-${i.id}`)} className={btn('ghost', 'sm')}>
                        Reopen
                      </button>
                    )}
                    <button type="button" onClick={() => startEdit(i)} className={btn('ghost', 'sm')}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void post({ kind: 'plan-update', id: i.id, status: 'dropped' }, `drop-${i.id}`)} className={btn('ghost', 'sm')}>
                      Drop
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {dropped ? <p className="mt-2 text-xs text-neutral-400">{dropped} dropped</p> : null}
    </div>
  );
}
