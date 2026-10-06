'use client';

// components/welcome/VerifyCode.tsx
// First visit on a new device: we email a 6-digit code to the address that paid,
// the client types it, and the server sets a signed cookie for 30 days. The code
// is requested automatically on mount so the client lands straight on the input.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

const RESEND_COOLDOWN_S = 60;

export function VerifyCode({ token, maskedEmail, businessName }: { token: string; maskedEmail: string; businessName: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const requested = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function requestCode() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/welcome/${token}/code`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        // A cooldown response still means a code is on its way from a moment ago.
        if (res.status === 429 && /just sent/i.test(data.error ?? '')) setSent(true);
        if (res.status === 404) {
          setError('This link is no longer active. Check your welcome email for the latest one, or call us.');
        } else {
          setError(data.error ?? 'We could not send the code. Try again.');
        }
      } else {
        setSent(true);
        setCooldown(RESEND_COOLDOWN_S);
        inputRef.current?.focus();
      }
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/welcome/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: digits }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; reason?: string };
      if (res.ok && data.ok) {
        router.refresh();
        return;
      }
      setError(data.error ?? 'That code did not work.');
      if (data.reason === 'expired' || data.reason === 'locked') setCode('');
    } catch {
      setError('We could not reach the server. Try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-md mx-auto"
    >
      <div className="rounded-[28px] border border-neutral-200 bg-white p-8 sm:p-10 shadow-xs">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <ShieldCheck size={22} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-display">
          {businessName ? `Setup for ${businessName}` : 'Your Axeon setup'}
        </h1>
        <p className="mt-3 text-base text-neutral-600 leading-relaxed">
          This page is private to you. We {sent ? 'sent' : 'are sending'} a 6-digit code to{' '}
          <span className="font-semibold text-neutral-900">{maskedEmail}</span>. Enter it once and this device stays signed in
          for 30 days.
        </p>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="welcome-code" className="block text-sm font-semibold text-neutral-800 mb-2">
            6-digit code
          </label>
          <input
            ref={inputRef}
            id="welcome-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={Boolean(error)}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono text-neutral-950 placeholder:text-neutral-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 aria-[invalid=true]:border-red-500"
            placeholder="••••••"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={checking || code.length !== 6}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-4 text-base transition-colors shadow-lg shadow-blue-600/20"
          >
            {checking ? <Loader2 size={18} className="animate-spin" /> : null}
            Continue
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <Mail size={15} /> Check spam if it is not there in a minute.
          </span>
          <button
            type="button"
            onClick={requestCode}
            disabled={sending || cooldown > 0}
            className="font-semibold text-blue-600 hover:text-blue-700 disabled:text-neutral-400 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-neutral-500 leading-relaxed">
        We never ask for passwords here or by email. Access to Google and other accounts goes through their own invites.
      </p>
    </motion.div>
  );
}
