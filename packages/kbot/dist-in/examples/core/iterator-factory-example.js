import { sync as write } from "@polymech/fs/write";
import * as path from 'path';
import * as fs from 'fs';
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js';
import { E_Mode } from '../../zod_schema.js';
import { createIterator, createLLMTransformer, transform, removeEmptyObjects } from '../../iterator.js';
import { rm_cached_object } from '@polymech/cache';
/**
 * Notes for LLM modifications
 *
 * - to test it, use `npm run examples:iterator-factory`
 * - demonstrates how to use the schema format option for structured output
 * - shows transformation of string fields in complex objects
 * - shows transformation of string arrays and number arrays
 * - tests caching system with multiple runs
 * - supports the --no-cache option to force fresh responses
 */
const MODEL = E_OPENROUTER_MODEL.MODEL_OPENAI_GPT_4_1;
const ROUTER = 'openrouter';
// Example using the simplified transform function
export async function simpleTransformExample() {
    try {
        // Use the same example data and field mappings
        const data = JSON.parse(JSON.stringify(exampleData));
        // Minimal configuration, just pass the data and mappings
        await transform(data, fieldMappings, {
            model: MODEL,
            router: ROUTER,
            mode: E_Mode.COMPLETION
        }, {
            onTransform: simpleOnTransform,
            onTransformed: simpleOnTransformed
        });
        console.log("\nSimplified Transform Result:");
        console.log(JSON.stringify(data.products.fruits[0], null, 2));
        console.log(JSON.stringify(data.numberArrays, null, 2));
        if (data.productReview && data.productReview.analysis) {
            console.log("\nSimplified Transform - Formatted Review Analysis:");
            try {
                // Parse the JSON string if needed
                const analysisJson = typeof data.productReview.analysis === 'string'
                    ? JSON.parse(data.productReview.analysis)
                    : data.productReview.analysis;
                console.log(JSON.stringify(analysisJson, null, 2));
            }
            catch (e) {
                console.log(data.productReview.analysis);
            }
        }
        console.log("\nSimplified Transform - Before/After Comparisons:");
        console.log(`Original description: ${exampleData.products.fruits[0].description}`);
        console.log(`Transformed description: ${data.products.fruits[0].description}`);
        console.log(`\nOriginal prices: ${JSON.stringify(exampleData.numberArrays.prices)}`);
        console.log(`Pricing Analysis: ${data.numberArrays.pricingAnalysis}`);
        console.log(`\nOriginal ratings: ${JSON.stringify(exampleData.numberArrays.ratings)}`);
        console.log(`Ratings Summary: ${data.numberArrays.ratingsSummary}`);
        console.log(`\nOriginal quantities: ${JSON.stringify(exampleData.numberArrays.quantities)}`);
        console.log(`Inventory Status: ${data.numberArrays.inventoryStatus}`);
        return data;
    }
    catch (error) {
        console.error("ERROR during simplified transformation:", error);
        throw error;
    }
}
const LOG_LEVEL = 2;
const logger = {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.log(`WARN: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`),
    debug: (message) => console.log(`DEBUG: ${message}`),
    trace: (message) => console.log(`TRACE: ${message}`)
};
// Example data with products
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
                    nutrition: 'Rich in fiber and vitamin D'
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
        ]
    },
    numberArrays: {
        prices: [5, 3, 8, 12, 7],
        ratings: [4.5, 3.8, 4.2, 5.0, 4.1],
        quantities: [100, 50, 75, 30, 60]
    },
    productReview: {
        reviewText: 'Great selection of fruits with good prices and quality. Some items were out of stock.'
    }
};
// Field mappings definition
const fieldMappings = [
    {
        jsonPath: '$.products.fruits[*].description',
        targetPath: null,
        options: {
            prompt: 'Make this description more engaging and detailed, around 10 words'
        }
    },
    {
        jsonPath: '$.products.fruits[*].details.nutrition',
        targetPath: null,
        options: {
            prompt: 'Expand this nutrition information with 2-3 specific health benefits, around 25-35 words'
        }
    },
    {
        jsonPath: '$.products.fruits[*].name',
        targetPath: 'marketingName',
        options: {
            prompt: 'Generate a more appealing marketing name for this product'
        }
    },
    {
        jsonPath: '$.numberArrays.prices',
        targetPath: 'pricingAnalysis',
        options: {
            prompt: 'Analyze these prices and provide a brief 20-30 word market assessment'
        }
    },
    {
        jsonPath: '$.numberArrays.ratings',
        targetPath: 'ratingsSummary',
        options: {
            prompt: 'Summarize these product ratings (out of 5) in a brief 15-20 word statement'
        }
    },
    {
        jsonPath: '$.numberArrays.quantities',
        targetPath: 'inventoryStatus',
        options: {
            prompt: 'Based on these inventory quantities, provide a 15-20 word stock assessment'
        }
    },
    {
        jsonPath: '$.productReview.reviewText',
        targetPath: 'analysis',
        options: {
            // Clear and explicit prompt that includes the schema format details
            prompt: `Analyze this product review and extract key information`,
            format: {
                type: "object",
                properties: {
                    sentiment: {
                        type: "string",
                        enum: ["positive", "neutral", "negative"],
                        description: "The overall sentiment of the review"
                    },
                    pros: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Positive aspects mentioned in the review",
                        minItems: 1,
                        maxItems: 3
                    },
                    cons: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Negative aspects mentioned in the review",
                        minItems: 0,
                        maxItems: 3
                    }
                },
                required: ["sentiment", "pros", "cons"]
            }
        }
    }
];
// Example onTransform callback
const exampleOnTransform = async (jsonPath, value, options) => {
    let valueToTransform;
    // Check if the value is not a string (e.g., our number arrays)
    if (typeof value !== 'string') {
        valueToTransform = JSON.stringify(value);
        console.log(` -> onTransform: Path='${jsonPath}', Original Value (Array)=${valueToTransform}, Options Model='${options?.model}'`);
    }
    else {
        valueToTransform = value;
        console.log(` -> onTransform: Path='${jsonPath}', Original Value='${valueToTransform.substring(0, 30)}...', Options Model='${options?.model}'`);
    }
    // Example: Prefix value before sending to LLM
    if (jsonPath.includes('description')) {
        return `[PRODUCT INFO] ${valueToTransform}`;
    }
    return valueToTransform; // Return stringified or original string value
};
// Example onTransformed callback
const exampleOnTransformed = async (jsonPath, transformedValue, options) => {
    console.log(` <- onTransformed: Path='${jsonPath}', Transformed Value='${transformedValue.substring(0, 100)}...', Options Model='${options?.model}'`);
    // Example: Post-process the LLM response
    if (jsonPath.includes('nutrition')) {
        return `${transformedValue} [HEALTH FOCUS]`;
    }
    return transformedValue; // Return transformed value if no modification needed
};
// Simpler callbacks for the second example
const simpleOnTransform = async (jsonPath, value) => {
    let valueToTransform;
    // Check if the value is not a string (e.g., our number arrays)
    if (typeof value !== 'string') {
        valueToTransform = JSON.stringify(value);
        console.log(` -> simpleOnTransform: Path='${jsonPath}' (Array stringified)`);
    }
    else {
        valueToTransform = value;
        console.log(` -> simpleOnTransform: Path='${jsonPath}'`);
    }
    return valueToTransform;
};
const simpleOnTransformed = async (jsonPath, transformedValue) => {
    console.log(` <- simpleOnTransformed: Path='${jsonPath}'`);
    return transformedValue;
};
// Error handler
const errorCallback = (path, value, error) => {
    logger.error(`Error transforming ${path}: ${error.message}`);
};
// Network configuration
const networkOptions = {
    throttleDelay: 1000,
    concurrentTasks: 1,
    maxRetries: 3,
    retryDelay: 2000
};
// Cache configuration
const cacheConfig = {
    enabled: true,
    namespace: 'product-transformations',
    expiration: 7 * 24 * 60 * 60 // 7 days in seconds
};
export async function factoryExample() {
    console.log("========================================");
    console.log("Starting iterator factory example");
    console.log("========================================");
    try {
        const data = JSON.parse(JSON.stringify(exampleData));
        // Global options for all transformations
        const globalOptionsMixin = {
            model: MODEL,
            router: ROUTER,
            logLevel: LOG_LEVEL,
            mode: E_Mode.COMPLETION
        };
        // --- Cache Clearing Logic ---
        // Calculate the expected cache key for the object transformation
        const objectCacheKey = removeEmptyObjects({
            data: JSON.stringify(exampleData), // Use the initial data state
            mappings: fieldMappings.map(m => ({
                jsonPath: m.jsonPath,
                targetPath: m.targetPath,
                options: {
                    model: globalOptionsMixin.model,
                    router: globalOptionsMixin.router,
                    mode: globalOptionsMixin.mode,
                    prompt: m.options?.prompt
                }
            }))
        });
        const objectCacheNamespace = 'transformed-objects';
        console.log(`Attempting to clear cache for key in namespace '${objectCacheNamespace}' before first run...`);
        try {
            await rm_cached_object({ ca_options: objectCacheKey }, objectCacheNamespace);
            console.log('Cache cleared successfully (or key did not exist).');
        }
        catch (error) {
            console.warn('Failed to clear cache, proceeding anyway:', error);
        }
        // --- End Cache Clearing Logic ---
        // Combine all options including callbacks for createIterator
        const iteratorOptions = {
            network: networkOptions,
            errorCallback,
            filterCallback: async () => true,
            transformerFactory: (options) => createLLMTransformer(options, logger, cacheConfig),
            logger,
            cacheConfig: {
                ...cacheConfig,
                enabled: process.argv.includes('--no-cache') ? false : cacheConfig.enabled
            },
            onTransform: exampleOnTransform,
            onTransformed: exampleOnTransformed
        };
        // Create an iterator factory instance
        const iterator = createIterator(data, globalOptionsMixin, iteratorOptions);
        // Use the iterator to transform the data
        console.log("First run - should transform, run callbacks, and cache results:");
        await iterator.transform(fieldMappings);
        const outputPath = path.resolve('./tests/test-data/core/iterator-factory-data.json');
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Make sure the file is empty to start with a clean slate
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        write(outputPath, JSON.stringify(data, null, 2));
        console.log("Transformation complete. Results saved to", outputPath);
        // Print the transformed data structure
        console.log("\nTransformed data structure:");
        console.log(JSON.stringify(data.products.fruits[0], null, 2));
        console.log(JSON.stringify(data.numberArrays, null, 2));
        if (data.productReview && data.productReview.analysis) {
            console.log("\nFormatted Review Analysis:");
            try {
                // Parse the JSON string if needed
                const analysisJson = typeof data.productReview.analysis === 'string'
                    ? JSON.parse(data.productReview.analysis)
                    : data.productReview.analysis;
                console.log(JSON.stringify(analysisJson, null, 2));
            }
            catch (e) {
                console.log(data.productReview.analysis);
            }
        }
        // Create a second instance with the same data to test cache
        console.log("\n========================================");
        console.log("Second run - should use cached results:");
        console.log("========================================");
        const data2 = JSON.parse(JSON.stringify(exampleData));
        const iterator2 = createIterator(data2, globalOptionsMixin, iteratorOptions);
        // Should use cached values (callbacks won't run for cached object transform)
        await iterator2.transform(fieldMappings);
        console.log("\nBefore/After Comparison Example:");
        console.log(`Original description: ${exampleData.products.fruits[0].description}`);
        console.log(`Transformed description: ${data2.products.fruits[0].description}`);
        console.log(`Original name: ${exampleData.products.fruits[0].name}`);
        console.log(`Marketing name: ${data2.products.fruits[0].marketingName || 'Not available'}`);
        console.log("\nNumber Arrays Transformation Examples:");
        console.log(`Original prices: ${JSON.stringify(exampleData.numberArrays.prices)}`);
        console.log(`Pricing analysis: ${data2.numberArrays.pricingAnalysis || 'Not available'}`);
        console.log(`Original ratings: ${JSON.stringify(exampleData.numberArrays.ratings)}`);
        console.log(`Ratings summary: ${data2.numberArrays.ratingsSummary || 'Not available'}`);
        if (data2.productReview && data2.productReview.analysis) {
            console.log("\nReview Analysis Example:");
            console.log(`Original review: ${exampleData.productReview.reviewText}`);
            try {
                // Parse the JSON string if needed
                const analysisJson = typeof data2.productReview.analysis === 'string'
                    ? JSON.parse(data2.productReview.analysis)
                    : data2.productReview.analysis;
                console.log(`Analyzed review: ${JSON.stringify(analysisJson, null, 2)}`);
            }
            catch (e) {
                console.log(`Analyzed review: ${data2.productReview.analysis}`);
            }
        }
        return data;
    }
    catch (error) {
        console.error("ERROR during transformation:", error);
        throw error;
    }
}
if (process.argv[1] && process.argv[1].includes('iterator-factory-example')) {
    const isDebug = process.argv.includes('--debug');
    console.log('Starting iterator factory example...');
    console.log(`Command arguments: ${process.argv.slice(2).join(', ')}`);
    console.log(`Debug mode: ${isDebug ? 'enabled' : 'disabled'}`);
    if (isDebug) {
        console.log("Running in debug mode with verbose output");
    }
    // Run the standard factory example
    factoryExample()
        .then(() => {
        console.log("\n========================================");
        console.log("Running simplified transform example:");
        console.log("========================================");
        // Run the simplified transform example
        return simpleTransformExample();
    })
        .catch(error => {
        console.error("Unhandled error:", error);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3ItZmFjdG9yeS1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2V4YW1wbGVzL2NvcmUvaXRlcmF0b3ItZmFjdG9yeS1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFFekIsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDN0UsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzdDLE9BQU8sRUFBZ0IsY0FBYyxFQUFFLG9CQUFvQixFQUFnQyxTQUFTLEVBQVksa0JBQWtCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUU5SixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVuRDs7Ozs7Ozs7O0dBU0c7QUFHSCxNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQztBQUN0RCxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFFNUIsa0RBQWtEO0FBQ2xELE1BQU0sQ0FBQyxLQUFLLFVBQVUsc0JBQXNCO0lBQ3hDLElBQUksQ0FBQztRQUNELCtDQUErQztRQUMvQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUVyRCx5REFBeUQ7UUFDekQsTUFBTSxTQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNqQyxLQUFLLEVBQUUsS0FBSztZQUNaLE1BQU0sRUFBRSxNQUFNO1lBQ2QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVO1NBQzFCLEVBQUU7WUFDQyxXQUFXLEVBQUUsaUJBQWlC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