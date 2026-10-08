// lib/selfTracking.ts
// Axeon's own website is a client too. axeonstudio.co loads public/t.js with a
// fixed, well-known site key (app/layout.tsx), and the first event or the first
// visit to the admin onboarding board creates the matching onboarding record:
// "Axeon Studio", complete (no checklist, no nudges), with the tracker key and
// site address already filled in. From there it behaves like any client:
// View as client shows the AxeonPROOF dashboard for our own traffic, and the
// 1st-of-the-month report goes to ADMIN_EMAIL.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { createOnboarding, getOnboardingById, type Onboarding } from '@/lib/onboarding';

/** Matches lib/siteStats.ts KEY_RE (ax_ + 14 of [a-z2-9]). Public by design: it sits in every page's HTML. */
export const SELF_SITE_KEY = 'ax_axeonstudioown';
export const SELF_BUSINESS = 'Axeon Studio';
/** t.js only records on this host, so previews, localhost and app.axeonstudio.co stay out of the numbers. */
export const SELF_SITE_HOST = 'axeonstudio.co';

const selfEmail = () => (process.env.ADMIN_EMAIL || 'hello@axeonstudio.co').trim().toLowerCase();

/** The onboarding row that carries SELF_SITE_KEY, created on first use. Null without a database. */
export async function ensureSelfOnboarding(): Promise<Onboarding | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const found = await sql<{ id: number }>`SELECT id FROM onboardings WHERE site_key = ${SELF_SITE_KEY} LIMIT 1;`;
  if (found.rows[0]) return getOnboardingById(found.rows[0].id);

  const created = await createOnboarding({ tier: 'axeongrowth', clientEmail: selfEmail(), clientName: 'Axeon', businessName: SELF_BUSINESS });
  try {
    await sql`
      UPDATE onboardings
      SET site_key = ${SELF_SITE_KEY}, site_url = ${SITE_ORIGIN}, status = 'complete', completed_at = now(), updated_at = now()
      WHERE id = ${created.id};
    `;
  } catch (err) {
    // Two first requests at once: the other one won the unique site_key index. Drop ours and use theirs.
    await sql`DELETE FROM onboardings WHERE id = ${created.id} AND site_key IS NULL;`;
    const again = await sql<{ id: number }>`SELECT id FROM onboardings WHERE site_key = ${SELF_SITE_KEY} LIMIT 1;`;
    if (!again.rows[0]) throw err;
    return getOnboardingById(again.rows[0].id);
  }
  return getOnboardingById(created.id);
}

const CACHE_MS = 10 * 60_000;
let cached: { id: number; at: number } | null = null;

/** For the collector: the self record's id, provisioning it the first time axeonstudio.co reports in. */
export async function selfOnboardingId(): Promise<number | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.id;
  const o = await ensureSelfOnboarding();
  if (!o) return null;
  cached = { id: o.id, at: Date.now() };
  return o.id;
}
