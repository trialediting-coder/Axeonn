'use client';

// components/partners/PartnerBriefRequest.tsx
// The /partners ask: three fields (name, firm, email) instead of a mailto: link,
// which did nothing on desktops without a mail client (friction audit E9). Saves
// to the same lead API as the area check with packageId 'partner-brief', so it
// reaches Airtable and the owner's inbox. Same rule as every lead form: retry
// once, and never show "sent" on a failed save.

import { useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowRight, Check, Loader2, Mail, Phone } from 'lucide-react';
import { OWNER_PHONE_DISPLAY, OWNER_PHONE_HREF, leadMailto, saveLead } from '@/lib/leadSubmit';
import { trackEvent } from '@/components/providers/AnalyticsTracker';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const input =
  'w-full min-w-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20';

export function PartnerBriefRequest() {
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [fax, setFax] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    if (!name.trim() || !firm.trim() || !EMAIL_RE.test(email.trim())) {
      setError('Add your name, your firm and a valid email.');
      return;
    }
    setError(null);
    setState('sending');
    const ok = await saveLead(
      {
        contactName: name.trim(),
        businessName: firm.trim(),
        email: email.trim(),
        phone: '',
        website: '',
        services: [],
        packageId: 'partner-brief',
        packageName: 'Partner brief request',
        packagePrice: 0,
        answers: { businessType: 'Partner', hasWebsite: '', goal: 'Partner brief request', budget: '', timeline: '' },
        company_fax: fax,
      },
      'partner-brief',
    );
    if (ok) {
      trackEvent('generate_lead', { source: 'partners', lead_type: 'partner_brief' });
      setState('sent');
    } else {
      trackEvent('lead_save_failed', { source: 'partners', lead_type: 'partner_brief' });
      setState('failed');
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-2xl bg-white/10 border border-white/15 p-5 text-neutral-100">
        <p className="flex items-center gap-2 font-bold text-white">
          <Check size={18} className="text-blue-400" /> Got it, {name.trim().split(' ')[0]}.
        </p>
        <p className="mt-1 text-sm sm:text-base text-neutral-300">
          We&apos;ll send the partner brief to <span className="font-semibold text-white">{email.trim()}</span> within one
          business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative w-full">
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="pb-company_fax">Company fax</label>
        <input id="pb-company_fax" tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <label className="block min-w-0">
          <span className="sr-only">Your name</span>
          <input className={input} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <span className="sr-only">Your firm</span>
          <input className={input} placeholder="Your firm" autoComplete="organization" value={firm} onChange={(e) => setFirm(e.target.value)} />
        </label>
        <label className="block min-w-0 col-span-2">
          <span className="sr-only">Email</span>
          <input
            className={input}
            type="email"
            inputMode="email"
            placeholder="Email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-300">
          {error}
        </p>
      )}
      {state === 'failed' && (
        <div role="alert" className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Something went wrong on our side and your request
            didn&apos;t reach us.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a href={OWNER_PHONE_HREF} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-4 font-semibold text-neutral-950">
              <Phone size={15} /> Call {OWNER_PHONE_DISPLAY}
            </a>
            <a
              href={leadMailto('Partner brief request', 'Please send me the partner brief.', [
                `Name: ${name.trim()}`,
                `Firm: ${firm.trim()}`,
                `Email: ${email.trim()}`,
              ])}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/30 px-4 font-semibold text-white"
            >
              <Mail size={15} /> Email the request
            </a>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        data-track="cta_click"
        data-track-cta="partner_brief_form"
        className="mt-3 w-full inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 font-bold text-white transition-colors disabled:opacity-70 cursor-pointer"
      >
        {state === 'sending' ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            {state === 'failed' ? 'Try again' : 'Request the partner brief'} <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
