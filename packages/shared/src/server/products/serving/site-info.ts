import * as cheerio from 'cheerio';
import { logger } from './logger.js';

export interface SiteInfoError {
    error: string;
    details?: string;
    status?: number;
}

export interface SiteImage {
    src: string;
    width?: number;
    height?: number;
    alt?: string;
}

export interface SiteSocial {
    source: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'other';
    url: string;
}

export interface SitePageInfo {
    title: string;
    description: string;
    image: string | null;
    url: string;
}

export interface SiteInfoResult {
    // Normalized Page Info
    page: SitePageInfo;

    // Raw/Extended Data
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    favicon?: string;

    // OpenGraph
    og?: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
        type?: string;
        site_name?: string;
        [key: string]: string | undefined;
    };

    // Images found on page
    images?: SiteImage[];

    // Structured Data (JSON-LD)
    structuredData?: any[];

    // Social Links found
    social?: SiteSocial[];
}

interface SiteInfoResolver {
    test(url: URL): boolean;
    resolve(url: URL, options: { timeout?: number }): Promise<SiteInfoResult>;
}

// --- Resolvers ---

class DefaultResolver implements SiteInfoResolver {
    test(url: URL): boolean {
        return true;
    }

    async resolve(url: URL, options: { timeout?: number }): Promise<SiteInfoResult> {
        return fetchAndParse(url, options);
    }
}

class YouTubeResolver implements SiteInfoResolver {
    test(url: URL): boolean {
        return url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be');
    }

    async resolve(url: URL, options: { timeout?: number }): Promise<SiteInfoResult> {
        let videoId = this.getVideoId(url);
        // Special case for shorts
        if (!videoId && url.pathname.startsWith('/shorts/')) {
            videoId = url.pathname.slice(8); // remove /shorts/
        }

        if (!videoId) {
            // Fallback for channel pages etc
            return fetchAndParse(url, options);
        }

        let oEmbedData: any = null;
        try {
            // Ref: https://www.youtube.com/oembed?url=...&format=json
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.href)}&format=json`;
            const response = await fetch(oEmbedUrl);
            if (response.ok) {
                oEmbedData = await response.json();
            }
        } catch (e) {
            // Ignore oEmbed failure
        }

        const title = oEmbedData?.title || 'YouTube Video';
        const description = ''; // oEmbed doesn't give description usually
        const author = oEmbedData?.author_name || '';

        // Generate thumbnails
        const thumbnails = this.getThumbnails(videoId);
        const images: SiteImage[] = [
            { src: thumbnails.max, width: 1280, height: 720 }, // Try max res first
            { src: thumbnails.high, width: 480, height: 360 },
            { src: thumbnails.medium, width: 320, height: 180 },
            { src: thumbnails.default, width: 120, height: 90 }
        ];

        // Ensure we supply the best image as the page image
        const bestImage = thumbnails.max;

        const result: SiteInfoResult = {
            page: {
                title: title,
                description: description,
                image: bestImage,
                url: url.href
            },
            title: title + (author ? ` - ${author}` : ''),
            description: description,
            url: url.href,
            siteName: 'YouTube',
            images: images,
            og: {
                title: title,
                image: bestImage,
                url: url.href,
                site_name: 'YouTube',
                type: 'video.other' // or video
            }
        };

        if (oEmbedData?.html) {
            // We can store embed html if needed in meta?
            // For now just standard fields.
        }

        return result;
    }

    private getVideoId(url: URL): string | null {
        if (url.hostname.includes('youtu.be')) {
            return url.pathname.slice(1);
        }
        if (url.hostname.includes('youtube.com')) {
            const v = url.searchParams.get('v');
            if (v) return v;
            // Handle embed/v paths?
        }
        return null;
    }

    private getThumbnails(videoId: string) {
        return {
            default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
            medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            max: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        };
    }
}

class TikTokResolver implements SiteInfoResolver {
    test(url: URL): boolean {
        return url.hostname.includes('tiktok.com');
    }

    async resolve(url: URL, options: { timeout?: number }): Promise<SiteInfoResult> {
        try {
            // Dynamic import to avoid issues if the package causes trouble in other environments
            // or use standard import if confident. Let's use standard import at top of file, 
            // but for now I'll use require or dynamic import if I can't change top of file easily 
            // without reading it all again.
            // Actually I can add the import at the top in a separate chunk.

            const { TikTokClient } = await import('@ssut/tiktok-api');
            const client = new TikTokClient({ region: 'US' });

            const videoId = this.getVideoId(url);
            if (!videoId) {
                throw new Error('Could not extract TikTok Video ID');
            }

            const post = await client.getPost(videoId); // post is the full object
            if (!post) {
                throw new Error('No post data returned from TikTok API');
            }

            // Map data based on user request and post.json structure
            // post.data is the main wrapper?
            // In post.json: root object has "data".
            // getPost returns "Promise<any>" usually? 
            // Looking at test.ts: client.getPost returns the object that has "data"?
            // test.ts: 
            // const post2 = await client.getPost(...)
            // writeFileSync(..., JSON.stringify(post2, null, 2))
            // post.json starts with { "data": { ... } }
            // So post2 IS the object containing "data".

            const data = post.data;
            if (!data) {
                throw new Error('No data property in TikTok response');
            }

            const title = data.author?.nickname || data.author?.uniqueId || 'TikTok Author';
            const description = data.desc || ''; // requested: "empty for now"
            const image = data.video?.cover || data.music?.coverLarge || null;

            const result: SiteInfoResult = {
                page: {
                    title,
                    description,
                    image,
                    url: url.href
                },
                images: [],
                title,
                description,
                url: url.href,
                siteName: 'TikTok'
            };

            if (image) {
                result.images?.push({ src: image });
            }

            return result;

        } catch (e: any) {
            // Fallback to default fetch if API fails (or just throw?)
            // DefaultResolver might work better for valid OGs if API fails.
            // But let's just log and fallback to fetchAndParse?
            // user requested extending site-info, implies this should be the primary way.
            // If it fails, maybe return basic info?

            // If API fails, maybe try standard fetch?
            return fetchAndParse(url, options);
        }
    }

    private getVideoId(url: URL): string | null {
        // format: https://www.tiktok.com/@user/video/7218894668518933510
        // pathname: /@user/video/7218894668518933510
        const parts = url.pathname.split('/');
        // parts: ["", "@user", "video", "id"]
        return parts[parts.length - 1];
    }
}

const REGISTRY: SiteInfoResolver[] = [
    new YouTubeResolver(),
    new TikTokResolver(),
    new DefaultResolver() // Catch-all
];

// --- Core Logic ---

async function fetchAndParse(targetUrl: URL, options: { timeout?: number }): Promise<SiteInfoResult> {
    const timeout = options.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(targetUrl.toString(), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PolymechBot/1.0; +http://polymech.com)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw { error: `Failed to fetch URL: ${response.statusText}`, status: response.status };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const result: SiteInfoResult = {
        page: { title: '', description: '', image: null, url: targetUrl.href },
        images: [],
        structuredData: [],
        social: [],
        og: {}
    };

    // 1. Basic Meta
    const title = $('title').text().trim();
    if (title) result.title = title;

    const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content');
    if (description) result.description = description;

    const canonical = $('link[rel="canonical"]').attr('href');
    result.url = canonical || response.url; // Use canonical if valid, else final URL
    // Update normalized url
    result.page.url = result.url;

    // Favicon
    const favicon = $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        '/favicon.ico';
    if (favicon) {
        try {
            result.favicon = new URL(favicon, result.url).href;
        } catch (e) {
            // ignore invalid urls
        }
    }

    // 2. Open Graph
    const ogProps = ['title', 'description', 'image', 'url', 'site_name', 'type'];
    ogProps.forEach(prop => {
        const val = $(`meta[property="og:${prop}"]`).attr('content');
        if (val && result.og) {
            result.og[prop] = val;
        }
    });

    // Fill top-level fields from OG if missing
    if (!result.title && result.og?.title) result.title = result.og.title;
    if (!result.description && result.og?.description) result.description = result.og.description;
    if (!result.siteName && result.og?.site_name) result.siteName = result.og.site_name;

    // 3. JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            result.structuredData?.push(json);
        } catch (e) {
            // ignore parse errors
        }
    });

    // 4. Images
    // Prioritize og:image
    if (result.og?.image) {
        result.images?.push({ src: result.og.image });
    }

    // Look for other useful images (e.g., twitter:image)
    const twitterImg = $('meta[name="twitter:image"]').attr('content');
    if (twitterImg && twitterImg !== result.og?.image) {
        result.images?.push({ src: twitterImg });
    }

    // Scan img tags (limit to first few relevant ones to avoid junk)
    $('img').slice(0, 10).each((_, el) => {
        let src = $(el).attr('src');
        if (src) {
            try {
                src = new URL(src, result.url).href;
                // Avoid dups
                if (!result.images?.find(i => i.src === src)) {
                    result.images?.push({ src, alt: $(el).attr('alt') });
                }
            } catch (e) {
                // ignore
            }
        }
    });

    // 5. Social Links (Common patterns)
    const socialPatterns: Record<string, string> = {
        'twitter.com': 'twitter',
        'facebook.com': 'facebook',
        'instagram.com': 'instagram',
        'linkedin.com': 'linkedin',
        'youtube.com': 'youtube'
    };

    $('a').each((_, el) => {
        let href = $(el).attr('href');
        if (href) {
            try {
                href = new URL(href, result.url).href;
                const hostname = new URL(href).hostname;

                for (const [domain, source] of Object.entries(socialPatterns)) {
                    if (hostname.includes(domain)) {
                        // Check if not already added
                        if (!result.social?.find(s => s.url === href)) {
                            result.social?.push({ source: source as any, url: href });
                        }
                        break;
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    });

    // Normalize Page Info
    result.page.title = result.title || '';
    result.page.description = result.description || '';
    result.page.image = result.og?.image || (result.images && result.images.length > 0 ? result.images[0].src : null);

    return result;
}

export async function extractSiteInfo(url: string, options: { timeout?: number } = {}): Promise<SiteInfoResult> {
    try {
        const targetUrl = new URL(url);

        for (const resolver of REGISTRY) {
            if (resolver.test(targetUrl)) {
                return await resolver.resolve(targetUrl, options);
            }
        }

        // Should not happen due to DefaultResolver
        throw new Error('No resolver found');

    } catch (e: any) {
        logger.error({ err: e, url }, 'Failed to extract site info');
        throw { error: 'Failed to extract site info', details: e.message, status: e.status || 500 };
    }
}
