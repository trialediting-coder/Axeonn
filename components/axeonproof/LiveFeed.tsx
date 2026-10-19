'use client';

// components/axeonproof/LiveFeed.tsx
// Leads arriving in the hero window: every few seconds a small card slides in
// at the corner of the dashboard ("Call from Ankeny, just now"), the way the
// app's own lead alerts land. Example events for the fictional demo practice; it
// runs only while the window is on screen and never under reduced motion.
import { useEffect, useState } from 'react';
import { CalendarCheck, FileText, MessageSquare, PhoneCall } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useInView } from '@/components/axeonproof/motion';

const EVENTS: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: PhoneCall, title: 'New call', detail: 'Ankeny, IA · from your Google listing' },
  { icon: CalendarCheck, title: 'Consultation booked', detail: 'New patient, Thu 9:00 AM · from /new-patients' },
  { icon: MessageSquare, title: 'Missed call, texted back', detail: 'Urbandale, IA · reply sent in 12s' },
  { icon: FileText, title: 'Web inquiry, answered', detail: 'West Des Moines, IA · 9:40 PM · reply in 14s' },
  { icon: PhoneCall, title: 'New call', detail: 'Des Moines, IA · from Google Ads' },
];

export function LiveFeed() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    if (!inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let n = 0;
    let hide = 0;
    const show = () => {
      setI(n % EVENTS.length);
      n += 1;
      hide = window.setTimeout(() => setI(null), 3400);
    };
    const first = window.setTimeout(show, 1800);
    const loop = window.setInterval(show, 5200);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(hide);
      window.clearInterval(loop);
    };
  }, [inView]);
  const ev = i === null ? null : EVENTS[i];
  return (
    <div ref={ref} className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex h-14 items-end" aria-live="polite">
      {ev ? (
        <div key={i} className="flex animate-proof-slide items-center gap-3 rounded-xl bg-neutral-950/92 px-3.5 py-2.5 text-white shadow-xl shadow-black/20 ring-1 ring-white/10 backdrop-blur">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <ev.icon size={15} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold leading-tight">{ev.title}</span>
            <span className="block truncate text-[11px] text-neutral-300">{ev.detail} · just now</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
