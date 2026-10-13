// components/proof/CallsTab.tsx
// The client's Calls tab once their tracked number exists: this month against
// last, and the latest calls with the caller's last two digits hidden. Recordings
// play through the signed-in /api/proof/recording route, never a raw Twilio URL.
import { monthLabel } from '@/lib/projectsShared';
import { callerLabel, callResultLabel, formatCallLength, formatCallWhen, formatPhone } from '@/lib/phoneShared';
import type { DashboardPhone } from '@/lib/proofDashboardData';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">{value}</p>
      {sub ? <p className="mt-2 text-xs text-neutral-500">{sub}</p> : null}
    </div>
  );
}

const delta = (now: number, before: number) => `${now - before >= 0 ? '+' : '−'}${Math.abs(now - before)} vs last month`;

export function CallsTab({ phone, preview = false }: { phone: DashboardPhone; preview?: boolean }) {
  const t = phone.thisMonth;
  const l = phone.lastMonth;
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Calls</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Your tracked number is {formatPhone(phone.number)}. Every call to it rings your phone.{' '}
        {phone.textBack ? 'Anyone you miss gets a text back within a minute.' : 'Missed calls will get a text back once your texting is approved.'}
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">{monthLabel(t.month)} so far</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls" value={String(t.calls)} sub={delta(t.calls, l.calls)} />
        <Stat label="Answered" value={String(t.answered)} sub={t.calls ? `${Math.round((t.answered / t.calls) * 100)}% picked up` : null} />
        <Stat label="Missed, texted back" value={String(t.textedBack)} sub={t.missed > t.textedBack ? `${t.missed - t.textedBack} missed, no text sent` : null} />
        <Stat label="Average call" value={formatCallLength(t.avgSeconds)} sub="answered calls" />
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {phone.recent.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No calls yet. They show up here the minute they happen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Caller</th><th className="px-4 py-2">Result</th><th className="px-4 py-2">Length</th><th className="px-4 py-2">Recording</th></tr>
            </thead>
            <tbody>
              {phone.recent.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 whitespace-nowrap">{formatCallWhen(c.startedAt)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{callerLabel(c.fromNumber)}</td>
                  <td className="px-4 py-2">{callResultLabel(c)}</td>
                  <td className="px-4 py-2">{formatCallLength(c.durationSeconds)}</td>
                  <td className="px-4 py-2">
                    {!c.hasRecording ? '—' : preview ? (
                      <span className="text-neutral-500">Recorded</span>
                    ) : (
                      <audio controls preload="none" aria-label="Call recording" className="h-8 w-56" src={`/api/proof/recording/${encodeURIComponent(c.callSid)}`} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
