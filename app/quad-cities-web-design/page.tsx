import { buildMetadata } from '@/lib/metadata';
import { CityLanding } from '@/components/city/CityLanding';
import { cityPageBySlug } from '@/data/cityPages';

// Copy lives in data/cityPages.ts (iowaCityPages); layout in components/city/CityLanding.tsx.
const page = cityPageBySlug('quad-cities-web-design')!;

export const metadata = buildMetadata({
  path: `/${page.slug}`,
  title: page.title,
  description: page.description,
});

export default function QuadCitiesWebDesignPage() {
  return <CityLanding page={page} />;
}
