// app/api/t/route.ts
// Public collector for client-site tracking (public/t.js). Browsers on the
// clients' own domains post here, so it answers CORS for any origin, always
// with 204, and never says whether a key was known: a wrong key is just dropped.
// Validation and hashing live in lib/siteStats.ts.
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { looksLikeBot, monthOf, onboardingIdForSiteKey, parseTrackingEvent, recordEvent, visitorHash } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'cache-control': 'no-store',
};

const done = () => new Response(null, { status: 204, headers: CORS });

const MAX_BODY = 2048;
// One busy visitor clicks a few dozen times a minute at most; this only stops floods.
const MAX_PER_MINUTE = 120;

export async function OPTIONS() {
  return done();
}

export async function POST(req: Request) {
  try {
    const secret = process.env.TRACKING_SALT || process.env.AUTH_SECRET;
    if (!secret) return done();
    const ua = req.headers.get('user-agent');
    if (looksLikeBot(ua)) return done();
    const ip = clientIp(req);
    if (rateLimited(`t:${ip}`, MAX_PER_MINUTE, 60_000)) return done();

    const text = await req.text();
    if (!text || text.length > MAX_BODY) return done();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return done();
    }
    const event = parseTrackingEvent(raw);
    if (!event) return done();
    const onboardingId = await onboardingIdForSiteKey(event.siteKey);
    if (!onboardingId) return done();

    await recordEvent(onboardingId, event, visitorHash(ip, ua ?? '', monthOf(), secret));
  } catch (err) {
    console.error('[t] drop', err instanceof Error ? err.message : err);
  }
  return done();
}
