import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { niches } from '@/data/nichesData';

export interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  nicheTags: string[];
  faqItems: { question: string; answer: string }[];
  sources: { claim: string; url: string }[];
}

// Verified against the installed @anthropic-ai/sdk's own type definitions
// (node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts) at
// implementation time — this is a current, real model ID.
const MODEL = 'claude-opus-5';

function loadGuardrails(): string {
  return readFileSync(path.join(process.cwd(), 'content', 'brand-guardrails.md'), 'utf-8');
}

export function buildAvoidTitlesClause(priorTitles: string[]): string {
  if (priorTitles.length === 0) {
    return 'No prior posts exist yet — any real, relevant topic is fine.';
  }
  return `Do not repeat or closely resemble any of these already-published topics:\n${priorTitles.map((t) => `- ${t}`).join('\n')}`;
}

const SUBMIT_POST_TOOL = {
  name: 'submit_post',
  description: 'Submit the completed, researched blog post.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const },
      slug: { type: 'string' as const, description: 'lowercase-hyphenated' },
      excerpt: { type: 'string' as const, description: '1-2 sentence summary' },
      content: { type: 'string' as const, description: 'Full post body in Markdown, with a single H1, at least two H2s, and real depth (800+ words).' },
      metaTitle: { type: 'string' as const },
      metaDescription: { type: 'string' as const },
      nicheTags: { type: 'array' as const, items: { type: 'string' as const }, description: 'Slugs from the provided niche list — only include ones this post genuinely relates to.' },
      faqItems: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: { question: { type: 'string' as const }, answer: { type: 'string' as const } },
          required: ['question', 'answer'],
        },
      },
      sources: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: { claim: { type: 'string' as const }, url: { type: 'string' as const } },
          required: ['claim', 'url'],
        },
        description: 'Every external statistic cited in content, with the real URL it came from.',
      },
    },
    required: ['title', 'slug', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'nicheTags', 'faqItems', 'sources'],
  },
};

export async function generatePost(avoidTitles: string[]): Promise<GeneratedPost> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const guardrails = loadGuardrails();
  const nicheList = niches.map((n) => `${n.slug}: ${n.name}`).join('\n');

  const systemPrompt = `You write SEO/AEO-optimized blog posts for Axeon Studio, a West Des Moines, Iowa digital agency. Your goal is genuine ranking and AI-citation potential, which research shows comes from real accuracy, depth, and structure — never from volume or filler.

${guardrails}

Axeon's niches (use these exact slugs in nicheTags):
${nicheList}

${buildAvoidTitlesClause(avoidTitles)}

Research a real, specific, current topic relevant to one of Axeon's niches or services using web search. Every external statistic you state MUST be one you actually found via search, with its real source URL recorded in "sources". Write a complete, well-structured post, then call submit_post with the final result. Do not call submit_post until you have done real research.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Research and write this week\'s post now.' },
  ];

  // Agentic loop: let the model use web_search freely across turns until it
  // calls submit_post.
  for (let turn = 0; turn < 8; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      // Confirmed against the installed SDK's own WebSearchTool20250305 type
      // (name: 'web_search' literal, type: 'web_search_20250305' literal).
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool, SUBMIT_POST_TOOL],
      messages,
    });

    const submitCall = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_post'
    );
    if (submitCall) {
      return submitCall.input as GeneratedPost;
    }

    messages.push({ role: 'assistant', content: response.content });

    // Only genuine client-side tool_use blocks land here. The server-executed
    // web_search tool never does: its blocks come back as type
    // 'server_tool_use' (see ServerToolUseBlock in
    // @anthropic-ai/sdk/resources/messages/messages.d.ts), a distinct type
    // from the client-tool 'tool_use' this filter matches, and its results
    // are already included automatically in the same response as
    // 'web_search_tool_result' blocks — no client-submitted tool_result is
    // needed for those.
    const toolResults: Anthropic.ToolResultBlockParam[] = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map((block) => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: 'Search executed by the API automatically.',
      }));

    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults });
    } else {
      // The model used web_search (or produced only text) without calling
      // submit_post yet. There is nothing to reply to as a tool_result in
      // this case, but the turn budget isn't exhausted — nudge it to keep
      // going rather than aborting after a single turn. The for-loop's
      // 8-turn cap and the throw below remain the fail-safe if the model
      // never actually submits.
      messages.push({
        role: 'user',
        content: 'Continue your research if needed, then call submit_post with the completed result.',
      });
    }
  }

  throw new Error('generatePost: model did not call submit_post within the turn budget.');
}

export async function critiquePost(post: GeneratedPost): Promise<{ passed: boolean; reasons: string[] }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const guardrails = loadGuardrails();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a strict compliance reviewer for Axeon Studio's blog. Check the draft below against these rules exactly:\n\n${guardrails}\n\nRespond with ONLY a JSON object: {"passed": boolean, "reasons": string[]}. "reasons" must be empty if passed is true.`,
    messages: [{ role: 'user', content: JSON.stringify(post, null, 2) }],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
  if (!textBlock) return { passed: false, reasons: ['Critique call returned no text response.'] };

  try {
    return JSON.parse(textBlock.text);
  } catch {
    return { passed: false, reasons: ['Critique response was not valid JSON — treating as failure per fail-safe default.'] };
  }
}
