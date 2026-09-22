import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getPostBySlug, listPosts } from '@/lib/posts';
import { niches } from '@/data/nichesData';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { FOUNDER, FOUNDER_ID, ORG_ID, SITE_URL } from '@/lib/seo';

// Matches /insights's own revalidate window -- without this the route has
// no revalidate and no generateStaticParams, so it fully re-queries Postgres
// on every single request, including every crawler hit.
export const revalidate = 3600;

// A literal "</script>" inside JSON.stringify output would break out of the
// script tag. Content here can include fragments of web-search results
// (see lib/anthropic.ts), not just the model's own synthesis, so this isn't
// purely defensive boilerplate.
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') return {};
  return buildMetadata({
    path: `/insights/${post.slug}`,
    title: post.metaTitle ?? `${post.title} | Axeon Studio`,
    description: post.metaDescription ?? post.excerpt,
  });
}

export default async function InsightPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') notFound();

  const allPublished = await listPosts({ status: 'published' });
  const related = allPublished
    .filter((p) => p.id !== post.id && p.nicheTags.some((t) => post.nicheTags.includes(t)))
    .slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    // A named human author (with a profile page and social proof) is an
    // E-E-A-T signal; an anonymous "Organization" author is not.
    author: {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: FOUNDER.name,
      jobTitle: FOUNDER.jobTitle,
      url: `${SITE_URL}/about`,
      sameAs: FOUNDER.sameAs,
    },
    publisher: {
      '@id': ORG_ID,
      '@type': 'Organization',
      name: 'Axeon Studio',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: `${SITE_URL}/insights/${post.slug}`,
    inLanguage: 'en-US',
  };

  const faqJsonLd =
    post.faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;

  const nicheLookup = new Map(niches.map((n) => [n.slug, n.name]));

  return (
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Insights', path: '/insights' },
          { name: post.title, path: `/insights/${post.slug}` },
        ]}
      />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      )}
      <article className="max-w-3xl mx-auto">
        <nav className="text-sm text-neutral-500 mb-6">
          <Link href="/insights" className="hover:text-blue-600">Insights</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{post.title}</span>
        </nav>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          {post.title}
        </h1>
        <p className="text-sm text-neutral-400 mb-8">
          <Link href="/about" className="text-neutral-600 font-medium hover:text-blue-600">
            {FOUNDER.name}
          </Link>
          {' · Founder, Axeon Studio'}
          {post.publishedAt && (
            <>
              {' · '}
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </>
          )}
        </p>
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ''}
            loading="eager"
            decoding="async"
            className="w-full rounded-2xl mb-10 aspect-[16/9] object-cover"
          />
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.faqItems.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-950 mb-6">Common Questions</h2>
            <div className="flex flex-col gap-6">
              {post.faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-neutral-900 mb-1">{item.question}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {post.sources.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-950 mb-6">Sources</h2>
            <ul className="flex flex-col gap-2 text-sm text-neutral-600">
              {post.sources.map((source, i) => (
                <li key={i}>
                  {source.claim}{' '}
                  <a href={source.url} target="_blank" rel="noreferrer nofollow" className="text-blue-600 hover:underline break-all">
                    {source.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-950 mb-6">Related</h2>
            <ul className="flex flex-col gap-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/insights/${r.slug}`} className="text-blue-600 hover:underline font-medium">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {post.nicheTags.length > 0 && (
          <p className="mt-10 text-sm text-neutral-500">
            Related industries:{' '}
            {post.nicheTags.map((tag, i) => (
              <span key={tag}>
                {i > 0 && ', '}
                <Link href={`/solutions/${tag}`} className="text-blue-600 hover:underline">
                  {nicheLookup.get(tag) ?? tag}
                </Link>
              </span>
            ))}
          </p>
        )}
      </article>
    </main>
  );
}
