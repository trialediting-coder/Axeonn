// app/api/admin/onboarding/[token]/social/route.ts
// Admin-only, AxeonGROWTH only: the client's reels (lib/social.ts).
//   GET                                                       { posts }
//   POST  { platforms, videoUrl, caption, scheduledAt|null }  create (draft when no time)
//   PATCH { id, scheduledAt }                                 schedule a draft / retry a failed one
//   DELETE { id }                                             delete a post that has not gone out
// The video itself is uploaded from the browser straight to Vercel Blob via ./upload.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { metaUnavailable } from '@/lib/meta';
import { assertGrowth, createSocialPosts, deleteSocialPost, listSocialPosts, scheduleSocialPost } from '@/lib/social';
import { validateSocialInput } from '@/lib/socialShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  assertGrowth(onboarding);
  return onboarding;
}

async function guard(req: Request): Promise<Response | null> {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return metaUnavailable();
}

const id = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error('Unknown post');
  return n;
};

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json({ posts: await listSocialPosts(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  try {
    const onboarding = await load((await ctx.params).token);
    await createSocialPosts(onboarding, validateSocialInput(await readBody(req), onboarding.id));
    return NextResponse.json({ posts: await listSocialPosts(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    await scheduleSocialPost(onboarding.id, id(body.id), body.scheduledAt);
    return NextResponse.json({ posts: await listSocialPosts(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    await deleteSocialPost(onboarding.id, id(body.id));
    return NextResponse.json({ posts: await listSocialPosts(onboarding.id) });
  } catch (err) {
    return jsonError(err);
  }
}
