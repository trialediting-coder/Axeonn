// The strip under the homepage hero, headed "Partnering with Iowa Businesses"
// (owner, 2026-10-19: frame Axeon as a partner in the client's growth, not a
// vendor selling a service).
//
// Production scrolls what every AxeonCORE practice or firm gets. Axeon has no
// practice or firm clients to show yet, and a row of business names reads as a
// client list, so only real, approved clients may ever appear here in
// production.
//
// Preview deploys and local dev scroll a DESIGN MOCKUP instead (owner,
// 2026-10-19: "find real businesses in our verticals to put there, not ones
// we've worked with"). These are real Des Moines-area dental practices, med
// spas, law firms and CPA firms. None of them is an Axeon client and none has
// approved this use, so this list must never render in production: showing
// them there would present them as clients. Preview-only; swap in real,
// approved client logos before anything like this ships.
const SHOW_PREVIEW_LOGOS = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

const INCLUDED = [
  '60-second first reply, 24/7',
  'Missed-call text-back',
  'Online consultation booking',
  'Two-way text inbox for your front desk or intake team',
  'Review request after every appointment',
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
