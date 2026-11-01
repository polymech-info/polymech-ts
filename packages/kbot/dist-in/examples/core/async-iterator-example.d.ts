import type { IKBotTask } from '../../ai-tools/index.js';
import { AsyncTransformer } from '../../async-iterator.js';
declare const exampleData: {
    products: {
        fruits: {
            id: string;
            name: string;
            description: string;
            details: {
                color: string;
                origin: string;
                nutrition: string;
            };
        }[];
        vegetables: {
            id: string;
            name: string;
            description: string;
            details: {
                color: string;
                origin: string;
                nutrition: string;
            };
        }[];
    };
    metadata: {
        lastUpdated: string;
        source: string;
        description: string;
    };
};
declare const createLLMTransformer: (options: IKBotTask) => AsyncTransformer;
export declare function transformExample(): Promise<any>;
export { createLLMTransformer, exampleData };
