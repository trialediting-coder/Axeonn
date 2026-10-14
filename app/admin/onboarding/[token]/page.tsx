import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminMain, btn } from '@/components/admin/ui';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { computeProgress, getItemStates, getOnboardingByToken, orderedItems, welcomeUrl } from '@/lib/onboarding';
import { OnboardingDetail } from '@/components/insights/OnboardingDetail';
import { ProjectPanel } from '@/components/insights/ProjectPanel';
import { getProjectDetails, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import { monthOf, trackingOverview } from '@/lib/siteStats';
import { listFeedback } from '@/lib/feedback';
import { getUpgradeRequest } from '@/lib/upgrades';
import { TIER_LABELS } from '@/data/onboardingItems';
import { BusinessEmailPanel } from '@/components/insights/BusinessEmailPanel';
import { getBusinessEmail } from '@/lib/businessEmail';
import { PhonePanel } from '@/components/insights/PhonePanel';
import { SequencesPanel } from '@/components/insights/SequencesPanel';
import { sequencesAdminData } from '@/lib/sequences';
import { getLine, monthCost, recentCalls } from '@/lib/phoneLines';
import { BookingPanel } from '@/components/insights/BookingPanel';
import { adminBookingData } from '@/lib/bookings';
import { ChatPanel } from '@/components/insights/ChatPanel';
import { adminChatData } from '@/lib/chat';
import { getAuditSettings, listAuditsForOnboarding } from '@/lib/audits';
import { listPlan } from '@/lib/plans';
import { MetaPanel } from '@/components/insights/MetaPanel';
import { isMetaConfigured } from '@/lib/meta';
import { pagesFor } from '@/lib/metaPages';
import { connectNotice } from '@/lib/metaShared';

export const dynamic = 'force-dynamic';

export default async function OnboardingDetailPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ meta?: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const { token } = await params;
  const metaNotice = connectNotice((await searchParams).meta);
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const [states, details, updates, reports, tracking, feedback, upgrade, businessEmail, audits, auditSettings, plan, phoneLine, bookingData, chatData] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    trackingOverview(onboarding.id),
    listFeedback(onboarding.id),
    getUpgradeRequest(onboarding.id),
    getBusinessEmail(onboarding.id),
    listAuditsForOnboarding(onboarding.id),
    getAuditSettings(onboarding.id),
    listPlan(onboarding.id),
    getLine(onboarding.id),
    adminBookingData(onboarding.id),
    adminChatData(onboarding.id),
  ]);
  const phone = phoneLine
    ? { line: phoneLine, calls: await recentCalls(onboarding.id, 30, { includeConnect: true }), cost: await monthCost(onboarding.id, monthOf()) }
    : { line: null, calls: [], cost: null };
  const sequences = onboarding.tier === 'essentials' ? null : await sequencesAdminData(onboarding.id);
  const metaPages = await pagesFor(onboarding.id).catch(() => []);
  const phoneCard = states['phone-setup']?.data ?? {};
  const askedPhone = (key: string) => (typeof phoneCard[key] === 'string' ? (phoneCard[key] as string) : '');
  const domainCard = states.domain?.data ?? {};
  const asked = (key: string) => (typeof domainCard[key] === 'string' ? (domainCard[key] as string) : '');

  return (
    <main className={adminMain}>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/onboarding" className={`${btn('ghost', 'sm')} -ml-3 mb-3`}>
          <ArrowLeft size={14} /> All clients
        </Link>
        {upgrade && upgrade.tier !== onboarding.tier ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            <b>Asked about {TIER_LABELS[upgrade.tier]}.</b> Pressed in their dashboard on {new Date(upgrade.at).toLocaleDateString('en-US')}; they were told you would reach out
            within one business day to walk them through it. Call or email them.
          </div>
        ) : null}
        {metaNotice ? (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${metaNotice.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>{metaNotice.text}</div>
        ) : null}
        <OnboardingDetail
          initial={{
            onboarding: { ...onboarding, url: welcomeUrl(onboarding.token) },
            states,
            progress: computeProgress(onboarding.tier, states),
          }}
          items={orderedItems(onboarding.tier)}
        />
        <BusinessEmailPanel
          token={onboarding.token}
          tier={onboarding.tier}
          initial={businessEmail}
          asked={{ domainName: asked('domainName'), mailboxes: asked('mailboxes'), signInEmails: asked('signInEmails'), currentEmail: asked('currentEmail') }}
        />
        <PhonePanel
          token={onboarding.token}
          tier={onboarding.tier}
          initial={phone}
          businessName={onboarding.businessName}
          asked={{ mainNumber: askedPhone('mainNumber'), trackingPreference: askedPhone('trackingPreference'), answerers: askedPhone('answerers') }}
        />
        <BookingPanel token={onboarding.token} tier={onboarding.tier} initial={bookingData} />
        <ChatPanel token={onboarding.token} tier={onboarding.tier} initial={chatData} />
        {sequences ? <SequencesPanel token={onboarding.token} tier={onboarding.tier} initial={sequences} /> : null}
        <MetaPanel token={onboarding.token} tier={onboarding.tier} configured={isMetaConfigured()} initial={metaPages} />
        <ProjectPanel token={onboarding.token} initial={{ details, updates, reports, tracking, feedback, audits, auditSettings, plan }} guarantee={tierHasGuarantee(onboarding.tier)} tier={onboarding.tier} />
      </div>
    </main>
  );
}
