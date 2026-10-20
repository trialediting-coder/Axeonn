import Link from 'next/link';
import type { Niche } from '@/data/nichesData';
import { services } from '@/data/marketingSolutionsData';
import { cityPages } from '@/data/cityPages';

// Answer-first block for search and AI answer engines: the page's main question
// in one short sentence, then links (not paragraphs) to the services and the
// city pages, so each practice page is a hub in the internal-link graph.

const PLURAL: Record<string, { who: string; unit: string }> = {
  dental: { who: 'dental practices', unit: 'practice' },
  'med-spa': { who: 'med spas', unit: 'med spa' },
  'law-firms': { who: 'law firms', unit: 'firm' },
  accounting: { who: 'accounting and CPA firms', unit: 'firm' },
};

const CITIES = [
  ...cityPages.filter((c) => c.slug === 'west-des-moines-web-design').map((c) => ({ city: c.city, href: `/${c.slug}` })),
  { city: 'Des Moines', href: '/des-moines-web-design' },
  ...cityPages.filter((c) => c.slug !== 'west-des-moines-web-design').map((c) => ({ city: c.city, href: `/${c.slug}` })),
];

export function nicheQuickAnswer(niche: Niche) {
  const p = PLURAL[niche.slug] ?? { who: niche.name.toLowerCase(), unit: 'practice' };
  return {
    question: `What does Axeon do for ${p.who}?`,
    answer: `Axeon Studio is a West Des Moines growth partner for ${p.who}: the website, local SEO and 60-second intake on one plan, with one ${p.unit} per specialty within 5 miles.`,
    who: p.who,
  };
}

// Purpose: the direct answer to "what does Axeon do for my kind of practice", plus where to go next.
export function NicheQuickAnswer({ niche }: { niche: Niche }) {
  const qa = nicheQuickAnswer(niche);
  const link = 'whitespace-nowrap font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2';
  return (
    <section className="w-full bg-white px-4 py-8 sm:px-10 sm:py-16 lg:px-16 xl:px-24">
      <div className="max-w-4xl mx-auto">
        <p className="mb-2 sm:mb-3 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ Quick answer ]</p>
        <h2 className="text-[24px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight text-neutral-950 text-balance">
          {qa.question}
        </h2>
        <p className="mt-2 sm:mt-4 text-[15px] sm:text-xl leading-snug sm:leading-relaxed text-neutral-700">{qa.answer}</p>
        <dl className="mt-4 sm:mt-6 grid gap-2 sm:gap-3 text-sm sm:text-base leading-relaxed">
          <div>
            <dt className="inline font-semibold text-neutral-950">Services: </dt>
            <dd className="inline text-neutral-400">
              {services.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 && ' · '}
                  <Link href={s.href} className={link}>
                    {s.title}
                  </Link>
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-neutral-950">Serving {qa.who} in </dt>
            <dd className="inline text-neutral-400">
              {CITIES.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && (i === CITIES.length - 1 ? ' and ' : ', ')}
                  <Link href={c.href} className={link}>
                    {c.city}
                  </Link>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
