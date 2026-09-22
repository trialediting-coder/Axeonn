'use client';

import React, { useEffect, useState, useRef } from 'react';

interface BookingCalendarProps {
  theme?: 'light' | 'dark';
  className?: string;
  minHeight?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  theme = 'light',
  className = '',
  minHeight = '700px',
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  // True when the embed never came up (ad blocker, privacy extension, offline).
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy-mount iframe and script only when scrolled within viewport
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

    const scriptSrc = 'https://link.msgsndr.com/js/form_embed.js';
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'text/javascript';
      script.async = true;
      script.onerror = () => setFailed(true);
      document.body.appendChild(script);
    }
  }, [shouldLoad]);

  // If the calendar hasn't loaded within a few seconds, stop pretending and
  // show a real way to reach us. A blocked iframe used to spin forever.
  useEffect(() => {
    if (!shouldLoad || iframeLoaded) return;
    const timer = window.setTimeout(() => setFailed(true), 9000);
    return () => window.clearTimeout(timer);
  }, [shouldLoad, iframeLoaded]);

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden transition-all ${
        isLight
          ? 'border border-gray-200/90 bg-white shadow-xs'
          : 'border border-zinc-800/80 bg-zinc-900/40'
      } p-1 sm:p-2.5 ${className}`}
    >
      {/* Minimal CSS pulse skeleton that hides once the iframe mounts/loads */}
      {!iframeLoaded && !failed && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-10 m-1 sm:m-2.5 rounded-xl flex flex-col p-4 sm:p-6 animate-pulse space-y-4 pointer-events-none ${
            isLight
              ? 'bg-gray-50/95 border border-gray-200/60'
              : 'bg-zinc-950/95 border border-zinc-800/50'
          }`}
        >
          {/* Header Skeleton */}
          <div
            className={`space-y-2 border-b pb-4 ${
              isLight ? 'border-gray-200/80' : 'border-zinc-800/60'
            }`}
          >
            <div
              className={`h-5 w-44 rounded-md ${
                isLight ? 'bg-gray-200' : 'bg-zinc-800/80'
              }`}
            />
            <div
              className={`h-3.5 w-60 rounded-md ${
                isLight ? 'bg-gray-200/70' : 'bg-zinc-800/50'
              }`}
            />
          </div>

          {/* Timezone / Filter Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-8 rounded-lg ${
                  isLight ? 'bg-gray-200/80' : 'bg-zinc-800/60'
                }`}
              />
            ))}
          </div>

          {/* Calendar Grid Skeleton */}
          <div
            className={`flex-1 min-h-[320px] rounded-xl p-4 space-y-3 ${
              isLight
                ? 'bg-white border border-gray-200/70'
                : 'bg-zinc-900/40 border border-zinc-800/40'
            }`}
          >
            <div className="flex justify-between items-center">
              <div
                className={`h-4 w-28 rounded-md ${
                  isLight ? 'bg-gray-200' : 'bg-zinc-800/70'
                }`}
              />
              <div className="flex gap-2">
                <div
                  className={`h-6 w-6 rounded-md ${
                    isLight ? 'bg-gray-200/80' : 'bg-zinc-800/50'
                  }`}
                />
                <div
                  className={`h-6 w-6 rounded-md ${
                    isLight ? 'bg-gray-200/80' : 'bg-zinc-800/50'
                  }`}
                />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-8 rounded-md ${
                    isLight ? 'bg-gray-100' : 'bg-zinc-800/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Status Skeleton */}
          <div
            className={`flex items-center justify-between text-xs pt-3 border-t ${
              isLight
                ? 'text-gray-400 border-gray-200/80'
                : 'text-zinc-500 border-zinc-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
              Loading real-time calendar...
            </span>
            <span>AxeonStudio</span>
          </div>
        </div>
      )}

      {/* Fallback when the embed is blocked or down */}
      {failed && !iframeLoaded && (
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
            Ad blockers and some privacy settings block booking widgets. Reach us directly instead &mdash; same free call.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="tel:+15154938017"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
            >
              Call (515) 493-8017
            </a>
            <a
              href="mailto:hello@axeonstudio.co?subject=Strategy%20call"
              className={`inline-flex items-center justify-center px-6 py-3.5 rounded-full border font-semibold text-base transition-colors ${
                isLight ? 'border-neutral-300 text-neutral-900 hover:bg-neutral-50' : 'border-zinc-700 text-white hover:bg-zinc-900'
              }`}
            >
              Email hello@axeonstudio.co
            </a>
          </div>
        </div>
      )}

      {/* Calendar Iframe with lazy loading */}
      {shouldLoad && (
        <iframe
          src="https://api.leadconnectorhq.com/widget/booking/CgFUJuX7L3le0eqUudpe"
          allow="payment"
          loading="lazy"
          style={{
            width: '100%',
            border: 'none',
            minHeight,
          }}
          id="axeon-booking-widget"
          title="AxeonStudio Strategy Session Booking"
          onLoad={() => setIframeLoaded(true)}
          className={`w-full transition-opacity duration-300 relative z-0 ${
            iframeLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
