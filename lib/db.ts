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
    })().catch((err) => {
      schemaReady = null; // let the next request retry
      throw err;
    });
  }
  return schemaReady;
}
