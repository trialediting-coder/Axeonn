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
import { getLine, monthCost, recentCalls } from '@/lib/phoneLines';

export const dynamic = 'force-dynamic';

export default async function OnboardingDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const { token } = await params;
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const [states, details, updates, reports, tracking, feedback, upgrade, businessEmail, phoneLine] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    trackingOverview(onboarding.id),
    listFeedback(onboarding.id),
    getUpgradeRequest(onboarding.id),
    getBusinessEmail(onboarding.id),
    getLine(onboarding.id),
  ]);
  const phone = phoneLine
    ? { line: phoneLine, calls: await recentCalls(onboarding.id), cost: await monthCost(onboarding.id, monthOf()) }
    : { line: null, calls: [], cost: null };
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
        <ProjectPanel token={onboarding.token} initial={{ details, updates, reports, tracking, feedback }} guarantee={tierHasGuarantee(onboarding.tier)} />
      </div>
    </main>
  );
}
