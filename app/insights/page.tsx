import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listPosts, type Post } from '@/lib/posts';
import { PostCard } from '@/components/insights/PostCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd, JsonLd } from '@/components/common/JsonLd';
import { niches } from '@/data/nichesData';
import { ORG_ID, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/insights',
  title: 'Practice & Firm Marketing Guides, Des Moines | Axeon',
  description:
    'Plain-English guides for dental practices, med spas, law firms and CPA firms in Des Moines: local SEO, AI search, websites, ads and answering every inquiry.',
});

export const revalidate = 3600;

// Retired with the 2026-10-19 practice repositioning (301s to /work).
const RETIRED_SLUGS = new Set(['a-1-auto-detailing-website-case-study']);

// What the guides cover, each tied to the service page that does it for you.
const TOPICS = [
  {
    title: 'Getting found on Google and in AI answers',
    href: '/marketing-solutions/seo',
    link: 'Local SEO for practices and firms',
  },
  {
    title: 'Websites that turn visits into consultations',
    href: '/marketing-solutions/website',
    link: 'Practice and firm websites',
  },
  {
    title: 'Answering every call and inquiry first',
    href: '/marketing-solutions/lead-generation',
    link: 'Lead generation and 60-second intake',
  },
  {
    title: 'Ads you can trace to a booked visit',
    href: '/marketing-solutions/advertising',
    link: 'Google Ads and Local Services Ads',
  },
];

const NICHE_LABELS: Record<string, string> = {
  dental: 'dental practices',
  'med-spa': 'med spas',
  'law-firms': 'law firms',
  accounting: 'accounting and CPA firms',
};

export default async function InsightsPage() {
  // listPosts throws until the database is provisioned in an environment; the
  // page still renders its guide index and topic copy without it.
  let posts: Post[] = [];
  try {
    posts = (await listPosts({ status: 'published' })).filter((post) => !RETIRED_SLUGS.has(post.slug));
  } catch {
    posts = [];
  }

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/insights#blog`,
    name: 'Axeon Studio Insights',
    url: `${SITE_URL}/insights`,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
    ...(posts.length > 0
      ? {
          blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: `${SITE_URL}/insights/${post.slug}`,
            ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
          })),
        }
      : {}),
  };

  return (
    <main className="w-full pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Insights', path: '/insights' }]} />
      <JsonLd data={blogJsonLd} />
      <div className="max-w-6xl mx-auto">
        {/* Purpose: what these guides are, who they are for, in a few plain sentences. */}
        <section>
          <div className="eyebrow mb-3 sm:mb-4">INSIGHTS</div>
          <h1 className="text-[32px] sm:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08] mb-3 sm:mb-4 text-balance">
            Guides for practices and firms that want more patients and clients
          </h1>
          <p className="text-[15px] sm:text-lg text-neutral-600 max-w-3xl leading-snug sm:leading-relaxed">
            Plain-English guides for{' '}
            {niches.map((n, i) => (
              <span key={n.slug}>
                {i > 0 && (i === niches.length - 1 ? ' and ' : ', ')}
                <Link href={`/solutions/${n.slug}`} className="font-semibold text-blue-600 hover:underline">
                  {NICHE_LABELS[n.slug] ?? n.name}
                </Link>
              </span>
            ))}{' '}
            in the Des Moines metro. Every statistic links to its source.
          </p>
        </section>

        {/* Purpose: the four topics the guides cover, each linked to the service that does it. */}
        <section className="mt-8 sm:mt-16">
          <h2 className="text-[24px] sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-display mb-3 sm:mb-6">
            What the guides cover
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y divide-neutral-200 md:divide-y-0 border-y border-neutral-200 md:border-0 md:gap-y-8">
            {TOPICS.map((t) => (
              <li key={t.title} className="py-2.5 md:py-0">
                <h3 className="text-base sm:text-xl font-bold text-neutral-950 leading-snug">{t.title}</h3>
                <Link
                  href={t.href}
                  className="min-h-11 sm:min-h-0 sm:mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {t.link} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Purpose: the published guides. */}
        <section className="mt-10 sm:mt-16">
          <h2 className="text-[24px] sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-display mb-4 sm:mb-6">
            Latest guides
          </h2>
          {posts.length === 0 ? (
            <p className="text-neutral-600">
              New guides are on the way. Until then, the{' '}
              <Link href="/faq" className="font-semibold text-blue-600 hover:underline">
                FAQ
              </Link>{' '}
              answers the questions we hear most, and the{' '}
              <Link href="/pricing" className="font-semibold text-blue-600 hover:underline">
                pricing page
              </Link>{' '}
              shows every plan.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Purpose: the next step for a reader who wants this done for them. */}
        <section className="mt-12 sm:mt-20 rounded-[28px] bg-neutral-950 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Want more patients and clients? Start with your area.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-400">
              One practice or firm per specialty within 5 miles. $0 to start. Nothing due until it&apos;s working.
            </p>
          </div>
          <Link
            href="/check-your-area"
            className="inline-flex items-center justify-center shrink-0 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
          >
            Check if your area is open
          </Link>
        </section>
      </div>
    </main>
  );
}
