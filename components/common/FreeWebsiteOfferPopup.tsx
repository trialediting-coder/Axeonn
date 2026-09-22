'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeadModal } from '@/components/common/LeadModalProvider';
import { trackEvent, EVENTS } from '@/components/providers/AnalyticsTracker';
import { foundingOffer } from '@/data/foundingOfferData';
import { useIsMobile } from '@/lib/useMediaQuery';

const POPUP_ID = 'founding_client_offer';
const VARIANT = 'v2_value_stack';

const DISMISS_KEY = 'axeon-founding-offer-dismissed-at';
const CLAIMED_KEY = 'axeon-founding-offer-claimed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days after a dismiss

// Desktop: exit intent only — it never interrupts reading.
// Phone: no exit-intent event exists, so show once the visitor has proven
// interest (deep scroll) or spent real time, whichever comes first. The old
// 50% / 38s triggers fired mid-way through the industry selector.
const MOBILE_SCROLL_DEPTH = 0.65;
const MOBILE_FALLBACK_DELAY_MS = 45_000;
// Never fire in the first seconds on any device (bounce traffic, bots).
const MIN_DWELL_MS = 8_000;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

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
    // Storage unavailable (private browsing, etc.) — the in-memory `shown`
    // flag still prevents re-showing within this session.
  }
}

export function FreeWebsiteOfferPopup() {
  const { isOpen: isLeadModalOpen, open: openLeadModal } = useLeadModal();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);
  const leadModalOpenRef = useRef(isLeadModalOpen);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    leadModalOpenRef.current = isLeadModalOpen;
  }, [isLeadModalOpen]);

  useEffect(() => {
    if (!foundingOffer.active || foundingOffer.spotsRemaining <= 0) return;
    // Never on the pricing page: the "built free" headline would undercut the
    // $2,800 anchor at the exact decision moment. /book has its own flow.
    if (window.location.pathname === '/pricing' || window.location.pathname === '/book') return;
    if (readStorage(CLAIMED_KEY) === '1') return; // already on the calendar once
    const dismissedAt = Number(readStorage(DISMISS_KEY));
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    const mountedAt = Date.now();

    const show = () => {
      if (shownRef.current || leadModalOpenRef.current) return;
      if (Date.now() - mountedAt < MIN_DWELL_MS) return;
      shownRef.current = true;
      triggerRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
      trackEvent(EVENTS.popupShown, {
        popup: POPUP_ID,
        variant: VARIANT,
        page_path: window.location.pathname,
      });
    };

    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    if (!isTouchDevice) {
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) show();
      };
      document.addEventListener('mouseleave', onMouseLeave);
      return () => document.removeEventListener('mouseleave', onMouseLeave);
    }

    const onScroll = () => {
      const scrolledFraction =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      if (scrolledFraction >= MOBILE_SCROLL_DEPTH) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timeoutId = window.setTimeout(show, MOBILE_FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const hide = () => {
    setVisible(false);
    writeStorage(DISMISS_KEY, String(Date.now()));
  };

  const dismiss = (method: 'button' | 'backdrop' | 'escape' | 'decline') => {
    hide();
    trackEvent(EVENTS.popupDismissed, { popup: POPUP_ID, variant: VARIANT, method });
  };

  const claim = () => {
    hide();
    writeStorage(CLAIMED_KEY, '1');
    trackEvent(EVENTS.popupClaimed, { popup: POPUP_ID, variant: VARIANT });
    openLeadModal('founding_offer_popup');
  };

  // Trap Tab/Shift+Tab focus cycling within the dialog while it's open.
  const handleDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !dialog.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  };

  // Close on Escape while visible.
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss('escape');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Move focus into the dialog on open, and back to the trigger on close.
  useEffect(() => {
    if (visible) closeButtonRef.current?.focus();
    else triggerRef.current?.focus();
  }, [visible]);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // /book already has its own dedicated booking flow — don't stack a second
  // lead-capture overlay on top of it.
  if (pathname === '/book' || pathname === '/pricing') return null;

  const sheet = isMobile === true;
  const spotsLeft = foundingOffer.spotsRemaining;
  const spotsTaken = foundingOffer.totalSpots - spotsLeft;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          className={`fixed inset-0 z-[110] bg-neutral-950/70 backdrop-blur-sm flex p-0 sm:p-6 ${
            sheet ? 'items-end justify-center' : 'items-center justify-center'
          }`}
          onClick={() => dismiss('backdrop')}
          role="presentation"
        >
          <motion.div
            initial={sheet ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }
            }
            className={`relative w-full bg-white text-neutral-950 shadow-2xl overflow-hidden ${
              sheet
                ? 'rounded-t-[28px] max-h-[92dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]'
                : 'max-w-lg rounded-[28px]'
            }`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="founding-offer-title"
            aria-describedby="founding-offer-terms"
            data-track-location="founding_offer_popup"
          >
            {/* Grab handle on the phone sheet */}
            {sheet && (
              <div aria-hidden="true" className="pt-3 flex justify-center">
                <span className="block h-1.5 w-12 rounded-full bg-neutral-200" />
              </div>
            )}

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => dismiss('button')}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-3 sm:p-2 rounded-full bg-white/80 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header band: eyebrow + scarcity + price anchor */}
            <div className="bg-neutral-950 text-white px-6 sm:px-8 pt-7 sm:pt-8 pb-6">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-blue-300">
                <Sparkles size={14} className="text-blue-400" />
                <span>{foundingOffer.eyebrow}</span>
              </div>
              <h2
                id="founding-offer-title"
                className="mt-3 text-[26px] sm:text-3xl font-black tracking-tight leading-[1.1]"
              >
                {foundingOffer.headline}
              </h2>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {foundingOffer.anchorLabel}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="text-xl sm:text-2xl font-bold text-neutral-500 line-through decoration-2 decoration-red-400/80">
                      {foundingOffer.anchorPrice}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white">Free</span>
                  </div>
                </div>

                {/* Honest scarcity: 5 real spots, counter driven by data file */}
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Founding spots
                  </div>
                  <div className="mt-1.5 flex items-center justify-end gap-1.5" aria-label={`${spotsLeft} of ${foundingOffer.totalSpots} spots open`}>
                    {Array.from({ length: foundingOffer.totalSpots }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-6 rounded-full ${
                          i < spotsTaken ? 'bg-neutral-700' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-sm font-bold text-blue-300">
                    {spotsLeft} of {foundingOffer.totalSpots} open
                  </div>
                </div>
              </div>
            </div>

            {/* Body: value stack + CTA + terms */}
            <div className="px-6 sm:px-8 pt-5 pb-6 sm:pb-7">
              <p className="text-[15px] sm:text-base text-neutral-600 leading-relaxed">
                {foundingOffer.subhead}
              </p>

              <ul className="mt-4 space-y-2.5">
                {foundingOffer.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] sm:text-base text-neutral-800">
                    <span className="mt-[3px] shrink-0 w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Check size={12} strokeWidth={3} className="text-blue-600" />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={claim}
                className="group mt-6 w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <span>{foundingOffer.cta}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-2.5 text-center text-xs sm:text-[13px] text-neutral-500">
                {foundingOffer.ctaHint}
              </p>

              <button
                type="button"
                onClick={() => dismiss('decline')}
                className="mt-3 w-full py-2 text-sm font-medium text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                {foundingOffer.decline}
              </button>

              <p
                id="founding-offer-terms"
                className="mt-3 pt-3 border-t border-neutral-100 text-[11px] sm:text-xs leading-relaxed text-neutral-400"
              >
                {foundingOffer.terms}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
