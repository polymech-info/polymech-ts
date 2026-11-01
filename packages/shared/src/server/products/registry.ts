
import './subscriber.js';
import { ImagesProduct } from './images/index.js';
import { VideosProduct } from './videos/index.js';
import { ServingProduct } from './serving/index.js';
import { EmailProduct } from './email/index.js';
import { PdfProduct } from './pdf/index.js';
import { OpenAIProduct } from './openai/index.js';
import './subscriber.js';

let instances: any[] = [];
export const ALL_PRODUCTS = instances;

export const registerProductRoutes = (app: any) => {
    // Instantiate all products
    instances = [
        new ImagesProduct(),
        new VideosProduct(),
        new ServingProduct(),
        new EmailProduct(),
        new PdfProduct(),
        new OpenAIProduct()
    ];

    instances.forEach(product => {
        product.routes.forEach((route: any) => {
            // @ts-ignore
            app.openapi(route.definition, route.handler);
        });
    });
};

export const getAllWorkers = () => {
    return instances.flatMap(p => p.workers || []);
};

export const startProducts = async (boss?: any) => {
    for (const product of instances) {
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    // @ts-ignore
                    reject(new Error(`Product ${product?.id || 'unknown'} startup timed out`));
                }, 20000); // 5 seconds timeout
            });

            // Race the product start against the timeout
            await Promise.race([
                product.start(boss),
                timeoutPromise
            ]);

        } catch (err) {
            // @ts-ignore
            console.error(`Failed to start product ${product.id}`, err);
            // Continue with other products even if one fails
        }
    }
};
