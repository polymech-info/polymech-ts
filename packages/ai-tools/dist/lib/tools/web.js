import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import { toolLogger } from '../../index.js';
const turndown = new TurndownService();
export const tools = (target, options) => {
    const logger = toolLogger('web', options);
    return [
        {
            type: 'function',
            function: {
                name: 'browse_page',
                description: 'Browse a webpage and return its content as markdown, all links, images and pages main image',
                parameters: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'URL of the webpage to browse'
                        }
                    },
                    required: ['url']
                },
                function: async (params) => {
                    try {
                        logger.debug(`Tool::BrowsePage Browsing ${params.url}`);
                        const browser = await puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        try {
                            const page = await browser.newPage();
                            logger.debug(`Tool::Web::BrowsePage Opening page ${params.url}`);
                            await page.goto(params.url, {
                                waitUntil: 'networkidle2'
                            });
                            const pageData = await page.evaluate((selector) => {
                                const elementsToRemove = document.querySelectorAll('script, style, link, meta, noscript, iframe, [style*="display:none"],[style*="display: none"], .hidden');
                                elementsToRemove.forEach(el => el.remove());
                                const links = Array.from(document.querySelectorAll('a'))
                                    .map(a => ({
                                    text: a.textContent?.trim() || '',
                                    href: a.href
                                }))
                                    .filter(link => link.href && link.href.startsWith('http'))
                                    .slice(0, 20);
                                const images = Array.from(document.querySelectorAll('img'))
                                    .map(img => ({
                                    src: img.src,
                                    alt: img.alt || '',
                                    width: img.width,
                                    height: img.height
                                }))
                                    .filter(img => img.src && img.src.startsWith('http'))
                                    .slice(0, 20);
                                const mainImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                                    document.querySelector('meta[name="og:image"]')?.getAttribute('content');
                                let content;
                                const body = document.body;
                                content = body ? body.innerHTML : '';
                                return {
                                    content,
                                    links,
                                    images,
                                    ogImage: mainImage
                                };
                            }, null);
                            const markdown = turndown.turndown(pageData.content);
                            await browser.close();
                            const ret = {
                                success: true,
                                markdown: markdown,
                                links: pageData.links,
                                images: pageData.images,
                                mainImage: pageData.ogImage,
                                url: params.url
                            };
                            return ret;
                        }
                        catch (error) {
                            logger.debug('Error browsing page:', error.message, error);
                            await browser.close();
                            throw error;
                        }
                    }
                    catch (error) {
                        logger.debug('Error browsing page:', error.message);
                        return {
                            success: false,
                            error: error.message,
                            url: params.url
                        };
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi90b29scy93ZWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sZUFBZSxNQUFNLFVBQVUsQ0FBQTtBQUV0QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFHM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQTtBQUV0QyxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFjLEVBQUUsT0FBa0IsRUFBYyxFQUFFO0lBQ3BFLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDekMsT0FBTztRQUNIO1lBQ0ksSUFBSSxFQUFFLFVBQVU7WUFDaEIsUUFBUSxFQUFFO2dCQUNOLElBQUksRUFBRSxhQUFhO2dCQUNuQixXQUFXLEVBQUUsNkZBQTZGO2dCQUMxRyxVQUFVLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLEdBQUcsRUFBRTs0QkFDRCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsOEJBQThCO3lCQUM5QztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUM7aUJBQ3BCO2dCQUNELFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBVyxFQUFFLEVBQUU7b0JBQzVCLElBQUksQ0FBQzt3QkFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQzt3QkFDeEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDOzRCQUNuQyxRQUFRLEVBQUUsSUFBSTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUUsMEJBQTBCLENBQUM7eUJBQ3JELENBQUMsQ0FBQTt3QkFFRixJQUFJLENB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