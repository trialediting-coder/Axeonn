// components/admin/AuditReadout.tsx
// One audit on screen: the money leaks, Maps rank with the top 3, organic rank,
// rating and reviews, the website checklist and the 5×5 grid. Every section
// that did not come back says "not measured" with the reason. `variant`
// 'client' hides cost, match method, raw errors and the location string.
import type { ReactNode } from 'react';
import { isNoSite, isSectionError, section, type AuditResults, type AuditRow, type GridResult, type Leak, type Section } from '@/lib/auditShared';
import { AuditDeepBlocks } from '@/components/admin/AuditDeepBlocks';

type Audit = Pick<AuditRow, 'subject' | 'results' | 'leaks' | 'errors' | 'status' | 'costUsd' | 'createdAt' | 'trigger'>;

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

const SEVERITY: Record<Leak['severity'], string> = {
  high: 'bg-red-50 text-red-800 border-red-200',
  medium: 'bg-amber-50 text-amber-900 border-amber-200',
  low: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};
const STATUS: Record<Audit['status'], string> = {
  complete: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-700',
};

function Block({ title, children, missing }: { title: string; children?: ReactNode; missing?: string | null }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h4>
      {missing ? <p className="mt-2 text-sm text-neutral-500">Not measured — {missing}</p> : <div className="mt-2">{children}</div>}
    </section>
  );
}

const missingOf = <T,>(s: Section<T> | undefined): string | null => (s === undefined ? 'not part of this audit' : isSectionError(s) ? s.error : null);

/** Rank 1–3 green, 4–10 amber, 11–20 orange, not listed grey. */
const cellTone = (rank: number | null) =>
  rank === null ? 'bg-neutral-100 text-neutral-400' : rank <= 3 ? 'bg-emerald-500 text-white' : rank <= 10 ? 'bg-amber-400 text-neutral-900' : 'bg-orange-500 text-white';

export function GridMap({ grid, caption }: { grid: GridResult; caption?: string }) {
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))`, maxWidth: 260 }}>
        {grid.points.map((p, i) => (
          <div key={i} className={`flex aspect-square items-center justify-center rounded text-xs font-bold tabular-nums ${cellTone(p.rank)}`} title={`${p.lat}, ${p.lng}`}>
            {p.rank ?? '–'}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-neutral-700">
        In the top 3 from <b>{Math.round(grid.top3Share * 100)}%</b> of the area
        {grid.avgRank !== null ? <> · average position <b>{grid.avgRank}</b></> : null}
        {caption ? <span className="text-neutral-500"> · {caption}</span> : null}
      </p>
    </div>
  );
}

export function AuditReadout({ audit, variant = 'admin' }: { audit: Audit; variant?: 'admin' | 'client' }) {
  const r: AuditResults = audit.results;
  const maps = section(r.maps);
  const org = section(r.organic);
  const rep = section(r.reputation);
  const grid = section(r.grid);
  const web = section(r.website);
  const admin = variant === 'admin';
  const s = audit.subject;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-bold text-neutral-950">{s.business}</span>
        <span className="text-neutral-600">
          “{s.keyword}” in {s.city}, {s.state}
        </span>
        <span className="text-neutral-500">{when(audit.createdAt)}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS[audit.status]}`}>{audit.status}</span>
        {admin ? <span className="text-xs text-neutral-400">{audit.trigger} · ${audit.costUsd.toFixed(3)}</span> : null}
      </div>

      {audit.leaks.length > 0 ? (
        <ul className="space-y-2">
          {audit.leaks.map((l, i) => (
            <li key={i} className={`rounded-xl border px-4 py-3 ${SEVERITY[l.severity]}`}>
              <p className="font-semibold">{l.headline}</p>
              <p className="mt-0.5 text-sm opacity-90">{l.detail}</p>
            </li>
          ))}
        </ul>
      ) : audit.status !== 'failed' ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Nothing measured here is costing you customers right now.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Google Maps" missing={missingOf(r.maps)}>
          {maps ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">{maps.found && maps.rank !== null ? `#${maps.rank}` : 'Not in top 20'}</p>
              {admin ? (
                <p className="text-xs text-neutral-500">
                  {maps.searched.location}
                  {maps.matchedBy ? ` · matched by ${maps.matchedBy}` : ''}
                </p>
              ) : null}
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {maps.top.map((c) => (
                    <tr key={`${c.rank}-${c.name}`} className={c.self ? 'font-semibold text-blue-800' : 'text-neutral-800'}>
                      <td className="w-8 py-1 tabular-nums">#{c.rank}</td>
                      <td className="py-1">
                        {c.name}
                        {c.self ? ' (you)' : ''}
                      </td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right tabular-nums text-neutral-600">
                        {c.rating ?? '–'} ★ · {c.reviews ?? '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </Block>

        <Block title="Rating & reviews" missing={missingOf(r.reputation)}>
          {rep ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">
                {rep.rating ?? '–'} <span className="text-base font-semibold text-neutral-500">★ · {rep.reviews ?? '–'} reviews</span>
              </p>
              {rep.categories.length ? <p className="mt-1 text-xs text-neutral-500">{rep.categories.join(' · ')}</p> : null}
              {rep.gbpUrl ? (
                <a href={rep.gbpUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:underline">
                  Open their Google listing
                </a>
              ) : null}
            </>
          ) : null}
        </Block>

        <Block title="Regular Google results" missing={missingOf(r.organic)}>
          {org ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">{org.rank !== null ? `#${org.rank}` : 'Not in top 20'}</p>
              <ol className="mt-2 space-y-1 text-sm text-neutral-700">
                {org.top.map((t) => (
                  <li key={t.rank}>
                    <span className="tabular-nums text-neutral-400">#{t.rank}</span> {t.domain} <span className="text-neutral-500">— {t.title}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </Block>

        <Block title="Website" missing={missingOf(r.website)}>
          {web && isNoSite(web) ? (
            <p className="text-sm font-semibold text-orange-800">No website</p>
          ) : web ? (
            <ul className="space-y-1 text-sm">
              <li className="truncate text-neutral-500">{web.url}</li>
              <Check ok={web.https} label="Secure (https)" />
              <Check ok={web.clickToCall} label="Tap-to-call button" />
              <Check ok={web.form} label="Contact form" />
              <Check ok={web.pagespeedMobile !== null && web.pagespeedMobile >= 50} label={web.pagespeedMobile !== null ? `Mobile speed ${web.pagespeedMobile}/100` : 'Mobile speed not measured'} />
              <Check ok={Boolean(web.title && web.metaDescription)} label="Page title and description" />
              <Check ok={web.schema.some((t) => /business|service|organization/i.test(t))} label={web.schema.length ? `Business markup (${web.schema.join(', ')})` : 'Business markup'} />
            </ul>
          ) : null}
        </Block>
      </div>

      {r.grid !== undefined ? (
        <Block title={`Where you show up across ${s.city}`} missing={missingOf(r.grid)}>
          {grid ? <GridMap grid={grid} caption={`${grid.size}×${grid.size} points, ${grid.spacingMiles} mile apart`} /> : null}
        </Block>
      ) : null}

      <AuditDeepBlocks results={r} city={s.city} variant={variant} />

      {admin && Object.keys(audit.errors).length ? (
        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer">What did not come back</summary>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(audit.errors).map(([k, v]) => (
              <li key={k}>
                <b>{k}:</b> {v}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-neutral-800' : 'text-red-700'}`}>
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}
    </li>
  );
}
