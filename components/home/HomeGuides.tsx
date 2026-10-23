import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listPosts, RETIRED_POST_SLUGS, type Post } from '@/lib/posts';

// Three latest guides above the footer (layout 2026-10-22): a small strip for
// search and the curious, not a full section that pushes pricing down.
export async function HomeGuides() {
  // listPosts throws until the database is provisioned in an environment.
  let posts: Post[] = [];
  try {
    posts = (await listPosts({ status: 'published' }))
      .filter((post) => !RETIRED_POST_SLUGS.has(post.slug))
      .slice(0, 3);
  } catch {
    posts = [];
  }
  if (posts.length === 0) return null;

  // Purpose: a way into the guides for visitors who want to read more first.
  return (
    <section id="guides" aria-labelledby="home-guides-heading" className="w-full py-12 sm:py-16 px-4 sm:px-10 lg:px-16 xl:px-24 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="home-guides-heading" className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950">
            Guides for practice and firm owners
          </h2>
          <Link href="/insights" className="shrink-0 inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-blue-600 hover:text-blue-700">
            All guides <ArrowRight size={16} />
          </Link>
        </div>
        <ul className="mt-5 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/insights/${post.slug}`}
                className="group block h-full rounded-2xl border border-neutral-200 hover:border-neutral-300 p-5 sm:p-6 transition-colors"
              >
                <span className="block font-bold text-neutral-950 group-hover:text-blue-600 transition-colors leading-snug">{post.title}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500">
                  Read <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
