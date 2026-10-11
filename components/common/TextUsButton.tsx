'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { BUSINESS } from '@/lib/seo';

const SMS_HREF = `sms:${BUSINESS.telephone.replace(/-/g, '')}`;

/** Floating "Text us" bubble in the bottom-right corner (like GoHighLevel's
 *  text widget): one tap opens the visitor's messaging app addressed to us. */
export function TextUsButton() {
  const ref = useRef<HTMLAnchorElement>(null);

  // Publish the bubble's footprint (height plus a 12px gap) so the minimized
  // free-website pill on phones can sit above it instead of underneath.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el) return;
    const update = () => root.style.setProperty('--text-us-h', `${el.offsetHeight + 12}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty('--text-us-h', '0px');
    };
  }, []);

  return (
    <a
      ref={ref}
      href={SMS_HREF}
      aria-label={`Text us at ${BUSINESS.telephoneDisplay}`}
      title={`Text us at ${BUSINESS.telephoneDisplay}`}
      data-track-location="text_us_button"
      // Phone: rides above the case-study card while it spans the bottom.
      // Desktop: fixed in the corner, clear of the card on the left.
      className="fixed z-40 right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_var(--case-study-card-h,0px))] transition-all duration-300 sm:right-6 sm:bottom-6 flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold ring-1 ring-white/25 shadow-lg shadow-blue-950/30"
    >
      <MessageCircle size={18} className="shrink-0" />
      Text us
    </a>
  );
}
