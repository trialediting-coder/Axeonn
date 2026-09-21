import Link from 'next/link';
import Image from 'next/image';
import { buildMetadata } from '@/lib/metadata';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Workflow,
  Timer,
  Users,
  PhoneCall,
  Hammer,
  Rocket,
  LifeBuoy,
} from 'lucide-react';

export const metadata = buildMetadata({
  path: '/marketing-solutions/website',
  title: 'Website Design & Development | Axeon Studio',
  description:
    'Websites that build trust, drive revenue, and make you the clear choice — a brand-driven system built for your industry, shipped in a fixed 7–14 day timeline, not a generic template.',
});

const DIFFERENTIATORS = [
  {
    icon: Layers,
    title: 'Systems, Not Templates',
    description:
      'Most agencies ship the same interchangeable layout across every industry and swap the logo. We build a brand-driven system designed around how your specific business actually sells.',
  },
  {
    icon: Workflow,
    title: 'A Built-In CRM Pipeline',
    description:
      'The Acquisition Engine build includes a Custom CRM Pipeline tailored to your lead-to-close workflow — no per-seat monthly software fees stacked on top of your website.',
  },
  {
    icon: Timer,
    title: 'Fixed 7–14 Day Timeline',
    description:
      'Flat pricing and a fixed-scope timeline — 7 business days for a Core Web Build, 14 for a full Acquisition Engine. No scope creep, no surprise invoices along the way.',
  },
  {
    icon: Users,
    title: 'Direct Access to Your Builder',
    description:
      'No account managers or handoffs before you reach the person actually building your site. You talk directly to the team doing the work, start to finish.',
  },
];

const PROCESS_STEPS = [
  {
    icon: PhoneCall,
    step: '01',
    title: 'Strategy Call',
    description:
      'We scope your build together, walk through the Core Web Build vs. Acquisition Engine tiers, and confirm exactly what you need — no pressure, no guessing on price.',
  },
  {
    icon: Hammer,
    step: '02',
    title: 'Design & Build',
    description:
      'Your site is built on a fixed-scope timeline — 7 business days for a Core Web Build, 14 for an Acquisition Engine — with direct communication with the builder the whole way through.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Launch, Revisions Covered',
    description:
      'Every build includes a 2-round revision guarantee before launch. We don’t consider it finished until it’s a site you’re proud to put your name on.',
  },
  {
    icon: LifeBuoy,
    step: '04',
    title: 'First 30 Days Included',
    description:
      'Hosting, SSL, backups, and CRM monitoring are included for your first 30 days at no extra cost. After that, ongoing care runs on a simple monthly care plan we walk through on your call — or take your files and walk away. No lock-in.',
  },
];

const REAL_BUILDS = [
  { src: '/why-axeon/axeon-hvac.webp', industry: 'HVAC & Plumbing' },
  { src: '/why-axeon/axeon-ecommerce.webp', industry: 'E-Commerce' },
  { src: '/why-axeon/axeon-realestate.webp', industry: 'Real Estate' },
  { src: '/why-axeon/axeon-auto-repair.webp', industry: 'Auto Repair' },
];

const websiteServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Website Design & Development',
  name: 'Axeon Studio — Website Design & Development',
  url: 'https://axeonstudio.co/marketing-solutions/website',
  description:
    'Websites that build trust, drive revenue, and make you the clear choice — a brand-driven system built for your industry, shipped in a fixed 7–14 day timeline, not a generic template.',
  provider: {
    '@type': 'Organization',
    name: 'Axeon Studio',
    logo: 'https://axeonstudio.co/icon.png',
    telephone: '+1-515-493-8017',
    email: 'hayder.hatem@axeonstudio.co',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'West Des Moines',
      addressRegion: 'IA',
      postalCode: '50266',
      addressCountry: 'US',
    },
  },
  areaServed: 'United States',
};

const websiteFaqItems = [
  {
    question: 'How long does it take to get a new website?',
    answer: 'Most builds run 7 business days for the Core Web Build tier or 14 for the Acquisition Engine — a fixed timeline agreed on the strategy call, not an open-ended estimate.',
  },
  {
    question: 'Do I own the website once it\'s built?',
    answer: 'Yes. Your first 30 days of hosting and care are included; after that you can continue on a simple monthly care plan or take your files and walk away — no lock-in.',
  },
  {
    question: "What if I don't like the design?",
    answer: "Every build includes a 2-round revision guarantee before launch — we don't consider it finished until it's a site you're proud to put your name on.",
  },
];

export default function WebsitePage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteServiceJsonLd) }}
      />
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* TEMPORARY placeholder background — replace before launch, see public/temp-scorpion-refs */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/temp-scorpion-refs/website-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/marketing-solutions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-10"
          >
            <ArrowLeft size={16} />
            Back to Marketing Solutions
          </Link>

          <div className="text-center">
            <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
              Website
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Websites That Build Trust, Drive Revenue, and Make You the Clear Choice
            </h1>
            <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
              Designed to convert, built to grow. Every build is a brand-driven system shipped
              on a fixed 7–14 day timeline — not a generic template with your logo dropped in.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <Link
                href="/book"
                className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Book a Strategy Call
              </Link>
              <Link
                href="/pricing"
                className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <div className="flex justify-center">
              <TrustBadges variant="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* What Makes It Different */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">
              What Makes It Different
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 mb-5 leading-[1.14]">
              Most Agencies Ship Templates. We Ship Systems.
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              A website is only as good as the business logic built underneath it. Here&apos;s
              what&apos;s actually different about how we build.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {DIFFERENTIATORS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl border border-neutral-200/80 p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-blue-400/80 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                    <Icon size={22} className="text-blue-600" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-neutral-600 mt-10 sm:mt-12">
            Every build also includes SEO, AEO, and GEO by default —{' '}
            <Link href="/marketing-solutions/seo" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4">
              see how that works
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Real Builds Gallery */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">
              Real Builds
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 mb-5 leading-[1.14]">
              Four Industries, Four Genuinely Different Layouts
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              Each one built around how that specific business actually sells — not a shared
              theme with the colors changed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {REAL_BUILDS.map((build) => (
              <div
                key={build.src}
                className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm aspect-[16/10] bg-neutral-100"
              >
                <Image
                  src={build.src}
                  alt={`${build.industry} website built by Axeon Studio`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wide bg-blue-600/90 text-white backdrop-blur-sm">
                  {build.industry}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-14">
            <p className="text-neutral-600 mb-4">Want to see what this would look like for your business?</p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 mb-5 leading-[1.14]">
              From Strategy Call to Launch in 7–14 Days
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              A fixed-scope timeline, not an open-ended engagement that drags on for months.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {PROCESS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative bg-white rounded-2xl border border-neutral-200/80 p-7 sm:p-8 shadow-sm"
                >
                  <span className="absolute top-6 right-7 font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {item.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                    <Icon size={22} className="text-blue-600" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20 bg-neutral-50/70">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-[1.14]">
              Common Questions About Your Website
            </h2>
          </div>
          <FAQAccordion items={[...websiteFaqItems, ...faqItems]} size="large" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to see it built for your business?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we&apos;ll walk through exactly how a 7–14 day build
            would work for your business — flat pricing, no surprise invoices.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors inline-flex items-center gap-2"
            >
              Book a Strategy Call
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              View Pricing
            </Link>
          </div>
          <Link
            href="/why-axeon"
            className="inline-block mt-8 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            See exactly how we compare to a typical agency →
          </Link>
        </div>
      </section>
    </main>
  );
}
