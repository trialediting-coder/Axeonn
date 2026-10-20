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
import { connectNotice } from '@/lib/metaShared';
import { VersionTag } from '@/components/common/VersionTag';
import { FrontDeskSignoff } from '@/components/proof/v2/V2Interactive';
import { FRONT_DESK_ROUTINE } from '@/lib/proofV2Shared';
import { getV2Settings } from '@/lib/proofV2';
import { DASHBOARD_VERSIONS } from '@/data/dashboardVersions';

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
      <VersionTag version={DASHBOARD_VERSIONS.setup} className="max-w-2xl mx-auto mt-10" />
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

/** The line shown after Facebook Login sends the client back here with ?meta=<result>. */
function MetaNotice({ flag }: { flag: string | undefined }) {
  const notice = connectNotice(flag);
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`max-w-2xl mx-auto mb-6 rounded-2xl border px-5 py-4 text-sm ${notice.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
    >
      {notice.text}
    </div>
  );
}

/** AxeonPROOF v2 setup item: the front-desk routine, signed off by the client (lib/proofV2Shared.ts FRONT_DESK_ROUTINE). */
async function FrontDeskCard({ token, onboardingId }: { token: string; onboardingId: number }) {
  const s = await getV2Settings(onboardingId).catch(() => ({}) as Awaited<ReturnType<typeof getV2Settings>>);
  return (
    <section className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Sign-off · front desk</p>
      <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-950">Your team&apos;s routine with AxeonPROOF</h2>
      <p className="mt-1 text-sm text-neutral-600">Four habits that keep every missed call and lead answered. Sign off once your front desk has read them.</p>
      <ol className="mt-4 space-y-2">
        {FRONT_DESK_ROUTINE.map((r) => (
          <li key={r.key} className="flex gap-3 text-sm">
            <span className="w-32 shrink-0 text-xs font-semibold text-neutral-500">{r.when}</span>
            <span className="text-neutral-800">{r.what}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5">
        <FrontDeskSignoff api={`/api/welcome/${token}/front-desk`} signedOffAt={s.frontDesk?.signedOffAt ?? null} signedOffBy={s.frontDesk?.signedOffBy ?? null} />
      </div>
    </section>
  );
}

async function Portal({ onboarding, meta }: { onboarding: Onboarding; meta?: string }) {
  const states = await getItemStates(onboarding.id);
  const items = orderedItems(onboarding.tier);
  const prefill: Record<string, Record<string, string>> = {};
  for (const item of items.client) {
    if (item.kind === 'confirm') prefill[item.key] = prefillFor(item, onboarding);
  }
  return (
    <Frame>
      <MetaNotice flag={meta} />
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
        {onboarding.proofVersion === 2 ? <FrontDeskCard token={onboarding.token} onboardingId={onboarding.id} /> : null}
        <ProofPasswordCard
          token={onboarding.token}
          email={onboarding.clientEmail}
          hasAccount={await hasAccountForOnboarding(onboarding.id).catch(() => false)}
        />
        <p className="mt-6 text-center text-sm text-neutral-600">
          What happens next, week by week:{' '}
          <Link href={`/welcome/${onboarding.token}/packet`} className="font-semibold text-blue-600 hover:text-blue-700">
            read your Welcome Packet
          </Link>
        </p>
      </div>
    </Frame>
  );
}

export default async function WelcomePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ meta?: string }> }) {
  const { token } = await params;
  const { meta } = await searchParams;
  const onboarding = await loadOnboarding(token);
  if (!onboarding || onboarding.status === 'closed') return <Invalid />;

  if (!(await isDeviceVerified(onboarding.token))) {
    return (
      <Frame>
        <VerifyCode token={onboarding.token} maskedEmail={maskEmail(onboarding.clientEmail)} businessName={onboarding.businessName} />
      </Frame>
    );
  }
  return <Portal onboarding={onboarding} meta={meta} />;
}
