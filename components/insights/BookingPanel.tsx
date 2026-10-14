// The Online booking card on a client's admin page: open hours per day, slot
// length, buffer, how far ahead, the services people pick from, an optional line
// for the confirmation text, the two snippets for the client's site, and the
// upcoming bookings with Done / Cancel. Times show in the client's time zone.
'use client';

import { useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { CONFIRM_NOTE_MAX, WEEKDAYS, WEEKDAY_NAMES, formatSlotLabel, type AdminBookingData, type BookingHours, type Weekday } from '@/lib/bookingShared';
import { formatPhone } from '@/lib/phoneShared';

type DayRow = { open: boolean; from: string; to: string };

function rowsFrom(hours: BookingHours): Record<Weekday, DayRow> {
  const out = {} as Record<Weekday, DayRow>;
  for (const d of WEEKDAYS) {
    const first = hours[d]?.[0];
    out[d] = first ? { open: true, from: first[0], to: first[1] } : { open: false, from: '08:00', to: '17:00' };
  }
  return out;
}

function hoursFrom(rows: Record<Weekday, DayRow>): BookingHours {
  const out: BookingHours = {};
  for (const d of WEEKDAYS) if (rows[d].open) out[d] = [[rows[d].from, rows[d].to]];
  return out;
}

const SOURCE: Record<string, string> = { widget: 'Online', chat: 'Chat', manual: 'Added by hand' };

export function BookingPanel({ token, tier, initial }: { token: string; tier: string; initial: AdminBookingData }) {
  const [data, setData] = useState<AdminBookingData>(initial);
  const [enabled, setEnabled] = useState(initial.settings.enabled);
  const [slotMinutes, setSlotMinutes] = useState(String(initial.settings.slotMinutes));
  const [bufferMinutes, setBufferMinutes] = useState(String(initial.settings.bufferMinutes));
  const [leadDays, setLeadDays] = useState(String(initial.settings.leadDays));
  const [services, setServices] = useState(initial.settings.serviceNames.join('\n'));
  const [note, setNote] = useState(initial.settings.confirmMessage ?? '');
  const [rows, setRows] = useState(() => rowsFrom(initial.settings.hours));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (tier === 'essentials') return null;

  async function send(method: 'PUT' | 'POST', body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/booking`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as AdminBookingData & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
      if (method === 'PUT') setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  const setRow = (d: Weekday, patch: Partial<DayRow>) => setRows((r) => ({ ...r, [d]: { ...r[d], ...patch } }));
  const save = () =>
    send('PUT', {
      enabled,
      slotMinutes: Number(slotMinutes),
      bufferMinutes: Number(bufferMinutes),
      leadDays: Number(leadDays),
      serviceNames: services,
      confirmMessage: note,
      hours: hoursFrom(rows),
    });
  const pageUrl = data.siteKey ? `${SITE_ORIGIN}/b/${data.siteKey}` : null;
  const embed = data.siteKey
    ? `<div data-axeon-book data-site="${data.siteKey}">Call us to book.</div>\n<script defer src="${SITE_ORIGIN}/book.js"></script>`
    : null;

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Online booking</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{data.settings.enabled ? 'Taking bookings' : 'Off'}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.settings.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
          Times in {data.timeZone}
        </span>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-emerald-700">Saved.</p> : null}

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Let people book online
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className={adminLabel}>Slot length (minutes)</label>
          <input className={adminInput} inputMode="numeric" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} />
        </div>
        <div>
          <label className={adminLabel}>Buffer after each (minutes)</label>
          <input className={adminInput} inputMode="numeric" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} />
        </div>
        <div>
          <label className={adminLabel}>Days ahead</label>
          <input className={adminInput} inputMode="numeric" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <p className={adminLabel}>Open for bookings</p>
        <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {WEEKDAYS.map((d) => (
            <div key={d} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <label className="flex w-32 items-center gap-2">
                <input type="checkbox" checked={rows[d].open} onChange={(e) => setRow(d, { open: e.target.checked })} /> {WEEKDAY_NAMES[d]}
              </label>
              {rows[d].open ? (
                <>
                  <input type="time" className={`${adminInput} w-32`} value={rows[d].from} onChange={(e) => setRow(d, { from: e.target.value })} aria-label={`${WEEKDAY_NAMES[d]} opens`} />
                  <span className="text-neutral-500">to</span>
                  <input type="time" className={`${adminInput} w-32`} value={rows[d].to} onChange={(e) => setRow(d, { to: e.target.value })} aria-label={`${WEEKDAY_NAMES[d]} closes`} />
                </>
              ) : (
                <span className="text-neutral-500">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabel}>Services people pick from (one per line, blank = no picker)</label>
          <textarea className={`${adminInput} min-h-24`} value={services} onChange={(e) => setServices(e.target.value)} placeholder={'Full detail\nInterior detail\nCeramic coating estimate'} />
        </div>
        <div>
          <label className={adminLabel}>Line added to the confirmation text (optional)</label>
          <textarea className={`${adminInput} min-h-24`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={CONFIRM_NOTE_MAX} placeholder="Please park in the side lot." />
        </div>
      </div>

      <div className="mt-3">
        <button className={btn('primary', 'sm')} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save booking settings'}
        </button>
      </div>

      {pageUrl && embed ? (
        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">On the client&apos;s site</p>
          <p className="mt-1">
            Booking page (link it from a button or their Google listing):{' '}
            <a className="text-blue-700 underline" href={pageUrl} target="_blank" rel="noreferrer">{pageUrl}</a>
          </p>
          <p className="mt-2">Or put it inside a page. The text inside the div shows until the booking page loads, and stays if it cannot:</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-3 text-xs">{embed}</pre>
        </div>
      ) : (
        <p className="mt-5 text-sm text-amber-900">This client has no site key yet. Set up website tracking first; booking uses the same key.</p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr><th className="py-1 pr-3">When</th><th className="py-1 pr-3">Who</th><th className="py-1 pr-3">Service</th><th className="py-1 pr-3">How</th><th className="py-1" /></tr>
          </thead>
          <tbody>
            {data.upcoming.length === 0 ? (
              <tr><td colSpan={5} className="py-3 text-neutral-500">No upcoming bookings.</td></tr>
            ) : (
              data.upcoming.map((b) => (
                <tr key={b.id} className="border-t border-neutral-100">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatSlotLabel(b, data.timeZone)}</td>
                  <td className="py-1.5 pr-3">{b.contactName}<br /><span className="text-neutral-500">{formatPhone(b.phone)}</span></td>
                  <td className="py-1.5 pr-3">{b.service || '—'}</td>
                  <td className="py-1.5 pr-3">{SOURCE[b.source] ?? b.source}</td>
                  <td className="py-1.5 whitespace-nowrap text-right">
                    <button className={btn('success', 'sm')} disabled={busy} onClick={() => send('POST', { action: 'done', id: b.id })}>Done</button>{' '}
                    <button
                      className={btn('danger', 'sm')}
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Cancel ${b.contactName}'s booking? They get a text saying so.`)) void send('POST', { action: 'cancel', id: b.id });
                      }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
