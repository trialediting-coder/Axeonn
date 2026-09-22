'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { trackLeadModalOpened } from '@/components/providers/AnalyticsTracker';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface LeadModalContextValue {
  isOpen: boolean;
  /** `source` names the CTA that opened the modal, for GA4 attribution. */
  open: (source?: string) => void;
  close: () => void;
}

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function useLeadModal(): LeadModalContextValue {
  const ctx = useContext(LeadModalContext);
  if (!ctx) {
    throw new Error('useLeadModal must be used within a LeadModalProvider');
  }
  return ctx;
}

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const open = useCallback((source?: string) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
    // Callers may pass this straight to onClick, in which case `source` is a
    // synthetic event rather than a string.
    trackLeadModalOpened(typeof source === 'string' ? source : 'unknown');
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Lock page scroll behind the dialog so the calendar scrolls, not the page.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Move focus into the dialog on open, and back to the trigger on close.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

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

  return (
    <LeadModalContext.Provider value={{ isOpen, open, close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={close}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              data-lenis-prevent
              className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl bg-white overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleDialogKeyDown}
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Book a strategy session"
            >
              <div className="flex items-start justify-between gap-4 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950">
                    Book a free strategy call
                  </h2>
                  <p className="mt-1 text-sm sm:text-[15px] text-neutral-600 leading-snug">
                    20&ndash;30 minutes on Google Meet or Zoom. No pitch deck &mdash; we look at your business and tell you exactly what we&apos;d build and what it costs.
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="shrink-0 p-3 sm:p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
                <BookingCalendar theme="light" minHeight="620px" />
              </div>
              <div className="px-5 sm:px-7 py-3 border-t border-neutral-100 text-center text-xs sm:text-sm text-neutral-500">
                Rather talk now?{' '}
                <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:underline">
                  Call (515) 493-8017
                </a>{' '}
                or{' '}
                <a href="mailto:hello@axeonstudio.co" className="font-semibold text-blue-600 hover:underline">
                  email us
                </a>
                .
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LeadModalContext.Provider>
  );
}
