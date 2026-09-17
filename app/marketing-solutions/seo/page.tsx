import Link from 'next/link';
import { ArrowLeft, Search, Sparkles, Cpu } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import { BorderBeam } from '@/components/why-axeon/BorderBeam';
import { RankClimbChart } from '@/components/why-axeon/RankClimbChart';
import { AiEngineMarquee } from '@/components/why-axeon/AiEngineMarquee';
import { AiPromptDemo } from '@/components/why-axeon/AiPromptDemo';

export const metadata = buildMetadata({
  path: '/marketing-solutions/seo',
  title: 'SEO, AEO & GEO Services | Axeon Studio',
  description:
    'SEO, AEO, and GEO built into every Axeon Studio site as one service, not sold separately — helping local businesses get found on Google and cited by AI.',
});

const seoFaqItems = [
  {
    question: 'Will my SEO get a specific ranking date or guarantee?',
    answer: "No — search rankings take real time and vary by market, so we won't promise a date. Every build is optimized to compete for the top spot, but we're upfront that timelines vary by industry and market.",
  },
  {
    question: 'Is AEO/GEO an extra cost on top of SEO?',
    answer: 'No. SEO, AEO, and GEO are bundled into every Axeon Studio build by default — not sold as separate add-ons.',
  },
  {
    question: 'Do I need a separate SEO contract?',
    answer: "No — it's included in your website build and covered under AxeonCORE's monthly Core Web Vitals and SEO audits afterward.",
  },
];

const pillars = [
  {
    tag: 'SEO',
    icon: Search,
    title: 'Search Engine Optimization',
    description:
      'Technical SEO, on-page optimization, and local search signals built into every page — so your business shows up when someone nearby searches for what you do.',
  },
  {
    tag: 'AEO',
    icon: Sparkles,
    title: 'Answer Engine Optimization',
    description:
      "When someone asks an AI assistant for a recommendation, your business is structured to be part of the answer — not just another link buried on page two.",
  },
  {
    tag: 'GEO',
    icon: Cpu,
    title: 'Generative Engine Optimization',
    description:
      'Structured data and machine-readable content on every page, so search engines, ChatGPT, Perplexity, and Gemini can all actually cite you.',
  },
];

export default function SeoMarketingSolutionPage() {
  return (
    <main className="w-full bg-neutral-950 text-white">
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* TEMPORARY placeholder background — replace before launch, see public/temp-scorpion-refs */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/temp-scorpion-refs/seo-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Link
            href="/marketing-solutions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={15} />
            Back to Marketing Solutions
          </Link>

          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Marketing Solutions — SEO / AEO / GEO
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Get Found by Search Engines. Get Cited by AI.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Search Engine Optimization (SEO), Answer Engine Optimization (AEO), and Generative Engine
            Optimization (GEO) — the three ways people and AI actually find a business today, built into
            every Axeon Studio site as one service, not sold separately.
          </p>

          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-blue-950/60 border border-blue-800">
              {['SEO', 'AEO', 'GEO'].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  {tag}
                </span>
              ))}
              <span className="text-xs text-blue-300 font-medium ml-1">
                All included in every build — zero add-ons
              </span>
            </div>
          </div>

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
      </section>

      {/* Pillar grid: SEO / AEO / GEO explained individually */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              We Don&apos;t Just Optimize For Google.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.tag}
                  className="rounded-[32px] bg-neutral-900/60 border border-neutral-800 p-8 sm:p-10 flex flex-col hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                      {pillar.tag}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-neutral-500 mt-10">
            SEO, AEO, and GEO come built into every website we build —{' '}
            <Link
              href="/marketing-solutions/website"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              see what a build includes
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Rank trajectory + the honest, no-timeline-promise paragraph */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
            The Trajectory
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-10">
            Built to Compete for the Top Spot
          </h2>

          <BorderBeam rounded="rounded-3xl" className="max-w-2xl mx-auto">
            <div className="rounded-3xl bg-neutral-900/60 p-6 sm:p-8">
              <RankClimbChart />
            </div>
          </BorderBeam>

          <p className="text-sm text-neutral-500 leading-relaxed text-center max-w-xl mx-auto mt-10">
            Most agencies get you a small bump and stop there. We build every site to compete for
            the top spot — search rankings take real time and vary by market, so we won&apos;t
            promise a date, but this is the trajectory every build is optimized for.
          </p>
        </div>
      </section>

      {/* AI answer engine visibility */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
            Optimized For Every Major AI Answer Engine
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-10">
            Search Is No Longer Just a Search Bar
          </h2>

          <div className="mb-10">
            <AiEngineMarquee />
          </div>

          <div className="flex justify-center">
            <AiPromptDemo />
          </div>

          <p className="text-sm text-neutral-500 leading-relaxed text-center max-w-xl mx-auto mt-8">
            Structured data and machine-readable content on every page, so search engines,
            ChatGPT, Perplexity, and Gemini can all actually cite you.
          </p>

          <div className="text-center mt-12 sm:mt-14">
            <p className="text-neutral-400 mb-4">Want to know what this would look like for your industry?</p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white text-neutral-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-600 uppercase mb-3">
              Questions
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={[...seoFaqItems, ...faqItems]} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to rank higher and get cited by AI?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we&apos;ll walk through exactly how SEO, AEO, and GEO would
            work for your business.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
