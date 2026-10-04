import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Megaphone, PhoneCall, Search, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// AxeonCORE is the growth engine, not a package. The $5,800 "AxeonCORE Build"
// is the setup; these engine add-ons are scoped on the strategy call.
// Owner rule: never show add-on prices or the word "monthly" here.
interface EngineModule {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const engineModules: EngineModule[] = [
  {
    icon: PhoneCall,
    title: 'AI Receptionist',
    body: 'Picks up every call around the clock, answers questions, books the job, and texts back anyone who hangs up.',
    href: '/book',
    cta: 'Ask on your call',
  },
  {
    icon: Megaphone,
    title: 'Google & Meta Ads',
    body: 'Campaigns aimed at the services you want more of, sent to pages built to convert, and tracked to the booked job.',
    href: '/marketing-solutions/advertising',
    cta: 'See how we run ads',
  },
  {
    icon: Search,
    title: 'Ongoing SEO & Content',
    body: 'New pages, guides, and updates that keep you climbing on Google and showing up in AI answers.',
    href: '/marketing-solutions/seo',
    cta: 'See our SEO',
  },
  {
    icon: Star,
    title: 'Reviews & Social',
    body: 'A steady flow of new reviews, plus posts made from your own footage, handled for you.',
    href: '/book',
    cta: 'Ask on your call',
  },
];

const builds = [
  { name: 'Essentials', price: '$2,800 + from $284/mo', line: 'Get found: Google, AI search, a site that converts, and instant lead alerts.' },
  {
    name: 'AxeonCORE',
    price: '$5,800 + from $574/mo',
    line: 'Get found, chosen, and booked: adds on-site video, the CRM pipeline, AI chat, and automated follow-up.',
    recommended: true,
  },
];

interface GrowthEngineProps {
  /** Show the "Step 1: start with a build" column. Turn off right after the pricing cards. */
  showBuilds?: boolean;
  /** 'section' adds page gutters for full-width pages; 'card' fits inside an existing container. */
  variant?: 'section' | 'card';
}

export function GrowthEngine({ showBuilds = true, variant = 'section' }: GrowthEngineProps) {
  const card = (
    <div id={variant === 'section' ? 'axeoncore' : undefined} className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-[#080b12] border border-neutral-800/80 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 text-white shadow-2xl">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 0%, rgba(0, 128, 255, 0.22) 0%, rgba(8, 11, 18, 0) 55%)' }}
      />

      <div className="relative">
        <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-400 uppercase mb-4">
          AxeonCORE · The Customer Engine
        </p>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08] max-w-4xl">
          Want even more customers? Turn up the engine.
        </h2>
        <p className="mt-5 text-base sm:text-lg lg:text-xl text-neutral-300 leading-relaxed max-w-3xl">
          Your plan gets new customers coming in. When you&apos;re ready for more, we plug in extra channels: every
          call answered, ads on the services you want more of, and a steady stream of fresh reviews.
        </p>

        <div className={`mt-12 grid gap-6 lg:gap-8 ${showBuilds ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}`}>
          {showBuilds && (
            <div>
              <p className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                Step 1 · Pick your plan
              </p>
              <div className="flex flex-col gap-4">
                {builds.map((b) => (
                  <div
                    key={b.name}
                    className={`rounded-2xl border p-5 sm:p-6 ${
                      b.recommended ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg sm:text-xl font-bold">
                        {b.name}
                        {b.recommended && (
                          <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 rounded-full px-2 py-0.5">
                            Recommended
                          </span>
                        )}
                      </h3>
                      <span className="text-lg sm:text-xl font-black">{b.price}</span>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed">{b.line}</p>
                  </div>
                ))}
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Compare both plans <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-4">
              {showBuilds ? 'Step 2 · Plug into the engine' : 'Then plug into the engine'}
            </p>
            <div className={`grid gap-4 sm:grid-cols-2 ${showBuilds ? '' : 'lg:grid-cols-4'}`}>
              {engineModules.map((m) => (
                <Link
                  key={m.title}
                  href={m.href}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:border-blue-500/60 hover:bg-white/[0.06] transition-colors"
                >
                  <div>
                    <m.icon aria-hidden="true" className="h-6 w-6 text-blue-400 mb-4" />
                    <h3 className="text-lg font-bold">{m.title}</h3>
                    <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{m.body}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                    {m.cta}
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 border-t border-white/10 pt-8">
          <Link
            href="/book"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-[#0080FF] hover:bg-[#0070EE] text-white font-bold text-base transition-colors shadow-lg shadow-blue-500/30"
          >
            Book a Free Strategy Call
          </Link>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            We scope the engine to your market and goals on the call. You pick what fits.
          </p>
        </div>
      </div>
    </div>
  );

  if (variant === 'card') return card;

  return (
    <section className="w-full px-4 sm:px-8 lg:px-14 xl:px-20 py-16 sm:py-24">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">{card}</div>
    </section>
  );
}
