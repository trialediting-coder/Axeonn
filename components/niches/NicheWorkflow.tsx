import type { Niche } from '@/data/nichesData';

// The fix for the leaks above. A header strip carries the three layers every
// AxeonCORE practice gets (same layers as /marketing-solutions), then the
// practice's own workflow as a timeline: horizontal on desktop, vertical on
// mobile. Each step that plugs a leak says which one.
const SYSTEM = [
  { title: 'Website', body: 'Your people and credentials, services, reviews and booking on one fast, mobile-first site.' },
  { title: '60-second intake', body: 'Every missed call and web inquiry gets a reply within 60 seconds, 24/7, and a way to book.' },
  { title: 'Review engine', body: 'An automatic review request after every appointment, so your reputation keeps up with your work.' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function NicheWorkflow({ niche }: { niche: Niche }) {
  const steps = niche.intakeWorkflowSteps;

  return (
    <section id="how-it-works" className="w-full bg-[#FAF9F8] px-4 py-20 sm:px-10 sm:py-28 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header strip: the system in one line */}
        <div className="grid gap-6 border-y border-neutral-300 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <p className="mb-2 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ THE SYSTEM ]</p>
            <p className="text-2xl font-extrabold font-display tracking-tight leading-tight text-neutral-950 sm:text-3xl">
              Answered first. Booked first. Reviewed after.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-3">
            {SYSTEM.map((s) => (
              <li key={s.title}>
                <p className="font-bold text-neutral-950">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-16 mb-3 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ HOW IT WORKS ]</p>
        <h2 className="max-w-4xl text-4xl font-extrabold font-display tracking-tight leading-[1.05] text-balance text-neutral-950 sm:text-5xl">
          {niche.workflowHeadline}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">Included in AxeonCORE. These run automatically, every day.</p>

        {/* Every niche has 5 steps; the grid wraps gracefully if that changes. */}
        <ol className="mt-12 grid grid-cols-1 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            return (
              <li
                key={step.text}
                className={`relative pl-12 lg:pl-0 lg:pt-14 ${last ? '' : 'pb-10 lg:pb-0'}`}
              >
                {/* Connector: vertical on mobile, horizontal on desktop */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-blue-600/20 lg:left-8 lg:right-[-24px] lg:top-[15px] lg:bottom-auto lg:h-0.5 lg:w-auto"
                  />
                )}
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                {step.plugsLeaks && step.plugsLeaks.length > 0 && (
                  <a
                    href="#the-leaks"
                    className="py-2 mb-2 inline-block font-mono text-[11px] font-bold tracking-widest text-blue-600 hover:text-blue-700"
                  >
                    [ PLUGS LEAK {step.plugsLeaks.map(pad).join(' + ')} ]
                  </a>
                )}
                <p className="leading-relaxed text-neutral-800">{step.text}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-12 max-w-3xl rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
          <span className="mr-2 font-mono text-xs font-bold tracking-widest text-blue-600">[ GOOD TO KNOW ]</span>
          {niche.complianceNote}
        </p>
      </div>
    </section>
  );
}
