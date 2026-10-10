'use client';

// components/proof/PortalButton.tsx
// "Manage billing" on the Billing tab: asks /api/proof/billing for a one-time
// link to Stripe's hosted portal and sends the client there. Disabled in the
// admin preview, since the admin is not the client.
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function PortalButton({ label, preview }: { label: string; preview: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/proof/billing', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `Could not open billing (${res.status})`);
      window.location.assign(data.url);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Could not open billing');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={preview || busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
      >
        {busy ? 'Opening…' : label} <ExternalLink size={15} />
      </button>
      {preview ? <p className="mt-2 text-xs text-neutral-500">Clients can press this. In the admin preview it is switched off.</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
