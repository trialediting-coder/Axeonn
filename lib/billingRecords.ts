// lib/billingRecords.ts
// Local mirror of what Stripe told us via webhooks, so the admin console can show
// recent activity without hitting the Stripe API on every page load. Stripe stays
// the source of truth; rows here are upserted from verified webhook events only.
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';

export type BillingObjectType = 'checkout_session' | 'invoice' | 'subscription';

export interface BillingRecordInput {
  stripeObjectId: string;
  objectType: BillingObjectType;
  kind: string | null;
  status: string;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  amountCents: number | null;
  currency: string | null;
  tier: string | null;
  hostedUrl: string | null;
  metadata?: Record<string, unknown>;
}

export interface BillingRecord extends BillingRecordInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface BillingRow {
  id: number;
  stripe_object_id: string;
  object_type: BillingObjectType;
  kind: string | null;
  status: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  amount_cents: number | null;
  currency: string | null;
  tier: string | null;
  hosted_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: BillingRow): BillingRecord {
  return {
    id: row.id,
    stripeObjectId: row.stripe_object_id,
    objectType: row.object_type,
    kind: row.kind,
    status: row.status,
    customerId: row.customer_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    amountCents: row.amount_cents,
    currency: row.currency,
    tier: row.tier,
    hostedUrl: row.hosted_url,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** True if this Stripe event id was already fully processed. */
export async function wasEventProcessed(eventId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  await ensureSchema();
  const res = await sql<{ id: string }>`SELECT id FROM stripe_events WHERE id = ${eventId} LIMIT 1;`;
  return res.rows.length > 0;
}

export async function markEventProcessed(eventId: string, type: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await ensureSchema();
  await sql`
    INSERT INTO stripe_events (id, type)
    VALUES (${eventId}, ${type})
    ON CONFLICT (id) DO NOTHING;
  `;
}

export async function upsertBillingRecord(input: BillingRecordInput): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await ensureSchema();
  const metadata = JSON.stringify(input.metadata ?? {});
  await sql`
    INSERT INTO billing_records (
      stripe_object_id, object_type, kind, status, customer_id, customer_email,
      customer_name, amount_cents, currency, tier, hosted_url, metadata
    ) VALUES (
      ${input.stripeObjectId}, ${input.objectType}, ${input.kind}, ${input.status},
      ${input.customerId}, ${input.customerEmail}, ${input.customerName},
      ${input.amountCents}, ${input.currency}, ${input.tier}, ${input.hostedUrl},
      ${metadata}::jsonb
    )
    ON CONFLICT (stripe_object_id) DO UPDATE SET
      status = EXCLUDED.status,
      kind = COALESCE(EXCLUDED.kind, billing_records.kind),
      customer_id = COALESCE(EXCLUDED.customer_id, billing_records.customer_id),
      customer_email = COALESCE(EXCLUDED.customer_email, billing_records.customer_email),
      customer_name = COALESCE(EXCLUDED.customer_name, billing_records.customer_name),
      amount_cents = COALESCE(EXCLUDED.amount_cents, billing_records.amount_cents),
      currency = COALESCE(EXCLUDED.currency, billing_records.currency),
      tier = COALESCE(EXCLUDED.tier, billing_records.tier),
      hosted_url = COALESCE(EXCLUDED.hosted_url, billing_records.hosted_url),
      metadata = billing_records.metadata || EXCLUDED.metadata,
      updated_at = now();
  `;
}

export async function listBillingRecords(limit: number = 50): Promise<BillingRecord[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<BillingRow>`
    SELECT * FROM billing_records ORDER BY updated_at DESC LIMIT ${limit};
  `;
  return res.rows.map(rowToRecord);
}
