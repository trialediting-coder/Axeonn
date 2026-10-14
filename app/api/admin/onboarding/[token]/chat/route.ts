// app/api/admin/onboarding/[token]/chat/route.ts
// Admin-only: a client's website chat (lib/chat.ts, lib/chatCrawl.ts).
//   GET                               settings, saved pages, last 20 transcripts, site key
//   PUT  { enabled, greeting }
//   POST { action: 'train', url? }    crawl the site (default: the tracked site URL) into site_pages
// PUT and POST refuse plans without the chat (Essentials, ruling S5-R12); GET still shows the data.
// One crawl at a time per client (crawlSite's 60-second claim).
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { adminChatData, saveChatSettings } from '@/lib/chat';
import { crawlSite } from '@/lib/chatCrawl';
import { validateChatSettings } from '@/lib/chatShared';
import { getTrackingSettings, validateSiteUrl } from '@/lib/siteStats';
import { PLAN_REFUSAL, bookingChatIncluded } from '@/lib/publicSite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A crawl may take up to its 40-second budget (CRAWL_BUDGET_MS), plus one batched write.
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string }> };

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

/** For writes: the client, only when their plan includes the chat. */
async function loadIncluded(token: string) {
  const onboarding = await load(token);
  if (!bookingChatIncluded(onboarding.tier)) throw new Error(PLAN_REFUSAL);
  return onboarding;
}

export async function GET(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await adminChatData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await loadIncluded((await ctx.params).token);
    await saveChatSettings(onboarding.id, validateChatSettings(await readBody(req)));
    return NextResponse.json(await adminChatData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await loadIncluded((await ctx.params).token);
    const body = await readBody(req);
    if (body.action !== 'train') throw new Error('Unknown action');
    const typed = typeof body.url === 'string' && body.url.trim() ? validateSiteUrl(body.url) : null;
    const url = typed ?? (await getTrackingSettings(onboarding.id)).siteUrl;
    if (!url) throw new Error('Enter the client’s website address first');
    const crawl = await crawlSite(onboarding.id, url);
    return NextResponse.json({ ...(await adminChatData(onboarding.id)), crawl });
  } catch (err) {
    return jsonError(err);
  }
}
