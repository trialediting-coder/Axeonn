// lib/db.ts
import { sql } from '@vercel/postgres';

export { sql };

/** True once Vercel Postgres (or any POSTGRES_URL) is attached to the project. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

let schemaReady: Promise<void> | null = null;

/**
 * Idempotent schema bootstrap, mirroring scripts/init-db.mjs, so the admin
 * works the moment a database is attached in Vercel — no CLI step required.
 * Memoised per server instance; every statement is IF NOT EXISTS.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published')),
          author TEXT NOT NULL CHECK (author IN ('human', 'ai')),
          niche_tags TEXT[] NOT NULL DEFAULT '{}',
          meta_title TEXT,
          meta_description TEXT,
          cover_image_url TEXT,
          cover_image_alt TEXT,
          faq_items JSONB NOT NULL DEFAULT '[]',
          sources JSONB NOT NULL DEFAULT '[]',
          scheduled_publish_at TIMESTAMPTZ,
          published_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS posts_status_idx ON posts (status);`;
      await sql`CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);`;

      // Stripe webhook idempotency + a local mirror of billing activity
      // (see lib/billingRecords.ts). Stripe remains the source of truth.
      await sql`
        CREATE TABLE IF NOT EXISTS stripe_events (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          received_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS billing_records (
          id SERIAL PRIMARY KEY,
          stripe_object_id TEXT UNIQUE NOT NULL,
          object_type TEXT NOT NULL CHECK (object_type IN ('checkout_session', 'invoice', 'subscription')),
          kind TEXT,
          status TEXT NOT NULL,
          customer_id TEXT,
          customer_email TEXT,
          customer_name TEXT,
          amount_cents INTEGER,
          currency TEXT,
          tier TEXT,
          hosted_url TEXT,
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS billing_records_email_idx ON billing_records (customer_email);`;
      await sql`CREATE INDEX IF NOT EXISTS billing_records_updated_idx ON billing_records (updated_at DESC);`;

      // Personalized pay links minted from the admin console (see lib/payLinks.ts).
      // A row is the client's locked scope; the money still lives on Stripe.
      await sql`
        CREATE TABLE IF NOT EXISTS pay_links (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          client_email TEXT NOT NULL,
          client_name TEXT,
          tier TEXT,
          add_ons TEXT[] NOT NULL DEFAULT '{}',
          kind TEXT NOT NULL CHECK (kind IN ('deposit', 'balance', 'full', 'plan')),
          plan_key TEXT,
          note TEXT,
          status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'disabled')),
          checkout_session_id TEXT,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS pay_links_created_idx ON pay_links (created_at DESC);`;
      // Custom monthly plans (maintenance-only clients). Added 2026-09-24; nullable, so
      // existing rows and seeded-plan links are unaffected.
      await sql`ALTER TABLE pay_links ADD COLUMN IF NOT EXISTS monthly_amount_cents INTEGER;`;
      await sql`ALTER TABLE pay_links ADD COLUMN IF NOT EXISTS plan_name TEXT;`;
    })().catch((err) => {
      schemaReady = null; // let the next request retry
      throw err;
    });
  }
  return schemaReady;
}
