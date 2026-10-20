// scripts/lib/insightRewrites.mjs
// Reads content/insights-rewrites/*.md. Frontmatter is one `key: value` per
// line; a value that starts with " [ or { is parsed as JSON (YAML-compatible),
// anything else is a raw string. The body is the post's Markdown exactly as the
// posts.content column stores it (rendered by react-markdown + remark-gfm on
// /insights/[slug]; a leading "# Title" line is stripped there because the page
// renders the title itself).
//
// action: rewrite | create need title, excerpt and niche_tags (JSON array).
// action: create also needs author ("human" or "ai"; posts.author has no default)
// and may set cover_image_url + cover_image_alt (both or neither; the page and
// the /insights cards render fine without a cover).
// action: retire needs redirect_to.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REWRITES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'insights-rewrites');

export function parseRewrite(text, file = '(inline)') {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i < 1) throw new Error(`${file}: bad frontmatter line: ${line}`);
    const key = line.slice(0, i).trim();
    const raw = line.slice(i + 1).trim();
    try {
      meta[key] = /^["[{]/.test(raw) ? JSON.parse(raw) : raw;
    } catch (e) {
      throw new Error(`${file}: frontmatter "${key}" is not valid JSON: ${e.message}`);
    }
  }
  const body = m[2].replace(/^\n+/, '').replace(/\s+$/, '') + '\n';
  if (!meta.slug) throw new Error(`${file}: frontmatter needs slug`);
  if (!['rewrite', 'create', 'retire'].includes(meta.action)) throw new Error(`${file}: action must be rewrite, create or retire`);
  if (meta.action === 'retire' && !meta.redirect_to) throw new Error(`${file}: retire needs redirect_to`);
  if (meta.action === 'rewrite' || meta.action === 'create') {
    for (const k of ['title', 'excerpt']) if (!meta[k]) throw new Error(`${file}: ${meta.action} needs ${k}`);
    if (!Array.isArray(meta.niche_tags)) throw new Error(`${file}: niche_tags must be a JSON array`);
  }
  if (meta.action === 'create') {
    if (meta.author !== 'human' && meta.author !== 'ai') throw new Error(`${file}: create needs author: human or ai`);
    if (Boolean(meta.cover_image_url) !== Boolean(meta.cover_image_alt)) {
      throw new Error(`${file}: set cover_image_url and cover_image_alt together (or neither)`);
    }
  }
  return {
    file,
    slug: meta.slug,
    action: meta.action,
    redirectTo: meta.redirect_to ?? null,
    author: meta.author ?? null,
    coverImageUrl: meta.cover_image_url || null,
    coverImageAlt: meta.cover_image_alt || null,
    title: meta.title ?? null,
    excerpt: meta.excerpt ?? null,
    metaTitle: meta.meta_title ?? null,
    metaDescription: meta.meta_description ?? null,
    nicheTags: meta.niche_tags ?? [],
    faqItems: meta.faq_items ?? [],
    sources: meta.sources ?? [],
    content: body,
  };
}

export function loadRewrites(dir = REWRITES_DIR) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => parseRewrite(readFileSync(join(dir, f), 'utf8'), f));
}
