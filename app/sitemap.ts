import type { MetadataRoute } from 'next';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://axeonstudio.co';
  const staticRoutes = ['', '/solutions', '/marketing-solutions', '/pricing', '/why-axeon', '/work', '/process', '/about', '/faq', '/book', '/privacy', '/terms'];

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
  ];
}
