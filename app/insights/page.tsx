import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listPosts, type Post } from '@/lib/posts';
import { PostCard } from '@/components/insights/PostCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/insights',
  title: 'Insights: Local Marketing & Lead Generation Guides | Axeon',
  description: 'Practical guides to getting more calls, leads, and customers for local service businesses: SEO, AI search, websites, and lead follow-up.',
});

export const revalidate = 3600;

const CASE_STUDY_SLUG = 'a-1-auto-detailing-website-case-study';

export default async function InsightsPage() {
  // TODO: remove this try/catch once the live Vercel Postgres database is
  // provisioned (Task 1's manual DB setup). Until then, listPosts throws a
  // connection error, so we fall back to an empty array to keep the build
  // and page render working.
  let posts: Post[] = [];
  try {
    posts = await listPosts({ status: 'published' });
  } catch {
    posts = [];
  }

  return (
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Insights', path: '/insights' }]} />
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
          [ INSIGHTS ]
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08] mb-4">
          Axeon Studio Insights
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Practical guides to getting more calls, leads, and customers for local service businesses.
        </p>
        {/* The one client case study leads the page, ahead of the guides. */}
        <Link
          href={`/insights/${CASE_STUDY_SLUG}`}
          className="group mb-14 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end rounded-[28px] sm:rounded-[36px] bg-neutral-950 text-white p-6 sm:p-10 lg:p-14"
        >
          <span className="lg:col-span-4 block text-[100px] sm:text-[150px] lg:text-[170px] leading-[0.82] font-black font-display tracking-tighter text-blue-500">
            #1
          </span>
          <span className="lg:col-span-8 block">
            <span className="block text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
              [ CASE STUDY · A-1 AUTO DETAILING ]
            </span>
            <span className="mt-3 block text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.08]">
              How A-1 went from page 2 to #1
            </span>
            <span className="mt-3 block text-base sm:text-lg text-neutral-400 leading-relaxed">
              Now #1 on Google for &ldquo;Pleasant Hill auto detailing,&rdquo; up from page 2.
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-blue-300 group-hover:text-white transition-colors">
              Read the case study <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </span>
        </Link>

        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts published yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.filter((post) => post.slug !== CASE_STUDY_SLUG).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-20 rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Want results like A-1&apos;s? Book a free call.
          </h2>
          <Link
            href="/book"
            className="inline-flex items-center justify-center shrink-0 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
          >
            Book My Free Call
          </Link>
        </div>
      </div>
    </main>
  );
}
