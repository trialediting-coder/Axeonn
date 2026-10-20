// The strip under the homepage hero. It used to scroll client and placeholder
// logos; the 2026-10-19 repositioning replaced that with what every AxeonCORE
// practice gets, since Axeon has no practice clients to show yet and the
// placeholder logos could be read as endorsements.
const ITEMS = [
  '60-second first reply, 24/7',
  'Missed-call text-back',
  'Online consultation booking',
  'Two-way text inbox for your front desk or intake team',
  'Review request after every visit',
  'Call tracking',
  'AxeonPROOF client portal',
  'One practice or firm per specialty within 5 miles',
];

function Item({ label }: { label: string }) {
  return (
    <span className="shrink-0 inline-flex items-center gap-3 sm:gap-4 text-sm sm:text-xl font-bold tracking-tight text-neutral-800 whitespace-nowrap">
      <span aria-hidden="true" className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600" />
      {label}
    </span>
  );
}

export function IowaClientsMarquee() {
  // Each track must be wider than half the container on wide screens, or the
  // two-track loop shows a gap (same rule as NichePlatformsMarquee).
  const trackItems = [...ITEMS, ...ITEMS];

  return (
    <section
      id="whats-included"
      aria-label="What every practice and firm gets"
      className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200"
    >
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Dental · Med Spa · Law · Accounting
      </p>

      <ul className="sr-only">
        {ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div aria-hidden="true" className="relative w-full overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none py-2 sm:py-3">
          <div className="flex shrink-0 items-center gap-8 sm:gap-16 pr-8 sm:pr-16 animate-infinite-marquee">
            {trackItems.map((item, i) => (
              <Item key={`track1-${item}-${i}`} label={item} />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-8 sm:gap-16 pr-8 sm:pr-16 animate-infinite-marquee">
            {trackItems.map((item, i) => (
              <Item key={`track2-${item}-${i}`} label={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
