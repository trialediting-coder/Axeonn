'use client';

import { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';

const input =
  'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600';

async function goToCheckout(token: string): Promise<string | null> {
  const res = await fetch(`/api/sign/${token}/checkout`, { method: 'POST' });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (res.ok && data.url) {
    window.location.href = data.url;
    return null;
  }
  return data.error ?? 'Could not open checkout. Call us at (515) 493-8017.';
}

/** Sign (typed name + consent), then straight on to Stripe Checkout. */
export function SignPanel(props: { token: string; signerName: string; signerTitle: string; fees: string }) {
  const [name, setName] = useState(props.signerName);
  const [title, setTitle] = useState(props.signerTitle);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/sign/${props.token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, title, consent }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? 'Could not sign. Try again.');
      setBusy(false);
      return;
    }
    const err = await goToCheckout(props.token);
    if (err) {
      // Signed but checkout failed: reload to show the signed copy with a Pay button.
      window.location.reload();
    }
  }

  return (
    <form onSubmit={sign} className="rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
      <h2 className="text-xl font-extrabold tracking-tight font-display text-neutral-950">Sign and get started</h2>
      <p className="mt-1 text-sm text-neutral-600">Type your full name to sign. Next you pay {props.fees} by card or bank, and we start.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-semibold text-neutral-700 mb-1.5">Full name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={3} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-neutral-700 mb-1.5">Title</span>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Owner" />
        </label>
      </div>
      {name.trim().length >= 3 && (
        <p className="mt-4 text-3xl italic text-blue-900" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
          {name}
        </p>
      )}
      <label className="mt-5 flex items-start gap-3 text-sm text-neutral-700">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I have read this Agreement, including Schedule A. I am authorized to sign for the Client, and I agree that typing my name is my
          electronic signature.
        </span>
      </label>
      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !consent || name.trim().length < 3}
        className="mt-6 w-full sm:w-auto px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-300 text-white font-bold text-base transition-colors"
      >
        {busy ? 'Signing…' : 'Sign and continue to payment'}
      </button>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
        <Lock size={12} /> We record the time, your IP address and a fingerprint of this exact text with your signature.
      </p>
    </form>
  );
}

/** Shown on a signed agreement that has not been paid yet. */
export function PayPanel({ token, dueToday, breakdown }: { token: string; dueToday: string; breakdown: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={16} /> Signed. One step left.
      </p>
      <h2 className="mt-2 text-xl font-extrabold tracking-tight font-display text-neutral-950">Pay {dueToday} today</h2>
      <p className="mt-1 text-sm text-neutral-700">{breakdown}.</p>
      <p className="mt-1 text-sm text-neutral-600">Secure checkout by Stripe. Your setup page arrives by email as soon as it goes through.</p>
      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = await goToCheckout(token);
          if (err) {
            setError(err);
            setBusy(false);
          }
        }}
        className="mt-5 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-300 text-white font-bold text-base transition-colors"
      >
        {busy ? 'Opening checkout…' : 'Continue to payment'}
      </button>
    </div>
  );
}
