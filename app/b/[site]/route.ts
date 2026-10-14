// app/b/[site]/route.ts
// The hosted booking page, https://axeonstudio.co/b/<site>. A route handler that
// returns its own HTML (lib/bookingPage.ts) instead of an app/ page, so the root
// layout's chrome and tracking never load on a client's customer. ?embed=1 is
// what public/book.js frames: no header, and the page reports its height.
import { publicClient } from '@/lib/publicSite';
import { bookingTimeZone, getBookingSettings } from '@/lib/bookings';
import { BOOKING_PAGE_CSP, renderBookingPage, renderNoticePage } from '@/lib/bookingPage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': BOOKING_PAGE_CSP, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

export async function GET(req: Request, ctx: { params: Promise<{ site: string }> }) {
  const embed = new URL(req.url).searchParams.get('embed') === '1';
  try {
    const site = (await ctx.params).site;
    const onboarding = await publicClient(site);
    const settings = onboarding ? await getBookingSettings(onboarding.id) : null;
    if (!onboarding || !settings?.enabled) {
      return html(renderNoticePage({ title: 'Online booking', message: "Online booking isn't available here right now. Please call to book.", embed }), 404);
    }
    const timeZone = await bookingTimeZone(onboarding.id);
    return html(renderBookingPage({ site, api: `/api/book/${site}`, business: onboarding.businessName?.trim() || 'Book online', services: settings.serviceNames, timeZone, embed }));
  } catch (err) {
    console.error('[b] page', err instanceof Error ? err.message : err);
    return html(renderNoticePage({ title: 'Online booking', message: 'Something went wrong. Please try again in a minute, or call to book.', embed }), 500);
  }
}
