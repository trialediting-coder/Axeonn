// The strip under the homepage hero, headed "Partnering with Iowa Businesses"
// (owner, 2026-10-19: frame Axeon as a partner in the client's growth, not a
// vendor selling a service).
//
// Production scrolls what every AxeonCORE practice or firm gets. Axeon has no
// practice or firm clients to show yet, and a row of business names reads as a
// client list, so only real, approved clients may ever appear here in
// production.
//
// Preview deploys and local dev scroll PLACEHOLDER Iowa practices and firms
// instead (owner, 2026-10-19), so the client strip can be designed now. Every
// name below is invented. Replace them with real clients (and show them in
// production) as practices and firms sign and approve being listed.
const SHOW_PLACEHOLDERS = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

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

type Placeholder = { name: string; city: string; kind: 'Dental' | 'Med spa' | 'Law' | 'Accounting'; style: string };

// Invented names, two per vertical, interleaved so no vertical bunches up.
const PLACEHOLDERS: Placeholder[] = [
  { name: 'Quillmont Family Dental', city: 'West Des Moines', kind: 'Dental', style: 'font-display font-black tracking-tight' },
  { name: 'Harlan & Pike', city: 'Des Moines', kind: 'Law', style: 'font-serif font-semibold tracking-wide uppercase' },
  { name: 'Verawood Aesthetics', city: 'Ankeny', kind: 'Med spa', style: 'font-serif italic font-medium tracking-wide' },
  { name: 'Ostrander Tax & Advisory', city: 'Urbandale', kind: 'Accounting', style: 'font-sans font-bold tracking-tight' },
  { name: 'Bluestem Dental Studio', city: 'Waukee', kind: 'Dental', style: 'font-sans font-extrabold lowercase tracking-tight' },
  { name: 'Kestrel Brandt Attorneys', city: 'Clive', kind: 'Law', style: 'font-serif font-bold tracking-tight' },
  { name: 'Prairie Glow Med Spa', city: 'Johnston', kind: 'Med spa', style: 'font-display font-semibold tracking-[0.08em] uppercase' },
  { name: 'Ledgerline CPA Group', city: 'Ames', kind: 'Accounting', style: 'font-mono font-bold tracking-tight' },
];

function Included({ label }: { label: string }) {
  return (
    <span className="shrink-0 inline-flex items-center gap-3 sm:gap-4 text-sm sm:text-xl font-bold tracking-tight text-neutral-800 whitespace-nowrap">
      <span aria-hidden="true" className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600" />
      {label}
    </span>
  );
}

function Wordmark({ p }: { p: Placeholder }) {
  return (
    <span className="shrink-0 inline-flex flex-col items-center leading-tight whitespace-nowrap select-none">
      <span className={`text-base sm:text-2xl text-neutral-800 ${p.style}`}>{p.name}</span>
      <span className="mt-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {p.kind} · {p.city}, IA
      </span>
    </span>
  );
}

function Track({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-10 sm:gap-20 pr-10 sm:pr-20 animate-infinite-marquee">{children}</div>;
}

export function IowaClientsMarquee() {
  // Each track must be wider than half the container on wide screens, or the
  // two-track loop shows a gap (same rule as NichePlatformsMarquee).
  const included = [...INCLUDED, ...INCLUDED];
  const names = [...PLACEHOLDERS, ...PLACEHOLDERS];

  return (
    <section id="iowa-partners" aria-label="Partnering with Iowa businesses" className="w-full py-4 sm:py-9 bg-white border-b border-neutral-200">
      <p className="text-center text-[11px] sm:text-base font-bold tracking-[0.06em] sm:tracking-[0.22em] whitespace-nowrap sm:whitespace-normal text-[#3366ff] uppercase mb-2 sm:mb-5 px-4">
        Partnering with Iowa Businesses
        {SHOW_PLACEHOLDERS && (
          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-bold tracking-normal normal-case text-amber-800">
            Preview placeholders
          </span>
        )}
      </p>

      <ul className="sr-only">
        {SHOW_PLACEHOLDERS ? PLACEHOLDERS.map((p) => <li key={p.name}>{p.name}</li>) : INCLUDED.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <div aria-hidden="true" className="relative w-full overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none py-2 sm:py-3">
          {[1, 2].map((track) => (
            <Track key={track}>
              {SHOW_PLACEHOLDERS
                ? names.map((p, i) => <Wordmark key={`${track}-${p.name}-${i}`} p={p} />)
                : included.map((item, i) => <Included key={`${track}-${item}-${i}`} label={item} />)}
            </Track>
          ))}
        </div>
      </div>
    </section>
  );
}
