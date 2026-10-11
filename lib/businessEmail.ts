// lib/businessEmail.ts
// Server side of the business email (lib/businessEmailShared.ts has the why).
// Stored as one JSONB column, onboardings.email_setup. Every write touches only
// its own keys in one UPDATE, so the admin saving mailboxes and a client adding
// a request at the same moment cannot overwrite each other. Server-only.
import { randomUUID } from 'node:crypto';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { sendBusinessEmailLiveEmail, sendEmailRequestNotification } from '@/lib/email';
import { checkDomainEmail } from '@/lib/emailDns';
import {
  MAX_OPEN_REQUESTS,
  REQUEST_KINDS,
  activeMailboxes,
  dnsIsStale,
  normalizeSetup,
  openRequests,
  validateRequestInput,
  validateSetupInput,
  type BusinessEmailSetup,
  type EmailRequest,
} from '@/lib/businessEmailShared';
import type { Onboarding } from '@/lib/onboarding';

/** Where the live email and the owner alert point the client: their dashboard's Email tab. */
export const emailTabUrl = () => `${APP_ORIGIN}/?tab=email`;

export async function getBusinessEmail(onboardingId: number): Promise<BusinessEmailSetup> {
  if (!isDatabaseConfigured()) return normalizeSetup(null);
  await ensureSchema();
  const res = await sql<{ email_setup: unknown }>`SELECT email_setup FROM onboardings WHERE id = ${onboardingId};`;
  return normalizeSetup(res.rows[0]?.email_setup);
}

/** Merges these top-level keys into email_setup and returns the result. */
async function merge(onboardingId: number, patch: Partial<BusinessEmailSetup>): Promise<BusinessEmailSetup> {
  await ensureSchema();
  const res = await sql<{ email_setup: unknown }>`
    UPDATE onboardings SET email_setup = COALESCE(email_setup, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb, updated_at = now()
    WHERE id = ${onboardingId}
    RETURNING email_setup;
  `;
  if (!res.rows[0]) throw new Error('Client not found');
  return normalizeSetup(res.rows[0].email_setup);
}

/** The admin's domain and mailbox list. A changed domain drops the old DNS report. */
export async function saveBusinessEmail(onboardingId: number, raw: Record<string, unknown>): Promise<BusinessEmailSetup> {
  const input = validateSetupInput(raw);
  const current = await getBusinessEmail(onboardingId);
  return merge(onboardingId, current.domain === input.domain ? input : { ...input, dns: null });
}

/** Looks the domain up now and stores the grades. */
export async function refreshDns(onboardingId: number): Promise<BusinessEmailSetup> {
  const setup = await getBusinessEmail(onboardingId);
  if (!setup.domain) throw new Error('Set the domain first');
  return merge(onboardingId, { dns: await checkDomainEmail(setup.domain) });
}

/**
 * For the client's Email tab: a stale report is refreshed on view, so the checks
 * are never more than a few hours old. A failed lookup keeps the old report.
 */
export async function businessEmailForDashboard(onboardingId: number): Promise<BusinessEmailSetup> {
  const setup = await getBusinessEmail(onboardingId);
  if (!dnsIsStale(setup)) return setup;
  try {
    return await refreshDns(onboardingId);
  } catch (err) {
    console.error('[business-email] dns check failed', err instanceof Error ? err.message : err);
    return setup;
  }
}

/** Emails the client their live mailboxes. Only Active ones are listed; none active is refused. */
export async function sendLiveEmail(onboarding: Onboarding): Promise<BusinessEmailSetup> {
  const setup = await getBusinessEmail(onboarding.id);
  const live = activeMailboxes(setup);
  if (live.length === 0) throw new Error('Mark at least one mailbox Active first (after you have created it in Google Admin)');
  const sent = await sendBusinessEmailLiveEmail({
    to: onboarding.clientEmail,
    clientName: onboarding.clientName,
    domain: setup.domain,
    mailboxes: live,
    dashboardUrl: emailTabUrl(),
  });
  if (!sent) throw new Error('Email is not configured (RESEND_API_KEY)');
  return merge(onboarding.id, { liveSentAt: new Date().toISOString() });
}

/** A client's ask from the Email tab: stored, and the owner is emailed. */
export async function addEmailRequest(onboarding: Onboarding, raw: Record<string, unknown>): Promise<EmailRequest> {
  if (onboarding.status === 'closed') throw new Error('This account is closed');
  if (!isDatabaseConfigured()) throw new Error('Not available right now');
  const { kind, detail } = validateRequestInput(raw);
  const setup = await getBusinessEmail(onboarding.id);
  if (openRequests(setup).length >= MAX_OPEN_REQUESTS) {
    throw new Error('You have a few requests open already. We are on them; reply to any Axeon email if it is urgent.');
  }
  const request: EmailRequest = { id: randomUUID(), kind, detail, at: new Date().toISOString(), resolvedAt: null };
  await sql`
    UPDATE onboardings SET
      email_setup = jsonb_set(
        COALESCE(email_setup, '{}'::jsonb), '{requests}',
        COALESCE(email_setup->'requests', '[]'::jsonb) || jsonb_build_array(${JSON.stringify(request)}::jsonb)
      ),
      updated_at = now()
    WHERE id = ${onboarding.id};
  `;
  sendEmailRequestNotification({
    businessName: onboarding.businessName || onboarding.clientEmail,
    clientEmail: onboarding.clientEmail,
    token: onboarding.token,
    kind: REQUEST_KINDS.find((k) => k.kind === kind)!.label,
    detail,
  }).catch((err) => console.error('[business-email] owner email failed', err instanceof Error ? err.message : err));
  return request;
}

/** The admin marks a request handled; it leaves the client's open list. */
export async function resolveEmailRequest(onboardingId: number, requestId: unknown): Promise<BusinessEmailSetup> {
  if (typeof requestId !== 'string' || !requestId) throw new Error('Which request?');
  await ensureSchema();
  const res = await sql<{ email_setup: unknown }>`
    UPDATE onboardings SET
      email_setup = jsonb_set(email_setup, '{requests}', (
        SELECT jsonb_agg(CASE WHEN r->>'id' = ${requestId} THEN r || jsonb_build_object('resolvedAt', ${new Date().toISOString()}::text) ELSE r END ORDER BY n)
        FROM jsonb_array_elements(email_setup->'requests') WITH ORDINALITY AS t(r, n)
      )),
      updated_at = now()
    WHERE id = ${onboardingId} AND email_setup->'requests' @> jsonb_build_array(jsonb_build_object('id', ${requestId}::text))
    RETURNING email_setup;
  `;
  if (!res.rows[0]) throw new Error('Request not found');
  return normalizeSetup(res.rows[0].email_setup);
}
