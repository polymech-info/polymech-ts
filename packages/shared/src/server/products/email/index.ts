
import { Context } from 'hono';
import { AbstractProduct } from '../AbstractProduct.js';
import fs from 'fs/promises';
import path from 'path';
import { renderEmailRoute, sendEmailRoute } from './routes.js';
import { fileURLToPath } from 'url';
import { substitute } from '@polymech/commons/variables'
import { logger } from './logger.js';
import { test as sendEmailTest } from '@polymech/mail';

// Cache templates in memory
const templates: Record<string, string> = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = process.env.EMAIL_TEMPLATES_DIR
    ? path.resolve(process.cwd(), process.env.EMAIL_TEMPLATES_DIR)
    : path.resolve(__dirname, '../../../templates/email');

const loadTemplate = async (name: string) => {
    if (templates[name]) return templates[name];
    try {
        const filePath = path.join(templatesDir, `${name}.html`);
        const content = await fs.readFile(filePath, 'utf-8');
        templates[name] = content;
        return content;
    } catch (e) {
        logger.error({ err: e, name, templatesDir }, `Failed to load template ${name}`);
        throw e;
    }
};



export class EmailProduct extends AbstractProduct<any> {
    id = 'email';
    jobOptions = {};
    actions = {};
    workers: any[] = [];
    routes: any[] = [];
    hash = () => 'email-hash';
    meta = () => ({});

    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.routes.push({
            definition: renderEmailRoute,
            handler: this.handleRenderEmail.bind(this)
        });
        this.routes.push({
            definition: sendEmailRoute,
            handler: this.handleSendEmail.bind(this)
        });
    }

    async generateEmailHtml(id: string, serverUrl: string) {
        logger.info({ id }, 'generateEmailHtml: Starting');
        // Dynamic import to avoid circular dep issues if any, though likely fine here
        const { supabase } = await import('../../commons/supabase.js');

        logger.info('generateEmailHtml: Supabase imported');

        // 1. Fetch Post Data
        logger.info({ id }, 'generateEmailHtml: Fetching post data');
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select(`
                *,
                pictures: pictures (
                    *
                )
            `)
            .eq('id', id)
            .single();


        if (postError || !post) {
            logger.error({ id, error: postError }, 'generateEmailHtml: Post not found or error');
            throw new Error('Post not found');
        }
        logger.info({ id, postTitle: post.title }, 'generateEmailHtml: Post found');

        // 2. Load Templates
        logger.info('generateEmailHtml: Loading templates');
        const bodyTmpl = await loadTemplate('body');
        const sectionTitleTmpl = await loadTemplate('section_title');
        const textTmpl = await loadTemplate('text');
        const imageXlTmpl = await loadTemplate('image_xl');
        const imageSmTextTmpl = await loadTemplate('image_sm_text');
        logger.info('generateEmailHtml: Templates loaded');

        // 3. Build Content
        let contentHtml = '';

        // Title
        contentHtml += substitute(false, sectionTitleTmpl, {
            title: post.title || 'Untitled Gallery'
        });

        // Description
        if (post.description) {
            contentHtml += substitute(false, textTmpl, {
                content: post.description
            });
        }

        // Media Items
        const pictures = (post.pictures || []).sort((a: any, b: any) => a.position - b.position);
        logger.info({ pictureCount: pictures.length }, 'generateEmailHtml: Processing pictures');

        for (const pic of pictures) {

            const imageUrl = pic.image_url.startsWith('http')
                ? pic.image_url
                : `${serverUrl}/storage/v1/object/public/${pic.image_url}`;

            if (pic.title || pic.description) {
                // Use Image + Text
                contentHtml += substitute(false, imageSmTextTmpl, {
                    'image': imageUrl,
                    'imageClass': 'imgSmall',
                    title: pic.title || '',
                    content: pic.description || '',
                    href: imageUrl,
                    hrefTitle: 'View Full Size'
                });
            } else {
                // Just Image (Large)
                contentHtml += substitute(false, imageXlTmpl, {
                    'image': imageUrl
                });
            }
        }

        // 4. Final Assembly
        logger.info('generateEmailHtml: Assembling final HTML');

        const fullHtml = substitute(false, bodyTmpl, {
            title: post.title || 'Polymech',
            color_bg: '#1f1f1f',
            SOURCE: contentHtml,
            mail: 'user@example.com',
            unsubscribe_link: '#'
        });

        logger.info('generateEmailHtml: Completed');
        return fullHtml;
    }

    async handleRenderEmail(c: Context) {
        const id = c.req.param('id');
        logger.info({ id }, 'Rendering email for post');
        const serverUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

        try {
            const html = await this.generateEmailHtml(id, serverUrl);
            return c.html(html);
        } catch (e: any) {
            if (e.message === 'Post not found') {
                return c.text('Post not found', 404);
            }
            throw e;
        }
    }

    async handleSendEmail(c: Context) {
        const id = c.req.param('id');
        logger.info({ id }, 'Sending email for post');
        const serverUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
        let body: any = {};
        try {
            body = await c.req.json();
        } catch (e) {
            // Ignore JSON parse error, use defaults

        }

        const to = body.to || process.env.TEST_EMAIL_TO || 'cgoflyn@gmail.com';
        const subject = body.subject || 'Polymech Gallery Export';

        try {
            const html = body.html || await this.generateEmailHtml(id, serverUrl);

            // Send email
            // Using 'ethereal' as transport, assuming it's configured in default config.
            // If strictly zero-config for the user means we should assume they have env vars or config set up for 'ethereal'.
            // Alternatively, we could default to 'smtp' if 'ethereal' fails, but let's stick to one.
            const info = await sendEmailTest({
                from: process.env.TEST_EMAIL_FROM || 'newsletter@osr-plastic.org',
                to,
                subject,
                html,
                transport: 'newsletter'
            });

            const ret = c.json({ success: true, messageId: info.messageId });
            return ret;
        } catch (e: any) {
            debugger
            logger.error({ err: e }, 'Failed to send email');
            if (e.message === 'Post not found') {
                return c.text('Post not found', 404);
            }
            return c.text('Failed to send email', 500);
        }
    }
}
