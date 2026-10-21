// app/proof/demo/page.tsx
// Public sales demo: the real AxeonPROOF dashboard for a made-up practice
// (lib/__fixtures__/proofDashboardFixture.ts, stage 'live'), read-only, no
// database, no sign-in. Shown on the iPad on walk-ins at
// app.axeonstudio.co/proof/demo. ?industry=dental|med_spa|law|accounting picks
// the wording, ?tab=<any tab>|program the section. Not indexed.
import type { Metadata } from 'next';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { fixtureDashboard } from '@/lib/__fixtures__/proofDashboardFixture';
import { PROOF_TABS, type ProofTabKey } from '@/lib/proofTabs';
import { isIndustry } from '@/data/industryWords';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AxeonPROOF demo',
  robots: { index: false, follow: false },
};

export default async function ProofDemo({ searchParams }: { searchParams: Promise<{ tab?: string; industry?: string }> }) {
  const { tab, industry } = await searchParams;
  const kind = isIndustry(industry) ? industry : 'dental';
  const data = fixtureDashboard(2, new Date(), 'live', kind);
  const key = PROOF_TABS.some((t) => t.key === tab) ? (tab as ProofTabKey) : 'overview';
  const query = kind === 'dental' ? '' : `?industry=${kind}`;
  return (
    <ProofDashboard
      email="owner@example.com"
      {...data}
      programTab={tab === 'program'}
      preview={{ label: 'AxeonPROOF demo', backHref: `/proof/demo${query}`, bar: false }}
      tab={key}
    />
  );
}
