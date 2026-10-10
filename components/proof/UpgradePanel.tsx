// components/proof/UpgradePanel.tsx
// A tab the client's plan does not include. Shows the feature with their own
// numbers, what the plan adds, the price as "one extra job", and one button
// that asks Axeon to get in touch.
// A bigger plan is set up for the shop, not switched on with a click, so there
// is no self-serve upgrade: the client asks, the owner walks them through it.
// Server component; the button is the only client piece.
import { Check } from 'lucide-react';
import { TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';
import { UpgradeButton } from '@/components/proof/UpgradeButton';
import { lockedHeadline, upgradeMath, type ProofTab } from '@/lib/proofTabs';
import type { TrafficSummary } from '@/lib/projectsShared';
import type { UpgradeRequest } from '@/lib/upgrades';

export function UpgradePanel({
  tab,
  tier,
  traffic,
  avgJobValue,
  request,
  preview,
  bookUrl,
}: {
  tab: ProofTab;
  tier: OnboardingTier;
  traffic: TrafficSummary | null;
  avgJobValue: number | null;
  request: UpgradeRequest | null;
  preview: boolean;
  bookUrl: string;
}) {
  const plan = TIER_LABELS[tab.tier];
  const math = upgradeMath(tier, tab.tier, avgJobValue);
  const requestedThis = request && request.tier === tab.tier ? request.at : null;
  return (
    <div className="mt-6">
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">Included in {plan}</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">{tab.label}</h2>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-700">{lockedHeadline(tab, traffic)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-900">What {plan} adds</p>
          <ul className="mt-3 space-y-2.5 text-sm text-neutral-700">
            {tab.includes.map((line) => (
              <li key={line} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-2xl font-extrabold tracking-tight text-neutral-950">
              ${math.delta.toLocaleString('en-US')}
              <span className="text-sm font-semibold text-neutral-500">/mo more</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{math.line}</p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-600">
            {plan} is set up for your shop, not switched on with a click. Tell us you are interested and we will walk you through what changes and get it ready.
          </p>
          <div className="mt-3">
            <UpgradeButton tier={tab.tier} label={`Ask us about ${plan}`} requestedAt={requestedThis} preview={preview} />
          </div>
          <a href={bookUrl} className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
            Or book a 10-minute call
          </a>
          <p className="mt-3 text-xs text-neutral-500">Nothing changes until you say yes. Same month-to-month terms as today.</p>
        </div>
      </div>
    </div>
  );
}
