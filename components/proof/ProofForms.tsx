'use client';

// components/proof/ProofForms.tsx
// The three signed-out AxeonPROOF forms: sign in, forgot password, reset password.
// Each posts JSON to /api/proof/*; on success the page reloads into the dashboard.
// Styled for the dark auth card (components/proof/ProofAuthShell.tsx).

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { proofButton, proofInput, proofLabel } from '@/components/proof/ProofAuthShell';

async function post(path: string, body: unknown): Promise<{ ok?: boolean; error?: string; message?: string }> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
  return data;
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  invalid,
  aside,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid: boolean;
  aside?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={proofLabel}>
          {label}
        </label>
        {aside}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          maxLength={200}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={`${proofInput} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 hover:text-neutral-700"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/api/proof/login', { email, password });
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="proof-email" className={proofLabel}>
          Email
        </label>
        <input
          id="proof-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`${proofInput} mt-1.5`}
          placeholder="you@yourbusiness.com"
        />
      </div>
      <PasswordField
        id="proof-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        invalid={Boolean(error)}
        aside={
          <Link href="/proof/forgot" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        }
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={busy} className={proofButton}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : null}
        Sign in
      </button>
      <div className="flex items-center gap-3 pt-2">
        <span className="h-px flex-1 bg-neutral-300" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">New to AxeonPROOF?</span>
        <span className="h-px flex-1 bg-neutral-300" />
      </div>
      <p className="text-center text-sm leading-relaxed text-neutral-500">
        You create your login at the end of your setup page. Need help?{' '}
        <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:text-blue-700">
          (515) 493-8017
        </a>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await post('/api/proof/forgot', { email });
      setSent(data.message ?? 'Check your email for a reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-800">{sent}</p>
        <Link href="/" className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="proof-forgot-email" className={proofLabel}>
          Email
        </label>
        <input
          id="proof-forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${proofInput} mt-1.5`}
          placeholder="you@yourbusiness.com"
        />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={busy} className={proofButton}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : null}
        Email me a reset link
      </button>
      <Link href="/" className="block text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/api/proof/reset', { token, password });
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PasswordField
        id="proof-new-password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        invalid={Boolean(error)}
      />
      <p className="-mt-3 text-xs text-neutral-500">At least 10 characters.</p>
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={busy || password.length < 10} className={proofButton}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : null}
        Save and sign in
      </button>
    </form>
  );
}
