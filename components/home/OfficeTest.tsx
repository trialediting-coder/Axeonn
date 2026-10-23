'use client';

import Link from 'next/link';
import { ArrowUpRight, PhoneCall, PhoneMissed, Timer, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

// The free test we run on a practice before anyone pays. Redesigned 2026-10-22
// (owner: "plain, a lot of empty space"): the steps on the left, and on the
// right a sample of the report they get back, which builds itself row by row
// as it scrolls in. Every number in the sample is made up and the card says so;
// the real report uses the visitor's own office.
const STEPS = [
  { icon: PhoneCall, title: 'We call after hours', detail: 'Like a new patient or client would.' },
  { icon: Timer, title: 'We time your form', detail: 'How long a website inquiry waits for a reply.' },
  { icon: Star, title: 'We check your reviews', detail: 'Side by side with the top 3 nearby.' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

// Purpose: the visitor sees what we test on their own office, free, and what the result looks like.
export function OfficeTest() {
  const reduce = useReducedMotion();
  // One reveal per report row, staggered; reduced motion shows the finished card.
  const row = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.6, delay: 0.15 + i * 0.25, ease: EASE },
        };

  return (
    <section
      id="office-test"
      aria-labelledby="office-test-heading"
      data-track-location="home_office_test"
      className="relative isolate overflow-hidden w-full py-14 sm:py-24 px-4 sm:px-8 lg:px-14 xl:px-20 bg-neutral-950 text-white"
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_40%,rgb(37_99_235/0.22),transparent_55%)]" />

      <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left: what we do on the test */}
        <div className="lg:col-span-5">
          <p className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-blue-400">Free office test</p>
          <h2
            id="office-test-heading"
            className="mt-3 text-[32px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.05]"
          >
            First, we test your&nbsp;office.
          </h2>
          <p className="mt-3 sm:mt-5 text-base sm:text-xl text-neutral-400">
            Before you pay anything, you see exactly where new patients and clients slip&nbsp;away.
          </p>

          <ol className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
            {STEPS.map(({ icon: Icon, title, detail }, i) => (
              <li key={title} className="flex items-start gap-4">
                <span className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-blue-400" aria-hidden="true" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
                  <p className="mt-0.5 text-[15px] sm:text-base text-neutral-400">{detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 sm:mt-10">
            <Link
              href="#contact-section"
              data-track="cta_click"
              data-track-cta="home_office_test_form"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-600/25"
            >
              Test my office free <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right: a sample of the report they get back */}
        <div className="lg:col-span-7">
          <div className="rounded-[24px] sm:rounded-[32px] bg-white text-neutral-950 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 sm:py-5 border-b border-neutral-200">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] uppercase text-neutral-400">Office test report</p>
                <p className="mt-0.5 font-bold text-neutral-950">Example Family Dental</p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-500">Example</span>
            </div>

            <div className="divide-y divide-neutral-100">
              {/* 1. After-hours call */}
              <motion.div {...row(0)} className="px-5 sm:px-8 py-5 sm:py-6 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <PhoneMissed size={19} className="text-red-500" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">After-hours call</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Missed</span>
                  </div>
                  <p className="mt-1 text-sm sm:text-[15px] text-neutral-500">Tuesday, 7:42 PM · rang 6 times · went to voicemail, no text back</p>
                </div>
              </motion.div>

              {/* 2. Website form */}
              <motion.div {...row(1)} className="px-5 sm:px-8 py-5 sm:py-6 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Timer size={19} className="text-amber-600" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">Website form reply</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">14 hours</span>
                  </div>
                  <p className="mt-1 text-sm sm:text-[15px] text-neutral-500">Sent Tuesday, 7:50 PM · first reply Wednesday, 10:14 AM</p>
                  {/* The wait, against the 60-second reply we set up */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="w-16 shrink-0">Today</span>
                      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-amber-500"
                          initial={reduce ? false : { width: '0%' }}
                          whileInView={{ width: '100%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, delay: 0.6, ease: EASE }}
                          style={reduce ? { width: '100%' } : undefined}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="w-16 shrink-0">With us</span>
                      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full w-[2%] min-w-[6px] rounded-full bg-blue-600" />
                      </div>
                      <span className="text-blue-600 font-semibold">60 sec</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 3. Reviews */}
              <motion.div {...row(2)} className="px-5 sm:px-8 py-5 sm:py-6 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Star size={19} className="text-blue-600" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">Google reviews</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">Behind nearby</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[
                      { label: 'You', count: 28, pct: 20, tone: 'bg-neutral-400' },
                      { label: 'Top nearby', count: 140, pct: 100, tone: 'bg-blue-600' },
                    ].map((r, i) => (
                      <div key={r.label} className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="w-16 shrink-0">{r.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${r.tone}`}
                            initial={reduce ? false : { width: '0%' }}
                            whileInView={{ width: `${r.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.9 + i * 0.15, ease: EASE }}
                            style={reduce ? { width: `${r.pct}%` } : undefined}
                          />
                        </div>
                        <span className="w-8 text-right font-semibold text-neutral-700">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="px-5 sm:px-8 py-4 bg-neutral-50 border-t border-neutral-200 text-xs sm:text-sm text-neutral-500">
              Example with made-up numbers. Yours comes from your own office, with what to fix&nbsp;first.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
