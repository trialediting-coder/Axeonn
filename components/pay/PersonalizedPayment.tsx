'use client';

// components/pay/PersonalizedPayment.tsx
// The client-facing view of a personalized pay link (/pay/<token>). Everything is
// locked: the admin chose the scope, this just shows it and hands off to Stripe.
// All money strings are computed on the server (app/pay/[token]/page.tsx) so this
// component never does arithmetic.

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Clock, CreditCard, Landmark, Loader2, Lock, Receipt } from 'lucide-react';
import { EVENTS, trackEvent } from '@/components/providers/AnalyticsTracker';

export type PersonalizedState = 'open' | 'paid' | 'expired' | 'disabled' | 'invalid';

export interface PersonalizedPaymentProps {
  token: string;
  state: PersonalizedState;
  clientName: string | null;
  maskedEmail: string | null;
  note: string | null;
  headline: string;
  lines: { label: string; amount: string }[];
  /** Project total for setup payments; null for plan links. */
  total: string | null;
  dueLabel: string;
  due: string;
  dueNote: string;
  expiresAt: string | null;
  stripeConfigured: boolean;
}

const PHONE_HREF = 'tel:+15154938017';
const PHONE = '(515) 493-8017';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto"
    >
      {children}
    </motion.div>
  );
}

function Closed({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div className="rounded-[28px] border border-neutral-200 bg-white p-8 sm:p-10 text-center shadow-xs">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          <Clock size={22} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 mb-3">{title}</h1>
        <p className="text-base text-neutral-600 leading-relaxed">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={PHONE_HREF}
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            Call {PHONE}
          </a>
          <Link
            href="/pay"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-neutral-300 hover:border-neutral-500 text-neutral-900 font-semibold text-sm transition-colors"
          >
            Make a payment instead
          </Link>
        </div>
      </div>
    </Shell>
  );
}

export function PersonalizedPayment(props: PersonalizedPaymentProps) {
  const [busy, setBusy] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);

  if (props.state === 'invalid') {
    return (
      <Closed
        title="This payment link is not valid"
        body="Check the link you were sent, or give us a call and we will send a fresh one."
      />
    );
  }
  if (props.state === 'expired' || props.state === 'disabled') {
    return (
      <Closed
        title="This payment link has expired"
        body="No problem. Call or text and we will send you a new one in a minute."
      />
    );
  }

  const greeting = props.clientName ? `Prepared for ${props.clientName}` : 'Prepared for you';

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent(EVENTS.checkoutStarted, { source: 'pay_link', token: props.token });
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: props.token, company }),
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

  return (
    <Shell>
      <div className="relative rounded-[28px] bg-neutral-950 text-white p-6 sm:p-9 shadow-2xl shadow-neutral-950/20">
        <p className="text-xs font-mono uppercase tracking-wider text-blue-400">{greeting}</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{props.headline}</h1>
        {props.note && <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">{props.note}</p>}

        <ul className="mt-7 space-y-3 text-sm sm:text-base">
          {props.lines.map((line) => (
            <li key={line.label} className="flex justify-between gap-4">
              <span className="text-neutral-200">{line.label}</span>
              <span className="font-semibold whitespace-nowrap">{line.amount}</span>
            </li>
          ))}
        </ul>

        {props.total && (
          <div className="mt-5 pt-5 border-t border-white/10 flex justify-between gap-4 text-sm sm:text-base">
            <span className="text-neutral-400">Project total</span>
            <span className="text-neutral-200 font-semibold">{props.total}</span>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-neutral-300">{props.dueLabel}</span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight">{props.due}</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">{props.dueNote}</p>
        </div>

        {props.state === 'paid' ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <CheckCircle2 size={22} className="text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Already paid. Thank you!</p>
              <p className="mt-1 text-sm text-emerald-100/80 leading-relaxed">
                A receipt went to {props.maskedEmail ?? 'your email'}. Questions? Call {PHONE}.
              </p>
            </div>
          </div>
        ) : (
          <>
            {!props.stripeConfigured && (
              <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs sm:text-sm text-amber-200 leading-relaxed">
                Online checkout is not switched on in this environment yet.
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
            <button
              type="button"
              onClick={pay}
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
                  Pay securely with Stripe
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </>
        )}

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
            Receipt emailed to {props.maskedEmail ?? 'the address on file'}
          </li>
        </ul>

        <p className="mt-6 text-[11px] sm:text-xs text-neutral-500 leading-relaxed">
          Payments are processed by Stripe. Card details never touch this site. Any applicable tax is calculated at
          checkout.
          {props.expiresAt && props.state === 'open' && (
            <>
              {' '}
              This link is valid until{' '}
              {new Date(props.expiresAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/Chicago',
              })}
              .
            </>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Not what you expected?{' '}
        <a href={PHONE_HREF} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          Call {PHONE}
        </a>
      </p>
    </Shell>
  );
}
