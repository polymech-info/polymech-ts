import { SupabaseClient } from '@supabase/supabase-js';
import { Context } from 'hono';
import { logger } from './logger.js';
import { generateRSS, generateMerchantXML, generateLLMText, generateSitemapXML } from './generators.js';
import { loadTemplate, inject, extractDisplayImage } from './renderer.js';
import { renderPageContent } from './db/db-pages.js';
import { ensureCachedImageFromUrl, CACHE_DIR } from '../images/index.js';
import { VIDEO_JOB_NAME } from '../videos/worker.js';
import { PgBoss } from 'pg-boss';
import { z } from '@hono/zod-openapi';
import { createRouteBody } from './routes.js';

// Utils
export const safeStringify = (data: any) => {
    return JSON.stringify(data).replace(/</g, '\\u003c');
};

// --- Shared Logic ---

export async function augmentPosts(supabase: SupabaseClient, posts: any[], profilesMap: Record<string, any>, options: { sizesStr?: string, formatsStr?: string }, boss?: PgBoss) {
    // Feature Flags
    const includeAuthor = process.env.FEED_INCLUDE_AUTHOR !== 'false';
    const includeResponsive = process.env.FEED_INCLUDE_RESPONSIVE_IMAGES !== 'false' && process.env.ENABLE_SERVER_IMAGE_OPTIMIZATION === 'true';
    const includeLikes = process.env.FEED_INCLUDE_LIKES !== 'false';
    const includeComments = process.env.FEED_INCLUDE_COMMENTS !== 'false';

    const { sizesStr, formatsStr } = options;

    return Promise.all(posts.map(async post => {
        // 0. Handle Link Posts (Virtual Picture)
        if (!post.pictures || post.pictures.length === 0) {
            const settings = post.settings || {};
            if (settings && settings.link) {
                const virtualPic = {
                    id: post.id,
                    picture_id: post.id,
                    title: post.title,
                    description: post.description,
                    image_url: settings.image_url || 'https://picsum.photos/seed/' + post.id + '/600/400',
                    thumbnail_url: settings.thumbnail_url || null,
                    type: 'page-external',
                    meta: { url: settings.link },
                    created_at: post.created_at,
                    user_id: post.user_id,
                    likes_count: 0,
                    comments: [{ count: 0 }],
                    visible: true,
                    is_selected: false,
                    position: 0
                };
                post.pictures = [virtualPic];
            }
        }

        const pics = await Promise.all((post.pictures || []).map(async (p: any) => {
            // Generate Responsive Object if enabled
            if (includeResponsive) {
                const baseUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

                // Priority: Query > Env > Hardcoded
                const envSizes = process.env.DEFAULT_IMAGE_SIZES ? process.env.DEFAULT_IMAGE_SIZES.split(',').map(Number) : [320, 640, 1024];
                const envFormats = process.env.DEFAULT_IMAGE_FORMATS ? process.env.DEFAULT_IMAGE_FORMATS.split(',') : ['avif', 'webp'];

                const sizes = sizesStr ? sizesStr.split(',').map(Number) : envSizes;
                const formats = formatsStr ? formatsStr.split(',') : envFormats;

                const meta = p.meta || {};
                const aspect = (meta.width && meta.height) ? meta.height / meta.width : 0;

                const isVideo = ['mux-video', 'youtube', 'tiktok', 'video-intern'].includes(p.type);
                const sourceUrl = (isVideo && p.thumbnail_url) ? p.thumbnail_url : p.image_url;

                if (sourceUrl) {
                    try {
                        const makeUrl = async (w: number, fmt: string) => {
                            const h = aspect ? Math.round(w * aspect) : undefined;
                            const filename = await ensureCachedImageFromUrl(sourceUrl, w, h, fmt);
                            return `${baseUrl}/api/images/cache/${filename}`;
                        }

                        const sources = await Promise.all(formats.map(async fmt => ({
                            type: `image/${fmt}`,
                            srcset: (await Promise.all(sizes.map(async s => {
                                const url = await makeUrl(s, fmt);
                                return `${url} ${s}w`;
                            }))).join(', ')
                        })));

                        // Fallback (largest AVIF)
                        const fallbackWidth = 1024;
                        const fallbackHeight = aspect ? Math.round(fallbackWidth * aspect) : 0;
                        const fallbackSrc = await makeUrl(fallbackWidth, 'avif');

                        p.responsive = {
                            img: {
                                src: fallbackSrc,
                                width: fallbackWidth,
                                height: fallbackHeight,
                                format: 'avif'
                            },
                            sources
                        };

                        // User Request: image_url should be the resolved url of our response image endpoint
                        p.image_url = fallbackSrc;

                    } catch (e) {
                        logger.error({ err: e, sourceUrl }, 'Failed to eager load image for feed');
                    }
                }

                // Attach Job Data for Internal Videos
                if (p.type === 'video-intern' && boss) {
                    const jobId = p.meta?.mux_playback_id;
                    if (jobId) {
                        try {
                            // @ts-ignore
                            const job = await boss.getJobById(VIDEO_JOB_NAME, jobId);
                            if (job) {
                                const status = job.state;
                                const result = job.output as any;
                                const baseUrl = process.env.SERVER_IMAGE_API_URL || process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';

                                const resultUrl = status === 'completed'
                                    ? `${baseUrl}/api/videos/jobs/${job.id}/hls/playlist.m3u8`
                                    : undefined;

                                p.job = {
                                    id: job.id,
                                    status: status,
                                    progress: status === 'completed' ? 100 : 0,
                                    resultUrl,
                                    error: null
                                };
                            }
                        } catch (err) {
                            logger.error({ err, jobId }, 'Failed to fetch video job status');
                        }
                    }
                }
            }

            return p;
        }));

        // Aggregate likes from pictures
        const likesCount = includeLikes
            ? pics.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0)
            : 0;

        const commentsCount = includeComments ? 0 : 0;

        return {
            ...post,
            pictures: pics,
            likes_count: likesCount,
            comments_count: commentsCount,
            author: includeAuthor ? (profilesMap[post.user_id] || null) : null
        };
    }));
}

export function applyClientSortAndCovers(posts: any[], sortBy: 'latest' | 'top') {
    // 1. Update Covers
    const postsWithCovers = posts.map(post => {
        if (!post.pictures || post.pictures.length === 0) return null;

        const validPics = post.pictures.filter((p: any) => p.visible !== false);
        if (validPics.length === 0) return null;

        let newCover;
        if (sortBy === 'latest') {
            // Newest picture
            newCover = validPics.reduce((newest: any, current: any) => {
                const newestDate = new Date(newest.created_at || post.created_at).getTime();
                const currentDate = new Date(current.created_at || post.created_at).getTime();
                return currentDate > newestDate ? current : newest;
            }, validPics[0]);
        } else {
            // Top/Default: First by position (existing behavior)
            const sortedByPosition = [...validPics].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
            newCover = sortedByPosition[0];
        }

        return { ...post, cover: newCover };
    }).filter(Boolean);

    // 2. Sort Posts
    const sorted = [...postsWithCovers];
    if (sortBy === 'top') {
        sorted.sort((a: any, b: any) => {
            const likesA = a.likes_count || 0;
            const likesB = b.likes_count || 0;
            if (likesB !== likesA) return likesB - likesA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } else {
        // latest
        sorted.sort((a: any, b: any) => {
            const latestPicDateA = a.pictures && a.pictures.length > 0
                ? Math.max(...a.pictures.map((p: any) => new Date(p.created_at || a.created_at).getTime()))
                : new Date(a.created_at).getTime();

            const latestPicDateB = b.pictures && b.pictures.length > 0
                ? Math.max(...b.pictures.map((p: any) => new Date(p.created_at || b.created_at).getTime()))
                : new Date(b.created_at).getTime();

            return latestPicDateB - latestPicDateA;
        });
    }

    return sorted;
}

// --- Handlers ---

export async function handleGetFeedXml(c: Context) {
    try {
        const { supabase } = await import('../../commons/supabase.js');
        const { fetchFeedPostsServer } = await import('./db/index.js');

        // Fetch feed data using the same logic as /api/feed
        const posts = await fetchFeedPostsServer(supabase, {
            page: 0,
            limit: 20,
            sortBy: 'latest'
        });

        const xml = generateRSS(posts || []);
        c.header('Content-Type', 'application/xml');
        return c.body(xml);
    } catch (err: any) {
        logger.error({ err }, 'RSS Feed generation failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetMerchantFeed(c: Context) {
    try {
        const { supabase } = await import('../../commons/supabase.js');
        const { data: products, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        const xml = generateMerchantXML(products || []);
        c.header('Content-Type', 'application/xml');
        return c.body(xml);
    } catch (err: any) {
        logger.error({ err }, 'Merchant Feed generation failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetLLMText(c: Context) {
    try {
        const { supabase } = await import('../../commons/supabase.js');
        // Fetch posts with pictures instead of trying to join profiles
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*, pictures(image_url)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Manual Join for Profiles
        const userIds = Array.from(new Set((posts || []).map((p: any) => p.user_id).filter(Boolean))) as string[];
        let userMap: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, username')
                .in('user_id', userIds);

            if (profiles) {
                profiles.forEach((p: any) => {
                    userMap[p.user_id] = p.username;
                });
            }
        }

        // Map Data for Generator
        const mappedPosts = (posts || []).map((p: any) => {
            const authorName = userMap[p.user_id] || 'Unknown';
            // Use first picture as main image if available
            const imageUrl = (p.pictures && p.pictures.length > 0) ? p.pictures[0].image_url : null;
            return { ...p, author_name: authorName, image_url: imageUrl };
        });

        const text = generateLLMText(mappedPosts);
        c.header('Content-Type', 'text/plain');
        return c.body(text);
    } catch (err: any) {
        logger.error({ err }, 'LLM Text generation failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetSitemap(c: Context) {
    try {
        const { supabase } = await import('../../commons/supabase.js');
        // Fetch public pages
        const { data: pages, error } = await supabase
            .from('pages')
            .select('slug, owner, created_at, updated_at')
            .eq('is_public', true)
            .eq('visible', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const xml = generateSitemapXML(pages || []);
        c.header('Content-Type', 'application/xml');
        return c.body(xml);
    } catch (err: any) {
        logger.error({ err }, 'Sitemap generation failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetSiteInfo(c: Context) {
    const url = c.req.query('url');
    if (!url) return c.json({ error: 'URL is required' }, 400);

    try {
        const { extractSiteInfo } = await import('./site-info.js');
        const info = await extractSiteInfo(url);
        return c.json(info);
    } catch (err: any) {
        logger.error({ err, url }, 'Site info extraction failed');
        return c.json({ error: 'Failed to extract site info', details: err.message }, err.status || 500);
    }
}

export async function handleGetPostMeta(c: Context) {
    const id = c.req.param('id');
    try {
        // 1. Load HTML Template
        const html = await loadTemplate();
        if (!html) {
            logger.error('handleGetPostMeta:Template not found');
            return c.text('handleGetPostMeta:Template not found', 500);
        }

        // 2. Fetch Data
        const { supabase } = await import('../../commons/supabase.js');
        const { data: post, error } = await supabase
            .from('posts')
            .select('*, pictures(*)')
            .eq('id', id)
            .single();

        logger.info({ postId: id, found: !!post, error }, 'Fetched post for meta injection');
        if (error || !post) {
            logger.error({ error }, 'Failed to fetch post for meta injection');
            // If not found, serve the plain HTML so client handles 404
            return c.html(html);
        }

        // Fetch Author separately (Relationship not detected automatically)
        let authorName = "Polymech User";
        if (post.user_id) {
            const { data: author } = await supabase
                .from('profiles')
                .select('username, display_name')
                .eq('user_id', post.user_id)
                .single();

            if (author) {
                authorName = author.display_name || author.username || "Polymech User";
            }
        }

        // 3. Inject
        // Strategy: Look at the first picture/media in the gallery. 
        // For videos, use the thumbnail. For images, use the image_url.
        // Fallback to post.thumbnail_url or post.image_url if gallery empty.
        let imageUrl: string | null = null;
        let firstPic: any = null;

        if (post.pictures && Array.isArray(post.pictures) && post.pictures.length > 0) {
            // Sort by position if available, otherwise just take the first
            const sortedPics = post.pictures.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
            firstPic = sortedPics[0];

            // Identify video types to prefer thumbnail
            const isVideo = ['video', 'youtube', 'tiktok', 'video-intern'].includes(firstPic.type);

            if (isVideo && firstPic.thumbnail_url) {
                imageUrl = firstPic.thumbnail_url;
            } else {
                imageUrl = firstPic.image_url;
            }
        }

        if (!imageUrl) {
            // Fallback to post metadata
            imageUrl = post.thumbnail_url || post.image_url;
        }

        // Construct Smart Render URL
        // Instead of pre-fetching, we use the /api/images/render endpoint which handles resizing lazily
        // This is faster for the initial request and ensures compliance with resolution limits
        let finalImageUrl = imageUrl;
        if (imageUrl) {
            const baseUrl = process.env.SERVER_IMAGE_API_URL || 'http://localhost:3333';
            // Use limit < 1024 as requested
            finalImageUrl = `${baseUrl}/api/images/render?url=${encodeURIComponent(imageUrl)}&width=1024&format=jpeg`;
        }

        // Helpers for Text
        const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max - 1) + '…' : str;



        // Title Logic
        // Priority: Post Title -> Picture Title -> "Shared Post"
        const contentTitle = post.title || firstPic?.title || "Shared Post";
        const pageTitle = `${truncate(contentTitle, 50)} by ${truncate(authorName, 20)} | PolyMech`;

        // Description Logic
        // Include description, titles, and site default
        const rawDesc = post.description || firstPic?.description || "";
        // If no description, verify if we used a fallback title for the main title?
        // Just append: "[Title] - [Description] by [Author]"

        let description = rawDesc;
        if (!description) {
            // If no description, maybe use title again or just generic
            description = `Check out this post by ${authorName}.`;
        } else {
            description = `${truncate(description, 120)}... by ${authorName}`;
        }

        // Append context if space allows or just rely on og:title for the main context
        // Standard approach: Description should be the summary. 
        // "Title: <Title>"
        // "Desc: <Desc>"

        const meta = {
            title: pageTitle,
            description: description,
            image: finalImageUrl || undefined,
            jsonLd: {
                "@context": "https://schema.org",
                "@type": "SocialMediaPosting",
                "headline": truncate(contentTitle, 100),
                "image": [finalImageUrl || undefined],
                "datePublished": post.created_at,
                "author": {
                    "@type": "Person",
                    "name": authorName
                },
                "description": description
            }
        };

        const injectedHtml = inject(html, meta);
        return c.html(injectedHtml);


    } catch (err: any) {
        logger.error({ err }, 'Meta injection failed');
        // Fallback to serving the file without injection
        const html = await loadTemplate();
        return c.html(html || 'Error loading application');
    }
}

export async function handleGetEmbed(c: Context, boss?: PgBoss) {
    const id = c.req.param('id');
    try {
        // 1. Load Embed Template
        // Ensure we look for 'embed.html'
        const html = await loadTemplate('embed.html');

        if (!html) {
            logger.error('handleGetEmbed:Embed template not found');
            return c.text('handleGetEmbed:Embed template not found', 500);
        }

        // 2. Fetch Data (similar to handleGetPostMeta but we need full data for the app)
        const { supabase } = await import('../../commons/supabase.js');

        // We need: Post, Pictures, Author
        const { data: post, error } = await supabase
            .from('posts')
            .select('*, pictures(*)')
            .eq('id', id)
            .single();

        if (error || !post) {
            return c.text('Post not found', 404);
        }

        // Fetch Author
        const { data: author } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', post.user_id)
            .single();

        // 3. Augment with Responsive Images and Full Data
        const profilesMap = { [post.user_id]: author };
        const augmentedPosts = await augmentPosts(supabase, [post], profilesMap, {}, boss);
        const augmentedPost = augmentedPosts[0];

        const initialState = {
            post: augmentedPost,
            mediaItems: augmentedPost.pictures,
            authorProfile: author
        };

        const injectionScript = {
            id: 'initial-state',
            content: `window.__INITIAL_STATE__ = ${safeStringify(initialState)};`
        };

        const injected = inject(html, {
            title: post.title || 'Embed',
            description: post.description,
            scripts: [injectionScript]
        });

        // Allow iframe
        // c.header('X-Frame-Options', 'ALLOWALL'); // Deprecated but helpful
        // Content-Security-Policy frame-ancestors * handled by omission or explicit set

        return c.html(injected);
    } catch (err: any) {
        logger.error({ err }, 'Embed injection failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetEmbedPage(c: Context) {
    const id = c.req.param('id');
    try {
        // 1. Load Embed Template
        const html = await loadTemplate('embed.html');
        if (!html) return c.text('Embed template not found', 500);

        // 2. Fetch Data
        const { supabase } = await import('../../commons/supabase.js');
        const { data: page, error } = await supabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !page) return c.text('Page not found', 404);

        const { data: author } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', page.owner)
            .single();

        // 3. Render Content for Initial State
        const { markdown, images } = await renderPageContent(page.content);

        const initialState = {
            page: { ...page, content: markdown },
            // We might need to adjust what the frontend expects for a "Page" embed vs "Post"
            // Assuming main-embed.tsx can handle "page" or "post" in initialState or we normalize it.
            // For now sending as 'page' property.
            authorProfile: author
        };

        const injectionScript = {
            id: 'initial-state',
            content: `window.__INITIAL_STATE__ = ${safeStringify(initialState)};`
        };

        const injected = inject(html, {
            title: page.title || 'Embed',
            description: page.description,
            scripts: [injectionScript]
        });

        return c.html(injected);
    } catch (err: any) {
        logger.error({ err }, 'Page Embed injection failed');
        return c.text('Internal Server Error', 500);
    }
}
