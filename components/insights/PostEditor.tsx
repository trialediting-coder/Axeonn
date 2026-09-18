'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { niches } from '@/data/nichesData';
import { slugify, type Post } from '@/lib/posts';

interface PostEditorProps {
  initialPost?: Post;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initialPost);
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [content, setContent] = useState(initialPost?.content ?? '');
  const [metaTitle, setMetaTitle] = useState(initialPost?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initialPost?.metaDescription ?? '');
  const [nicheTags, setNicheTags] = useState<string[]>(initialPost?.nicheTags ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl ?? '');
  const [coverImageAlt, setCoverImageAlt] = useState(initialPost?.coverImageAlt ?? '');
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>(initialPost?.faqItems ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFaqItem(index: number, field: 'question' | 'answer', value: string) {
    setFaqItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function save(status: 'draft' | 'scheduled' | 'published') {
    setSaving(true);
    setError(null);

    const scheduledPublishAt =
      status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    const body = {
      slug,
      title,
      excerpt,
      content,
      status,
      author: initialPost?.author ?? 'human',
      nicheTags,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      coverImageUrl: coverImageUrl || null,
      coverImageAlt: coverImageAlt || null,
      faqItems: faqItems.filter((item) => item.question.trim() && item.answer.trim()),
      sources: initialPost?.sources ?? [],
      scheduledPublishAt,
      publishedAt: status === 'published' ? new Date().toISOString() : (initialPost?.publishedAt ?? null),
    };

    const res = await fetch(initialPost ? `/api/admin/posts/${initialPost.id}` : '/api/admin/posts', {
      method: initialPost ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      router.push('/insights/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save post.');
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Content (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta title</label>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Niche tags</label>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => {
              const active = nicheTags.includes(niche.slug);
              return (
                <button
                  key={niche.slug}
                  type="button"
                  onClick={() =>
                    setNicheTags((prev) =>
                      active ? prev.filter((t) => t !== niche.slug) : [...prev, niche.slug]
                    )
                  }
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                    active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-600 border-neutral-300'
                  }`}
                >
                  {niche.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Cover image URL</label>
            <input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Cover image alt text</label>
            <input
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-700">FAQ items</label>
            <button
              type="button"
              onClick={() => setFaqItems((prev) => [...prev, { question: '', answer: '' }])}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              + Add question
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={item.question}
                    onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                    placeholder="Question"
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setFaqItems((prev) => prev.filter((_, j) => j !== i))}
                    className="text-xs text-red-600 hover:underline cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={item.answer}
                  onChange={(e) => updateFaqItem(i, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            disabled={saving}
            onClick={() => save('draft')}
            className="px-4 py-2 rounded-full border border-neutral-300 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Save Draft
          </button>
          <button
            disabled={saving}
            onClick={() => save('scheduled')}
            className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Schedule (+24h)
          </button>
          <button
            disabled={saving}
            onClick={() => save('published')}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Publish Now
          </button>
        </div>
      </div>
      <div className="border border-neutral-200 rounded-2xl p-6 bg-white overflow-y-auto max-h-[80vh]">
        <p className="text-xs font-mono uppercase text-neutral-400 mb-4">Preview</p>
        <div className="prose prose-neutral max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview yet.*'}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
