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
import { Testimonials } from '@/components/home/Testimonials';

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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 w-full flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 sm:gap-20 lg:gap-20 xl:gap-28 items-center">

            {/* ========================================================= */}
            {/* LEFT COLUMN (lg:col-span-5) — Minimalist & Scaled Credibility */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 space-y-7 sm:space-y-9 max-w-xl lg:max-w-md xl:max-w-lg lg:pr-6 xl:pr-10">

              {/* Main Headline & Context */}
              <div className="space-y-4 sm:space-y-5">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-zinc-950 tracking-tight leading-[1.12] font-display">
                  Schedule a Systems &amp; Architecture Strategy Session
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                  A focused 20–30 minute working session to diagnose manual bottlenecks, audit your inbound lead flow, and engineer custom automation or web architecture for your business.
                </p>
              </div>

              {/* Minimalist, Frameless Direct Contact Info */}
              <div className="pt-2 sm:pt-4 space-y-5">
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
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedPhone ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied!</span>
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
                        href="mailto:hayder.hatem@axeonstudio.co"
                        className="text-sm sm:text-base font-semibold text-zinc-900 hover:text-blue-600 transition-colors tracking-tight block mt-0.5 break-all"
                      >
                        hayder.hatem@axeonstudio.co
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
                  <span>20–30 Minutes</span>
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

            {/* ========================================================= */}
            {/* RIGHT COLUMN (lg:col-span-7) — Embedded Calendar Frame */}
            {/* ========================================================= */}
            <div id="booking-calendar-container" className="lg:col-span-7 w-full mt-10 sm:mt-14 lg:mt-0 pt-8 sm:pt-10 lg:pt-0 border-t border-zinc-100 lg:border-t-0 lg:pl-8 xl:pl-16">
              <div className="mb-3 sm:mb-4 flex items-center justify-between text-xs text-zinc-500 px-1">
                <span className="font-mono uppercase tracking-wider font-semibold text-zinc-700">
                  Select Date &amp; Time
                </span>
                <span>Central Time (US &amp; Canada)</span>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-white p-1 sm:p-2 shadow-md transition-shadow hover:shadow-lg">
                <BookingCalendar theme="light" minHeight="700px" />
              </div>
            </div>

          </div>
        </div>
      </div>
      <Testimonials />
    </main>
  );
}
