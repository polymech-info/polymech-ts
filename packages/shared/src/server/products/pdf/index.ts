
import { Context } from 'hono';
import { AbstractProduct } from '../AbstractProduct.js';
import PdfPrinter from 'pdfmake';
import { logger } from './logger.js';
import { renderPdfRoute, renderPdfPageRoute, getProbeRoute } from './routes.js';

// Define fonts
const fonts = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

export class PdfProduct extends AbstractProduct<any> {
    id = 'pdf';
    jobOptions = {};
    actions = {};
    workers: any[] = [];
    routes: any[] = [];
    hash = () => 'pdf-hash';
    meta = () => ({});
    printer: PdfPrinter;

    constructor() {
        super();
        this.printer = new PdfPrinter(fonts);
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.routes.push({
            definition: renderPdfRoute,
            handler: this.handleRenderPdf.bind(this)
        });
        this.routes.push({
            definition: renderPdfPageRoute,
            handler: this.handleRenderPagePdf.bind(this)
        });
        this.routes.push({
            definition: getProbeRoute,
            handler: this.handleProbe.bind(this)
        });
    }

    async handleProbe(c: Context) {
        return c.text('PDF Service OK');
    }

    async handleRenderPdf(c: Context) {
        const id = c.req.param('id');
        logger.info({ id }, 'Handling request for PDF');
        const serverUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
        const { supabase } = await import('../../commons/supabase.js');

        // 1. Fetch Post Data
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*, pictures(*)')
            .eq('id', id)
            .single();

        if (postError || !post) {
            logger.error({ id, error: postError }, 'Failed to fetch post for PDF');
            return c.text('Post not found', 404);
        }

        const { data: author } = await supabase.from('profiles').select('*').eq('user_id', post.user_id).single();

        // 2. Prepare content
        const docDefinition: any = {
            content: [],
            defaultStyle: {
                font: 'Roboto'
            },
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                description: {
                    fontSize: 12,
                    margin: [0, 0, 0, 20]
                },
                metadata: {
                    fontSize: 10,
                    color: 'gray',
                    margin: [0, 0, 0, 20]
                },
                imageCaption: {
                    fontSize: 12,
                    bold: true,
                    margin: [0, 5, 0, 2]
                },
                imageDesc: {
                    fontSize: 10,
                    color: '#444',
                    margin: [0, 0, 0, 20]
                }
            }
        };

        // Header
        docDefinition.content.push({ text: post.title || 'Untitled Gallery', style: 'header' });

        if (post.description) {
            docDefinition.content.push({ text: post.description, style: 'description' });
        }

        docDefinition.content.push({ text: `By ${author?.display_name || 'Author'}`, style: 'metadata' });

        // Images
        const pictures = (post.pictures || []).sort((a: any, b: any) => a.position - b.position);

        for (const pic of pictures) {
            const imageUrl = pic.image_url.startsWith('http')
                ? pic.image_url
                : `${serverUrl}/storage/v1/object/public/${pic.image_url}`;

            try {
                const response = await fetch(imageUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    docDefinition.content.push({
                        image: buffer,
                        width: 500,
                        margin: [0, 0, 0, 10]
                    });
                } else {
                    docDefinition.content.push({ text: `[Image: ${imageUrl}]`, color: 'blue', link: imageUrl });
                }
            } catch (e) {
                docDefinition.content.push({ text: `[Image error: ${imageUrl}]` });
            }

            if (pic.title && pic.title !== post.title) {
                docDefinition.content.push({ text: pic.title, style: 'imageCaption' });
            }
            if (pic.description && pic.description !== post.description) {
                docDefinition.content.push({ text: pic.description, style: 'imageDesc' });
            } else {
                docDefinition.content.push({ text: '', margin: [0, 0, 0, 20] });
            }
        }

        // 3. Render
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

        // Pipe to response
        return new Promise((resolve) => {
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => {
                const result = Buffer.concat(chunks);
                c.header('Content-Type', 'application/pdf');
                c.header('Content-Disposition', `inline; filename="${(post.title || 'export').replace(/[^a-z0-9]/gi, '_')}.pdf"`);
                resolve(c.body(result));
            });
            pdfDoc.end();
        });
    }

    async handleRenderPagePdf(c: Context) {
        const id = c.req.param('id');
        logger.info({ id }, 'Handling request for Page PDF');
        const { supabase } = await import('../../commons/supabase.js');

        // 1. Fetch Page Data
        const { data: page, error: pageError } = await supabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (pageError || !page) {
            logger.error({ id, error: pageError }, 'Failed to fetch page for PDF');
            return c.text('Page not found', 404);
        }

        const { data: author } = await supabase.from('profiles').select('*').eq('user_id', page.owner).single();

        // 2. Prepare content
        const docDefinition: any = {
            content: [
                {
                    toc: {
                        title: { text: 'Table of Contents', style: 'h2' }
                    }
                },
                { text: '', pageBreak: 'after' } // TOC on separate page
            ],
            defaultStyle: {
                font: 'Roboto'
            },
            styles: {
                header: {
                    fontSize: 24,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                h1: { fontSize: 22, bold: true, margin: [0, 10, 0, 5] },
                h2: { fontSize: 18, bold: true, margin: [0, 10, 0, 5] },
                h3: { fontSize: 16, bold: true, margin: [0, 8, 0, 5] },
                metadata: {
                    fontSize: 10,
                    color: 'gray',
                    margin: [0, 0, 0, 20]
                },
                para: {
                    fontSize: 12,
                    margin: [0, 0, 0, 10],
                    lineHeight: 1.3
                }
            }
        };

        // Header
        docDefinition.content.push({ text: page.title || 'Untitled Page', style: 'header' });
        docDefinition.content.push({ text: `By ${author?.display_name || 'Author'}`, style: 'metadata' });

        // Parse content
        let markdownContent = '';
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
                markdownContent = page.content; // Fallback
            }
        } catch (e) {
            logger.warn({ error: e, id }, 'Failed to parse page content structure, using raw');
            markdownContent = typeof page.content === 'string' ? page.content : JSON.stringify(page.content);
        }

        const lines = markdownContent.split('\n');
        const serverUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

        // Process lines sequentially to maintain order, allowing async image fetching
        for (const line of lines) {
            const trim = line.trim();
            if (!trim) continue;

            // Simple Image Regex: ![alt](url)
            const imageMatch = trim.match(/!\[(.*?)\]\((.*?)\)/);
            if (imageMatch) {
                let imageUrl = imageMatch[2];
                const alt = imageMatch[1];

                // Resolve relative URLs or non-http URLs
                if (!imageUrl.startsWith('http')) {
                    if (!imageUrl.startsWith('data:')) {
                        const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                        imageUrl = `${serverUrl}/${cleanPath}`;
                    }
                }

                try {
                    // Fetch image buffer
                    const response = await fetch(imageUrl);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        docDefinition.content.push({
                            image: buffer,
                            width: 500, // Reasonable default width for PDF
                            margin: [0, 10, 0, 10]
                        });

                        // Optional: Add caption
                        if (alt && alt.trim()) {
                            docDefinition.content.push({ text: alt, fontSize: 10, italics: true, alignment: 'center', margin: [0, 0, 0, 10] });
                        }
                    } else {
                        // Fallback to link if fetch fails
                        docDefinition.content.push({ text: `[Image: ${alt}]`, color: 'blue', link: imageUrl, margin: [0, 10, 0, 10] });
                    }
                } catch (e) {
                    logger.error({ error: e, imageUrl }, 'Failed to fetch image for PDF');
                    docDefinition.content.push({ text: `[Image Error: ${alt}]`, color: 'red', margin: [0, 10, 0, 10] });
                }
                continue;
            }

            if (trim.startsWith('# ')) {
                docDefinition.content.push({ text: trim.substring(2), style: 'h1', tocItem: true });
            } else if (trim.startsWith('## ')) {
                docDefinition.content.push({ text: trim.substring(3), style: 'h2', tocItem: true });
            } else if (trim.startsWith('### ')) {
                docDefinition.content.push({ text: trim.substring(4), style: 'h3', tocItem: true });
            } else if (trim.startsWith('- ')) {
                docDefinition.content.push({
                    ul: [trim.substring(2)],
                    margin: [10, 0, 0, 5]
                });
            } else {
                docDefinition.content.push({ text: trim, style: 'para' });
            }
        }

        // 3. Render
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

        // Pipe to response
        return new Promise((resolve) => {
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => {
                const result = Buffer.concat(chunks);
                c.header('Content-Type', 'application/pdf');
                c.header('Content-Disposition', `inline; filename="${(page.title || 'page').replace(/[^a-z0-9]/gi, '_')}.pdf"`);
                resolve(c.body(result));
            });
            pdfDoc.end();
        });
    }
}
