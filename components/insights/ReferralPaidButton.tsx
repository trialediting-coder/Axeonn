'use client';

// components/insights/ReferralPaidButton.tsx
// "Mark $300 paid" on the admin Data page's referrals card. Posts to the
// client's project route, then reloads so the row moves to Paid.
import { useState } from 'react';
import { btn } from '@/components/admin/ui';

export function ReferralPaidButton({ token, paid }: { token: string; paid: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'referral-paid', paid: !paid }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `Request failed (${res.status})`);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={toggle} disabled={busy} className={btn(paid ? 'ghost' : 'primary', 'sm')}>
        {busy ? 'Saving…' : paid ? 'Undo' : 'Mark $300 paid'}
      </button>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </span>
  );
}
