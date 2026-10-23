'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSitePathname } from '@/lib/useSitePathname';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeadModal } from '@/components/common/LeadModalProvider';
import { trackEvent, EVENTS } from '@/components/providers/AnalyticsTracker';
import { useIsMobile } from '@/lib/useMediaQuery';

// Site-wide corner card. Until 2026-10-19 it promoted the A-1 Auto Detailing
// case study; after the practice repositioning it points to AxeonPROOF, the
// client portal, so trade results are no longer pushed on practice visitors.
const POPUP_ID = 'axeonproof_badge';
const STORY_PATH = '/axeonproof';

const DISMISS_KEY = 'axeon-proof-badge-dismissed-at';
const CLICKED_KEY = 'axeon-proof-badge-clicked-at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const CLICKED_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // already read it

// Small, non-blocking corner card: it slides in once the visitor has shown
// some interest (scrolled a bit, or stayed a while), never on arrival.
const MIN_DWELL_MS = 6_000;
const SCROLL_DEPTH = 0.3;
const FALLBACK_DELAY_MS = 20_000;

// The thumbnail's line: a few dips, but up and to the right overall.
const CHART_LINE = 'M8 80 L24 72 L40 75 L56 58 L72 52 L88 34 L104 16';

// Pages where a promo card would be noise or would sit on top of a flow.
const HIDDEN_PREFIXES = [STORY_PATH, '/admin', '/book', '/check-your-area', '/go', '/pay', '/billing'];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable -- the in-memory flag still stops a re-show this visit.
  }
}

function inCooldown(key: string, ms: number): boolean {
  const at = Number(readStorage(key));
  return Boolean(at) && Date.now() - at < ms;
}

export function CaseStudyBadge() {
  const pathname = useSitePathname();
  const { isOpen: isLeadModalOpen } = useLeadModal();
  // Phones skip the card: at that width it spans the bottom of the screen and
  // covers the copy (mobile-first pass, 2026-10-19). The homepage has its own
  // AxeonPROOF block, and the menu links to /axeonproof.
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Once it appears it stays put until dismissed or clicked. It used to step
  // aside whenever certain homepage sections were on screen, which made it
  // flicker in and out while scrolling. It already waits until the visitor is
  // 30% down the page, past the hero's logo strip.
  const shown = visible && !hiddenHere && !isLeadModalOpen && isMobile === false;
  const cardRef = useRef<HTMLElement>(null);

  // Publish the card's footprint (height plus a 12px gap) so other
  // bottom-pinned UI, like the minimized free-website pill on phones, can sit
  // above it instead of underneath.
  useEffect(() => {
    const root = document.documentElement;
    const card = cardRef.current;
    if (!shown || !card) {
      root.style.setProperty('--case-study-card-h', '0px');
      return;
    }
    const update = () => root.style.setProperty('--case-study-card-h', `${card.offsetHeight + 12}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => {
      observer.disconnect();
      root.style.setProperty('--case-study-card-h', '0px');
    };
  }, [shown]);

  useEffect(() => {
    if (hiddenHere || shownRef.current || isMobile !== false) return;
    if (inCooldown(CLICKED_KEY, CLICKED_COOLDOWN_MS) || inCooldown(DISMISS_KEY, DISMISS_COOLDOWN_MS)) return;

    const mountedAt = Date.now();
    const show = () => {
      if (shownRef.current || Date.now() - mountedAt < MIN_DWELL_MS) return;
      shownRef.current = true;
      setVisible(true);
      trackEvent(EVENTS.popupShown, { popup: POPUP_ID, page_path: window.location.pathname });
    };

    const onScroll = () => {
      const depth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      if (depth >= SCROLL_DEPTH) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timeoutId = window.setTimeout(show, FALLBACK_DELAY_MS);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timeoutId);
    };
  }, [hiddenHere, isMobile]);

  const dismiss = () => {
    setVisible(false);
    writeStorage(DISMISS_KEY, String(Date.now()));
    trackEvent(EVENTS.popupDismissed, { popup: POPUP_ID, method: 'button' });
  };

  const open = () => {
    setVisible(false);
    writeStorage(CLICKED_KEY, String(Date.now()));
    trackEvent(EVENTS.popupClaimed, { popup: POPUP_ID });
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <AnimatePresence>
      {shown && (
        <motion.aside
          ref={cardRef}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 30 }}
          aria-label="AxeonPROOF client portal"
          data-track-location="case_study_badge"
          className="fixed z-40 left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[440px] sm:left-6 sm:bottom-6"
        >
          <div className="relative rounded-2xl bg-white text-neutral-950 shadow-2xl shadow-neutral-950/15 ring-1 ring-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <Link href={STORY_PATH} onClick={open} className="group flex items-stretch gap-3 sm:gap-4 p-3 sm:p-4 pr-9 sm:pr-10">
              {/* A small chart that draws itself climbing as the card slides in
                  (owner, 2026-10-22). No numbers on it, so nothing to invent. */}
              <span
                aria-hidden="true"
                className="relative w-20 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-blue-50 ring-1 ring-blue-100"
              >
                <svg viewBox="0 0 112 96" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="proof-badge-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[28, 52, 76].map((y) => (
                    <line key={y} x1="0" x2="112" y1={y} y2={y} stroke="#bfdbfe" strokeWidth="1" strokeDasharray="3 4" />
                  ))}
                  <motion.path
                    d={`${CHART_LINE} L104 96 L8 96 Z`}
                    fill="url(#proof-badge-fill)"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                  />
                  <motion.path
                    d={CHART_LINE}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={prefersReducedMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, delay: 0.35, ease: [0.65, 0, 0.35, 1] }}
                  />
                  <motion.circle
                    cx="104"
                    cy="16"
                    r="5"
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth="2"
                    initial={prefersReducedMotion ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 1.9 }}
                    style={{ transformOrigin: '104px 16px' }}
                  />
                </svg>
              </span>
              <span className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-blue-600">
                  AxeonPROOF
                </span>
                <span className="mt-1 text-sm sm:text-lg font-extrabold leading-snug tracking-tight">
                  See every reply and booking, live.
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-neutral-500 group-hover:text-blue-600 transition-colors">
                  Tour the client portal
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </span>
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
