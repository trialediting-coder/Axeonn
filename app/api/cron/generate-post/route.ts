// app/api/cron/generate-post/route.ts
import { NextResponse } from 'next/server';
import { generatePost, critiquePost } from '@/lib/anthropic';
import { validatePost } from '@/lib/postValidation';
import { createPost, listPosts, slugify } from '@/lib/posts';
import { sendScheduledNotification, sendFailedGenerationNotification } from '@/lib/email';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingPosts = await listPosts();
    const priorTitles = existingPosts.map((p) => p.title);

    const generated = await generatePost(priorTitles);

    const structuralResult = validatePost({
      title: generated.title,
      content: generated.content,
      sources: generated.sources,
    });

    const critiqueResult = structuralResult.passed
      ? await critiquePost(generated)
      : { passed: false, reasons: [] };

    const allReasons = [...structuralResult.reasons, ...critiqueResult.reasons];
    const passed = structuralResult.passed && critiqueResult.passed;

    const slug = generated.slug || slugify(generated.title);

    if (passed) {
      const post = await createPost({
        slug,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        status: 'scheduled',
        author: 'ai',
        nicheTags: generated.nicheTags,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        coverImageUrl: null,
        coverImageAlt: null,
        faqItems: generated.faqItems,
        sources: generated.sources,
        scheduledPublishAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: null,
      });
      await sendScheduledNotification({ title: post.title, slug: post.slug, id: post.id });
      return NextResponse.json({ status: 'scheduled', postId: post.id });
    }

    // Fail-safe: never scheduled/published on failure — always draft.
    const post = await createPost({
      slug,
      title: generated.title,
      excerpt: generated.excerpt,
      content: generated.content,
      status: 'draft',
      author: 'ai',
      nicheTags: generated.nicheTags,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      coverImageUrl: null,
      coverImageAlt: null,
      faqItems: generated.faqItems,
      sources: generated.sources,
      scheduledPublishAt: null,
      publishedAt: null,
    });
    await sendFailedGenerationNotification(allReasons);
    return NextResponse.json({ status: 'draft', postId: post.id, reasons: allReasons });
  } catch (error) {
    // Fail-safe: if generatePost/critiquePost throws (model never submitted,
    // or the underlying Anthropic API call failed), no draft can be built
    // from a `generated` object that never came back — but silently
    // returning a bare 500 would defeat the whole point of this pipeline
    // ("nothing goes live unattended, but Hayder can look at it if
    // curious"). Send the safety-net email instead.
    const message = error instanceof Error ? error.message : String(error);
    await sendFailedGenerationNotification([
      `Weekly generation threw an unhandled error: ${message}`,
    ]);
    return NextResponse.json({ error: 'Generation failed', message }, { status: 500 });
  }
}
