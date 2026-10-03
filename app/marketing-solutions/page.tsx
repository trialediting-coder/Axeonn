import Link from 'next/link';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ArrowRight } from 'lucide-react';
import { GrowthEngine } from '@/components/common/GrowthEngine';

export const metadata = buildMetadata({
  path: '/marketing-solutions',
  title: 'Marketing Solutions | Axeon Studio',
  description:
    'Website design, SEO/AEO/GEO, AI chat & online scheduling, lead generation, Google & Meta advertising, and video & photography, all part of AxeonCORE, the growth engine for local businesses.',
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
                    {item.included}
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

        <GrowthEngine variant="card" />
      </div>
    </main>
  );
}
