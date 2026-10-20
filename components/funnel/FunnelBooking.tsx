'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, Lock, Mail, Phone } from 'lucide-react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { trackEvent } from '@/components/providers/AnalyticsTracker';
import { OWNER_PHONE_DISPLAY, OWNER_PHONE_HREF, leadMailto, saveLead } from '@/lib/leadSubmit';

interface FunnelBookingProps {
  slug: string;
  industryName: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Two steps, one goal: a 4-field form saves the lead (so it reaches Airtable
 * even if they never pick a time), then the live calendar books the call.
 * The save is awaited (one retry in saveLead): if it fails, the visitor stays on
 * step 1 and gets click-to-call plus a pre-written email, never a silent loss.
 */
export function FunnelBooking({ slug, industryName }: FunnelBookingProps) {
  const [step, setStep] = useState<'form' | 'calendar'>('form');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ contactName: '', businessName: '', phone: '', email: '', company_fax: '' });
  const boxRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.contactName.trim() || !form.businessName.trim()) return setError('Add your name and practice name.');
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Add a phone number we can reach you at.');
    if (!EMAIL_RE.test(form.email.trim())) return setError('Add a valid email so we can confirm your call.');
    setError('');
    setSubmitting(true);
    setFailed(false);

    const saved = await saveLead(
      {
        contactName: form.contactName.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: '',
        services: [],
        packageId: `ad-funnel-${slug}`,
        packageName: `Ad funnel: ${industryName}`,
        packagePrice: 0,
        answers: { businessType: industryName, hasWebsite: '', goal: 'Answer every call and inquiry', budget: '', timeline: '' },
        company_fax: form.company_fax,
      },
      'ad-funnel',
    );
    setSubmitting(false);

    if (!saved) {
      // Never move on as if we have it: say so and give two ways through.
      setFailed(true);
      trackEvent('lead_save_failed', { source: 'ad_funnel', industry: slug });
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    trackEvent('generate_lead', { source: 'ad_funnel', industry: slug });
    setStep('calendar');
    requestAnimationFrame(() => boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // The visitor's answers, ready to send by email when the save failed.
  const mailtoHref = () =>
    leadMailto(`Area check: ${industryName}`, 'Please check my area.', [
      `Name: ${form.contactName.trim()}`,
      `Practice: ${form.businessName.trim()}`,
      `Specialty: ${industryName}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim()}`,
    ]);

  const input =
    'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

  return (
    <div ref={boxRef} id="book" className="scroll-mt-6 rounded-[28px] bg-white text-neutral-950 shadow-2xl ring-1 ring-black/5 p-6 sm:p-8">
      {step === 'form' ? (
        <form onSubmit={submit} noValidate>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600">Step 1 of 2</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
            Check if your area is open
          </h2>
          <p className="mt-2 text-neutral-600">$0 to start. Takes 20 seconds, then pick a time to go over your area.</p>
          <div className="mt-6 flex flex-col gap-3">
            <label className="sr-only" htmlFor="fb-name">Your name</label>
            <input id="fb-name" className={input} placeholder="Your name" autoComplete="name" value={form.contactName} onChange={set('contactName')} />
            <label className="sr-only" htmlFor="fb-business">Practice name</label>
            <input id="fb-business" className={input} placeholder="Practice name" autoComplete="organization" value={form.businessName} onChange={set('businessName')} />
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
          {failed && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm sm:text-base text-red-900 outline-none"
            >
              <p className="flex items-start gap-2 font-semibold">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                Something went wrong on our side and your request didn&apos;t reach us.
              </p>
              <p className="mt-1 text-red-800">
                Call us and we&apos;ll check your area on the phone, or send the email we wrote for you with your answers.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={OWNER_PHONE_HREF}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-red-600 px-4 font-semibold text-white hover:bg-red-700"
                >
                  <Phone size={16} /> Call {OWNER_PHONE_DISPLAY}
                </a>
                <a
                  href={mailtoHref()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-4 font-semibold text-red-800 hover:bg-red-100"
                >
                  <Mail size={16} /> Email your answers
                </a>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            data-track="cta_click"
            data-track-cta="ad_funnel_form"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold transition-colors shadow-lg shadow-blue-600/25 cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                {failed ? 'Try again' : 'Check if your area is open'} <ArrowRight size={18} />
              </>
            )}
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
            Thanks, {form.contactName.split(' ')[0] || 'there'}. Choose any open time below. We&apos;ll look at how your practice answers calls and inquiries before we talk.
          </p>
          <div className="mt-5 -mx-2 sm:mx-0">
            <BookingCalendar
              minHeight="640px"
              prefill={{ name: form.contactName.trim(), email: form.email.trim(), phone: form.phone.trim() }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
