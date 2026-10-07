'use client';

// components/proof/ProofForms.tsx
// The three signed-out AxeonPROOF forms: sign in, forgot password, reset password.
// Each posts JSON to /api/proof/*; on success the page reloads into the dashboard.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { proofButton, proofInput } from '@/components/proof/ProofAuthShell';

async function post(path: string, body: unknown): Promise<{ ok?: boolean; error?: string; message?: string }> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
  return data;
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
  aside?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-neutral-800">
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
          className={`${proofInput} pr-12`}
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
        <label htmlFor="proof-email" className="block text-sm font-semibold text-neutral-800">
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
          <Link href="/proof/forgot" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        }
      />
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={proofButton}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        Sign in
      </button>
      <p className="text-center text-sm text-neutral-500">
        New client? You&apos;ll create your login at the end of your setup page.
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
        <label htmlFor="proof-forgot-email" className="block text-sm font-semibold text-neutral-800">
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
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={proofButton}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
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
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || password.length < 10} className={proofButton}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : null}
        Save and sign in
      </button>
    </form>
  );
}
