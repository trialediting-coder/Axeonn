import type { MetadataRoute } from 'next';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { listPosts } from '@/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://axeonstudio.co';
  const staticRoutes = ['', '/solutions', '/marketing-solutions', '/pricing', '/why-axeon', '/work', '/process', '/about', '/faq', '/book', '/privacy', '/terms', '/insights'];

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
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/why-axeon' ? 0.9 : 0.8,
    })),
    ...niches.map((niche) => ({
      url: `${baseUrl}/solutions/${niche.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...marketingSolutions.map((solution) => ({
      url: `${baseUrl}/marketing-solutions/${solution.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
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
