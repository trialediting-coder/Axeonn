import type { Niche } from '@/data/nichesData';

const withArticle = (noun: string) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;

export function NicheWorkflow({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ HOW IT WORKS ]</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 mb-4">
          How {withArticle(niche.leadNoun)} becomes a booking
        </h2>
        <p className="text-neutral-600 mb-10 max-w-2xl">On AxeonCORE, these run automatically.</p>
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
      </div>
    </section>
  );
}
