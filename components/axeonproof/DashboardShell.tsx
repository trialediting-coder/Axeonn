'use client';

// components/axeonproof/DashboardShell.tsx
// The AxeonPROOF chrome as a client sees it, rendered for the example business
// on /axeonproof: sidebar with every tab and its plan tag, the page header with
// the plan badge and the Live pill, then the screen. Mirrors
// components/proof/ProofDashboard.tsx without any of its data plumbing. Uses
// container queries, so the same shell works inside the hero window, the tour
// panel and a phone-width frame.
import type { ReactNode } from 'react';
import { Activity, Bot, CalendarCheck, ClipboardList, CreditCard, LayoutGrid, Mail, Megaphone, PhoneCall, Route, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { TIER_SHORT, tabLocked, type ProofTab } from '@/lib/proofTabs';
import { EXAMPLE, SHOWCASE_TABS, type ShowcaseTabKey } from '@/data/proofPage';

const ICONS: Record<ShowcaseTabKey, LucideIcon> = {
  overview: LayoutGrid,
  program: Route,
  leads: Activity,
  calls: PhoneCall,
  bookings: CalendarCheck,
  reviews: Star,
  ads: Megaphone,
  receptionist: Bot,
  email: Mail,
  billing: CreditCard,
};

export function DashboardShell({ tab, children, onTab }: { tab: ShowcaseTabKey; children: ReactNode; onTab?: (key: ShowcaseTabKey) => void }) {
  const current = SHOWCASE_TABS.find((t) => t.key === tab) ?? SHOWCASE_TABS[0];
  return (
    <div className="@container min-h-full bg-[#f3f4f7] font-sans text-neutral-950 antialiased">
      <div className="flex min-h-full">
        <aside className="sticky top-0 hidden h-full w-60 shrink-0 self-start p-4 @3xl:block">
          <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08)]">
            <div className="px-2 pb-3 pt-2">
              <AxeonLogo product="PROOF" size="sm" />
            </div>
            <nav aria-label="AxeonPROOF" className="flex flex-col gap-0.5">
              {SHOWCASE_TABS.map((t) => {
                const Icon = ICONS[t.key];
                const active = t.key === tab;
                const locked = tabLocked(t as ProofTab, EXAMPLE.plan);
                const cls = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold ${
                  active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-neutral-700 hover:bg-neutral-50'
                }`;
                const inner = (
                  <>
                    <Icon size={15} className={active ? 'text-white' : 'text-neutral-400'} />
                    <span className="truncate">{t.label}</span>
                    {t.tier === 'axeoncore' || t.tier === 'axeongrowth' ? (
                      <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider ${active ? 'text-white/80' : locked ? 'text-blue-600' : 'text-neutral-400'}`}>
                        {TIER_SHORT[t.tier]}
                      </span>
                    ) : null}
                  </>
                );
                return onTab ? (
                  <button key={t.key} type="button" onClick={() => onTab(t.key)} className={`${cls} cursor-pointer`}>
                    {inner}
                  </button>
                ) : (
                  <div key={t.key} className={cls}>
                    {inner}
                  </div>
                );
              })}
              <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-neutral-700">
                <ClipboardList size={15} className="text-neutral-400" />
                Setup
                <span className="ml-auto text-[9px] font-bold text-blue-600">100%</span>
              </div>
            </nav>
            <div className="mt-3 flex items-center gap-2.5 border-t border-neutral-100 px-2 pt-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">{EXAMPLE.initials}</span>
              <span className="truncate text-[13px] font-bold text-neutral-900">{EXAMPLE.name}</span>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* On a narrow frame the tabs are a strip, like the app on a phone. */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pt-4 [scrollbar-width:none] @3xl:hidden [&::-webkit-scrollbar]:hidden">
            {SHOWCASE_TABS.map((t) => {
              const active = t.key === tab;
              const cls = `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`;
              return onTab ? (
                <button key={t.key} type="button" onClick={() => onTab(t.key)} className={cls}>
                  {t.label}
                </button>
              ) : (
                <span key={t.key} className={cls}>
                  {t.label}
                </span>
              );
            })}
          </div>

          <main className="px-4 pb-6 pt-4 @3xl:px-6 @3xl:pt-6">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="hidden text-[11px] text-neutral-400 @3xl:block">
                  AxeonPROOF <span className="mx-1">/</span> <span className="font-medium text-neutral-700">{current.label}</span>
                </p>
                <p className="text-xs text-neutral-500 @3xl:mt-1.5">Welcome back, {EXAMPLE.owner}</p>
                <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-lg font-bold leading-tight tracking-tight text-neutral-950 @3xl:text-xl">
                  {EXAMPLE.name}
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
                    Demo
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 ring-1 ring-neutral-200">
                  <AxeonLogo product={TIER_SHORT[EXAMPLE.plan]} size="sm" mark={false} />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
