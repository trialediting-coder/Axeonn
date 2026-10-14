// app/b/[site]/cancel/[token]/route.ts
// The cancel link in the confirmation text and email. GET only shows what will be
// cancelled and a button: phones and chat apps open links to build previews, and
// a preview must never cancel anyone's booking. POST (the button) cancels. The
// token must belong to the site in the URL.
import { after } from 'next/server';
import { afterCancel, bookingByToken, bookingTimeZone, cancelBooking } from '@/lib/bookings';
import { BOOKING_PAGE_CSP, renderCancelPage, type CancelView } from '@/lib/bookingPage';
import { formatSlotLabel } from '@/lib/bookingShared';
import { getOnboardingById } from '@/lib/onboarding';
import { isValidSiteKey, onboardingIdForSiteKey } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ site: string; token: string }> };

const page = (view: CancelView, status = 200) =>
  new Response(renderCancelPage(view), {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': BOOKING_PAGE_CSP, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

async function load(site: string, token: string) {
  if (!isValidSiteKey(site)) return null;
  const booking = await bookingByToken(token);
  if (!booking || (await onboardingIdForSiteKey(site)) !== booking.onboardingId) return null;
  const onboarding = await getOnboardingById(booking.onboardingId);
  if (!onboarding) return null;
  const timeZone = await bookingTimeZone(onboarding.id);
  return { booking, onboarding, timeZone, when: formatSlotLabel(booking, timeZone), business: onboarding.businessName?.trim() || 'the business' };
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { site, token } = await ctx.params;
    const found = await load(site, token);
    if (!found) return page({ state: 'not_found' }, 404);
    const { booking, when, business } = found;
    if (booking.status === 'cancelled') return page({ state: 'already' });
    if (booking.status !== 'booked' || Date.parse(booking.startsAt) <= Date.now()) return page({ state: 'past' });
    return page({ state: 'confirm', business, when, service: booking.service, action: `/b/${site}/cancel/${token}` });
  } catch (err) {
    console.error('[b] cancel view', err instanceof Error ? err.message : err);
    return page({ state: 'not_found' }, 500);
  }
}

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { site, token } = await ctx.params;
    const found = await load(site, token);
    if (!found) return page({ state: 'not_found' }, 404);
    const result = await cancelBooking(token);
    if (!result.ok) return page({ state: result.reason });
    const { onboarding, timeZone, when, business } = found;
    after(() => afterCancel(onboarding, result.booking, timeZone, 'customer'));
    return page({ state: 'cancelled', business, when });
  } catch (err) {
    console.error('[b] cancel', err instanceof Error ? err.message : err);
    return page({ state: 'not_found' }, 500);
  }
}
