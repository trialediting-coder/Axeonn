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
}

const engineModules: EngineModule[] = [
  {
    icon: PhoneCall,
    title: 'AI Receptionist',
    body: 'Picks up every call, books the job, texts back anyone who hangs up.',
    href: '/book',
  },
  {
    icon: Megaphone,
    title: 'Google & Meta Ads',
    body: 'Campaigns on the services you want more of, tracked to the booked job.',
    href: '/marketing-solutions/advertising',
  },
  {
    icon: Search,
    title: 'Ongoing SEO & Content',
    body: 'New pages and updates that keep you climbing on Google and in AI answers.',
    href: '/marketing-solutions/seo',
  },
  {
    icon: Star,
    title: 'Reviews & Social',
    body: 'A steady flow of new reviews, plus posts made from your own footage.',
    href: '/book',
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
  /** Show the "Step 1: pick your plan" column. Turn off right after the pricing cards. */
  showBuilds?: boolean;
  /** 'section' adds page gutters for full-width pages; 'card' fits inside an existing container. */
  variant?: 'section' | 'card';
}

/**
 * One message: once your plan is bringing customers in, add more channels.
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
            Add more once it&apos;s working.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
            Your plan gets new customers coming in. When you want more, we plug in extra channels, scoped to your
            market on the call.
          </p>
          <Link
            href="/book"
            className="mt-6 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ask about it on your free call <ArrowRight size={16} />
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
