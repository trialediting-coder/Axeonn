// components/proof/UpgradePanel.tsx
// A tab the client's plan does not include. Shows the feature with their own
// numbers, what the plan adds, the price as "one extra job", and one button
// that asks Axeon to get in touch.
// A bigger plan is set up for the shop, not switched on with a click, so there
// is no self-serve upgrade: the client asks, the owner walks them through it.
// Server component; the button is the only client piece.
import { Check, Lock } from 'lucide-react';
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

      {tab.ghost ? (
        <div className="relative mt-6 max-h-[460px] overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:max-h-[560px]">
          {/* An example month, readable and labelled as such: it shows what the screen does, never the client's own results. */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 sm:px-5">
            <p className="text-sm font-semibold text-neutral-900">
              An example month on {plan} <span className="font-normal text-neutral-500">· not your numbers yet; yours start the day it is switched on</span>
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
              <Lock size={12} /> {plan}
            </span>
          </div>
          <div aria-hidden className="pointer-events-none select-none p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tab.ghost.tiles.map((t) => (
                <div key={t.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-medium text-neutral-600">{t.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{t.value}</p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">{t.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-neutral-900">By week</p>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {tab.ghost.bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-blue-600" style={{ height: `${h}%`, opacity: 0.55 + (i / tab.ghost!.bars.length) * 0.45 }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm font-semibold text-neutral-900">Where they came from</p>
                <ul className="mt-3 space-y-2">
                  {['Google', 'Your website', 'Google listing', 'Facebook'].map((src, i) => (
                    <li key={src}>
                      <div className="flex justify-between text-xs text-neutral-700">
                        <span>{src}</span>
                        <span className="font-semibold">{[48, 31, 14, 7][i]}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${[48, 31, 14, 7][i]}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
              {tab.ghost.rows.map((row, i) => (
                <li key={i} className="grid grid-cols-[1fr_1.4fr_1.6fr] gap-3 px-4 py-3 text-sm">
                  <span className="font-semibold text-neutral-900">{row.a}</span>
                  <span className="truncate text-neutral-700">{row.b}</span>
                  <span className="truncate text-neutral-500">{row.c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
