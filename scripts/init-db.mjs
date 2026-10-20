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
  await sql`ALTER TABLE agreements ADD COLUMN IF NOT EXISTS ein TEXT;`;
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
  // Average job value in whole dollars, set in the admin, so the report can say
  // "about $11,700 in work". Null until the client tells us.
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS avg_job_value INTEGER;`;
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
  // Every email handed to Resend, sent or rejected (lib/emailLog.ts, /admin/emails).
  await sql`
    CREATE TABLE IF NOT EXISTS email_log (
      id BIGSERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      recipient TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
      error TEXT,
      resend_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS email_log_time_idx ON email_log (created_at DESC);`;
  // AxeonCORE phone layer (lib/phoneLines.ts): one tracked number per client,
  // every call and text on it, and who asked us to stop texting them.
  await sql`
    CREATE TABLE IF NOT EXISTS phone_lines (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER UNIQUE NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      phone_number TEXT UNIQUE NOT NULL,
      phone_number_sid TEXT NOT NULL,
      messaging_service_sid TEXT NOT NULL,
      forward_to TEXT NOT NULL,
      area_code TEXT NOT NULL,
      record_calls BOOLEAN NOT NULL DEFAULT true,
      consent_notice BOOLEAN NOT NULL DEFAULT true,
      text_back_enabled BOOLEAN NOT NULL DEFAULT true,
      text_back_message TEXT,
      sms_status TEXT NOT NULL DEFAULT 'pending' CHECK (sms_status IN ('pending', 'ready')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS phone_calls (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      call_sid TEXT UNIQUE NOT NULL,
      from_number TEXT NOT NULL,
      to_number TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('answered', 'missed')),
      dial_status TEXT NOT NULL DEFAULT '',
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      duration_seconds INTEGER,
      recording_url TEXT,
      recording_seconds INTEGER,
      text_back_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS phone_calls_client_time_idx ON phone_calls (onboarding_id, started_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS phone_calls_from_idx ON phone_calls (onboarding_id, from_number, text_back_sent_at);`;
  await sql`
    CREATE TABLE IF NOT EXISTS phone_messages (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      message_sid TEXT UNIQUE NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
      from_number TEXT NOT NULL,
      to_number TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL CHECK (kind IN ('text_back', 'manual', 'inbound')),
      status TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS phone_messages_client_time_idx ON phone_messages (onboarding_id, created_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS phone_opt_outs (
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      phone_number TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (onboarding_id, phone_number)
    );
  `;
  // Slice 2 (lib/leads.ts): website forms, call screening, call connect, time zone.
  await sql`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      email TEXT,
      message TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT '',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_hash TEXT NOT NULL DEFAULT '',
      is_test BOOLEAN NOT NULL DEFAULT false,
      alert_text_status TEXT,
      connect_call_sid TEXT,
      connect_pressed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS form_submissions_client_time_idx ON form_submissions (onboarding_id, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS form_submissions_rate_idx ON form_submissions (onboarding_id, ip_hash, created_at DESC);`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS screen_calls BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS call_connect_enabled BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE phone_lines ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Chicago';`;
  await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'connect'));`;
  await sql`ALTER TABLE phone_calls ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES form_submissions(id) ON DELETE SET NULL;`;
  await sql`ALTER TABLE phone_messages DROP CONSTRAINT IF EXISTS phone_messages_kind_check;`;
  // Two cold-starting instances can both drop, then both add; the loser gets duplicate_object (42710), which is fine.
  try {
    await sql`ALTER TABLE phone_messages ADD CONSTRAINT phone_messages_kind_check CHECK (kind IN ('text_back', 'manual', 'inbound', 'alert', 'sequence', 'confirm', 'reminder'));`;
  } catch (err) {
    if (err.code !== '42710') throw err;
  }
  // Follow-up sequences (lib/sequences.ts, slice 3): per-client templates,
  // one run per contact per kind, the past-customer list for the quarterly
  // check-in, and email unsubscribes (lib/unsubscribe.ts). Review and booking
  // links live on the client row. sms_sent_count > 0 means a text of this run
  // has gone out, so later texts may drop the STOP line (decideRun priorSmsSent).
  await sql`
    CREATE TABLE IF NOT EXISTS sequence_templates (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('new_lead', 'quote', 'reminder', 'review', 'reactivation')),
      steps JSONB NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT false,
      drafted_by TEXT NOT NULL DEFAULT 'axeon' CHECK (drafted_by IN ('axeon', 'claude')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, kind)
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sequence_runs (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('new_lead', 'quote', 'reminder', 'review', 'reactivation')),
      contact_phone TEXT,
      contact_email TEXT,
      contact_name TEXT NOT NULL DEFAULT '',
      ref_table TEXT NOT NULL,
      ref_id BIGINT NOT NULL,
      step INTEGER NOT NULL DEFAULT 0,
      anchor_at TIMESTAMPTZ NOT NULL,
      next_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'stopped')),
      stop_reason TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      sent_count INTEGER NOT NULL DEFAULT 0,
      sms_sent_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, kind, ref_table, ref_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS sequence_runs_due_idx ON sequence_runs (status, next_at);`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sequence_runs_active_phone_idx ON sequence_runs (onboarding_id, kind, contact_phone) WHERE status = 'active' AND contact_phone IS NOT NULL;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sequence_runs_active_email_idx ON sequence_runs (onboarding_id, kind, contact_email) WHERE status = 'active' AND contact_email IS NOT NULL;`;
  await sql`
    CREATE TABLE IF NOT EXISTS past_customers (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL,
      email TEXT,
      last_job_at DATE,
      consent_attested_at TIMESTAMPTZ,
      source TEXT NOT NULL DEFAULT 'csv',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, phone)
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS email_opt_outs (
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (onboarding_id, email)
    );
  `;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS review_link TEXT;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS booking_link TEXT;`;
  await sql`ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'booked', 'won', 'lost'));`;
  await sql`ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ;`;
  // The template's updated_at when a run started: an edited template stops older runs ('template_changed').
  await sql`ALTER TABLE sequence_runs ADD COLUMN IF NOT EXISTS template_updated_at TIMESTAMPTZ;`;
  // The run's last send: decideRun keeps 2 hours between sends (reminders excepted).
  await sql`ALTER TABLE sequence_runs ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;`;
  // The leads inbox (lib/contacts.ts, slice 4): one contact per phone or email
  // per client, and a projection of every call, text, form and click onto it.
  // The source tables stay the truth; contact_events exists so the inbox is one read.
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      phone TEXT,
      email TEXT,
      name TEXT,
      stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'booked', 'won', 'lost')),
      source TEXT NOT NULL CHECK (source IN ('call', 'text', 'form', 'chat', 'booking', 'click', 'messenger', 'instagram')),
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      stage_changed_at TIMESTAMPTZ,
      quote_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT contacts_identity_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_phone_uniq ON contacts (onboarding_id, phone) WHERE phone IS NOT NULL;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_uniq ON contacts (onboarding_id, email) WHERE email IS NOT NULL;`;
  await sql`CREATE INDEX IF NOT EXISTS contacts_inbox_idx ON contacts (onboarding_id, last_activity_at DESC, id DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS contact_events (
      id BIGSERIAL PRIMARY KEY,
      contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('call', 'text_in', 'text_out', 'form', 'booking', 'chat', 'click', 'note', 'alert', 'sequence', 'reminder', 'messenger', 'instagram')),
      ref_table TEXT,
      ref_id BIGINT,
      ref_part INTEGER NOT NULL DEFAULT 0,
      summary TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS contact_events_client_time_idx ON contact_events (onboarding_id, created_at);`;
  await sql`CREATE INDEX IF NOT EXISTS contact_events_contact_time_idx ON contact_events (contact_id, created_at);`;
  // One event per source row and kind: Twilio retries and a second backfill update it instead of adding one.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contact_events_ref_uniq ON contact_events (ref_table, ref_id, kind, ref_part) WHERE ref_id IS NOT NULL;`;
  // Browsers that asked for lead notifications (lib/push.ts), one row per device.
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS push_subscriptions_account_idx ON push_subscriptions (account_id);`;
  // Replies typed during quiet hours (lib/inboxReply.ts), sent at 8 am by /api/cron/held-replies.
  await sql`
    CREATE TABLE IF NOT EXISTS held_replies (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      send_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'sending', 'sent', 'failed')),
      error TEXT,
      claimed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sent_at TIMESTAMPTZ
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS held_replies_due_idx ON held_replies (status, send_at);`;
  await sql`CREATE INDEX IF NOT EXISTS held_replies_contact_idx ON held_replies (contact_id);`;
  // The number the reply was typed to; the 8 am send goes there or not at all (NULL: older rows, the contact's current phone).
  await sql`ALTER TABLE held_replies ADD COLUMN IF NOT EXISTS to_phone TEXT;`;
  // Online booking (lib/bookings.ts): one settings row per client and every booking.
  await sql`
    CREATE TABLE IF NOT EXISTS booking_settings (
      onboarding_id INTEGER PRIMARY KEY REFERENCES onboardings(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT false,
      slot_minutes INTEGER NOT NULL DEFAULT 60,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      lead_days INTEGER NOT NULL DEFAULT 14,
      hours JSONB NOT NULL DEFAULT '{}'::jsonb,
      service_names TEXT[] NOT NULL DEFAULT '{}',
      confirm_message TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      service TEXT NOT NULL DEFAULT '',
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'done')),
      source TEXT NOT NULL CHECK (source IN ('widget', 'chat', 'manual')),
      cancel_token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS bookings_client_time_idx ON bookings (onboarding_id, starts_at);`;
  // The backstop behind createBooking's lock: one live booking per start time per client.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_per_slot ON bookings (onboarding_id, starts_at) WHERE status = 'booked';`;
  // Website chat (lib/chat.ts, lib/chatCrawl.ts): the client's pages as text, settings, sessions, messages.
  await sql`
    CREATE TABLE IF NOT EXISTS site_pages (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, url)
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_settings (
      onboarding_id INTEGER PRIMARY KEY REFERENCES onboardings(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT false,
      greeting TEXT,
      trained_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      visitor TEXT NOT NULL DEFAULT '',
      phone TEXT,
      name TEXT,
      page TEXT,
      contact_logged_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS chat_sessions_client_idx ON chat_sessions (onboarding_id, last_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, id);`;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_client_time_idx ON chat_messages (onboarding_id, created_at);`;
  // The account-wide hourly spend cap counts every site's visitor messages by time.
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_time_idx ON chat_messages (created_at);`;
  // One crawl at a time per client: set while a train request runs (lib/chatCrawl.ts).
  await sql`ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS train_started_at TIMESTAMPTZ;`;
  // Slice 6 (lib/metaPages.ts, lib/metaInbox.ts, lib/social.ts): the Facebook pages a
  // client connected (page tokens sealed by lib/secretBox.ts, never stored in clear),
  // every Messenger / Instagram DM (mid is Meta's id and the dedupe key), AxeonGROWTH
  // reels, and data-deletion receipts (hashed code only).
  await sql`
    CREATE TABLE IF NOT EXISTS meta_pages (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      page_id TEXT UNIQUE NOT NULL,
      page_name TEXT NOT NULL,
      ig_user_id TEXT,
      ig_username TEXT,
      fb_user_id TEXT,
      token_enc TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_reconnect')),
      last_error TEXT,
      connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS meta_pages_onboarding_idx ON meta_pages (onboarding_id);`;
  await sql`CREATE INDEX IF NOT EXISTS meta_pages_ig_idx ON meta_pages (ig_user_id) WHERE ig_user_id IS NOT NULL;`;
  await sql`CREATE INDEX IF NOT EXISTS meta_pages_fb_user_idx ON meta_pages (fb_user_id) WHERE fb_user_id IS NOT NULL;`;
  await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS messenger_psid TEXT;`;
  await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS instagram_id TEXT;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_messenger_idx ON contacts (onboarding_id, messenger_psid) WHERE messenger_psid IS NOT NULL;`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contacts_instagram_idx ON contacts (onboarding_id, instagram_id) WHERE instagram_id IS NOT NULL;`;
  // A Messenger / Instagram sender has no phone or email: the PSID / IGSID is the identity.
  await sql`ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_identity_check;`;
  // Two cold-starting instances can both drop, then both add; the loser gets duplicate_object (42710), which is fine.
  try {
    await sql`ALTER TABLE contacts ADD CONSTRAINT contacts_identity_check CHECK (phone IS NOT NULL OR email IS NOT NULL OR messenger_psid IS NOT NULL OR instagram_id IS NOT NULL);`;
  } catch (err) {
    if (err.code !== '42710') throw err;
  }
  await sql`
    CREATE TABLE IF NOT EXISTS meta_messages (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
      channel TEXT NOT NULL CHECK (channel IN ('messenger', 'instagram')),
      direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
      page_id TEXT NOT NULL,
      person_id TEXT NOT NULL,
      mid TEXT UNIQUE NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
      sent_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS meta_messages_contact_idx ON meta_messages (contact_id, direction, sent_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS meta_messages_client_time_idx ON meta_messages (onboarding_id, created_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS social_posts (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
      kind TEXT NOT NULL DEFAULT 'reel' CHECK (kind IN ('reel')),
      page_id TEXT NOT NULL,
      video_url TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      scheduled_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
      container_id TEXT,
      remote_id TEXT,
      permalink TEXT,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      reach INTEGER,
      plays INTEGER,
      insights_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS social_posts_due_idx ON social_posts (status, scheduled_at);`;
  await sql`CREATE INDEX IF NOT EXISTS social_posts_client_idx ON social_posts (onboarding_id, created_at DESC);`;
  // Matches lib/db.ts: set just before a publish call, cleared only by a clear answer, so a reel is never published twice.
  await sql`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS publish_unclear BOOLEAN NOT NULL DEFAULT false;`;
  await sql`
    CREATE TABLE IF NOT EXISTS meta_deletions (
      code_hash TEXT PRIMARY KEY,
      pages_removed INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  // Matches lib/db.ts: AxeonPROOF v1/v2 per client; every existing row stays 1.
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS proof_version INTEGER NOT NULL DEFAULT 1;`;
  // AxeonPROOF v2 (lib/proofV2.ts): the delivery-schedule settings, pins on drafts,
  // the page program, summary-link opens and the reactivation (DBR) sprint. All additive.
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS proof_v2 JSONB NOT NULL DEFAULT '{}'::jsonb;`;
  // Type of practice or firm (data/industryWords.ts): prefilled from the agreement's
  // specialty, confirmed by the client in the portal's first question, which then
  // sends the dashboard invite once (dashboard_invite_sent_at). All additive.
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS industry TEXT;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS industry_confirmed_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS dashboard_invite_sent_at TIMESTAMPTZ;`;
  await sql`
    CREATE TABLE IF NOT EXISTS proof_pins (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      stage TEXT NOT NULL CHECK (stage IN ('wireframe', 'copy', 'staging')),
      x REAL NOT NULL CHECK (x >= 0 AND x <= 100),
      y REAL NOT NULL CHECK (y >= 0 AND y <= 100),
      note TEXT NOT NULL,
      author TEXT NOT NULL CHECK (author IN ('client', 'axeon')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at TIMESTAMPTZ
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS proof_pins_client_idx ON proof_pins (onboarding_id, stage, created_at);`;
  await sql`
    CREATE TABLE IF NOT EXISTS proof_pages (
      id SERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('location', 'procedure')),
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      intro TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'published')),
      published_at TIMESTAMPTZ,
      indexed BOOLEAN NOT NULL DEFAULT false,
      indexed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (onboarding_id, slug)
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS proof_link_access (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      recipient TEXT NOT NULL CHECK (recipient IN ('owner', 'manager')),
      accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_agent TEXT NOT NULL DEFAULT ''
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS proof_link_access_client_idx ON proof_link_access (onboarding_id, accessed_at DESC);`;
  await sql`
    CREATE TABLE IF NOT EXISTS dbr_sprints (
      onboarding_id INTEGER PRIMARY KEY REFERENCES onboardings(id) ON DELETE CASCADE,
      steps JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'stopped')),
      imported_count INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ended_at TIMESTAMPTZ
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS dbr_sends (
      id BIGSERIAL PRIMARY KEY,
      onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
      past_customer_id INTEGER NOT NULL REFERENCES past_customers(id) ON DELETE CASCADE,
      phone TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      step INTEGER NOT NULL,
      due_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'skipped', 'stopped', 'failed')),
      reason TEXT,
      sent_at TIMESTAMPTZ,
      UNIQUE (onboarding_id, past_customer_id, step)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS dbr_sends_due_idx ON dbr_sends (status, due_at);`;
  await sql`CREATE INDEX IF NOT EXISTS dbr_sends_phone_idx ON dbr_sends (onboarding_id, phone);`;
  console.log('Schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
