// Admin-only: a client's online booking (lib/bookings.ts).
//   GET                                          settings, time zone, upcoming bookings, site key
//   PUT  { enabled, slotMinutes, bufferMinutes, leadDays, hours, serviceNames, confirmMessage }
//   POST { action: 'done' | 'cancel', id }       mark a booking done, or cancel it (the customer is texted,
//                                                else emailed; if neither can go the owner is told to call)
// PUT refuses plans without online booking (Essentials, ruling S5-R12). POST works on any plan
// (ruling S5-R13): a downgraded client must still be able to cancel or close out existing bookings.
import { NextResponse, after } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingByToken } from '@/lib/onboarding';
import { adminBookingData, afterCancel, bookingTimeZone, markBooking, saveBookingSettings } from '@/lib/bookings';
import { validateBookingSettings } from '@/lib/bookingShared';
import { PLAN_REFUSAL, adminBookingWriteAllowed } from '@/lib/publicSite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

async function load(token: string) {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

/** For a settings write: the client, only when their plan includes online booking. */
async function loadIncluded(token: string) {
  const onboarding = await load(token);
  if (!adminBookingWriteAllowed('settings', onboarding.tier)) throw new Error(PLAN_REFUSAL);
  return onboarding;
}

export async function GET(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await adminBookingData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const onboarding = await loadIncluded((await ctx.params).token);
    await saveBookingSettings(onboarding.id, validateBookingSettings(await readBody(req)));
    return NextResponse.json(await adminBookingData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Existing bookings only, so no plan check (S5-R13); admin auth above still runs first.
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Pick a booking');
    if (body.action !== 'done' && body.action !== 'cancel') throw new Error('Unknown action');
    if (!adminBookingWriteAllowed(body.action, onboarding.tier)) throw new Error(PLAN_REFUSAL);
    const booking = await markBooking(onboarding.id, id, body.action === 'done' ? 'done' : 'cancelled');
    if (!booking) throw new Error('That booking is no longer open');
    if (body.action === 'cancel') {
      const timeZone = await bookingTimeZone(onboarding.id);
      after(() => afterCancel(onboarding, booking, timeZone, 'owner'));
    }
    return NextResponse.json(await adminBookingData(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}
