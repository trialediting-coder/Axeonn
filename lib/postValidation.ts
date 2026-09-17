// lib/postValidation.ts
export interface PostDraft {
  title: string;
  content: string;
  sources: { claim: string; url: string }[];
}

export interface ValidationResult {
  passed: boolean;
  reasons: string[];
}

const MIN_WORD_COUNT = 800;

// Phrases that must never appear in a published post's body. Kept in sync
// with content/brand-guardrails.md by hand — if you add a rule there that
// implies a bannable phrase, add it here too.
const BANNED_PHRASE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bsprint\b/i, reason: 'Uses "sprint" as a value proposition (banned terminology).' },
  { pattern: /operations retainer/i, reason: 'References the retired "Operations Retainer" name instead of AxeonCORE.' },
  { pattern: /(run|manage|handle)s?\s+(your\s+)?(google|meta|facebook)\s+ads/i, reason: 'Implies Axeon manages paid ad accounts (not-live service).' },
  { pattern: /local services ads? management/i, reason: 'Implies Axeon offers Local Services Ads management (not-live service).' },
  { pattern: /chatgpt ads/i, reason: 'Implies Axeon offers ChatGPT Ads (not-live service).' },
];

function countWords(markdown: string): number {
  return markdown
    .replace(/[#*_>`-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasHeadingLevel(markdown: string, level: number): number {
  const re = new RegExp(`^${'#'.repeat(level)}\\s+.+$`, 'gm');
  return (markdown.match(re) || []).length;
}

function looksLikeRealUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function validatePost(post: PostDraft): ValidationResult {
  const reasons: string[] = [];

  const wordCount = countWords(post.content);
  if (wordCount < MIN_WORD_COUNT) {
    reasons.push(`word count ${wordCount} is below the ${MIN_WORD_COUNT}-word floor.`);
  }

  if (hasHeadingLevel(post.content, 1) < 1) {
    reasons.push('Missing an H1 heading.');
  }

  if (hasHeadingLevel(post.content, 2) < 2) {
    reasons.push('Fewer than 2 H2 headings — content is not structured enough.');
  }

  for (const { pattern, reason } of BANNED_PHRASE_PATTERNS) {
    if (pattern.test(post.content)) {
      reasons.push(`Banned phrase / not-live-service claim found: ${reason}`);
    }
  }

  for (const source of post.sources) {
    if (!looksLikeRealUrl(source.url)) {
      reasons.push(`Cited source has an invalid-looking URL: "${source.url}" (claim: "${source.claim}").`);
    }
  }

  return { passed: reasons.length === 0, reasons };
}
