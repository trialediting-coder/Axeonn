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

      // Client onboarding portal (/welcome/<token>, see lib/onboarding.ts). One row
      // per paying client; the token is the credential, the email code is the
      // second factor. Codes are stored hashed and expire in minutes.
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
      // One row per checklist item the client or Axeon has touched. A missing row
      // means "pending"; item definitions live in data/onboardingItems.ts.
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
      // One-time "client finished setup" alert to the owner (lib/onboardingSync.ts).
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS completion_notified_at TIMESTAMPTZ;`;

      // AxeonPROOF client sign-in (lib/proofAuth.ts). Passwords are bcrypt hashes;
      // reset tokens are stored only as SHA-256 hashes.
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

      // Client Services Agreements signed online (lib/agreements.ts). `fields` is
      // the filled-in agreement; text_hash fingerprints the exact text signed.
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

      // Project details, updates and monthly reports (lib/projects.ts).
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

      // Website tracking and automatic monthly reports (lib/siteStats.ts,
      // lib/autoReports.ts). site_key is what the client's site sends with every
      // event; close_rate is the percent of calls/texts/forms we count as a
      // customer in the "estimated new customers" number; auto_reports turns
      // the 1st-of-the-month email on or off per client.
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS site_key TEXT;`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS onboardings_site_key_idx ON onboardings (site_key);`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS site_url TEXT;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS close_rate INTEGER NOT NULL DEFAULT 25;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS auto_reports BOOLEAN NOT NULL DEFAULT true;`;
      // 'auto' estimates the close rate from the month's data (lib/siteStats.ts
      // estimateCloseRate); 'manual' uses close_rate as typed in the admin.
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS close_rate_mode TEXT NOT NULL DEFAULT 'auto';`;
      // Average job value in whole dollars, set in the admin, so the report can say
      // "about $11,700 in work". Null until the client tells us.
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS avg_job_value INTEGER;`;
      // One row per page view or button click on a client's website. No cookies,
      // no IP: `visitor` is a salted hash that rotates monthly, so "visitors" is
      // unique people per month and nothing identifies one of them.
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
      // Lead outcomes (2026-10-09, lib/siteStats.ts setLeadOutcome): the client taps
      // "Customer" or "Not" on a lead in AxeonPROOF. Only contact clicks carry one.
      await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('won', 'lost'));`;
      await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS outcome_at TIMESTAMPTZ;`;
      // When the owner was last told this client's tracker went quiet (lib/trackerHealth.ts).
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS tracker_alerted_at TIMESTAMPTZ;`;
      // The call deck (/admin/calls, lib/callLeads.ts): prospects imported from the
      // Iowa detailer spreadsheet, plus the owner's notes and call outcomes.
      await sql`
        CREATE TABLE IF NOT EXISTS call_leads (
          id SERIAL PRIMARY KEY,
          business TEXT NOT NULL,
          city TEXT NOT NULL DEFAULT '',
          region TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          website TEXT NOT NULL DEFAULT '',
          site_status TEXT NOT NULL DEFAULT '',
          rating NUMERIC(2,1),
          reviews INTEGER,
          priority TEXT NOT NULL DEFAULT 'D',
          axeon_status TEXT NOT NULL DEFAULT '',
          source TEXT NOT NULL DEFAULT '',
          maps_url TEXT NOT NULL DEFAULT '',
          why TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          outcome TEXT NOT NULL DEFAULT 'none',
          call_count INTEGER NOT NULL DEFAULT 0,
          last_called_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS call_leads_key_idx ON call_leads (lower(business), phone);`;
      await sql`ALTER TABLE call_leads ADD COLUMN IF NOT EXISTS niche TEXT NOT NULL DEFAULT '';`;
      await sql`ALTER TABLE call_leads ADD COLUMN IF NOT EXISTS contact TEXT NOT NULL DEFAULT '';`;
    })().catch((err) => {
      schemaReady = null; // let the next request retry
      throw err;
    });
  }
  return schemaReady;
}
