import { sync as write } from "@polymech/fs/write";
import * as path from 'path';
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js';
import { E_Mode } from '../../zod_schema.js';
const MODEL = E_OPENROUTER_MODEL.MODEL_META_LLAMA_LLAMA_3_8B_INSTRUCT;
const ROUTER = 'openrouter';
const LOG_LEVEL = 2;
let logger = {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.log(`WARN: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`),
    debug: (message) => console.log(`DEBUG: ${message}`),
    trace: (message) => console.log(`TRACE: ${message}`)
};
import { createIterator } from '../../iterator.js';
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
const createLLMTransformer = (options) => {
    return async (input, jsonPath) => {
        logger.info(`Transforming field at path: ${jsonPath}`);
        logger.info(`Input: ${input}`);
        logger.info(`Using prompt: ${options.prompt}`);
        const kbotTask = {
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
        }
        catch (error) {
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
        const errorCallback = (path, value, error) => {
            logger.error(`Error transforming ${path}: ${error.message}`);
        };
        // Global options for all transformations
        const globalOptionsMixin = {
            model: MODEL,
            router: ROUTER,
            logLevel: LOG_LEVEL,
            mode: E_Mode.COMPLETION
        };
        // Network configuration
        const networkOptions = {
            throttleDelay: 1000,
            concurrentTasks: 1,
            maxRetries: 3,
            retryDelay: 2000
        };
        // Create an iterator factory instance
        const iterator = createIterator(data, globalOptionsMixin, {
            network: networkOptions,
            errorCallback,
            filterCallback: async () => true,
            transformerFactory: createLLMTransformer
        });
        // Define simplified field mappings without redundant options
        const simplifiedMappings = [
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
    }
    catch (error) {
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
export { createLLMTransformer, exampleData };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMtaXRlcmF0b3ItZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leGFtcGxlcy9jb3JlL2FzeW5jLWl0ZXJhdG9yLWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUU3QixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQTtBQUM1RSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFFNUMsTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsb0NBQW9DLENBQUM7QUFDdEUsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztBQUVwQixJQUFJLE1BQU0sR0FBRztJQUNULElBQUksRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE9BQU8sRUFBRSxDQUFDO0lBQzFELElBQUksRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE9BQU8sRUFBRSxDQUFDO0lBQzFELEtBQUssRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLE9BQU8sRUFBRSxDQUFDO0lBQzlELEtBQUssRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLE9BQU8sRUFBRSxDQUFDO0lBQzVELEtBQUssRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLE9BQU8sRUFBRSxDQUFDO0NBQy9ELENBQUM7QUFNRixPQUFPLEVBRUgsY0FBYyxFQUVqQixN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