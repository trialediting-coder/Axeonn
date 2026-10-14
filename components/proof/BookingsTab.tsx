// components/proof/BookingsTab.tsx
// The client's Bookings tab once their plan includes online booking: this month
// against last, and the next seven days. Names are first name and last initial,
// numbers are masked: this screen gets screenshotted.
import { monthLabel } from '@/lib/projectsShared';
import { formatSlotLabel, type DashboardBookings } from '@/lib/bookingShared';

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
const STATUS = { booked: 'Booked', done: 'Done', cancelled: 'Cancelled' } as const;
const HOW = { widget: 'Online', chat: 'Website chat', manual: 'Added by hand' } as const;

export function BookingsTab({ bookings }: { bookings: DashboardBookings }) {
  const t = bookings.thisMonth;
  const l = bookings.lastMonth;
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Bookings</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        {bookings.enabled ? (
          <>
            People can book themselves on your site, day or night, and get a reminder before they come.{' '}
            {bookings.bookUrl ? (
              <a className="font-semibold text-blue-600 hover:text-blue-700" href={bookings.bookUrl} target="_blank" rel="noopener">
                Open your booking page
              </a>
            ) : null}
          </>
        ) : (
          'Online booking is being set up. Axeon turns it on once your hours and services are in.'
        )}
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">{monthLabel(t.month)} so far</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Booked online" value={String(t.booked)} sub={delta(t.booked, l.booked)} />
        <Stat label="Through website chat" value={String(t.byChat)} sub={t.booked ? `${Math.round((t.byChat / t.booked) * 100)}% of bookings` : null} />
        <Stat label="Done" value={String(t.done)} sub="marked finished" />
        <Stat label="Cancelled" value={String(t.cancelled)} sub={t.booked ? `${t.booked - t.cancelled} still on` : null} />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">Next 7 days</p>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {bookings.next7.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">Nothing booked in the next week yet. New bookings show up here the minute they happen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Who</th><th className="px-4 py-2">Service</th><th className="px-4 py-2">How</th><th className="px-4 py-2">Status</th></tr>
            </thead>
            <tbody>
              {bookings.next7.map((b) => (
                <tr key={b.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 whitespace-nowrap">{formatSlotLabel(b, bookings.timeZone)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.who}<br /><span className="text-neutral-500">{b.phone}</span></td>
                  <td className="px-4 py-2">{b.service || '—'}</td>
                  <td className="px-4 py-2">{HOW[b.source]}</td>
                  <td className="px-4 py-2">{STATUS[b.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
