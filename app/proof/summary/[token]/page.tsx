// app/proof/summary/[token]/page.tsx
// The no-password monthly executive summary (AxeonPROOF v2), opened from the
// link emailed and texted on the 1st (app/api/cron/proof-v2). The signed token
// (lib/proofSummaryLink.ts) names one client and one month; this page shows
// only that, creates no session, and logs the open for the front-desk card.
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { CalendarCheck, PhoneCall, Search, Star } from 'lucide-react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { VersionTag } from '@/components/common/VersionTag';
import { proofVersionInfo } from '@/data/dashboardVersions';
import { getOnboardingById } from '@/lib/onboarding';
import { readSummaryToken } from '@/lib/proofSummaryLink';
import { logSummaryAccess, monthSummary } from '@/lib/proofV2';
import { monthLabel } from '@/lib/projectsShared';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Your monthly summary | AxeonPROOF' }, robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' };

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function Expired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F5F8] px-4">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <AxeonLogo product="PROOF" size="sm" />
        <h1 className="mt-4 text-lg font-bold text-neutral-950">This summary link has expired</h1>
        <p className="mt-2 text-sm text-neutral-600">Links work for 45 days. Sign in to see this month and every month before it.</p>
        <a href={APP_ORIGIN} className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">
          Sign in to AxeonPROOF
        </a>
      </div>
    </main>
  );
}

export default async function SummaryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let claim: ReturnType<typeof readSummaryToken> = null;
  try {
    claim = readSummaryToken(decodeURIComponent(token));
  } catch {
    claim = null;
  }
  if (!claim) return <Expired />;
  const onboarding = await getOnboardingById(claim.onboardingId).catch(() => null);
  if (!onboarding || onboarding.status === 'closed' || onboarding.proofVersion !== 2) return <Expired />;
  const s = await monthSummary(onboarding, claim.month);
  // An admin checking the link (signed in to /admin) is not a client open.
  const admin = await auth().catch(() => null);
  if (!admin) await logSummaryAccess(onboarding.id, claim.month, claim.recipient, (await headers()).get('user-agent') ?? '').catch(() => undefined);
  const name = onboarding.businessName || 'Your business';
  const booked = s.dbrBooked + s.webBooked;
  const tiles = [
    { icon: PhoneCall, label: 'Missed calls rescued', value: String(s.rescued), sub: s.missed ? `${s.missed} missed · ${s.textedBack} auto-texted · rescued = the caller wrote or called back` : 'No missed calls this month' },
    { icon: CalendarCheck, label: 'Booked from win-back texts + website', value: String(booked), sub: s.pipelineDollars != null ? `${money(s.pipelineDollars)} pipeline, estimated from your values` : `${s.dbrBooked} win-back · ${s.webBooked} website` },
    { icon: Star, label: 'New Google reviews', value: s.newReviews != null ? `${s.newReviews >= 0 ? '+' : ''}${s.newReviews}` : '—', sub: s.newReviews != null ? `${s.reviewRequests} review requests sent` : `${s.reviewRequests} requests sent · counted after two review scans` },
    { icon: Search, label: 'Seen in Google search', value: s.impressions != null ? s.impressions.toLocaleString('en-US') : '—', sub: s.impressions != null ? (s.topKeywords.length ? `Top: ${s.topKeywords.join(', ')}` : `${s.clicks ?? 0} clicks`) : 'Tracked from month 3 of your schedule' },
  ];
  return (
    <main className="min-h-screen bg-[#F3F5F8] px-4 pb-10 pt-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <AxeonLogo product="PROOF" size="sm" />
        <p className="mt-5 text-sm text-neutral-500">Monthly executive summary</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-950">
          {name}, {monthLabel(s.month)}
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {tiles.map((t) => (
            <section key={t.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <t.icon size={18} className="text-blue-600" />
              <p className="mt-2 text-xs font-medium text-neutral-500">{t.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-950">{t.value}</p>
              <p className="mt-1 text-[11px] leading-snug text-neutral-500">{t.sub}</p>
            </section>
          ))}
        </div>
        <p className="mt-5 text-xs text-neutral-500">Read-only. This link shows only this summary and stops working 45 days after it was sent.</p>
        <a href={`${APP_ORIGIN}/?tab=program`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white sm:w-auto sm:px-5">
          Sign in for the full dashboard
        </a>
        <VersionTag version={proofVersionInfo(2)} className="mt-8" />
      </div>
    </main>
  );
}
