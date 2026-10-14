// Public: book one open time. Phone required (US only); the time must be one the
// slot engine offers right now. The row is written before the reply; the text,
// email, reminders, inbox row and owner alert run after it (afterBooking).
import { after } from 'next/server';
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { corsJson, corsPreflight, publicClient, readJsonBody } from '@/lib/publicSite';
import { afterBooking, cancelUrl, createBooking, getBookingSettings } from '@/lib/bookings';
import { BookingError, formatSlotLabel, parseBookingInput, type BookingInput } from '@/lib/bookingShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNAVAILABLE = 'Online booking is not available right now. Please call instead.';
const REFUSALS = {
  taken: 'That time was just taken. Please pick another.',
  limit: 'You already have three upcoming bookings with us. Please call to change one.',
  closed: UNAVAILABLE,
} as const;

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request, ctx: { params: Promise<{ site: string }> }) {
  try {
    if (rateLimited(`book:${clientIp(req)}`, 5, 10 * 60_000)) return corsJson({ ok: false, error: 'Too many tries. Please wait a few minutes or call us.' }, 429);
    const site = (await ctx.params).site;
    const body = await readJsonBody(req);
    if (!body) return corsJson({ ok: false, error: 'Please fill in the form.' }, 400);
    // The honeypot: people never see this field, bots fill it. They get a quiet "ok" and nothing is written.
    if (typeof body.company_website === 'string' && body.company_website.trim()) return corsJson({ ok: true, when: '', service: '', cancelUrl: '' });

    const onboarding = await publicClient(site);
    const settings = onboarding ? await getBookingSettings(onboarding.id) : null;
    if (!onboarding || !settings?.enabled) return corsJson({ ok: false, error: UNAVAILABLE }, 404);

    let input: BookingInput;
    try {
      input = parseBookingInput(body, settings.serviceNames);
    } catch (err) {
      if (err instanceof BookingError) return corsJson({ ok: false, error: err.message }, 400);
      throw err;
    }
    const result = await createBooking(onboarding.id, input, 'widget');
    if (!result.ok) return corsJson({ ok: false, error: REFUSALS[result.reason] }, result.reason === 'closed' ? 404 : 409);

    const { booking, timeZone } = result;
    // A failure in the follow-ups must never undo or hide a booking that is already saved.
    after(async () => {
      try {
        await afterBooking(onboarding, site, booking, timeZone);
      } catch (err) {
        console.error('[book] after', err instanceof Error ? err.message : err);
      }
    });
    return corsJson({ ok: true, when: formatSlotLabel(booking, timeZone), service: booking.service, cancelUrl: cancelUrl(site, booking.cancelToken) });
  } catch (err) {
    console.error('[book] create', err instanceof Error ? err.message : err);
    return corsJson({ ok: false, error: 'Something went wrong. Please try again or call us.' }, 500);
  }
}
