import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PLAN_DEFAULT_FEES } from '@/data/agreementTemplate';
import { TIER_LABELS } from '@/data/onboardingItems';
import { latestSignedAgreementFor, money, prettyDate } from '@/lib/agreements';
import { getProjectDetails, tierHasGuarantee } from '@/lib/projects';
import { getSignedInClient } from '@/lib/proofServer';
import { isDeviceVerified, loadOnboarding } from '@/lib/welcomeApi';
import { DocFacts, DocH2, DocPaper } from '@/components/docs/DocPaper';

// The Welcome Packet, generated from the client's own plan, fees and dates.
// Same access as the setup portal (verified device) or their AxeonPROOF session.
export const metadata: Metadata = {
  title: 'Welcome Packet | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

const STEPS = [
  ['Get found.', 'Local SEO, your Google Business Profile, AI search, and ads put you in front of people ready to buy.'],
  ['Get chosen.', 'A website, reviews, and real footage that make you the obvious pick over the next company on the list.'],
  ['Get booked.', 'Instant lead alerts, missed-call text-back, AI chat, and automatic follow-up turn leads into paying customers.'],
] as const;

const TIMELINE = [
  ['Week 1', 'Kickoff & access. We meet, set your baseline numbers, and collect access (through invites you accept, never passwords), your logo, photos, and your services list on your setup page.'],
  ['Weeks 2–3', 'Build. Your pages, Google Business Profile, tracking, and lead system come together. You get a preview link to review.'],
  ['Week 4', 'Launch. We go live, redirect old URLs so no traffic is lost, and confirm every call and form reaches you.'],
  ['Days 30–90', 'Climb. Rankings, reviews, and follow-up compound. You get a monthly report on calls, leads, and where each one came from.'],
] as const;

export default async function WelcomePacketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') redirect(`/welcome/${token}`);
  const account = await getSignedInClient().catch(() => null);
  const allowed = account?.onboardingId === onboarding.id || (await isDeviceVerified(onboarding.token));
  if (!allowed) redirect(`/welcome/${onboarding.token}`);

  const [details, agreement] = await Promise.all([
    getProjectDetails(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
  ]);
  const monthly = agreement?.monthlyCents ?? PLAN_DEFAULT_FEES[onboarding.tier].monthlyCents;
  const name = onboarding.businessName || onboarding.clientName || 'there';
  const first = onboarding.clientName?.trim().split(/\s+/)[0] || 'there';
  const guarantee = tierHasGuarantee(onboarding.tier);

  return (
    <DocPaper kind="Welcome Packet" meta={prettyDate(onboarding.createdAt)}>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 font-display">Welcome to Axeon, {name}.</h1>
      <p className="mt-3 text-lg text-neutral-600">
        You just hired a team whose only job is to get you more customers. Here is how we work, what happens next, and how to reach us.
      </p>

      <p className="mt-8">Hi {first},</p>
      <p className="mt-3">
        Thank you for choosing Axeon. Most agencies sell you a website or a report and leave the rest to you. We do it differently: we run
        every step as one system so the people already searching for what you do end up on your calendar. Found. Chosen. Booked.
      </p>
      <p className="mt-3">
        You will always have direct access to the person building your system. No account managers, no handoffs. If something is unclear at
        any point, call or text us.
      </p>

      <DocH2>How we get you customers</DocH2>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-xl border border-neutral-200 p-4 break-inside-avoid">
            <p className="text-xs font-mono uppercase tracking-wider text-blue-600">Step {i + 1}</p>
            <p className="mt-1 font-bold text-neutral-950">{title}</p>
            <p className="mt-1 text-sm text-neutral-600">{body}</p>
          </div>
        ))}
      </div>

      <DocH2>Your plan at a glance</DocH2>
      <DocFacts
        rows={[
          ['Plan', TIER_LABELS[onboarding.tier]],
          ['Monthly investment', `${money(monthly)} / mo`],
          ['Start date', prettyDate(agreement?.effectiveDate ?? onboarding.createdAt)],
          ['Kickoff call', details.kickoffAt ? prettyDate(details.kickoffAt) : 'We will schedule it with you this week'],
          ['Target launch', details.targetLaunchAt ? prettyDate(details.targetLaunchAt) : 'Set at kickoff'],
        ]}
      />

      {guarantee && (
        <div className="my-6 rounded-xl bg-blue-50 border border-blue-100 p-5 break-inside-avoid">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700">90-Day Customer Guarantee</p>
          <p className="mt-2 font-bold text-neutral-950">
            More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            We set your baseline together on the kickoff call and track it in AxeonPROOF. The guarantee applies while you are on your plan and
            answering new leads within one business day.
          </p>
        </div>
      )}

      <DocH2>Your first 90 days</DocH2>
      <ol className="space-y-3">
        {TIMELINE.map(([when, what]) => (
          <li key={when} className="grid grid-cols-[100px_1fr] gap-4 break-inside-avoid">
            <span className="font-mono text-sm font-semibold text-blue-600">{when}</span>
            <span>{what}</span>
          </li>
        ))}
      </ol>

      <DocH2>How to reach us</DocH2>
      <DocFacts
        rows={[
          ['Email', 'hello@axeonstudio.co'],
          ['Call or text', '(515) 493-8017'],
          ['Response time', 'Within one business day'],
          ['Your dashboard', 'app.axeonstudio.co (AxeonPROOF)'],
        ]}
      />

      <p className="mt-8">We are glad you are here. Let&apos;s go get you customers.</p>
      <p className="mt-4 font-bold text-neutral-950">Hayder Hatem</p>
      <p className="text-sm text-neutral-500">Founder, Axeon Studio · West Des Moines, Iowa</p>
    </DocPaper>
  );
}
