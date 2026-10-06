// lib/airtableSync.ts
// What the site writes to Airtable > Clients, and when. Replaces the n8n
// workflows "Axeon Website Lead Form" and "Axeon Portal Sync" with the same
// rules, so the base keeps working exactly as before without n8n:
//
// Leads (/api/get-started/lead):
//   new email      -> create with Status Lead, Lead Source Website Form, every answer.
//   existing email -> update answers, merge Services, append a dated note. Status untouched.
//
// Onboarding portal (lib/onboardingSync.ts):
//   mirrors Plan, Portal Status, Portal Progress, Portal Last Activity, Portal Admin Link.
//   Status only moves forward through the pipeline: a Lead/Call Booked/Contract Sent
//   row becomes Onboarding when the portal opens, and Onboarding becomes Access
//   Complete when the client finishes. Active and Paused are never touched.
//
// The field builders are pure (tested in lib/airtableSync.test.ts); the two
// save functions do the network calls.
import type { LeadPayload } from '@/lib/getStarted';
import type { Onboarding, Progress } from '@/lib/onboarding';
import { TIER_LABELS } from '@/data/onboardingItems';
import {
  compactFields,
  createClient,
  findClientByEmail,
  normalizeEmail,
  updateClient,
  type AirtableFields,
  type AirtableRecord,
} from '@/lib/airtable';

export const ADMIN_APP_URL = (process.env.APP_URL || 'https://app.axeonstudio.co').replace(/\/$/, '');

/** "Oct 6, 2026 4:05 PM" in Central time, like the n8n notes. */
export function centralStamp(now: Date = new Date()): string {
  const d = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const t = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(now);
  return `${d} ${t}`;
}

function answerFields(p: LeadPayload): AirtableFields {
  return {
    'Recommended Package': p.packageName,
    'Package Price': Number.isFinite(p.packagePrice) ? p.packagePrice : 0,
    'Business Type': p.answers.businessType,
    'Has Website': p.answers.hasWebsite,
    '90-Day Goal': p.answers.goal,
    'Monthly Budget': p.answers.budget,
    Timeline: p.answers.timeline,
  };
}

export function newLeadFields(p: LeadPayload, now: Date = new Date()): AirtableFields {
  return compactFields({
    'Business Name': p.businessName || p.contactName || normalizeEmail(p.email),
    'Contact Name': p.contactName,
    Email: normalizeEmail(p.email),
    Phone: p.phone,
    Website: p.website,
    Services: p.services,
    Status: 'Lead',
    'Lead Source': 'Website Form',
    Notes: `Website form ${centralStamp(now)}. Recommended: ${p.packageName || 'n/a'}.`,
    ...answerFields(p),
  });
}

export function returningLeadFields(p: LeadPayload, existing: AirtableFields, now: Date = new Date()): AirtableFields {
  const oldServices = Array.isArray(existing.Services) ? (existing.Services as string[]) : [];
  const services = Array.from(new Set([...oldServices, ...p.services]));
  const oldNotes = typeof existing.Notes === 'string' && existing.Notes ? `${existing.Notes}\n\n` : '';
  return compactFields({
    Phone: p.phone,
    Website: p.website,
    Services: services,
    Notes: `${oldNotes}Website form resubmitted ${centralStamp(now)}. Recommended: ${p.packageName || 'n/a'}. Services picked: ${
      p.services.join(', ') || 'none'
    }.`,
    ...answerFields(p),
  });
}

/** Saves a website lead. Throws on Airtable failure so the route can fall back. */
export async function saveLeadToAirtable(p: LeadPayload): Promise<{ returning: boolean; record: AirtableRecord }> {
  const existing = await findClientByEmail(p.email);
  if (existing) {
    const record = await updateClient(existing.id, returningLeadFields(p, existing.fields));
    return { returning: true, record };
  }
  const record = await createClient(newLeadFields(p));
  return { returning: false, record };
}

// ───────────────────────────── Onboarding portal ─────────────────────────────

const PORTAL_STATUS: Record<Onboarding['status'], string> = {
  active: 'In progress',
  complete: 'Complete',
  closed: 'Closed',
};

/** Pipeline stages a portal may move a row out of. Anything later is left alone. */
const PRE_ONBOARDING = new Set(['', 'Lead', 'Call Booked', 'Contract Sent', 'Signed & Paid']);

/** The Status a row should have, or undefined to leave it as it is. */
export function nextPipelineStatus(current: unknown, portal: Onboarding['status']): string | undefined {
  const status = typeof current === 'string' ? current : '';
  if (portal === 'closed') return undefined;
  if (portal === 'complete') return PRE_ONBOARDING.has(status) || status === 'Onboarding' ? 'Access Complete' : undefined;
  return PRE_ONBOARDING.has(status) ? 'Onboarding' : undefined;
}

/** The portal columns for one onboarding. Progress 0 is a real value, so it is never compacted away. */
export function portalFields(o: Onboarding, progress: Progress): AirtableFields {
  return {
    ...compactFields({
      Plan: TIER_LABELS[o.tier],
      'Portal Status': PORTAL_STATUS[o.status],
      'Portal Admin Link': `${ADMIN_APP_URL}/admin/onboarding/${o.token}`,
      'Portal Last Activity': o.lastClientActivityAt,
    }),
    // Percent fields take a 0..1 fraction.
    'Portal Progress': progress.percent / 100,
  };
}

/** Mirrors one onboarding into its Clients row, creating the row for a Stripe-only client. */
export async function syncOnboardingRow(o: Onboarding, progress: Progress): Promise<void> {
  const fields = portalFields(o, progress);
  const existing = await findClientByEmail(o.clientEmail);
  if (existing) {
    const status = nextPipelineStatus(existing.fields.Status, o.status);
    if (status) fields.Status = status;
    // Fill names only where the row has none, so nothing typed in Airtable is overwritten.
    if (!existing.fields['Business Name'] && o.businessName) fields['Business Name'] = o.businessName;
    if (!existing.fields['Contact Name'] && o.clientName) fields['Contact Name'] = o.clientName;
    await updateClient(existing.id, fields);
    return;
  }
  await createClient({
    ...compactFields({
      'Business Name': o.businessName || o.clientName || normalizeEmail(o.clientEmail),
      'Contact Name': o.clientName,
      Email: normalizeEmail(o.clientEmail),
      'Lead Source': 'Stripe',
      Status: nextPipelineStatus('', o.status),
    }),
    ...fields,
  });
}
