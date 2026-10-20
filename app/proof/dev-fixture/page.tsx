// app/proof/dev-fixture/page.tsx
// DEV ONLY (`next dev`): renders the AxeonPROOF v1 or v2 dashboard with a made-up
// practice (lib/__fixtures__/proofDashboardFixture.ts) for screenshots without a
// database. ?v=1|2&tab=<any tab>|program&stage=setup|live, or ?view=admin for the
// admin v2 panel. &industry=dental|med_spa|law|accounting|other words it for that kind of practice.
// 404 in every other environment.
import { notFound } from 'next/navigation';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { ProofV2Panel } from '@/components/insights/ProofV2Panel';
import { fixtureDashboard } from '@/lib/__fixtures__/proofDashboardFixture';
import { PROOF_TABS, type ProofTabKey } from '@/lib/proofTabs';
import { isIndustry } from '@/data/industryWords';

export const dynamic = 'force-dynamic';

export default async function DevFixture({ searchParams }: { searchParams: Promise<{ v?: string; tab?: string; view?: string; stage?: string; industry?: string; interactive?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { v, tab, view, stage, industry, interactive } = await searchParams;
  const version = v === '1' ? 1 : 2;
  const kind = isIndustry(industry) ? industry : 'dental';
  const data = fixtureDashboard(version, new Date(), stage === 'live' ? 'live' : stage === 'list' ? 'list' : 'setup', kind);
  if (view === 'admin') {
    return (
      <main className="mx-auto min-h-screen max-w-5xl bg-[#F3F5F8] p-4 sm:p-8">
        <ProofV2Panel token="dev-fixture" initialVersion={version} initialIndustry={kind} industryConfirmed initial={data.v2 ?? null} />
      </main>
    );
  }
  const program = version === 2 && tab === 'program';
  const key = PROOF_TABS.some((t) => t.key === tab) ? (tab as ProofTabKey) : 'overview';
  return (
    <ProofDashboard
      email="owner@example.com"
      {...data}
      programTab={program}
      // &interactive=1: the client's own buttons (value edit, list upload) as a signed-in client sees them; saving 401s here.
      {...(interactive === '1' ? { v2Api: '/api/proof/v2' } : { preview: { label: `Dev fixture: made-up practice, AxeonPROOF v${version}`, backHref: '/proof/dev-fixture' } })}
      tab={key}
    />
  );
}
