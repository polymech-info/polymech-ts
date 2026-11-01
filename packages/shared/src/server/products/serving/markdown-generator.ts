
interface PageContent {
    pages?: Record<string, any>;
    containers?: any[];
    widgets?: any[];
}

export const generateMarkdownFromPage = (page: any, authorName?: string): string => {
    const content = page.content;
    const title = page.title || 'Untitled';
    const slug = page.slug || 'page';

    // 1. Process Content
    let markdownBody = '';

    try {
        if (!content) {
            markdownBody = '';
        } else if (typeof content === 'string') {
            markdownBody = content;
        } else {
            // Determine content root
            let root = content;
            if (content.pages) {
                // Try to find the page by ID or take the first one
                const pageIdKey = `page-${page.id}`;
                if (content.pages[pageIdKey]) {
                    root = content.pages[pageIdKey];
                } else {
                    // Fallback: take first key
                    const keys = Object.keys(content.pages);
                    if (keys.length > 0) root = content.pages[keys[0]];
                }
            }

            // Traverse containers
            if (root.containers && Array.isArray(root.containers)) {
                root.containers.forEach((container: any) => {
                    if (container.widgets && Array.isArray(container.widgets)) {
                        container.widgets.forEach((widget: any) => {
                            if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                                markdownBody += widget.props.content + '\n\n';
                            }
                        });
                    }
                });
            } else if (root.widgets && Array.isArray(root.widgets)) { // Fallback for simple structure
                root.widgets.forEach((widget: any) => {
                    if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                        markdownBody += widget.props.content + '\n\n';
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error parsing page content for markdown generation:', e);
        markdownBody = JSON.stringify(content, null, 2); // Fallback
    }

    // 2. Generate TOC
    const getSlug = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const lines = markdownBody.split('\n');
    let toc = '# Table of Contents\n\n';
    let hasHeadings = false;

    lines.forEach(line => {
        // Determine header level
        const match = line.match(/^(#{1,3})\s+(.+)/);
        if (match) {
            hasHeadings = true;
            const level = match[1].length;
            const text = match[2];
            const headerSlug = getSlug(text);
            const indent = '  '.repeat(level - 1);
            toc += `${indent}- [${text}](#${headerSlug})\n`;
        }
    });

    let finalContent = markdownBody;
    if (hasHeadings) {
        finalContent = `${toc}\n---\n\n${markdownBody}`;
    }

    // 3. Add Frontmatter (Optional, but good for context)
    // Matching the "Export Astro" or general metadata style
    const safeTitle = title.replace(/"/g, '\\"');
    const dateStr = new Date().toISOString().split('T')[0];

    const frontMatter = `---
title: "${safeTitle}"
slug: "${slug}"
date: "${dateStr}"
author: "${authorName || page.owner || 'unknown'}"
---

`;

    return frontMatter + finalContent;
};
