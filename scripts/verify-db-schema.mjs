// scripts/verify-db-schema.mjs
import { sql } from '@vercel/postgres';

async function main() {
  const { rows } = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'posts' ORDER BY ordinal_position;
  `;
  if (rows.length === 0) {
    console.error('FAIL: posts table does not exist. Run npm run db:init first.');
    process.exit(1);
  }
  const expected = ['id', 'slug', 'title', 'excerpt', 'content', 'status', 'author', 'niche_tags', 'meta_title', 'meta_description', 'cover_image_url', 'cover_image_alt', 'faq_items', 'sources', 'scheduled_publish_at', 'published_at', 'created_at', 'updated_at'];
  const actual = rows.map((r) => r.column_name);
  const missing = expected.filter((c) => !actual.includes(c));
  if (missing.length > 0) {
    console.error('FAIL: missing columns:', missing);
    process.exit(1);
  }
  console.log('PASS: posts table has all expected columns.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
