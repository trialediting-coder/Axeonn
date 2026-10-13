'use client';

// components/admin/AuditsConsole.tsx
// /admin/audits: run an audit on any business (for a sales or onboarding call),
// browse past prospect audits, and attach one to a client who signed.
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { AuditReadout } from '@/components/admin/AuditReadout';
import { summarize, type AuditRow } from '@/lib/auditShared';

export interface ClientOption { id: number; label: string }

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });

export function AuditsConsole({ initial, clients, openId = null }: { initial: AuditRow[]; clients: ClientOption[]; openId?: number | null }) {
  const [audits, setAudits] = useState(initial);
  const [open, setOpen] = useState<number | null>(openId ?? initial[0]?.id ?? null);
  const [form, setForm] = useState({ business: '', city: '', state: 'IA', keyword: '', website: '', grid: false });
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [attachTo, setAttachTo] = useState<string>('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const current = audits.find((a) => a.id === open) ?? null;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? audits.filter((a) => `${a.subject.business} ${a.subject.city}`.toLowerCase().includes(needle)) : audits;
  }, [audits, q]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await fetch('/api/admin/audits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const json = (await res.json().catch(() => ({}))) as { audit?: AuditRow; error?: string };
    setBusy(false);
    if (!res.ok || !json.audit) return setNotice({ ok: false, text: json.error ?? 'Audit failed.' });
    const saved = json.audit;
    setAudits((all) => [saved, ...all]);
    setOpen(saved.id);
    setNotice({ ok: true, text: `Audited ${saved.subject.business} ($${saved.costUsd.toFixed(3)}).` });
  }

  async function attach() {
    if (!current || !attachTo) return;
    setBusy(true);
    const res = await fetch(`/api/admin/audits/${current.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'attach', onboardingId: Number(attachTo) }) });
    const json = (await res.json().catch(() => ({}))) as { baselineSet?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: json.error ?? 'Could not attach.' });
    setAudits((all) => all.filter((a) => a.id !== current.id));
    setOpen(null);
    setNotice({ ok: true, text: json.baselineSet ? 'Attached, and it set their 90-day baseline.' : 'Attached to the client.' });
  }

  async function remove() {
    if (!current || !window.confirm(`Delete the audit of ${current.subject.business}?`)) return;
    const res = await fetch(`/api/admin/audits/${current.id}`, { method: 'DELETE' });
    if (!res.ok) return setNotice({ ok: false, text: 'Could not delete.' });
    setAudits((all) => all.filter((a) => a.id !== current.id));
    setOpen(null);
  }

  const field = (k: Exclude<keyof typeof form, 'grid'>, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <input className={adminInput} value={form[k]} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <form onSubmit={run} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-neutral-950">Audit a business</h2>
          <div className="mt-3 grid gap-3">
            {field('business', 'Business', { placeholder: 'Joe’s Auto Spa', required: true })}
            <div className="grid grid-cols-[1fr_72px] gap-2">
              {field('city', 'City', { placeholder: 'Ankeny', required: true })}
              {field('state', 'State', { maxLength: 2 })}
            </div>
            {field('keyword', 'What they want to rank for', { placeholder: 'auto detailing', required: true })}
            {field('website', 'Website (optional)', { placeholder: 'joesautospa.com', inputMode: 'url' })}
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={form.grid} onChange={set('grid')} /> Include the 5×5 city grid (+$0.05, ~1 min)
            </label>
          </div>
          <button type="submit" disabled={busy} className={`${btn('primary')} mt-4 w-full`}>
            {busy ? 'Measuring…' : 'Run audit'}
          </button>
          {notice ? <p className={`mt-2 text-sm font-semibold ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p> : null}
        </form>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={`${adminInput} pl-8`} placeholder="Search past audits" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <ul className="mt-3 max-h-[60vh] divide-y divide-neutral-100 overflow-y-auto">
            {shown.map((a) => {
              const s = summarize(a);
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => setOpen(a.id)} className={`w-full px-1 py-2 text-left text-sm hover:bg-neutral-50 ${open === a.id ? 'bg-blue-50' : ''}`}>
                    <span className="font-semibold text-neutral-900">{a.subject.business}</span>
                    <span className="text-neutral-500"> · {a.subject.city}</span>
                    <span className="float-right tabular-nums text-neutral-500">
                      {s.found === false ? 'not found' : s.mapsRank !== null ? `#${s.mapsRank}` : '–'} · {when(a.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 ? <li className="py-6 text-center text-sm text-neutral-500">No audits yet.</li> : null}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
        {current ? (
          <>
            <AuditReadout audit={current} variant="admin" />
            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-neutral-200 pt-4">
              <label className="block min-w-[220px] flex-1">
                <span className={adminLabel}>They signed? Attach to a client</span>
                <select className={adminInput} value={attachTo} onChange={(e) => setAttachTo(e.target.value)}>
                  <option value="">Pick a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={attach} disabled={!attachTo || busy} className={btn('primary')}>
                Attach as their baseline
              </button>
              <button type="button" onClick={remove} className={btn('danger')}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-neutral-500">Run an audit or pick one on the left.</p>
        )}
      </div>
    </div>
  );
}
