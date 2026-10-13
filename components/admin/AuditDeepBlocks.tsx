// components/admin/AuditDeepBlocks.tsx
// The deep audit's five sections on screen (market, competitors, profile,
// reviews, crawl), rendered under the phase-1 blocks by AuditReadout. Each
// block says "not measured — reason" when its section errored; a quick audit
// has none of them and renders nothing here.
import type { ReactNode } from 'react';
import { isSectionError, section, type AuditResults, type Section } from '@/lib/auditShared';

function Block({ title, children, missing }: { title: string; children?: ReactNode; missing?: string | null }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h4>
      {missing ? <p className="mt-2 text-sm text-neutral-500">Not measured — {missing}</p> : <div className="mt-2">{children}</div>}
    </section>
  );
}
const missingOf = <T,>(s: Section<T> | undefined): string | null => (s === undefined ? null : isSectionError(s) ? s.error : null);
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const yesNo = (v: boolean | null) => (v === null ? '–' : v ? 'yes' : 'no');
const num = (v: number | null) => (v === null ? '–' : v.toLocaleString('en-US'));

export function AuditDeepBlocks({ results, city, variant = 'admin' }: { results: AuditResults; city: string; variant?: 'admin' | 'client' }) {
  const hasAny = results.market !== undefined || results.competitors !== undefined || results.profile !== undefined || results.reviews !== undefined || results.crawl !== undefined;
  if (!hasAny) return null;
  const market = section(results.market);
  const comps = section(results.competitors);
  const profile = section(results.profile);
  const reviews = section(results.reviews);
  const crawl = section(results.crawl);
  const admin = variant === 'admin';

  return (
    <div className="space-y-4">
      {results.market !== undefined ? (
        <Block title={`What people search in ${city}`} missing={missingOf(results.market)}>
          {market ? (
            <>
              <p className="text-sm text-neutral-800">
                Not showing up for <b>{num(market.missedSearches)}</b> searches a month · <b>{usd(market.missedAdValue)}/mo</b> if bought as ads
              </p>
              <table className="mt-2 w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-1 pr-2">Keyword</th>
                    <th className="py-1 pr-2 text-right">Searches/mo</th>
                    <th className="py-1 pr-2 text-right">CPC</th>
                    <th className="py-1 pr-2 text-right">Maps</th>
                    <th className="py-1 text-right">Web</th>
                  </tr>
                </thead>
                <tbody>
                  {market.keywords.slice(0, 15).map((k) => (
                    <tr key={k.keyword} className="border-t border-neutral-100">
                      <td className="py-1 pr-2">{k.keyword}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{num(k.volume)}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{k.cpc === null ? '–' : `$${k.cpc.toFixed(2)}`}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{k.measured ? (k.mapsRank === null ? 'not in 20' : `#${k.mapsRank}`) : ''}</td>
                      <td className="py-1 text-right tabular-nums">{k.measured ? (k.organicRank === null ? '–' : `#${k.organicRank}`) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </Block>
      ) : null}

      {results.competitors !== undefined ? (
        <Block title="You vs the top 3" missing={missingOf(results.competitors)}>
          {comps ? (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="py-1 pr-2">Business</th>
                  <th className="py-1 pr-2 text-right">Reviews</th>
                  <th className="py-1 pr-2 text-right">Photos</th>
                  <th className="py-1 pr-2 text-right">Booking</th>
                  {admin ? <th className="py-1 pr-2 text-right">Site keywords</th> : null}
                  {admin ? <th className="py-1 text-right">Site visits/mo</th> : null}
                </tr>
              </thead>
              <tbody>
                {comps.items.map((c) => (
                  <tr key={`${c.rank}-${c.name}`} className={`border-t border-neutral-100 ${c.self ? 'font-semibold text-blue-800' : ''}`}>
                    <td className="py-1 pr-2">
                      #{c.rank} {c.name}
                      {c.self ? ' (you)' : ''}
                    </td>
                    <td className="py-1 pr-2 text-right tabular-nums">{num(c.reviews)}{c.rating !== null ? ` · ${c.rating}★` : ''}</td>
                    <td className="py-1 pr-2 text-right tabular-nums">{num(c.photos)}</td>
                    <td className="py-1 pr-2 text-right">{yesNo(c.booking)}</td>
                    {admin ? <td className="py-1 pr-2 text-right tabular-nums">{num(c.organicKeywords)}</td> : null}
                    {admin ? <td className="py-1 text-right tabular-nums">{c.estTraffic === null ? '–' : num(Math.round(c.estTraffic))}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Block>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.profile !== undefined ? (
          <Block title="Google Business Profile" missing={missingOf(results.profile)}>
            {profile ? (
              <ul className="space-y-1 text-sm text-neutral-800">
                <li>Photos: <b>{num(profile.photos)}</b></li>
                <li>Claimed: <b>{yesNo(profile.claimed)}</b> · Booking link: <b>{yesNo(profile.booking)}</b></li>
                <li>Phone: <b>{yesNo(profile.phone)}</b> · Website: <b>{yesNo(profile.website)}</b> · Open days: <b>{num(profile.openDays)}</b></li>
                {profile.stars ? <li>Stars: {[5, 4, 3, 2, 1].map((s) => `${s}★ ${profile.stars?.[s as 1 | 2 | 3 | 4 | 5] ?? 0}`).join(' · ')}</li> : null}
                {profile.categories.length ? <li className="text-xs text-neutral-500">{profile.categories.join(' · ')}</li> : null}
              </ul>
            ) : null}
          </Block>
        ) : null}

        {results.reviews !== undefined ? (
          <Block title="Reviews" missing={missingOf(results.reviews)}>
            {reviews ? (
              <ul className="space-y-1 text-sm text-neutral-800">
                <li>New reviews: <b>{reviews.perMonth90d === null ? 'too few to say' : `~${reviews.perMonth90d}/mo`}</b> (last 90 days, from the newest {reviews.sampled})</li>
                <li>Owner replies: <b>{reviews.responseRate === null ? '–' : `${Math.round(reviews.responseRate * 100)}%`}</b> · 1–2★ share: <b>{reviews.lowStarShare === null ? '–' : `${Math.round(reviews.lowStarShare * 100)}%`}</b></li>
                {reviews.words.length ? <li className="text-xs text-neutral-500">Words reviewers use: {reviews.words.map((w) => `${w.word} (${w.count})`).join(', ')}</li> : null}
              </ul>
            ) : null}
          </Block>
        ) : null}
      </div>

      {results.crawl !== undefined ? (
        <Block title="Site crawl" missing={missingOf(results.crawl)}>
          {crawl ? (
            <>
              <p className="text-sm text-neutral-800">
                {crawl.pages.length} pages · <b>{crawl.broken.length}</b> broken · <b>{crawl.thin}</b> thin · <b>{crawl.untitled}</b> untitled
              </p>
              {crawl.coverage.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {crawl.coverage.map((c) => (
                    <li key={c.keyword} className={c.covered ? 'text-neutral-800' : 'text-red-700'}>
                      <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full ${c.covered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {c.covered ? `“${c.keyword}” has a page` : `No page for “${c.keyword}”`}
                      {c.url && admin ? <span className="ml-1 text-xs text-neutral-400">{c.url}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {admin && crawl.broken.length ? <p className="mt-2 text-xs text-neutral-500">Broken: {crawl.broken.slice(0, 5).join(', ')}</p> : null}
            </>
          ) : null}
        </Block>
      ) : null}
    </div>
  );
}
