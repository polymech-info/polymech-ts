/**
 * Generates a simple, static HTML page for bots/crawlers
 * Contains proper meta tags but no JavaScript/SPA functionality
 */
export function generateStaticHtml(options: {
    title: string;
    description: string;
    image?: string;
    author: string;
    content: string;
    canonicalUrl?: string;
}): string {
    const { title, description, image, author, content, canonicalUrl } = options;

    // Escape HTML entities
    const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeAuthor = escapeHtml(author);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${safeTitle}">
    <meta name="description" content="${safeDescription}">
    <meta name="author" content="${safeAuthor}">
    ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    ${image ? `<meta property="og:image" content="${image}">` : ''}
    ${canonicalUrl ? `<meta property="og:url" content="${canonicalUrl}">` : ''}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    ${image ? `<meta name="twitter:image" content="${image}">` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${safeTitle}",
        "author": {
            "@type": "Person",
            "name": "${safeAuthor}"
        },
        "description": "${safeDescription}"
        ${image ? `,\n        "image": "${image}"` : ''}
    }
    </script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            line-height: 1.3;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        pre {
            background: #f5f5f5;
            padding: 1rem;
            overflow-x: auto;
            border-radius: 4px;
        }
        code {
            background: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1rem;
            margin-left: 0;
            color: #666;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}
