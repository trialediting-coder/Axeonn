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
  console.log('Schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
