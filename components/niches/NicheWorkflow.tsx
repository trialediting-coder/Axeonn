import type { Niche } from '@/data/nichesData';

export function NicheWorkflow({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-4">
          The intake workflow we build for you
        </h2>
        <p className="text-neutral-600 mb-10 max-w-2xl">
          Every step below runs automatically once your Custom CRM Pipeline is live.
        </p>
        <ol className="space-y-5">
          {niche.intakeWorkflowSteps.map((step, i) => (
            <li key={step} className="flex gap-5 items-start">
              <span className="shrink-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-neutral-800 leading-relaxed pt-1.5">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap gap-2">
          {niche.industryTerms.map((term) => (
            <span
              key={term}
              className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-mono uppercase tracking-wide text-neutral-500"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
