// scripts/apply-post-rewrites.mjs
// Applies content/insights-rewrites/*.md to the posts table, matched by slug.
//   action: rewrite -> UPDATE title, excerpt, content, niche_tags, meta_title,
//                      meta_description, faq_items, sources, updated_at.
//                      (status, published_at, cover image and author are left alone.)
//   action: retire  -> UPDATE status = 'draft', scheduled_publish_at = NULL, updated_at.
//                      The 301 for the retired slug lives in next.config.mjs.
//
// Dry run by default (reads the current rows and prints what would change).
// Nothing is written unless you pass --apply. All writes run in one transaction.
//
//   POSTGRES_URL=postgres://... node scripts/apply-post-rewrites.mjs
//   node --env-file=.env.local scripts/apply-post-rewrites.mjs --apply
//   node scripts/apply-post-rewrites.mjs --url "postgres://..." --apply
//   node scripts/apply-post-rewrites.mjs --offline      (no DB: just list the plan)
//
// Run `npx tsx scripts/validate-post-rewrites.ts` first; this script refuses to
// write a rewrite that is missing title/excerpt/content.
import { createPool } from '@vercel/postgres';
import { loadRewrites } from './lib/insightRewrites.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const OFFLINE = args.includes('--offline');
const urlFlag = args.indexOf('--url');
const connectionString = urlFlag >= 0 ? args[urlFlag + 1] : process.env.POSTGRES_URL;

const short = (s, n = 70) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function planFor(rewrite, row) {
  if (rewrite.action === 'retire') {
    return row.status === 'draft' ? [] : [['status', row.status, 'draft']];
  }
  const next = {
    title: rewrite.title,
    excerpt: rewrite.excerpt,
    content: rewrite.content,
    niche_tags: rewrite.nicheTags,
    meta_title: rewrite.metaTitle,
    meta_description: rewrite.metaDescription,
    faq_items: rewrite.faqItems,
    sources: rewrite.sources,
  };
  const changes = [];
  for (const [col, value] of Object.entries(next)) {
    const cur = row[col];
    if (same(cur, value)) continue;
    if (col === 'content') {
      changes.push([col, `${String(cur ?? '').length} chars`, `${value.length} chars`]);
    } else if (col === 'faq_items' || col === 'sources') {
      changes.push([col, `${(cur ?? []).length} items`, `${value.length} items`]);
    } else if (col === 'niche_tags') {
      changes.push([col, (cur ?? []).join(',') || '(none)', value.join(',')]);
    } else {
      changes.push([col, short(cur), short(value)]);
    }
  }
  return changes;
}

async function main() {
  const rewrites = loadRewrites();
  for (const r of rewrites) {
    if (r.action === 'rewrite' && !(r.title && r.excerpt && r.content.trim())) {
      throw new Error(`${r.file}: rewrite is missing title, excerpt or content`);
    }
  }

  if (OFFLINE || !connectionString) {
    if (!OFFLINE) console.log('No POSTGRES_URL (or --url) given: showing the plan without reading the database.\n');
    for (const r of rewrites) {
      console.log(r.action === 'retire'
        ? `RETIRE   ${r.slug}  -> status=draft, 301 to ${r.redirectTo}`
        : `REWRITE  ${r.slug}  -> "${short(r.title, 90)}" [${r.nicheTags.join(',')}]`);
    }
    if (APPLY) console.log('\n--apply ignored: no database connection.');
    return;
  }

  const pool = createPool({ connectionString });
  const client = await pool.connect();
  try {
    const slugs = rewrites.map((r) => r.slug);
    const { rows } = await client.query('SELECT * FROM posts WHERE slug = ANY($1::text[])', [slugs]);
    const bySlug = new Map(rows.map((row) => [row.slug, row]));

    const work = [];
    for (const r of rewrites) {
      const row = bySlug.get(r.slug);
      if (!row) {
        console.log(`MISSING  ${r.slug}  (no post with this slug; skipped)`);
        continue;
      }
      const changes = planFor(r, row);
      const label = r.action === 'retire' ? 'RETIRE ' : 'REWRITE';
      console.log(`${label}  ${r.slug}  (id ${row.id}, status ${row.status})${changes.length ? '' : '  no changes'}`);
      for (const [col, from, to] of changes) console.log(`           ${col}: ${from}  ->  ${to}`);
      if (r.action === 'retire') console.log(`           redirect needed: /insights/${r.slug} -> ${r.redirectTo}`);
      if (changes.length) work.push({ r, row });
    }

    if (!APPLY) {
      console.log(`\nDry run: ${work.length} post(s) would change. Re-run with --apply to write.`);
      return;
    }

    await client.query('BEGIN');
    for (const { r, row } of work) {
      if (r.action === 'retire') {
        await client.query(
          `UPDATE posts SET status = 'draft', scheduled_publish_at = NULL, updated_at = now() WHERE id = $1`,
          [row.id],
        );
      } else {
        await client.query(
          `UPDATE posts SET
             title = $2, excerpt = $3, content = $4, niche_tags = $5::text[],
             meta_title = $6, meta_description = $7,
             faq_items = $8::jsonb, sources = $9::jsonb,
             updated_at = now()
           WHERE id = $1`,
          [
            row.id, r.title, r.excerpt, r.content, r.nicheTags,
            r.metaTitle, r.metaDescription,
            JSON.stringify(r.faqItems), JSON.stringify(r.sources),
          ],
        );
      }
    }
    await client.query('COMMIT');
    console.log(`\nApplied: ${work.length} post(s) updated. /insights pages revalidate within an hour (revalidate = 3600).`);
  } catch (err) {
    if (APPLY) await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
