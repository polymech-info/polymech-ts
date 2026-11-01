/**
 * defaults.ts — AI system-prompt registry
 *
 * Usage:
 *   import { buildSupportPrompt, SUPPORT_CONTEXTS } from '@/modules/ai/defaults';
 *
 *   const prompt = buildSupportPrompt(['shipping-rates']);
 *
 * To add a new context, append an entry to SUPPORT_CONTEXTS.
 */

import { getCurrentLang, supportedLanguages } from '@/i18n';

// ── Base support prompt ──────────────────────────────────────────────────
//`CRITICAL: You are exclusively a machinery support assistant. If a user asks questions unrelated to plastic injection, machinery, our products, or our services, you MUST politely refuse to answer and remind them of your purpose. Exceptions : find articles & files (search tools) within our site, we provide a large library of documents, firmware and designs.` +
//`Only use get_page_content to retrieve the full page details if you specifically need more granular information that was not in the search summary. ` +

export const BASE_SUPPORT_PROMPT =
    `You are a helpful support assistant for PolyMech, a plastic injection machinery service. Be concise, friendly, and accurate. ` +
    `Tool order: Always use generic search tools (categories, pages, pages details and as last resort find files) first before using find_pages` +
    `When you don't know something about our products, use the file search tools to find the answer, otherwise say so and offer to escalate. ` +
    `Format responses in clear, readable Markdown. ` +
    `Never end your replies with filler phrases like "feel free to ask!", "let me know if you need anything else", or similar. ` +
    `IMPORTANT WORKFLOW: Before answering questions about specific products or content and if no page context has been provided, use your search tools (search_content, find_pages, find_files, find_by_category) first. A Page Context includes user variables as price (typeValues), location but also layout widgets with HTML & Markdown content` +
    `Review the returned summaries. If the summary provides enough information, answer the user immediately. ` +
    `PRICING RULES: When a user asks about the price or cost of an item being shipped, ALWAYS calculate and prominently display the estimated TOTAL cost (Item Price + Shipping Estimate). ` +
    `RICH UI: You can use Tailwind HTML tags for complex or aesthetic elements if they are significantly better than standard Markdown. Use standard markdown for basic text, but feel free to combine it with Tailwind divs if it creates a better visual layout.`;

// ── Named contextual additions ───────────────────────────────────────────

/**
 * Each entry represents a self-contained context block that can be appended
 * to the base prompt. Keys are stable identifiers used as prop values.
 */
export const SUPPORT_CONTEXTS: Record<string, string> = {
    /**
     * Shipping Rates context.
     * TODO: replace placeholder content with real rate tables / policies.
     */
    'shipping-rates': `
## Shipping Rates
All orders ship from Spain. We offer **Standard shipping** only.
- **Europe**: €150–€400 depending on size and destination
- **Overseas** (outside Europe): €800–€1500 depending on size and destination
- Exact quotes are provided at checkout.
`.trim(),
};

// ── Context keys (union type for IDE autocomplete) ───────────────────────

export type SupportContextKey = keyof typeof SUPPORT_CONTEXTS;

// ── Default context set ─────────────────────────────────────────────────

/** Contexts applied when no override is passed. */
export const DEFAULT_CONTEXTS: SupportContextKey[] = ['shipping-rates'];

// ── Builder function ─────────────────────────────────────────────────────

/**
 * Assembles the final system prompt from the base + selected context blocks.
 * Language is resolved automatically from the current UI language (cookie / browser).
 *
 * @param contexts List of context keys to append (order is preserved)
 */
export function buildSupportPrompt(
    contexts: SupportContextKey[] = DEFAULT_CONTEXTS,
): string {
    const lang = getCurrentLang();
    const langName = supportedLanguages.find(l => l.code === lang)?.name ?? lang;

    const parts: string[] = [BASE_SUPPORT_PROMPT];

    parts.push(`IMPORTANT : Always reply in ${langName} (language code: ${lang}). No matter what the additional context is.`);

    for (const key of contexts) {
        const block = SUPPORT_CONTEXTS[key];
        if (block) parts.push(block);
    }

    console.log('system prompt \n', parts.join('\n\n'));

    return parts.join('\n\n');
}
