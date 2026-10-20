// app/proof/dev-fixture/page.tsx
// DEV ONLY (`next dev`): renders the AxeonPROOF v1 or v2 dashboard with a made-up
// practice (lib/__fixtures__/proofDashboardFixture.ts) for screenshots without a
// database. ?v=1|2&tab=overview|program. 404 in every other environment.
import { notFound } from 'next/navigation';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { fixtureDashboard } from '@/lib/__fixtures__/proofDashboardFixture';

export const dynamic = 'force-dynamic';

export default async function DevFixture({ searchParams }: { searchParams: Promise<{ v?: string; tab?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { v, tab } = await searchParams;
  const version = v === '1' ? 1 : 2;
  const data = fixtureDashboard(version);
  const program = version === 2 && tab === 'program';
  return (
    <ProofDashboard
      email="owner@example.com"
      {...data}
      programTab={program}
      preview={{ label: `Dev fixture: made-up practice, AxeonPROOF v${version}`, backHref: '/proof/dev-fixture' }}
      tab="overview"
    />
  );
}
