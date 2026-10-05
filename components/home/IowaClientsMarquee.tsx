type ClientLogo = {
  name: string;
  logo: string;
  // Stacked/square marks need more height than wide wordmarks to read at the same visual weight.
  heightClass: string;
  /** Intrinsic pixel size, so the browser reserves the right width before the logo loads (no layout shift). */
  w: number;
  h: number;
};

// A-1 Auto Detailing and Patrick Finnegan are real clients. The rest are small Des Moines-metro
// businesses (one per niche we serve) used as PLACEHOLDERS until more client
// logos are approved; swap them out before they're read as endorsements.
const clientLogos: ClientLogo[] = [
  { name: 'A-1 Auto Detailing', logo: '/logos/iowa/a1-auto-detailing.webp', heightClass: 'h-12 sm:h-20', w: 154, h: 160 },
  { name: 'Patrick Finnegan', logo: '/logos/iowa/patrick-finnegan.webp', heightClass: 'h-8 sm:h-10', w: 1475, h: 160 },
  { name: 'Obsidian Heating & Cooling', logo: '/logos/iowa/obsidian-heating-cooling.webp', heightClass: 'h-12 sm:h-20', w: 167, h: 160 },
  { name: 'Mark Gray Law', logo: '/logos/iowa/mark-gray-law.webp', heightClass: 'h-9 sm:h-11', w: 643, h: 160 },
  { name: "Andrew's Roofing Company", logo: '/logos/iowa/andrews-roofing.webp', heightClass: 'h-10 sm:h-12', w: 517, h: 160 },
  { name: 'Hickman Family Dental', logo: '/logos/iowa/hickman-family-dental.webp', heightClass: 'h-10 sm:h-12', w: 421, h: 160 },
  { name: 'Iowa Wealth Management', logo: '/logos/iowa/iowa-wealth-management.svg', heightClass: 'h-8 sm:h-10', w: 358, h: 74 },
  { name: 'Outdoors by JK', logo: '/logos/iowa/outdoors-by-jk.webp', heightClass: 'h-10 sm:h-12', w: 345, h: 160 },
  { name: 'Boutique Real Estate', logo: '/logos/iowa/boutique-real-estate.webp', heightClass: 'h-8 sm:h-10', w: 737, h: 160 },
  { name: 'Compelling Homes', logo: '/logos/iowa/compelling-homes.webp', heightClass: 'h-11 sm:h-14', w: 285, h: 81 },
];

function LogoCard({ client }: { client: ClientLogo }) {
  return (
    <div className="shrink-0 h-14 sm:h-20 flex items-center justify-center">
      <img
        src={client.logo}
        alt={client.name}
        title={client.name}
        width={client.w}
        height={client.h}
        loading="lazy"
        decoding="async"
        className={`${client.heightClass} w-auto max-w-[130px] sm:max-w-[210px] object-contain select-none pointer-events-none`}
      />
    </div>
  );
}

export function IowaClientsMarquee() {
  // Each track must be wider than half the container on wide screens, or the
  // two-track loop shows a gap (same rule as NichePlatformsMarquee).
  const MIN_ITEMS_PER_TRACK = 12;
  const repeatCount = Math.max(1, Math.ceil(MIN_ITEMS_PER_TRACK / clientLogos.length));
  const trackItems = Array.from({ length: repeatCount }, () => clientLogos).flat();

  return (
    <section
      id="iowa-clients"
      aria-label="Iowa businesses we serve"
      className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200"
    >
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Helping 50+ Iowa Businesses Get More Leads
      </p>

      <div className="relative w-full overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none">
          <div className="flex shrink-0 items-center gap-8 sm:gap-20 pr-8 sm:pr-20 animate-infinite-marquee">
            {trackItems.map((client, i) => (
              <LogoCard key={`track1-${client.name}-${i}`} client={client} />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-8 sm:gap-20 pr-8 sm:pr-20 animate-infinite-marquee"
          >
            {trackItems.map((client, i) => (
              <LogoCard key={`track2-${client.name}-${i}`} client={client} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
