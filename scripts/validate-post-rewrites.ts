// scripts/validate-post-rewrites.ts
// Runs every content/insights-rewrites/*.md (action: rewrite or create) through
// lib/postValidation.ts, plus a stricter local lint for guardrail rules the
// validator doesn't encode (trade wording, plain-language bans, hype words,
// retired proof, internal links). Create files are also checked for an author,
// an on-site cover image with alt text, and the tighter meta lengths new posts
// are written to (title <= 60, description <= 155). Exit code 1 on any failure.
//   npx tsx scripts/validate-post-rewrites.ts
import { validatePost } from '../lib/postValidation';
import { loadRewrites } from './lib/insightRewrites.mjs';
import { FUNNEL_SERVICES, FUNNEL_VERTICALS, funnelPath } from '../data/serviceFunnels';

const VALID_NICHES = new Set(['dental', 'med-spa', 'law-firms', 'accounting']);
const INTERNAL_LINKS = new Set([
  '/check-your-area', '/book', '/pricing', '/axeonproof', '/work', '/partners',
  '/solutions/dental', '/solutions/med-spa', '/solutions/law-firms', '/solutions/accounting',
  '/marketing-solutions/website', '/marketing-solutions/seo', '/marketing-solutions/lead-generation',
  '/marketing-solutions/ai-chat-scheduling', '/marketing-solutions/advertising', '/marketing-solutions/video-photography',
  '/insights/how-much-does-a-website-cost-des-moines', '/insights/how-to-choose-a-marketing-agency-des-moines',
  '/insights/how-to-get-your-business-recommended-by-chatgpt',
  // Every service x practice funnel page (/marketing-solutions/{service}/{vertical}).
  ...FUNNEL_SERVICES.flatMap((s) => FUNNEL_VERTICALS.map((v) => funnelPath(s, v))),
]);
const LINT: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(contractors?|roof(ers?|ing)|hvac|plumb(ers?|ing)|detail(ers?|ing)|landscap\w*|remodel\w*|real estate|crews?|shops?|booked jobs?|jobs?)\b/i, reason: 'trade / home-services wording' },
  { pattern: /\b(AEO|GEO|funnels?|conversions?|convert|nurture|workflows?|crm pipeline|exit-intent)\b/i, reason: 'plain-language ban' },
  { pattern: /revolutionary|supercharge|unlock|seamless|game[- ]changer|predator|weaponi[sz]ed|lock-in|hegemony/i, reason: 'hype word' },
  { pattern: /!(?!\[)/, reason: 'exclamation point' },
  { pattern: /A-1|Levi|Pleasant Hill|Hintz|Essentials|(our|axeon|90[- ]day)[^.]{0,20}guarantee|we guarantee/i, reason: 'retired proof / plan / guarantee wording' },
  { pattern: /100 ?(%|percent) ownership|own everything from day one|zero lock|HIPAA/i, reason: 'ownership / health-info overclaim' },
  { pattern: /\b(best|#1|leading)\b(?=[^"]*")?/i, reason: 'possible superlative (check it is only inside a quoted search query)' },
  { pattern: /hayder|\bI (run|founded|started|built|am the)\b/i, reason: 'founder name or personal "I" voice' },
];

let failures = 0;
const rewrites = loadRewrites();
// Posts in this folder may link to each other (they go live in the same apply run).
for (const r of rewrites) if (r.action !== 'retire') INTERNAL_LINKS.add(`/insights/${r.slug}`);
for (const r of rewrites) {
  if (r.action === 'retire') {
    console.log(`SKIP  ${r.slug} (retire -> ${r.redirectTo})`);
    continue;
  }
  const problems: string[] = [];
  const core = validatePost({ title: r.title, content: r.content, sources: r.sources });
  problems.push(...core.reasons.map((x) => `validator(content): ${x}`));

  // The validator only reads content; run the same banned-phrase rules over the
  // other public fields (title, excerpt, meta, FAQ) by padding them into a body
  // that clears the structural checks.
  const metaText = [r.title, r.excerpt, r.metaTitle, r.metaDescription, ...r.faqItems.flatMap((f: { question: string; answer: string }) => [f.question, f.answer])].join('\n\n');
  const padded = `# x\n\n## a\n\n## b\n\n${metaText}\n\n${'word '.repeat(820)}`;
  problems.push(...validatePost({ title: r.title, content: padded, sources: [] }).reasons.map((x) => `validator(meta/faq): ${x}`));

  const everything = `${metaText}\n\n${r.content}`;
  // Search-query examples in quotes may say "best"; strip quoted spans first for that rule.
  const unquoted = everything.replace(/"[^"\n]*"/g, '""');
  for (const { pattern, reason } of LINT) {
    const hay = reason.startsWith('possible superlative') ? unquoted : everything;
    const m = hay.match(pattern);
    if (m) problems.push(`lint: ${reason} -> "${m[0]}"`);
  }
  for (const t of r.nicheTags) if (!VALID_NICHES.has(t)) problems.push(`niche tag not valid: ${t}`);
  for (const [, href] of r.content.matchAll(/\]\((\/[^)\s#]*)/g)) {
    if (!INTERNAL_LINKS.has(href)) problems.push(`internal link not in known route list: ${href}`);
  }
  for (const s of r.sources) {
    if (!r.content.includes(s.url)) problems.push(`source not linked in body: ${s.url}`);
  }
  if (r.metaDescription && r.metaDescription.length > 160) problems.push(`meta_description is ${r.metaDescription.length} chars (>160)`);
  if (r.metaTitle && r.metaTitle.length > 65) problems.push(`meta_title is ${r.metaTitle.length} chars (>65)`);
  if (r.action === 'create') {
    if (!r.metaTitle || r.metaTitle.length > 60) problems.push(`create: meta_title must be set and <= 60 chars (is ${r.metaTitle?.length ?? 0})`);
    if (!r.metaDescription || r.metaDescription.length > 155) problems.push(`create: meta_description must be set and <= 155 chars (is ${r.metaDescription?.length ?? 0})`);
    if (r.author !== 'human' && r.author !== 'ai') problems.push('create: author must be human or ai');
    if (r.coverImageUrl && !/^https:\/\/axeonstudio\.co\//.test(r.coverImageUrl)) problems.push(`create: cover_image_url should be an absolute on-site URL: ${r.coverImageUrl}`);
    if (r.faqItems.length < 4 || r.faqItems.length > 6) problems.push(`create: expected 4-6 FAQ items, found ${r.faqItems.length}`);
    if (!r.content.includes('](/check-your-area)')) problems.push('create: missing the /check-your-area call to action');
  }

  const words = r.content.replace(/[#*_>`-]/g, ' ').split(/\s+/).filter(Boolean).length;
  if (problems.length) {
    failures++;
    console.log(`FAIL  ${r.slug} (${words} words)`);
    for (const p of problems) console.log(`      - ${p}`);
  } else {
    console.log(`PASS  ${r.action === 'create' ? '[create] ' : ''}${r.slug} (${words} words, ${r.sources.length} sources, ${r.faqItems.length} FAQs)`);
  }
}
console.log(failures ? `\n${failures} post file(s) failed.` : `\nAll ${rewrites.filter((r: { action: string }) => r.action !== 'retire').length} rewrite/create files pass.`);
process.exit(failures ? 1 : 0);
