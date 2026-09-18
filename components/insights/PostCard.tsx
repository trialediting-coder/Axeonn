import Link from 'next/link';
import type { Post } from '@/lib/posts';

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/insights/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
    >
      {post.coverImageUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ''}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6 flex flex-col gap-3">
        {post.nicheTags[0] && (
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-600">
            {post.nicheTags[0]}
          </span>
        )}
        <h2 className="text-xl font-bold text-neutral-950 leading-snug group-hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="text-xs text-neutral-400 mt-1">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        )}
      </div>
    </Link>
  );
}
