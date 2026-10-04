import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// Core philosophy section: Brand, Marketing, Technology.
// Three full-height panels. Each sits desaturated and dim until hovered
// (or focused, or on a touch screen where it's always "on"), then floods
// with its pillar color and reveals the longer explanation. The name and
// one-line promise are always readable so the message survives scanning
// and phones — only the color and the detail are hover-gated.
//
// Photos in /public/philosophy are from Unsplash (free license, no
// attribution required): brand by Maximilian Brol, marketing by
// charlesdeluvio, technology by Alessio Zaccaria.

type Pillar = {
  name: string;
  promise: string;
  detail: string;
  href: string;
  cta: string;
  image: string;
  alt: string;
  color: string;
};

// The customer journey, in order: every step is one part of the system that
// turns a stranger searching on Google into a paying customer.
const PILLARS: Pillar[] = [
  {
    name: 'Step 1',
    promise: 'Get found.',
    detail:
      'Local SEO, your Google Business Profile, AI search, and Google & Meta ads put you in front of people already searching for what you do, right when they are ready to buy.',
    href: '/marketing-solutions/seo',
    cta: 'How we get you found',
    image: '/philosophy/marketing.webp',
    alt: 'Person looking up a local business on a map on their phone',
    color: '#10B981',
  },
  {
    name: 'Step 2',
    promise: 'Get chosen.',
    detail:
      'A website, reviews, and real footage that make you the obvious pick the second someone compares you with the next company on the list.',
    href: '/marketing-solutions/website',
    cta: 'How we get you chosen',
    image: '/philosophy/brand.webp',
    alt: 'Backlit circular logo sign glowing on a dark wall',
    color: '#F5A623',
  },
  {
    name: 'Step 3',
    promise: 'Get booked.',
    detail:
      'Instant lead alerts, missed-call text-back, AI chat that books around the clock, and automatic follow-up, so more of those leads turn into paying customers.',
    href: '/marketing-solutions/lead-generation',
    cta: 'How we get you booked',
    image: '/philosophy/technology.webp',
    alt: 'Laptop showing a revenue and analytics dashboard',
    color: '#0080FF',
  },
];

function PillarPanel({ pillar }: { pillar: Pillar }) {
  return (
    <Link
      href={pillar.href}
      aria-label={`${pillar.name}: ${pillar.promise} ${pillar.cta}`}
      style={{ '--pillar': pillar.color } as React.CSSProperties}
      className="group relative block overflow-hidden bg-[#05070a] min-h-[440px] sm:min-h-[520px] lg:min-h-[640px] xl:min-h-[700px] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
    >
      {/* Photo: grey and dim at rest, full color on hover / focus / touch */}
      <Image
        src={pillar.image}
        alt={pillar.alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover object-center grayscale brightness-[0.45] group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-105 group-focus-visible:grayscale-0 group-focus-visible:brightness-90 group-focus-visible:scale-105 max-md:grayscale-0 max-md:brightness-90 motion-safe:transition-[filter,transform] motion-safe:duration-700 motion-safe:ease-out will-change-transform"
      />

      {/* Pillar color wash, multiplied into the photo */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--pillar)] mix-blend-multiply opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70 max-md:opacity-70 motion-safe:transition-opacity motion-safe:duration-700"
      />

      {/* Legibility ramp for the text block */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10"
      />

      {/* Color hairline along the bottom edge — the one accent that stays lit on hover */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--pillar)] origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 max-md:scale-x-100 motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out"
      />

      {/* Text block */}
      <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-11 flex flex-col">
        <h3 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-none">
          {pillar.name}
        </h3>
        <p className="mt-3 text-xl sm:text-2xl font-semibold text-white/85 leading-snug">
          {pillar.promise}
        </p>

        {/* Detail: collapsed at rest on desktop, open on hover / focus / touch */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] max-md:grid-rows-[1fr] motion-safe:transition-[grid-template-rows] motion-safe:duration-500 motion-safe:ease-out">
          <div className="overflow-hidden">
            <p className="pt-4 text-base sm:text-lg text-neutral-200 leading-relaxed max-w-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:delay-100">
              {pillar.detail}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-base sm:text-lg font-bold text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:delay-150">
              {pillar.cta}
              <ArrowUpRight
                size={20}
                className="text-[var(--pillar)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-safe:transition-transform"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ThreePillars() {
  return (
    <section
      id="philosophy"
      className="w-full pt-24 sm:pt-32 lg:pt-40 pb-0 bg-black text-white"
    >
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 mb-12 sm:mb-16 lg:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <h2 className="lg:col-span-7 text-5xl sm:text-6xl lg:text-7xl xl:text-[84px] font-black tracking-tight leading-[1.02]">
            How we get you customers.
          </h2>
          <div className="lg:col-span-5">
            <p className="text-xl sm:text-2xl font-semibold text-white leading-snug">
              Found. Chosen. Booked.
            </p>
            <p className="mt-3 text-lg sm:text-xl text-neutral-400 leading-relaxed max-w-xl">
              Most agencies sell you one piece and leave the rest to you. We run all three steps as one system, so the people searching for what you do end up on your calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Three panels, edge to edge, split by hairlines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800 border-y border-neutral-800">
        {PILLARS.map((pillar) => (
          <PillarPanel key={pillar.name} pillar={pillar} />
        ))}
      </div>

      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <Link
          href="/get-started"
          className="px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#0080FF] hover:bg-[#0070EE] active:scale-95 text-white text-sm sm:text-base font-bold shadow-xl shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2.5 self-start"
        >
          Get More Customers
          <ArrowUpRight size={18} />
        </Link>
        <p className="text-base sm:text-lg text-neutral-400">
          One team for all three steps, backed by our 90-day customer guarantee.
        </p>
      </div>
    </section>
  );
}

export default ThreePillars;
