import type { Niche } from '@/data/nichesData';

// The fix for the leaks above. A header strip carries the three layers every
// AxeonCORE practice gets (same layers as /marketing-solutions), then the
// practice's own workflow as a timeline: horizontal on desktop, vertical on
// mobile. Each step that plugs a leak says which one. On phones the strip steps
// aside (the five steps already name the same three layers) so the whole
// workflow fits one screen.
const SYSTEM = [
  { title: 'Website', body: 'Your people and credentials, services, reviews and booking on one fast, mobile-first site.' },
  { title: '60-second intake', body: 'Every missed call and web inquiry gets a reply within 60 seconds, 24/7, and a way to book.' },
  { title: 'Review engine', body: 'An automatic review request after every appointment, so your reputation keeps up with your work.' },
];


// Purpose: how the system answers, books and asks for the review, step by step, for this practice type.
export function NicheWorkflow({ niche }: { niche: Niche }) {
  const steps = niche.intakeWorkflowSteps;

  return (
    <section id="how-it-works" className="w-full bg-[#FAF9F8] px-4 py-10 sm:px-10 sm:py-28 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header strip: the system in one line (tablet and up) */}
        <div className="hidden sm:grid gap-6 border-y border-neutral-300 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12 mb-16">
          <div>
            <p className="eyebrow mb-2">THE SYSTEM</p>
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

        <p className="eyebrow mb-2 sm:mb-3">
          HOW IT WORKS<span className="sm:hidden"> &middot; IN AXEONCORE</span>
        </p>
        <h2 className="max-w-4xl text-[26px] font-extrabold font-display tracking-tight leading-[1.1] text-balance text-neutral-950 sm:text-5xl sm:leading-[1.05]">
          {niche.workflowHeadline}
        </h2>
        <p className="hidden sm:block mt-4 max-w-2xl text-lg text-neutral-600">Included in AxeonCORE. These run automatically, every day.</p>

        {/* Every niche has 5 steps; the grid wraps gracefully if that changes. */}
        <ol className="mt-5 sm:mt-12 grid grid-cols-1 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            return (
              <li
                key={step.text}
                className={`relative pl-10 sm:pl-12 lg:pl-0 lg:pt-14 ${last ? '' : 'pb-3.5 sm:pb-10 lg:pb-0'}`}
              >
                {/* Connector: vertical on mobile, horizontal on desktop */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[13px] sm:left-[15px] top-7 sm:top-8 bottom-0 w-0.5 bg-blue-600/20 lg:left-8 lg:right-[-24px] lg:top-[15px] lg:bottom-auto lg:h-0.5 lg:w-auto"
                  />
                )}
                <span className="absolute left-0 top-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-snug sm:text-base sm:leading-relaxed text-neutral-800">{step.text}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 sm:mt-12 max-w-3xl rounded-2xl border border-neutral-300 bg-white px-4 py-3 sm:px-5 sm:py-4 text-sm leading-snug sm:leading-relaxed text-neutral-700 sm:text-base">
          <span className="mr-2 font-mono text-xs font-bold tracking-widest text-blue-600">GOOD TO KNOW</span>
          {niche.complianceNote}
        </p>
      </div>
    </section>
  );
}
