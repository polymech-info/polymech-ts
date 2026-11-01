import { ALL_PRODUCTS } from './registry.js';
import { EventBus } from './EventBus.js';

const findProductByQueue = (queue: string) => {
    return ALL_PRODUCTS.find(p =>
        p.workers?.some((w: any) => {
            try {
                const worker = new (w as any)();
                return worker.queueName === queue;
            } catch (e) {
                return false;
            }
        })
    );
};

EventBus.on('job:create', (event: any) => {
    const product = findProductByQueue(event.queue);

    if (!product) return;

    // Apply default job options from product if available
    if (product.jobOptions) {
        event.options = { ...product.jobOptions, ...event.options };
    }

    const singletonKey = product.hash(event.data);
    if (singletonKey) {
        event.options.singletonKey = singletonKey;
        // Default to 5 minutes if not specified
        if (!event.options.singletonSeconds) {
            event.options.singletonSeconds = 300;
        }
    }

    const { userId } = event.data;
    if (userId) {
        const metadata = product.meta(userId);
        event.data = { ...event.data, ...metadata };
    }

});
