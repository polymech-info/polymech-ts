import { sync as write } from "@polymech/fs/write";
import * as path from 'path';
import type { IKBotTask } from '../../ai-tools/index.js';
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js'
import { E_Mode } from '../../zod_schema.js'

const MODEL = E_OPENROUTER_MODEL.MODEL_META_LLAMA_LLAMA_3_8B_INSTRUCT;
const ROUTER = 'openrouter';
const LOG_LEVEL = 2; 

let logger = {
    info: (message: string) => console.log(`INFO: ${message}`),
    warn: (message: string) => console.log(`WARN: ${message}`),
    error: (message: string) => console.error(`ERROR: ${message}`),
    debug: (message: string) => console.log(`DEBUG: ${message}`),
    trace: (message: string) => console.log(`TRACE: ${message}`)
};

import {
    AsyncTransformer
} from '../../async-iterator.js';

import {
    FieldMapping,
    createIterator,
    INetworkOptions
} from '../../iterator.js';

import { run } from '../../commands/run.js';

const exampleData = {
    products: {
        fruits: [
            {
                id: 'f1',
                name: 'apple',
                description: 'A sweet and crunchy fruit',
                details: {
                    color: 'red',
                    origin: 'Worldwide',
                    nutrition: 'Rich in fiber and vitamin C'
                }
            },
            {
                id: 'f2',
                name: 'banana',
                description: 'A yellow tropical fruit',
                details: {
                    color: 'yellow',
                    origin: 'Southeast Asia',
                    nutrition: 'High in potassium'
                }
            }
        ],
        vegetables: [
            {
                id: 'v1',
                name: 'carrot',
                description: 'An orange root vegetable',
                details: {
                    color: 'orange',
                    origin: 'Eurasia',
                    nutrition: 'Good for vision health'
                }
            },
            {
                id: 'v2',
                name: 'broccoli',
                description: 'A green cruciferous vegetable',
                details: {
                    color: 'green',
                    origin: 'Italy',
                    nutrition: 'High in vitamins K and C'
                }
            }
        ]
    },
    metadata: {
        lastUpdated: '2023-04-15',
        source: 'Foods Database',
        description: 'Collection of common fruits and vegetables'
    }
};

const createLLMTransformer = (options: IKBotTask): AsyncTransformer => {
    return async (input: string, jsonPath: string): Promise<string> => {
        logger.info(`Transforming field at path: ${jsonPath}`);
        logger.info(`Input: ${input}`);
        logger.info(`Using prompt: ${options.prompt}`);

        const kbotTask: IKBotTask = {
            model: options.model || MODEL,
            router: ROUTER,
            prompt: `${options.prompt}\n\nText to transform: "${input}"`,
            logLevel: LOG_LEVEL,
            mode: E_Mode.COMPLETION
        };

        try {
            const results = await run(kbotTask);

            if (results && results.length > 0 && typeof results[0] === 'string') {
                const result = results[0].trim();
                logger.info(`Result: ${result}`);
                return result;
            }

            logger.warn(`No valid result received for ${jsonPath}, returning original`);
            return input;
        } catch (error) {
            console.error(`Error calling LLM API: ${error.message}`, error);
            return input;
        }
    };
};

export async function transformExample() {
    console.log("========================================");
    console.log("Starting async-iterator example transformation");
    console.log("========================================");

    try {
        const data = JSON.parse(JSON.stringify(exampleData));
        logger.info("Starting transformation of data fields with LLM...");
        console.log("Processing field mappings...");

        // Create error handler
        const errorCallback = (path: string, value: string, error: any) => {
            logger.error(`Error transforming ${path}: ${error.message}`);
        };
        
        // Global options for all transformations
        const globalOptionsMixin: Partial<IKBotTask> = {
            model: MODEL,
            router: ROUTER,
            logLevel: LOG_LEVEL,
            mode: E_Mode.COMPLETION
        };
        
        // Network configuration
        const networkOptions: INetworkOptions = {
            throttleDelay: 1000,
            concurrentTasks: 1,
            maxRetries: 3,
            retryDelay: 2000
        };
        
        // Create an iterator factory instance
        const iterator = createIterator(
            data, 
            globalOptionsMixin,
            {
                network: networkOptions,
                errorCallback,
                filterCallback: async () => true,
                transformerFactory: createLLMTransformer
            }
        );
        
        // Define simplified field mappings without redundant options
        const simplifiedMappings: FieldMapping[] = [
            {
                jsonPath: '$..description',
                targetPath: null,
                options: {
                    prompt: 'Make this description more engaging and detailed, around 20-30 words'
                }
            },
            {
                jsonPath: '$..nutrition',
                targetPath: null,
                options: {
                    prompt: 'Expand this nutrition information with 2-3 specific health benefits, around 25-35 words'
                }
            },
            {
                jsonPath: '$.products.*.*.name',
                targetPath: 'marketingName',
                options: {
                    prompt: 'Generate a more appealing marketing name for this product'
                }
            }
        ];
        
        // Use the iterator to transform the data
        await iterator.transform(simplifiedMappings);

        const outputPath = path.resolve('./tests/test-data/core/async-iterator-data.json');
        write(outputPath, JSON.stringify(data, null, 2));

        console.log(`Transformation complete. Results saved to ${outputPath}`);
        logger.info(`Transformation complete. Results saved to ${outputPath}`);

        console.log("\nBefore/After Comparison Example:");
        console.log(`Original description: ${exampleData.products.fruits[0].description}`);
        console.log(`Transformed description: ${data.products.fruits[0].description}`);
        console.log(`Original name: ${exampleData.products.fruits[0].name}`);
        console.log(`New marketing name: ${data.products.fruits[0].marketingName}`);

        logger.info("\nBefore/After Comparison Example:");
        logger.info(`Original description: ${exampleData.products.fruits[0].description}`);
        logger.info(`Transformed description: ${data.products.fruits[0].description}`);
        logger.info(`Original name: ${exampleData.products.fruits[0].name}`);
        logger.info(`New marketing name: ${data.products.fruits[0].marketingName}`);

        return data;
    } catch (error) {
        console.error("ERROR during transformation:", error);
        logger.error(`Error during transformation: ${error.message}`);
        throw error;
    }
}

console.log("Module loading, checking if this is direct execution");
console.log("process.argv[1]:", process.argv[1]);
console.log("import.meta.url:", import.meta.url);

const isDirectExecution = process.argv[1] && process.argv[1].includes('async-iterator-example');
console.log("Is direct execution:", isDirectExecution);

if (isDirectExecution) {
    const isDebug = process.argv.includes('--debug');
    console.log('Starting async-iterator example...');
    console.log(`Command arguments: ${process.argv.slice(2).join(', ')}`);
    console.log(`Debug mode: ${isDebug ? 'enabled' : 'disabled'}`);

    if (isDebug) {
        logger = {
            info: (message) => console.log(`DEBUG-INFO: ${message}`),
            warn: (message) => console.log(`DEBUG-WARN: ${message}`),
            error: (message) => console.error(`DEBUG-ERROR: ${message}`),
            debug: (message) => console.log(`DEBUG-DEBUG: ${message}`),
            trace: (message) => console.log(`DEBUG-TRACE: ${message}`)
        };
        logger.info("Running in debug mode with verbose output");
    }

    transformExample().catch(error => {
        console.error("Unhandled error:", error);
    });
}

export {
    createLLMTransformer,
    exampleData
};