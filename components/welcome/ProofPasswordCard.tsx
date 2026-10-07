'use client';

// components/welcome/ProofPasswordCard.tsx
// Last step of the onboarding portal: the client creates the password they will
// use to sign in to AxeonPROOF at app.axeonstudio.co. The portal page only shows
// this to a device that already passed the email code.

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';

export function ProofPasswordCard({ token, email, hasAccount }: { token: string; email: string; hasAccount: boolean }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(hasAccount);
  const [changing, setChanging] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/welcome/${token}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; reason?: string };
      if (data.reason === 'unverified') {
        window.location.reload();
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not save the password.');
      setDone(true);
      setChanging(false);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <LockKeyhole size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">AxeonPROOF</p>
          <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
            {done && !changing ? 'Your AxeonPROOF login is ready' : 'Create your AxeonPROOF login'}
          </h2>
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
            {done && !changing ? (
              <>
                Sign in any time at{' '}
                <a href="/" className="font-semibold text-blue-600 hover:text-blue-700">
                  app.axeonstudio.co
                </a>{' '}
                with <span className="font-semibold text-neutral-900">{email}</span> to see your setup now, and every
                call, lead and booked job once you launch.
              </>
            ) : (
              <>
                Your dashboard for every call, lead and booked job. You&apos;ll sign in with{' '}
                <span className="font-semibold text-neutral-900">{email}</span> and the password you pick here.
              </>
            )}
          </p>

          {done && !changing ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} /> Password set
              </span>
              <button type="button" onClick={() => setChanging(true)} className="text-sm font-semibold text-neutral-500 hover:text-neutral-900">
                Change it
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4">
              <label htmlFor="proof-password" className="block text-sm font-semibold text-neutral-800">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="proof-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={200}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 pr-12 text-base text-neutral-950 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 aria-[invalid=true]:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">At least 10 characters. A short phrase is easiest to remember.</p>
              {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || password.length < 10}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm transition-colors"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {changing ? 'Save new password' : 'Create my login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
