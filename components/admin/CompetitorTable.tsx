// components/admin/CompetitorTable.tsx
// "You vs the top 3": stacked cards on a phone (a five-column table squeezes
// business names to one word per line), a table from tablet width up. Used by
// the deep readout and the pitch sheet; `detail` adds the site-strength columns.
import type { CompetitorProfile } from '@/lib/auditShared';

const num = (v: number | null) => (v === null ? '–' : v.toLocaleString('en-US'));
const yesNo = (v: boolean | null) => (v === null ? '–' : v ? 'yes' : 'no');

export function CompetitorTable({ items, selfLabel = 'you', detail = true }: { items: CompetitorProfile[]; selfLabel?: string; detail?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      {/* Phone: one card per business. */}
      <ul className="space-y-2 sm:hidden">
        {items.map((c) => (
          <li key={`${c.rank}-${c.name}`} className={`rounded-lg border px-3 py-2 ${c.self ? 'border-blue-200 bg-blue-50/60' : 'border-neutral-200 bg-white'}`}>
            <p className={`text-sm font-semibold ${c.self ? 'text-blue-800' : 'text-neutral-900'}`}>
              #{c.rank} {c.name}
              {c.self ? ` (${selfLabel})` : ''}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {num(c.reviews)} reviews{c.rating !== null ? ` · ${c.rating}★` : ''} · {num(c.photos)} photos · booking {yesNo(c.booking)}
            </p>
            {detail ? (
              <p className="text-xs text-neutral-500">
                {num(c.organicKeywords)} site keywords · {c.estTraffic === null ? '–' : num(Math.round(c.estTraffic))} site visits/mo
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {/* Tablet and up: the table. */}
      <table className="hidden w-full text-sm sm:table">
        <thead className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="py-1 pr-2">Business</th>
            <th className="py-1 pr-2 text-right">Reviews</th>
            <th className="py-1 pr-2 text-right">Photos</th>
            <th className="py-1 pr-2 text-right">Booking</th>
            {detail ? <th className="py-1 pr-2 text-right">Site keywords</th> : null}
            {detail ? <th className="py-1 text-right">Site visits/mo</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={`${c.rank}-${c.name}`} className={`border-t border-neutral-100 ${c.self ? 'font-semibold text-blue-800' : ''}`}>
              <td className="py-1 pr-2">
                #{c.rank} {c.name}
                {c.self ? ` (${selfLabel})` : ''}
              </td>
              <td className="py-1 pr-2 text-right tabular-nums whitespace-nowrap">
                {num(c.reviews)}
                {c.rating !== null ? ` · ${c.rating}★` : ''}
              </td>
              <td className="py-1 pr-2 text-right tabular-nums">{num(c.photos)}</td>
              <td className="py-1 pr-2 text-right">{yesNo(c.booking)}</td>
              {detail ? <td className="py-1 pr-2 text-right tabular-nums">{num(c.organicKeywords)}</td> : null}
              {detail ? <td className="py-1 text-right tabular-nums">{c.estTraffic === null ? '–' : num(Math.round(c.estTraffic))}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
