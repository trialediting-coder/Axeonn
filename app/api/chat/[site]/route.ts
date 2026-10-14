// app/api/chat/[site]/route.ts
// Public: the website chat on a client's site (public/chat.js).
//   GET   { enabled, greeting, business }   whether to draw the bubble
//   POST  { session, message, page }        one turn → { session, reply, choices }
// CORS-open, an in-memory flood limit per IP, and the hard limits in lib/chat.ts
// (per session, per site per hour and per day, across all sites per hour).
// Plan gate (ruling S5-R12): publicClient (lib/publicSite.ts) returns null for
// Essentials, as it does for an unknown, malformed or closed site, so Essentials
// gets { enabled: false } on GET and a 404 on POST, server-side, before anything else.
import { after } from 'next/server';
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { corsJson, corsPreflight, publicClient, readJsonBody } from '@/lib/publicSite';
import { chatPublicConfig, handleChatTurn, limitReply } from '@/lib/chat';
import { sanitizeVisitorText } from '@/lib/chatShared';
import { monthOf, visitorHash } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A turn's model calls end inside CHAT_TURN_BUDGET_MS (45 s, lib/chatShared.ts), leaving room for the writes.
export const maxDuration = 60;

type Ctx = { params: Promise<{ site: string }> };

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const onboarding = await publicClient((await ctx.params).site);
    if (!onboarding) return corsJson({ enabled: false });
    const config = await chatPublicConfig(onboarding);
    return corsJson(config.enabled ? config : { enabled: false });
  } catch (err) {
    console.error('[chat] config', err instanceof Error ? err.message : err);
    return corsJson({ enabled: false });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const ip = clientIp(req);
    if (rateLimited(`chat:${ip}`, 20, 60_000)) return corsJson({ error: 'You are sending messages too fast. Please wait a moment.' }, 429);
    const site = (await ctx.params).site;
    const onboarding = await publicClient(site);
    if (!onboarding) return corsJson({ error: 'Chat is not available.' }, 404);
    const body = await readJsonBody(req);
    const message = sanitizeVisitorText(body?.message);
    if (!body || !message) return corsJson({ error: 'Type a message first.' }, 400);
    const secret = process.env.TRACKING_SALT || process.env.AUTH_SECRET || '';
    const result = await handleChatTurn({
      onboarding,
      siteKey: site,
      sessionId: typeof body.session === 'string' ? body.session : null,
      message,
      visitor: visitorHash(ip, req.headers.get('user-agent') ?? '', monthOf(), secret),
      ip,
      page: typeof body.page === 'string' ? body.page.slice(0, 300) : null,
      defer: (task) => after(task),
    });
    if (result.ok) return corsJson({ session: result.session, reply: result.reply, choices: result.choices });
    if (result.reason === 'off') return corsJson({ error: 'Chat is not available.' }, 404);
    if (result.reason === 'limit_session') {
      const reply = await limitReply(onboarding).catch(() => 'This chat has reached its limit. Please call us and we’ll pick it up from there.');
      return corsJson({ session: result.session, reply, choices: [] });
    }
    // limit_site (this site's hour) and limit_spend (this site's day, or every site's hour): no model call ran.
    return corsJson({ session: result.session, error: 'Chat is busy right now. Please call, or use the form on this page.' }, 429);
  } catch (err) {
    console.error('[chat] turn', err instanceof Error ? err.message : err);
    return corsJson({ error: 'Chat is not reachable right now. Please call instead.' }, 500);
  }
}
