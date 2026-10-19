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
  { pattern: /operations retainer/i, reason: 'References the retired "Operations Retainer" plan — those plans are retired.' },
  { pattern: /your business.? your partner/i, reason: 'Uses the retired tagline "Your Business. Your Partner."' },
  { pattern: /axeoncore retainer/i, reason: 'References the retired "AxeonCORE retainer" plan name.' },
  { pattern: /\$\s?490|\b490\s*(\/|per|a)\s*mo/i, reason: 'References the retired $490/month plan.' },
  // Terms (owner, 2026-10-19): the 12-month agreement is stated plainly; month-to-month
  // is available with the implementation fee paid upfront. Any other term is invented.
  { pattern: /\b(?!12\b|twelve\b)(\d+|one|two|three|four|six|nine|eighteen|twenty-four|thirty-six)[- ]month (minimum|agreement|contract|term|commitment)/i, reason: 'States a term other than the 12-month agreement (or month-to-month); never invent a term.' },
  { pattern: /\bno (long[- ]term )?contracts?\b|cancel any ?time/i, reason: 'Claims there is no contract or that plans cancel anytime; plans run on a 12-month agreement.' },
  // Monthly prices: $799 AxeonCORE, $1,999 AxeonGROWTH, +$750 LSA add-on, +$199 receptionist, $500 ad-spend minimum.
  { pattern: /\$\s?(?!(?:799|1,?999|750|199|500)\b)\d[\d,]*\s*(\/|per|a)\s*(mo|month)\b/i, reason: 'States a monthly price that is not one of the published ones ($799, $1,999, +$750, +$199, $500 ad spend).' },
  { pattern: /\$\s?(149|299|999|399|284|574|2,?800|5,?800)\b/, reason: 'Cites a retired price ($149/$299/$999 plans, +$399 ads, $284/$574 monthly or $2,800/$5,800 setup).' },
  { pattern: /\$\s?(0|99|1,?500)\s*(to start|down|setup|start fee)|first month (is )?free|founding (client )?offer/i, reason: 'Cites a retired start offer ($0/$99/$1,500 to start, first month free, founding offer).' },
  { pattern: /90[- ]day (customer )?guarantee|customer guarantee|keep working for free/i, reason: 'Uses the retired 90-day customer guarantee; the current wording is the 90-day performance commitment.' },
  { pattern: /(guarantee|commitment)[^.]{0,80}\b\d+\s*(%|percent|(?:[a-z]+\s+){0,2}(leads|calls|customers|patients|clients|jobs|consultations|appointments))/i, reason: 'Turns the 90-day performance commitment into a result number; never promise leads, patients, revenue or rankings.' },
  { pattern: /hipaa[- ]certified/i, reason: 'Claims a HIPAA certification (no such certification exists).' },
  { pattern: /no (recurring |monthly |ongoing )+(fees?|costs?|plan)|no monthly plan bundled/i, reason: 'Claims there is no recurring fee — never make claims about ongoing fees either way.' },
  { pattern: /\b(7|14|seven|fourteen)[\s-]*(to|–|-)?[\s-]*(14|fourteen)?[\s-]*(business[\s-]*)?days?\b/i, reason: 'Promises a specific build timeline — describe speed in relative terms instead.' },
  { pattern: /care plan/i, reason: 'Mentions a "care plan"; the ongoing service is the monthly plan.' },
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
