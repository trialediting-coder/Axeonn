import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { getAgreement, money } from '@/lib/agreements';
import { DocPaper } from '@/components/docs/DocPaper';
import { AgreementDocument } from '@/components/sign/AgreementDocument';
import { PayPanel, SignPanel } from '@/components/sign/SignPanel';

// app.axeonstudio.co/sign/<token>: the client reads, signs and pays. The token
// (20 random characters, emailed to the client) is the credential.
export const metadata: Metadata = {
  title: 'Your agreement | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 pt-24">
      <div className="max-w-md mx-auto rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-xs">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-neutral-950 mb-3">{title}</h1>
        <p className="text-neutral-600">{body}</p>
        <a href="tel:+15154938017" className="mt-6 inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
          Call (515) 493-8017
        </a>
      </div>
    </main>
  );
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agreement = await getAgreement(token).catch(() => null);
  if (!agreement) return <Message title="This link is not active" body="Check the link in your email, or call us and we will send a fresh one." />;
  if (agreement.status === 'void')
    return <Message title="This agreement was withdrawn" body="Axeon replaced or cancelled it. Call us if you expected to sign something here." />;

  // Stripe's first invoice carries the setup fee and the first month together (lib/billing.ts createAgreementCheckout).
  const dueToday = money(agreement.setupCents + agreement.monthlyCents);
  const breakdown = `${money(agreement.setupCents)} to start + your first month, then ${money(agreement.monthlyCents)}/month`;
  const fees = `${dueToday} today (${breakdown})`;
  let panel: React.ReactNode;
  if (agreement.status === 'sent') {
    panel = <SignPanel token={agreement.token} signerName={agreement.signerName} signerTitle={agreement.signerTitle} fees={fees} />;
  } else if (agreement.status === 'signed') {
    panel = <PayPanel token={agreement.token} dueToday={dueToday} breakdown={breakdown} />;
  } else {
    panel = (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <p className="flex items-center gap-2 font-bold">
          <CheckCircle2 size={18} /> Signed and paid. Welcome to Axeon.
        </p>
        <p className="mt-1 text-sm">Your setup page link is in your email. This page stays here as your signed copy.</p>
      </div>
    );
  }

  return (
    <DocPaper kind="Client Services Agreement" meta={`Agreement No. ${agreement.number}`} aside={panel}>
      <AgreementDocument agreement={agreement} />
    </DocPaper>
  );
}
