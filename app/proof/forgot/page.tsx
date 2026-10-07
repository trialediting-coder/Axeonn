import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { ForgotForm } from '@/components/proof/ProofForms';

export default function ProofForgotPage() {
  return (
    <ProofAuthShell title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <ForgotForm />
    </ProofAuthShell>
  );
}
