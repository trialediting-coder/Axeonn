'use client';

// components/axeonproof/ProofTour.tsx
// Every AxeonPROOF tab, driven by the visitor: a glass tab bar across the top
// that plays through the tabs by itself (a progress line runs under the active
// one) until the visitor touches anything, the live screen for the tab in a
// glass bezel, and a glass panel beside it with what the tab is for, which plan
// has it, a Desktop/Phone toggle and prev/next. Arrow keys move between tabs;
// the sidebar inside the frame is clickable too. Reduced motion: no autoplay.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Activity, Bot, CalendarCheck, CreditCard, LayoutGrid, Mail, Megaphone, Monitor, Pause, PhoneCall, Play, Route, Smartphone, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PLAN_CHIP, SHOWCASE_TABS, TAB_NOTES, type ShowcaseTabKey } from '@/data/proofPage';
import { DashboardShell } from '@/components/axeonproof/DashboardShell';
import { ScreenFor } from '@/components/axeonproof/screens';
import { BEZEL, GLASS, LABEL } from '@/components/axeonproof/ui';

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

const CHIP_STYLE: Record<string, string> = {
  essentials: 'bg-white/10 text-neutral-200 ring-1 ring-white/15',
  axeoncore: 'bg-white/10 text-neutral-200 ring-1 ring-white/15',
  axeongrowth: 'bg-white text-neutral-950',
};

const DWELL = 7000; // ms on each tab while playing

export function ProofTour() {
  const [index, setIndex] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = SHOWCASE_TABS[index];
  const n = SHOWCASE_TABS.length;

  // Autoplay starts on (unless reduced motion) and only runs while the tour is on screen.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The progress line under the active tab; when it fills, the next tab.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !playing || !inView) return;
    const anim = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DWELL, easing: 'linear' });
    anim.onfinish = () => setIndex((i) => (i + 1) % n);
    return () => anim.cancel();
  }, [index, playing, inView, n]);

  // Keep the active tab in view inside the bar (scrolls the bar only, never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const btn = tabRefs.current[index];
    if (!strip || !btn || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: btn.offsetLeft - strip.clientWidth / 2 + btn.clientWidth / 2, behavior: 'smooth' });
  }, [index]);

  // Any hand on the controls stops the autoplay.
  const pick = useCallback(
    (next: number, focus = false) => {
      const i = (next + n) % n;
      setPlaying(false);
      setIndex(i);
      if (focus) tabRefs.current[i]?.focus();
    },
    [n],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: n - 1 };
    if (e.key in keys) {
      e.preventDefault();
      pick(keys[e.key], true);
    }
  };

  const onTab = (k: ShowcaseTabKey) => pick(SHOWCASE_TABS.findIndex((t) => t.key === k));
  const stop = () => setPlaying(false);
  const Icon = ICONS[tab.key];

  return (
    <div ref={rootRef}>
      {/* Tab bar */}
      <div className={`rounded-2xl p-1.5 ${GLASS}`}>
        <div
          ref={stripRef}
          role="tablist"
          aria-label="AxeonPROOF tabs"
          onKeyDown={onKeyDown}
          className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SHOWCASE_TABS.map((t, i) => {
            const TabIcon = ICONS[t.key];
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
                onClick={() => pick(i)}
                className={`relative flex flex-none items-center lg:flex-1 justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400 ${
                  active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <TabIcon size={16} className={active ? 'text-white' : 'text-neutral-400'} />
                {t.label}
                {active && playing ? <span ref={barRef} aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-white/80" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* The screen */}
        <div id="proof-tour-panel" role="tabpanel" aria-labelledby={`proof-tab-${tab.key}`} className="min-w-0">
          {device === 'desktop' ? (
            <div className={BEZEL}>
              <div className="overflow-hidden rounded-2xl bg-[#f3f4f7] ring-1 ring-black/20 sm:rounded-[20px]">
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
                <div key={tab.key} className="h-[330px] overflow-y-auto overscroll-contain sm:h-[640px]" onWheel={stop} onPointerDown={stop}>
                  <DashboardShell tab={tab.key} onTab={onTab}>
                    <ScreenFor tab={tab.key} full={false} />
                  </DashboardShell>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[400px] rounded-[2.75rem] bg-white/[0.06] p-2.5 shadow-[0_50px_140px_-30px_rgba(37,99,235,0.45)] ring-1 ring-white/15 backdrop-blur-md">
              <div className="relative overflow-hidden rounded-[2.25rem] bg-[#f3f4f7] ring-1 ring-black/20">
                <div className="flex items-center justify-between bg-white px-6 pb-1 pt-3 text-[11px] font-semibold text-neutral-900">
                  <span>9:41</span>
                  <span className="h-5 w-24 rounded-full bg-neutral-950" aria-hidden />
                  <span>100%</span>
                </div>
                <div key={tab.key} className="h-[620px] overflow-y-auto overscroll-contain" onWheel={stop} onPointerDown={stop}>
                  <DashboardShell tab={tab.key} onTab={onTab}>
                    <ScreenFor tab={tab.key} full={false} />
                  </DashboardShell>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What this tab is */}
        <aside className={`flex flex-col rounded-2xl px-4 py-3.5 sm:rounded-3xl sm:p-7 ${GLASS}`}>
          <div className="flex items-center justify-between gap-3">
            <p className={LABEL}>
              Tab {index + 1} of {n}
            </p>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause the tour' : 'Play the tour'}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-neutral-300 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>

          <div key={tab.key} className="animate-proof-rise">
            <span className="mt-6 hidden h-12 w-12 items-center sm:flex justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-600/30">
              <Icon size={22} />
            </span>
            <h3 className="mt-1.5 inline text-xl font-extrabold tracking-tight text-white sm:mt-5 sm:block sm:text-3xl">{tab.label}</h3>
            <span className={`ml-2 mt-1.5 inline-flex align-middle sm:ml-0 sm:mt-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${CHIP_STYLE[tab.tier]}`}>{PLAN_CHIP[tab.tier]}</span>
            <p className="mt-1.5 text-[15px] leading-snug text-neutral-300 sm:mt-4 sm:text-base sm:leading-relaxed">{TAB_NOTES[tab.key]}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-4 border-t border-white/10 pt-3 sm:mt-8 sm:justify-between sm:pt-6 lg:mt-auto">
            <div className="hidden items-center gap-1 rounded-full bg-white/[0.06] p-1 text-xs font-semibold text-neutral-300 ring-1 ring-white/10 sm:flex" role="group" aria-label="Screen size">
              {(['desktop', 'phone'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-pressed={device === d}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${device === d ? 'bg-white text-neutral-950 shadow-sm' : 'hover:text-white'}`}
                >
                  {d === 'desktop' ? <Monitor size={14} /> : <Smartphone size={14} />}
                  {d === 'desktop' ? 'Desktop' : 'Phone'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pick(index - 1)}
                aria-label="Previous tab"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full sm:h-10 sm:w-10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => pick(index + 1)}
                aria-label="Next tab"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full sm:h-10 sm:w-10 bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
