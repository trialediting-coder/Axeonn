// app/sign/dev-fixture/page.tsx
// DEV ONLY (`next dev`): the signing page for a made-up AxeonCORE agreement, for
// screenshots without a database. &pilot=1 adds the founding-client pilot
// (Sec. 2.5); ?view=console shows the admin Agreements console with one pilot
// row. Signing and every console action fail here (no such token). 404 in every
// other environment.
import { notFound } from 'next/navigation';
import { AgreementsConsole } from '@/components/admin/AgreementsConsole';
import { DocPaper } from '@/components/docs/DocPaper';
import { AgreementDocument } from '@/components/sign/AgreementDocument';
import { SignPanel } from '@/components/sign/SignPanel';
import { AGREEMENT_ADD_ONS, AGREEMENT_VERSION, AXEON_ENTITY_OPTIONS, ENTITY_TYPES, PLAN_DEFAULTS } from '@/data/agreementTemplate';
import { ONBOARDING_TIERS, TIER_LABELS, setupMinutes } from '@/data/onboardingItems';
import { dueAtSigning, money, pilotEndsAt, pilotLineFor, validateAgreementInput, type Agreement } from '@/lib/agreements';
import { agreementNeedsEin } from '@/lib/ein';

export const dynamic = 'force-dynamic';

export default async function SignDevFixture({ searchParams }: { searchParams: Promise<{ pilot?: string; view?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const q = await searchParams;
  const pilot = q.pilot === '1' || q.view === 'console';
  const fields = validateAgreementInput({
    clientEmail: 'owner@example.com',
    contactName: 'Dana Example',
    legalName: 'Example Family Dental PC',
    entityType: 'PC',
    entityState: 'Iowa',
    signerName: 'Dana Example',
    signerTitle: 'Owner',
    address: '100 Example St, Ankeny, IA 50021',
    tier: 'axeoncore',
    hourlyRate: '$95/hour',
    axeonEntity: AXEON_ENTITY_OPTIONS[0],
    specialty: 'general dentistry',
    pilot,
  });
  const now = new Date();
  const agreement: Agreement = {
    ...fields,
    id: 1,
    token: 'DEVFIXTUREDEVFIXTURE',
    number: 'AX-2026-001',
    version: AGREEMENT_VERSION,
    status: 'sent',
    textHash: null,
    signedName: null,
    signedTitle: null,
    signedAt: null,
    signedIp: null,
    paidAt: null,
    createdAt: now.toISOString(),
    einMasked: null,
  };

  if (q.view === 'console') {
    const signedAt = new Date(now.getTime() - 6 * 86_400_000).toISOString();
    const row = { ...agreement, status: 'paid' as const, signedName: 'Dana Example', signedAt, paidAt: signedAt, url: '#', pilotEndsAt: pilotEndsAt({ ...agreement, signedAt }) };
    return (
      <main className="min-h-screen bg-[#F3F5F8] p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <AgreementsConsole
            initialRows={[row]}
            dbError={null}
            options={{
              tiers: ONBOARDING_TIERS.map((t) => ({ value: t, label: TIER_LABELS[t], setup: PLAN_DEFAULTS[t].setupCents, monthly: PLAN_DEFAULTS[t].monthlyCents, minimumMonths: PLAN_DEFAULTS[t].minimumMonths, setupCredit: PLAN_DEFAULTS[t].setupCreditCents })),
              entityTypes: ENTITY_TYPES,
              axeonEntities: AXEON_ENTITY_OPTIONS,
              addOns: AGREEMENT_ADD_ONS,
            }}
          />
        </div>
      </main>
    );
  }

  const due = dueAtSigning(agreement);
  const fees = due.cents === 0 ? `add a payment method. Nothing is charged today: ${due.breakdown}` : `pay ${money(due.cents)} today (${due.breakdown})`;
  return (
    <DocPaper
      kind="Client Services Agreement"
      meta={`Agreement No. ${agreement.number}`}
      aside={
        <SignPanel
          token={agreement.token}
          signerName={agreement.signerName}
          signerTitle={agreement.signerTitle}
          fees={fees}
          dueCents={due.cents}
          setupMinutes={setupMinutes(agreement.tier).firstRound}
          askEin={agreementNeedsEin(agreement)}
          pilotLine={pilotLineFor(agreement)}
        />
      }
    >
      <AgreementDocument agreement={agreement} />
    </DocPaper>
  );
}
