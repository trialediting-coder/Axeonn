import Link from 'next/link';

// What the system commits to in writing (data/pricingData.ts, the agreement's
// Section 5), not client results: there are no practice clients to quote yet,
// and trade/detailer results are not proof for a practice (2026-10-19 brief).
// One row, four facts, so a page can show them without a whole section.
const PROOF = [
  { value: '60 sec', label: 'first reply to every missed call and web inquiry' },
  { value: '24/7', label: 'including nights, weekends and lunch hours' },
  { value: '30 days', label: 'to go live once we have your materials' },
  { value: '5 miles', label: 'one practice per specialty, territory exclusivity' },
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
          <Link href="/axeonproof" className="inline-block py-2 underline underline-offset-4 hover:text-blue-600">
            See how AxeonPROOF tracks every one
          </Link>
        </p>
      </div>
    </section>
  );
}
