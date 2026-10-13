// The Phone card on a client's admin page: provision the tracked number from
// the portal's phone-setup answers, tune forwarding / recording / text-back,
// flip the 10DLC gate once Twilio approves the campaign, and see recent calls
// with this month's running cost.
'use client';

import { useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import type { PhoneCall, PhoneLine } from '@/lib/phoneShared';
import { areaCodeOf, callerLabel, callResultLabel, formatCallLength, formatCallWhen, formatPhone, normalizePhone, textBackMessage as textBackPreview } from '@/lib/phoneShared';

export interface PhoneData {
  line: PhoneLine | null;
  calls: PhoneCall[];
  cost: { calls: number; minutes: number; texts: number; estimate: number } | null;
}

interface Asked {
  mainNumber: string;
  trackingPreference: string;
  answerers: string;
}

export function PhonePanel({ token, tier, initial, asked, businessName }: { token: string; tier: string; initial: PhoneData; asked: Asked; businessName: string | null }) {
  const [data, setData] = useState<PhoneData>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const askedNumber = normalizePhone(asked.mainNumber);
  const [areaCode, setAreaCode] = useState((askedNumber && areaCodeOf(askedNumber)) || '515');
  const [forwardTo, setForwardTo] = useState(data.line?.forwardTo ?? askedNumber ?? '');
  const [recordCalls, setRecordCalls] = useState(data.line?.recordCalls ?? true);
  const [consentNotice, setConsentNotice] = useState(data.line?.consentNotice ?? true);
  const [textBackEnabled, setTextBackEnabled] = useState(data.line?.textBackEnabled ?? true);
  const [textBackMessage, setTextBackMessage] = useState(data.line?.textBackMessage ?? '');

  if (tier === 'essentials') return null;

  async function send(method: 'POST' | 'PUT', body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/phone`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as PhoneData & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  const line = data.line;
  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tracked phone number</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{line ? formatPhone(line.phoneNumber) : 'Not provisioned yet'}</h2>
        </div>
        {line ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${line.smsStatus === 'ready' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            {line.smsStatus === 'ready' ? 'Texting approved (10DLC)' : 'Texting pending 10DLC approval'}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
        <p className="font-semibold text-neutral-900">From their setup portal</p>
        <p className="mt-1">Main number: {asked.mainNumber || '—'}</p>
        <p>Tracking: {asked.trackingPreference || '—'}</p>
        <p className="whitespace-pre-line">Answers calls: {asked.answerers || '—'}</p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {!line ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
          <div>
            <label className={adminLabel}>Area code</label>
            <input className={adminInput} value={areaCode} onChange={(e) => setAreaCode(e.target.value)} inputMode="numeric" maxLength={3} />
          </div>
          <div>
            <label className={adminLabel}>Forward calls to</label>
            <input className={adminInput} value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} placeholder="(515) 555-0134" />
          </div>
          <button className={btn('primary')} disabled={busy} onClick={() => send('POST', { action: 'provision', areaCode, forwardTo })}>
            {busy ? 'Buying…' : 'Provision number'}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>Forward calls to</label>
              <input className={adminInput} value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={recordCalls} onChange={(e) => setRecordCalls(e.target.checked)} /> Record calls</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={consentNotice} onChange={(e) => setConsentNotice(e.target.checked)} /> Play recording notice</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={textBackEnabled} onChange={(e) => setTextBackEnabled(e.target.checked)} /> Missed-call text-back</label>
            </div>
            <div className="sm:col-span-2">
              <label className={adminLabel}>Text-back message (blank = default)</label>
              <textarea className={`${adminInput} min-h-20`} value={textBackMessage} onChange={(e) => setTextBackMessage(e.target.value)} placeholder={textBackPreview(businessName, null)} maxLength={320} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btn('primary', 'sm')} disabled={busy} onClick={() => send('PUT', { forwardTo, recordCalls, consentNotice, textBackEnabled, textBackMessage })}>Save settings</button>
            <button className={btn(line.smsStatus === 'ready' ? 'warning' : 'success', 'sm')} disabled={busy} onClick={() => send('POST', { action: 'sms', status: line.smsStatus === 'ready' ? 'pending' : 'ready' })}>
              {line.smsStatus === 'ready' ? 'Mark texting pending' : 'Mark 10DLC approved'}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Messaging Service {line.messagingServiceSid}. Submit the 10DLC brand and campaign for it in the Twilio console, then press “Mark 10DLC approved”. No automated text goes out before that.</p>

          {data.cost ? (
            <p className="mt-4 text-sm text-neutral-700">
              This month: {data.cost.calls} calls, {data.cost.minutes} min, {data.cost.texts} texts — about ${data.cost.estimate.toFixed(2)} in Twilio usage.
            </p>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr><th className="py-1 pr-3">When</th><th className="py-1 pr-3">From</th><th className="py-1 pr-3">Result</th><th className="py-1 pr-3">Length</th><th className="py-1">Recording</th></tr>
              </thead>
              <tbody>
                {data.calls.length === 0 ? (
                  <tr><td colSpan={5} className="py-3 text-neutral-500">No calls yet.</td></tr>
                ) : (
                  data.calls.map((c) => (
                    <tr key={c.id} className="border-t border-neutral-100">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{formatCallWhen(c.startedAt)}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{callerLabel(c.fromNumber)}</td>
                      <td className="py-1.5 pr-3">{callResultLabel(c)}</td>
                      <td className="py-1.5 pr-3">{formatCallLength(c.durationSeconds)}</td>
                      <td className="py-1.5">
                        {c.hasRecording ? <audio controls preload="none" className="h-8 w-48" src={`/api/admin/onboarding/${token}/phone/recording/${c.callSid}`} /> : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
