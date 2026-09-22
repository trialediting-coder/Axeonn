import Link from 'next/link';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const metadata = buildMetadata({
  path: '/marketing-solutions',
  title: 'Marketing Solutions | Axeon Studio',
  description:
    'Website design, SEO/AEO/GEO, AI chat & online scheduling, lead generation, and video & photography solutions for local business revenue growth.',
});

const marketingSolutionsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Marketing Solutions | Axeon Studio',
  itemListElement: marketingSolutions.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: item.title,
      description: item.description,
      url: `https://axeonstudio.co${item.href}`,
      provider: providerRef,
      areaServed: SERVICE_AREA,
    },
  })),
};

export default function MarketingSolutionsPage() {
  return (
    <main className="w-full pt-32 pb-24 px-4 sm:px-8 lg:px-14 xl:px-20 bg-neutral-50/70 text-neutral-950 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketingSolutionsJsonLd) }}
      />
      <BreadcrumbJsonLd items={[{ name: 'Marketing Solutions', path: '/marketing-solutions' }]} />
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">
            Marketing Solutions
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 mb-5 leading-[1.14]">
            Engineered to Convert Clicks into Signed Contracts
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            From custom web engineering and AI search visibility to automated lead capture and 24/7 conversion infrastructure.
          </p>
        </div>

        {/* Solutions Grid Following Standard Spacing Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mb-20">
          {marketingSolutions.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-neutral-200/80 p-7 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-400/80 transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    0{index + 1}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                    AxeonCORE
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed font-normal mt-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Explore Solution</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Strategy Call Banner */}
        <div className="rounded-3xl bg-neutral-950 text-white p-8 sm:p-14 text-center max-w-4xl mx-auto shadow-2xl">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-400 uppercase mb-3">
            Unified Architecture
          </p>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight">
            Ready to deploy an integrated revenue system?
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Stop stitching together 5 disconnected marketing vendors. Get a complete web, AI, and lead-generation engine custom-built for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="/solutions"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-base transition-colors border border-white/20"
            >
              Browse By Industry
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
