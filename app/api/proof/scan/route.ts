// app/api/proof/scan/route.ts
// POST from the signed-in client's Ranking card: one `client` audit of their
// own business on the keyword and city Axeon set, never with the grid, while
// this month's scans (3 on AxeonCORE, 10 on AxeonGROWTH, or the per-client
// override) are not used up. A failed scan is not counted.
import { NextResponse } from 'next/server';
import { clientScansUsed, getAuditSettings, runAudit, subjectForOnboarding } from '@/lib/audits';
import { scanCapFor, section } from '@/lib/auditShared';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Account not found');
    const settings = await getAuditSettings(onboarding.id);
    const cap = scanCapFor(onboarding.tier, settings.clientScanCap);
    const used = await clientScansUsed(onboarding.id);
    if (cap === 0) return NextResponse.json({ error: 'Scans are not part of your plan yet.' }, { status: 403 });
    if (used >= cap) return NextResponse.json({ error: `You've used this month's ${cap} scans. They reset on the 1st.` }, { status: 409 });
    const audit = await runAudit(subjectForOnboarding(onboarding, settings), { trigger: 'client', onboardingId: onboarding.id, grid: false });
    const maps = section(audit.results.maps);
    const rep = section(audit.results.reputation);
    const counted = audit.status !== 'failed';
    return NextResponse.json({
      rank: maps?.rank ?? null,
      found: maps?.found ?? false,
      rating: rep?.rating ?? null,
      reviews: rep?.reviews ?? null,
      leaks: audit.leaks,
      used: used + (counted ? 1 : 0),
      cap,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The scan did not go through';
    // Never leak a budget or credentials message to a client.
    const safe = /budget|DataForSEO|login/i.test(message) ? 'Scanning is paused for a moment. Please try again later.' : message;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
