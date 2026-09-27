'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeadModal } from '@/components/common/LeadModalProvider';
import { trackEvent, EVENTS } from '@/components/providers/AnalyticsTracker';

const POPUP_ID = 'a1_case_study_badge';
const STORY_PATH = '/insights/a-1-auto-detailing-website-case-study';

const DISMISS_KEY = 'axeon-a1-badge-dismissed-at';
const CLICKED_KEY = 'axeon-a1-badge-clicked-at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const CLICKED_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // already read it

// Small, non-blocking corner card: it slides in once the visitor has shown
// some interest (scrolled a bit, or stayed a while), never on arrival.
const MIN_DWELL_MS = 6_000;
const SCROLL_DEPTH = 0.3;
const FALLBACK_DELAY_MS = 20_000;

// Pages where a promo card would be noise or would sit on top of a flow.
const HIDDEN_PREFIXES = [STORY_PATH, '/insights/admin', '/book', '/pay', '/billing'];

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
  const pathname = usePathname();
  const { isOpen: isLeadModalOpen } = useLeadModal();
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hiddenHere || shownRef.current) return;
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
  }, [hiddenHere]);

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
      {visible && !hiddenHere && !isLeadModalOpen && (
        <motion.aside
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 30 }}
          aria-label="Client story"
          data-track-location="case_study_badge"
          className="fixed z-40 left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] w-[calc(100vw-2rem)] max-w-[340px] sm:left-6 sm:bottom-6"
        >
          <div className="relative rounded-2xl bg-white text-neutral-950 shadow-2xl shadow-neutral-950/15 ring-1 ring-neutral-200 overflow-hidden">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss client story"
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <Link href={STORY_PATH} onClick={open} className="group flex items-stretch gap-3 p-3 pr-9">
              <img
                src="https://www.a-1autodetailing.net/img/og-card.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="w-20 sm:w-24 shrink-0 rounded-xl object-cover bg-neutral-100"
              />
              <span className="flex flex-col justify-center min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-blue-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600" />
                  </span>
                  Client story
                </span>
                <span className="mt-1 text-sm font-extrabold leading-snug tracking-tight">
                  178 five-star reviews. His website was hiding them.
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 group-hover:text-blue-600 transition-colors">
                  How we fixed it for A-1 Auto Detailing
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
