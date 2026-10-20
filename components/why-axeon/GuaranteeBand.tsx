import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { COMMITMENT_HEADLINE, COMMITMENT_TERMS_HREF } from '@/data/pricingData';

/** /why-axeon section 04: full-bleed blue band, "90 days" at giant size + the exact performance commitment. */
export function GuaranteeBand({ id = 'guarantee' }: { id?: string }) {
  return (
    // Purpose: the 90-day performance commitment in full, and how it differs from a typical agency.
    <section id={id} className="w-full bg-blue-600 text-white py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="eyebrow eyebrow-onblue mb-3 sm:mb-6">
          04 · THE PERFORMANCE COMMITMENT
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-8 lg:gap-12 items-end">
          <p className="lg:col-span-5 font-black font-display tracking-tighter leading-[0.85] flex items-baseline gap-3 sm:block">
            <span className="block text-[88px] sm:text-[180px] lg:text-[220px]">90</span>
            <span className="block text-4xl sm:text-6xl tracking-tight">days</span>
          </p>
          <div className="lg:col-span-7">
            <h2 className="text-lg sm:text-3xl lg:text-[34px] font-extrabold font-display tracking-tight leading-snug sm:leading-[1.2]">
              {COMMITMENT_HEADLINE}
            </h2>
            <p className="mt-2 sm:mt-4 text-sm sm:text-base text-blue-100 leading-snug sm:leading-relaxed max-w-2xl">
              Written into your agreement and tracked in AxeonPROOF.{' '}
              <Link href={COMMITMENT_TERMS_HREF} className="underline underline-offset-2 font-semibold text-white">
                See the terms
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-5 sm:mt-12 grid sm:grid-cols-2 gap-2.5 sm:gap-4 border-t border-white/20 pt-4 sm:pt-8 text-[15px] leading-snug sm:leading-normal sm:text-lg">
          <p className="flex gap-3 text-blue-100">
            <LineIcon>
              <X size={20} aria-hidden="true" />
            </LineIcon>
            <span>A typical agency gets paid the same whether your calls get answered or not.</span>
          </p>
          <p className="flex gap-3 font-semibold">
            <LineIcon>
              <Check size={20} aria-hidden="true" />
            </LineIcon>
            <span>If our system misses and we don&apos;t fix it, you can walk away.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
