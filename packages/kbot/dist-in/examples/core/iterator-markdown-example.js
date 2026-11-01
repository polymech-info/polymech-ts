import * as fs from 'fs';
import * as path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import { sync as write } from "@polymech/fs/write";
import { E_OPENROUTER_MODEL } from '../../models/cache/openrouter-models.js';
import { E_Mode } from '../../zod_schema.js';
import { transform, createLLMTransformer } from '../../iterator.js';
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
const logger = {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.log(`WARN: ${message}`),
    error: (message, error) => console.error(`ERROR: ${message}`, error)
};
// This transformer factory uses the standard createLLMTransformer.
// It assumes the iterator passes the STRING value found at the JSONPath.
// It does NOT handle direct AST node modification for targetPath=null cases,
// because it only receives the string value, not the node context.
// In-place modification of the AST based on primitive value paths is complex
// with this generic iterator and requires a different approach (e.g., post-processing).
// Transformations using targetPath (like analysisResult) will work as expected
// if the JSONPath targets the NODE containing the text.
function getLLMTransformerForMdast(options, baseLogger = logger, cacheConfig) {
    const llmTransformer = createLLMTransformer(options, baseLogger, cacheConfig);
    // Just return the basic LLM transformer - it expects a string and returns a string.
    return llmTransformer;
}
// Define field mappings for the mdast structure
// Mappings for standard transforms (targetPath: null)
const standardMappings = [
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
const mdOnTransform = async (jsonPath, value, options) => {
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
        let identifiedNodeForAnalysis = null; // Store reference to the node
        try {
            visit(astToTransform, 'paragraph', (node) => {
                if (node.children?.[0]?.value?.includes(analysisTargetText)) {
                    node.tempId = tempIdValue;
                    identifiedNodeForAnalysis = node; // Store the reference
                    logger.info(`[Pre-process] Added tempId='${tempIdValue}' and stored reference to node containing '${analysisTargetText}'`);
                }
            });
        }
        catch (e) {
            logger.error("[Pre-process] Error adding temporary ID:", e);
            identifiedNodeForAnalysis = null; // Ensure we don't proceed if tagging failed
        }
        // 3. Define global options and iterator options
        const globalOptionsMixin = {
            model: MODEL,
            router: ROUTER,
            mode: E_Mode.COMPLETION,
        };
        const iteratorOptions = {
            transformerFactory: (opts) => getLLMTransformerForMdast(opts, logger, { enabled: useCache }),
            logger: logger,
            cacheConfig: { enabled: useCache, namespace: 'markdown-transforms' },
            onTransform: async (jsonPath, value, kbotOptions) => {
                let textContent = '';
                if (typeof value === 'string') {
                    textContent = value;
                    console.log(` -> onTransform String Value: Path='${jsonPath}', Value='${textContent.substring(0, 50)}...'`);
                }
                else if (typeof value === 'object' && value !== null) {
                    const node = value;
                    textContent = node.children?.[0]?.value || node.value || '';
                    console.log(` -> onTransform AST Node: Path='${jsonPath}', Node Type='${node?.type}', Extracted Text='${textContent.substring(0, 50)}...'`);
                }
                else {
                    console.log(` -> onTransform Unexpected Value Type: Path='${jsonPath}', Type='${typeof value}'`);
                }
                return textContent;
            },
            errorCallback: (path, value, error) => {
                if (error instanceof Error) {
                    logger.error(`Error processing path ${path}: ${error.message}`, error);
                }
                else {
                    logger.error(`Error processing path ${path}: ${error}`, error);
                }
            },
            filterCallback: async (value, jsonPath) => {
                if (typeof value === 'object' && value !== null) {
                    return true;
                }
                if (typeof value === 'string') {
                    const allow = value.trim() !== '';
                    if (!allow) {
                        logger.info(`Filter: Skipping empty string at ${jsonPath}`);
                    }
                    return allow;
                }
                logger.warn(`Filter: Skipping non-string/non-object value type (${typeof value}) at ${jsonPath}`);
                return false;
            }
        };
        // 4. Run standard transformations
        console.log("Applying standard transformations to AST...");
        await transform(astToTransform, standardMappings, globalOptionsMixin, iteratorOptions);
        // 5. Perform Analysis Manually (if node was identified)
        console.log("\nPerforming manual analysis...");
        let analysisData = null; // Store successfully parsed result here
        let rawAnalysisResult = null; // Store raw LLM result
        if (identifiedNodeForAnalysis) {
            try {
                let nodeText = '';
                // Extract text from the (now potentially modified) node
                if (identifiedNodeForAnalysis.children?.[0]?.type === 'text') {
                    nodeText = identifiedNodeForAnalysis.children[0].value || '';
                }
                logger.info(`[Manual Analysis] Found node with tempId. Extracted text: "${nodeText.substring(0, 50)}..."`);
                if (nodeText) {
                    // Define analysis task options
                    const analysisTaskOptions = {
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
                        }
                        else if (typeof rawResult === 'string') {
                            // If it's a string, try to parse it as JSON
                            logger.info(`[Manual Analysis] 'run' returned a string, attempting JSON parse...`);
                            try {
                                // Basic cleanup: Remove potential markdown like ```json ... ``` wrapper
                                const cleanedString = rawResult.replace(/^```json\s*|```$/g, '').trim();
                                analysisData = JSON.parse(cleanedString);
                                logger.info(`[Manual Analysis] Successfully parsed string result.`);
                            }
                            catch (parseError) {
                                // Corrected logger calls
                                logger.error(`[Manual Analysis] Failed to parse string result from 'run': ${parseError instanceof Error ? parseError.message : parseError}`);
                                logger.error(`[Manual Analysis] Raw string was: ${rawResult}`);
                                identifiedNodeForAnalysis.manualAnalysisResult = { error: 'parse failed', raw: rawResult }; // Store error/raw
                            }
                        }
                        else {
                            // Unexpected type
                            logger.warn(`[Manual Analysis] 'run' returned unexpected type: ${typeof rawResult}`);
                            identifiedNodeForAnalysis.manualAnalysisResult = { error: 'unexpected result type', raw: rawResult };
                        }
                        // If parsing succeeded and we have data, attach it
                        if (analysisData) {
                            identifiedNodeForAnalysis.manualAnalysisResult = analysisData; // Attach parsed data
                            logger.info(`[Manual Analysis] Successfully attached analysis result object.`);
                            logger.info(`[Manual Analysis] Result Content: ${JSON.stringify(analysisData, null, 2)}`);
                        }
                        else {
                            logger.warn(`[Manual Analysis] 'run' command returned empty or unexpected result: ${JSON.stringify(results)}`);
                            identifiedNodeForAnalysis.manualAnalysisResult = { error: 'empty or unexpected result', raw: results };
                        }
                    }
                    // Clean up tempId after processing
                    if (identifiedNodeForAnalysis && identifiedNodeForAnalysis.tempId) {
                        delete identifiedNodeForAnalysis.tempId;
                        logger.info(`[Manual Analysis] Removed tempId.`);
                    }
                }
                else {
                    logger.warn("[Manual Analysis] Node text was empty, skipping analysis LLM call.");
                    identifiedNodeForAnalysis.manualAnalysisResult = { error: 'empty source text' };
                }
            }
            catch (manualAnalysisError) {
                logger.error("Error during manual analysis step:", manualAnalysisError);
                // Attempt to clean up tempId even if analysis failed
                if (identifiedNodeForAnalysis && identifiedNodeForAnalysis.tempId) {
                    delete identifiedNodeForAnalysis.tempId;
                }
            }
        }
        else {
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
                    console.log("[DEBUG] manualAnalysisResult Content:", potentialNode.manualAnalysisResult);
                }
            }
            else {
                console.log("[DEBUG] Could not find the target paragraph node at index 16.");
            }
            console.log("---------------------------------------");
        }
        catch (e) {
            console.error("[DEBUG] Error during pre-visit inspection:", e);
        }
        // Log the manually obtained result (if parsed successfully)
        if (analysisData) {
            console.log("\nStructured Analysis Result (Manually Obtained):");
            console.log(JSON.stringify(analysisData, null, 2));
        }
        else {
            console.log("\nStructured Analysis Result was not successfully obtained.");
            // Raw result might be in the error object attached to the node now
        }
        // 6. Save the transformed AST to JSON (will include manualAnalysisResult)
        console.log(`\nWriting transformed AST to JSON: ${OUTPUT_JSON_PATH}`);
        try {
            const outputJsonDir = path.dirname(OUTPUT_JSON_PATH);
            if (!fs.existsSync(outputJsonDir)) {
                fs.mkdirSync(outputJsonDir, { recursive: true });
            }
            fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(astToTransform, null, 2));
            console.log("AST JSON saved successfully.");
        }
        catch (error) {
            logger.error("Failed to write AST JSON:", error);
        }
        // 7. Stringify the modified AST back to Markdown
        console.log("\nStringifying transformed AST to Markdown...");
        try {
            const processorStringify = unified().use(remarkStringify);
            const outputMarkdown = processorStringify.stringify(astToTransform);
            // 8. Write the Markdown output file
            console.log(`Writing output Markdown to: ${OUTPUT_MD_PATH}`);
            const outputMdDir = path.dirname(OUTPUT_MD_PATH);
            if (!fs.existsSync(outputMdDir)) {
                fs.mkdirSync(outputMdDir, { recursive: true });
            }
            write(OUTPUT_MD_PATH, outputMarkdown);
            console.log("Markdown file saved successfully.");
        }
        catch (stringifyError) {
            logger.error("Failed to stringify or write Markdown output:", stringifyError);
        }
        return astToTransform;
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3ItbWFya2Rvd24tZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9leGFtcGxlcy9jb3JlL2l0ZXJhdG9yLW1hcmtkb3duLWV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLFdBQVcsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxlQUFlLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFbkQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDN0UsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzdDLE9BQU8sRUFBZ0IsU0FBUyxFQUFZLG9CQUFvQixFQUF3QixNQUFNLG1CQUFtQixDQUFDO0FBRWxILE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFNUM7Ozs7Ozs7O0dBUUc7QUFFSCxNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLHVCQUF1QjtBQUNsRixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0FBQ3hFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsdUNBQXVDLENBQUMsQ0FBQztBQUM3RSxNQUFNLGdCQUFn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