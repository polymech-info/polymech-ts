import { marked } from 'marked';
import { PageLayout, LayoutContainer } from '@/modules/layout/LayoutManager';

export interface MarkdownHeading {
    depth: number;
    slug: string;
    text: string;
}

export interface TocItem extends MarkdownHeading {
    children: TocItem[];
}

interface TocOpts {
    minHeadingLevel?: number;
    maxHeadingLevel?: number;
    title?: string;
}

/**
 * Basic slugify function to match simple regex used in renderer
 * Note: For production with non-latin chars, consider github-slugger
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Strip inline markdown (links, bold, italic, code) down to plain text.
 * e.g. "[Mini Shredder](/user/...)" → "Mini Shredder"
 */
function stripInlineMarkdown(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // [text](url) → text
        .replace(/[*_]{1,3}(.+?)[*_]{1,3}/g, '$1')  // bold / italic
        .replace(/`([^`]+)`/g, '$1');                 // inline code
}

/** Extract headings from markdown content */
export function extractHeadings(content: string): MarkdownHeading[] {
    const tokens = marked.lexer(content);
    const headings: MarkdownHeading[] = [];

    marked.walkTokens(tokens, (token) => {
        if (token.type === 'heading') {
            const plain = stripInlineMarkdown(token.text);
            headings.push({
                depth: token.depth,
                text: plain,
                slug: slugify(plain)
            });
        }
    });

    return headings;
}

/** Extract headings from all widgets in a page layout */
export function extractHeadingsFromLayout(layout: PageLayout): MarkdownHeading[] {
    let allHeadings: MarkdownHeading[] = [];

    const processContainer = (container: any) => {
        // Process widgets in this container
        container.widgets.forEach((widget: any) => {
            if (widget.props && typeof widget.props.content === 'string') {
                const widgetHeadings = extractHeadings(widget.props.content);
                allHeadings = [...allHeadings, ...widgetHeadings];
            }
        });

        // Process nested containers (only LayoutContainer has children)
        if (container.children) {
            container.children.forEach(processContainer);
        }
    };

    layout.containers?.forEach(processContainer);

    return allHeadings;
}

/** Convert the flat headings array into a nested tree structure. */
export function generateToC(
    headings: MarkdownHeading[],
    { minHeadingLevel, maxHeadingLevel, title }: TocOpts
) {
    headings = headings.filter(({ depth }) => depth >= (minHeadingLevel || 2) && depth <= (maxHeadingLevel || 4));
    const toc: Array<TocItem> = [];

    if (title) {
        toc.push({ depth: 2, slug: '_top', text: title, children: [] });
    }

    for (const heading of headings) injectChild(toc, { ...heading, children: [] });
    return toc;
}

/** Inject a ToC entry as deep in the tree as its `depth` property requires. */
function injectChild(items: TocItem[], item: TocItem): void {
    const lastItem = items.at(-1);
    if (!lastItem || lastItem.depth >= item.depth) {
        items.push(item);
    } else {
        // If the last item is lesser depth (e.g. 2 vs 3), we try to put it in children.
        // However, if the gap is too large (e.g. 2 vs 4), simple recursion handles it
        // by putting it in the children of the level 2 item.
        injectChild(lastItem.children, item);
    }
}
