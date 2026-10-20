// app/proof/dev-fixture/page.tsx
// DEV ONLY (`next dev`): renders the AxeonPROOF v1 or v2 dashboard with a made-up
// practice (lib/__fixtures__/proofDashboardFixture.ts) for screenshots without a
// database. ?v=1|2&tab=<any tab>|program, or ?view=admin for the admin v2 panel.
// 404 in every other environment.
import { notFound } from 'next/navigation';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { ProofV2Panel } from '@/components/insights/ProofV2Panel';
import { fixtureDashboard } from '@/lib/__fixtures__/proofDashboardFixture';
import { PROOF_TABS, type ProofTabKey } from '@/lib/proofTabs';

export const dynamic = 'force-dynamic';

export default async function DevFixture({ searchParams }: { searchParams: Promise<{ v?: string; tab?: string; view?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { v, tab, view } = await searchParams;
  const version = v === '1' ? 1 : 2;
  const data = fixtureDashboard(version);
  if (view === 'admin') {
    return (
      <main className="mx-auto min-h-screen max-w-5xl bg-[#F3F5F8] p-4 sm:p-8">
        <ProofV2Panel token="dev-fixture" initialVersion={version} initial={data.v2 ?? null} />
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
      preview={{ label: `Dev fixture: made-up practice, AxeonPROOF v${version}`, backHref: '/proof/dev-fixture' }}
      tab={key}
    />
  );
}
