import { Context } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/commons/logger.js';

export const loadTemplate = async (filename: string = 'index.html'): Promise<string | null> => {
    // Basic cache key strategy - simple map if needed, but for now we only have index.html and embed.html
    // If we need better caching for multiple files, we should change the cache structure.
    // For minimal change, let's just cache them separately or ignore cache for non-index for now (or make cache a Map)

    // Quick fix: Separate cache variable for embed or map
    // Ideally refactor into a map.

    return loadTemplateInternal(filename);
};

// Internal Cache Map
const templateCache = new Map<string, { content: string, time: number }>();
const CACHE_TTL = 60000; // 1 minute

const loadTemplateInternal = async (filename: string): Promise<string | null> => {
    const now = Date.now();
    const cached = templateCache.get(filename);

    if (cached && (now - cached.time < CACHE_TTL)) {
        return cached.content;
    }

    const distPath = process.env.CLIENT_DIST_PATH || path.join(process.cwd(), '../dist');
    // If embed.html, it might be in dist/client/embed/ or just custom path
    // Our build puts it in dist/client/embed/embed.html relative to root? 
    // Wait, vite config said: outDir: 'dist/client/embed'.
    // Standard dist is 'dist'.

    // Let's assume standardized structure or handle path logic in caller? 
    // Actually, let's just look in distPath for now, but handle subfolders if needed.
    // Given the previous steps: outDir: 'dist/client/embed'.
    // And standard build usually goes to `dist`.

    let filePath = path.join(distPath, filename);

    // Special handling for embed if it is in a subdir
    if (filename === 'embed.html') {
        // Try exact known location first
        filePath = path.resolve(process.cwd(), '../dist/client/embed/embed.html');
    }

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        templateCache.set(filename, { content, time: now });
        return content;
    } catch (err) {
        logger.warn({ err, filePath, cwd: process.cwd() }, `Failed to load template ${filename} at primary path.`);

        // Fallback attempts
        const fallbackPaths = [
            path.join(distPath, 'client/embed', filename),
            path.join(process.cwd(), '../dist/client/embed', filename),
            path.join(process.cwd(), 'dist/client/embed', filename), // In case server cwd is root
        ];

        for (const altPath of fallbackPaths) {
            try {
                const content = await fs.readFile(altPath, 'utf-8');
                templateCache.set(filename, { content, time: now });
                logger.info({ altPath }, `Found template ${filename} at fallback path.`);
                return content;
            } catch (e) {
                // components
            }
        }

        logger.error({ filename, attemptedPaths: [filePath, ...fallbackPaths] }, `Template ${filename} could not be found anywhere.`);
        return null;
    }
};

export interface PageMeta {
    title?: string;
    description?: string;
    image?: string;
    jsonLd?: any;
    scripts?: { content: string; id?: string }[];
}

import { load } from 'cheerio';

export const inject = (html: string, meta: PageMeta): string => {
    const $ = load(html);

    if (meta.title) {
        $('title').text(meta.title);
        $('meta[property="og:title"]').attr('content', meta.title);
        $('meta[name="twitter:title"]').attr('content', meta.title);
    }

    if (meta.description) {
        $('meta[name="description"]').attr('content', meta.description);
        $('meta[property="og:description"]').attr('content', meta.description);
    }

    if (meta.image) {
        $('meta[property="og:image"]').attr('content', meta.image);
        $('meta[name="twitter:image"]').attr('content', meta.image);
        // Ensure twitter card is set to summary_large_image
        const twitterCard = $('meta[name="twitter:card"]');
        if (twitterCard.length) {
            twitterCard.attr('content', 'summary_large_image');
        } else {
            $('head').append('<meta name="twitter:card" content="summary_large_image" />');
        }
    }

    if (meta.jsonLd) {
        // Remove existing JSON-LD if any
        $('script[type="application/ld+json"]').remove();

        // Append new JSON-LD
        const script = `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`;
        $('head').append(script);
    }

    if (meta.scripts && meta.scripts.length > 0) {
        meta.scripts.forEach(script => {
            const scriptTag = `<script type="text/javascript"${script.id ? ` id="${script.id}"` : ''}>${script.content}</script>`;
            $('head').append(scriptTag);
        });
    }


    return $.html();
};

export const extractDisplayImage = (content: any): { pictureId?: string, imageUrl?: string } | null => {
    let candidate: { pictureId?: string, imageUrl?: string } | null = null;

    // Helper to extract image from markdown
    const getMarkdownImage = (text: string): string | null => {
        const match = text.match(/!\[.*?\]\((.*?)\)/);
        return match ? match[1] : null;
    };

    const traverse = (node: any): boolean => { // return true to stop
        if (!node) return false;

        // Check for Photo Card
        if (node.widgetId === 'photo-card' && node.props?.pictureId) {
            candidate = { pictureId: node.props.pictureId };
            return true; // Found high priority, stop
        }

        // Check for Gallery Widget
        if (node.widgetId === 'gallery-widget' && node.props?.pictureIds && Array.isArray(node.props.pictureIds) && node.props.pictureIds.length > 0) {
            candidate = { pictureId: node.props.pictureIds[0] };
            return true; // Found gallery, use first image, stop
        }

        // Check for Image Widget (Explicit)
        if (node.widgetId === 'image' && node.props?.src) {
            candidate = { imageUrl: node.props.src };
            return true; // Found explicit image, stop (matches legacy behavior of first-found)
        }

        // Check for Markdown Text (Fallback)
        if (node.widgetId === 'markdown-text' && node.props?.content) {
            const imgUrl = getMarkdownImage(node.props.content);
            if (imgUrl && !candidate) {
                // Only use markdown if we don't have a candidate yet
                candidate = { imageUrl: imgUrl };
            }
        }

        if (Array.isArray(node)) {
            for (const child of node) {
                if (traverse(child)) return true;
            }
            return false;
        }

        if (typeof node === 'object') {
            // Generic traversal for any nested property (columns, slots, children, props, etc.)
            for (const key in node) {
                // Skip primitive checks or circular refs if possible? 
                // JSON structure is a tree, so circular refs shouldn't exist in 'content'.
                if (node[key] && typeof node[key] === 'object') {
                    if (traverse(node[key])) return true;
                }
            }
        }

        return false;
    };

    traverse(content);
    if (!candidate) {
        // logger.debug({ contentPreview: JSON.stringify(content).slice(0, 100) }, '[extractDisplayImage] No candidate found');
    } else {
        logger.debug({ candidate }, '[extractDisplayImage] Match found');
    }
    return candidate;
};
