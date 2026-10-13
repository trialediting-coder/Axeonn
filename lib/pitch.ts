// lib/pitch.ts
// The sales view of an audit, boiled down: the headline numbers a call needs and
// a ≤ 12-line plain-text version for a text or email. Pure, client-safe; every
// line comes from a measured section and is left out when the section is missing.
import { isNoSite, section, type AuditResults, type AuditSubject } from '@/lib/auditShared';
import type { PlanDraft } from '@/lib/planRules';

export interface PitchNumbers {
  missedSearches: number | null;
  missedAdValue: number | null;
  myReviews: number | null;
  top3AvgReviews: number | null;
  reviewGap: number | null;
  velocity: number | null;
  rank: number | null;
  found: boolean | null;
  gridShare: number | null;
  /** How many of the six site basics are in place (https, tap-to-call, form, speed ≥ 50, schema, title+description); null without a site. */
  siteBasics: number | null;
}

const avg = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export function pitchNumbers(audit: { results: AuditResults }): PitchNumbers {
  const r = audit.results;
  const maps = section(r.maps);
  const rep = section(r.reputation);
  const grid = section(r.grid);
  const market = section(r.market);
  const reviews = section(r.reviews);
  const web = section(r.website);
  const site = web && !isNoSite(web) ? web : null;
  const top3 = maps?.top.filter((c) => !c.self && c.rank <= 3) ?? [];
  const top3AvgReviews = avg(top3.map((c) => c.reviews));
  const myReviews = rep?.reviews ?? null;
  const basics = site
    ? [site.https, site.clickToCall, site.form, site.pagespeedMobile !== null && site.pagespeedMobile >= 50, site.schema.some((t) => /business|service|organization/i.test(t)), Boolean(site.title && site.metaDescription)].filter(Boolean).length
    : null;
  return {
    missedSearches: market?.missedSearches ?? null,
    missedAdValue: market?.missedAdValue ?? null,
    myReviews,
    top3AvgReviews: top3AvgReviews === null ? null : Math.round(top3AvgReviews),
    reviewGap: top3AvgReviews !== null && myReviews !== null ? Math.max(0, Math.round(top3AvgReviews) - myReviews) : null,
    velocity: reviews?.perMonth90d ?? null,
    rank: maps && maps.found ? maps.rank : null,
    found: maps ? maps.found : null,
    gridShare: grid?.top3Share ?? null,
    siteBasics: basics,
  };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** ≤ 12 plain lines: who, the three money numbers, the top 3, the site, and what we'd do first. */
export function pitchText(audit: { results: AuditResults; subject: Pick<AuditSubject, 'business' | 'city' | 'keyword'> }, drafts: PlanDraft[]): string {
  const n = pitchNumbers(audit);
  const maps = section(audit.results.maps);
  const web = section(audit.results.website);
  const city = audit.subject.city;
  const lines: string[] = [`${audit.subject.business} — "${audit.subject.keyword}" in ${city}`];
  if (n.missedSearches !== null && n.missedAdValue !== null) lines.push(`Missing ~${n.missedSearches.toLocaleString('en-US')} searches/mo they could show up for (worth ~${usd(n.missedAdValue)}/mo in ads)`);
  if (n.found !== null) {
    const rank = n.found && n.rank !== null ? `#${n.rank} on Google Maps` : 'Not in the Google Maps top 20';
    lines.push(n.gridShare !== null ? `${rank} · in the top 3 from ${pct(n.gridShare)} of ${city}` : rank);
  }
  if (n.myReviews !== null && n.top3AvgReviews !== null) lines.push(`${n.myReviews} reviews vs the top 3's ${n.top3AvgReviews}${n.velocity !== null ? ` · adding ~${n.velocity}/mo` : ''}`);
  const top3 = maps?.top.filter((c) => !c.self && c.rank <= 3) ?? [];
  if (top3.length) lines.push(`Top 3: ${top3.map((c) => `${c.name} (${c.reviews ?? '–'})`).join(', ')}`);
  if (web) lines.push(isNoSite(web) ? 'No website' : `Site: ${n.siteBasics ?? 0} of 6 basics in place`);
  if (drafts.length) {
    lines.push("What we'd do first:");
    for (const d of drafts.slice(0, 3)) lines.push(`• ${d.title}`);
  }
  return lines.slice(0, 12).join('\n');
}
