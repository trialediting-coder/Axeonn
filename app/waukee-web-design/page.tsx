import { buildMetadata } from '@/lib/metadata';
import { CityLanding } from '@/components/city/CityLanding';
import { cityPageBySlug } from '@/data/cityPages';

// Copy lives in data/cityPages.ts; layout in components/city/CityLanding.tsx.
const page = cityPageBySlug('waukee-web-design')!;

export const metadata = buildMetadata({
  path: `/${page.slug}`,
  title: page.title,
  description: page.description,
});

export default function WaukeeWebDesignPage() {
  return <CityLanding page={page} />;
}
