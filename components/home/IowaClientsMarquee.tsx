type ClientLogo = {
  name: string;
  logo: string;
  // Stacked/square marks need more height than wide wordmarks to read at the same visual weight.
  heightClass: string;
};

// A-1 Auto Detailing is a real client. The rest are small Des Moines-metro
// businesses (one per niche we serve) used as PLACEHOLDERS until more client
// logos are approved; swap them out before they're read as endorsements.
const clientLogos: ClientLogo[] = [
  { name: 'A-1 Auto Detailing', logo: '/logos/iowa/a1-auto-detailing.webp', heightClass: 'h-12 sm:h-20' },
  { name: 'Obsidian Heating & Cooling', logo: '/logos/iowa/obsidian-heating-cooling.webp', heightClass: 'h-12 sm:h-20' },
  { name: 'Mark Gray Law', logo: '/logos/iowa/mark-gray-law.webp', heightClass: 'h-9 sm:h-11' },
  { name: "Andrew's Roofing Company", logo: '/logos/iowa/andrews-roofing.webp', heightClass: 'h-10 sm:h-12' },
  { name: 'Hickman Family Dental', logo: '/logos/iowa/hickman-family-dental.webp', heightClass: 'h-10 sm:h-12' },
  { name: 'Iowa Wealth Management', logo: '/logos/iowa/iowa-wealth-management.svg', heightClass: 'h-8 sm:h-10' },
  { name: 'Outdoors by JK', logo: '/logos/iowa/outdoors-by-jk.webp', heightClass: 'h-10 sm:h-12' },
  { name: 'Boutique Real Estate', logo: '/logos/iowa/boutique-real-estate.webp', heightClass: 'h-8 sm:h-10' },
  { name: 'Compelling Homes', logo: '/logos/iowa/compelling-homes.webp', heightClass: 'h-11 sm:h-14' },
];

function LogoCard({ client }: { client: ClientLogo }) {
  return (
    <div className="shrink-0 h-16 sm:h-20 flex items-center justify-center">
      <img
        src={client.logo}
        alt={client.name}
        title={client.name}
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
      aria-label="Iowa businesses we serve"
      className="w-full py-6 sm:py-9 bg-white border-b border-neutral-200"
    >
      <p className="text-center text-xs sm:text-base font-bold tracking-[0.16em] sm:tracking-[0.22em] text-balance text-[#3366ff] uppercase mb-3 sm:mb-5 px-4">
        Serving 50+ Businesses Here in Iowa
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
