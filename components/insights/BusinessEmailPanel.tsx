'use client';

// components/insights/BusinessEmailPanel.tsx
// One client's business email from the admin side (lib/businessEmail.ts): what
// they asked for on the setup page, the domain and mailbox list, the DNS checks
// with the exact fix for anything missing, "send the live email", and their
// open requests. Calls /api/admin/onboarding/<token>/email.
import { useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';
import {
  DNS_CHECKS,
  EXTRA_MAILBOX_PRICE,
  REQUEST_KINDS,
  mailboxAllowance,
  mailboxCount,
  activeMailboxes,
  normalizeDomain,
  openRequests,
  type BusinessEmailSetup,
  type CheckStatus,
  type Mailbox,
} from '@/lib/businessEmailShared';

const STATUS_CLS: Record<CheckStatus, string> = {
  pass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  fail: 'bg-red-50 text-red-700 ring-red-200',
};

const STEPS = [
  'In Google Admin (admin.google.com), add the domain and verify it with the TXT record Google gives you.',
  'Create each user. Tick "Ask for a password change at next sign-in" and choose "Send sign-in instructions" to the personal email below. Never copy the password anywhere.',
  'Add MX, SPF and DMARC records at the registrar, generate DKIM in Google Admin (Apps, Gmail, Authenticate email), publish it, then press Start authentication.',
  'Mark the mailboxes Active here, press Check DNS, then Send "email is live".',
];

export function BusinessEmailPanel({
  token,
  tier,
  initial,
  asked,
}: {
  token: string;
  tier: OnboardingTier;
  initial: BusinessEmailSetup;
  /** What the client typed on the setup page's domain card. */
  asked: { domainName: string; mailboxes: string; signInEmails: string; currentEmail: string };
}) {
  const [setup, setSetup] = useState(initial);
  const [domain, setDomain] = useState(initial.domain ?? normalizeDomain(asked.domainName) ?? '');
  const [rows, setRows] = useState<Mailbox[]>(initial.mailboxes);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = (setup.domain ?? '') !== domain.trim() || JSON.stringify(setup.mailboxes) !== JSON.stringify(rows);

  async function call(method: 'PUT' | 'POST', body: unknown, label: string, success: string) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/email`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { setup?: BusinessEmailSetup; error?: string };
      if (!res.ok || !data.setup) throw new Error(data.error ?? `Request failed (${res.status})`);
      setSetup(data.setup);
      setDomain(data.setup.domain ?? '');
      setRows(data.setup.mailboxes);
      setNotice(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  const update = (i: number, patch: Partial<Mailbox>) => setRows((r) => r.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const live = activeMailboxes(setup);
  const open = openRequests(setup);
  const allowance = mailboxAllowance(tier, { mailboxes: rows.filter((m) => m.address.trim()) });

  return (
    <section className="mt-6 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-neutral-950">Business email</h3>
          <p className="mt-1 text-sm text-neutral-600">Google Workspace. Google delivers every sign-in; the client sees all of this in their Email tab.</p>
        </div>
        {setup.liveSentAt ? <span className="text-xs text-neutral-500">Live email sent {new Date(setup.liveSentAt).toLocaleDateString()}</span> : null}
      </div>

      {open.length > 0 ? (
        <div className="mt-4 space-y-2">
          {open.map((q) => (
            <div key={q.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
              <div className="min-w-0">
                <b>{REQUEST_KINDS.find((k) => k.kind === q.kind)?.label}</b> · {new Date(q.at).toLocaleDateString()}
                <p className="mt-0.5 break-words">{q.detail}</p>
              </div>
              <button type="button" disabled={busy !== null} onClick={() => void call('POST', { action: 'resolve', id: q.id }, `resolve-${q.id}`, 'Request marked done.')} className={btn('success', 'sm')}>
                {busy === `resolve-${q.id}` ? 'Saving…' : 'Done'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm">
        <p className={adminLabel}>What they asked for</p>
        {asked.mailboxes || asked.signInEmails ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-500">Addresses</dt>
              <dd className="whitespace-pre-wrap text-neutral-900">{asked.mailboxes || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Send Google sign-ins to</dt>
              <dd className="whitespace-pre-wrap text-neutral-900">{asked.signInEmails || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Email at this domain today</dt>
              <dd className="text-neutral-900">{asked.currentEmail || '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-neutral-500">Nothing yet. It comes from the &ldquo;website address and business email&rdquo; card on their setup page.</p>
        )}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-neutral-800">Setup steps</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-neutral-700">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </details>

      <div className="mt-5">
        <label className={adminLabel} htmlFor="be-domain">Domain</label>
        <input id="be-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="a1detail.com" className={`${adminInput} max-w-sm`} />
      </div>

      <div className="mt-4">
        <p className={adminLabel}>
          Mailboxes · {allowance.used} of {mailboxCount(allowance.included)} included on {TIER_LABELS[tier]}
        </p>
        {allowance.extra > 0 ? (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            {allowance.extra} over the plan: bill ${allowance.extraMonthly}/mo (${EXTRA_MAILBOX_PRICE} each) once the client has said yes. An alias (info@ into an existing mailbox) is free if that is all they need.
          </p>
        ) : null}
        <div className="space-y-2">
          {rows.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input value={m.address} onChange={(e) => update(i, { address: e.target.value })} placeholder={domain ? `mike@${domain}` : 'mike@a1detail.com'} className={`${adminInput} sm:w-64`} aria-label="Address" />
              <input value={m.person} onChange={(e) => update(i, { person: e.target.value })} placeholder="Mike (owner)" className={`${adminInput} sm:w-48`} aria-label="Who uses it" />
              <select value={m.status} onChange={(e) => update(i, { status: e.target.value === 'active' ? 'active' : 'pending' })} className={`${adminInput.replace('w-full ', '')} w-auto`} aria-label="Status">
                <option value="pending">Setting up</option>
                <option value="active">Active (created in Google)</option>
              </select>
              <button type="button" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} className={btn('ghost', 'sm')}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((r) => [...r, { address: '', person: '', status: 'pending' }])} className={`${btn('secondary', 'sm')} mt-2`}>
          Add mailbox
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy !== null || !dirty} onClick={() => void call('PUT', { domain, mailboxes: rows }, 'save', 'Saved. The client sees it in their Email tab.')} className={btn('primary', 'sm')}>
          {busy === 'save' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" disabled={busy !== null || dirty || !setup.domain} onClick={() => void call('POST', { action: 'check' }, 'check', 'DNS checked.')} className={btn('secondary', 'sm')}>
          {busy === 'check' ? 'Checking…' : 'Check DNS'}
        </button>
        <button
          type="button"
          disabled={busy !== null || dirty || live.length === 0}
          title={live.length === 0 ? 'Mark at least one mailbox Active first' : undefined}
          onClick={() => {
            if (confirm(`Email the client that ${live.map((m) => m.address).join(', ')} ${live.length === 1 ? 'is' : 'are'} live?`)) {
              void call('POST', { action: 'live' }, 'live', '"Your email is live" sent.');
            }
          }}
          className={btn('secondary', 'sm')}
        >
          {busy === 'live' ? 'Sending…' : setup.liveSentAt ? 'Resend "email is live"' : 'Send "email is live"'}
        </button>
        {dirty ? <span className="text-xs text-amber-700">Unsaved changes</span> : null}
      </div>
      {notice ? <p className="mt-2 text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {setup.dns ? (
        <div className="mt-5">
          <p className={adminLabel}>
            DNS for {setup.dns.domain} · checked {new Date(setup.dns.checkedAt).toLocaleString()}
          </p>
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {DNS_CHECKS.map((c) => {
              const r = setup.dns!.checks[c.key];
              return (
                <li key={c.key} className="flex flex-wrap items-start gap-3 px-4 py-2.5 text-sm">
                  <span className={`mt-0.5 w-12 shrink-0 rounded-md py-0.5 text-center text-[11px] font-bold uppercase ring-1 ${STATUS_CLS[r?.status ?? 'fail']}`}>{r?.status ?? 'fail'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{c.label}</p>
                    <p className="break-words text-xs text-neutral-600">{r?.note}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
