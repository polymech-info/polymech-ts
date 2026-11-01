import { z } from 'zod';
import * as path from 'node:path';
import chalk from 'chalk';
import env from 'env-var';
import { generate_interfaces, ZodMetaMap, resolve, write } from '@polymech/commons';
import { sync as exists } from '@polymech/fs/exists';
import { sync as writeFS } from '@polymech/fs/write';
import { sync as readFS } from '@polymech/fs/read';
import { isArray, isFunction, isString } from '@polymech/core/primitives';
import { zodResponseFormat } from "openai/helpers/zod";
import { API_PREFIX, LOGGING_DIRECTORY, PREFERENCES_FILE_NAME } from './constants.js';
export const get_var = (key = '') => env.get(key).asString() || env.get(key.replace(/-/g, '_')).asString() || env.get(key.replace(/_/g, '-')).asString();
export const HOME = (sub = '') => path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || '', sub);
export const PREFERENCES_DEFAULT = (key = 'KBOT_PREFERENCES') => get_var(key) || path.join(HOME(`.${API_PREFIX}`), PREFERENCES_FILE_NAME);
import { jsonSchemaToZod } from "json-schema-to-zod";
import { Filters } from './filters.js';
import { models_dist } from './models/index.js';
import { defaultTemplate } from './tools.js';
export const E_Filters = z.enum(Object.keys(Filters));
export const E_RouterTypeSchema = z.enum(['openrouter', 'openai', 'deepseek', 'huggingface', 'ollama', 'fireworks', 'gemini', 'xai']);
export const E_Mode = {
    COMPLETION: 'completion',
    TOOLS: 'tools',
    ASSISTANT: 'assistant',
    RESPONSES: 'responses',
    CUSTOM: 'custom'
};
export const EType = z.enum([
    E_Mode.COMPLETION,
    E_Mode.TOOLS,
    E_Mode.ASSISTANT,
    E_Mode.RESPONSES,
    E_Mode.CUSTOM
]);
// Define the new enum for append modes
export const E_AppendMode = z.enum(['concat', 'merge', 'replace']);
// Define the new enum for wrap modes
export const E_WrapMode = z.enum(['meta', 'none']);
// Define the new enum for glob extensions (presets)
export const E_GlobExtension = z.enum(['match-cpp']); // Add more presets here later if needed
export { fetchOpenRouterModels, listModelsAsStrings as listOpenRouterModelsAsStrings } from './models/openrouter.js';
export { fetchOpenAIModels, listModelsAsStrings as listOpenAIModelsAsStrings } from './models/openai.js';
let schemaMap;
export const OptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('path', z.string()
        .min(1)
        .default('.')
        .describe('Target directory'), { 'ui:widget': 'file' })
        .add('prompt', z.string()
        .describe('The prompt. Supports file paths and environment variables.')
        .optional())
        .add('output', z.string()
        .optional()
        .describe('Optional output path for modified files (Tool mode only)'))
        .add('dst', z.string()
        .optional()
        .describe('Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for "completion" mode'))
        .add('append', E_AppendMode
        .optional()
        .describe('How to handle output if --dst file already exists: "concat" (append) or "merge" (try to merge structures if possible, otherwise append). Only used if --dst is specified.'))
        .add('wrap', E_WrapMode
        .default('none')
        .describe('Specify how to wrap the output, "meta (file name, absolute path, cwd)" or "none".'))
        .add('each', z.string()
        .optional()
        .describe('Iterate over items, supported: GLOB | Path to JSON File | array of strings (comma separated). To test different models, use --each="gpt-3.5-turbo,gpt-4o", the actual string will exposed as variable `ITEM`, eg: --dst="${ITEM}-output.md"'))
        .add('disable', z.array(z.string())
        .default([])
        .describe(`Disable tools categories, eg: --disable=${defaultTemplate.tools.join(',')}`))
        .add('disableTools', z.array(z.string())
        .optional()
        .default([])
        .describe('List of specific tools to disable'))
        .add('tools', z.union([
        z.array(z.string()),
        z.string()
    ]).optional()
        .default(defaultTemplate.tools)
        .describe(`List of tools to use. Can be built-in tool names or paths to custom tool files. Default: ${defaultTemplate.tools.join(',')}`)
        .transform((val) => Array.isArray(val) ? val : val.split(',')))
        .add('include', z.array(z.string())
        .optional()
        .describe('Comma separated glob patterns or paths, eg --include=src/*.tsx,src/*.ts --include=package.json'))
        .add('exclude', z.array(z.string())
        .optional()
        .describe('Comma separated glob patterns or paths, eg --exclude=src/*.tsx,src/*.ts --exclude=package.json'))
        .add('globExtension', z.union([E_GlobExtension, z.string()]) // Allow preset enum or custom string
        .optional()
        .describe('Specify a glob extension behavior. Available presets: ' + E_GlobExtension.options.join(', ') +
        '. Also accepts a custom glob pattern with variables like ${SRC_DIR}, ${SRC_NAME}, ${SRC_EXT}. ' +
        'E.g., \"match-cpp\" or \"${SRC_DIR}/${SRC_NAME}*.cpp\"'))
        .add('api_key', z.string()
        .optional()
        .describe('Explicit API key to use'))
        .add('model', z.string()
        .optional()
        .describe(`AI model to use for processing. Available models:\n${models_dist().join('\n')}`))
        .add('router', z.string()
        .default('openrouter')
        .describe('Router to use: openai, openrouter or deepseek'))
        .add('mode', EType
        .default(E_Mode.TOOLS)
        .describe(`Chat completion mode:\n\t completion, tools, assistant.
          ${chalk.green.bold('completion')}: no support for tools, please use --dst parameter to save the output.
          ${chalk.green.bold('tools')}: allows for tools to be used, eg 'save to ./output.md'. Not all models support this mode.
          ${chalk.green.bold('responses')}: allows for responses to be used, eg 'save to ./output.md'. Not all models support this mode.
          ${chalk.green.bold('assistant')}: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :
          ${chalk.green.bold('custom')}: custom mode
      `))
        .add('logLevel', z.number()
        .default(4)
        .describe('Logging level for the application'))
        .add('profile', z.string()
        .optional()
        .describe('Path to profile for variables. Supports environment variables.'))
        .add('baseURL', z.string()
        .optional()
        .describe('Base URL for the API, set via --router or directly'))
        .add('config', z.string()
        .optional()
        .describe('Path to JSON configuration file (API keys). Supports environment variables.'))
        .add('dump', z.string()
        .optional()
        .describe('Create a script'))
        .add('preferences', z.string()
        .default(PREFERENCES_DEFAULT())
        .describe('Path to preferences file, eg: location, your email address, gender, etc. Supports environment variables.'))
        .add('logs', z.string()
        .default(LOGGING_DIRECTORY)
        .describe('Logging directory')).add('stream', z.boolean()
        .default(false)
        .describe('Enable streaming (verbose LLM output)'))
        .add('alt', z.boolean()
        .default(false)
        .describe('Use alternate tokenizer & instead of $'))
        .add('env', z.string()
        .default('default')
        .describe('Environment (in profile)'))
        .add('variables', z.record(z.string(), z.string())
        .optional()
        .default({}))
        .add('filters', z.union([
        z.string(),
        z.array(E_Filters),
        z.array(z.string()),
        z.array(z.function())
    ])
        .optional()
        .default('')
        .describe(`List of filters to apply to the output.
         Used only in completion mode and a given output file specified with --dst. 
         It unwraps by default any code or data in Markdown. 
         Choices:\n\t${Object.keys(Filters)}\n`)
        .transform((val) => {
        if (isArray(val) && val.length && isFunction(val[0])) {
            return val;
        }
        let filters = isString(val) ? val.split(',') : val;
        filters = filters.map((f) => Filters[f]).filter(Boolean);
        return filters;
    }))
        .add('query', z.string()
        .nullable()
        .optional()
        .default(null)
        .describe('JSONPath query to be used to transform input objects'))
        .add('dry', z.union([
        z.boolean(),
        z.string().transform((val) => val.toLowerCase() === 'true')
    ])
        .optional()
        .default(false)
        .describe('Dry run - only write out parameters without making API calls'))
        .add('customTools', z.array(z.any())
        .optional()
        .describe('Pre-built tool definitions (OpenAI RunnableToolFunctionWithParse[]) injected directly. When set, skips built-in tool loading.'))
        .add('format', z.union([
        z.string().transform((val) => {
            try {
                // Check if the string is a file path
                if (exists(val) && val.endsWith('.json')) {
                    const content = readFS(val);
                    const schema = JSON.parse(content.toString());
                    const zodSchemaStr = jsonSchemaToZod(schema);
                    // Evaluate the string to get the actual Zod schema
                    const zodSchema = eval(`(${zodSchemaStr})`);
                    return zodResponseFormat(zodSchema, "format");
                }
                else {
                    // Try parsing as JSON schema first
                    try {
                        const schema = JSON.parse(val);
                        const zodSchemaStr = jsonSchemaToZod(schema);
                        const zodSchema = eval(`(${zodSchemaStr})`);
                        return zodResponseFormat(zodSchema, "format");
                    }
                    catch {
                        // If not JSON, try evaluating as Zod schema directly
                        const zodSchema = eval(`(${val})`);
                        return zodResponseFormat(zodSchema, "format");
                    }
                }
            }
            catch (e) {
                console.error(`Error parsing format: ${e}`);
                return null;
            }
        }),
        z.any().transform((val) => {
            // If it's already a Zod schema, use it directly
            if (val && typeof val === 'object' && 'parse' in val) {
                return zodResponseFormat(val, "format");
            }
            return null;
        })
    ])
        .optional()
        .describe('Format for structured outputs. Can be a Zod schema, a Zod schema string, a JSON schema string, or a path to a JSON file.'));
    return schemaMap.root()
        .passthrough()
        .describe('IKBotOptions');
};
export const types = () => {
    generate_interfaces([OptionsSchema()], 'src/zod_types.ts');
    generate_interfaces([OptionsSchema()], path.resolve(resolve('../ai-tools/src/types_kbot.ts')));
    schemas();
};
export const schemas = () => {
    write([OptionsSchema()], 'schema.json', 'kbot', {});
    writeFS('schema_ui.json', schemaMap.getUISchema());
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9kX3NjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy96b2Rfc2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxLQUFLLENBQUE7QUFDdkIsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUE7QUFDakMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFBO0FBQ3pCLE9BQU8sR0FBRyxNQUFNLFNBQVMsQ0FBQTtBQUN6QixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNuRixPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksT0FBTyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUN6RSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUV0RCxPQUFPLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFckYsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVB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