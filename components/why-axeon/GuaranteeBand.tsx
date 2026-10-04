import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { guaranteeSentence } from '@/data/pricingData';

/** /why-axeon section 04: full-bleed blue band, "90 days" at giant size + the exact guarantee sentence. */
export function GuaranteeBand({ id = 'guarantee' }: { id?: string }) {
  return (
    <section id={id} className="w-full bg-blue-600 text-white py-20 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase mb-6">
          [ 04 · THE GUARANTEE ]
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <p className="lg:col-span-5 font-black font-display tracking-tighter leading-[0.85]">
            <span className="block text-[120px] sm:text-[180px] lg:text-[220px]">90</span>
            <span className="block text-5xl sm:text-6xl tracking-tight">days</span>
          </p>
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-extrabold font-display tracking-tight leading-[1.15]">
              {guaranteeSentence}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
              Baseline set together on your kickoff call. Applies while you&apos;re on a monthly plan and answering new
              leads within one business day.{' '}
              <Link href="/pricing" className="underline underline-offset-2 font-semibold text-white">
                See the terms
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 gap-4 border-t border-white/20 pt-8 text-base sm:text-lg">
          <p className="flex gap-3 text-blue-100">
            <X size={20} className="mt-1 shrink-0" aria-hidden="true" />
            <span>A typical agency gets paid the same whether your phone rings or not.</span>
          </p>
          <p className="flex gap-3 font-semibold">
            <Check size={20} className="mt-1 shrink-0" aria-hidden="true" />
            <span>We put ours on the line, on every monthly plan.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
