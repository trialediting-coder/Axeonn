// components/insights/ChatPanel.tsx
// The Website chat card on a client's admin page: switch it on, set the greeting,
// "Train on site" (crawl their pages into what the chat knows), the one-line
// snippet for their site, and the last 20 conversations to read back.
'use client';

import { TIER_RANK } from '@/data/onboardingItems';
import { useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { DEFAULT_GREETING, GREETING_MAX, toolLabel, type ChatAdminData } from '@/lib/chatShared';
import { formatPhone } from '@/lib/phoneShared';

type Payload = ChatAdminData & { crawl?: { saved: number; blocked: boolean; errors: number }; error?: string };

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function ChatPanel({ token, tier, initial }: { token: string; tier: string; initial: ChatAdminData }) {
  const [data, setData] = useState<ChatAdminData>(initial);
  const [enabled, setEnabled] = useState(initial.settings.enabled);
  const [greeting, setGreeting] = useState(initial.settings.greeting ?? '');
  const [url, setUrl] = useState(initial.siteUrl ?? '');
  const [busy, setBusy] = useState<null | 'save' | 'train'>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if ((TIER_RANK[tier as keyof typeof TIER_RANK] ?? 0) < TIER_RANK.axeoncore) return null;

  async function send(method: 'PUT' | 'POST', body: Record<string, unknown>, kind: 'save' | 'train') {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/chat`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as Payload;
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
      if (kind === 'save') setNotice('Saved.');
      else if (json.crawl?.blocked) setNotice('Their robots.txt asks bots not to crawl the homepage, so nothing was saved. Ask the client, or paste the key pages’ text into the portal answers.');
      else if (json.crawl) setNotice(`Saved ${json.crawl.saved} pages${json.crawl.errors ? ` (${json.crawl.errors} could not be read)` : ''}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  const snippet = data.siteKey ? `<script defer src="${SITE_ORIGIN}/chat.js" data-site="${data.siteKey}"></script>` : null;

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Website chat</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{data.settings.enabled && data.configured ? 'Answering on their site' : 'Off'}</h2>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          {data.pages.length} pages learned{data.settings.trainedAt ? ` · ${when(data.settings.trainedAt)}` : ''}
        </span>
      </div>

      {!data.configured ? <p className="mt-3 text-sm text-amber-900">ANTHROPIC_API_KEY is not set, so the chat stays off whatever this switch says.</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className={adminLabel}>Their website</label>
          <input className={adminInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </div>
        <button className={btn('secondary')} disabled={busy !== null} onClick={() => send('POST', { action: 'train', url }, 'train')}>
          {busy === 'train' ? 'Reading their site…' : 'Train on site'}
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Reads up to 40 pages on that site (text only) and replaces what the chat learned before. Takes up to a minute.</p>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Show the chat on their site
      </label>
      <div className="mt-3">
        <label className={adminLabel}>Greeting (blank = default)</label>
        <input className={adminInput} value={greeting} onChange={(e) => setGreeting(e.target.value)} maxLength={GREETING_MAX} placeholder={DEFAULT_GREETING} />
      </div>
      <div className="mt-3">
        <button className={btn('primary', 'sm')} disabled={busy !== null} onClick={() => send('PUT', { enabled, greeting }, 'save')}>
          {busy === 'save' ? 'Saving…' : 'Save chat settings'}
        </button>
      </div>

      {snippet ? (
        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">On the client&apos;s site, once, before &lt;/body&gt;</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-3 text-xs">{snippet}</pre>
        </div>
      ) : (
        <p className="mt-5 text-sm text-amber-900">This client has no site key yet. Set up website tracking first; the chat uses the same key.</p>
      )}

      {data.pages.length ? (
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer font-semibold text-neutral-900">Pages the chat knows ({data.pages.length})</summary>
          <ul className="mt-2 space-y-1 text-neutral-700">
            {data.pages.map((p) => (
              <li key={p.url} className="truncate">
                <a className="text-blue-700 underline" href={p.url} target="_blank" rel="noreferrer">{p.title || p.url}</a> · {p.chars.toLocaleString('en-US')} characters
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <h3 className="mt-6 text-sm font-semibold text-neutral-900">Last 20 conversations</h3>
      {data.transcripts.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">No conversations yet.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {data.transcripts.map((t) => (
            <details key={t.id} className="rounded-xl border border-neutral-200 p-3 text-sm">
              <summary className="cursor-pointer">
                {when(t.lastAt)} · {t.name || 'Visitor'}
                {t.phone ? ` · ${formatPhone(t.phone)}` : ''} · {t.messages.filter((m) => m.role === 'user').length} messages{t.page ? ` · from ${t.page}` : ''}
              </summary>
              <div className="mt-2 space-y-1.5">
                {t.messages.map((m, i) =>
                  m.role === 'tool' ? (
                    <p key={i} className="text-xs italic text-neutral-500">{toolLabel(m.content)}</p>
                  ) : (
                    <p key={i} className={m.role === 'user' ? 'text-neutral-950' : 'text-neutral-600'}>
                      <b>{m.role === 'user' ? 'Visitor' : 'Chat'}:</b> {m.content}
                    </p>
                  )
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
