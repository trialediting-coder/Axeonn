// Public: the open times for a client's online booking. Called by the hosted page
// (/b/<site>) and anything else that wants them. Only open slots ever leave here;
// an unknown, closed or switched-off site gets the same { open: false }.
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { corsJson, corsPreflight, publicClient } from '@/lib/publicSite';
import { openSlots } from '@/lib/bookings';
import { MAX_QUERY_DAYS } from '@/lib/bookingShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const CLOSED = { open: false, slots: [] };

const parseTime = (v: string | null): number | null => {
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request, ctx: { params: Promise<{ site: string }> }) {
  try {
    if (rateLimited(`book-slots:${clientIp(req)}`, 60, 60_000)) return corsJson({ ...CLOSED, error: 'Too many requests' }, 429);
    const onboarding = await publicClient((await ctx.params).site);
    if (!onboarding) return corsJson(CLOSED);
    const url = new URL(req.url);
    const from = parseTime(url.searchParams.get('from')) ?? Date.now();
    const to = Math.min(parseTime(url.searchParams.get('to')) ?? from + 14 * DAY, from + MAX_QUERY_DAYS * DAY);
    const { settings, timeZone, slots } = await openSlots(onboarding.id, { from: new Date(from).toISOString(), to: new Date(to).toISOString() });
    if (!settings.enabled) return corsJson(CLOSED);
    return corsJson({ open: true, timeZone, services: settings.serviceNames, slotMinutes: settings.slotMinutes, slots });
  } catch (err) {
    console.error('[book] slots', err instanceof Error ? err.message : err);
    return corsJson({ ...CLOSED, error: 'Something went wrong' }, 500);
  }
}
