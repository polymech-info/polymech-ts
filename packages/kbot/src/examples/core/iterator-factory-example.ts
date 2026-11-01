import { sync as write } from "@polymech/fs/write";
import * as path from 'path';
import * as fs from 'fs';
import type { IKBotTask } from '../../ai-tools/index.js';
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js';
import { E_Mode } from '../../zod_schema.js';
import { FieldMapping, createIterator, createLLMTransformer, CacheConfig, INetworkOptions, transform, IOptions, removeEmptyObjects } from '../../iterator.js';
import { OnTransformCallback, OnTransformedCallback } from '../../async-iterator.js';
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
            } catch (e) {
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
    } catch (error) {
        console.error("ERROR during simplified transformation:", error);
        throw error;
    }
}

const LOG_LEVEL = 2;

const logger = {
    info: (message: string) => console.log(`INFO: ${message}`),
    warn: (message: string) => console.log(`WARN: ${message}`),
    error: (message: string) => console.error(`ERROR: ${message}`),
    debug: (message: string) => console.log(`DEBUG: ${message}`),
    trace: (message: string) => console.log(`TRACE: ${message}`)
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
const fieldMappings: FieldMapping[] = [
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
const exampleOnTransform: OnTransformCallback = async (jsonPath, value, options) => {
    let valueToTransform: string;
    // Check if the value is not a string (e.g., our number arrays)
    if (typeof value !== 'string') {
        valueToTransform = JSON.stringify(value);
        console.log(` -> onTransform: Path='${jsonPath}', Original Value (Array)=${valueToTransform}, Options Model='${options?.model}'`);
    } else {
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
const exampleOnTransformed: OnTransformedCallback = async (jsonPath, transformedValue, options) => {
    console.log(` <- onTransformed: Path='${jsonPath}', Transformed Value='${transformedValue.substring(0, 100)}...', Options Model='${options?.model}'`);
    // Example: Post-process the LLM response
    if (jsonPath.includes('nutrition')) {
        return `${transformedValue} [HEALTH FOCUS]`;
    }
    return transformedValue; // Return transformed value if no modification needed
};

// Simpler callbacks for the second example
const simpleOnTransform: OnTransformCallback = async (jsonPath, value) => {
    let valueToTransform: string;
    // Check if the value is not a string (e.g., our number arrays)
    if (typeof value !== 'string') {
        valueToTransform = JSON.stringify(value);
        console.log(` -> simpleOnTransform: Path='${jsonPath}' (Array stringified)`);
    } else {
        valueToTransform = value;
        console.log(` -> simpleOnTransform: Path='${jsonPath}'`);
    }
    return valueToTransform;
};

const simpleOnTransformed: OnTransformedCallback = async (jsonPath, transformedValue) => {
    console.log(` <- simpleOnTransformed: Path='${jsonPath}'`);
    return transformedValue;
};

// Error handler
const errorCallback = (path: string, value: string, error: any) => {
    logger.error(`Error transforming ${path}: ${error.message}`);
};

// Network configuration
const networkOptions: INetworkOptions = {
    throttleDelay: 1000,
    concurrentTasks: 1,
    maxRetries: 3,
    retryDelay: 2000
};

// Cache configuration
const cacheConfig: CacheConfig = {
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
        const globalOptionsMixin: Partial<IKBotTask> = {
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
        } catch (error) {
            console.warn('Failed to clear cache, proceeding anyway:', error);
        }
        // --- End Cache Clearing Logic ---

        // Combine all options including callbacks for createIterator
        const iteratorOptions: IOptions = {
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
        const iterator = createIterator(
            data, 
            globalOptionsMixin,
            iteratorOptions
        );
        
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
            } catch (e) {
                console.log(data.productReview.analysis);
            }
        }
        
        // Create a second instance with the same data to test cache
        console.log("\n========================================");
        console.log("Second run - should use cached results:");
        console.log("========================================");
        
        const data2 = JSON.parse(JSON.stringify(exampleData));
        
        const iterator2 = createIterator(
            data2, 
            globalOptionsMixin,
            iteratorOptions
        );
        
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
            } catch (e) {
                console.log(`Analyzed review: ${data2.productReview.analysis}`);
            }
        }

        return data;
    } catch (error) {
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