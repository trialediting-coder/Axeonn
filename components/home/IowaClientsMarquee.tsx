// The strip under the homepage hero, headed "Partnering with Iowa Businesses"
// (owner, 2026-10-19: frame Axeon as a partner in the client's growth, not a
// vendor selling a service).
//
// Production scrolls what every AxeonCORE practice or firm gets. Axeon has no
// practice or firm clients to show yet, and a row of business names reads as a
// client list, so only real, approved clients may ever appear here in
// production.
//
// Preview deploys and local dev scroll real Iowa business logos instead (owner,
// 2026-10-19: "just to see" the logo strip). Most of these businesses are NOT
// Axeon clients, so this list must never render in production: showing them
// there would present them as clients. Swap in real, approved client logos
// before anything like this ships.
const SHOW_PREVIEW_LOGOS = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

const INCLUDED = [
  '60-second first reply, 24/7',
  'Missed-call text-back',
  'Online consultation booking',
  'Two-way text inbox for your front desk or intake team',
  'Review request after every visit',
  'Call tracking',
  'AxeonPROOF client portal',
  'One practice or firm per specialty within 5 miles',
];

type Logo = {
  name: string;
  logo: string;
  // Stacked/square marks need more height than wide wordmarks to read at the same weight.
  heightClass: string;
  /** Intrinsic size, so the browser reserves the width before the logo loads. */
  w: number;
  h: number;
};

// Preview only (see above). Practices and firms first, interleaved.
const PREVIEW_LOGOS: Logo[] = [
  { name: 'Hintz Family Dentistry', logo: '/logos/iowa/hintz-family-dentistry.webp', heightClass: 'h-12 sm:h-16', w: 195, h: 160 },
  { name: 'Mark Gray Law', logo: '/logos/iowa/mark-gray-law.webp', heightClass: 'h-9 sm:h-11', w: 643, h: 160 },
  { name: 'Iowa Wealth Management', logo: '/logos/iowa/iowa-wealth-management.svg', heightClass: 'h-8 sm:h-10', w: 358, h: 74 },
  { name: 'A-1 Auto Detailing', logo: '/logos/iowa/a1-auto-detailing.webp', heightClass: 'h-12 sm:h-20', w: 154, h: 160 },
  { name: 'Patrick Finnegan', logo: '/logos/iowa/patrick-finnegan.webp', heightClass: 'h-8 sm:h-10', w: 1475, h: 160 },
  { name: 'Obsidian Heating & Cooling', logo: '/logos/iowa/obsidian-heating-cooling.webp', heightClass: 'h-12 sm:h-20', w: 167, h: 160 },
  { name: 'MSH Realty Group', logo: '/logos/iowa/msh-realty-group.webp', heightClass: 'h-12 sm:h-20', w: 165, h: 160 },
  { name: "Andrew's Roofing Company", logo: '/logos/iowa/andrews-roofing.webp', heightClass: 'h-10 sm:h-12', w: 517, h: 160 },
  { name: 'Outdoors by JK', logo: '/logos/iowa/outdoors-by-jk.webp', heightClass: 'h-10 sm:h-12', w: 345, h: 160 },
  { name: 'Select Construction & Remodeling', logo: '/logos/iowa/select-construction.webp', heightClass: 'h-9 sm:h-12', w: 611, h: 160 },
];

function Included({ label }: { label: string }) {
  return (
    <span className="shrink-0 inline-flex items-center gap-3 sm:gap-4 text-sm sm:text-xl font-bold tracking-tight text-neutral-800 whitespace-nowrap">
      <span aria-hidden="true" className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600" />
      {label}
    </span>
  );
}

function LogoCard({ l }: { l: Logo }) {
  return (
    <div className="shrink-0 h-14 sm:h-20 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={l.logo}
        alt={l.name}
        width={l.w}
        height={l.h}
        loading="lazy"
        decoding="async"
        className={`${l.heightClass} w-auto max-w-[130px] sm:max-w-[210px] object-contain select-none pointer-events-none`}
      />
    </div>
  );
}

function Track({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-10 sm:gap-20 pr-10 sm:pr-20 animate-infinite-marquee">{children}</div>;
}

export function IowaClientsMarquee() {
  // Each track must be wider than half the container on wide screens, or the
  // two-track loop shows a gap (same rule as NichePlatformsMarquee).
  const included = [...INCLUDED, ...INCLUDED];
  const logos = [...PREVIEW_LOGOS, ...PREVIEW_LOGOS];

  return (
    <section id="iowa-partners" aria-label="Partnering with Iowa businesses" className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200">
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Partnering with Iowa Businesses
      </p>

      <ul className="sr-only">
        {SHOW_PREVIEW_LOGOS ? PREVIEW_LOGOS.map((l) => <li key={l.name}>{l.name}</li>) : INCLUDED.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <div aria-hidden="true" className="relative w-full overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none py-2 sm:py-3">
          {[1, 2].map((track) => (
            <Track key={track}>
              {SHOW_PREVIEW_LOGOS
                ? logos.map((l, i) => <LogoCard key={`${track}-${l.name}-${i}`} l={l} />)
                : included.map((item, i) => <Included key={`${track}-${item}-${i}`} label={item} />)}
            </Track>
          ))}
        </div>
      </div>
    </section>
  );
}
