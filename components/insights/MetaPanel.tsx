// The Facebook and Instagram card on a client's admin page (AxeonCORE and up):
// which pages are connected, whether Instagram is linked, a page that needs
// reconnecting, and buttons to connect (Facebook Login as the admin, with the
// client on the phone) or disconnect. Tokens never reach this component.
'use client';

import { useState } from 'react';
import { btn } from '@/components/admin/ui';
import type { MetaPagePublic } from '@/lib/metaShared';

export function MetaPanel({ token, tier, configured, initial }: { token: string; tier: string; configured: boolean; initial: MetaPagePublic[] }) {
  const [pages, setPages] = useState<MetaPagePublic[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (tier === 'essentials') return null;

  async function remove(page: MetaPagePublic) {
    if (busy) return;
    if (!window.confirm(`Disconnect ${page.pageName}? New Facebook and Instagram messages stop coming in until it is connected again.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/meta`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pageId: page.pageId }) });
      const json = (await res.json().catch(() => null)) as { pages?: MetaPagePublic[]; error?: string } | null;
      if (!res.ok || !json?.pages) throw new Error(json?.error || `Request failed (${res.status})`);
      setPages(json.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Facebook and Instagram messages</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{pages.length ? `${pages.length} page${pages.length === 1 ? '' : 's'} connected` : 'Not connected yet'}</h2>
        </div>
        {configured ? (
          <a href={`/api/meta/connect?token=${token}&from=admin`} className={btn('secondary', 'sm')}>
            {pages.length ? 'Reconnect or add a page' : 'Connect with Facebook'}
          </a>
        ) : null}
      </div>
      {!configured ? (
        <p className="mt-3 text-sm text-neutral-600">Meta is not configured. Set META_APP_ID, META_APP_SECRET, META_VERIFY_TOKEN and SECRETS_KEY in Vercel (docs/onboarding.md, “Facebook and Instagram”).</p>
      ) : (
        <p className="mt-3 text-sm text-neutral-600">The client can also connect from their setup page. Messages land in their leads inbox; replies go back through Facebook within 24 hours of the person’s last message.</p>
      )}
      {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
      {pages.length ? (
        <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {pages.map((p) => (
            <li key={p.pageId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-neutral-900">{p.pageName}</p>
                <p className="text-neutral-600">
                  {p.igUsername ? `Instagram @${p.igUsername}` : p.igUserId ? 'Instagram linked' : 'No Instagram linked'} · since{' '}
                  {new Date(p.connectedAt).toLocaleDateString('en-US')}
                </p>
                {p.status === 'needs_reconnect' ? (
                  <p className="mt-1 text-amber-800">Facebook stopped accepting this page’s access. Reconnect it.{p.lastError ? ` (${p.lastError})` : ''}</p>
                ) : null}
              </div>
              <button type="button" disabled={busy || !configured} onClick={() => remove(p)} className={btn('danger', 'sm')}>
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
