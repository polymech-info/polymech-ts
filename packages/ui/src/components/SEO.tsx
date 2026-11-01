import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    canonicalUrl?: string;
    hreflangTags?: { lang: string; href: string }[];
    type?: string;
    twitterCard?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    canonicalUrl,
    hreflangTags,
    type = 'website',
    twitterCard = 'summary_large_image'
}) => {
    const siteTitle = 'Polymech Pictures'; // Or get from env
    const fullTitle = title || siteTitle;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            {description && <meta name='description' content={description} />}
            {canonicalUrl && <link rel='canonical' href={canonicalUrl} />}

            {/* Hreflang alternate tags */}
            {hreflangTags && hreflangTags.map(tag => (
                <link key={tag.lang} rel='alternate' hrefLang={tag.lang} href={tag.href} />
            ))}

            {/* Open Graph tags */}
            <meta property='og:title' content={fullTitle} />
            {description && <meta property='og:description' content={description} />}
            <meta property='og:type' content={type} />
            <meta property='og:site_name' content={siteTitle} />
            <meta property='og:locale' content='en' />
            {image && <meta property='og:image' content={image} />}
            {canonicalUrl && <meta property='og:url' content={canonicalUrl} />}

            {/* Twitter tags */}
            <meta name='twitter:card' content={twitterCard} />
            <meta name='twitter:title' content={fullTitle} />
            {description && <meta name='twitter:description' content={description} />}
            {image && <meta name='twitter:image' content={image} />}
        </Helmet>
    );
};
