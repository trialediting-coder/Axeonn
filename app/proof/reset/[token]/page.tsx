import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { ResetForm } from '@/components/proof/ProofForms';

export const dynamic = 'force-dynamic';

export default async function ProofResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <ProofAuthShell title="Choose a new password" subtitle="Pick something you'll remember. You'll be signed in right after.">
      <ResetForm token={token} />
    </ProofAuthShell>
  );
}
