'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  MapPin,
  TrendingUp,
  Cpu,
  Calendar,
  Mail,
  Quote,
} from 'lucide-react';
import { SolutionSlider } from '@/components/ui/SolutionSlider';

export default function AboutClient() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pillars = [
    {
      num: '01',
      roman: 'PILLAR I',
      icon: Users,
      title: 'Direct Craft',
      sublabel: 'Zero Account Managers',
      description:
        'You work and communicate directly with me. When you share feedback or need an adjustment, I am the one opening the code and refining it—never passing you down a chain of interns.',
      metric: '100% Direct Access',
      metricLabel: 'Builder to client, zero middlemen',
    },
    {
      num: '02',
      roman: 'PILLAR II',
      icon: Calendar,
      title: '7-14 Day Delivery Timeline',
      sublabel: 'Focused Attention, Not a Queue',
      description:
        'We take on only a handful of clients at a time so we can give your project undivided attention. From kickoff to a fully live, tested website takes 7-14 days—not six months.',
      metric: '7-14 Days',
      metricLabel: 'Kickoff to live production launch',
    },
    {
      num: '03',
      roman: 'PILLAR III',
      icon: TrendingUp,
      title: 'Built to Convert',
      sublabel: 'Performance Over Decoration',
      description:
        'A website is not digital art—it is your digital front door. Every interaction is architected to load in milliseconds, establish instant trust, and turn visitors into booked calls.',
      metric: '< 1.0s TTFB',
      metricLabel: 'Engineering target — sub-second load',
    },
    {
      num: '04',
      roman: 'PILLAR IV',
      icon: Cpu,
      title: 'Smart Speed-to-Lead',
      sublabel: 'Practical Automation',
      description:
        'AI should never be an empty buzzword. We build reliable, tailored automations that qualify inbound inquiries and alert you in seconds while prospective customers are still thinking about you.',
      metric: '< 45s',
      metricLabel: 'Target lead response window',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F8] text-neutral-950 font-sans selection:bg-blue-600 selection:text-white">
      {/* SECTION 1: Hero Section (100vh) */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 relative pt-24 sm:pt-28 pb-12">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          {/* Breadcrumb Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-xs font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-4"
          >
            <span>AXEON STUDIO</span>
            <span>/</span>
            <span className="text-blue-600">[ ABOUT US &amp; OUR PROMISE ]</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-8"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.08]">
                Iowa’s First{' '}
                <span className="block text-blue-600 mt-2">
                  AI-Forward Digital Agency
                </span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-4 flex flex-col justify-end"
            >
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                Your website is fine... It just doesn't make any money. I started Axeon in West Des Moines because I was tired of watching business owners get burned by bloated agencies and six-month timelines. We're building toward being the one-stop shop for growing Iowa businesses — website, SEO/AEO/GEO, reviews, social media, and everything in between — and when you partner with Axeon, you work directly with me, not a rotating cast of account managers.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/book')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <span>Start Your Project</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/work')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-semibold text-sm tracking-tight transition-all duration-200 cursor-pointer"
                >
                  <span>See What We Build</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl relative"
          >
            <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=85&fm=webp"
                alt="Axeon Studio creative engineering and design team working together on client digital platforms"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-10 sm:right-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Building Digital Engines for Growing Iowa Businesses
                </h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION: The Four Pillars Detailed Solution Slider (100vh) */}
      <section className="min-h-screen lg:h-screen lg:min-h-[740px] flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 bg-neutral-50/70 py-12 lg:py-0 overflow-hidden">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <SolutionSlider
            solutions={[
              {
                title: 'Direct Craft',
                badge: 'PILLAR I // 100% DIRECT',
                category: 'STUDIO ARCHITECTURE',
                image:
                  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80&fm=webp',
                imageAlt: 'Builder working directly with client',
                summary:
                  'Direct engineer-to-client communication with zero account managers or junior pass-offs.',
                fullBreakdown: [
                  'You work and communicate directly with Hayder Hatem and our core builders.',
                  'When you share feedback or need an adjustment, we are the ones opening the code and refining it immediately in real-time.',
                  'Eliminates the multi-day latency and dilution of traditional agency telephone games.',
                ],
                deliverables: [
                  'Direct Private Slack Channel Access',
                  'Daily Async Loom Video Updates',
                  'Live Staging Environment Access',
                  'Direct Cell & Scheduling Priority',
                ],
                impactMetric: { value: '0', label: 'Account Managers' },
                turnaround: 'Immediate Response',
                technologies: ['Direct Slack', 'Loom', 'GitHub PRs', 'Figma'],
              },
              {
                title: '7-14 Day Delivery Timeline',
                badge: 'PILLAR II // FOCUSED DELIVERY',
                category: 'PRODUCTION LIFECYCLE',
                image:
                  'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80&fm=webp',
                imageAlt: '7-14 day dedicated delivery timeline',
                summary:
                  'From kickoff to fully live, tested production website in 7-14 days—not six months.',
                fullBreakdown: [
                  'We take on only a handful of clients at a time so we can give your project undivided attention.',
                  'Strategic UX & design tokens first, then the Next.js build, then integrations, QA, and launch — Core Web Build wraps in as few as 7 business days, Acquisition Engine builds take up to 14.',
                  'Ensures your marketing campaign launches when market demand is highest.',
                ],
                deliverables: [
                  'Complete Figma Wireframes & Design Systems',
                  'Clean Next.js Component Implementation',
                  'Speed Optimization & SEO Audits',
                  'DNS Propagation & Production Launch',
                ],
                impactMetric: { value: '7-14 Days', label: 'Kickoff to Live Launch' },
                turnaround: '7-14 Day Production',
                technologies: ['Next.js', 'React', 'Tailwind CSS', 'Cloudflare DNS'],
              },
              {
                title: 'Built to Convert',
                badge: 'PILLAR III // REVENUE FOCUSED',
                category: 'CONVERSION ARCHITECTURE',
                image:
                  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80&fm=webp',
                imageAlt: 'High-converting user interface and analytics dashboard',
                summary:
                  'A website is not digital art—it is your digital front door engineered to turn visitors into booked calls.',
                fullBreakdown: [
                  'Engineered to target sub-second responsiveness and 99+ Core Web Vitals scores to reduce bounce.',
                  'Frictionless booking flows and persuasive visual hierarchy built on behavioral data.',
                  'Instant trust signaling that commands higher pricing power for your offerings.',
                ],
                deliverables: [
                  'Sub-500ms TTFB Engineering Target',
                  'Sticky One-Tap Conversion Triggers',
                  'Mobile-First Touch Target Optimizations',
                  'Integrated GA4 & Meta Pixel Event Tracing',
                ],
                impactMetric: { value: '< 1.0s', label: 'Target TTFB Server-Side Speed' },
                turnaround: 'Continuous High-Performance',
                technologies: ['Google Analytics 4', 'Lighthouse 100', 'Edge CDN', 'Semrush'],
              },
              {
                title: 'Smart Speed-to-Lead AI',
                badge: 'PILLAR IV // BESPOKE AUTOMATION',
                category: 'AI & SYSTEM PIPELINES',
                image:
                  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1200&q=80&fm=webp',
                imageAlt: 'Autonomous AI speed-to-lead engine and multi-channel pipeline',
                summary:
                  'Reliable, tailored AI automations that qualify inbound inquiries and alert you in under 45 seconds.',
                fullBreakdown: [
                  'AI should never be an empty buzzword. We build deterministic, tailored pipelines.',
                  'Instantly qualifies inbound form fills, SMS, and emails while prospective customers are hot.',
                  'Syncs directly to your CRM with enriched company data and ready-to-close lead alerts.',
                ],
                deliverables: [
                  'Multi-Channel Ingestion (Web, SMS, Email)',
                  'Sub-45s Autonomous AI Triage & Response',
                  'CRM Bi-Directional Webhooks (HubSpot/Salesforce)',
                  'Custom Voice & Tone Calibration Prompts',
                ],
                impactMetric: { value: '< 45s', label: 'Target Inbound Response Time' },
                turnaround: '24/7 Autonomous Running',
                technologies: ['Gemini 2.0 Flash', 'Twilio', 'Node.js Fastify', 'HubSpot API'],
              },
            ]}
            sectionTitle="Our Architectural Foundations Breakdown"
            subtitle="Slide through the four core pillars that guide every Axeon engagement—delivering high velocity, dedicated craft, and accountable ROI."
            onSelectSolution={() => router.push('/book')}
          />
        </div>
      </section>

      {/* SECTION 2: The Four Pillars (Modern Architectural Monoliths with 4-Second Rising Animation) (100vh) */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative bg-[#F7F6F3]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-10 sm:mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
              [ HOW I ACTUALLY WORK ]
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-950 font-display tracking-tight mt-2">
              The Four Pillars of Axeon.
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 mt-2.5 leading-relaxed">
              No jargon, no fine print. Here's what you're actually getting when you work with me.
            </p>
          </div>

          {/* Clean Architectural Monolith Pillars with 4-Second Individual Rising Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.roman}
                  initial={{ opacity: 0, y: 130 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 4.0, // 4-second smooth individual ascension
                    delay: idx * 0.35, // staggered sequential ascent
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Subtle top accent hairline */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent group-hover:via-blue-600 transition-all duration-500" />

                  <div>
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 group-hover:bg-blue-50 group-hover:text-blue-600 px-2.5 py-1 rounded-full transition-colors">
                        {pillar.num}
                      </span>
                      <span className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 group-hover:text-blue-600 transition-colors">
                        {pillar.roman}
                      </span>
                    </div>

                    {/* Icon Medallion */}
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200/80 group-hover:bg-blue-600 group-hover:border-blue-600 text-neutral-800 group-hover:text-white transition-all duration-300 flex items-center justify-center mt-6 mb-5 shadow-xs">
                      <Icon size={22} />
                    </div>

                    {/* Subtitle / Micro-tag */}
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                      {pillar.sublabel}
                    </div>

                    {/* Main Pillar Title */}
                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-display tracking-tight group-hover:text-blue-600 transition-colors">
                      {pillar.title}
                    </h3>

                    {/* Narrative Description */}
                    <p className="text-xs sm:text-sm text-neutral-600 mt-3 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Engraved Base Metric */}
                  <div className="mt-8 pt-5 border-t border-neutral-100">
                    <div className="text-2xl sm:text-3xl font-black font-display text-neutral-950 group-hover:text-blue-600 transition-colors tracking-tight">
                      {pillar.metric}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5">
                      {pillar.metricLabel}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Founder Story & Personal Note From Hayder (Switched after Pillars) (100vh) */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative bg-[#FAF9F8]">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Portrait & Direct Contact */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative w-full aspect-[4/4.6] max-w-md mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-xl border border-neutral-200/90 group">
                <picture>
                  <source srcSet="/hayder_hatem.webp" type="image/webp" />
                  <img
                    src="/hayder_hatem.png"
                    alt="Hayder Hatem - Founder & Systems Architect at Axeon Studio"
                    loading="eager"
                    decoding="async"
                    width={600}
                    height={750}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=75&fm=webp';
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-300 font-semibold mb-1">
                    <MapPin size={13} />
                    <span>West Des Moines, Iowa</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
                    Hayder Hatem
                  </div>
                  {/* Email placed directly under name */}
                  <a
                    href="mailto:hayder.hatem@axeonstudio.co"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-300 hover:text-white font-mono font-medium transition-colors mt-1"
                  >
                    <Mail size={13} />
                    <span>hayder.hatem@axeonstudio.co</span>
                  </a>
                  <div className="text-xs text-neutral-300 mt-1 font-medium">
                    Founder &amp; Principal Systems Architect
                  </div>
                </div>
              </div>

              {/* Direct Contact Card under portrait */}
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
                  Operating out of West Des Moines. You speak directly with the builder on every call.
                </div>
              </div>
            </motion.div>

            {/* Right Column: Narrative Story & Tech Billionaire Philosophy */}
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
                    I’ve spent years designing and engineering software, and over the years, I watched far too many business owners hire agencies expecting a real transformation—only to be handed pretty pitch decks, six months of excuses, and massive invoices. The second the deal was signed, the agency partners disappeared and passed the actual work down to entry-level coordinators.
                  </p>
                  <p>
                    Most of those websites ended up as slow, static digital brochures that barely generated a single customer inquiry. When an interested prospect reached out, nobody answered until the next day—by which time they had already bought from a competitor.
                  </p>
                  <p>
                    I started <strong className="text-neutral-950 font-display">Axeon Studio</strong> here in West Des Moines with a straightforward mission: <em>treat your business like it is my own, build sub-second web platforms that actually convert, and set up automations that respond to leads in under 45 seconds.</em>
                  </p>
                </div>
              </div>

              {/* Established Tech Billionaire Quote (Steve Jobs Philosophy) */}
              <div className="p-6 sm:p-7 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-md relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-blue-400">
                    <Quote size={20} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold font-display italic text-neutral-100 leading-snug">
                      &ldquo;Design is not just what it looks like and feels like. Design is how it works.&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                      <span className="text-blue-400 font-bold">— Steve Jobs</span>
                      <span>•</span>
                      <span>Co-Founder of Apple</span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      This is the core philosophy we hold at Axeon. We don&apos;t just build things that look nice in a portfolio—we build systems that load instantly, feel intuitive, and function as revenue-generating engines for your business.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Midwest Roots & Studio HQ Image (100vh) */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 lg:px-14 xl:px-20 border-b border-neutral-200/80 py-12 lg:py-16 relative">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Clean Sincere Midwest Story */}
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
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed pt-2">
                Building from West Des Moines keeps me grounded. Out here, your word matters, and you earn trust by showing up and doing what you said you would do.
              </p>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                We don’t carry the bloat of expensive skyscraper offices in New York or San Francisco—which means every dollar you invest goes directly into superior design, clean code, and real, measurable results for your business.
              </p>
              <div className="pt-2">
                <p className="text-sm sm:text-base text-neutral-800 font-medium italic border-l-2 border-blue-600 pl-4 py-1">
                  &ldquo;Your website is fine... It just doesn&apos;t make any money&rdquo;
                </p>
                <div className="mt-2 pl-4 text-xs font-mono text-neutral-500 font-semibold">
                  — Hayder Hatem, Founder
                </div>
              </div>
            </motion.div>

            {/* Right Column: Studio Showcase Photographic Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/90 aspect-[16/11] group">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80&fm=webp"
                  alt="Axeon Studio Creative Architecture & Workspace in West Des Moines"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
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
                Let’s build something you’re genuinely proud of.
              </h2>
              <p className="text-sm sm:text-base text-neutral-400 mt-3 leading-relaxed">
                No sales reps or high-pressure pitches. Schedule a 20-minute strategic conversation with me to review your goals, examine your current site, and see if we are a great fit.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-mono text-neutral-400">
                <a
                  href="mailto:hayder.hatem@axeonstudio.co"
                  className="hover:text-white transition-colors underline"
                >
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
                <span>Start Your Project</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
