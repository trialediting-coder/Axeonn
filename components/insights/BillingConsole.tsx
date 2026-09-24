'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { formatCents } from '@/lib/billingMath';
import type { BillingRecord } from '@/lib/billingRecords';

interface CatalogItem {
  key: string;
  label: string;
}

interface PlanItem {
  key: string;
  label: string;
  amountCents: number;
}

export interface PayLinkItem {
  token: string;
  url: string;
  state: 'open' | 'paid' | 'disabled' | 'expired';
  clientEmail: string;
  clientName: string | null;
  kind: 'deposit' | 'balance' | 'full' | 'plan';
  tier: string | null;
  addOns: string[];
  planKey: string | null;
  monthlyAmountCents: number | null;
  planName: string | null;
  note: string | null;
  expiresAt: string;
  createdAt: string;
}

interface Props {
  stripeConfigured: boolean;
  databaseConfigured: boolean;
  dbError: string | null;
  records: BillingRecord[];
  payLinks: PayLinkItem[];
  depositPercent: number;
  automaticTax: boolean;
  portalLoginUrl: string | null;
  catalog: { tiers: CatalogItem[]; addOns: CatalogItem[] };
  plans: PlanItem[];
}

type ApiResult = Record<string, unknown>;
interface ApiState {
  busy: boolean;
  error: string | null;
  result: ApiResult | null;
}

async function postJson(path: string, body: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<ApiResult> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult;
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
  }
  return data;
}

function useApi() {
  const [state, setState] = useState<ApiState>({ busy: false, error: null, result: null });
  async function run(path: string, body: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<ApiResult | null> {
    setState({ busy: true, error: null, result: null });
    try {
      const result = await postJson(path, body, method);
      setState({ busy: false, error: null, result });
      return result;
    } catch (err) {
      setState({ busy: false, error: err instanceof Error ? err.message : 'Request failed', result: null });
      return null;
    }
  }
  return { state, run };
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1';
const buttonClass =
  'px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors';
const ghostButtonClass =
  'px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700';

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-neutral-600">{subtitle}</p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={ghostButtonClass}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function ResultBox({ state, urlKey = 'url' }: { state: ApiState; urlKey?: string }) {
  if (state.error) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.error}</div>
    );
  }
  if (!state.result) return null;
  const url = state.result[urlKey];
  const amount = state.result.amountCents ?? state.result.amountDueCents;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 space-y-2">
      {typeof amount === 'number' && <p className="font-semibold">Amount: {formatCents(amount)}</p>}
      {typeof state.result.number === 'string' && <p>Invoice number: {state.result.number}</p>}
      {typeof url === 'string' ? (
        <div className="flex flex-wrap items-center gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
            {url}
          </a>
          <CopyButton value={url} />
        </div>
      ) : (
        <p>Done. No link was returned.</p>
      )}
    </div>
  );
}

const KIND_LABELS: Record<PayLinkItem['kind'], string> = {
  deposit: 'Deposit',
  balance: 'Final balance',
  full: 'Full amount',
  plan: 'Monthly plan',
};

function PayLinkForm({
  catalog,
  plans,
  depositPercent,
  databaseConfigured,
}: {
  catalog: Props['catalog'];
  plans: PlanItem[];
  depositPercent: number;
  databaseConfigured: boolean;
}) {
  const router = useRouter();
  const { state, run } = useApi();
  const [kind, setKind] = useState<PayLinkItem['kind']>('deposit');
  const [addOns, setAddOns] = useState<string[]>([]);
  const [planChoice, setPlanChoice] = useState<string>('custom');
  const isPlan = kind === 'plan';
  const isCustomPlan = isPlan && planChoice === 'custom';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await run('/api/admin/billing/pay-links', {
      clientEmail: form.get('clientEmail'),
      clientName: form.get('clientName'),
      kind,
      tier: isPlan ? undefined : form.get('tier'),
      addOns: isPlan ? [] : addOns,
      planKey: isPlan ? planChoice : undefined,
      monthlyAmount: isCustomPlan ? form.get('monthlyAmount') : undefined,
      planName: isCustomPlan ? form.get('planName') : undefined,
      note: form.get('note'),
      expiresInDays: form.get('expiresInDays'),
    });
    if (result) router.refresh();
  }

  return (
    <Card
      title="Personalized pay link"
      subtitle={`A short link (axeonstudio.co/pay/XXXXXXXX) that opens with this client's exact scope locked in. Send it by text or email. Deposit is ${depositPercent}% of the build total.`}
    >
      {!databaseConfigured && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Personalized links need the database (POSTGRES_URL). Until it is attached, use the project payment link
          below; it works the same way without the personalized page.
        </p>
      )}
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client email">
          <input name="clientEmail" type="email" required className={inputClass} />
        </Field>
        <Field label="Client name or business">
          <input name="clientName" type="text" className={inputClass} placeholder="Jane Smith, Smith Roofing" />
        </Field>
        <Field label="This link is for">
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as PayLinkItem['kind'])}
            className={inputClass}
          >
            <option value="deposit">Setup: deposit ({depositPercent}%)</option>
            <option value="balance">Setup: final balance</option>
            <option value="full">Setup: full amount</option>
            <option value="plan">Monthly plan only (no build cost)</option>
          </select>
        </Field>
        {isPlan ? (
          <Field label="Monthly plan">
            <select
              name="planKey"
              value={planChoice}
              onChange={(e) => setPlanChoice(e.target.value)}
              className={inputClass}
            >
              <option value="custom">Custom monthly amount</option>
              {plans.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} ({formatCents(p.amountCents)}/mo)
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Build">
            <select name="tier" className={inputClass} defaultValue={catalog.tiers[0]?.key}>
              {catalog.tiers.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        {isCustomPlan && (
          <>
            <Field label="Monthly amount ($)">
              <input
                name="monthlyAmount"
                type="text"
                inputMode="decimal"
                required
                placeholder="150"
                className={inputClass}
              />
            </Field>
            <Field label="Plan name (shown to client)">
              <input
                name="planName"
                type="text"
                maxLength={80}
                placeholder="Website Care & Maintenance"
                className={inputClass}
              />
            </Field>
          </>
        )}
        {!isPlan && (
          <div className="sm:col-span-2">
            <span className={labelClass}>Add-ons</span>
            <div className="flex flex-wrap gap-3">
              {catalog.addOns.map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={addOns.includes(a.key)}
                    onChange={(e) =>
                      setAddOns((prev) => (e.target.checked ? [...prev, a.key] : prev.filter((k) => k !== a.key)))
                    }
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        )}
        <Field label="Note shown to the client (optional)">
          <input name="note" type="text" maxLength={200} className={inputClass} placeholder="Deposit for the new Smith Roofing site" />
        </Field>
        <Field label="Expires in (days)">
          <input name="expiresInDays" type="number" min={1} max={180} defaultValue={30} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={state.busy || !databaseConfigured} className={buttonClass}>
            {state.busy ? 'Creating...' : 'Create personalized link'}
          </button>
        </div>
      </form>
      <ResultBox state={state} />
    </Card>
  );
}

function PayLinksTable({ links, databaseConfigured }: { links: PayLinkItem[]; databaseConfigured: boolean }) {
  const router = useRouter();
  const { state, run } = useApi();

  async function setStatus(token: string, status: 'open' | 'disabled') {
    const result = await run('/api/admin/billing/pay-links', { token, status }, 'PATCH');
    if (result) router.refresh();
  }

  return (
    <Card title="Personalized links" subtitle="Most recent first. A link closes itself once its checkout completes.">
      {state.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.error}</div>
      )}
      {!databaseConfigured && <p className="text-sm text-neutral-600">Links appear here once the database is attached.</p>}
      {databaseConfigured && links.length === 0 && <p className="text-sm text-neutral-600">No links yet.</p>}
      {links.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                <th className="py-2 pr-4">Link</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">For</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Expires</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.token} className="border-b border-neutral-100 align-top">
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-neutral-900">{l.token}</td>
                  <td className="py-2 pr-4">
                    <div className="font-medium text-neutral-900">{l.clientName ?? 'Unknown'}</div>
                    <div className="text-neutral-500">{l.clientEmail}</div>
                  </td>
                  <td className="py-2 pr-4 text-neutral-700">
                    {KIND_LABELS[l.kind]}
                    {l.tier ? ` / ${l.tier}` : ''}
                    {l.planKey ? ` / ${l.planKey}` : ''}
                    {!l.planKey && l.monthlyAmountCents
                      ? ` / ${l.planName ?? 'Custom plan'} ${formatCents(l.monthlyAmountCents)}/mo`
                      : ''}
                    {l.addOns.length > 0 ? ` + ${l.addOns.length} add-on${l.addOns.length > 1 ? 's' : ''}` : ''}
                    {l.note && <div className="text-xs text-neutral-500">{l.note}</div>}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(l.state)}`}>
                      {l.state}
                    </span>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {new Date(l.expiresAt).toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <CopyButton value={l.url} />
                      <a href={l.url} target="_blank" rel="noreferrer" className={ghostButtonClass}>
                        Open
                      </a>
                      {l.state === 'open' && (
                        <button type="button" onClick={() => setStatus(l.token, 'disabled')} className={ghostButtonClass}>
                          Disable
                        </button>
                      )}
                      {l.state === 'disabled' && (
                        <button type="button" onClick={() => setStatus(l.token, 'open')} className={ghostButtonClass}>
                          Re-enable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PaymentLinkForm({ catalog, depositPercent }: { catalog: Props['catalog']; depositPercent: number }) {
  const { state, run } = useApi();
  const [addOns, setAddOns] = useState<string[]>([]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run('/api/admin/billing/checkout', {
      email: form.get('email'),
      name: form.get('name'),
      tier: form.get('tier'),
      kind: form.get('kind'),
      addOns,
    });
  }

  return (
    <Card
      title="Project payment link"
      subtitle={`Stripe-hosted Checkout for a build. Deposit is ${depositPercent}% of the total; balance is the rest.`}
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client email">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Client name">
          <input name="name" type="text" className={inputClass} />
        </Field>
        <Field label="Build">
          <select name="tier" className={inputClass} defaultValue={catalog.tiers[0]?.key}>
            {catalog.tiers.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment">
          <select name="kind" className={inputClass} defaultValue="deposit">
            <option value="deposit">Deposit ({depositPercent}%)</option>
            <option value="balance">Final balance</option>
            <option value="full">Full amount</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <span className={labelClass}>Add-ons</span>
          <div className="flex flex-wrap gap-3">
            {catalog.addOns.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={addOns.includes(a.key)}
                  onChange={(e) =>
                    setAddOns((prev) => (e.target.checked ? [...prev, a.key] : prev.filter((k) => k !== a.key)))
                  }
                />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={state.busy} className={buttonClass}>
            {state.busy ? 'Creating...' : 'Create payment link'}
          </button>
        </div>
      </form>
      <ResultBox state={state} />
    </Card>
  );
}

interface LineDraft {
  id: number;
  key: string;
  description: string;
  amount: string;
  quantity: string;
}

const emptyLine = (id: number): LineDraft => ({ id, key: '', description: '', amount: '', quantity: '1' });

function InvoiceForm({ catalog }: { catalog: Props['catalog'] }) {
  const { state, run } = useApi();
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(1)]);
  const items = [...catalog.tiers, ...catalog.addOns];

  function updateLine(id: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run('/api/admin/billing/invoices', {
      email: form.get('email'),
      name: form.get('name'),
      daysUntilDue: form.get('daysUntilDue'),
      memo: form.get('memo'),
      footer: form.get('footer'),
      items: lines.map((l) =>
        l.key
          ? { key: l.key, quantity: Number(l.quantity) }
          : { description: l.description, amount: l.amount, quantity: Number(l.quantity) }
      ),
    });
  }

  return (
    <Card
      title="Send an invoice"
      subtitle="Stripe emails the hosted invoice page and sends reminders. Cards and ACH are accepted per your Dashboard settings."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client email">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Client name">
          <input name="name" type="text" className={inputClass} />
        </Field>
        <Field label="Days until due">
          <input name="daysUntilDue" type="number" min={1} max={90} defaultValue={14} className={inputClass} />
        </Field>
        <Field label="Memo (shown on invoice)">
          <input name="memo" type="text" className={inputClass} placeholder="Deposit for Core Web Build" />
        </Field>
        <div className="sm:col-span-2 space-y-3">
          <span className={labelClass}>Line items</span>
          {lines.map((line) => (
            <div key={line.id} className="grid gap-2 sm:grid-cols-12 items-end">
              <div className="sm:col-span-4">
                <select
                  value={line.key}
                  onChange={(e) => updateLine(line.id, { key: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Custom line</option>
                  {items.map((i) => (
                    <option key={i.key} value={i.key}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={line.description}
                  disabled={Boolean(line.key)}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="$ amount"
                  value={line.amount}
                  disabled={Boolean(line.key)}
                  onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== line.id) : prev))}
                  className={`${ghostButtonClass} w-full`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine((prev[prev.length - 1]?.id ?? 0) + 1)])}
            className={ghostButtonClass}
          >
            Add line
          </button>
        </div>
        <Field label="Footer (optional)">
          <input name="footer" type="text" className={inputClass} placeholder="Thank you for working with Axeon Studio." />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={state.busy} className={buttonClass}>
            {state.busy ? 'Sending...' : 'Create and send invoice'}
          </button>
        </div>
      </form>
      <ResultBox state={state} urlKey="hostedInvoiceUrl" />
    </Card>
  );
}

function CarePlanForm({ plans }: { plans: PlanItem[] }) {
  const { state, run } = useApi();
  const [planKey, setPlanKey] = useState<string>(plans[0]?.key ?? 'custom');
  const custom = planKey === 'custom';

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run('/api/admin/billing/subscriptions', {
      email: form.get('email'),
      name: form.get('name'),
      planKey: custom ? undefined : planKey,
      monthlyAmount: custom ? form.get('monthlyAmount') : undefined,
      planName: form.get('planName'),
      description: form.get('description'),
    });
  }

  return (
    <Card
      title="Start a recurring plan"
      subtitle="The per-tier monthly plans, the $49 basics plan for existing clients, or a custom amount. The client enters payment details once; renewals and retries run automatically. Prefer a personalized link above if you want the client to see the plan on the site first."
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client email">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Client name">
          <input name="name" type="text" className={inputClass} />
        </Field>
        <Field label="Plan">
          <select name="planKey" value={planKey} onChange={(e) => setPlanKey(e.target.value)} className={inputClass}>
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label} ({formatCents(p.amountCents)}/mo)
              </option>
            ))}
            <option value="custom">Custom amount</option>
          </select>
        </Field>
        {custom ? (
          <Field label="Monthly amount ($)">
            <input name="monthlyAmount" type="text" inputMode="decimal" defaultValue="49" required className={inputClass} />
          </Field>
        ) : (
          <Field label="Plan name override (optional)">
            <input name="planName" type="text" className={inputClass} placeholder="Leave blank to use the plan name" />
          </Field>
        )}
        {custom && (
          <Field label="Plan name (shown to client)">
            <input name="planName" type="text" className={inputClass} placeholder="Website Hosting & Care" />
          </Field>
        )}
        <div className="sm:col-span-2">
          <Field label="Description (optional)">
            <input name="description" type="text" className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={state.busy} className={buttonClass}>
            {state.busy ? 'Creating...' : 'Create plan link'}
          </button>
        </div>
      </form>
      <ResultBox state={state} />
    </Card>
  );
}

function PortalForm({ portalLoginUrl }: { portalLoginUrl: string | null }) {
  const { state, run } = useApi();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run('/api/admin/billing/portal', { email: form.get('email') });
  }

  return (
    <Card
      title="Client billing portal"
      subtitle="Clients can view invoices, update their card or bank account, and change billing details."
    >
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Field label="Client email">
            <input name="email" type="email" required className={inputClass} />
          </Field>
        </div>
        <button type="submit" disabled={state.busy} className={buttonClass}>
          {state.busy ? 'Creating...' : 'Create one-time portal link'}
        </button>
      </form>
      <ResultBox state={state} />
      {portalLoginUrl ? (
        <div className="mt-5 text-sm text-neutral-700">
          <p className="font-semibold">Self-service login page (safe to share with any client):</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <a href={portalLoginUrl} target="_blank" rel="noreferrer" className="underline break-all">
              {portalLoginUrl}
            </a>
            <CopyButton value={portalLoginUrl} />
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-neutral-500">
          Set STRIPE_PORTAL_LOGIN_URL to show the shareable self-service login page here.
        </p>
      )}
    </Card>
  );
}

function statusTone(status: string): string {
  if (['paid', 'active', 'trialing'].includes(status)) return 'bg-emerald-100 text-emerald-800';
  if (['failed', 'past_due', 'unpaid', 'uncollectible', 'canceled', 'void'].includes(status)) {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-neutral-100 text-neutral-700';
}

function RecordsTable({
  records,
  databaseConfigured,
  dbError,
}: Pick<Props, 'records' | 'databaseConfigured' | 'dbError'>) {
  return (
    <Card title="Recent activity" subtitle="Mirrored from Stripe webhooks. The Stripe Dashboard is the source of truth.">
      {!databaseConfigured && (
        <p className="text-sm text-neutral-600">
          No database attached, so activity is not mirrored here yet. Payments still work; check the Stripe Dashboard.
        </p>
      )}
      {dbError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{dbError}</div>
      )}
      {databaseConfigured && !dbError && records.length === 0 && (
        <p className="text-sm text-neutral-600">Nothing yet. Activity appears here once the webhook receives events.</p>
      )}
      {records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 align-top">
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {new Date(r.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago' })}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="font-medium text-neutral-900">{r.customerName ?? 'Unknown'}</div>
                    <div className="text-neutral-500">{r.customerEmail ?? ''}</div>
                  </td>
                  <td className="py-2 pr-4 text-neutral-700">
                    {r.objectType.replace('_', ' ')}
                    {r.kind ? ` / ${r.kind}` : ''}
                    {r.tier ? ` / ${r.tier}` : ''}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-900">
                    {r.amountCents != null ? formatCents(r.amountCents, r.currency ?? 'usd') : ''}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {r.hostedUrl ? (
                      <a href={r.hostedUrl} target="_blank" rel="noreferrer" className="underline text-blue-700">
                        Open
                      </a>
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function BillingConsole(props: Props) {
  return (
    <div className="space-y-6">
      {!props.stripeConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Stripe is not connected.</strong> Add STRIPE_SECRET_KEY (a restricted key) and STRIPE_WEBHOOK_SECRET
          to the environment, then redeploy. See docs/stripe.md.
        </div>
      )}
      {props.stripeConfigured && !props.automaticTax && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
          Automatic tax is off. Stripe Tax threshold monitoring will flag when a registration is needed; set
          STRIPE_AUTOMATIC_TAX=true only after a registration shows Collecting.
        </div>
      )}
      <PayLinkForm
        catalog={props.catalog}
        plans={props.plans}
        depositPercent={props.depositPercent}
        databaseConfigured={props.databaseConfigured}
      />
      <PayLinksTable links={props.payLinks} databaseConfigured={props.databaseConfigured} />
      <PaymentLinkForm catalog={props.catalog} depositPercent={props.depositPercent} />
      <InvoiceForm catalog={props.catalog} />
      <CarePlanForm plans={props.plans} />
      <PortalForm portalLoginUrl={props.portalLoginUrl} />
      <RecordsTable records={props.records} databaseConfigured={props.databaseConfigured} dbError={props.dbError} />
    </div>
  );
}
