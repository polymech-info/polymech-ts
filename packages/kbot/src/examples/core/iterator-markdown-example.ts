import * as fs from 'fs';
import * as path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import { sync as write } from "@polymech/fs/write";
import type { IKBotTask } from '../../ai-tools/index.js';
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js';
import { E_Mode } from '../../zod_schema.js';
import { FieldMapping, transform, IOptions, createLLMTransformer, CacheConfig, ILogger } from '../../iterator.js';
import { OnTransformCallback } from '../../async-iterator.js';
import { deepClone } from '@polymech/core/objects';
import { run } from '../../commands/run.js';

/**
 * Notes for LLM modifications
 *
 * - to test it, use `npm run examples:iterator-markdown` (after adding the script)
 * - demonstrates applying the iterator to a Markdown file parsed into an AST (mdast)
 * - targets headings, paragraphs, and table cells for transformation
 * - uses the 'format' option for structured data extraction
 * - uses 'onTransform' callback
 */

const MODEL = E_OPENROUTER_MODEL.MODEL_OPENAI_GPT_4O_MINI; // Corrected model name
const ROUTER = 'openrouter';
const INPUT_MD_PATH = path.resolve('./tests/test-data/core/md-test.md');
const OUTPUT_MD_PATH = path.resolve('./tests/test-data/core/md-test-out.md');
const OUTPUT_JSON_PATH = path.resolve('./tests/test-data/core/md-test-out.json');

// Basic logger
const logger: ILogger = {
    info: (message: string) => console.log(`INFO: ${message}`),
    warn: (message: string) => console.log(`WARN: ${message}`),
    error: (message: string, error?: any) => console.error(`ERROR: ${message}`, error)
};

// This transformer factory uses the standard createLLMTransformer.
// It assumes the iterator passes the STRING value found at the JSONPath.
// It does NOT handle direct AST node modification for targetPath=null cases,
// because it only receives the string value, not the node context.
// In-place modification of the AST based on primitive value paths is complex
// with this generic iterator and requires a different approach (e.g., post-processing).
// Transformations using targetPath (like analysisResult) will work as expected
// if the JSONPath targets the NODE containing the text.
function getLLMTransformerForMdast(
    options: IKBotTask,
    baseLogger: ILogger = logger,
    cacheConfig?: CacheConfig
): (textValue: string, jsonPath: string) => Promise<string> {
    const llmTransformer = createLLMTransformer(options, baseLogger, cacheConfig);
    // Just return the basic LLM transformer - it expects a string and returns a string.
    return llmTransformer;
}

// Define field mappings for the mdast structure
// Mappings for standard transforms (targetPath: null)
const standardMappings: FieldMapping[] = [
    {
        jsonPath: '$.children[?(@.type=="heading" && @.depth <= 5)].children[?(@.type=="text")].value',
        targetPath: null,
        options: { prompt: 'Rewrite this heading to be more concise and impactful (max 5 words).' }
    },
    {
        jsonPath: '$.children[?(@.type=="paragraph")].children[?(@.type=="text")].value',
        targetPath: null,
        options: { prompt: 'Summarize this paragraph in one short sentence (max 15 words).' }
    },
    {
        jsonPath: '$.children[?(@.type=="table")].children[*].children[*].children[?(@.type=="text")].value',
        targetPath: null,
        options: { prompt: 'Rephrase this table cell content slightly.' }
    }
];

// Example onTransform callback for Markdown
const mdOnTransform: OnTransformCallback = async (jsonPath, value, options) => {
    let textValue = typeof value === 'string' ? value : JSON.stringify(value); // Handle potential node objects if path isn't perfect
    console.log(` -> mdOnTransform: Path='${jsonPath}', Original Value='${textValue.substring(0, 50)}...'`);
    // No modification needed here, just logging
    return textValue; // Must return the string value the LLM transformer expects
};

export async function markdownTransformExample(useCache = true) {
    console.log("========================================");
    console.log("Starting Markdown transform example");
    console.log(`Using cache: ${useCache}`);
    console.log("========================================");

    try {
        // 1. Read Markdown file
        const markdownInput = fs.readFileSync(INPUT_MD_PATH, 'utf8');

        // 2. Parse Markdown to AST
        const processor = unified().use(remarkParse);
        const ast = processor.parse(markdownInput);

        // Make a deep copy to avoid modifying the original AST if transform fails
        // Note: Standard deepClone might not work perfectly with complex AST nodes (position, data fields).
        // Using deepClone instead of JSON.parse/stringify
        let astToTransform = deepClone(ast);

        // --- Pre-processing: Add temporary ID to the target node --- 
        const analysisTargetText = "results"; // Text to identify the node
        const tempIdValue = 'analyze-me';
        let identifiedNodeForAnalysis: any = null; // Store reference to the node
        try {
            visit(astToTransform, 'paragraph', (node: any) => {
                if (node.children?.[0]?.value?.includes(analysisTargetText)) {
                    node.tempId = tempIdValue;
                    identifiedNodeForAnalysis = node; // Store the reference
                    logger.info(`[Pre-process] Added tempId='${tempIdValue}' and stored reference to node containing '${analysisTargetText}'`);
                }
            });
        } catch(e) {
            logger.error("[Pre-process] Error adding temporary ID:", e);
             identifiedNodeForAnalysis = null; // Ensure we don't proceed if tagging failed
        }

        // 3. Define global options and iterator options
        const globalOptionsMixin: Partial<IKBotTask> = {
            model: MODEL,
            router: ROUTER,
            mode: E_Mode.COMPLETION,
        };

        const iteratorOptions: IOptions = {
            transformerFactory: (opts) => getLLMTransformerForMdast(opts, logger, { enabled: useCache }),
            logger: logger,
            cacheConfig: { enabled: useCache, namespace: 'markdown-transforms' },
            onTransform: async (jsonPath, value, kbotOptions) => {
                let textContent = '';
                if (typeof value === 'string') { textContent = value; console.log(` -> onTransform String Value: Path='${jsonPath}', Value='${textContent.substring(0, 50)}...'`); }
                 else if (typeof value === 'object' && value !== null) { const node = value as any; textContent = node.children?.[0]?.value || node.value || ''; console.log(` -> onTransform AST Node: Path='${jsonPath}', Node Type='${node?.type}', Extracted Text='${textContent.substring(0, 50)}...'`); }
                 else { console.log(` -> onTransform Unexpected Value Type: Path='${jsonPath}', Type='${typeof value}'`); }
                 return textContent;
            },
             errorCallback: (path, value, error) => {
                if (error instanceof Error) { logger.error(`Error processing path ${path}: ${error.message}`, error); } else { logger.error(`Error processing path ${path}: ${error}`, error); }
             },
             filterCallback: async (value, jsonPath) => {
                 if (typeof value === 'object' && value !== null) { return true; } if (typeof value === 'string') { const allow = value.trim() !== ''; if (!allow) { logger.info(`Filter: Skipping empty string at ${jsonPath}`); } return allow; } logger.warn(`Filter: Skipping non-string/non-object value type (${typeof value}) at ${jsonPath}`); return false;
             }
        };

        // 4. Run standard transformations
        console.log("Applying standard transformations to AST...");
        await transform(
            astToTransform,
            standardMappings,
            globalOptionsMixin,
            iteratorOptions
        );

        // 5. Perform Analysis Manually (if node was identified)
        console.log("\nPerforming manual analysis...");
        let analysisData: any = null; // Store successfully parsed result here
        let rawAnalysisResult: string | null = null; // Store raw LLM result

        if (identifiedNodeForAnalysis) {
            try {
                let nodeText: string = '';
                // Extract text from the (now potentially modified) node
                if (identifiedNodeForAnalysis.children?.[0]?.type === 'text') {
                    nodeText = identifiedNodeForAnalysis.children[0].value || '';
                }
                logger.info(`[Manual Analysis] Found node with tempId. Extracted text: "${nodeText.substring(0, 50)}..."`);

                if (nodeText) {
                    // Define analysis task options
                    const analysisTaskOptions: IKBotTask = {
                        ...globalOptionsMixin,
                        // Explicitly request ONLY JSON matching the schema
                        prompt: `Analyze the following text and extract keywords and sentiment. Respond ONLY with a valid JSON object matching the schema provided in the 'format' field. Do not include any other text, explanations, or markdown formatting.\n\nText to analyze:\n"${nodeText}"`, 
                        format: {
                            type: "object",
                            properties: {
                                sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                                keywords: { type: "array", items: { type: "string" }, maxItems: 5 }
                            },
                            required: ["sentiment", "keywords"]
                        },
                        mode: E_Mode.COMPLETION
                    };

                    // Call the run command
                    logger.info(`[Manual Analysis] Calling run command with format option...`);
                    const results = await run(analysisTaskOptions);

                    // Process the result (run should return the parsed object)
                    if (results && results.length > 0) {
                        const rawResult = results[0];
                        logger.info(`[Manual Analysis] Raw result from run: ${JSON.stringify(rawResult)}`);

                        if (typeof rawResult === 'object') {
                            // If it's already an object, use it directly
                            analysisData = rawResult;
                            logger.info(`[Manual Analysis] 'run' returned an object.`);
                        } else if (typeof rawResult === 'string') {
                            // If it's a string, try to parse it as JSON
                            logger.info(`[Manual Analysis] 'run' returned a string, attempting JSON parse...`);
                            try {
                                // Basic cleanup: Remove potential markdown like ```json ... ``` wrapper
                                const cleanedString = rawResult.replace(/^```json\s*|```$/g, '').trim();
                                analysisData = JSON.parse(cleanedString);
                                logger.info(`[Manual Analysis] Successfully parsed string result.`);
                            } catch (parseError) {
                                // Corrected logger calls
                                logger.error(`[Manual Analysis] Failed to parse string result from 'run': ${parseError instanceof Error ? parseError.message : parseError}`);
                                logger.error(`[Manual Analysis] Raw string was: ${rawResult}`);
                                identifiedNodeForAnalysis.manualAnalysisResult = { error: 'parse failed', raw: rawResult }; // Store error/raw
                            }
                        } else {
                            // Unexpected type
                            logger.warn(`[Manual Analysis] 'run' returned unexpected type: ${typeof rawResult}`);
                            identifiedNodeForAnalysis.manualAnalysisResult = { error: 'unexpected result type', raw: rawResult };
                        }

                        // If parsing succeeded and we have data, attach it
                        if (analysisData) {
                            identifiedNodeForAnalysis.manualAnalysisResult = analysisData; // Attach parsed data
                            logger.info(`[Manual Analysis] Successfully attached analysis result object.`);
                            logger.info(`[Manual Analysis] Result Content: ${JSON.stringify(analysisData, null, 2)}`);
                        } else {
                            logger.warn(`[Manual Analysis] 'run' command returned empty or unexpected result: ${JSON.stringify(results)}`);
                            identifiedNodeForAnalysis.manualAnalysisResult = { error: 'empty or unexpected result', raw: results };
                        }
                    }

                    // Clean up tempId after processing
                    if (identifiedNodeForAnalysis && identifiedNodeForAnalysis.tempId) {
                        delete identifiedNodeForAnalysis.tempId;
                        logger.info(`[Manual Analysis] Removed tempId.`);
                    }

                } else {
                    logger.warn("[Manual Analysis] Node text was empty, skipping analysis LLM call.");
                    identifiedNodeForAnalysis.manualAnalysisResult = { error: 'empty source text' };
                }

            } catch (manualAnalysisError) {
                logger.error("Error during manual analysis step:", manualAnalysisError);
                // Attempt to clean up tempId even if analysis failed
                if (identifiedNodeForAnalysis && identifiedNodeForAnalysis.tempId) {
                    delete identifiedNodeForAnalysis.tempId;
                }
            }
        } else {
            logger.warn("[Manual Analysis] Target node for analysis was not identified in pre-processing. Skipping analysis.");
        }

        // --- Debug log checks for manualAnalysisResult --- 
        console.log("\n[DEBUG] Inspecting AST after all transforms, before visit call:");
        try {
            const potentialNode = astToTransform.children?.[16];
            if (potentialNode && potentialNode.type === 'paragraph') {
                const hasManualProp = potentialNode.hasOwnProperty('manualAnalysisResult');
                console.log(`[DEBUG] Does potential node have manualAnalysisResult? ${hasManualProp}`);
                if (hasManualProp) {
                    console.log("[DEBUG] manualAnalysisResult Content:", (potentialNode as any).manualAnalysisResult);
                }
            } else {
                console.log("[DEBUG] Could not find the target paragraph node at index 16.");
            }
            console.log("---------------------------------------");
        } catch (e) {
            console.error("[DEBUG] Error during pre-visit inspection:", e);
        }
        
        // Log the manually obtained result (if parsed successfully)
        if (analysisData) {
            console.log("\nStructured Analysis Result (Manually Obtained):");
            console.log(JSON.stringify(analysisData, null, 2));
        } else {
            console.log("\nStructured Analysis Result was not successfully obtained.");
            // Raw result might be in the error object attached to the node now
        }

        // 6. Save the transformed AST to JSON (will include manualAnalysisResult)
        console.log(`\nWriting transformed AST to JSON: ${OUTPUT_JSON_PATH}`);
        try {
            const outputJsonDir = path.dirname(OUTPUT_JSON_PATH);
            if (!fs.existsSync(outputJsonDir)) { fs.mkdirSync(outputJsonDir, { recursive: true }); }
            fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(astToTransform, null, 2));
            console.log("AST JSON saved successfully.");
        } catch (error) {
            logger.error("Failed to write AST JSON:", error);
        }

        // 7. Stringify the modified AST back to Markdown
        console.log("\nStringifying transformed AST to Markdown...");
        try {
            const processorStringify = unified().use(remarkStringify);
            const outputMarkdown = processorStringify.stringify(astToTransform as any);

            // 8. Write the Markdown output file
            console.log(`Writing output Markdown to: ${OUTPUT_MD_PATH}`);
            const outputMdDir = path.dirname(OUTPUT_MD_PATH);
            if (!fs.existsSync(outputMdDir)) { fs.mkdirSync(outputMdDir, { recursive: true }); }
            write(OUTPUT_MD_PATH, outputMarkdown);
            console.log("Markdown file saved successfully.");
        } catch (stringifyError) {
            logger.error("Failed to stringify or write Markdown output:", stringifyError);
        }

        return astToTransform;

    } catch (error) {
        logger.error("ERROR during Markdown transformation:", error);
        throw error;
    }
}

// Add run logic
if (process.argv[1] && process.argv[1].includes('iterator-markdown-example')) {
    const noCache = process.argv.includes('--no-cache');
    markdownTransformExample(!noCache)
        .then(() => {
            console.log("\nMarkdown example finished successfully.");
        })
        .catch(error => {
            console.error("\nMarkdown example failed:", error);
            process.exit(1); // Exit with error code
        });
} 