type LogFunction = (level: string, message: string, data?: any) => void;
/**
 * Creates a URL-friendly slug from a string.
 * @param text The text to slugify.
 * @returns A URL-friendly slug.
 */
export declare const slugify: (text: string) => string;
/**
 * Formats markdown content into the required page JSON structure.
 * @param pageId The unique identifier for the page.
 * @param pageName The name of the page.
 * @param markdownContent The markdown content for the page.
 * @returns The structured page content object.
 */
export declare const formatPageContent: (pageId: string, pageName: string, markdownContent: string | undefined | null) => {
    pages: {
        [x: string]: {
            id: string;
            name: string;
            createdAt: number;
            updatedAt: number;
            containers: {
                id: string;
                gap: number;
                type: string;
                order: number;
                columns: number;
                widgets: {
                    id: string;
                    order: number;
                    props: {
                        content: string;
                        templates: any[];
                        placeholder: string;
                    };
                    widgetId: string;
                }[];
                children: any[];
            }[];
        };
    };
    version: string;
    lastUpdated: number;
};
/**
 * Shared logic to create a page in the database
 */
export declare const createPageInDb: (userId: string, args: {
    title: string;
    content: string;
    tags?: string[];
    is_public?: boolean;
    visible?: boolean;
}, addLog?: LogFunction) => Promise<{
    success: boolean;
    pageId: string;
    slug: string;
    url: string;
    message: string;
}>;
/**
 * Tool: Create Page
 * Creates a new page with the given title, content, and metadata, and saves it to the database.
 */
export declare const createPageTool: (userId: string, addLog?: LogFunction) => import('openai/lib/RunnableFunction.mjs').RunnableToolFunctionWithParse<{
    title?: string;
    content?: string;
    is_public?: boolean;
    tags?: string[];
    visible?: boolean;
}>;
export {};
