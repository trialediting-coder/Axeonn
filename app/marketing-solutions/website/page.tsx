import Link from 'next/link';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { withGeneralFaqs } from '@/data/faqData';
import {
  ProblemSection,
  DeliverablesSection,
  TimelineSection,
  ComparisonSection,
  CaseStudyProof,
  IndustriesSection,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { websiteDetail } from '@/data/solutionDetails';
import { RecentWork } from '@/components/work/RecentWork';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = buildMetadata({
  path: '/marketing-solutions/website',
  title: 'Website Design & Development | Axeon Studio',
  description:
    'Websites that build trust, drive revenue, and make you the clear choice — a brand-driven system built for your industry, shipped fast, not a generic template.',
});

const websiteServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Website Design & Development',
  name: 'Axeon Studio — Website Design & Development',
  url: 'https://axeonstudio.co/marketing-solutions/website',
  description:
    'Websites that build trust, drive revenue, and make you the clear choice — a brand-driven system built for your industry, shipped fast, not a generic template.',
  provider: providerRef,
  areaServed: SERVICE_AREA,
};

export default function WebsitePage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteServiceJsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketing Solutions', path: '/marketing-solutions' },
          { name: 'Website Design & Development', path: '/marketing-solutions/website' },
        ]}
      />
      <ServiceFaqJsonLd items={websiteDetail.faqs} />
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
              and delivered fast — not a generic template with your logo dropped in.
            </p>
            <ServiceHeroActions priceLine="Plans from $2,800 setup" note="backed by our 90-day customer guarantee" />
            <div className="flex justify-center">
              <TrustBadges variant="dark" />
            </div>
          </div>
        </div>
      </section>

      <ProblemSection data={websiteDetail.problem} />

      <RecentWork
        tone="muted"
        eyebrow="Our Work"
        heading="Real Sites, Built Around How Each Business Sells"
        intro="A real client build and concept redesigns for Iowa businesses. Each one starts from how that business wins work."
      />

      <DeliverablesSection data={websiteDetail.deliverables} />
      <TimelineSection data={websiteDetail.timeline} />
      <ComparisonSection data={websiteDetail.comparison} />
      {websiteDetail.proof && <CaseStudyProof data={websiteDetail.proof} />}
      <IndustriesSection serviceName="a website" />

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
          <FAQAccordion items={withGeneralFaqs(websiteDetail.faqs, ['What if I already have a website?'])} size="large" />
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
            Book a strategy session and we&apos;ll walk through exactly how a new site would bring
            your business more customers, with published pricing and no surprise invoices.
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
