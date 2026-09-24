'use client';

// components/pay/PaymentForm.tsx
// Public self-serve payment form for /pay. Everything money-related is computed
// from the catalog the server passed in (amounts already come from Stripe), and
// the real charge is always built server-side again in lib/billing.ts, so this
// component is display + intent only. No Stripe.js: the visitor is handed off to
// Stripe-hosted Checkout, which keeps card data off this site entirely.

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, CreditCard, Landmark, Loader2, Lock, Receipt } from 'lucide-react';
import { computeSplit, formatCents, type PaymentKind } from '@/lib/billingMath';
import type { PublicCatalogItem, PublicPlan } from '@/lib/publicCatalog';
import { EVENTS, trackEvent } from '@/components/providers/AnalyticsTracker';

/** Catalog amounts are whole dollars; "$2,800" reads cleaner than "$2,800.00". */
const money = (cents: number) => formatCents(cents).replace(/\.00$/, '');

interface Props {
  tiers: PublicCatalogItem[];
  addOns: PublicCatalogItem[];
  /** The monthly plan that follows each build, keyed by tier. Shown, never charged here. */
  tierPlans: Partial<Record<string, PublicPlan>>;
  depositPercent: number;
  stripeConfigured: boolean;
  initialTier: string;
}

// Videography is part of AxeonCORE, so offering it as an add-on there would
// double-charge. The API filters it too; this just keeps the UI honest.
const INCLUDED_IN: Record<string, string[]> = {
  axeoncore: ['addon-videography'],
};

const stepLabel = 'font-mono text-xs font-semibold tracking-[0.2em] text-blue-600';
const inputClass =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-colors';

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="relative rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex items-baseline gap-3">
        <span className={stepLabel}>0{n}</span>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">{title}</h2>
      </div>
      {hint && <p className="mt-1.5 text-sm sm:text-base text-neutral-500 leading-relaxed">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-300 bg-white'
      }`}
    >
      {selected && <Check size={12} strokeWidth={3} />}
    </span>
  );
}

function optionClass(selected: boolean, disabled = false) {
  if (disabled) return 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-70';
  return selected
    ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-600/10 cursor-pointer'
    : 'border-neutral-200 hover:border-neutral-300 cursor-pointer';
}

export function PaymentForm({ tiers, addOns, tierPlans, depositPercent, stripeConfigured, initialTier }: Props) {
  const [tier, setTier] = useState<string>(tiers.some((t) => t.key === initialTier) ? initialTier : tiers[0].key);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [kind, setKind] = useState<PaymentKind>('deposit');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const included = INCLUDED_IN[tier] ?? [];
  const activeAddOns = selectedAddOns.filter((k) => !included.includes(k));

  const totals = useMemo(() => {
    const tierItem = tiers.find((t) => t.key === tier) ?? tiers[0];
    const chosen = addOns.filter((a) => activeAddOns.includes(a.key));
    const total = tierItem.amountCents + chosen.reduce((sum, a) => sum + a.amountCents, 0);
    const split = computeSplit(total, depositPercent);
    const due = kind === 'full' ? total : kind === 'deposit' ? split.deposit : split.balance;
    return { tierItem, chosen, total, split, due };
    // activeAddOns is derived from selectedAddOns + tier, both of which are deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers, addOns, tier, selectedAddOns, kind, depositPercent]);

  function chooseTier(key: string) {
    setTier(key);
    const nowIncluded = INCLUDED_IN[key] ?? [];
    setSelectedAddOns((prev) => prev.filter((k) => !nowIncluded.includes(k)));
  }

  function toggleAddOn(key: string) {
    setSelectedAddOns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    trackEvent(EVENTS.checkoutStarted, {
      tier,
      payment_kind: kind,
      add_ons: activeAddOns.join(','),
      value: totals.due / 100,
      currency: 'USD',
    });
    trackEvent('begin_checkout', {
      currency: 'USD',
      value: totals.due / 100,
      items: [{ item_id: tier, item_name: totals.tierItem.label, price: totals.tierItem.amountCents / 100, quantity: 1 }],
    });

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, kind, addOns: activeAddOns, name, email, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: unknown; error?: unknown };
      if (!res.ok || typeof data.url !== 'string') {
        throw new Error(typeof data.error === 'string' ? data.error : 'We could not start checkout. Please try again.');
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not start checkout. Please try again.');
      setBusy(false);
    }
  }

  const paymentOptions: { value: PaymentKind; title: string; hint: string; amount: number }[] = [
    {
      value: 'deposit',
      title: `${depositPercent}% deposit`,
      hint: 'Reserve your build now. The remaining balance is due at launch.',
      amount: totals.split.deposit,
    },
    {
      value: 'full',
      title: 'Pay in full',
      hint: 'One payment, nothing left to settle later.',
      amount: totals.total,
    },
    {
      value: 'balance',
      title: 'Remaining balance',
      hint: 'Already paid your deposit? Settle the rest here.',
      amount: totals.split.balance,
    },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* Left: the four steps */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-7 space-y-5 sm:space-y-6"
      >
        <Step
          n={1}
          title="Choose your build"
          hint="Both are flat-rate, one-time builds. Not sure which fits? Book a call first and we will tell you."
        >
          <div className="grid gap-4" role="radiogroup" aria-label="Build">
            {tiers.map((t) => {
              const selected = tier === t.key;
              return (
                <label
                  key={t.key}
                  className={`relative flex gap-4 rounded-2xl border-2 p-5 sm:p-6 transition-all ${optionClass(selected)}`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={t.key}
                    checked={selected}
                    onChange={() => chooseTier(t.key)}
                    className="sr-only"
                  />
                  <Radio selected={selected} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-lg sm:text-xl font-bold text-neutral-950">{t.label}</span>
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-neutral-950 whitespace-nowrap">
                        {money(t.amountCents)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm sm:text-base text-neutral-600 leading-relaxed">{t.description}</p>
                    {tierPlans[t.key] && (
                      <p className="mt-3 inline-flex flex-wrap items-baseline gap-x-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs sm:text-sm text-neutral-700">
                        <span className="font-bold text-neutral-950">then {money(tierPlans[t.key]!.amountCents)}/mo</span>
                        <span className="text-neutral-500">after launch · not charged today</span>
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <p className="mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed">
            The build price is a one-time setup payment. The monthly plan that follows covers hosting, care, and
            ongoing support; we set it up with you once your site is live.
          </p>
        </Step>

        <Step n={2} title="Add-ons" hint="Optional. Add anything you scoped with us; skip this if you did not.">
          <div className="grid gap-3 sm:gap-4">
            {addOns.map((a) => {
              const isIncluded = included.includes(a.key);
              const selected = !isIncluded && selectedAddOns.includes(a.key);
              return (
                <label
                  key={a.key}
                  className={`flex gap-3.5 rounded-2xl border-2 p-4 sm:p-5 transition-all ${optionClass(selected, isIncluded)}`}
                >
                  <input
                    type="checkbox"
                    name="addOns"
                    value={a.key}
                    checked={selected}
                    disabled={isIncluded}
                    onChange={() => toggleAddOn(a.key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm sm:text-base font-semibold text-neutral-950 leading-snug">{a.label}</span>
                      <span className="text-sm sm:text-base font-bold text-blue-600 whitespace-nowrap">
                        {isIncluded ? 'Included' : `+${money(a.amountCents)}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                      {isIncluded ? `Already part of ${totals.tierItem.label}.` : a.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="mt-4 text-xs sm:text-sm text-neutral-500">
            Need more than one of something? Pay for one here and we will invoice the rest.
          </p>
        </Step>

        <Step n={3} title="How would you like to pay?">
          <div className="grid gap-3 sm:gap-4" role="radiogroup" aria-label="Payment type">
            {paymentOptions.map((opt) => {
              const selected = kind === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex gap-4 rounded-2xl border-2 p-4 sm:p-5 transition-all ${optionClass(selected)}`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={opt.value}
                    checked={selected}
                    onChange={() => setKind(opt.value)}
                    className="sr-only"
                  />
                  <Radio selected={selected} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-base sm:text-lg font-bold text-neutral-950">{opt.title}</span>
                      <span className="text-base sm:text-lg font-black tracking-tight text-neutral-950 whitespace-nowrap">
                        {money(opt.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-500 leading-relaxed">{opt.hint}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Step>

        <Step n={4} title="Your details" hint="Your receipt and invoice go to this email.">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Name or business
              </span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith, Smith Roofing"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </label>
          </div>
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
            <label>
              Company
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
          </div>
        </Step>
      </motion.div>

      {/* Right: order summary + secure checkout */}
      <motion.aside
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-5 lg:sticky lg:top-28"
      >
        <div className="rounded-[28px] bg-neutral-950 text-white p-6 sm:p-8 shadow-2xl shadow-neutral-950/20">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-400">Summary</p>

          <ul className="mt-5 space-y-3 text-sm sm:text-base">
            <li className="flex justify-between gap-4">
              <span className="text-neutral-200">{totals.tierItem.label}</span>
              <span className="font-semibold whitespace-nowrap">{money(totals.tierItem.amountCents)}</span>
            </li>
            {totals.chosen.map((a) => (
              <li key={a.key} className="flex justify-between gap-4">
                <span className="text-neutral-400">{a.label}</span>
                <span className="text-neutral-300 whitespace-nowrap">+{money(a.amountCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-5 border-t border-white/10 flex justify-between gap-4 text-sm sm:text-base">
            <span className="text-neutral-400">Project total</span>
            <span className="text-neutral-200 font-semibold">{money(totals.total)}</span>
          </div>

          <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-semibold text-neutral-300">Due today</span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight">{money(totals.due)}</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {kind === 'deposit' && `The remaining ${money(totals.split.balance)} is due at launch.`}
              {kind === 'full' && 'Covers the full project. Nothing further is due.'}
              {kind === 'balance' && `Assumes a ${money(totals.split.deposit)} deposit has already been paid.`}
            </p>
          </div>

          {tierPlans[tier] && (
            <div className="mt-4 flex items-baseline justify-between gap-4 rounded-2xl border border-dashed border-white/15 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-neutral-300">After launch</p>
                <p className="mt-0.5 text-xs text-neutral-500">{tierPlans[tier]!.label} · set up with you later</p>
              </div>
              <span className="text-base font-bold text-neutral-200 whitespace-nowrap">
                {money(tierPlans[tier]!.amountCents)}/mo
              </span>
            </div>
          )}

          {!stripeConfigured && (
            <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs sm:text-sm text-amber-200 leading-relaxed">
              Online checkout is not switched on in this environment yet. The button below will return a friendly
              error until Stripe keys are added.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait px-7 py-4 text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition-colors"
          >
            {busy ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Opening secure checkout
              </>
            ) : (
              <>
                <Lock size={18} />
                Continue to secure checkout
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-neutral-400">
            <li className="flex items-center gap-2.5">
              <CreditCard size={16} className="text-blue-400 shrink-0" />
              Card, Apple Pay, Google Pay
            </li>
            <li className="flex items-center gap-2.5">
              <Landmark size={16} className="text-blue-400 shrink-0" />
              Bank transfer (ACH) for larger amounts
            </li>
            <li className="flex items-center gap-2.5">
              <Receipt size={16} className="text-blue-400 shrink-0" />
              Receipt and invoice emailed automatically
            </li>
          </ul>

          <p className="mt-6 text-[11px] sm:text-xs text-neutral-500 leading-relaxed">
            Payments are processed by Stripe. Card details never touch this site. Any applicable tax is calculated at
            checkout.
          </p>
        </div>
      </motion.aside>
    </form>
  );
}
