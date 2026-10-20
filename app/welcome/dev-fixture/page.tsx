// app/welcome/dev-fixture/page.tsx
// DEV ONLY (`next dev`): the setup portal with a made-up AxeonCORE client, for
// screenshots without a database. ?industry=dental|med_spa|law|accounting|other
// words the cards for that kind of practice; &prefill=1 shows the first question
// prefilled from the agreement (not yet confirmed); &answered=1 marks it done so
// the next card opens. Saving does nothing here (the API 404s for this token).
// 404 in every other environment.
import { notFound } from 'next/navigation';
import { OnboardingPortal } from '@/components/welcome/OnboardingPortal';
import { PRACTICE_TYPE_ITEM, TIER_LABELS } from '@/data/onboardingItems';
import { INDUSTRY_LABELS, isIndustry } from '@/data/industryWords';
import { orderedItems, prefillFor, type ItemState } from '@/lib/onboarding';
import { FIXTURE_PRACTICES } from '@/lib/__fixtures__/proofDashboardFixture';

export const dynamic = 'force-dynamic';

export default async function WelcomeDevFixture({ searchParams }: { searchParams: Promise<{ industry?: string; prefill?: string; answered?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const q = await searchParams;
  const industry = isIndustry(q.industry) ? q.industry : null;
  const answered = q.answered === '1' && industry;
  // Before the client answers, the words are the neutral ones unless the agreement prefilled the industry.
  const wordedAs = answered || q.prefill === '1' ? industry : null;
  const onboarding = {
    businessName: industry ? FIXTURE_PRACTICES[industry].name : 'Example Practice',
    clientName: 'Dana Example',
    clientEmail: 'owner@example.com',
    phone: '(515) 555-0142',
    industry: wordedAs,
  };
  const items = orderedItems('axeoncore', wordedAs);
  const prefill: Record<string, Record<string, string>> = {};
  for (const item of items.client) if (item.kind === 'confirm') prefill[item.key] = prefillFor(item, onboarding);
  const now = new Date().toISOString();
  const states: Record<string, ItemState> = answered
    ? { [PRACTICE_TYPE_ITEM]: { itemKey: PRACTICE_TYPE_ITEM, status: 'done', data: { industry: INDUSTRY_LABELS[industry] }, completedBy: 'client', completedAt: now, updatedAt: now } }
    : {};
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-neutral-950 pt-12 sm:pt-16 pb-24 px-4 sm:px-10">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-600">Axeon Studio · Client setup</p>
      </div>
      <OnboardingPortal
        token="DEVFIXTUREDEVFIXTURE"
        tierLabel={TIER_LABELS.axeoncore}
        businessName={onboarding.businessName}
        clientName={onboarding.clientName}
        editable
        items={items}
        states={states}
        prefill={prefill}
        phone="(515) 493-8017"
        phoneHref="tel:+15154938017"
      />
    </main>
  );
}
