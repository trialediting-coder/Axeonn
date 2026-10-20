'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { BUSINESS } from '@/lib/seo';

const SMS_HREF = `sms:${BUSINESS.telephone.replace(/-/g, '')}`;

/** Floating message bubble in the bottom-right corner (like GoHighLevel's
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
      // Phones and tablets only: sms: links do nothing useful on most desktops
      // (friction audit E11). On phones it is the only floating element, 60px in
      // the corner, below the page's own CTAs.
      className="lg:hidden fixed z-40 right-3 sm:right-4 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))_+_var(--case-study-card-h,0px))] transition-all duration-300 sm:right-6 sm:bottom-6 flex items-center justify-center w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-blue-600 hover:bg-blue-700 text-white ring-1 ring-white/25 shadow-lg shadow-blue-950/30"
    >
      <MessageCircle strokeWidth={2.25} className="w-[28px] h-[28px] sm:w-[34px] sm:h-[34px]" />
    </a>
  );
}

/** Desktop: the same corner bubble, opening a small panel instead of an sms:
 *  link, since a computer usually can't send a text. Each row is one way to reach us. */
export function TextUsDesktop() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const rows = [
    { key: 'text', href: SMS_HREF, icon: MessageCircle, label: `Text ${BUSINESS.telephoneDisplay}` },
    { key: 'call', href: `tel:${BUSINESS.telephone.replace(/-/g, '')}`, icon: Phone, label: `Call ${BUSINESS.telephoneDisplay}` },
    { key: 'book', href: '/book', icon: CalendarDays, label: 'Book a call' },
    { key: 'area', href: '/check-your-area', icon: MapPin, label: 'Check if your area is open' },
  ];

  return (
    <div ref={wrap} className="hidden lg:block fixed z-40 right-6 bottom-6" data-track-location="text_us_button">
      {open && (
        <div
          id="text-us-panel"
          className="absolute right-0 bottom-[88px] w-72 rounded-2xl bg-white text-neutral-950 shadow-2xl shadow-neutral-950/25 ring-1 ring-neutral-200 p-2"
        >
          <p className="px-3 pt-2 pb-1.5 text-sm font-bold">Talk to a real person</p>
          <ul>
            {rows.map(({ key, href, icon: Icon, label }) => (
              <li key={key}>
                <a
                  href={href}
                  data-track="cta_click"
                  data-track-cta={`text_us_${key}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold hover:bg-neutral-100 transition-colors"
                >
                  <Icon size={18} className="text-blue-600" aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="text-us-panel"
        aria-label={open ? 'Close contact options' : 'Contact us'}
        className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-blue-600 hover:bg-blue-700 text-white ring-1 ring-white/25 shadow-lg shadow-blue-950/30 transition-colors"
      >
        {open ? <X size={32} strokeWidth={2.25} /> : <MessageCircle size={34} strokeWidth={2.25} />}
      </button>
    </div>
  );
}
