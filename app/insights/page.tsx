import { listPosts, type Post } from '@/lib/posts';
import { PostCard } from '@/components/insights/PostCard';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/insights',
  title: 'Insights | Axeon Studio',
  description: 'Practical guidance on web systems, SEO/AEO, and lead capture for local service businesses, from Axeon Studio.',
});

export const revalidate = 3600;

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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          Axeon Studio Insights
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Practical guidance on web systems, search visibility, and lead capture for local service businesses.
        </p>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts published yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
