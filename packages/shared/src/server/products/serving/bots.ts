import { isbot } from 'isbot';
import { generateMarkdownFromPage } from './markdown-generator.js';

/**
 * Detects if the request is from a bot/crawler based on User-Agent
 */
export function isBotRequest(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    return isbot(userAgent);
}

/**
 * Renders a markdown response for bots
 * Uses the existing generateMarkdownFromPage function to create
 * a trimmed-down markdown version with frontmatter
 */
export function renderBotResponse(page: any, userProfile: any): string {
    const authorName = userProfile?.display_name || userProfile?.username || page.owner || 'unknown';
    return generateMarkdownFromPage(page, authorName);
}
