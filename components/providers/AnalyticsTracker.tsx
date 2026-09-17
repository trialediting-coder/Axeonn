'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Global GA4 & System Telemetry event dispatcher
 */
export function trackEvent(eventName: string, eventParams: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, eventParams);
    } catch {
      // Safe non-blocking telemetry fallback
    }
  }
}

/**
 * Tracks consultation and strategy call bookings
 */
export function trackBookCallConversion(source = 'general') {
  trackEvent('conversion', {
    event_category: 'engagement',
    event_label: `book_call_${source}`,
    send_to: 'G-2EDMD31CEP',
  });
  trackEvent('begin_checkout', {
    item_name: 'Strategy Session',
    item_category: 'Consulting',
    source,
  });
}

/**
 * Tracks phone clicks
 */
export function trackPhoneConversion(phone = '515-493-8017') {
  trackEvent('generate_lead', {
    event_category: 'contact',
    event_label: `phone_call_${phone}`,
  });
}

/**
 * Automatic route tracker for Google Analytics 4 (GA4).
 * Ensures every navigation registers cleanly in real-time.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = typeof window !== 'undefined' ? window.location.search : '';

  useEffect(() => {
    // Delay slightly to ensure document.title has finalized after navigation
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: pathname + window.location.search,
          send_to: 'G-2EDMD31CEP',
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
  }, [pathname, search]);

  return null;
}
