// MANUAL SETUP REQUIRED BEFORE RUNNING THIS SCRIPT:
// 1. In the Vercel dashboard, go to the axeonstudio project -> Storage -> Create Database -> Postgres.
// 2. Vercel automatically adds POSTGRES_URL and related env vars to the project.
// 3. Pull them locally: `vercel env pull .env.local` (requires `vercel` CLI logged in).
// 4. Then run: npm run db:init
//    (the script is invoked with `node --env-file=.env.local` so POSTGRES_URL
//    is actually loaded -- plain `node` does not read .env files on its own)

import { sql } from '@vercel/postgres';

async function main() {
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

  // Keep in sync with ensureSchema() in lib/db.ts.
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
  await sql`ALTER TABLE pay_links ADD COLUMN IF NOT EXISTS monthly_amount_cents INTEGER;`;
  await sql`ALTER TABLE pay_links ADD COLUMN IF NOT EXISTS plan_name TEXT;`;
  // Client onboarding portal (lib/onboarding.ts). Mirrors lib/db.ts.
  await sql`
    CREATE TABLE IF NOT EXISTS onboardings (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL CHECK (tier IN ('essentials', 'axeoncore', 'axeongrowth')),
      client_email TEXT NOT NULL,
      client_name TEXT,
      business_name TEXT,
      phone TEXT,
      stripe_customer_id TEXT,
      checkout_session_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'closed')),
      code_hash TEXT,
      code_expires_at TIMESTAMPTZ,
      code_attempts INTEGER NOT NULL DEFAULT 0,
      code_sent_at TIMESTAMPTZ,
      code_sends INTEGER NOT NULL DEFAULT 0,
      welcome_sent_at TIMESTAMPTZ,
      nudge_sent_at TIMESTAMPTZ,
      last_client_activity_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS onboardings_email_idx ON onboardings (client_email);`;
  await sql`CREATE INDEX IF NOT EXISTS onboardings_created_idx ON onboardings (created_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS onboarding_items (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
      data JSONB NOT NULL DEFAULT '{}',
      completed_by TEXT CHECK (completed_by IN ('client', 'axeon')),
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, item_key)
    );
  `;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS completion_notified_at TIMESTAMPTZ;`;
  await sql`
    CREATE TABLE IF NOT EXISTS client_accounts (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER UNIQUE NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      reset_token_hash TEXT,
      reset_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS agreements (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      number TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'signed', 'paid', 'void')),
      client_email TEXT NOT NULL,
      fields JSONB NOT NULL,
      text_hash TEXT,
      signed_name TEXT,
      signed_title TEXT,
      signed_at TIMESTAMPTZ,
      signed_ip TEXT,
      signed_ua TEXT,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS agreements_email_idx ON agreements (client_email);`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS kickoff_at DATE;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS target_launch_at DATE;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_calls INTEGER;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_leads INTEGER;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_keyword TEXT;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_rank INTEGER;`;
  await sql`
    CREATE TABLE IF NOT EXISTS project_updates (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body JSONB NOT NULL DEFAULT '{}',
      emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS project_updates_onb_idx ON project_updates (onboarding_id, created_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_reports (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      body JSONB NOT NULL DEFAULT '{}',
      emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, month)
    );
  `;

  // Website tracking + automatic monthly reports (lib/siteStats.ts, lib/autoReports.ts).
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS site_key TEXT;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS onboardings_site_key_idx ON onboardings (site_key);`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS site_url TEXT;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS close_rate INTEGER NOT NULL DEFAULT 25;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS auto_reports BOOLEAN NOT NULL DEFAULT true;`;
  // 'auto' estimates the close rate from the month's data (lib/siteStats.ts
  // estimateCloseRate); 'manual' uses close_rate as typed in the admin.
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS close_rate_mode TEXT NOT NULL DEFAULT 'auto';`;
  await sql`
    CREATE TABLE IF NOT EXISTS site_events (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('view', 'click')),
      name TEXT,
      path TEXT,
      referrer TEXT,
      visitor TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS site_events_onb_time_idx ON site_events (onboarding_id, created_at);`;
  // Detail added 2026-10-08 (lib/siteStats.ts): device from viewport width, the
  // campaign the visit came from, a coarse place from Vercel's edge headers (city
  // and region only, never the IP), and per-page engagement sent when the visitor
  // leaves (kind 'leave': seconds active, scroll depth, load speed).
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS device TEXT;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS utm_source TEXT;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS utm_medium TEXT;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS city TEXT;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS seconds INTEGER;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS scroll INTEGER;`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS speed_ms INTEGER;`;
  await sql`ALTER TABLE site_events DROP CONSTRAINT IF EXISTS site_events_kind_check;`;
  await sql`ALTER TABLE site_events ADD CONSTRAINT site_events_kind_check CHECK (kind IN ('view', 'click', 'leave'));`;
  await sql`CREATE INDEX IF NOT EXISTS site_events_visitor_idx ON site_events (onboarding_id, visitor, created_at);`;
  console.log('Schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
