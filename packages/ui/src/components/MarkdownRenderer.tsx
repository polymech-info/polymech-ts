import React, { useMemo, useEffect, useRef, useState, Suspense, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import HashtagText from './HashtagText';
import Prism from 'prismjs';
import ResponsiveImage from './ResponsiveImage';
import { useAuth } from '@/hooks/useAuth';
// Import type from Post module
import { PostMediaItem } from '@/modules/posts/views/types';

import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import '../styles/prism-custom-theme.css';

// Lazy load SmartLightbox to avoid circular deps or heavy bundle on initial load
const SmartLightbox = React.lazy(() => import('@/modules/posts/views/components/SmartLightbox'));
const GalleryWidget = React.lazy(() => import('./widgets/GalleryWidget'));
const MermaidWidget = React.lazy(() => import('./widgets/MermaidWidget'));

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variables?: Record<string, any>;
  baseUrl?: string;
  onLinkClick?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// Helper function to format URL display text (ported from previous implementation)
const formatUrlDisplay = (url: string): string => {
  try {
    // Remove protocol
    let displayUrl = url.replace(/^https?:\/\//, '');

    // Remove www. if present
    displayUrl = displayUrl.replace(/^www\./, '');

    // Truncate if too long (keep domain + some path)
    if (displayUrl.length > 40) {
      const parts = displayUrl.split('/');
      const domain = parts[0];
      const path = parts.slice(1).join('/');

      if (path.length > 20) {
        displayUrl = `${domain}/${path.substring(0, 15)}...`;
      } else {
        displayUrl = `${domain}/${path}`;
      }
    }

    return displayUrl;
  } catch {
    return url;
  }
};

// Helper for slugifying headings
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/** Recursively extract plain text from React children (handles nested <a>, <strong>, etc.) */
const getPlainText = (children: React.ReactNode): string => {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getPlainText).join('');
  if (React.isValidElement(children)) return getPlainText((children.props as any).children);
  return '';
};

import { substitute } from '@/lib/variables';
import { serverUrl } from '@/lib/db';

// Helper to strip YAML frontmatter
const stripFrontmatter = (text: string) => {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart();
};

const MarkdownRenderer = React.memo(({ content, className = "", variables, baseUrl, onLinkClick }: MarkdownRendererProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Helper to resolve relative URLs
  const resolveUrl = useCallback((url: string | undefined) => {
    if (!url) return '';
    if (!baseUrl) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;

    // Resolve relative path against baseUrl
    try {
      // If baseUrl is relative, make it absolute using the API origin so the server can fetch it
      let absoluteBase = baseUrl;
      if (baseUrl.startsWith('/')) {
        const apiOrigin = serverUrl || window.location.origin;
        // if API url is absolute (http://...), use it as the base. 
        // fallback to window.location.origin for relative API configs.
        const originToUse = apiOrigin.startsWith('http') ? apiOrigin : window.location.origin;
        // Avoid double-prefixing if baseUrl already contains the origin root (e.g. from SSR)
        if (!baseUrl.startsWith(originToUse)) {
          absoluteBase = `${originToUse}${baseUrl}`;
        }
      }

      // Ensure the base URL resolves to the directory, not the file
      // URL constructor resolves './file' relative to the path. If path doesn't end in '/',
      // it strips the last segment. So we DO NOT want to arbitrarily append '/' to a file path.
      // If absoluteBase is a file path (e.g. '.../document.md'), the URL constructor natively handles:
      // new URL('./image.jpg', '.../document.md') => '.../image.jpg'
      return new URL(url, absoluteBase).href;
    } catch {
      return url; // Fallback if parsing fails
    }
  }, [baseUrl]);

  // Substitute variables in content if provided
  const finalContent = useMemo(() => {
    const withoutFrontmatter = stripFrontmatter(content);
    if (!variables || Object.keys(variables).length === 0) return withoutFrontmatter;
    return substitute(false, withoutFrontmatter, variables);
  }, [content, variables]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract all images from content for navigation
  const allImages = useMemo(() => {
    const images: { src: string, alt: string }[] = [];
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    // We clone the regex to avoid stateful issues if reuse happens, though local var is fine
    const localRegex = new RegExp(regex);
    while ((match = localRegex.exec(finalContent)) !== null) {
      images.push({
        alt: match[1],
        src: match[2]
      });
    }
    return images;
  }, [finalContent]);

  // Memoize content analysis (keep existing logic for simple hashtag views)
  const contentAnalysis = useMemo(() => {
    const hasHashtags = /#[a-zA-Z0-9_]+/.test(finalContent);
    const hasMarkdownLinks = /\[.*?\]\(.*?\)/.test(finalContent);
    const hasMarkdownSyntax = /(\*\*|__|##?|###?|####?|#####?|######?|\*|\n\*|\n-|\n\d+\.)/.test(finalContent);

    return {
      hasHashtags,
      hasMarkdownLinks,
      hasMarkdownSyntax
    };
  }, [finalContent]);

  // Removed Prism.highlightAllUnder to prevent React NotFoundError during streaming
  // Highlighting is now handled safely within the `code` component renderer.

  const handleImageClick = (src: string) => {
    const index = allImages.findIndex(img => img.src === src);
    if (index !== -1) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else {
      setCurrentImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : prev));
    }
  };

  // Mock MediaItem for SmartLightbox
  const mockMediaItem = useMemo((): PostMediaItem | null => {
    const selectedImage = allImages[currentImageIndex];
    if (!selectedImage) return null;
    const resolvedUrl = resolveUrl(selectedImage.src);
    return {
      id: 'md-' + btoa(encodeURIComponent(selectedImage.src)).substring(0, 10), // stable ID based on SRC
      title: selectedImage.alt || 'Image',
      description: '',
      image_url: resolvedUrl,
      thumbnail_url: resolvedUrl,
      user_id: user?.id || 'unknown',
      type: 'image',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      position: 0,
      likes_count: 0,
      post_id: null
    } as any;
  }, [currentImageIndex, allImages, user, resolveUrl]);

  // Only use HashtagText if content has hashtags but NO markdown syntax at all
  if (contentAnalysis.hasHashtags && !contentAnalysis.hasMarkdownLinks && !contentAnalysis.hasMarkdownSyntax) {
    return (
      <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
        <HashtagText>{finalContent}</HashtagText>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img: ({ node, src, alt, title, ...props }) => {
              // Basic implementation of ResponsiveImage
              const resolvedSrc = resolveUrl(src);

              return (
                <span className="block my-4">
                  <ResponsiveImage
                    src={resolvedSrc}
                    alt={alt || ''}
                    title={title} // Pass title down if ResponsiveImage supports it or wrap it
                    className={`cursor-pointer ${props.className || ''}`}
                    imgClassName="cursor-pointer hover:opacity-95 transition-opacity"
                    // Default generous sizes for blog post content
                    sizes="(max-width: 768px) 100vw, 800px"
                    loading="lazy"
                    onClick={() => resolvedSrc && handleImageClick(src || '')}
                  />
                  {title && <span className="block text-center text-sm text-muted-foreground mt-2 italic">{title}</span>}
                </span>
              );
            },
            a: ({ node, href, children, ...props }) => {
              if (!href) return <span {...props}>{children}</span>;

              // Logic to format display text if it matches the URL
              let childText = '';
              if (typeof children === 'string') {
                childText = children;
              } else if (Array.isArray(children) && children.length > 0 && typeof children[0] === 'string') {
                // Simple approximation for React children
                childText = children[0];
              }

              const isAutoLink = childText === href || childText.replace(/^https?:\/\//, '') === href.replace(/^https?:\/\//, '');
              const displayContent = isAutoLink ? formatUrlDisplay(href) : children;

              const isRelative = !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('data:') && !href.startsWith('#');

              return (
                <a
                  href={href}
                  target={isRelative ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline hover:no-underline transition-colors"
                  onClick={(e) => {
                    if (onLinkClick) {
                      onLinkClick(href, e);
                    }
                  }}
                  {...props}
                >
                  {displayContent}
                </a>
              );
            },
            h1: ({ node, children, ...props }) => {
              const text = getPlainText(children);
              const id = slugify(text);
              return <h1 id={id} {...props}>{children}</h1>;
            },
            h2: ({ node, children, ...props }) => {
              const text = getPlainText(children);
              const id = slugify(text);
              return <h2 id={id} {...props}>{children}</h2>;
            },
            h3: ({ node, children, ...props }) => {
              const text = getPlainText(children);
              const id = slugify(text);
              return <h3 id={id} {...props}>{children}</h3>;
            },
            h4: ({ node, children, ...props }) => {
              const text = getPlainText(children);
              const id = slugify(text);
              return <h4 id={id} {...props}>{children}</h4>;
            },
            p: ({ node, children, ...props }) => {
              // Deep check if any child is an image to avoid <p> nesting issues
              const hasImage = (n: any): boolean => {
                if (n.type === 'element' && n.tagName === 'img') return true;
                if (n.children) return n.children.some(hasImage);
                return false;
              };

              if (hasImage(node)) {
                return <div {...props}>{children}</div>;
              }
              return <p {...props}>{children}</p>;
            },
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-border" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-muted/50" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="border border-border px-3 py-2 text-left text-sm font-semibold" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-border px-3 py-2 text-sm" {...props} />
            ),
            // Custom component: ```custom-gallery\nid1,id2,id3\n```
            code: ({ node, className, children, ...props }) => {
              if (className === 'language-mermaid') {
                const chart = String(children).trim();
                return (
                  <Suspense fallback={<div className="animate-pulse h-32 bg-muted/20 border border-border/50 rounded-lg flex items-center justify-center my-6 text-sm text-muted-foreground">Loading Mermaid diagram...</div>}>
                    <MermaidWidget chart={chart} />
                  </Suspense>
                );
              }

              if (className === 'language-custom-gallery') {
                const ids = String(children).trim().split(/[,\s\n]+/).filter(Boolean);
                if (ids.length > 0) {
                  return (
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <GalleryWidget 
                        pictureIds={ids} 
                        thumbnailLayout="grid" 
                        imageFit="cover" 
                        thumbnailsPosition="bottom"
                        thumbnailsOrientation="horizontal"
                        zoomEnabled={false}
                        showVersions={false}
                        autoPlayVideos={false}
                        showTitle={false}
                        showDescription={false}
                        thumbnailsClassName=""
                        variables={{}}
                      />
                    </Suspense>
                  );
                }
              }

              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (!match) {
                // Inline code or unclassified code
                return <code className={`${className || ''} whitespace-pre-wrap font-mono text-sm bg-muted/30 px-1 py-0.5 rounded`} {...props}>{children}</code>;
              }

              const text = String(children).replace(/\n$/, '');

              // Handle common language aliases
              let prismLang = language;
              if (language === 'ts') prismLang = 'typescript';
              if (language === 'js') prismLang = 'javascript';
              if (language === 'sh') prismLang = 'bash';
              if (language === 'html' || language === 'xml') prismLang = 'markup';

              if (Prism.languages[prismLang]) {
                try {
                  const html = Prism.highlight(text, Prism.languages[prismLang], prismLang);
                  return (
                    <code
                      className={`${className} whitespace-pre-wrap font-mono text-sm`}
                      dangerouslySetInnerHTML={{ __html: html }}
                      {...props}
                      // Avoid passing children when using dangerouslySetInnerHTML
                      children={undefined}
                    />
                  );
                } catch (e) {
                  console.error('Prism highlight error', e);
                }
              }

              // Fallback to unhighlighted 
              return <code className={`${className || ''} whitespace-pre-wrap font-mono text-sm`} {...props}>{children}</code>;
            },
            // Unwrap <pre> for custom components (gallery etc.)
            pre: ({ node, children, ...props }) => {
              // Check the actual AST node type to see if it's our custom gallery
              const firstChild = node?.children?.[0];
              if (firstChild?.type === 'element' && firstChild?.tagName === 'code') {
                const isGallery = Array.isArray(firstChild.properties?.className)
                  && firstChild.properties?.className.includes('language-custom-gallery');
                const isMermaid = Array.isArray(firstChild.properties?.className)
                  && firstChild.properties?.className.includes('language-mermaid');

                if (isGallery || isMermaid) {
                  return <>{children}</>;
                }

                // Normal code block
                return <pre className={`${props.className || ''} whitespace-pre-wrap break-words overflow-x-auto p-4 rounded-lg bg-muted/50 border border-border/50 mt-4 mb-4`} {...props}>{children}</pre>;
              }

              // Fallback
              return <pre {...props}>{children}</pre>;
            },
          }}
        >
          {finalContent}
        </ReactMarkdown>
      </div>

      {lightboxOpen && mockMediaItem && (
        <Suspense fallback={null}>
          <SmartLightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            mediaItem={mockMediaItem}
            imageUrl={mockMediaItem.image_url}
            imageTitle={mockMediaItem.title}
            user={user}
            isVideo={false}
            // Dummy handlers for actions that aren't supported in this context
            onPublish={async () => { }}
            onNavigate={handleNavigate}
            onOpenInWizard={() => { }}
            currentIndex={currentImageIndex}
            totalCount={allImages.length}
          />
        </Suspense>
      )}
    </>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
