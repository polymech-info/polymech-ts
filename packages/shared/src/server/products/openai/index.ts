import { AbstractProduct } from '../AbstractProduct.js';
import { postChatCompletionsRoute } from './routes.js';
import { handleChatCompletions } from './handlers.js';

export class OpenAIProduct extends AbstractProduct<any> {
    id = 'openai';
    jobOptions = {};
    actions = {};
    workers = [];
    routes: any[] = [];

    constructor() {
        super();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Register the chat completion route
        // We use CachedHandler here just to wrap it properly, but we probably don't want to actually cache LLM responses aggressively
        // unless we implement specific caching logic. For now, let's use the handler directly or create a simple wrapper if needed.
        // Actually, AbstractProduct expects { definition, handler } objects.
        // And `registry.ts` does: app.openapi(route.definition, route.handler);

        this.routes.push({
            definition: postChatCompletionsRoute,
            handler: handleChatCompletions
        });
    }

    hash(data: any): string {
        return 'openai-hash';
    }

    meta(userId: string): any {
        return { userId };
    }
}
