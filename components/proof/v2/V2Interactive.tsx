'use client';

// components/proof/v2/V2Interactive.tsx
// The parts of AxeonPROOF v2 the client taps: pins on a layout / copy / staging
// screenshot, approve, ask for staging changes, sign off the front-desk routine,
// and name the practice manager for the summaries. Everything posts to
// /api/proof/v2 (lib/proofV2Actions.ts runClientAction) and refreshes the page.
// `api` is null in the admin preview: the same screens, read-only.
import { useRouter } from 'next/navigation';
import { useState, type MouseEvent } from 'react';
import { Check, ExternalLink, MapPin } from 'lucide-react';
import type { Pin } from '@/lib/proofV2';
import { shortDate, type PinStage, type ReviewItem } from '@/lib/proofV2Shared';
import { CLIENT_LIST_MAX_BYTES, parseClientList } from '@/lib/pastCustomersShared';
import { xlsxToCsv } from '@/lib/xlsxToCsv';

function usePost(api: string | null) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function post(body: Record<string, unknown>): Promise<boolean> {
    if (!api) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { post, busy, error };
}

const BTN = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold disabled:opacity-50';

/** A screenshot the client drops numbered pins on. Pins are percentages, so they stay put at any width. */
export function PinBoard({
  stage,
  imageUrl,
  pins,
  api,
  locked,
}: {
  stage: PinStage;
  imageUrl: string | undefined;
  pins: Pin[];
  api: string | null;
  locked: boolean;
}) {
  const { post, busy, error } = usePost(api);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [note, setNote] = useState('');
  const mine = pins.filter((p) => p.stage === stage);
  const canPin = !!api && !locked && !!imageUrl;

  function place(e: MouseEvent<HTMLDivElement>) {
    if (!canPin) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDraft({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  return (
    <div>
      {imageUrl ? (
        <div className="relative max-h-[52vh] overflow-y-auto rounded-xl ring-1 ring-neutral-200">
          <div className={`relative ${canPin ? 'cursor-crosshair' : ''}`} onClick={place}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Draft for review" className="block w-full select-none" draggable={false} />
            {mine.map((p, i) => (
              <span
                key={p.id}
                title={p.note}
                className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white shadow ring-2 ring-white ${p.status === 'resolved' ? 'bg-emerald-500' : p.author === 'axeon' ? 'bg-neutral-800' : 'bg-blue-600'}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {i + 1}
              </span>
            ))}
            {draft ? <span className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-amber-500 ring-2 ring-white" style={{ left: `${draft.x}%`, top: `${draft.y}%` }} /> : null}
          </div>
        </div>
      ) : null}
      {canPin ? <p className="mt-1.5 text-xs text-neutral-500">{draft ? 'Now say what to change.' : 'Tap the picture where you want a change.'}</p> : null}
      {draft ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should change here?" className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm" maxLength={600} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={async () => (await post({ action: 'pin', stage, x: draft.x, y: draft.y, note })) && (setDraft(null), setNote(''))} className={`${BTN} flex-1 bg-blue-600 text-white`}>
              <MapPin size={14} /> Add pin
            </button>
            <button type="button" onClick={() => setDraft(null)} className={`${BTN} border border-neutral-300 text-neutral-700`}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {mine.length ? (
        <ol className="mt-3 space-y-1 text-sm">
          {mine.map((p, i) => (
            <li key={p.id} className="flex gap-2">
              <span className="w-5 shrink-0 text-right font-semibold text-neutral-500">{i + 1}.</span>
              <span className={p.status === 'resolved' ? 'text-neutral-400 line-through' : 'text-neutral-800'}>{p.note}</span>
              <span className="ml-auto shrink-0 text-[11px] text-neutral-400">{p.status === 'resolved' ? 'Done' : p.author === 'axeon' ? 'Axeon' : 'You'}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** Layout or copy approval: the draft, its pins, and one Approve button. */
export function ReviewApproval({ stage, item, pins, api }: { stage: 'wireframe' | 'copy'; item: ReviewItem | undefined; pins: Pin[]; api: string | null }) {
  const { post, busy, error } = usePost(api);
  const label = stage === 'wireframe' ? 'layout' : 'copy';
  if (!item?.sharedAt) return <p className="text-sm text-neutral-500">The {label} draft appears here on its scheduled date, ready for your pins and approval.</p>;
  const open = pins.filter((p) => p.stage === stage && p.status === 'open').length;
  return (
    <div>
      {item.approvedAt ? (
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-blue-600">See the approved draft and its pins</summary>
          <div className="mt-2">
            <PinBoard stage={stage} imageUrl={item.imageUrl} pins={pins} api={api} locked />
          </div>
        </details>
      ) : (
        <PinBoard stage={stage} imageUrl={item.imageUrl} pins={pins} api={api} locked={false} />
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className={`${BTN} border border-neutral-300 text-neutral-800`}>
            Open the draft <ExternalLink size={13} />
          </a>
        ) : null}
        {item.approvedAt ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <Check size={15} /> Approved {shortDate(item.approvedAt)}
          </span>
        ) : api ? (
          <button type="button" disabled={busy} onClick={() => post({ action: 'approve', stage })} className={`${BTN} bg-emerald-600 text-white`}>
            <Check size={15} /> Approve the {label}
            {open ? ` (${open} pin${open === 1 ? '' : 's'} open)` : ''}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** The 48-hour staging review: approve sooner, or say what to change. */
export function StagingActions({ api, open }: { api: string | null; open: boolean }) {
  const { post, busy, error } = usePost(api);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  if (!api || !open) return null;
  return (
    <div className="mt-3">
      {asking ? (
        <div className="flex flex-col gap-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="What should we change before launch?" className="rounded-lg border border-neutral-300 p-3 text-sm" />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => post({ action: 'stagingChanges', note })} className={`${BTN} flex-1 bg-amber-600 text-white sm:flex-none`}>
              Send changes
            </button>
            <button type="button" onClick={() => setAsking(false)} className={`${BTN} border border-neutral-300 text-neutral-700`}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" disabled={busy} onClick={() => post({ action: 'approveStaging' })} className={`${BTN} bg-emerald-600 text-white`}>
            <Check size={15} /> Approve for launch
          </button>
          <button type="button" onClick={() => setAsking(true)} className={`${BTN} border border-neutral-300 text-neutral-800`}>
            Ask for changes
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** The front-desk routine sign-off (also on the setup portal, posting there). */
export function FrontDeskSignoff({ api, signedOffAt, signedOffBy }: { api: string | null; signedOffAt: string | null; signedOffBy: string | null }) {
  const { post, busy, error } = usePost(api);
  const [name, setName] = useState('');
  if (signedOffAt) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <Check size={15} /> Signed off by {signedOffBy} on {shortDate(signedOffAt)}
      </p>
    );
  }
  if (!api) return <p className="text-sm text-neutral-500">Not signed off yet.</p>;
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm" />
        <button type="button" disabled={busy} onClick={() => post({ action: 'frontDesk', name })} className={`${BTN} bg-blue-600 text-white`}>
          Our team will follow this
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** Who gets the weekly summary and the monthly link besides the owner. */
export function ManagerForm({ api, manager, title = 'practice manager' }: { api: string | null; manager: { name?: string; email?: string; phone?: string } | undefined; title?: string }) {
  const { post, busy, error } = usePost(api);
  const [m, setM] = useState({ name: manager?.name ?? '', email: manager?.email ?? '', phone: manager?.phone ?? '' });
  const [saved, setSaved] = useState(false);
  if (!api) return <p className="text-sm text-neutral-600">{manager?.email ? `${manager.name ?? title[0].toUpperCase() + title.slice(1)} · ${manager.email}` : `No ${title} added yet.`}</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder={`${title[0].toUpperCase() + title.slice(1)}'s name`} className="h-10 rounded-lg border border-neutral-300 px-3 text-sm" />
      <input value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} placeholder="Their email" type="email" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm" />
      <input value={m.phone} onChange={(e) => setM({ ...m, phone: e.target.value })} placeholder="Their cell (optional)" className="h-10 rounded-lg border border-neutral-300 px-3 text-sm" />
      <button type="button" disabled={busy} onClick={async () => setSaved(await post({ action: 'manager', ...m }))} className={`${BTN} bg-neutral-900 text-white`}>
        {saved ? 'Saved' : 'Save'}
      </button>
      {error ? <p className="text-sm text-red-600 sm:col-span-4">{error}</p> : null}
    </div>
  );
}

/**
 * The value of one new patient or client, on the pipeline card: shows the industry
 * estimate (or their own number) with one tap to change it. Read-only in the admin
 * preview (`api` null).
 */
export function AverageValueEdit({ api, average, estimated, person }: { api: string | null; average: number; estimated: boolean; person: string }) {
  const { post, busy, error } = usePost(api);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(average));
  const label = `$${Math.round(average).toLocaleString('en-US')}`;
  if (!open) {
    return (
      <p className="mt-2 text-[11px] leading-snug text-neutral-500">
        Each booked {person} counted at {label}
        {estimated ? <span className="font-semibold text-amber-700"> (estimated)</span> : null}.{' '}
        {api ? (
          <button type="button" onClick={() => setOpen(true)} className="font-semibold text-blue-600 underline underline-offset-2">
            {estimated ? 'Use your own number' : 'Change'}
          </button>
        ) : null}
      </p>
    );
  }
  return (
    <div className="mt-2">
      <label className="block text-[11px] font-medium text-neutral-600" htmlFor="avg-value">
        What a new {person} is worth to you, on average
      </label>
      <div className="mt-1 flex gap-2">
        <input id="avg-value" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-32 rounded-lg border border-neutral-300 px-3 text-sm" />
        <button type="button" disabled={busy} onClick={async () => (await post({ action: 'averageValue', value })) && setOpen(false)} className={`${BTN} bg-blue-600 text-white`}>
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`${BTN} text-neutral-600`}>
          Cancel
        </button>
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/**
 * The client's past-patient / past-client list for the win-back texts (phase 3):
 * a CSV or Excel file, names and mobile numbers only, with the consent box. Other
 * columns are dropped in the browser (parseClientList) and again on the server.
 */
export function ListUpload({ api, people, privateDetails, software }: { api: string | null; people: string; privateDetails: string; software: string }) {
  const { post, busy, error } = usePost(api);
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const preview = csv ? parseClientList(csv.text) : null;

  async function pick(file: File | undefined) {
    setReadError(null);
    setCsv(null);
    if (!file) return;
    if (file.size > CLIENT_LIST_MAX_BYTES * 2) return setReadError('That file is too big. Keep it under 2,000 people.');
    try {
      const text = /\.xlsx$/i.test(file.name) ? await xlsxToCsv(file) : await file.text();
      setCsv({ name: file.name, text });
    } catch {
      setReadError('We could not read that file. Save it as CSV and try again.');
    }
  }

  // Only the kept columns leave the browser.
  const upload = () => preview && post({ action: 'uploadList', consent, csv: ['name,phone', ...preview.rows.map((r) => `"${r.name.replace(/"/g, '""')}",${r.phone}`)].join('\n') });

  if (!api) return <p className="text-sm text-neutral-500">The client uploads their list here.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700">
        A CSV or Excel export from your {software} works. We keep names and mobile numbers only, never {privateDetails}.
      </p>
      <input
        type="file"
        accept=".csv,.xlsx,text/csv"
        onChange={(e) => pick(e.target.files?.[0])}
        className="block w-full text-sm text-neutral-700 file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:text-sm file:font-semibold file:text-white"
      />
      {readError ? <p className="text-sm text-red-600">{readError}</p> : null}
      {preview ? (
        <p className="text-sm text-neutral-700">
          {preview.rows.length.toLocaleString('en-US')} {people} with a mobile number
          {preview.skipped.length ? ` · ${preview.skipped.length} rows skipped` : ''}
          {preview.ignored.length ? ` · ignored: ${preview.ignored.slice(0, 3).join(', ')}${preview.ignored.length > 3 ? '…' : ''}` : ''}
        </p>
      ) : null}
      <label className="flex items-start gap-2.5 text-sm text-neutral-800">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>These people agreed to hear from us.</span>
      </label>
      <button type="button" disabled={busy || !preview?.rows.length || !consent} onClick={upload} className={`${BTN} w-full bg-blue-600 text-white sm:w-auto`}>
        Upload the list
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
