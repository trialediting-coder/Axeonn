'use client';

// components/insights/OnboardingDetail.tsx
// One client's onboarding from the admin side: every item with its answers,
// mark-done / reopen on each row, resend welcome, nudge, close. Each action
// calls /api/admin/onboarding/<token> and swaps in the fresh server state.

import { useState } from 'react';
import { btn } from '@/components/admin/ui';
import { TIER_LABELS, type ItemField, type OnboardingItem } from '@/data/onboardingItems';
import type { ItemState, Onboarding, Progress } from '@/lib/onboarding';

interface Detail {
  onboarding: Onboarding & { url: string };
  states: Record<string, ItemState>;
  progress: Progress;
}

export function OnboardingDetail({ initial, items }: { initial: Detail; items: { client: OnboardingItem[]; axeon: OnboardingItem[] } }) {
  const [detail, setDetail] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { onboarding, states, progress } = detail;

  async function call(method: 'PATCH' | 'POST', body: unknown, label: string, success?: string) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${onboarding.token}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Detail> & { error?: string };
      if (!res.ok || !data.onboarding || !data.states || !data.progress) throw new Error(data.error ?? `Request failed (${res.status})`);
      setDetail({ onboarding: data.onboarding, states: data.states, progress: data.progress });
      if (success) setNotice(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(onboarding.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy. Select the link and copy it by hand.');
    }
  }

  const openClient = items.client.filter((i) => states[i.key]?.status !== 'done');

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950">{onboarding.businessName ?? onboarding.clientName ?? onboarding.clientEmail}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {onboarding.clientName ? `${onboarding.clientName} · ` : ''}
              {onboarding.clientEmail}
              {onboarding.phone ? ` · ${onboarding.phone}` : ''}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {TIER_LABELS[onboarding.tier]} · created {new Date(onboarding.createdAt).toLocaleDateString()} · status <strong>{onboarding.status}</strong>
              {onboarding.stripeCustomerId ? (
                <>
                  {' '}
                  ·{' '}
                  <a className="text-blue-600 hover:underline" href={`https://dashboard.stripe.com/customers/${onboarding.stripeCustomerId}`} target="_blank" rel="noreferrer">
                    Stripe customer
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-neutral-950">{progress.percent}%</div>
            <div className="text-xs text-neutral-500">
              client {progress.clientDone}/{progress.clientTotal} · Axeon {progress.axeonDone}/{progress.axeonTotal}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <code className="text-xs bg-neutral-100 rounded-lg px-2.5 py-1.5 text-neutral-700 break-all">{onboarding.url}</code>
          <button type="button" onClick={copy} className={btn('secondary', 'sm')}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              if (confirm(`Email the welcome and setup link to ${onboarding.clientEmail}?`)) void call('POST', { action: 'welcome' }, 'welcome', 'Welcome email sent.');
            }}
            className={btn('secondary', 'sm')}
          >
            {busy === 'welcome' ? 'Sending…' : onboarding.welcomeSentAt ? 'Resend welcome' : 'Send welcome'}
          </button>
          <button
            type="button"
            disabled={busy !== null || onboarding.status === 'closed'}
            title="For a client who is already live: a plain “here is your dashboard” email instead of the onboarding welcome"
            onClick={() => {
              if (confirm(`Email ${onboarding.clientEmail} their AxeonPROOF dashboard invite?`)) void call('POST', { action: 'invite' }, 'invite', 'Dashboard invite sent.');
            }}
            className={btn('secondary', 'sm')}
          >
            {busy === 'invite' ? 'Sending…' : 'Send dashboard invite'}
          </button>
          <button
            type="button"
            disabled={busy !== null || openClient.length === 0 || onboarding.status === 'closed'}
            onClick={() => {
              if (confirm(`Email ${onboarding.clientEmail} a reminder of their ${openClient.length} open items?`)) void call('POST', { action: 'nudge' }, 'nudge', 'Nudge sent.');
            }}
            className={btn('primary', 'sm')}
          >
            {busy === 'nudge' ? 'Sending…' : `Nudge (${openClient.length} open)`}
          </button>
          {onboarding.status !== 'closed' ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                if (confirm('Close this onboarding? The client link stops working.')) void call('PATCH', { status: 'closed' }, 'close', 'Closed.');
              }}
              className={`${btn('danger', 'sm')} ml-auto`}
            >
              Close link
            </button>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => call('PATCH', { status: 'active' }, 'reopen', 'Reopened.')}
              className={`${btn('secondary', 'sm')} ml-auto`}
            >
              Reopen
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Welcome sent: {onboarding.welcomeSentAt ? new Date(onboarding.welcomeSentAt).toLocaleString() : 'never'} · last nudge:{' '}
          {onboarding.nudgeSentAt ? new Date(onboarding.nudgeSentAt).toLocaleString() : 'never'} · last client activity:{' '}
          {onboarding.lastClientActivityAt ? new Date(onboarding.lastClientActivityAt).toLocaleString() : 'none yet'}
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}
      </section>

      <ItemList title="Client items" items={items.client} states={states} busy={busy} onToggle={(key, done) => call('PATCH', { itemKey: key, status: done ? 'done' : 'pending' }, key)} />
      <ItemList title="Axeon items" items={items.axeon} states={states} busy={busy} onToggle={(key, done) => call('PATCH', { itemKey: key, status: done ? 'done' : 'pending' }, key)} />
    </div>
  );
}

function ItemList({
  title,
  items,
  states,
  busy,
  onToggle,
}: {
  title: string;
  items: OnboardingItem[];
  states: Record<string, ItemState>;
  busy: string | null;
  onToggle: (key: string, done: boolean) => void;
}) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-200">
        <h3 className="font-bold text-neutral-950 text-sm">{title}</h3>
      </div>
      <ul className="divide-y divide-neutral-100">
        {items.map((item) => {
          const state = states[item.key];
          const done = state?.status === 'done';
          return (
            <li key={item.key} className="px-5 py-4 flex items-start gap-4">
              <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full ${done ? 'bg-green-600' : 'border-2 border-neutral-300'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-neutral-900 text-sm">{item.title}</span>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">{item.kind}</span>
                  {state?.completedAt && (
                    <span className="text-xs text-neutral-500">
                      {done ? 'done' : 'reopened'} {new Date(state.completedAt ?? state.updatedAt).toLocaleDateString()}
                      {state.completedBy ? ` by ${state.completedBy}` : ''}
                    </span>
                  )}
                </div>
                {item.kind === 'confirm' && state?.data && Object.keys(state.data).length > 0 && (
                  <dl className="mt-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {(item.fields ?? []).map((f) => (
                      <Answer key={f.key} field={f} value={state.data[f.key]} />
                    ))}
                  </dl>
                )}
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => onToggle(item.key, !done)}
                className={`${btn(done ? 'secondary' : 'success', 'sm')} shrink-0 min-w-[92px]`}
              >
                {busy === item.key ? '…' : done ? 'Reopen' : 'Mark done'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Answer({ field, value }: { field: ItemField; value: unknown }) {
  const text = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
  if (!text) return null;
  return (
    <>
      <dt className="text-neutral-500">{field.label}</dt>
      <dd className="text-neutral-900 whitespace-pre-wrap break-words">{text}</dd>
    </>
  );
}
