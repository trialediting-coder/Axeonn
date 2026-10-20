'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Send } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';

/** Mirrors lib/billing.ts GO_LIVE_NUDGE_DAYS (kept local: this is a client component). */
const GO_LIVE_NUDGE_DAYS = 35;

export interface AgreementRow {
  token: string;
  number: string;
  status: 'sent' | 'signed' | 'paid' | 'void';
  clientEmail: string;
  legalName: string;
  tier: 'website' | 'essentials' | 'axeoncore' | 'axeongrowth';
  setupCents: number;
  monthlyCents: number;
  noMinimum?: boolean;
  minimumMonths?: number;
  billing?: 'monthly' | 'annual';
  version?: string;
  signedName: string | null;
  signedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  url: string;
}

interface Options {
  tiers: Array<{ value: AgreementRow['tier']; label: string; setup: number; monthly: number; minimumMonths: number; setupCredit: number }>;
  entityTypes: readonly string[];
  axeonEntities: readonly string[];
  addOns: readonly string[];
}

const STATUS: Record<AgreementRow['status'], { label: string; cls: string }> = {
  sent: { label: 'Waiting to sign', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  signed: { label: 'Signed, not paid', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  paid: { label: 'Paid · onboarding', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  void: { label: 'Void', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
};

const dollars = (c: number) => `$${(c / 100).toLocaleString('en-US')}`;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * The three ways the practice offer is sold (the sales playbook's Options A-C).
 * Picking one fills the term and fees; any field can still be changed by hand.
 */
type Deal = 'term' | 'monthToMonth' | 'annual';
const DEALS: Array<{ value: Deal; label: string }> = [
  { value: 'term', label: 'A · 12 months, $0 to start (recommended)' },
  { value: 'monthToMonth', label: 'B · Month-to-month, implementation paid upfront' },
  { value: 'annual', label: 'C · 12 months prepaid (pay 10)' },
];

export function AgreementsConsole({ initialRows, options, dbError }: { initialRows: AgreementRow[]; options: Options; dbError: string | null }) {
  const [rows, setRows] = useState(initialRows);
  const [tier, setTier] = useState<AgreementRow['tier']>('axeoncore');
  const plan = options.tiers.find((t) => t.value === tier)!;
  const [form, setForm] = useState({
    clientEmail: '',
    contactName: '',
    legalName: '',
    entityType: 'LLC',
    entityState: 'Iowa',
    signerName: '',
    signerTitle: 'Owner',
    address: '',
    setup: '',
    monthly: '',
    addOns: '',
    specialty: '',
    hourlyRate: '',
    axeonEntity: options.axeonEntities[0],
    effectiveDate: today(),
  });
  const [minimumMonths, setMinimumMonths] = useState(String(plan.minimumMonths));
  const [deal, setDeal] = useState<Deal>('term');
  const practice = tier === 'axeoncore' || tier === 'axeongrowth';

  /** Fill the term and implementation fee for a plan + deal. */
  function applyDeal(nextTier: AgreementRow['tier'], nextDeal: Deal) {
    const p = options.tiers.find((t) => t.value === nextTier)!;
    const isPractice = nextTier === 'axeoncore' || nextTier === 'axeongrowth';
    if (!isPractice) {
      setMinimumMonths(String(p.minimumMonths));
      setForm((f) => ({ ...f, setup: '' }));
      return;
    }
    setMinimumMonths(nextDeal === 'monthToMonth' ? '0' : '12');
    setForm((f) => ({ ...f, setup: nextDeal === 'monthToMonth' ? String(p.setupCredit / 100) : '' }));
  }
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(dbError ? { ok: false, text: dbError } : null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function refresh() {
    const res = await fetch('/api/admin/agreements');
    if (res.ok) setRows(((await res.json()) as { agreements: AgreementRow[] }).agreements);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await fetch('/api/admin/agreements', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, tier, minimumMonths, billing: practice && deal === 'annual' ? 'annual' : 'monthly' }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean; emailError?: string; agreement?: AgreementRow };
    setBusy(false);
    if (!res.ok || !data.agreement) {
      setNotice({ ok: false, text: data.error ?? 'Could not create the agreement.' });
      return;
    }
    setNotice({
      ok: !data.emailError,
      text: data.emailed
        ? `Agreement ${data.agreement.number} created and emailed to ${data.agreement.clientEmail}.`
        : `Agreement ${data.agreement.number} created, but the email failed (${data.emailError}). Copy the link below and send it yourself.`,
    });
    setForm((f) => ({ ...f, clientEmail: '', contactName: '', legalName: '', signerName: '', address: '', monthly: '', addOns: '', specialty: '' }));
    await refresh();
  }

  async function act(token: string, action: 'void' | 'resend' | 'startBilling') {
    const res = await fetch('/api/admin/agreements', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    const done = { void: 'Agreement voided.', resend: 'Email sent again.', startBilling: data.message ?? 'Billing started.' }[action];
    setNotice(res.ok ? { ok: true, text: done } : { ok: false, text: data.error ?? 'Failed' });
    await refresh();
  }

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <input className={adminInput} value={form[k]} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={create} className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-4 h-fit">
        <div>
          <h2 className="text-base font-bold text-neutral-950">New agreement</h2>
          <p className="text-xs text-neutral-500 mt-0.5">The client gets an email to read, sign and pay. Payment starts onboarding by itself.</p>
        </div>
        <label className="block">
          <span className={adminLabel}>Plan</span>
          <select
            className={adminInput}
            value={tier}
            onChange={(e) => {
              const next = e.target.value as AgreementRow['tier'];
              setTier(next);
              applyDeal(next, deal);
            }}
          >
            {options.tiers.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} · {t.setup ? `${dollars(t.setup)} + ` : ''}
                {dollars(t.monthly)}/mo
              </option>
            ))}
          </select>
        </label>
        {practice && (
          <label className="block">
            <span className={adminLabel}>Deal</span>
            <select
              className={adminInput}
              value={deal}
              onChange={(e) => {
                const next = e.target.value as Deal;
                setDeal(next);
                applyDeal(tier, next);
              }}
            >
              {DEALS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-neutral-500">
              {deal === 'term' && `$0 today. ${dollars(plan.monthly)}/mo starts at go-live; the ${dollars(plan.setupCredit)} build is credited for the 12 months (Sec. 2.4).`}
              {deal === 'monthToMonth' && `${dollars(plan.setupCredit)} today, then ${dollars(plan.monthly)}/mo from go-live; cancel any month with 30 days' notice.`}
              {deal === 'annual' && `${dollars(plan.monthly * 10)} due today for 12 months, then ${dollars(plan.monthly)}/mo.`}
            </span>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          {field('clientEmail', 'Client email', { type: 'email', required: true })}
          {field('contactName', 'Contact name')}
        </div>
        {field('legalName', 'Client legal business name', { required: true, placeholder: 'Hintz Family Dentistry PC' })}
        {practice &&
          field('specialty', 'Specialty for territory exclusivity (Sec. 6.8)', { placeholder: 'general dentistry · med spa · family law · tax & accounting' })}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={adminLabel}>Entity type</span>
            <select className={adminInput} value={form.entityType} onChange={set('entityType')}>
              {options.entityTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {field('entityState', 'State', { required: true })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('signerName', 'Signer name', { required: true })}
          {field('signerTitle', 'Signer title', { required: true })}
        </div>
        {field('address', 'Business address', { required: true, placeholder: 'Street, City, State ZIP' })}
        <div className="grid grid-cols-2 gap-3">
          {field('setup', 'Implementation fee due ($)', { inputMode: 'decimal', placeholder: String(plan.setup / 100) })}
          {field('monthly', 'Monthly ($)', { inputMode: 'decimal', placeholder: String(plan.monthly / 100) })}
        </div>
        <label className="block">
          <span className={adminLabel}>Minimum term (months)</span>
          <input
            className={adminInput}
            type="number"
            min={0}
            max={24}
            step={1}
            inputMode="numeric"
            value={minimumMonths}
            onChange={(e) => setMinimumMonths(e.target.value)}
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Months they commit to before it goes month-to-month (Sec. 2.1, 10.1). 0 = no minimum: cancel any month with 30 days&apos; notice.
          </span>
        </label>
        <label className="block">
          <span className={adminLabel}>Add-ons (optional)</span>
          <textarea className={adminInput} rows={2} value={form.addOns} onChange={set('addOns')} placeholder="None" />
          <span className="mt-1 flex flex-wrap gap-1">
            {options.addOns.map((a) => (
              <button
                key={a}
                type="button"
                className={btn('ghost', 'sm')}
                onClick={() => setForm((f) => ({ ...f, addOns: f.addOns ? `${f.addOns}; ${a}` : a }))}
              >
                + {a}
              </button>
            ))}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {field('hourlyRate', 'Hourly rate (Sec. 1.2)', { required: true, placeholder: '$___/hour' })}
          {field('effectiveDate', 'Effective date', { type: 'date', required: true })}
        </div>
        <label className="block">
          <span className={adminLabel}>Axeon Studio is</span>
          <select className={adminInput} value={form.axeonEntity} onChange={set('axeonEntity')}>
            {options.axeonEntities.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className={`${btn('primary')} w-full`}>
          <Send size={14} /> {busy ? 'Creating…' : 'Create and email to client'}
        </button>
        {notice && <p className={`text-sm ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden h-fit">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-bold text-neutral-950">All agreements</h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-neutral-500 text-center">No agreements yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {rows.map((r) => (
              <li key={r.token} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-950 truncate">
                    {r.legalName} <span className="font-normal text-neutral-500">· {r.number}</span>
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {r.clientEmail} · {dollars(r.setupCents)} + {dollars(r.monthlyCents)}/mo
                    {(() => {
                      const m = typeof r.minimumMonths === 'number' ? r.minimumMonths : r.noMinimum ? 0 : 3;
                      if (r.billing === 'annual') return ' · 12 months prepaid';
                      return m === 0 ? ' · month-to-month' : ` · ${m}-month term`;
                    })()}
                    {r.signedAt ? ` · signed by ${r.signedName} ${new Date(r.signedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                <div className="flex gap-1">
                  <button type="button" className={btn('ghost', 'sm')} title="Copy link" onClick={() => navigator.clipboard.writeText(r.url)}>
                    <Copy size={14} />
                  </button>
                  <a className={btn('ghost', 'sm')} href={r.url} target="_blank" rel="noreferrer" title="Open">
                    <ExternalLink size={14} />
                  </a>
                  {r.status !== 'void' && r.status !== 'paid' && (
                    <button type="button" className={btn('secondary', 'sm')} onClick={() => act(r.token, 'resend')}>
                      Resend
                    </button>
                  )}
                  {r.status === 'paid' && r.billing !== 'annual' && r.version && r.version !== '2026-10-06' && (
                    <>
                      {r.paidAt && (() => {
                        const day = Math.floor((Date.now() - new Date(r.paidAt).getTime()) / 86_400_000);
                        return (
                          <span
                            className={`self-center text-xs font-semibold ${day >= GO_LIVE_NUDGE_DAYS ? 'text-amber-700' : 'text-neutral-500'}`}
                            title="Days since checkout. Start billing on go-live day, or on day 45 if the client is holding go-live up (Sec. 4.1)."
                          >
                            Day {day}
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        className={btn('secondary', 'sm')}
                        title="Go-live day: charge the first month now (Sec. 4.1). If go-live is held up by the client, press it on day 45."
                        onClick={() => act(r.token, 'startBilling')}
                      >
                        Live: start billing
                      </button>
                    </>
                  )}
                  {r.status === 'sent' && (
                    <button type="button" className={btn('danger', 'sm')} onClick={() => act(r.token, 'void')}>
                      Void
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
