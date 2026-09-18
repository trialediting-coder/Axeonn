// app/api/cron/publish-scheduled/route.ts
import { NextResponse } from 'next/server';
import { publishDuePosts } from '@/lib/posts';

// Vercel Cron invokes the configured path with an HTTP GET request (see
// https://vercel.com/docs/cron-jobs: "Vercel makes an HTTP GET request").
// A route that only exported POST would 405 on every real invocation and
// this cron would silently never run. POST is kept too so the endpoint can
// still be triggered manually/for testing the same way the brief's sample
// (and the generate-post cron) does.
async function handlePublishDue(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publishedCount = await publishDuePosts();
  return NextResponse.json({ published: publishedCount });
}

export async function GET(req: Request) {
  return handlePublishDue(req);
}

export async function POST(req: Request) {
  return handlePublishDue(req);
}
