// app/api/admin/onboarding/[token]/social/upload/route.ts
// Vercel Blob client uploads for reels. A route handler body is capped at
// 4.5 MB on Vercel, far below a reel, so the browser uploads straight to Blob
// (@vercel/blob/client upload()) and this route only issues the one-time
// client token, to an admin, for an AxeonGROWTH client, for a path under
// social/<onboarding id>/, MP4 or MOV, up to 300 MB. No onUploadCompleted is
// registered (the post row is created by the admin card after upload()
// resolves), so Blob never calls back and every request here is an admin's.
import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/adminAuth';
import { getOnboardingByToken } from '@/lib/onboarding';
import { metaUnavailable } from '@/lib/meta';
import { isBlobPathFor, REEL_CONTENT_TYPES, REEL_MAX_BYTES } from '@/lib/socialShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Video uploads need BLOB_READ_WRITE_TOKEN' }, { status: 503 });
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body || typeof body !== 'object' || body.type !== 'blob.generate-client-token') return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const onboarding = await getOnboardingByToken((await ctx.params).token).catch(() => null);
  if (!onboarding) return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
  if (onboarding.tier !== 'axeongrowth') return NextResponse.json({ error: 'Reels posting is part of AxeonGROWTH.' }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isBlobPathFor(onboarding.id, pathname)) throw new Error('Bad upload path');
        return { allowedContentTypes: [...REEL_CONTENT_TYPES], maximumSizeInBytes: REEL_MAX_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
  }
}
