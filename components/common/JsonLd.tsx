import { breadcrumbJsonLd, type BreadcrumbItem } from '@/lib/seo';

// A literal "</script>" inside serialized JSON would break out of the tag;
// escape "<" the same way app/insights/[slug]/page.tsx does.
function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}

/** BreadcrumbList for an interior page. Pass the trail *below* Home. */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return <JsonLd data={breadcrumbJsonLd(items)} />;
}
