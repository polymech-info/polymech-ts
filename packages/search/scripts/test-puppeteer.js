
import puppeteer from 'puppeteer';

(async () => {
    console.log('[Test] Launching browser...');
    try {
        const browser = await puppeteer.launch({
            headless: false
        });
        console.log('[Test] Browser launched successfully.');

        const page = await browser.newPage();
        console.log('[Test] New page created.');

        console.log('[Test] Navigating to example.com...');
        await page.goto('https://example.com');
        console.log('[Test] Navigation successful.');

        const title = await page.title();
        console.log(`[Test] Page title: ${title}`);

        await browser.close();
        console.log('[Test] Browser closed.');
    } catch (error) {
        console.error('[Test] Error:', error);
        process.exit(1);
    }
})();
