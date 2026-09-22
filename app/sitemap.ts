import type { MetadataRoute } from 'next';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { listPosts } from '@/lib/posts';
import { CONTENT_LAST_UPDATED } from '@/lib/seo';

// Without this, Next prerenders the sitemap once at build time and freezes
// it -- a post published hours later by the weekly cron would never appear
// in sitemap.xml until the next manual redeploy. Matches /insights's own
// revalidate window.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://axeonstudio.co';
  const staticRoutes = ['', '/des-moines-web-design', '/solutions', '/marketing-solutions', '/pricing', '/why-axeon', '/work', '/process', '/about', '/faq', '/book', '/privacy', '/terms', '/insights'];
  // Static routes carry a fixed content date (bumped in lib/seo.ts when copy
  // changes). Stamping `new Date()` on every request told Google that all 29
  // URLs changed every hour, which trains it to ignore <lastmod> entirely.
  const staticLastModified = CONTENT_LAST_UPDATED;

  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  try {
    posts = await listPosts({ status: 'published' });
  } catch {
    // Database not provisioned yet in this environment — sitemap still
    // generates correctly for every other route.
    posts = [];
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: staticLastModified,
      changeFrequency: route === '/insights' ? ('weekly' as const) : ('monthly' as const),
      priority:
        route === ''
          ? 1.0
          : route === '/why-axeon' || route === '/des-moines-web-design' || route === '/pricing'
            ? 0.9
            : 0.8,
    })),
    ...niches.map((niche) => ({
      url: `${baseUrl}/solutions/${niche.slug}`,
      lastModified: staticLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...marketingSolutions.map((solution) => ({
      url: `${baseUrl}/marketing-solutions/${solution.id}`,
      lastModified: staticLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/insights/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
