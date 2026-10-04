'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { trackEvent } from '@/components/providers/AnalyticsTracker';

interface FunnelBookingProps {
  slug: string;
  industryName: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Two steps, one goal: a 4-field form saves the lead (so it reaches Airtable
 * even if they never pick a time), then the live calendar books the call.
 */
export function FunnelBooking({ slug, industryName }: FunnelBookingProps) {
  const [step, setStep] = useState<'form' | 'calendar'>('form');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ contactName: '', businessName: '', phone: '', email: '', company_fax: '' });
  const boxRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName.trim() || !form.businessName.trim()) return setError('Add your name and business name.');
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Add a phone number we can reach you at.');
    if (!EMAIL_RE.test(form.email.trim())) return setError('Add a valid email so we can send your mockup.');
    setError('');

    // Fire and forget: a slow webhook must never stop someone from booking.
    fetch('/api/get-started/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: form.contactName.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: '',
        services: [],
        packageId: `ad-funnel-${slug}`,
        packageName: `Ad funnel (free website): ${industryName}`,
        packagePrice: 0,
        answers: { businessType: industryName, hasWebsite: '', goal: 'More calls and leads', budget: '', timeline: '' },
        company_fax: form.company_fax,
      }),
      keepalive: true,
    }).catch(() => {});

    trackEvent('generate_lead', { source: 'ad_funnel', industry: slug });
    setStep('calendar');
    requestAnimationFrame(() => boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const input =
    'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

  return (
    <div ref={boxRef} id="book" className="scroll-mt-6 rounded-[28px] bg-white text-neutral-950 shadow-2xl ring-1 ring-black/5 p-6 sm:p-8">
      {step === 'form' ? (
        <form onSubmit={submit} noValidate>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600">Step 1 of 2</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
            Claim your free website
          </h2>
          <p className="mt-2 text-neutral-600">Takes 20 seconds. Then pick a time for your free call.</p>
          <div className="mt-6 flex flex-col gap-3">
            <label className="sr-only" htmlFor="fb-name">Your name</label>
            <input id="fb-name" className={input} placeholder="Your name" autoComplete="name" value={form.contactName} onChange={set('contactName')} />
            <label className="sr-only" htmlFor="fb-business">Business name</label>
            <input id="fb-business" className={input} placeholder="Business name" autoComplete="organization" value={form.businessName} onChange={set('businessName')} />
            <label className="sr-only" htmlFor="fb-phone">Phone</label>
            <input id="fb-phone" className={input} placeholder="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            <label className="sr-only" htmlFor="fb-email">Email</label>
            <input id="fb-email" className={input} placeholder="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            {/* Honeypot: hidden from people, filled by bots. */}
            <input
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="absolute -left-[9999px] w-px h-px opacity-0"
              value={form.company_fax}
              onChange={set('company_fax')}
              name="company_fax"
            />
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            data-track="cta_click"
            data-track-cta="ad_funnel_form"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold transition-colors shadow-lg shadow-blue-600/25 cursor-pointer"
          >
            Book My Free Call <ArrowRight size={18} />
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <Lock size={12} /> No spam. We only use this to set up your call.
          </p>
        </form>
      ) : (
        <div>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600">Step 2 of 2</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
            Pick a time for your free call
          </h2>
          <p className="mt-2 text-neutral-600">
            Thanks, {form.contactName.split(' ')[0] || 'friend'}. Choose any open time below. We&apos;ll bring your homepage mockup.
          </p>
          <div className="mt-5 -mx-2 sm:mx-0">
            <BookingCalendar minHeight="640px" />
          </div>
        </div>
      )}
    </div>
  );
}
