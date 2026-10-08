// lib/reportCopy.ts
// The words around the numbers in the monthly report: the one-sentence headline,
// the month's wins, the standing work each plan includes, and the "worth about"
// figure. Pure, so lib/siteStats.test.ts can pin the wording down. Follows
// content/brand-guardrails.md: plain language, no "conversion", no invented
// results, and nothing a client could read as a promise.
import type { OnboardingTier } from '@/data/onboardingItems';
import { campaignLabel, sourceLabel, type TrafficSummary } from '@/lib/projectsShared';

export const TAGLINE = 'We Get You Customers, Not Clicks.';

export const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

const pageName = (path: string) => (path === '/' ? 'home' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

/** "about $11,700 in work" from the estimated customers and the client's average job, or null when unset. */
export function estimatedValue(t: TrafficSummary, avgJobValue: number | null | undefined): { low: number; mid: number; high: number } | null {
  if (!avgJobValue || avgJobValue <= 0 || t.estimatedCustomers <= 0) return null;
  return {
    low: (t.customersLow ?? t.estimatedCustomers) * avgJobValue,
    mid: t.estimatedCustomers * avgJobValue,
    high: (t.customersHigh ?? t.estimatedCustomers) * avgJobValue,
  };
}

/**
 * The first thing the client reads. Leads with people, then customers, then
 * money, then the change since last month. Honest when the month was quiet.
 */
export function headlineSentence(input: {
  business: string;
  monthLabel: string;
  prevMonthLabel?: string | null;
  traffic: TrafficSummary;
  prev?: TrafficSummary | null;
  avgJobValue?: number | null;
}): string {
  const { traffic: t, prev, business } = input;
  if (t.conversions > 0) {
    let s = `${t.conversions} ${t.conversions === 1 ? 'person' : 'people'} reached out to ${business} through your website in ${input.monthLabel}`;
    if (t.estimatedCustomers > 0) {
      s += `, and about ${t.estimatedCustomers} of them likely became new customers`;
      const v = estimatedValue(t, input.avgJobValue);
      if (v) s += `, worth around ${money(v.mid)} in work`;
    }
    s += '.';
    if (prev && prev.conversions > 0) {
      const diff = t.conversions - prev.conversions;
      const when = input.prevMonthLabel ?? 'last month';
      s += diff === 0 ? ` That matches ${when}.` : ` That is ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} from ${when}.`;
    }
    return s;
  }
  if (t.views > 0) {
    return `${t.visitors} ${t.visitors === 1 ? 'person' : 'people'} visited ${business}'s website in ${input.monthLabel}. Nobody has reached out through it yet, so below is what we are doing about that.`;
  }
  return `Here is where ${business} stands after ${input.monthLabel}, and what we are doing next.`;
}

/**
 * Up to three one-line wins, best first. Only facts the data supports; a quiet
 * month simply yields fewer lines.
 */
export function reportHighlights(input: {
  traffic: TrafficSummary;
  prev?: TrafficSummary | null;
  report: { rank: number | null; keyword: string; reviews: number | null; rating: number | null };
  prevReport?: { rank: number | null } | null;
}): string[] {
  const { traffic: t, prev, report } = input;
  const d = t.detail && t.detail.sessions > 0 ? t.detail : null;
  const out: string[] = [];
  const push = (s: string | null | undefined) => {
    if (s && out.length < 3) out.push(s);
  };

  if (report.rank != null && report.keyword) {
    const was = input.prevReport?.rank;
    if (report.rank === 1) push(`You are #1 on Google for “${report.keyword}”${was != null && was > 1 ? `, up from #${was}` : ''}.`);
    else if (was != null && was > report.rank) push(`You moved from #${was} to #${report.rank} on Google for “${report.keyword}”.`);
    else push(`You rank #${report.rank} on Google for “${report.keyword}”.`);
  }
  if (prev && prev.views > 0 && t.views > 0) {
    const pct = Math.round(((t.views - prev.views) / prev.views) * 100);
    if (pct >= 10) push(`Website visits are up ${pct}% (${t.views} this month, ${prev.views} last month).`);
  }
  const bestPage = d?.landing.filter((l) => l.conversions > 0 && l.path !== '/').sort((a, b) => b.conversions - a.conversions)[0];
  if (bestPage) push(`Your ${pageName(bestPage.path)} page alone brought ${bestPage.conversions} ${bestPage.conversions === 1 ? 'person' : 'people'} to reach out.`);
  const bestCampaign = d?.campaigns.filter((c) => c.conversions > 0).sort((a, b) => b.conversions - a.conversions)[0];
  if (bestCampaign) push(`${campaignLabel(bestCampaign)} sent ${bestCampaign.sessions} visitors, and ${bestCampaign.conversions} of them reached out.`);
  const top = t.sources[0];
  if (top && top.count > 0) {
    const name = sourceLabel(top.host);
    push(name === 'Google' ? `Google put you in front of ${top.count} ${top.count === 1 ? 'person' : 'people'} this month.` : `Most people found you through ${name} (${top.count} visits).`);
  }
  if (report.reviews != null && report.reviews > 0) {
    push(`${report.reviews} new ${report.reviews === 1 ? 'review' : 'reviews'}${report.rating != null ? `, and your rating stands at ${report.rating}` : ''}.`);
  }
  if (d?.returningVisitors) push(`${d.returningVisitors} ${d.returningVisitors === 1 ? 'person' : 'people'} came back a second time before deciding.`);
  if (d?.speedMs && d.speedMs <= 2500) push(`Your pages loaded in about ${(d.speedMs / 1000).toFixed(1)} seconds for a typical visitor.`);
  return out;
}

/**
 * The work each plan includes that runs whether or not anything shipped this
 * month. From content/brand-guardrails.md, in plain words.
 */
export const ALWAYS_ON: Record<OnboardingTier, readonly string[]> = {
  essentials: [
    'hosting, security and backups',
    'your Google Business Profile kept current',
    'showing up on Google and in AI answers',
    'a quote form with instant lead alerts',
  ],
  axeoncore: [
    'hosting, security and backups',
    'your Google Business Profile kept current',
    'showing up on Google and in AI answers',
    'instant call-back and missed-call text-back',
    'AI chat and online scheduling',
    'tracked phone numbers',
    'review requests after every job',
    'automatic text and email follow-up, with one list of every lead',
  ],
  axeongrowth: [
    'hosting, security and backups',
    'your Google Business Profile kept current',
    'showing up on Google and in AI answers',
    'Google and Meta ads managed daily',
    'an AI phone receptionist',
    'instant call-back and missed-call text-back',
    'AI chat and online scheduling',
    'tracked phone numbers',
    'review requests after every job',
    'a new service page every month',
  ],
};

/** "hosting, security and backups; your Google Business Profile kept current; …" as one sentence. */
export function alwaysOnSentence(tier: OnboardingTier): string {
  const items = ALWAYS_ON[tier];
  const list = items.length > 1 ? `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}` : items[0];
  return `Running every day in the background: ${list}.`;
}
