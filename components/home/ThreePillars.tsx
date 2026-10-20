import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// Core philosophy section: Answered, Booked, Reviewed.
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
  /** Phone copy: the same promise in fewer words, so all three steps fit one screen. */
  short: string;
  href: string;
  cta: string;
  image: string;
  alt: string;
  color: string;
};

// The intake path, in order: every step is one part of the system that turns
// a missed call or a web inquiry into a booked consultation and a review.
const PILLARS: Pillar[] = [
  {
    name: 'Step 1',
    promise: 'Answered.',
    detail: 'Every call and inquiry gets a reply in 60 seconds, 24/7.',
    short: 'Every call and inquiry gets a reply in 60 seconds, 24/7.',
    href: '/marketing-solutions/lead-generation',
    cta: 'How every inquiry gets answered',
    image: '/philosophy/marketing.webp',
    alt: 'Person looking up a local business on a map on their phone',
    color: '#10B981',
  },
  {
    name: 'Step 2',
    promise: 'Booked.',
    detail: 'They pick a time on your calendar, not a callback list.',
    short: 'They pick a time on your calendar, not a callback list.',
    href: '/marketing-solutions/ai-chat-scheduling',
    cta: 'How consultations get booked',
    image: '/philosophy/technology.webp',
    alt: 'Laptop showing a revenue and analytics dashboard',
    color: '#0080FF',
  },
  {
    name: 'Step 3',
    promise: 'Reviewed.',
    detail: 'Every appointment ends with a review request, automatically.',
    short: 'Every appointment ends with a review request, automatically.',
    href: '/axeonproof',
    cta: 'How AxeonPROOF tracks it',
    image: '/philosophy/brand.webp',
    alt: 'Backlit circular logo sign glowing on a dark wall',
    color: '#F5A623',
  },
];

function PillarPanel({ pillar }: { pillar: Pillar }) {
  return (
    <Link
      href={pillar.href}
      aria-label={`${pillar.name}: ${pillar.promise} ${pillar.cta}`}
      style={{ '--pillar': pillar.color } as React.CSSProperties}
      className="group relative block max-sm:flex max-sm:flex-col max-sm:justify-end overflow-hidden bg-[#05070a] min-h-[200px] sm:min-h-[520px] lg:min-h-[640px] xl:min-h-[700px] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
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
      {/* Phones: a compact row (step + promise on one line, the short copy under it). */}
      <div className="relative sm:hidden px-5 py-6">
        <h3 className="flex items-baseline gap-2.5 text-white leading-none">
          <span className="text-[32px] font-extrabold tracking-tight">{pillar.name}</span>
          <span className="text-xl font-semibold text-white/85">{pillar.promise}</span>
          <ArrowUpRight size={22} className="ml-auto self-center shrink-0 text-[var(--pillar)]" />
        </h3>
        <p className="mt-2.5 text-base text-neutral-100 leading-snug">{pillar.short}</p>
      </div>

      <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-11 flex-col">
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

// Purpose: the visitor learns the three steps (answered, booked, reviewed) that turn an inquiry into a visit.
export function ThreePillars() {
  return (
    <section
      id="philosophy"
      className="w-full pt-10 sm:pt-32 lg:pt-40 pb-0 bg-black text-white"
    >
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 mb-5 sm:mb-16 lg:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-8 lg:gap-12 items-end">
          <h2 className="lg:col-span-7 text-[32px] sm:text-6xl lg:text-7xl xl:text-[84px] font-black tracking-tight leading-[1.05] sm:leading-[1.02]">
            How intake should work.
          </h2>
          <div className="lg:col-span-5">
            <p className="text-lg sm:text-2xl font-semibold text-neutral-300 leading-snug">Answered. Booked. Reviewed.</p>
          </div>
        </div>
      </div>

      {/* Three panels, edge to edge, split by hairlines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800 border-y border-neutral-800">
        {PILLARS.map((pillar) => (
          <PillarPanel key={pillar.name} pillar={pillar} />
        ))}
      </div>

      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-16 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
        <Link
          href="/check-your-area"
          className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#0080FF] hover:bg-[#0070EE] active:scale-95 text-white text-base font-bold shadow-xl shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2.5 sm:self-start"
        >
          Check if your area is open
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export default ThreePillars;
