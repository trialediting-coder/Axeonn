'use client';

// components/axeonproof/ProofTour.tsx
// Every AxeonPROOF tab, driven by the visitor: a tab list that mirrors the
// app's own sidebar, and the live screen for the tab they pick, rendered for
// the example business. Arrow keys move between tabs; the sidebar inside the
// frame is clickable too.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { ArrowLeft, ArrowRight, Activity, Bot, CalendarCheck, CreditCard, LayoutGrid, Mail, Megaphone, PhoneCall, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PROOF_TABS, TIER_SHORT, type ProofTabKey } from '@/lib/proofTabs';
import { PLAN_CHIP, TAB_NOTES } from '@/data/proofPage';
import { DashboardShell } from '@/components/axeonproof/DashboardShell';
import { ScreenFor } from '@/components/axeonproof/screens';

const ICONS: Record<ProofTabKey, LucideIcon> = {
  overview: LayoutGrid,
  leads: Activity,
  calls: PhoneCall,
  bookings: CalendarCheck,
  reviews: Star,
  ads: Megaphone,
  receptionist: Bot,
  email: Mail,
  billing: CreditCard,
};

const CHIP_STYLE: Record<string, string> = {
  essentials: 'bg-neutral-100 text-neutral-600',
  axeoncore: 'bg-blue-50 text-blue-700',
  axeongrowth: 'bg-neutral-950 text-white',
};

export function ProofTour() {
  const [index, setIndex] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = PROOF_TABS[index];

  const go = useCallback((next: number) => {
    const n = (next + PROOF_TABS.length) % PROOF_TABS.length;
    setIndex(n);
    tabRefs.current[n]?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(PROOF_TABS.length - 1);
    }
  };

  // Keep the active chip in view on the phone's horizontal strip (not on first paint, or the page would jump here).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    tabRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr] lg:gap-8">
      <div
        role="tablist"
        aria-label="AxeonPROOF tabs"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {PROOF_TABS.map((t, i) => {
          const Icon = ICONS[t.key];
          const active = i === index;
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`proof-tab-${t.key}`}
              aria-selected={active}
              aria-controls="proof-tour-panel"
              tabIndex={active ? 0 : -1}
              type="button"
              onClick={() => setIndex(i)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:w-full lg:py-3 ${
                active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 lg:bg-transparent lg:ring-0'
              }`}
            >
              <Icon size={17} className={active ? 'text-white' : 'text-neutral-400'} />
              <span className="whitespace-nowrap">{t.label}</span>
              {t.tier !== 'essentials' ? (
                <span className={`ml-auto hidden rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide lg:inline ${active ? 'bg-white/20 text-white' : 'text-blue-600'}`}>
                  {TIER_SHORT[t.tier]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div id="proof-tour-panel" role="tabpanel" aria-labelledby={`proof-tab-${tab.key}`} className="min-w-0">
        <div className="mb-3 flex items-center justify-end gap-1 rounded-full bg-neutral-100 p-1 text-xs font-semibold text-neutral-600 sm:ml-auto sm:w-fit" role="group" aria-label="Screen size">
          {(['desktop', 'phone'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${device === d ? 'bg-white text-neutral-950 shadow-sm' : 'hover:text-neutral-950'}`}
            >
              {d === 'desktop' ? <Monitor size={14} /> : <Smartphone size={14} />}
              {d === 'desktop' ? 'Desktop' : 'Phone'}
            </button>
          ))}
        </div>
        {device === 'desktop' ? (
          <div className="overflow-hidden rounded-2xl bg-[#f3f4f7] shadow-[0_24px_80px_-30px_rgba(16,24,40,0.45)] ring-1 ring-neutral-200">
            <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2 sm:px-4">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              </span>
              <span className="mx-auto flex h-7 w-full max-w-xs items-center justify-center rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500 sm:text-xs">
                app.axeonstudio.co/?tab={tab.key}
              </span>
            </div>
            <div key={tab.key} className="max-h-[640px] overflow-y-auto overscroll-contain">
              <DashboardShell tab={tab.key} onTab={(k) => setIndex(PROOF_TABS.findIndex((t) => t.key === k))}>
                <ScreenFor tab={tab.key} full={false} />
              </DashboardShell>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[390px] rounded-[2.5rem] bg-neutral-950 p-2.5 shadow-[0_30px_80px_-30px_rgba(16,24,40,0.6)]">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#f3f4f7]">
              <div className="flex items-center justify-between bg-white px-6 pb-1 pt-3 text-[11px] font-semibold text-neutral-900">
                <span>9:41</span>
                <span className="h-5 w-24 rounded-full bg-neutral-950" aria-hidden />
                <span>100%</span>
              </div>
              <div key={tab.key} className="h-[640px] overflow-y-auto overscroll-contain">
                <DashboardShell tab={tab.key} onTab={(k) => setIndex(PROOF_TABS.findIndex((t) => t.key === k))}>
                  <ScreenFor tab={tab.key} full={false} />
                </DashboardShell>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-950">{tab.label}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${CHIP_STYLE[tab.tier]}`}>{PLAN_CHIP[tab.tier]}</span>
            </div>
            <p className="mt-1.5 max-w-xl text-base leading-relaxed text-neutral-600">{TAB_NOTES[tab.key]}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous tab"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs font-semibold tabular-nums text-neutral-400">
              {index + 1} / {PROOF_TABS.length}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next tab"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-neutral-200 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
