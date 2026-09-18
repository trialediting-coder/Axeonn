// app/api/cron/generate-post/route.ts
import { NextResponse } from 'next/server';
import { generatePost, critiquePost } from '@/lib/anthropic';
import { validatePost } from '@/lib/postValidation';
import { createPost, listPosts, slugify } from '@/lib/posts';
import { sendScheduledNotification, sendFailedGenerationNotification } from '@/lib/email';
import { niches } from '@/data/nichesData';

const VALID_NICHE_SLUGS = new Set(niches.map((n) => n.slug));

// A notification failure must never look like the underlying post outcome —
// e.g. a real scheduled post must not be followed by an email claiming
// nothing was scheduled. Log and swallow instead of letting it fall into the
// route's outer catch, which would send a misleading "draft" notification
// over a post that already made it into the DB.
async function notifySafely(send: () => Promise<void>): Promise<void> {
  try {
    await send();
  } catch (error) {
    console.error('generate-post: notification send failed', error);
  }
}

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
    // The model is only instructed (not enforced) to use real niche slugs —
    // filter out any hallucinated value before it reaches the DB and, from
    // there, a public "Related industries" link that would 404.
    const nicheTags = generated.nicheTags.filter((t) => VALID_NICHE_SLUGS.has(t));

    if (passed) {
      const post = await createPost({
        slug,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        status: 'scheduled',
        author: 'ai',
        nicheTags,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        coverImageUrl: null,
        coverImageAlt: null,
        faqItems: generated.faqItems,
        sources: generated.sources,
        scheduledPublishAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: null,
      });
      await notifySafely(() => sendScheduledNotification({ title: post.title, slug: post.slug, id: post.id }));
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
      nicheTags,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      coverImageUrl: null,
      coverImageAlt: null,
      faqItems: generated.faqItems,
      sources: generated.sources,
      scheduledPublishAt: null,
      publishedAt: null,
    });
    await notifySafely(() => sendFailedGenerationNotification(allReasons));
    return NextResponse.json({ status: 'draft', postId: post.id, reasons: allReasons });
  } catch (error) {
    // Fail-safe: if generatePost/critiquePost throws (model never submitted,
    // or the underlying Anthropic API call failed), no draft can be built
    // from a `generated` object that never came back — but silently
    // returning a bare 500 would defeat the whole point of this pipeline
    // ("nothing goes live unattended, but Hayder can look at it if
    // curious"). Send the safety-net email instead.
    const message = error instanceof Error ? error.message : String(error);
    await notifySafely(() =>
      sendFailedGenerationNotification([`Weekly generation threw an unhandled error: ${message}`])
    );
    return NextResponse.json({ error: 'Generation failed', message }, { status: 500 });
  }
}
