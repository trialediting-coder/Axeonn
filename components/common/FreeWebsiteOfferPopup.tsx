'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeadModal } from '@/components/common/LeadModalProvider';

const DISMISS_KEY = 'axeon-free-website-offer-dismissed-at';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MOBILE_FALLBACK_DELAY_MS = 38_000;
const MOBILE_SCROLL_DEPTH = 0.5;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function readDismissedAt(): number | null {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeDismissedAt(timestamp: number): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(timestamp));
  } catch {
    // Storage unavailable (private browsing, etc.) — the in-memory `shown`
    // flag in the effect below still prevents re-showing within this session.
  }
}

export function FreeWebsiteOfferPopup() {
  const { isOpen: isLeadModalOpen, open: openLeadModal } = useLeadModal();
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
    const dismissedAt = readDismissedAt();
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) {
      return; // still in cooldown, don't attach any triggers
    }

    const show = () => {
      if (shownRef.current || leadModalOpenRef.current) return;
      shownRef.current = true;
      triggerRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    };

    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    if (!isTouchDevice) {
      // Desktop: exit-intent — cursor leaves through the top of the viewport.
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) show();
      };
      document.addEventListener('mouseleave', onMouseLeave);
      return () => document.removeEventListener('mouseleave', onMouseLeave);
    }

    // Mobile/touch: no mouseleave event exists, so fall back to scroll depth
    // or a time delay, whichever comes first.
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

  const dismiss = () => {
    setVisible(false);
    writeDismissedAt(Date.now());
  };

  const claim = () => {
    dismiss();
    openLeadModal();
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
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Move focus into the dialog on open, and back to the trigger on close.
  useEffect(() => {
    if (visible) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [visible]);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // /book already has its own dedicated booking flow — don't stack a second
  // lead-capture overlay on top of it.
  if (pathname === '/book') return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="fixed inset-0 z-[110] bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={dismiss}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Free website offer"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-4 right-4 p-3 sm:p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-950 mb-3">
              You Qualify for a Free Website Build
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              For qualifying Iowa businesses — you only cover hosting, no build fee.
            </p>
            <button
              type="button"
              onClick={claim}
              className="w-full px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer mb-3"
            >
              Claim My Free Website
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="w-full px-6 py-3 text-neutral-500 hover:text-neutral-700 text-sm font-medium transition-colors cursor-pointer"
            >
              No thanks, I&apos;ll pass
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
