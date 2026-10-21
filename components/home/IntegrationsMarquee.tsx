// The strip under the homepage hero, headed "Integrated with Industry Leaders"
// (owner, 2026-10-21: replaces the "Partnering with Iowa Businesses" client strip
// now that Axeon is an approved integration partner).
//
// Only list platforms Axeon is approved with or already connects to. Clio,
// NexHealth and QuickBooks were approved 2026-10-21; Dentrix and Open Dental
// connect through NexHealth. Jobber left the strip 2026-10-21 (owner).

type Integration = {
  name: string;
  /** Omit to show the name as a plain text label until the official logo file is added. */
  logo?: string;
  heightClass: string;
  /** Intrinsic size, so the browser reserves the width before the logo loads. */
  w: number;
  h: number;
};

const INTEGRATIONS: Integration[] = [
  { name: 'Clio', logo: '/logos/clio.png', heightClass: 'h-8 sm:h-11', w: 562, h: 177 },
  // TODO: add the official NexHealth logo at /logos/nexhealth.svg and set `logo`.
  { name: 'NexHealth', heightClass: 'h-8 sm:h-11', w: 0, h: 0 },
  // Dentrix and Open Dental are reached through NexHealth (owner, 2026-10-21).
  { name: 'Dentrix', logo: '/logos/dentrix.svg', heightClass: 'h-5 sm:h-7', w: 142, h: 22 },
  { name: 'Open Dental', logo: '/logos/open-dental.png', heightClass: 'h-9 sm:h-12', w: 500, h: 180 },
  { name: 'QuickBooks', logo: '/logos/quickbooks.svg', heightClass: 'h-8 sm:h-11', w: 270, h: 69 },
];

function LogoCard({ l }: { l: Integration }) {
  return (
    <div className="shrink-0 h-14 sm:h-20 flex items-center justify-center">
      {l.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={l.logo}
          alt={l.name}
          width={l.w}
          height={l.h}
          loading="lazy"
          decoding="async"
          className={`${l.heightClass} w-auto max-w-[130px] sm:max-w-[210px] object-contain select-none pointer-events-none [filter:grayscale(1)_brightness(0.55)]`}
        />
      ) : (
        <span className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-800 select-none whitespace-nowrap">{l.name}</span>
      )}
    </div>
  );
}

function Track({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-10 sm:gap-20 pr-10 sm:pr-20 animate-infinite-marquee">{children}</div>;
}

export function IntegrationsMarquee() {
  // Each track must be wider than half the container on wide screens, or the
  // two-track loop shows a gap (same rule as NichePlatformsMarquee).
  // Repeat until each track holds at least 12 logos, so the loop never shows a gap.
  const logos = Array.from({ length: Math.ceil(12 / INTEGRATIONS.length) }, () => INTEGRATIONS).flat();

  return (
    <section id="integrations" aria-label="Integrated with industry leaders" className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200">
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Integrated with Industry Leaders
      </p>

      <ul className="sr-only">
        {INTEGRATIONS.map((l) => <li key={l.name}>{l.name}</li>)}
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
