// app/api/get-started/lead/route.ts
// Public: the /get-started flow posts its lead here before showing the result,
// and this forwards the exact payload to the n8n webhook in LEAD_WEBHOOK_URL.
//
// Why a proxy instead of posting from the browser: the webhook URL stays a
// server-side env var (never in the JS bundle), there is no CORS setup on n8n,
// and junk can be dropped before it reaches Airtable. The browser never waits
// on this for anything but logging; a failure here must not block the visitor.
import { NextResponse } from 'next/server';
import { isValidEmail, type LeadPayload } from '@/lib/getStarted';
import { SERVICES } from '@/data/getStartedPackages';
import { isAirtableConfigured } from '@/lib/airtable';
import { saveLeadToAirtable } from '@/lib/airtableSync';
import { sendLeadNotification } from '@/lib/email';

export const runtime = 'nodejs';

const WEBHOOK_TIMEOUT_MS = 8000;
const MAX_FIELD_LENGTH = 300;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
// Best-effort per-instance limiter, same approach as /api/billing/checkout.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  return first.trim() || 'unknown';
}

const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_FIELD_LENGTH) : '');

/** Rebuilds the payload with only the known keys, in the documented order. */
function sanitize(body: Record<string, unknown>): LeadPayload | null {
  const email = str(body.email).trim();
  if (!isValidEmail(email)) return null;
  const answers = (body.answers && typeof body.answers === 'object' ? body.answers : {}) as Record<string, unknown>;
  const services = Array.isArray(body.services)
    ? body.services.filter((s): s is LeadPayload['services'][number] => SERVICES.includes(s))
    : [];
  const price = Number(body.packagePrice);

  return {
    businessName: str(body.businessName),
    contactName: str(body.contactName),
    email,
    phone: str(body.phone),
    website: str(body.website),
    services,
    packageId: str(body.packageId),
    packageName: str(body.packageName),
    packagePrice: Number.isFinite(price) ? price : 0,
    answers: {
      businessType: str(answers.businessType),
      hasWebsite: str(answers.hasWebsite),
      goal: str(answers.goal),
      budget: str(answers.budget),
      timeline: str(answers.timeline),
    },
    company_fax: str(body.company_fax),
  };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = sanitize(body);
  if (!payload) return NextResponse.json({ ok: false, error: 'A valid email is required' }, { status: 400 });

  // Honeypot filled: pretend success so bots learn nothing, and don't forward.
  if (payload.company_fax) return NextResponse.json({ ok: true });

  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  // 1. Airtable directly (replaces the n8n "Axeon Website Lead Form" workflow).
  // 2. Fallback: the old n8n webhook, if Airtable is not configured or fails.
  // 3. Either way the owner gets the lead by email, so nothing is ever lost silently.
  let savedTo: 'airtable' | 'n8n' | 'nowhere' = 'nowhere';
  let returning = false;

  if (isAirtableConfigured()) {
    try {
      const result = await saveLeadToAirtable(payload);
      returning = result.returning;
      savedTo = 'airtable';
    } catch (err) {
      console.error('[get-started] airtable save failed', err instanceof Error ? err.message : err);
    }
  }

  if (savedTo === 'nowhere' && process.env.LEAD_WEBHOOK_URL) {
    if (await forwardToWebhook(process.env.LEAD_WEBHOOK_URL, payload)) savedTo = 'n8n';
  }

  try {
    await sendLeadNotification({
      returning,
      businessName: payload.businessName,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      packageName: payload.packageName,
      services: payload.services,
      budget: payload.answers.budget,
      timeline: payload.answers.timeline,
      goal: payload.answers.goal,
      savedTo,
    });
  } catch (err) {
    console.error('[get-started] lead email failed', err instanceof Error ? err.message : err);
    if (savedTo === 'nowhere') {
      return NextResponse.json({ ok: false, error: 'Lead capture failed' }, { status: 502 });
    }
  }

  if (savedTo === 'nowhere' && !isLeadEmailConfigured()) {
    console.error('[get-started] lead not captured: no Airtable, no webhook, no email', { packageId: payload.packageId });
    return NextResponse.json({ ok: false, error: 'Lead capture is not configured' }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

async function forwardToWebhook(url: string, payload: LeadPayload): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) console.error('[get-started] webhook responded', res.status, { packageId: payload.packageId });
    return res.ok;
  } catch (err) {
    console.error('[get-started] webhook request failed', err instanceof Error ? err.message : err);
    return false;
  }
}

function isLeadEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL);
}
