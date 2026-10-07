'use client';

import { useState, type MouseEvent } from 'react';
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  CalendarCheck,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { InteractiveFluidAura } from '@/components/ui/InteractiveFluidAura';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

export default function BookClient() {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('515-493-8017');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <main className="min-h-screen w-full bg-white text-zinc-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Main Interactive Stage: Clean White with Smooth Liquid Aura Interaction */}
      <div className="relative w-full overflow-hidden flex flex-col justify-center min-h-screen pt-24 sm:pt-28 pb-12 bg-white">
        {/* Organic, Mouse-Reactive Fluid Aura (Zero dots or grid cliches) */}
        <InteractiveFluidAura />

        {/* Responsive Dual-Column Grid with Distinct, Generous Column & Stack Separation */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 w-full flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-10 sm:gap-12 lg:gap-x-12 xl:gap-x-16 lg:gap-y-10">

            {/* Mobile order (via order-*): pitch, calendar, contact details. On desktop
                the calendar spans both rows on the right. */}
            {/* LEFT, ROW 1 — headline, what you get, one line of proof */}
            <div className="lg:col-start-1 lg:row-start-1 lg:self-end max-w-xl lg:max-w-md xl:max-w-lg lg:pr-6 xl:pr-10">
              <div className="space-y-4 sm:space-y-5">
                <span className="block text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ FREE STRATEGY CALL ]</span>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-zinc-950 tracking-tight leading-[1.12] font-display">
                  See your new homepage before you pay anything.
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                  A focused 30-minute call: we look at how customers find you today, where they slip away, and what it would take to get you more of them.
                </p>

                <ul className="space-y-2.5 pt-1">
                  {[
                    'A custom homepage mockup for your business',
                    'An AI visibility report: how you show up on Google, ChatGPT, and Perplexity',
                    'A clear plan and price, backed by our 90-day customer guarantee',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm sm:text-base text-zinc-700 leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-zinc-500">Yours to keep, whether or not you hire us.</p>

                <figure className="mt-2 rounded-2xl border border-zinc-200 bg-white/80 px-5 py-4">
                  <blockquote className="text-base sm:text-lg font-bold font-display text-zinc-950 leading-snug">
                    &ldquo;{LEVI_QUOTE.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-2 text-sm text-zinc-500">
                    <span className="font-semibold text-zinc-700">{LEVI_QUOTE.name}</span>, {LEVI_QUOTE.role} &middot;{' '}
                    <a href={LEVI_QUOTE.href} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                      Case study
                    </a>
                  </figcaption>
                </figure>
              </div>
            </div>

            {/* LEFT, ROW 2 (after the calendar on mobile) — direct contact */}
            <div className="lg:col-start-1 lg:row-start-2 lg:self-start max-w-xl lg:max-w-md xl:max-w-lg lg:pr-6 xl:pr-10 space-y-7 sm:space-y-9 pt-8 sm:pt-10 border-t border-zinc-100 lg:pt-0 lg:border-t-0 order-3 lg:order-none">
              <div className="space-y-5">
                <div className="space-y-4 sm:space-y-5">
                  {/* Phone Item */}
                  <div className="group flex items-start gap-3.5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                      <Phone size={19} className="stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Direct Phone &bull; Mon–Sat
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer p-2 -m-2"
                          title="Copy phone number"
                        >
                          {copiedPhone ? (
                            <>
                              <Check size={12} className="text-blue-600" />
                              <span className="text-blue-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <a
                        href="tel:515-493-8017"
                        className="text-lg sm:text-xl font-bold text-zinc-950 hover:text-blue-600 transition-colors tracking-tight block mt-0.5"
                      >
                        (515) 493-8017
                      </a>
                    </div>
                  </div>

                  {/* Email Item */}
                  <div className="group flex items-start gap-3.5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                      <Mail size={19} className="stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                        Direct Email
                      </span>
                      <a
                        href="mailto:hello@axeonstudio.co"
                        className="text-sm sm:text-base font-semibold text-zinc-900 hover:text-blue-600 transition-colors tracking-tight block mt-0.5 break-all"
                      >
                        hello@axeonstudio.co
                      </a>
                    </div>
                  </div>

                  {/* Location Item */}
                  <div className="group flex items-start gap-3.5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                      <MapPin size={19} className="stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                        Headquarters &amp; Delivery
                      </span>
                      <p className="text-sm font-medium text-zinc-700 mt-0.5">
                        West Des Moines, Iowa &mdash; Available locally across Greater Des Moines &amp; nationwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimal Session Attributes */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock size={14} className="text-blue-600" />
                  <span>30 Minutes</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <CalendarCheck size={14} className="text-blue-600" />
                  <span>Google Meet / Zoom</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Zero Obligation</span>
                </div>
              </div>

            </div>

            {/* RIGHT, BOTH ROWS — embedded calendar */}
            <div id="booking-calendar-container" className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start w-full order-2 lg:order-none">
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-zinc-500 px-1">
                <span className="font-mono uppercase tracking-wider font-semibold text-zinc-700">
                  Select Date &amp; Time
                </span>
                <span>Central Time (US &amp; Canada)</span>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-1 sm:p-2 shadow-md transition-shadow hover:shadow-lg">
                <BookingCalendar theme="light" minHeight="560px" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
