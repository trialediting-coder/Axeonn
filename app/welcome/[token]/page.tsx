import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { TIER_LABELS } from '@/data/onboardingItems';
import {
  getItemStates,
  isEditable,
  maskEmail,
  orderedItems,
  prefillFor,
  type Onboarding,
} from '@/lib/onboarding';
import { isDeviceVerified, loadOnboarding } from '@/lib/welcomeApi';
import { VerifyCode } from '@/components/welcome/VerifyCode';
import { OnboardingPortal } from '@/components/welcome/OnboardingPortal';
import { ProofPasswordCard } from '@/components/welcome/ProofPasswordCard';
import { hasAccountForOnboarding } from '@/lib/proofAuth';

// The client onboarding portal: /welcome/<20-char token>. The token is the first
// factor; a 6-digit email code on each new device is the second (lib/onboarding.ts).
// Never indexed, never cached: it changes on every save.
export const metadata: Metadata = {
  title: 'Your setup | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

const PHONE = '(515) 493-8017';
const PHONE_HREF = 'tel:+15154938017';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-neutral-950 pt-12 sm:pt-16 pb-24 px-4 sm:px-10">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-600">Axeon Studio · Client setup</p>
      </div>
      {children}
    </main>
  );
}

function Invalid() {
  return (
    <Frame>
      <div className="max-w-md mx-auto rounded-[28px] border border-neutral-200 bg-white p-8 sm:p-10 text-center shadow-xs">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          <Clock size={22} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 mb-3 font-display">
          This link is not active
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed">
          It may have been typed wrong, or the setup it belonged to is closed. Check the link in your welcome email, or
          call us and we will send a fresh one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={PHONE_HREF} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors">
            Call {PHONE}
          </a>
          <Link href="/" className="px-6 py-3 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-sm transition-colors">
            Back to the site
          </Link>
        </div>
      </div>
    </Frame>
  );
}

async function Portal({ onboarding }: { onboarding: Onboarding }) {
  const states = await getItemStates(onboarding.id);
  const items = orderedItems(onboarding.tier);
  const prefill: Record<string, Record<string, string>> = {};
  for (const item of items.client) {
    if (item.kind === 'confirm') prefill[item.key] = prefillFor(item, onboarding);
  }
  return (
    <Frame>
      <OnboardingPortal
        token={onboarding.token}
        tierLabel={TIER_LABELS[onboarding.tier]}
        businessName={onboarding.businessName}
        clientName={onboarding.clientName}
        editable={isEditable(onboarding)}
        items={items}
        states={states}
        prefill={prefill}
        phone={PHONE}
        phoneHref={PHONE_HREF}
      />
      <div className="max-w-2xl mx-auto">
        <ProofPasswordCard
          token={onboarding.token}
          email={onboarding.clientEmail}
          hasAccount={await hasAccountForOnboarding(onboarding.id).catch(() => false)}
        />
      </div>
    </Frame>
  );
}

export default async function WelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return <Invalid />;

  if (!(await isDeviceVerified(onboarding.token))) {
    return (
      <Frame>
        <VerifyCode token={onboarding.token} maskedEmail={maskEmail(onboarding.clientEmail)} businessName={onboarding.businessName} />
      </Frame>
    );
  }
  return <Portal onboarding={onboarding} />;
}
