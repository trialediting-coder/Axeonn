'use client';

// components/welcome/OnboardingPortal.tsx
// The client's checklist at /welcome/<token>, shown once their device is verified.
// Two lists: "Your part" (confirm cards and accept buttons, pending first) and
// "Axeon handles this" (greyed, with status). Every save is one PATCH to
// /api/welcome/<token>/items; the server validates and recomputes completion.
// Item definitions come from data/onboardingItems.ts via the page, never fetched.

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CheckCircle2, ChevronDown, Clock, Loader2, Lock, Pencil, Sparkles } from 'lucide-react';
import type { ItemField, OnboardingItem } from '@/data/onboardingItems';
import type { ItemState } from '@/lib/onboarding';

export interface PortalProps {
  token: string;
  tierLabel: string;
  businessName: string | null;
  clientName: string | null;
  editable: boolean;
  items: { client: OnboardingItem[]; axeon: OnboardingItem[] };
  states: Record<string, ItemState>;
  prefill: Record<string, Record<string, string>>;
  phone: string;
  phoneHref: string;
}

type Status = 'pending' | 'done';

const inputClass =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-colors aria-[invalid=true]:border-red-500';

function maskPhoneClient(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
}

function display(field: ItemField, value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value == null || value === '') return '';
  const str = String(value);
  if (!field.sensitive) return str;
  if (field.type === 'tel') return maskPhoneClient(str);
  return str.replace(/(\+?\d[\d\s().-]{6,}\d)/g, (m) => maskPhoneClient(m));
}

async function patchItem(token: string, body: unknown): Promise<ItemState> {
  const res = await fetch(`/api/welcome/${token}/items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; item?: ItemState; error?: string; reason?: string };
  if (!res.ok || !data.item) {
    if (data.reason === 'unverified') window.location.reload();
    throw new Error(data.error ?? 'Could not save. Try again.');
  }
  return data.item;
}

export function OnboardingPortal(props: PortalProps) {
  const [states, setStates] = useState<Record<string, ItemState>>(props.states);
  const firstPending = props.items.client.find((i) => states[i.key]?.status !== 'done')?.key ?? null;
  const [openKey, setOpenKey] = useState<string | null>(firstPending);

  const { done, total } = useMemo(() => {
    const total = props.items.client.length;
    const done = props.items.client.filter((i) => states[i.key]?.status === 'done').length;
    return { done, total };
  }, [props.items.client, states]);
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;

  function onSaved(state: ItemState) {
    const next = { ...states, [state.itemKey]: state };
    setStates(next);
    // Advance to the next pending card so the client keeps moving.
    const nextPending = props.items.client.find((i) => next[i.key]?.status !== 'done' && i.key !== state.itemKey);
    setOpenKey(state.status === 'done' ? (nextPending?.key ?? null) : state.itemKey);
  }

  const sortedClient = useMemo(() => {
    const pending = props.items.client.filter((i) => states[i.key]?.status !== 'done');
    const finished = props.items.client.filter((i) => states[i.key]?.status === 'done');
    return [...pending, ...finished];
  }, [props.items.client, states]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto"
    >
      {/* Header + progress */}
      <div className="rounded-[28px] border border-neutral-200 bg-white p-7 sm:p-9 shadow-xs">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ {props.tierLabel} setup ]</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-display leading-tight">
          {complete
            ? 'You are all set.'
            : props.businessName
              ? `Let’s get ${props.businessName} launched.`
              : 'Let’s get you launched.'}
        </h1>
        <p className="mt-3 text-base text-neutral-600 leading-relaxed">
          {complete
            ? 'Everything we need from you is in. We will text you as each piece goes live, and you can come back here any time to change an answer.'
            : 'A few quick things from you. Each takes a minute or two, and you can stop and come back on any device.'}
        </p>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm font-semibold text-neutral-700 mb-2">
            <span>
              {done} of {total} done
            </span>
            <span className="font-mono text-neutral-500">{percent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="h-full rounded-full bg-blue-600"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
        {!props.editable && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-1.5 text-sm font-medium text-neutral-700">
            <Lock size={14} /> This setup is finished and read-only. Need a change? Call {props.phone}.
          </p>
        )}
      </div>

      {/* Client items */}
      <section className="mt-8">
        <h2 className="px-1 text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase mb-3">Your part</h2>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {sortedClient.map((item) => (
              <motion.div key={item.key} layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                {item.kind === 'confirm' ? (
                  <ConfirmCard
                    item={item}
                    token={props.token}
                    state={states[item.key]}
                    prefill={props.prefill[item.key] ?? {}}
                    open={openKey === item.key}
                    onToggle={() => setOpenKey(openKey === item.key ? null : item.key)}
                    onSaved={onSaved}
                    editable={props.editable}
                  />
                ) : (
                  <AcceptCard
                    item={item}
                    token={props.token}
                    state={states[item.key]}
                    open={openKey === item.key}
                    onToggle={() => setOpenKey(openKey === item.key ? null : item.key)}
                    onSaved={onSaved}
                    editable={props.editable}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Axeon items */}
      <section className="mt-10">
        <h2 className="px-1 text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase mb-3">Axeon handles this</h2>
        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/70 divide-y divide-neutral-200">
          {props.items.axeon.map((item) => {
            const isDone = states[item.key]?.status === 'done';
            return (
              <div key={item.key} className="flex items-start gap-3 px-5 py-4">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isDone ? 'bg-green-100 text-green-700' : 'bg-white border border-neutral-200 text-neutral-400'
                  }`}
                >
                  {isDone ? <Check size={14} className="stroke-[3]" /> : <Clock size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-base font-semibold text-neutral-800">{item.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-neutral-200/70 text-neutral-600'}`}>
                      {isDone ? 'Set up' : 'In progress'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-neutral-500 leading-relaxed">
        Stuck on anything? Text or call{' '}
        <a href={props.phoneHref} className="font-semibold text-blue-600 hover:text-blue-700 font-mono">
          {props.phone}
        </a>
        . We never ask for passwords here or by email.
      </p>
    </motion.div>
  );
}

// ───────────────────────────── Cards ─────────────────────────────

function CardShell({
  item,
  status,
  open,
  onToggle,
  summary,
  children,
}: {
  item: OnboardingItem;
  status: Status;
  open: boolean;
  onToggle: () => void;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const isDone = status === 'done';
  return (
    <div className={`rounded-[24px] border bg-white shadow-xs transition-colors ${isDone ? 'border-green-200' : open ? 'border-blue-300' : 'border-neutral-200'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full text-left flex items-start gap-3.5 px-5 py-4 sm:px-6 sm:py-5 cursor-pointer">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isDone ? 'bg-green-600 text-white' : 'border-2 border-neutral-300 text-transparent'
          }`}
        >
          <Check size={15} className="stroke-[3]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`text-base sm:text-lg font-bold tracking-tight ${isDone ? 'text-neutral-700' : 'text-neutral-950'}`}>{item.title}</span>
            {!isDone && item.minutes ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{item.minutes} min</span>
            ) : null}
          </span>
          {!open && isDone && summary ? <span className="mt-1 block text-sm text-neutral-600 leading-relaxed">{summary}</span> : null}
          {!open && !isDone ? <span className="mt-1 block text-sm text-neutral-600 leading-relaxed">{item.description}</span> : null}
        </span>
        <ChevronDown size={18} className={`mt-1.5 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmCard({
  item,
  token,
  state,
  prefill,
  open,
  onToggle,
  onSaved,
  editable,
}: {
  item: OnboardingItem;
  token: string;
  state: ItemState | undefined;
  prefill: Record<string, string>;
  open: boolean;
  onToggle: () => void;
  onSaved: (s: ItemState) => void;
  editable: boolean;
}) {
  const fields = item.fields ?? [];
  const initial = useMemo(() => {
    const out: Record<string, string | string[]> = {};
    for (const f of fields) {
      const saved = state?.data?.[f.key];
      if (f.type === 'multi') out[f.key] = Array.isArray(saved) ? saved.map(String) : [];
      else out[f.key] = typeof saved === 'string' && saved ? saved : (prefill[f.key] ?? '');
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.key]);
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status: Status = state?.status === 'done' ? 'done' : 'pending';

  const summary = fields
    .map((f) => {
      const v = display(f, state?.data?.[f.key]);
      return v ? `${f.label}: ${v}` : null;
    })
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editable) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await patchItem(token, { itemKey: item.key, data: values, done: true });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CardShell item={item} status={status} open={open} onToggle={onToggle} summary={summary}>
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{item.description}</p>
      <form onSubmit={submit} className="space-y-4">
        {fields.map((f) => (
          <Field key={f.key} field={f} value={values[f.key]} disabled={!editable || busy} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!editable || busy}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : status === 'done' ? <Pencil size={15} /> : <CheckCircle2 size={16} />}
            {status === 'done' ? 'Save changes' : 'Looks right, save it'}
          </button>
          {status === 'done' && <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1.5"><Check size={14} /> Saved</span>}
        </div>
      </form>
    </CardShell>
  );
}

function AcceptCard({
  item,
  token,
  state,
  open,
  onToggle,
  onSaved,
  editable,
}: {
  item: OnboardingItem;
  token: string;
  state: ItemState | undefined;
  open: boolean;
  onToggle: () => void;
  onSaved: (s: ItemState) => void;
  editable: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status: Status = state?.status === 'done' ? 'done' : 'pending';

  async function mark(done: boolean) {
    if (!editable) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await patchItem(token, { itemKey: item.key, done }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CardShell item={item} status={status} open={open} onToggle={onToggle} summary={status === 'done' ? 'Done. Thank you.' : undefined}>
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{item.description}</p>
      {item.steps && (
        <ol className="space-y-2.5 mb-5">
          {item.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-neutral-800 leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700 font-mono">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {status === 'done' ? (
          <>
            <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1.5"><Check size={14} /> Marked done</span>
            <button type="button" disabled={!editable || busy} onClick={() => mark(false)} className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 disabled:opacity-50">
              Undo
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={!editable || busy}
            onClick={() => mark(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
            {item.doneLabel ?? 'Done'}
          </button>
        )}
      </div>
    </CardShell>
  );
}

function Field({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ItemField;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (v: string | string[]) => void;
}) {
  const id = `f-${field.key}`;
  const label = (
    <label htmlFor={id} className="block text-sm font-semibold text-neutral-800">
      {field.label}
      {field.required ? <span className="text-blue-600"> *</span> : null}
    </label>
  );
  const hint = field.hint ? <p className="mt-1 text-xs text-neutral-500">{field.hint}</p> : null;

  if (field.type === 'multi') {
    const picked = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="block text-sm font-semibold text-neutral-800">
          {field.label}
          {field.required ? <span className="text-blue-600"> *</span> : null}
        </legend>
        {hint}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(field.options ?? []).map((opt) => {
            const checked = picked.includes(opt);
            return (
              <label key={opt} className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm font-medium cursor-pointer transition-colors ${checked ? 'border-blue-600 bg-blue-50/60 text-neutral-950' : 'border-neutral-200 text-neutral-800 hover:border-neutral-300'}`}>
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => onChange(e.target.checked ? [...picked, opt] : picked.filter((p) => p !== opt))}
                />
                {opt}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  const str = typeof value === 'string' ? value : '';
  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select id={id} value={str} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1.5`}>
          <option value="">Choose one…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {hint}
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea id={id} rows={3} value={str} disabled={disabled} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1.5 resize-y min-h-[88px]`} />
        {hint}
      </div>
    );
  }
  const inputType = field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';
  return (
    <div>
      {label}
      <input
        id={id}
        type={inputType}
        inputMode={field.type === 'tel' ? 'tel' : undefined}
        autoComplete={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'off'}
        value={str}
        disabled={disabled}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} mt-1.5`}
      />
      {hint}
    </div>
  );
}
