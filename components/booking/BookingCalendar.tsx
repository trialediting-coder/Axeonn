'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { BOOKING_COMPLETE_EVENT } from '@/components/providers/AnalyticsTracker';

// The free strategy call, booked through Cal.com (cal.com/axeonstudio/strategy-call).
// Availability, Google Calendar sync, the Meet link and confirmation emails all
// live in the Cal.com account; this only embeds it in our pages.
export const CAL_LINK = 'axeonstudio/strategy-call';
export const CAL_BOOKING_URL = `https://cal.com/${CAL_LINK}`;
const CAL_EMBED_SRC = 'https://app.cal.com/embed/embed.js';
const BRAND = '#2563eb';

type CalApi = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns: Record<string, (...args: unknown[]) => void>;
  q?: unknown[];
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

/** Cal.com's official loader snippet: queues calls until embed.js arrives. */
function loadCal(onError: () => void): CalApi {
  const w = window as Window & { Cal?: CalApi };
  if (!w.Cal) {
    /* eslint-disable prefer-rest-params, @typescript-eslint/no-explicit-any */
    const push = (a: any, ar: unknown) => a.q.push(ar);
    w.Cal = function (this: unknown) {
      const cal = w.Cal as any;
      const ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        const s = document.createElement('script');
        s.src = CAL_EMBED_SRC;
        s.async = true;
        s.onerror = onError;
        document.head.appendChild(s);
        cal.loaded = true;
      }
      if (ar[0] === 'init') {
        const api: any = function () {
          push(api, arguments);
        };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          push(cal.ns[namespace], ar);
          push(cal, ['initNamespace', namespace]);
        } else push(cal, ar);
        return;
      }
      push(cal, ar);
    } as unknown as CalApi;
    /* eslint-enable prefer-rest-params, @typescript-eslint/no-explicit-any */
  }
  return w.Cal;
}

interface BookingCalendarProps {
  theme?: 'light' | 'dark';
  className?: string;
  minHeight?: string;
  /** Fills the booking form so the person doesn't retype what they just gave us. */
  prefill?: { name?: string; email?: string; phone?: string };
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  theme = 'light',
  className = '',
  minHeight = '700px',
  prefill,
}) => {
  const [ready, setReady] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  // True when the embed never came up (ad blocker, privacy extension, offline).
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const namespace = `axeon${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const targetId = `cal-inline-${namespace}`;

  // Lazy-load only when the calendar is near the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const Cal = loadCal(() => setFailed(true));
    Cal('init', namespace, { origin: 'https://app.cal.com' });
    const api = Cal.ns[namespace];
    const config: Record<string, string> = { layout: 'month_view', theme };
    if (prefill?.name) config.name = prefill.name;
    if (prefill?.email) config.email = prefill.email;
    if (prefill?.phone) config.attendeePhoneNumber = prefill.phone;
    api('inline', { elementOrSelector: `#${targetId}`, calLink: CAL_LINK, config });
    api('ui', {
      theme,
      hideEventTypeDetails: false,
      layout: 'month_view',
      cssVarsPerTheme: { light: { 'cal-brand': BRAND }, dark: { 'cal-brand': BRAND } },
    });
    // Only on mount: the embed owns its iframe after this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad]);

  // The embed posts { originator: 'CAL', namespace, type } to this window. Listening
  // directly is more reliable than its queued "on" callbacks (which can miss events
  // that fire before embed.js replays the queue).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://app.cal.com') return;
      const d = e.data as { originator?: string; namespace?: string; type?: string } | null;
      if (!d || d.originator !== 'CAL' || d.namespace !== namespace) return;
      if (d.type === 'linkReady') setReady(true);
      if (d.type === 'linkFailed') setFailed(true);
      if (d.type === 'bookingSuccessful' || d.type === 'bookingSuccessfulV2') {
        window.dispatchEvent(new CustomEvent(BOOKING_COMPLETE_EVENT));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [namespace]);

  // If the calendar hasn't come up in a while, show a real way to reach us.
  useEffect(() => {
    if (!shouldLoad || ready) return;
    const timer = window.setTimeout(() => setFailed(true), 12000);
    return () => window.clearTimeout(timer);
  }, [shouldLoad, ready]);

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden transition-all ${
        isLight ? 'border border-gray-200/90 bg-white shadow-xs' : 'border border-zinc-800/80 bg-zinc-900/40'
      } p-1 sm:p-2.5 ${className}`}
      style={{ minHeight }}
    >
      {/* Pulse skeleton until the calendar is ready */}
      {!ready && !failed && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-10 m-1 sm:m-2.5 rounded-xl flex flex-col p-4 sm:p-6 animate-pulse space-y-4 pointer-events-none ${
            isLight ? 'bg-gray-50/95 border border-gray-200/60' : 'bg-zinc-950/95 border border-zinc-800/50'
          }`}
        >
          <div className={`space-y-2 border-b pb-4 ${isLight ? 'border-gray-200/80' : 'border-zinc-800/60'}`}>
            <div className={`h-5 w-44 rounded-md ${isLight ? 'bg-gray-200' : 'bg-zinc-800/80'}`} />
            <div className={`h-3.5 w-60 rounded-md ${isLight ? 'bg-gray-200/70' : 'bg-zinc-800/50'}`} />
          </div>
          <div
            className={`flex-1 min-h-[320px] rounded-xl p-4 ${
              isLight ? 'bg-white border border-gray-200/70' : 'bg-zinc-900/40 border border-zinc-800/40'
            }`}
          >
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className={`h-8 rounded-md ${isLight ? 'bg-gray-100' : 'bg-zinc-800/40'}`} />
              ))}
            </div>
          </div>
          <div
            className={`flex items-center gap-2 text-xs pt-3 border-t ${
              isLight ? 'text-gray-400 border-gray-200/80' : 'text-zinc-500 border-zinc-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
            Loading available times...
          </div>
        </div>
      )}

      {/* Fallback when the embed is blocked or down */}
      {failed && !ready && (
        <div
          role="status"
          className={`absolute inset-0 z-20 m-1 sm:m-2.5 rounded-xl flex flex-col items-center justify-center text-center p-6 sm:p-8 ${
            isLight ? 'bg-white' : 'bg-zinc-950'
          }`}
        >
          <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-neutral-950' : 'text-white'}`}>
            The calendar didn&apos;t load.
          </p>
          <p className={`mt-2 text-sm sm:text-base max-w-sm ${isLight ? 'text-neutral-600' : 'text-zinc-300'}`}>
            Ad blockers and some privacy settings block booking widgets. Open it on its own page, or reach us directly.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href={CAL_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
            >
              Open the booking page
            </a>
            <a
              href="tel:+15154938017"
              className={`inline-flex items-center justify-center px-6 py-3.5 rounded-full border font-semibold text-base transition-colors ${
                isLight ? 'border-neutral-300 text-neutral-900 hover:bg-neutral-50' : 'border-zinc-700 text-white hover:bg-zinc-900'
              }`}
            >
              Call (515) 493-8017
            </a>
          </div>
        </div>
      )}

      {shouldLoad && (
        <div
          id={targetId}
          className={`w-full relative z-0 transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
          style={{ minHeight, overflow: 'auto' }}
        />
      )}
    </div>
  );
};
