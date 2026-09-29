import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { GetStartedFlow } from '@/components/get-started/GetStartedFlow';

// Self-serve intake: questions → package recommendation → book a call.
// Logic lives in lib/getStarted.ts; packages in data/getStartedPackages.ts.
export const metadata: Metadata = buildMetadata({
  path: '/get-started',
  title: 'Get Started | Axeon Studio',
  description:
    'Answer a few quick questions and get an instant package recommendation from Axeon Studio, then book a short call to lock it in.',
});

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950 pt-28 sm:pt-32 pb-24">
      <BreadcrumbJsonLd items={[{ name: 'Get Started', path: '/get-started' }]} />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <header className="max-w-3xl mb-10 sm:mb-12">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-600 mb-4">Get started</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
            Find your plan in about a minute.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            A few quick questions. You get an instant recommendation, then we lock it in together on a short call.
          </p>
        </header>

        <GetStartedFlow />
      </div>
    </main>
  );
}
