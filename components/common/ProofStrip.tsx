import Link from 'next/link';

// Real, client-confirmed proof only (see content/brand-guardrails.md). One row,
// four facts, so a page can show proof without a whole section.
const PROOF = [
  { value: '#1', label: 'on Google for "Pleasant Hill auto detailing," up from page 2' },
  { value: '5.0', label: 'Google rating from 180+ reviews' },
  { value: '100/100', label: 'SEO audit score' },
  { value: '90-day', label: 'customer guarantee' },
];

export function ProofStrip({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <section className={`w-full px-4 sm:px-8 py-12 sm:py-16 ${dark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950'}`}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden ${dark ? 'bg-white/10' : 'bg-neutral-200'}`}>
          {PROOF.map((p) => (
            <div key={p.label} className={`px-5 py-7 text-center ${dark ? 'bg-neutral-950' : 'bg-white'}`}>
              <p className="text-3xl sm:text-4xl font-black font-display tracking-tight">{p.value}</p>
              <p className={`mt-1.5 text-sm leading-snug ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{p.label}</p>
            </div>
          ))}
        </div>
        <p className={`mt-4 text-center text-sm ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          <Link href="/insights/a-1-auto-detailing-website-case-study" className="underline underline-offset-4 hover:text-blue-600">
            See how we did it for A-1 Auto Detailing
          </Link>
        </p>
      </div>
    </section>
  );
}
