import { Context } from 'hono';
import { AbstractProduct } from '../AbstractProduct.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { substitute } from '@polymech/commons/variables';
import { logger } from './logger.js';
import { renderAstroPageRoute } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = process.env.ASTRO_TEMPLATES_DIR
    ? path.resolve(process.cwd(), process.env.ASTRO_TEMPLATES_DIR)
    : path.resolve(__dirname, '../../../templates/astro');

// Cache templates in memory
const templates: Record<string, string> = {};

const loadTemplate = async (name: string) => {
    if (templates[name]) return templates[name];
    try {
        const filePath = path.join(templatesDir, `${name}.astro`);
        const content = await fs.readFile(filePath, 'utf-8');
        templates[name] = content;
        return content;
    } catch (e) {
        logger.error({ err: e, name, templatesDir }, `Failed to load template ${name}`);
        throw e;
    }
};

export class AstroProduct extends AbstractProduct<any> {
    id = 'astro';
    jobOptions = {};
    actions = {};
    workers: any[] = [];
    routes: any[] = [];
    hash = () => 'astro-hash';
    meta = () => ({});

    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.routes.push({
            definition: renderAstroPageRoute,
            handler: this.handleRenderAstroPage.bind(this)
        });
    }

    async handleRenderAstroPage(c: Context) {
        const id = c.req.param('id');
        logger.info({ id }, 'Handling request for Astro Export');
        const { supabase } = await import('../../commons/supabase.js');

        // 1. Fetch Page Data
        const { data: page, error: pageError } = await supabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (pageError || !page) {
            logger.error({ id, error: pageError }, 'Failed to fetch page for Astro export');
            return c.text('Page not found', 404);
        }

        const { data: author } = await supabase.from('profiles').select('*').eq('user_id', page.owner).single();

        // 2. Load Template
        let template = '';
        try {
            template = await loadTemplate('page');
        } catch (e) {
            return c.text('handleRenderAstroPage:Template not found', 500);
        }

        // 3. Prepare Content
        const serverUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
        let markdownContent = '';
        let extractedImages: string[] = [];

        try {
            const rawContent = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;

            // Determine content root
            let root = rawContent;
            if (rawContent && rawContent.pages) {
                const pageIdKey = `page-${page.id}`;
                if (rawContent.pages[pageIdKey]) {
                    root = rawContent.pages[pageIdKey];
                } else {
                    const keys = Object.keys(rawContent.pages);
                    if (keys.length > 0) root = rawContent.pages[keys[0]];
                }
            }

            if (root && root.containers && Array.isArray(root.containers)) {
                root.containers.forEach((container: any) => {
                    if (container.widgets && Array.isArray(container.widgets)) {
                        container.widgets.forEach((widget: any) => {
                            if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                                markdownContent += widget.props.content + '\n\n';
                            }
                        });
                    }
                });
            } else if (typeof page.content === 'string') {
                markdownContent = page.content;
            }
        } catch (e) {
            markdownContent = typeof page.content === 'string' ? page.content : '';
        }

        // Resolve Images in Markdown
        markdownContent = markdownContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
            let fullUrl = url;
            if (!url.startsWith('http') && !url.startsWith('data:')) {
                const cleanPath = url.startsWith('/') ? url.substring(1) : url;
                fullUrl = `${serverUrl}/${cleanPath}`;
            }
            extractedImages.push(fullUrl);
            return `![${alt}](${fullUrl})`;
        });

        // Generate Images Section (if extra images meant to be in gallery)
        // For now, empty or maybe duplicate extracted images if needed, but template has ${images_section}
        let imagesSection = '';
        if (extractedImages.length > 0) {
            // Example gallery
            // imagesSection = extractedImages.map(img => `<img src="${img}" />`).join('\n');
        }

        // 4. Substitute
        const result = substitute(false, template, {
            title: page.title || 'Untitled',
            description: 'Exported from Polymech',
            author: author?.display_name || 'Author',
            date: new Date(page.created_at).toISOString().split('T')[0],
            tags: JSON.stringify(page.tags || []),
            content: markdownContent,
            images_section: imagesSection
        });

        c.header('Content-Type', 'application/octet-stream'); // Force download
        c.header('Content-Disposition', `attachment; filename="${(page.title || 'page').replace(/[^a-z0-9]/gi, '_')}.astro"`);
        return c.body(result);
    }
}
