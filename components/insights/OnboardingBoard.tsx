'use client';

// components/insights/OnboardingBoard.tsx
// Admin board for client onboarding: every portal, its completion, what is
// outstanding, and a form to mint one by hand. Row actions live on the detail
// page (OnboardingDetail.tsx); this list is for scanning.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ONBOARDING_TIERS, TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';
import type { Onboarding, Progress } from '@/lib/onboarding';
import { adminInput, btn } from '@/components/admin/ui';

export type BoardRow = Onboarding & { progress: Progress; url: string };

const inputClass = adminInput;

function relative(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${Math.max(m, 0)}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function StatusBadge({ row }: { row: BoardRow }) {
  const styles: Record<Onboarding['status'], string> = {
    active: 'bg-blue-100 text-blue-700',
    complete: 'bg-green-100 text-green-700',
    closed: 'bg-neutral-200 text-neutral-600',
  };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[row.status]}`}>{row.status}</span>;
}

export function OnboardingBoard({
  initialRows,
  selfToken = null,
  databaseConfigured,
  dbError,
}: {
  initialRows: BoardRow[];
  /** Token of Axeon's own record (lib/selfTracking.ts), for the shortcut at the top. */
  selfToken?: string | null;
  databaseConfigured: boolean;
  dbError: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState({ clientEmail: '', clientName: '', businessName: '', phone: '', tier: 'essentials' as OnboardingTier });
  const [quiet, setQuiet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function mint(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quiet }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string; created?: boolean; welcomeSent?: boolean };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      const mail = data.welcomeSent
        ? ' (welcome email sent)'
        : quiet
          ? ' (nothing sent to the client; use "Send welcome" or "Send dashboard invite" on their page when ready)'
          : ' (welcome email NOT sent, check Resend)';
      setResult(`${data.created ? 'Created' : 'Already existed, reused'}: ${data.url}${mail}`);
      const list = await fetch('/api/admin/onboarding').then((r) => r.json() as Promise<{ onboardings?: BoardRow[] }>);
      if (list.onboardings) setRows(list.onboardings);
      setForm({ clientEmail: '', clientName: '', businessName: '', phone: '', tier: 'essentials' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the onboarding');
    } finally {
      setBusy(false);
    }
  }

  const open = rows.filter((r) => r.status === 'active');
  const stale = open.filter((r) => !r.lastClientActivityAt || Date.now() - new Date(r.lastClientActivityAt).getTime() > 3 * 86_400_000);

  return (
    <div className="space-y-8">
      {selfToken && <SelfSiteCard token={selfToken} />}
      {!databaseConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          No database is attached, so onboardings have nowhere to live. Attach Vercel Postgres and redeploy.
        </div>
      )}
      {dbError && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{dbError}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Active" value={open.length} />
        <Stat label="Waiting on client 3+ days" value={stale.length} tone={stale.length ? 'warn' : 'ok'} />
        <Stat label="Complete" value={rows.filter((r) => r.status === 'complete').length} tone="ok" />
      </div>

      <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-bold text-neutral-950">Clients</h2>
          <span className="text-xs text-neutral-500">{rows.length} total</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500">No onboardings yet. The first paid Checkout creates one automatically, or mint one below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 font-semibold">Client progress</th>
                  <th className="px-3 py-3 font-semibold">Axeon</th>
                  <th className="px-3 py-3 font-semibold">Last activity</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.token} className="hover:bg-neutral-50/70">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-neutral-900">{row.businessName ?? row.clientName ?? row.clientEmail}</div>
                      <div className="text-xs text-neutral-500">{row.clientEmail}</div>
                    </td>
                    <td className="px-3 py-3.5 text-neutral-700">{TIER_LABELS[row.tier]}</td>
                    <td className="px-3 py-3.5 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-neutral-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${row.progress.percent}%` }} />
                        </div>
                        <span className="text-xs font-mono text-neutral-600">
                          {row.progress.clientDone}/{row.progress.clientTotal}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs font-mono text-neutral-600">
                      {row.progress.axeonDone}/{row.progress.axeonTotal}
                    </td>
                    <td className="px-3 py-3.5 text-neutral-600">
                      {relative(row.lastClientActivityAt)}
                      {!row.welcomeSentAt && <span className="ml-2 text-xs font-semibold text-amber-700">welcome not sent</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge row={row} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/onboarding/${row.token}`} className={btn('secondary', 'sm')}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
        <h2 className="font-bold text-neutral-950">Start an onboarding by hand</h2>
        <p className="mt-1 text-sm text-neutral-600">
          For a client who paid outside Stripe Checkout, an AxeonGROWTH client, or a client who was live before the portal existed. Reuses the open
          portal if that email already has one.
        </p>
        <form onSubmit={mint} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Client email *</label>
            <input type="email" required value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className={inputClass} placeholder="mike@a1detailing.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Plan *</label>
            <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as OnboardingTier })} className={inputClass}>
              {ONBOARDING_TIERS.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Contact name</label>
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={inputClass} placeholder="Mike Reyes" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Business name</label>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass} placeholder="A-1 Auto Detailing" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="(515) 555-0134" />
          </div>
          <label className="sm:col-span-2 flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-neutral-300" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} />
            <span>
              <span className="font-semibold">Don&apos;t email the client yet.</span> Creates their record so you can add the tracking snippet, type past
              months and check their dashboard first. No welcome email, no reminders, and the monthly report email stays off until you turn it on.
            </span>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy || !databaseConfigured} className={btn('primary')}>
              {busy ? 'Creating…' : quiet ? 'Create quietly' : 'Create and send welcome'}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {result && <p className="mt-3 text-sm text-green-700 break-all">{result}</p>}
      </section>

      <SampleReport disabled={!databaseConfigured} />
    </div>
  );
}

/** Axeon's own site, tracked like a client's. The record is created automatically (lib/selfTracking.ts). */
function SelfSiteCard({ token }: { token: string }) {
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Our own site</div>
        <h2 className="mt-1 text-lg font-bold text-neutral-950">axeonstudio.co in AxeonPROOF</h2>
        <p className="mt-1 text-sm text-neutral-700">
          The same tracker clients install runs on our site. See our visits, button presses, calls, bookings and the estimate,
          exactly as a client would, and get our own report on the 1st.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/onboarding/${token}/preview`} className={btn('primary')}>
          Open our dashboard
        </Link>
        <Link href={`/admin/onboarding/${token}`} className={btn('secondary')}>
          Settings
        </Link>
      </div>
    </section>
  );
}

/**
 * Emails the made-up sample monthly report through Resend, the same path real
 * reports take, so the inbox copy is exactly what a client would see. Samples
 * forwarded any other way lose the logo, the styles and the colours.
 */
function SampleReport({ disabled }: { disabled: boolean }) {
  const [to, setTo] = useState('');
  const [kind, setKind] = useState<'report' | 'note30' | 'note90'>('report');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch('/api/admin/sample-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, kind }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; to?: string; subject?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setSent(`Sent to ${data.to}: “${data.subject}”. Give it a minute, then check spam if it is not there.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the sample');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-950">Email me a sample</h2>
      <p className="mt-1 text-sm text-neutral-600">
        The monthly report clients get on the 1st, the day-30 survey, or the day-90 note, filled in for a fictional detailing shop. It goes
        out through the same email service as the real ones, so what you see is what they see. Nothing is saved and no client is involved.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['report', 'Monthly report'],
            ['note30', 'Day-30 survey'],
            ['note90', 'Day-90 note'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${kind === k ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex flex-col sm:flex-row gap-3">
        <input type="email" required value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} placeholder="you@axeonstudio.co" />
        <button type="submit" disabled={busy || disabled} className={`${btn('secondary')} whitespace-nowrap`}>
          {busy ? 'Sending…' : 'Send sample'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {sent && <p className="mt-3 text-sm text-green-700">{sent}</p>}
    </section>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'ok' | 'warn' }) {
  const color = tone === 'warn' && value > 0 ? 'text-amber-700' : tone === 'ok' ? 'text-green-700' : 'text-neutral-950';
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
