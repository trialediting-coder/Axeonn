// lib/pastCustomers.ts
// The client's past-customer list for the quarterly check-in text. The CSV is
// parsed by lib/pastCustomersShared.ts; every row stores when Axeon attested
// that the client has consent to text these people. Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { parseClientList, parsePastCustomers, type ParsedCustomers } from '@/lib/pastCustomersShared';

const CHUNK = 500;

export async function importCsv(
  onboardingId: number,
  csvText: string,
  attestedAt: Date,
  opts: { nameAndPhoneOnly?: boolean; source?: 'csv' | 'client' } = {}
): Promise<{ imported: number; skipped: ParsedCustomers['skipped'] }> {
  if (csvText.length > 1_000_000) throw new Error('That file is too big. Keep it under 2,000 customers.');
  // The client's own upload keeps names and numbers only (parseClientList).
  const parsed = opts.nameAndPhoneOnly ? parseClientList(csvText) : parsePastCustomers(csvText);
  if (!parsed.rows.length) throw new Error('No rows with a US cell number were found. The file needs a phone column.');
  await ensureSchema();
  for (let i = 0; i < parsed.rows.length; i += CHUNK) {
    const chunk = parsed.rows.slice(i, i + CHUNK);
    const names = chunk.map((r) => r.name);
    const phones = chunk.map((r) => r.phone);
    const emails = chunk.map((r) => r.email);
    const dates = chunk.map((r) => r.lastJobAt);
    await sql`
      INSERT INTO past_customers (onboarding_id, name, phone, email, last_job_at, consent_attested_at, source)
      SELECT ${onboardingId}::int, u.name, u.phone, u.email, u.last_job_at, ${attestedAt.toISOString()}::timestamptz, ${opts.source ?? 'csv'}
      FROM unnest(
        ${names as unknown as string}::text[],
        ${phones as unknown as string}::text[],
        ${emails as unknown as string}::text[],
        ${dates as unknown as string}::date[]
      ) AS u(name, phone, email, last_job_at)
      ON CONFLICT (onboarding_id, phone) DO UPDATE
        SET name = EXCLUDED.name,
            email = COALESCE(EXCLUDED.email, past_customers.email),
            last_job_at = COALESCE(EXCLUDED.last_job_at, past_customers.last_job_at),
            consent_attested_at = EXCLUDED.consent_attested_at;
    `;
  }
  return { imported: parsed.rows.length, skipped: parsed.skipped };
}

export async function pastCustomerCounts(onboardingId: number): Promise<{ total: number; consented: number }> {
  await ensureSchema();
  const { rows } = await sql<{ total: number; consented: number }>`
    SELECT count(*)::int AS total, count(*) FILTER (WHERE consent_attested_at IS NOT NULL)::int AS consented
    FROM past_customers WHERE onboarding_id = ${onboardingId};
  `;
  return { total: Number(rows[0]?.total ?? 0), consented: Number(rows[0]?.consented ?? 0) };
}
