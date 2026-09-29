import type { Metadata } from 'next';
import { CalendarCheck, ListChecks, Phone, Sparkles } from 'lucide-react';
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

const STEPS = [
  { icon: ListChecks, title: 'Answer a few questions', body: 'What you need, where you are today, and what you want next.' },
  { icon: Sparkles, title: 'Get your recommended plan', body: 'You see the package that fits right away. No waiting on a proposal.' },
  { icon: CalendarCheck, title: 'Lock it in on a short call', body: 'We already have your answers, so the call starts with your plan.' },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950 pt-28 sm:pt-32 pb-20 sm:pb-28">
      <BreadcrumbJsonLd items={[{ name: 'Get Started', path: '/get-started' }]} />

      {/* Same container as the header so the edges line up */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start">
          {/* Left: what this is and what happens next */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <p className="text-sm font-mono uppercase tracking-wider text-blue-600 mb-4">Get started</p>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Find your plan in about a minute.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-xl">
              A few quick questions. You get an instant recommendation, then we lock it in together on a short call.
            </p>

            <ol className="mt-10 space-y-6 hidden sm:block">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-white border border-neutral-200 text-blue-600 flex items-center justify-center shadow-xs">
                    <Icon size={20} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold tracking-[0.2em] text-neutral-400">0{i + 1}</p>
                    <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                    <p className="text-base text-neutral-600 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <a
              href="tel:+15154938017"
              className="mt-10 hidden lg:inline-flex items-center gap-2 text-base font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>

          {/* Right: the form */}
          <div className="lg:col-span-7">
            <div className="rounded-[32px] sm:rounded-[36px] bg-white border border-neutral-200 shadow-xl shadow-neutral-900/5 p-6 sm:p-8 lg:p-10 w-full">
              <GetStartedFlow embedded source="get_started" />
            </div>

            <a
              href="tel:+15154938017"
              className="mt-6 flex lg:hidden items-center justify-center gap-2 text-base font-semibold text-neutral-700"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
