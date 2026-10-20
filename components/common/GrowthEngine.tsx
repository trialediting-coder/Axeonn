import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clapperboard, Megaphone, PhoneCall, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// What AxeonGROWTH adds on top of AxeonCORE's intake. All four come with
// AxeonGROWTH; on AxeonCORE some are add-ons (prices live on /pricing, data/pricingData.ts).
interface EngineModule {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
}

const engineModules: EngineModule[] = [
  {
    icon: Megaphone,
    title: 'Google Ads & LSA',
    body: 'Local Services Ads and search ads on the services you want more of, reported in AxeonPROOF.',
    href: '/marketing-solutions/advertising',
  },
  {
    icon: PhoneCall,
    title: 'AI Receptionist',
    body: 'Answers the calls your front desk can’t get to, takes the details, and books the consultation.',
    href: '/marketing-solutions/ai-chat-scheduling',
  },
  {
    icon: RefreshCw,
    title: 'Past-Patient Reactivation',
    body: 'A campaign each quarter to past patients and clients who are due to come back.',
    href: '/marketing-solutions/lead-generation',
  },
  {
    icon: Clapperboard,
    title: 'Photo & Video',
    body: 'Quarterly shoots for review videos and reels, so people see your practice before they book.',
    href: '/marketing-solutions/video-photography',
  },
];

const builds = [
  {
    name: 'AxeonCORE',
    price: 'From $799/mo',
    line: 'Every missed call and web inquiry answered within 60 seconds, 24/7, online booking, review requests after every visit, and AxeonPROOF.',
    recommended: true,
  },
  {
    name: 'AxeonGROWTH',
    price: 'From $1,999/mo',
    line: 'Everything in CORE, plus Google ads and LSA, an AI receptionist, past-patient reactivation, and quarterly photo & video.',
  },
];

interface GrowthEngineProps {
  /** Show the "Step 1: pick your plan" column. Turn off right after the pricing cards. */
  showBuilds?: boolean;
  /** 'section' adds page gutters for full-width pages; 'card' fits inside an existing container. */
  variant?: 'section' | 'card';
}

/**
 * One message: once intake is answering every inquiry, add channels that bring more in.
 * Headline on the left, the four channels as a compact list on the right --
 * a single slab, not four competing cards.
 */
export function GrowthEngine({ showBuilds = true, variant = 'section' }: GrowthEngineProps) {
  const card = (
    <div
      id={variant === 'section' ? 'axeoncore' : undefined}
      className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#080b12] border border-neutral-800/80 px-6 py-10 sm:px-12 sm:py-14 text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 0% 0%, rgba(0, 128, 255, 0.18) 0%, rgba(8, 11, 18, 0) 50%)' }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        <div className="lg:col-span-5">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ AFTER LAUNCH ]</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.08]">
            Add more once intake is solid.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
            AxeonCORE makes sure every call and inquiry gets answered. When you want more new patients or clients
            coming in, AxeonGROWTH adds these.
          </p>
          <Link
            href="/audit"
            className="py-2 mt-6 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Start with a free after-hours audit <ArrowRight size={16} />
          </Link>
        </div>

        <ul className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
          {engineModules.map((m) => (
            <li key={m.title}>
              <Link href={m.href} className="group flex items-center gap-4 py-4 sm:py-5">
                <m.icon aria-hidden="true" className="h-5 w-5 text-blue-400 shrink-0" />
                <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-4">
                  <span className="block sm:w-48 sm:shrink-0 font-bold text-base sm:text-lg">{m.title}</span>
                  <span className="block text-sm sm:text-base text-neutral-400 leading-relaxed">{m.body}</span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {showBuilds && (
        <div className="relative mt-10 pt-8 border-t border-white/10">
          <p className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-4">
            Start with a plan
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {builds.map((b) => (
              <div
                key={b.name}
                className={`rounded-2xl border p-5 ${
                  b.recommended ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-bold">{b.name}</h3>
                  <span className="text-base sm:text-lg font-black">{b.price}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{b.line}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Compare both plans <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );

  if (variant === 'card') return card;

  return (
    <section className="w-full px-4 sm:px-8 lg:px-14 xl:px-20 py-12 sm:py-16">
      <div className="w-full max-w-6xl mx-auto">{card}</div>
    </section>
  );
}
