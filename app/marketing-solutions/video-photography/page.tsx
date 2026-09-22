import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Clapperboard, MonitorPlay, Sparkles } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';

export const metadata = buildMetadata({
  path: '/marketing-solutions/video-photography',
  title: 'Video & Photography | Axeon Studio',
  description:
    'Professional video and photography that helps your business stand out and tell its story — built for your website, ads, and social.',
});

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Built for Your Website',
    description:
      'Photos and video sized and framed for your homepage, service pages, and about page — so your site looks like your business, not a template.',
  },
  {
    icon: Clapperboard,
    title: 'Made for Ads & Social',
    description:
      'Content cut and formatted for the placements where your business actually needs to show up, from paid ads to social feeds.',
  },
  {
    icon: Camera,
    title: 'Tells Your Actual Story',
    description:
      'Real footage of your team, your space, and your work — not generic stock photography that could belong to any business.',
  },
  {
    icon: Sparkles,
    title: 'Bundled With Your Project',
    description:
      'Add video and photography onto a website or marketing build instead of hiring a separate vendor and managing another handoff.',
  },
];

const videoFaqItems = [
  {
    question: 'Can I see examples of your work?',
    answer: "Axeon Studio is a newer team still building its client portfolio — book a strategy call and we'll talk through exactly what a shoot would look like for your business.",
  },
  {
    question: 'Is this a separate contract from my website?',
    answer: 'No — it can be bundled directly onto a website or marketing build instead of hiring a separate vendor and managing another handoff.',
  },
  {
    question: 'What do you actually deliver — just photos, or video too?',
    answer: 'Both — content sized and cut for your website, paid ads, and social profiles, not just a single format.',
  },
];

const videoPhotographyServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Video & Photography Production',
  name: 'Axeon Studio — Video & Photography',
  url: 'https://axeonstudio.co/marketing-solutions/video-photography',
  description:
    'Professional video and photography that helps your business stand out and tell its story — built for your website, ads, and social.',
  provider: providerRef,
  areaServed: SERVICE_AREA,
};

export default function VideoPhotographyPage() {
  return (
    <main className="w-full bg-white text-neutral-950 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoPhotographyServiceJsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketing Solutions', path: '/marketing-solutions' },
          { name: 'Video & Photography', path: '/marketing-solutions/video-photography' },
        ]}
      />
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* TEMPORARY placeholder background — replace before launch, see public/temp-scorpion-refs */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/temp-scorpion-refs/video-photography-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        {/* Abstract camera/play motif background accents */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"
        />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="mb-8 flex justify-center">
            <Link
              href="/marketing-solutions"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Marketing Solutions
            </Link>
          </div>

          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Video &amp; Photography
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Show What Makes Your Business Worth Choosing
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Professional video and photography that helps your business stand out and tell its
            story — designed to work alongside your website, ads, and social presence, not sit
            separately from them.
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
      </section>

      {/* Feature Grid */}
      <section className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-white text-neutral-950">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
          <div className="mb-12 sm:mb-16 max-w-3xl">
            <p className="text-sm sm:text-base font-bold tracking-[0.22em] text-[#3366ff] uppercase mb-4 sm:mb-5">
              How It Fits In
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 leading-[1.14]">
              Content that supports the rest of your marketing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-[32px] border border-neutral-200/80 bg-neutral-50/70 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-blue-400/60 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    <Icon size={24} className="text-blue-600" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <div className="text-center py-12 sm:py-16 bg-white">
        <p className="text-neutral-600 mb-4">Let&apos;s talk through what this would look like for your business.</p>
        <Link href="/book" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          Book a Strategy Call
        </Link>
      </div>

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50/70">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm sm:text-base font-bold tracking-[0.22em] text-[#3366ff] uppercase mb-4">
              Questions
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={[...videoFaqItems, ...faqItems]} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to see it in your marketing?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Let&apos;s put a face and a story on your business
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we&apos;ll walk through how video and photography could
            fit into your website, ads, or social presence.
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
          <Link href="/why-axeon" className="inline-flex items-center gap-1.5 mt-8 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors">
            See exactly how we compare to a typical agency
          </Link>
        </div>
      </section>
    </main>
  );
}
