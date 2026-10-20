'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  LayoutTemplate,
  Star,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Calendar,
} from 'lucide-react';

// What we commit to, stated as facts we control (no client results: Axeon has
// no practice clients yet, and never promises a number of patients or leads).
const HERO_FACTS = [
  { value: '60 sec', label: 'to the first reply on every missed call and web inquiry, 24/7' },
  { value: '30 days', label: 'to go live once we have your materials' },
  { value: '5 miles', label: 'one practice or firm per specialty, while your account is in good standing' },
];

// The three layers; the performance commitment is rendered as the fourth, blue cell.
const STEPS = [
  {
    icon: LayoutTemplate,
    title: 'Practice or Firm Website',
    description: 'Your dentists, providers, attorneys or CPAs with credentials, services, real reviews and online booking on a fast, mobile-first site.',
  },
  {
    icon: PhoneCall,
    title: '60-Second Intake',
    description: 'Every missed call and web inquiry answered within 60 seconds, 24/7, with a two-way text inbox for the front desk or intake team.',
  },
  {
    icon: Star,
    title: 'Review Engine',
    description: 'An automatic review request after every completed appointment or engagement.',
  },
];

const HOW_WE_WORK = [
  'You talk to the people building your system. No account managers, no hand-offs to a junior team.',
  'We take one practice or firm per specialty in each area, so we are never building for your competitor down the street.',
  'You go live within 30 days of getting your materials. Not six months.',
  'Every reply and booking shows up in AxeonPROOF, your client portal, with a report every month.',
];

export default function AboutClient() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F8] text-neutral-950 font-sans selection:bg-blue-600 selection:text-white">
      {/* SECTION 1: Hero + proof */}
      <section className="min-h-[70vh] flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 relative pt-24 sm:pt-28 pb-12">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-4">
            <span>AXEON STUDIO</span>
            <span>/</span>
            <span className="text-blue-600">[ WEST DES MOINES, IOWA ]</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7 hero-rise">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.08]">
                Your practice or firm is great.
                <span className="block text-blue-600 mt-2">Your voicemail is losing patients and clients.</span>
              </h1>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-end hero-rise">
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                Axeon was built in West Des Moines to fix that. We install patient and client intake for dental practices, med
                spas, law firms and CPA firms, so every call and inquiry gets an answer within 60 seconds. You work
                directly with the team doing the work.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/audit')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <span>Get your free after-hours audit</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/axeonproof')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-semibold text-sm tracking-tight transition-all duration-200 cursor-pointer"
                >
                  <span>Tour AxeonPROOF</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* What we commit to (replaces the stock team photo) */}
          <div className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-xl p-6 sm:p-10">
            <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-6">
              [ WHAT WE COMMIT TO ]
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
              {HERO_FACTS.map((p) => (
                <div key={p.label} className="border-l-2 border-blue-600 pl-4">
                  <p className="text-3xl sm:text-5xl font-black font-display tracking-tight">{p.value}</p>
                  <p className="mt-1.5 text-sm text-neutral-400 leading-snug">{p.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/marketing-solutions"
              className="py-2 mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-white transition-colors"
            >
              See how it works <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: the system in one row (three layers + the performance commitment) */}
      <section className="px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 bg-[#F7F6F3]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                [ FROM FIRST CALL TO BOOKED CONSULT ]
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-950 font-display tracking-tight mt-2">
                Answered. Booked. Reviewed. Committed.
              </h2>
            </div>
            <Link
              href="/process"
              className="py-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 shrink-0"
            >
              See the full process <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] rounded-3xl overflow-hidden border border-neutral-200 bg-white">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 flex gap-4 lg:block"
                >
                  <div className="flex items-center gap-3 lg:mb-4 shrink-0">
                    <span className="font-mono text-xs font-bold text-neutral-400">0{idx + 1}</span>
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-neutral-950">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm sm:text-base text-neutral-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
            <Link
              href="/pricing"
              className="group p-6 sm:p-8 bg-blue-600 text-white flex flex-col justify-between gap-4 hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-blue-100">
                <ShieldCheck size={16} />
                <span>Performance commitment</span>
              </div>
              <div>
                <div className="text-5xl sm:text-6xl font-black font-display tracking-tight leading-none">90 days</div>
                <p className="mt-3 text-sm sm:text-base text-blue-50 leading-relaxed">
                  Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. Miss any of those in the first 90 days and don&apos;t get it fixed within 15 days? Walk away and owe nothing for the rest of the term.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                See the terms <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      {/* SECTION 3: Why Axeon exists */}
      <section className="flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative bg-[#FAF9F8]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5"
            >
              <div className="relative w-full max-w-md mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl border border-neutral-800 bg-neutral-950 text-white p-8 sm:p-10">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-300 font-semibold mb-3">
                  <MapPin size={13} />
                  <span>West Des Moines, Iowa</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">Axeon Studio</div>
                <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed">
                  Patient and client intake for private practices and professional firms. Built here, answering the phone here.
                </p>
              </div>

              <div className="mt-5 p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs max-w-md mx-auto lg:max-w-none">
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Direct Contact
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-neutral-900 font-mono">
                  <a href="tel:5154938017" className="hover:text-blue-600 transition-colors">
                    (515) 493-8017
                  </a>
                  <span className="text-neutral-300">•</span>
                  <a
                    href="mailto:hello@axeonstudio.co"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    hello@axeonstudio.co
                  </a>
                </div>
                <div className="text-xs text-neutral-500 mt-1.5">
                  You talk to the team building your system. Not a sales rep, not an account manager.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6"
            >
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                  [ WHY AXEON EXISTS ]
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 font-display tracking-tight mt-2">
                  Why Axeon exists.
                </h2>
                <div className="mt-5 space-y-4 text-sm sm:text-base lg:text-lg text-neutral-600 leading-relaxed">
                  <p>
                    Good practices and firms lose new patients and clients every week without knowing it. The call comes in after
                    hours or during a busy morning, goes to voicemail, and the person books with whoever answered first.
                    The web form waits until tomorrow.
                  </p>
                  <p>
                    So <strong className="text-neutral-950 font-display">Axeon</strong> installs the intake that answers
                    them: a reply within 60 seconds, a way to book, and a review request after the visit or engagement. We commit to
                    those in writing, and you can walk away if we miss them.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-md">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">Who we work with</div>
                <p className="mt-3 text-lg sm:text-xl font-bold font-display text-neutral-100 leading-snug">
                  Established private practices and firms: dental offices, med spas, law firms and accounting and CPA firms.
                </p>
                <Link
                  href="/solutions"
                  className="py-2 mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-300 hover:text-white transition-colors"
                >
                  See who we serve <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: dark statement band — how we work */}
      <section className="px-4 sm:px-8 lg:px-14 xl:px-20 py-16 sm:py-24 lg:py-28 bg-neutral-950 text-white">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ HOW WE WORK ]</span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.05] mt-3">
              You&apos;ll never talk to an account manager.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-neutral-400 leading-relaxed max-w-md">
              Out here you earn trust by doing what you said you would. No big-city office overhead, so your money goes
              into the system that answers your patients and clients.
            </p>
          </div>
          <ol className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
            {HOW_WE_WORK.map((item, idx) => (
              <li key={item} className="flex items-baseline gap-5 sm:gap-8 py-6 sm:py-7">
                <span className="text-3xl sm:text-5xl font-black font-display text-blue-500 tabular-nums shrink-0">
                  0{idx + 1}
                </span>
                <span className="text-lg sm:text-2xl lg:text-[28px] font-bold font-display tracking-tight leading-snug text-neutral-100">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 5: Next Step CTA (light, so it doesn't echo the dark band above) */}
      <section className="px-4 sm:px-8 lg:px-14 xl:px-20 py-16 sm:py-24">
        <div className="w-full max-w-4xl mx-auto text-center">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ LET&apos;S TALK ]</span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 font-display tracking-tight mt-3">
            Find out what happens after hours.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 mt-4 leading-relaxed max-w-2xl mx-auto">
            We call your practice or firm after hours, check how fast your website answers an inquiry, and compare your reviews to
            the top 3 nearby competitors. You get a short video walkthrough of what we found. No charge.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/audit')}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base tracking-tight shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <Calendar size={18} />
              <span>Get your free after-hours audit</span>
            </button>
            <a
              href="tel:5154938017"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-neutral-300 hover:bg-white text-neutral-900 font-semibold text-base transition-colors"
            >
              Call (515) 493-8017
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm font-mono text-neutral-500">
            <a href="mailto:hello@axeonstudio.co" className="hover:text-neutral-900 transition-colors underline">
              hello@axeonstudio.co
            </a>
            <span>•</span>
            <span>West Des Moines, Iowa</span>
          </div>
        </div>
      </section>
    </div>
  );
}
