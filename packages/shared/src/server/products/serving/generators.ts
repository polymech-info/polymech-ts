import { Feed } from 'feed';

/**
 * Escape XML entities in URLs within the RSS feed
 * The feed library doesn't always properly escape URLs in enclosure tags
 */
function escapeXmlUrls(xml: string): string {
    // Fix unescaped ampersands in URLs within enclosure and other tags
    // Match url="..." patterns and escape & to &amp; within them
    return xml.replace(/url="([^"]*)"/g, (match, url) => {
        const escapedUrl = url.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
        return `url="${escapedUrl}"`;
    });
}

export const generateRSS = (posts: any[]): string => {
    const baseUrl = process.env.SERVER_URL || 'https://polymech.info';

    const feed = new Feed({
        title: "Polymech Feed",
        description: "Latest updates and photos",
        id: `${baseUrl}/`,
        link: `${baseUrl}/`,
        language: "en",
        image: `${baseUrl}/logo.png`,
        favicon: `${baseUrl}/favicon.ico`,
        copyright: "All rights reserved 2025, Polymech",
        updated: new Date(),
        generator: "Polymech Serving Product",
        feedLinks: {
            json: `${baseUrl}/feed.json`,
            atom: `${baseUrl}/feed.atom`
        },
        author: {
            name: "Polymech",
            email: "contact@polymech.info",
            link: baseUrl
        }
    });


    posts.forEach(post => {
        // Use display_image (from OG image extraction) or fallback to first picture
        const imageUrl = post.display_image || (post.pictures && post.pictures[0]?.image_url);

        // Create rich description with image for better RSS reader compatibility
        let description = post.description || '';
        let content = post.description || '';

        // Add image to description if available (many RSS readers prefer this)
        if (imageUrl) {
            const imageHtml = `<img src="${imageUrl}" alt="${post.title || ''}" style="max-width: 100%; height: auto;" />`;
            description = imageHtml + (description ? `<br/><br/>${description}` : '');
            content = imageHtml + (content ? `<br/><br/>${content}` : '');
        }

        feed.addItem({
            title: post.title,
            id: post.id,
            link: `${baseUrl}/post/${post.id}`,
            description: description,
            content: content,
            author: [
                {
                    name: post.author_name || "Unknown",
                    email: "user@polymech.info"
                }
            ],
            date: new Date(post.created_at),
            image: imageUrl  // This creates the enclosure tag
        });
    });

    // Generate RSS and escape XML entities in URLs
    const rss = feed.rss2();
    return escapeXmlUrls(rss);
};

export const generateMerchantXML = (products: any[]): string => {
    // Basic Google Merchant XML implementation
    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Polymech Store</title>
<link>https://polymech.info</link>
<description>Polymech Media Store</description>
`;

    products.forEach(p => {
        xml += `<item>
<g:id>${p.id}</g:id>
<g:title>${escapeXml(p.title)}</g:title>
<g:description>${escapeXml(p.description)}</g:description>
<g:link>https://polymech.info/post/${p.id}</g:link>
<g:image_link>${p.image_url}</g:image_link>
<g:condition>new</g:condition>
<g:availability>in stock</g:availability>
<g:price>0.00 USD</g:price>
</item>
`;
    });

    xml += `</channel></rss>`;
    return xml;
};

export const generateLLMText = (posts: any[]): string => {
    const baseUrl = process.env.SERVER_URL || 'https://polymech.info';

    let md = `# Polymech Media Platform

> A full-stack media platform for sharing photos, videos, and articles with advanced content management, widget-based page building, and multi-format export capabilities.

Polymech is a modern media platform built with React, Hono, and Supabase. It supports rich content creation through a flexible widget system, category management, and multiple export formats (HTML, PDF, Markdown, JSON).

## Documentation

- [API Documentation](${baseUrl}/api/reference): Complete API reference with OpenAPI/Scalar interface
- [Platform Overview](${baseUrl}/about.md): Architecture and key features

## Recent Content

`;

    // Add up to 10 most recent posts/pages as examples
    const recentPosts = posts.slice(0, 10);
    recentPosts.forEach(p => {
        const url = `${baseUrl}/post/${p.id}`;
        const title = p.title || 'Untitled';
        const author = p.author_name || 'Unknown';
        md += `- [${title}](${url}): by ${author}\n`;
    });

    md += `\n## Optional

- [RSS Feed](${baseUrl}/feed.xml): Subscribe to latest updates
- [Sitemap](${baseUrl}/sitemap.xml): Complete site structure
`;

    return md;
};

function escapeXml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export const generateSitemapXML = (pages: any[]): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    pages.forEach(page => {
        // Construct URL based on page type/conventions
        // Assuming pages are accessible at /user/:userId/pages/:slug or similar
        // Adjust logic if "page-internal" means something specific regarding URL structure
        // Based on routes: /user/:userId/pages/:slug or /org/:orgSlug/user/:userId/pages/:slug

        // For now, let's assume a standard user page URL structure
        // Ideally we should know the base URL, but generators are usually pure.
        // We'll use the one from RSS feed as base: https://polymech.info/


        let url = `https://polymech.info/user/${page.owner}/pages/${page.slug}`;

        xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${new Date(page.updated_at || page.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    xml += `</urlset>`;
    return xml;
};
