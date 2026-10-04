'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Star,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Calendar,
  Mail,
  Quote,
  Check,
} from 'lucide-react';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

const CASE_STUDY = '/insights/a-1-auto-detailing-website-case-study';

// Approved facts only (content/brand-guardrails.md): A-1 is the one published
// client, and every outside stat links to its source.
const HERO_PROOF = [
  { value: '#1', label: 'on Google for A-1 Auto Detailing, up from page 2' },
  { value: '180+', label: 'five-star reviews, now front and center' },
  { value: '5.0', label: 'client rating' },
];

const PILLARS = [
  {
    icon: Search,
    title: 'Get Found',
    description: 'Show up first on Google, Maps, and AI search when people nearby look for what you do.',
    metric: '100/100',
    metricLabel: 'SEO audit score on A-1’s new site',
    href: CASE_STUDY,
  },
  {
    icon: Star,
    title: 'Get Chosen',
    description: 'Real reviews, real prices, and a fast mobile site, so you win the side-by-side comparison.',
    metric: '97%',
    metricLabel: 'of people read reviews before choosing (BrightLocal)',
    href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
  },
  {
    icon: PhoneCall,
    title: 'Get Booked',
    description: 'Instant call connect, missed-call text-back, and automatic follow-up until they book.',
    metric: '62%',
    metricLabel: 'of small-business calls go unanswered (411 Locals)',
    href: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
  },
  {
    icon: ShieldCheck,
    title: 'Guaranteed',
    description:
      'More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.',
    metric: '90 days',
    metricLabel: 'Baseline set on your kickoff call. See the terms',
    href: '/pricing',
  },
];

const HOW_I_WORK = [
  'You talk to me. No account managers, no hand-offs to a junior team.',
  'I take on a handful of clients at a time, so your project never sits in a queue.',
  'You go live in a fraction of the time a typical agency takes. Not six months.',
  'Your calls and leads are tracked from day one, with a report every month.',
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
            <span className="text-blue-600">[ IOWA&apos;S FIRST AI-FORWARD DIGITAL AGENCY ]</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7 hero-rise">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.08]">
                Your website is fine.
                <span className="block text-blue-600 mt-2">It just doesn&apos;t make any money.</span>
              </h1>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-end hero-rise">
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                I started Axeon in West Des Moines to fix that. We get Iowa businesses more calls, more booked jobs, and
                more customers. And you work directly with me.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/book')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <span>Get More Customers</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push(CASE_STUDY)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-semibold text-sm tracking-tight transition-all duration-200 cursor-pointer"
                >
                  <span>See Client Results</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Proof row (replaces the stock team photo) */}
          <div className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-xl p-6 sm:p-10">
            <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-6">
              [ CLIENT SPOTLIGHT: A-1 AUTO DETAILING ]
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
              {HERO_PROOF.map((p) => (
                <div key={p.label} className="border-l-2 border-blue-600 pl-4">
                  <p className="text-3xl sm:text-5xl font-black font-display tracking-tight">{p.value}</p>
                  <p className="mt-1.5 text-sm text-neutral-400 leading-snug">{p.label}</p>
                </div>
              ))}
            </div>
            <Link
              href={CASE_STUDY}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-white transition-colors"
            >
              See how we did it <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: Found / Chosen / Booked / Guaranteed */}
      <section className="flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative bg-[#F7F6F3]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="max-w-3xl mb-10 sm:mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
              [ WHAT YOU ACTUALLY GET ]
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-950 font-display tracking-tight mt-2">
              One system that turns searches into booked jobs.
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 mt-2.5 leading-relaxed">
              Get found, get chosen, get booked. Then we guarantee it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch">
            {PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              const external = pillar.href.startsWith('http');
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent group-hover:via-blue-600 transition-all duration-500" />

                  <div>
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 text-neutral-800 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-5 shadow-xs">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-display tracking-tight group-hover:text-blue-600 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">{pillar.description}</p>
                  </div>

                  <a
                    href={pillar.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="mt-8 pt-5 border-t border-neutral-100 block"
                  >
                    <div className="text-2xl sm:text-3xl font-black font-display text-neutral-950 group-hover:text-blue-600 transition-colors tracking-tight">
                      {pillar.metric}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5 underline-offset-2 hover:underline">
                      {pillar.metricLabel}
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Founder story */}
      <section className="flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative bg-[#FAF9F8]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative w-full aspect-[4/4.6] max-w-md mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl border border-neutral-200/90 group bg-neutral-200">
                <picture>
                  <source srcSet="/hayder_hatem.webp" type="image/webp" />
                  <img
                    src="/hayder_hatem.png"
                    alt="Hayder Hatem, founder of Axeon Studio"
                    loading="eager"
                    decoding="async"
                    width={600}
                    height={750}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-300 font-semibold mb-1">
                    <MapPin size={13} />
                    <span>West Des Moines, Iowa</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">Hayder Hatem</div>
                  <a
                    href="mailto:hayder.hatem@axeonstudio.co"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-300 hover:text-white font-mono font-medium transition-colors mt-1"
                  >
                    <Mail size={13} />
                    <span>hayder.hatem@axeonstudio.co</span>
                  </a>
                  <div className="text-xs text-neutral-300 mt-1 font-medium">Founder, Axeon Studio</div>
                </div>
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
                    href="mailto:hayder.hatem@axeonstudio.co"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    hayder.hatem@axeonstudio.co
                  </a>
                </div>
                <div className="text-xs text-neutral-500 mt-1.5">
                  You talk to me on every call. Not a sales rep, not an account manager.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7 space-y-6"
            >
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                  [ A PERSONAL NOTE FROM HAYDER ]
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 font-display tracking-tight mt-2">
                  Why I started Axeon.
                </h2>
                <div className="mt-5 space-y-4 text-sm sm:text-base lg:text-lg text-neutral-600 leading-relaxed">
                  <p>
                    I kept watching Iowa business owners pay agencies for a pretty website that never brought in a
                    customer. And when someone did call, nobody answered until the next day. By then they&apos;d called a
                    competitor.
                  </p>
                  <p>
                    So I built <strong className="text-neutral-950 font-display">Axeon</strong> around the only number
                    that matters to an owner: new customers. Then I put a guarantee on it.
                  </p>
                </div>
              </div>

              <figure className="p-6 sm:p-7 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-blue-400">
                    <Quote size={20} />
                  </div>
                  <div>
                    <blockquote className="text-lg sm:text-xl font-bold font-display italic text-neutral-100 leading-snug">
                      &ldquo;{LEVI_QUOTE.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                      <span className="text-blue-400 font-bold">{LEVI_QUOTE.name}</span>
                      <span>•</span>
                      <span>
                        {LEVI_QUOTE.role}, {LEVI_QUOTE.place}
                      </span>
                    </figcaption>
                    <Link
                      href={LEVI_QUOTE.href}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-300 hover:text-white transition-colors"
                    >
                      Read the A-1 case study <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </figure>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Iowa roots + how I work */}
      <section className="flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-4"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
                [ WEST DES MOINES, IOWA ]
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 font-display tracking-tight">
                Your word matters here.
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                Out here you earn trust by doing what you said you would. No big-city office overhead, so your money goes
                into what brings you customers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6"
            >
              <div className="rounded-3xl bg-white border border-neutral-200/90 shadow-sm p-7 sm:p-10">
                <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                  [ HOW I WORK ]
                </span>
                <ul className="mt-5 space-y-4">
                  {HOW_I_WORK.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-neutral-700 leading-relaxed">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Next Step CTA */}
      <section className="min-h-[60vh] flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 py-16 sm:py-20 relative">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-neutral-950 text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                [ LET&apos;S TALK ]
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight mt-2">
                Let&apos;s get you more customers.
              </h2>
              <p className="text-sm sm:text-base text-neutral-400 mt-3 leading-relaxed">
                Book a free 20-minute call with me. You&apos;ll get a custom homepage mockup and an AI visibility report,
                yours to keep either way.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-mono text-neutral-400">
                <a href="mailto:hayder.hatem@axeonstudio.co" className="hover:text-white transition-colors underline">
                  hayder.hatem@axeonstudio.co
                </a>
                <span>•</span>
                <a href="tel:5154938017" className="hover:text-white transition-colors">
                  (515) 493-8017
                </a>
                <span>•</span>
                <span>West Des Moines, Iowa</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => router.push('/book')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base tracking-tight shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Calendar size={18} />
                <span>Get More Customers</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
