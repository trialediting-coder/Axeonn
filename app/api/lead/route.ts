// app/api/lead/route.ts
// Website forms on client sites post here (the form snippet in docs/onboarding.md):
// form-encoded from a plain <form>, or JSON from fetch. The site key resolves to
// the client the way /api/t does; the honeypot and the rate limit come first;
// the lead is saved and the visitor answered at once. The email, the owner's
// text and the call connect call run after the response (after()), so a slow
// Twilio or Resend never holds up the visitor's "thanks". Unlike /api/t, an
// unknown key is reported: a silently dropped lead costs the client a job, and
// the key is unguessable.
import { after } from 'next/server';
import { clientIp, rateLimited } from '@/lib/welcomeApi';
import { isValidSiteKey, onboardingIdForSiteKey } from '@/lib/siteStats';
import { getOnboardingById } from '@/lib/onboarding';
import { projectForm } from '@/lib/contacts';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';
import { deliverLead, isRateLimited, leadIpHash, LEAD_RATE_WINDOW_MINUTES, recentSubmissionCount, recordFormSubmission } from '@/lib/leads';
import { backLink, pagePath, replyPage, safeRedirect, validateLeadInput } from '@/lib/leadShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'cache-control': 'no-store',
};

const MAX_BODY = 16384;
// Per instance, before any database work: only stops floods. The real limit is LEAD_RATE_LIMIT per site, in the table.
const MAX_PER_MINUTE = 20;

interface Reply {
  json: boolean;
  origin: string | null;
  referer: string | null;
  redirect: unknown;
}

function page(r: Reply, status: number, heading: string, text: string): Response {
  return new Response(replyPage({ heading, text, backUrl: backLink(r.referer) }), { status, headers: { ...CORS, 'content-type': 'text/html; charset=utf-8' } });
}

function thanks(r: Reply): Response {
  if (r.json) return Response.json({ ok: true }, { headers: CORS });
  const to = safeRedirect(r.redirect, r.origin, r.referer);
  if (to) return new Response(null, { status: 303, headers: { ...CORS, location: to } });
  return page(r, 200, 'Thanks, we got your message.', 'We will get back to you soon.');
}

function refuse(r: Reply, status: number, error: string): Response {
  if (r.json) return Response.json({ ok: false, error }, { status, headers: CORS });
  return page(r, status, 'Your message was not sent.', error);
}

async function readFields(req: Request): Promise<Record<string, unknown> | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY) return null;
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  if (type.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of form) if (typeof v === 'string') fields[k] = v; // file inputs are ignored
    return fields;
  }
  const text = await req.text().catch(() => '');
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY) return null;
  if (type.includes('application/json')) {
    try {
      const v: unknown = JSON.parse(text);
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return Object.fromEntries(new URLSearchParams(text));
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  const accept = (req.headers.get('accept') ?? '').toLowerCase();
  const reply: Reply = {
    json: type.includes('application/json') || accept.includes('application/json'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    redirect: null,
  };

  const fields = await readFields(req);
  if (!fields) return refuse(reply, 400, 'That form could not be read. Please call us instead.');
  reply.redirect = fields.redirect;

  const site = fields.site;
  if (!isValidSiteKey(site)) return refuse(reply, 400, 'This form is not connected yet. Please call us instead.');
  const ip = clientIp(req);
  if (rateLimited(`lead:${ip}`, MAX_PER_MINUTE, 60_000)) return refuse(reply, 429, 'Too many messages at once. Please wait a minute or call us.');

  const checked = validateLeadInput(fields);
  // A bot that filled the hidden field gets the same "thanks" a person gets, so it learns nothing.
  if (!checked.ok) return checked.reason === 'spam' ? thanks(reply) : refuse(reply, 400, checked.error);
  const lead = { ...checked.lead, page: checked.lead.page || pagePath(reply.referer) };

  try {
    const onboardingId = await onboardingIdForSiteKey(site);
    if (!onboardingId) {
      console.warn('[lead] unknown site key', site.slice(0, 6));
      return refuse(reply, 404, 'This form is not connected yet. Please call us instead.');
    }
    const ipHash = leadIpHash(ip, process.env.TRACKING_SALT || process.env.AUTH_SECRET || '');
    if (isRateLimited(await recentSubmissionCount(onboardingId, ipHash, LEAD_RATE_WINDOW_MINUTES))) {
      return refuse(reply, 429, 'We already have several messages from you and will be in touch. Please call us if it is urgent.');
    }
    const saved = await recordFormSubmission(onboardingId, lead, { ipHash });
    after(async () => {
      try {
        // Into the leads inbox first (lib/contacts.ts), so the alert can link to the contact. Never stops delivery.
        await projectForm(saved.id).catch((err) => {
          console.error('[lead] inbox', saved.id, redactDigits(errText(err)));
          return null;
        });
        const owner = await getOnboardingById(onboardingId);
        if (owner) await deliverLead(owner, saved);
        else console.error('[lead] deliver: no onboarding', onboardingId, saved.id);
      } catch (err) {
        console.error('[lead] deliver', saved.id, err instanceof Error ? err.message : err);
      }
    });
    return thanks(reply);
  } catch (err) {
    console.error('[lead]', err instanceof Error ? err.message : err);
    return refuse(reply, 500, 'Something went wrong on our side. Please call us instead.');
  }
}
