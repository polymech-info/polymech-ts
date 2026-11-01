import { Context } from 'hono';
import { z } from 'zod';
import { createRouteBody } from '../routes.js';
import { logger } from '../logger.js';
import { fetchPostDetailsServer } from './db-posts.js';

// ==================== POST EXPORT ROUTES ====================

export const getPostPdfRoute = createRouteBody(
    'get',
    '/post/:id{.+\.pdf$}',
    ['Posts'],
    'Get Post PDF',
    'Returns the post content as a PDF document.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'PDF Document',
            content: {
                'application/pdf': {
                    schema: z.string().openapi({ format: 'binary' })
                }
            }
        },
        404: {
            description: 'Post not found'
        }
    },
    true // public
);

export const getPostJsonRoute = createRouteBody(
    'get',
    '/post/:id{.+\.json$}',
    ['Posts'],
    'Get Post JSON',
    'Returns the post data as JSON.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Post data as JSON',
            content: {
                'application/json': {
                    schema: z.object({
                        post: z.any(),
                        userProfile: z.any().optional()
                    })
                }
            }
        },
        404: {
            description: 'Post not found'
        }
    },
    true // public
);

export const getPostHtmlRoute = createRouteBody(
    'get',
    '/post/:id{.+\.html$}',
    ['Posts'],
    'Get Post HTML',
    'Returns static HTML with Open Graph metadata for the post.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'HTML Document',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Post not found'
        }
    },
    true // public
);

export const getPostMarkdownRoute = createRouteBody(
    'get',
    '/post/:id{.+\.md$}',
    ['Posts'],
    'Get Post Markdown',
    'Returns the post content as markdown.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Markdown content',
            content: {
                'text/markdown': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Post not found'
        }
    },
    true // public
);

// ==================== POST EXPORT HANDLERS ====================

export async function handleGetPostPdf(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        let id = c.req.param('id');

        logger.info({ rawId: id }, 'PDF export - raw ID from route');

        // Strip .pdf extension if present (due to regex match)
        if (id && id.endsWith('.pdf')) {
            id = id.slice(0, -4);
            logger.info({ strippedId: id }, 'PDF export - stripped .pdf extension');
        }

        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const { data: result } = await fetchPostDetailsServer(supabase, id, {}, undefined);

        if (!result) {
            return c.text('Post not found', 404);
        }

        // Import PDF product dynamically
        const { PdfProduct } = await import('../../pdf/index.js');
        const pdfProduct = new PdfProduct();

        // Use the existing PDF generation logic from the PDF product
        const mockContext = {
            req: {
                param: (name: string) => {
                    if (name === 'id') return id;
                    return c.req.param(name);
                },
                header: (name: string) => c.req.header(name)
            },
            header: (name: string, value: string) => c.header(name, value),
            body: (data: any) => c.body(data),
            text: (text: string) => c.text(text, 500)
        } as any;

        return await pdfProduct.handleRenderPdf(mockContext);
    } catch (err: any) {
        logger.error({ err }, 'Post PDF export failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetPostJson(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        let id = c.req.param('id');

        // Strip .json extension if present (due to regex match)
        if (id && id.endsWith('.json')) {
            id = id.slice(0, -5);
        }

        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const { data: result } = await fetchPostDetailsServer(supabase, id, {}, undefined);

        if (!result) {
            return c.json({ error: 'Post not found' }, 404);
        }

        // Fetch user profile
        const { fetchUserProfilesCached } = await import('./db-user.js');
        const profiles = await fetchUserProfilesCached(supabase, [result.user_id]);
        const userProfile = profiles[result.user_id];

        return c.json({ post: result, userProfile });
    } catch (err: any) {
        logger.error({ err }, 'Post JSON export failed');
        return c.json({ error: 'Internal Server Error' }, 500);
    }
}

export async function handleGetPostHtml(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        let id = c.req.param('id');

        // Strip .html extension if present (due to regex match)
        if (id && id.endsWith('.html')) {
            id = id.slice(0, -5);
        }

        const { data: result } = await fetchPostDetailsServer(supabase, id, {}, undefined);

        if (!result) {
            return c.text('Post not found', 404);
        }
        // Use template injection approach like post meta handler
        const { loadTemplate, inject, extractDisplayImage } = await import('../renderer.js');

        const template = await loadTemplate();

        if (!template) {
            return c.text('Template not found', 500);
        }

        const imageCandidate = extractDisplayImage(result.pictures);
        const imageUrl = imageCandidate?.imageUrl || (result.pictures && result.pictures[0]?.image_url);

        const meta = {
            title: result.title || 'Untitled Post',
            description: result.description || '',
            image: imageUrl,
            url: `${process.env.SERVER_URL || 'https://polymech.info'}/post/${result.id}`
        };

        const html = inject(template, meta);

        c.header('Content-Type', 'text/html');
        return c.body(html);
    } catch (err: any) {
        logger.error({ err }, 'Post HTML export failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetPostMarkdown(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        let id = c.req.param('id');

        // Strip .md extension if present (due to regex match)
        if (id && id.endsWith('.md')) {
            id = id.slice(0, -3);
        }

        const { data: result } = await fetchPostDetailsServer(supabase, id, {}, undefined);

        if (!result) {
            return c.text('Post not found', 404);
        }

        // Generate markdown from post
        let markdown = `# ${result.title || 'Untitled Post'}\n\n`;

        if (result.description) {
            markdown += `${result.description}\n\n`;
        }

        // Add images
        if (result.pictures && result.pictures.length > 0) {
            markdown += `## Images\n\n`;
            result.pictures.forEach((pic: any, index: number) => {
                const title = pic.title || `Image ${index + 1}`;
                markdown += `![${title}](${pic.image_url})\n\n`;
                if (pic.description) {
                    markdown += `*${pic.description}*\n\n`;
                }
            });
        }

        markdown += `\n---\n\nCreated: ${new Date(result.created_at).toLocaleDateString()}\n`;

        return c.text(markdown, 200, { 'Content-Type': 'text/markdown' });
    } catch (err: any) {
        logger.error({ err }, 'Post Markdown export failed');
        return c.text('Internal Server Error', 500);
    }
}
