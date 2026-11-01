import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'

import puppeteer from 'puppeteer'
import TurndownService from 'turndown'

import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'

const turndown = new TurndownService()

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('web', options)
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
                function: async (params: any) => {
                    try {
                        logger.debug(`Tool::BrowsePage Browsing ${params.url}`);
                        const browser = await puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })

                        try {
                            const page = await browser.newPage()
                            logger.debug(`Tool::Web::BrowsePage Opening page ${params.url}`)
                            await page.goto(params.url, {
                                waitUntil: 'networkidle2'
                            })

                            const pageData = await page.evaluate((selector) => {
                                const elementsToRemove = document.querySelectorAll(
                                    'script, style, link, meta, noscript, iframe, [style*="display:none"],[style*="display: none"], .hidden'
                                )
                                elementsToRemove.forEach(el => el.remove())

                                const links = Array.from(document.querySelectorAll('a'))
                                    .map(a => ({
                                        text: a.textContent?.trim() || '',
                                        href: a.href
                                    }))
                                    .filter(link => link.href && link.href.startsWith('http'))
                                    .slice(0, 20)

                                const images = Array.from(document.querySelectorAll('img'))
                                    .map(img => ({
                                        src: img.src,
                                        alt: img.alt || '',
                                        width: img.width,
                                        height: img.height
                                    }))
                                    .filter(img => img.src && img.src.startsWith('http'))
                                    .slice(0, 20)

                                const mainImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                                    document.querySelector('meta[name="og:image"]')?.getAttribute('content')

                                let content
                                const body = document.body
                                content = body ? body.innerHTML : ''
                                return {
                                    content,
                                    links,
                                    images,
                                    ogImage: mainImage
                                }
                            }, null)

                            const markdown = turndown.turndown(pageData.content)
                            await browser.close()
                            const ret = {
                                success: true,
                                markdown: markdown,
                                links: pageData.links,
                                images: pageData.images,
                                mainImage: pageData.ogImage,
                                url: params.url
                            };
                            return ret
                        } catch (error: any) {
                            logger.debug('Error browsing page:', error.message, error);
                            await browser.close()
                            throw error
                        }
                    } catch (error: any) {
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
        } as RunnableToolFunction<any>
    ]
}