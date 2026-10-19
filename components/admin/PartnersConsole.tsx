'use client';

import { useState } from 'react';
import { Copy, Download, Mail, Plus } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import {
  PARTNER_BRIEF_PATH,
  PARTNER_DEAL_LABELS,
  PARTNER_DEALS,
  PARTNER_KIND_LABELS,
  PARTNER_KINDS,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUSES,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUSES,
  monthlyShareCents,
  type Partner,
  type PartnerReferral,
} from '@/lib/partnersShared';

const dollars = (c: number) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const EMPTY = { name: '', firm: '', kind: 'cpa', email: '', phone: '', status: 'prospect', deal: 'share', notes: '' };

/** The email that goes out with the brief. Plain, short, from Hayder. */
function briefMailto(p: Pick<Partner, 'name' | 'email'>, briefUrl: string) {
  const first = p.name.split(' ')[0] || 'there';
  const body = [
    `Hi ${first},`,
    '',
    'Here is the partner brief I mentioned. It covers what we install for practices, the free after-hours audit you can offer your clients, and how the advisory share works.',
    '',
    briefUrl,
    '',
    'If two or three of your clients come to mind, send me their names and I will run the audits this week at no cost to anyone.',
    '',
    'Hayder Hatem',
    'Axeon Studio · (515) 493-8017',
  ].join('\n');
  return `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent('Axeon partner brief')}&body=${encodeURIComponent(body)}`;
}

type Post = (payload: Record<string, unknown>, done?: string) => Promise<boolean>;

export function PartnersConsole({ initialPartners, dbError, briefUrl }: { initialPartners: Partner[]; dbError: string | null; briefUrl: string }) {
  const [partners, setPartners] = useState(initialPartners);
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(dbError ? { ok: false, text: dbError } : null);
  const [busy, setBusy] = useState(false);

  const post: Post = async (payload, done) => {
    setBusy(true);
    const res = await fetch('/api/admin/partners', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = (await res.json().catch(() => ({}))) as { partners?: Partner[]; error?: string };
    setBusy(false);
    if (!res.ok || !data.partners) {
      setNotice({ ok: false, text: data.error ?? 'Could not save.' });
      return false;
    }
    setPartners(data.partners);
    setNotice(done ? { ok: true, text: done } : null);
    return true;
  };

  const signed = partners.filter((p) => p.status === 'signed' || p.status === 'active').length;
  const clients = partners.flatMap((p) => p.referrals).filter((r) => r.status === 'signed').length;
  const owed = partners.reduce((sum, p) => sum + monthlyShareCents(p), 0);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-neutral-950">Partner brief</h2>
          <p className="text-xs text-neutral-500 mt-0.5">The 6-page PDF for CPAs, practice consultants and billing firms. Send the link or attach the file.</p>
        </div>
        <a className={btn('secondary', 'sm')} href={PARTNER_BRIEF_PATH} target="_blank" rel="noreferrer">
          <Download size={14} /> Open PDF
        </a>
        <button
          type="button"
          className={btn('ghost', 'sm')}
          onClick={() => navigator.clipboard.writeText(briefUrl).then(() => setNotice({ ok: true, text: 'Link copied.' }))}
        >
          <Copy size={14} /> Copy link
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          ['Signed partners', String(signed)],
          ['Referred clients', String(clients)],
          ['Advisory share / month', dollars(owed)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-neutral-950">{value}</p>
          </div>
        ))}
      </section>

      {notice && <p className={`text-sm ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <form
          className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 h-fit"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await post({ action: 'createPartner', ...form }, 'Partner added.')) setForm(EMPTY);
          }}
        >
          <h2 className="text-base font-bold text-neutral-950">Add a partner</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={adminLabel}>Name</span>
              <input className={adminInput} value={form.name} onChange={set('name')} placeholder="Jordan Ames" />
            </label>
            <label className="block">
              <span className={adminLabel}>Firm</span>
              <input className={adminInput} value={form.firm} onChange={set('firm')} placeholder="Ames Dental CPA" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={adminLabel}>Type</span>
              <select className={adminInput} value={form.kind} onChange={set('kind')}>
                {PARTNER_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {PARTNER_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={adminLabel}>Deal</span>
              <select className={adminInput} value={form.deal} onChange={set('deal')}>
                {PARTNER_DEALS.map((d) => (
                  <option key={d} value={d}>
                    {PARTNER_DEAL_LABELS[d]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={adminLabel}>Email</span>
              <input className={adminInput} type="email" value={form.email} onChange={set('email')} />
            </label>
            <label className="block">
              <span className={adminLabel}>Phone</span>
              <input className={adminInput} value={form.phone} onChange={set('phone')} />
            </label>
          </div>
          <label className="block">
            <span className={adminLabel}>Notes</span>
            <textarea className={adminInput} rows={2} value={form.notes} onChange={set('notes')} placeholder="Who introduced us, which practices they advise" />
          </label>
          <button type="submit" disabled={busy} className={`${btn('primary')} w-full`}>
            <Plus size={14} /> Add partner
          </button>
        </form>

        <div className="space-y-4">
          {partners.length === 0 ? (
            <p className="rounded-xl border border-neutral-200 bg-white px-5 py-10 text-sm text-neutral-500 text-center shadow-sm">
              No partners yet. Start with the CPAs and practice consultants who already advise dental, med spa, law and accounting practices.
            </p>
          ) : (
            partners.map((p) => <PartnerCard key={p.id} partner={p} busy={busy} post={post} briefUrl={briefUrl} />)
          )}
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner: p, busy, post, briefUrl }: { partner: Partner; busy: boolean; post: Post; briefUrl: string }) {
  const [referral, setReferral] = useState({ practice: '', monthly: '' });
  const save = (patch: Partial<Partner>) => post({ action: 'updatePartner', ...p, ...patch, id: p.id });
  const share = monthlyShareCents(p);

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-950">
            {p.firm || p.name} {p.firm && p.name && <span className="font-normal text-neutral-500">· {p.name}</span>}
          </p>
          <p className="text-xs text-neutral-500">
            {PARTNER_KIND_LABELS[p.kind]} · {PARTNER_DEAL_LABELS[p.deal]}
            {p.email && ` · ${p.email}`}
            {p.phone && ` · ${p.phone}`}
            {share > 0 && ` · owed ${dollars(share)}/mo`}
          </p>
          {p.notes && <p className="mt-1 text-sm text-neutral-600 whitespace-pre-line">{p.notes}</p>}
        </div>
        <select
          aria-label="Partner status"
          className={`${adminInput} w-auto`}
          value={p.status}
          disabled={busy}
          onChange={(e) => save({ status: e.target.value as Partner['status'] })}
        >
          {PARTNER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PARTNER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {p.email && (
          <a
            className={btn('secondary', 'sm')}
            href={briefMailto(p, briefUrl)}
            onClick={() => {
              if (p.status === 'prospect' || p.status === 'contacted') void save({ status: 'brief_sent' });
            }}
          >
            <Mail size={14} /> Email brief
          </a>
        )}
      </div>

      {p.referrals.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-100">
          {p.referrals.map((r) => (
            <ReferralRow key={r.id} referral={r} busy={busy} post={post} />
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await post({ action: 'addReferral', partnerId: p.id, ...referral }, 'Referral added.')) setReferral({ practice: '', monthly: '' });
        }}
      >
        <input
          className={`${adminInput} flex-1 min-w-[160px]`}
          placeholder="Referred practice"
          value={referral.practice}
          onChange={(e) => setReferral((r) => ({ ...r, practice: e.target.value }))}
        />
        <input
          className={`${adminInput} w-28`}
          inputMode="decimal"
          placeholder="$/mo"
          value={referral.monthly}
          onChange={(e) => setReferral((r) => ({ ...r, monthly: e.target.value }))}
        />
        <button type="submit" disabled={busy || !referral.practice.trim()} className={btn('ghost', 'sm')}>
          <Plus size={14} /> Referral
        </button>
      </form>
    </article>
  );
}

function ReferralRow({ referral: r, busy, post }: { referral: PartnerReferral; busy: boolean; post: Post }) {
  return (
    <li className="py-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="min-w-0 flex-1 truncate text-neutral-900">{r.practice}</span>
      <span className="text-xs text-neutral-500">{r.monthlyCents ? `${dollars(r.monthlyCents)}/mo` : 'no plan yet'}</span>
      <select
        aria-label={`Status for ${r.practice}`}
        className={`${adminInput} w-auto py-1`}
        value={r.status}
        disabled={busy}
        onChange={(e) =>
          post({ action: 'updateReferral', id: r.id, practice: r.practice, status: e.target.value, monthly: r.monthlyCents / 100, notes: r.notes })
        }
      >
        {REFERRAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {REFERRAL_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </li>
  );
}
