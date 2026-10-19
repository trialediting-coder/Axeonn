'use client';

// components/audit/AuditRequest.tsx
// The free after-hours audit request: one short form that saves the lead (so it
// reaches Airtable and the owner's inbox even if they never pick a time), then an
// optional calendar step to walk through the audit together. Modeled on
// components/funnel/FunnelBooking.tsx and posts to the same /api/get-started/lead route.

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { trackEvent } from '@/components/providers/AnalyticsTracker';

export const AUDIT_SPECIALTIES = ['Dental', 'Med spa', 'Law firm', 'Accounting', 'Other'] as const;
type Specialty = (typeof AUDIT_SPECIALTIES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LEAD_TIMEOUT_MS = 10000;

interface AuditForm {
  contactName: string;
  businessName: string;
  specialty: Specialty | '';
  website: string;
  phone: string;
  email: string;
  company_fax: string;
}

const EMPTY: AuditForm = {
  contactName: '',
  businessName: '',
  specialty: '',
  website: '',
  phone: '',
  email: '',
  company_fax: '',
};

type Errors = Partial<Record<keyof AuditForm, string>>;

function validate(f: AuditForm): Errors {
  const e: Errors = {};
  if (!f.contactName.trim()) e.contactName = 'Add your name.';
  if (!f.businessName.trim()) e.businessName = 'Add your practice name.';
  if (!f.specialty) e.specialty = 'Choose your specialty.';
  if (!f.website.trim()) e.website = 'Add your website so we can test it.';
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Add the practice phone number we should call.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Add a valid email so we can send your video.';
  return e;
}

const inputClass =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-colors aria-[invalid=true]:border-red-500';

export function AuditRequest({ source = 'audit' }: { source?: string }) {
  const [step, setStep] = useState<'form' | 'calendar'>('form');
  const [form, setForm] = useState<AuditForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof AuditForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const found = validate(form);
    setErrors(found);
    const firstBad = (Object.keys(found) as (keyof AuditForm)[]).find((k) => found[k]);
    if (firstBad) {
      document.getElementById(`audit-${firstBad}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/get-started/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          businessName: form.businessName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website.trim(),
          services: [],
          packageId: 'free-audit',
          packageName: 'Free after-hours audit',
          packagePrice: 0,
          answers: { businessType: form.specialty, hasWebsite: 'Yes', goal: 'Free after-hours audit', budget: '', timeline: '' },
          company_fax: form.company_fax,
        }),
        keepalive: true,
        signal: AbortSignal.timeout(LEAD_TIMEOUT_MS),
      });
      if (!res.ok) console.error('[audit] lead submit failed', res.status);
    } catch (err) {
      // Never block the visitor on lead capture; the owner email/Airtable path logs its own failures.
      console.error('[audit] lead submit failed', err);
    }

    trackEvent('generate_lead', { source, lead_type: 'free_audit', specialty: form.specialty });
    setSubmitting(false);
    setStep('calendar');
    requestAnimationFrame(() => boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (step === 'calendar') {
    return (
      <div ref={boxRef} className="scroll-mt-28">
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <p className="text-base text-blue-950 leading-relaxed">
            Got it, {form.contactName.trim().split(' ')[0] || 'thanks'}. We&apos;ll run the audit on{' '}
            <span className="font-semibold">{form.businessName.trim()}</span> and email the video walkthrough to{' '}
            <span className="font-semibold">{form.email.trim()}</span>.
          </p>
        </div>
        <p className="mt-8 font-mono text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">Optional</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-neutral-950 leading-tight">
          Pick a time to walk through your audit
        </h2>
        <p className="mt-2 text-base text-neutral-600 leading-relaxed">
          30 minutes on a video call once the audit is done. Skip it if you&apos;d rather just watch the video.
        </p>
        <div className="mt-5 -mx-2 sm:mx-0">
          <BookingCalendar
            minHeight="640px"
            prefill={{ name: form.contactName.trim(), email: form.email.trim(), phone: form.phone.trim() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="scroll-mt-28">
      <form onSubmit={submit} noValidate className="relative">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-neutral-950 leading-tight">
          Request your free audit
        </h2>
        <p className="mt-2 text-base text-neutral-500">Takes 30 seconds. All fields are required.</p>

        {/* Honeypot: hidden from people, filled by bots. */}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="audit-company_fax">Company fax</label>
          <input
            id="audit-company_fax"
            name="company_fax"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.company_fax}
            onChange={set('company_fax')}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field id="contactName" label="Your name" error={errors.contactName}>
            <input
              id="audit-contactName"
              name="contactName"
              type="text"
              autoComplete="name"
              className={inputClass}
              aria-invalid={Boolean(errors.contactName)}
              value={form.contactName}
              onChange={set('contactName')}
            />
          </Field>
          <Field id="businessName" label="Practice name" error={errors.businessName}>
            <input
              id="audit-businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              className={inputClass}
              aria-invalid={Boolean(errors.businessName)}
              value={form.businessName}
              onChange={set('businessName')}
            />
          </Field>
          <Field id="specialty" label="Specialty" error={errors.specialty}>
            <select
              id="audit-specialty"
              name="specialty"
              className={`${inputClass} appearance-none`}
              aria-invalid={Boolean(errors.specialty)}
              value={form.specialty}
              onChange={set('specialty')}
            >
              <option value="" disabled>
                Choose one
              </option>
              {AUDIT_SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field id="website" label="Website" error={errors.website}>
            <input
              id="audit-website"
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="yourpractice.com"
              spellCheck={false}
              className={inputClass}
              aria-invalid={Boolean(errors.website)}
              value={form.website}
              onChange={set('website')}
            />
          </Field>
          <Field id="phone" label="Practice phone" error={errors.phone}>
            <input
              id="audit-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={inputClass}
              aria-invalid={Boolean(errors.phone)}
              value={form.phone}
              onChange={set('phone')}
            />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input
              id="audit-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
              value={form.email}
              onChange={set('email')}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={submitting}
          data-track="cta_click"
          data-track-cta="audit_form"
          className="group mt-6 w-full inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 cursor-pointer disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Get your free after-hours audit{' '}
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500 text-center">
          <Lock size={12} className="shrink-0" /> No charge, no obligation. We only use this to run and send your audit.
        </p>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: keyof AuditForm;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`audit-${id}`} className="mb-1.5 block text-sm font-semibold text-neutral-800">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
