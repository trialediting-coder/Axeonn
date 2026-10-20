// The strip under the homepage hero, headed "Partnering with Iowa Businesses"
// (owner, 2026-10-19: frame Axeon as a partner in the client's growth, not a
// vendor selling a service).
//
// Production scrolls CLIENT_LOGOS below.
//
// Preview deploys and local dev scroll a DESIGN MOCKUP instead (owner,
// 2026-10-19: "find real businesses in our verticals to put there, not ones
// we've worked with"). These are real Des Moines-area dental practices, med
// spas, law firms and CPA firms. None of them is an Axeon client and none has
// approved this use, so this list must never render in production: showing
// them there would present them as clients. Preview-only; swap in real,
// approved client logos before anything like this ships.
const SHOW_PREVIEW_LOGOS = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

type Logo = {
  name: string;
  logo: string;
  // Stacked/square marks need more height than wide wordmarks to read at the same weight.
  heightClass: string;
  /** Intrinsic size, so the browser reserves the width before the logo loads. */
  w: number;
  h: number;
};

// Production: the businesses the strip showed before the 2026-10-20 launch
// (owner, 2026-10-20: "no put the businesses we had on there before").
// A-1 Auto Detailing and Patrick Finnegan are clients and MSH Realty Group is the
// owner's own company; the rest are Iowa businesses the owner chose to show.
const CLIENT_LOGOS: Logo[] = [
  { name: 'A-1 Auto Detailing', logo: '/logos/iowa/a1-auto-detailing.webp', heightClass: 'h-12 sm:h-20', w: 154, h: 160 },
  { name: 'Patrick Finnegan', logo: '/logos/iowa/patrick-finnegan.webp', heightClass: 'h-8 sm:h-10', w: 1475, h: 160 },
  { name: 'Obsidian Heating & Cooling', logo: '/logos/iowa/obsidian-heating-cooling.webp', heightClass: 'h-12 sm:h-20', w: 167, h: 160 },
  { name: 'Mark Gray Law', logo: '/logos/iowa/mark-gray-law.webp', heightClass: 'h-9 sm:h-11', w: 643, h: 160 },
  { name: "Andrew's Roofing Company", logo: '/logos/iowa/andrews-roofing.webp', heightClass: 'h-10 sm:h-12', w: 517, h: 160 },
  { name: 'Hintz Family Dentistry', logo: '/logos/iowa/hintz-family-dentistry.webp', heightClass: 'h-12 sm:h-16', w: 195, h: 160 },
  { name: 'Iowa Wealth Management', logo: '/logos/iowa/iowa-wealth-management.svg', heightClass: 'h-8 sm:h-10', w: 358, h: 74 },
  { name: 'Outdoors by JK', logo: '/logos/iowa/outdoors-by-jk.webp', heightClass: 'h-10 sm:h-12', w: 345, h: 160 },
  { name: 'MSH Realty Group', logo: '/logos/iowa/msh-realty-group.webp', heightClass: 'h-12 sm:h-20', w: 165, h: 160 },
  { name: 'Select Construction & Remodeling', logo: '/logos/iowa/select-construction.webp', heightClass: 'h-9 sm:h-12', w: 611, h: 160 },
];

// Preview-only design mockup (see above). Not Axeon clients. Verticals interleaved:
// dental, law, med spa, CPA.
const PREVIEW_LOGOS: Logo[] = [
  { name: 'Davidson Family Dentistry', logo: '/logos/iowa/preview/davidson-family-dentistry.webp', heightClass: 'h-14 sm:h-20', w: 261, h: 160 },
  { name: 'Dickinson Bradshaw', logo: '/logos/iowa/preview/dickinson-bradshaw.svg', heightClass: 'h-8 sm:h-11', w: 250, h: 65 },
  { name: 'Revive Dermatology Clinic & Spa', logo: '/logos/iowa/preview/revive-dermatology-clinic-spa.webp', heightClass: 'h-10 sm:h-14', w: 571, h: 160 },
  { name: 'Flagg & Company CPAs', logo: '/logos/iowa/preview/flagg-and-company.webp', heightClass: 'h-9 sm:h-12', w: 380, h: 160 },
  { name: 'Veranda Dentistry', logo: '/logos/iowa/preview/veranda-dentistry.webp', heightClass: 'h-10 sm:h-12', w: 403, h: 160 },
  { name: 'Erbe Law Firm', logo: '/logos/iowa/preview/erbe-law-firm.webp', heightClass: 'h-9 sm:h-12', w: 484, h: 160 },
  { name: 'Skin Body Soul Spa', logo: '/logos/iowa/preview/skin-body-soul.webp', heightClass: 'h-12 sm:h-16', w: 160, h: 160 },
  { name: 'Tarbell & Co., P.L.C.', logo: '/logos/iowa/preview/tarbell-and-co.webp', heightClass: 'h-6 sm:h-8', w: 1063, h: 160 },
];

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
        className={`${l.heightClass} w-auto max-w-[130px] sm:max-w-[210px] object-contain select-none pointer-events-none [filter:grayscale(1)_brightness(0.55)]`}
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
  const source = SHOW_PREVIEW_LOGOS ? PREVIEW_LOGOS : CLIENT_LOGOS;
  // Repeat until each track holds at least 12 logos, so the loop never shows a gap.
  const logos = Array.from({ length: Math.ceil(12 / source.length) }, () => source).flat();

  return (
    <section id="iowa-partners" aria-label="Partnering with Iowa businesses" className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200">
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Partnering with Iowa Businesses
      </p>

      <ul className="sr-only">
        {source.map((l) => <li key={l.name}>{l.name}</li>)}
      </ul>

      <div aria-hidden="true" className="relative w-full overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none py-2 sm:py-3">
          {[1, 2].map((track) => (
            <Track key={track}>
              {logos.map((l, i) => (
                <LogoCard key={`${track}-${l.name}-${i}`} l={l} />
              ))}
            </Track>
          ))}
        </div>
      </div>
    </section>
  );
}
