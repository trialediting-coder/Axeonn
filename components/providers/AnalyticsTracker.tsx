'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-2EDMD31CEP';

/**
 * GA4 event taxonomy (object_action, snake_case). Mark these as Key events
 * in GA4 → Admin → Key events:
 *
 *   booking_completed   — a strategy call was actually booked (fires from the
 *                         LeadConnector calendar iframe's postMessage)
 *   phone_click         — tap/click on a tel: link
 *   book_call_click     — any "Book a Strategy Call" CTA (link to /book or the
 *                         calendar modal opening); the top-of-funnel intent event
 *
 * Everything else is a micro-conversion for funnel analysis, not a key event.
 */
export const EVENTS = {
  bookingCompleted: 'booking_completed',
  bookCallClick: 'book_call_click',
  phoneClick: 'phone_click',
  emailClick: 'email_click',
  leadModalOpened: 'lead_modal_opened',
  popupShown: 'popup_shown',
  popupClaimed: 'popup_claimed',
  popupDismissed: 'popup_dismissed',
  industrySelected: 'industry_selected',
  faqOpened: 'faq_opened',
  sectionViewed: 'section_viewed',
  pricingViewed: 'pricing_viewed',
} as const;

/** Global GA4 event dispatcher (no-op until gtag has loaded). */
export function trackEvent(eventName: string, eventParams: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', eventName, eventParams);
  } catch {
    // Telemetry must never break the page.
  }
}

/** Any CTA whose job is to get someone onto the booking calendar. */
export function trackBookCallClick(location: string, label?: string) {
  trackEvent(EVENTS.bookCallClick, { cta_location: location, cta_label: label ?? '' });
}

/** Someone actually booked a slot in the LeadConnector calendar. */
export function trackBookingCompleted(source: string) {
  trackEvent(EVENTS.bookingCompleted, { source, value: 1, currency: 'USD' });
  // GA4 recommended event too, so Google Ads can import it without a remap.
  trackEvent('generate_lead', { source, lead_type: 'strategy_call', value: 1, currency: 'USD' });
}

export function trackPhoneClick(location: string, phone: string) {
  trackEvent(EVENTS.phoneClick, { cta_location: location, phone });
}

export function trackLeadModalOpened(source: string) {
  trackEvent(EVENTS.leadModalOpened, { source });
  // Opening the modal is a book-call attempt from the funnel's point of view.
  trackBookCallClick(source, 'lead_modal');
}

/**
 * Resolve a human-readable location for an element: an explicit
 * data-track-location, else the nearest section id / header / footer / dialog.
 */
function resolveLocation(el: Element): string {
  const host = el.closest<HTMLElement>('[data-track-location], section[id], header, footer, [role="dialog"]');
  if (!host) return 'page';
  if (host.dataset.trackLocation) return host.dataset.trackLocation;
  if (host.id) return host.id;
  if (host.getAttribute('role') === 'dialog') return host.getAttribute('aria-label') || 'dialog';
  return host.tagName.toLowerCase();
}

function labelOf(el: Element): string {
  return (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}

// Sections whose first appearance in the viewport is worth an event.
const VIEW_SECTIONS: Record<string, string> = {
  pricing: EVENTS.pricingViewed,
  comparison: EVENTS.sectionViewed,
  'who-we-help': EVENTS.sectionViewed,
  faq: EVENTS.sectionViewed,
  'contact-section': EVENTS.sectionViewed,
};

/**
 * Route tracker + site-wide event delegation for GA4.
 *
 * Clicks are captured once at the document level so every Book link, phone
 * link, FAQ toggle and industry tab reports itself without per-component
 * wiring. Booking completions arrive as a postMessage from the LeadConnector
 * iframe ("msgsndr-booking-complete").
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const bookedRef = useRef(false);

  // Page views on every client-side navigation.
  useEffect(() => {
    // Delay slightly to ensure document.title has finalized after navigation
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: pathname + window.location.search,
          send_to: GA_MEASUREMENT_ID,
        });
      }

      // Dispatch custom window event for external CRM tracking bridges
      try {
        window.dispatchEvent(
          new CustomEvent('axeon:page_view', {
            detail: {
              path: pathname,
              url: window.location.href,
              title: document.title,
            },
          })
        );
      } catch {
        // Safe fallback
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Delegated click tracking.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        if (href.startsWith('tel:')) {
          trackPhoneClick(resolveLocation(anchor), href.replace('tel:', ''));
          return;
        }
        if (href.startsWith('mailto:')) {
          trackEvent(EVENTS.emailClick, { cta_location: resolveLocation(anchor) });
          return;
        }
        if (href === '/book' || href.startsWith('/book?') || href.startsWith('/book#')) {
          trackBookCallClick(resolveLocation(anchor), labelOf(anchor));
          return;
        }
      }

      const tracked = target.closest<HTMLElement>('[data-track]');
      if (tracked && tracked.dataset.track) {
        const params: Record<string, unknown> = { cta_location: resolveLocation(tracked) };
        for (const [k, v] of Object.entries(tracked.dataset)) {
          if (k.startsWith('track') && k !== 'track' && k !== 'trackLocation') {
            const key = k.slice(5).replace(/[A-Z]/g, (m) => '_' + m.toLowerCase()).replace(/^_/, '');
            params[key] = v;
          }
        }
        trackEvent(tracked.dataset.track, params);
        return;
      }

      const faq = target.closest<HTMLButtonElement>('button[aria-controls^="faq-answer"], button[aria-controls^="pricing-faq"]');
      if (faq && faq.getAttribute('aria-expanded') === 'false') {
        trackEvent(EVENTS.faqOpened, { faq_question: labelOf(faq), cta_location: resolveLocation(faq) });
        return;
      }

      const industry = target.closest<HTMLElement>('[id^="industry-tab-"]');
      if (industry) {
        trackEvent(EVENTS.industrySelected, {
          industry: industry.id.replace('industry-tab-', ''),
          cta_location: resolveLocation(industry),
        });
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Booking completions from the LeadConnector calendar iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/leadconnectorhq\.com|msgsndr\.com/.test(e.origin)) return;
      const data = e.data;
      const signal =
        typeof data === 'string'
          ? data
          : data && typeof data === 'object'
            ? String((data as Record<string, unknown>).type ?? (data as Record<string, unknown>).event ?? '')
            : '';
      if (!signal.includes('msgsndr-booking-complete')) return;
      if (bookedRef.current) return; // one booking per page load
      bookedRef.current = true;

      const dialogOpen = !!document.querySelector('[role="dialog"][aria-label="Book a strategy session"]');
      const source = dialogOpen ? 'lead_modal' : pathname === '/book' ? 'book_page' : 'contact_section';
      trackBookingCompleted(source);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname]);

  // First-view events for key sections (once per page path).
  useEffect(() => {
    bookedRef.current = false;
    if (typeof IntersectionObserver === 'undefined') return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).id;
          if (seen.has(id)) continue;
          seen.add(id);
          trackEvent(VIEW_SECTIONS[id], { section: id, page_path: pathname });
          observer.unobserve(entry.target);
        }
      },
      // Fire when any part of the section reaches the middle half of the
      // viewport. A ratio threshold would never trip for sections taller
      // than the screen (pricing is ~6000px on a phone).
      { threshold: 0, rootMargin: '-25% 0px -25% 0px' }
    );

    // Sections mount after hydration/route change; look them up on a tick.
    const timer = setTimeout(() => {
      for (const id of Object.keys(VIEW_SECTIONS)) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
