'use client';

// components/proof/EmailRequestForm.tsx
// The one form on the Email tab: pick what you need, add a line, send. Posts to
// /api/proof/email-request, which stores it and emails the owner. Disabled in
// the admin preview, since the admin is not the client.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { EXTRA_MAILBOX_PRICE, REQUEST_KINDS, type EmailRequestKind } from '@/lib/businessEmailShared';

/** `included`: the plan still has a free mailbox left, so a new one costs nothing. */
export function EmailRequestForm({ preview, included }: { preview: boolean; included: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<EmailRequestKind>('add');
  const [detail, setDetail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/proof/email-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, detail }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setDetail('');
      setState('done');
      router.refresh();
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Could not send that');
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <p className="flex items-center gap-2 font-semibold">
          <Check size={16} /> Got it.
        </p>
        <p className="mt-0.5 text-xs text-emerald-800">We will take care of it within one business day and email you when it is done.</p>
        <button type="button" onClick={() => setState('idle')} className="mt-2 text-xs font-semibold text-emerald-800 underline">
          Ask for something else
        </button>
      </div>
    );
  }

  const placeholder = REQUEST_KINDS.find((k) => k.kind === kind)?.placeholder ?? '';
  return (
    <form onSubmit={send} className="mt-3 space-y-2">
      <label className="sr-only" htmlFor="email-request-kind">What do you need?</label>
      <select
        id="email-request-kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as EmailRequestKind)}
        className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
      >
        {REQUEST_KINDS.map((k) => (
          <option key={k.kind} value={k.kind}>
            {k.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="email-request-detail">Details</label>
      <textarea
        id="email-request-detail"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
      />
      {kind === 'add' ? (
        <p className="rounded-md bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-600">
          {included
            ? 'Included in your plan, no extra cost.'
            : `Your plan's mailboxes are in use, so this one is $${EXTRA_MAILBOX_PRICE}/mo. We confirm with you before anything is billed. Need an info@ or sales@ instead? That is free.`}
        </p>
      ) : null}
      <p className="text-[11px] text-neutral-500">Never type a password here. If someone is locked out, Google emails them a fresh sign-in.</p>
      <button
        type="submit"
        disabled={preview || state === 'busy' || detail.trim().length < 2}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {state === 'busy' ? 'Sending…' : 'Send to Axeon'}
      </button>
      {preview ? <p className="text-xs text-neutral-500">Clients can send this. In the admin preview it is switched off.</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
