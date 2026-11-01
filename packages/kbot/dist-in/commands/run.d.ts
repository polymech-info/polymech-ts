import { ChatCompletionToolRunnerParams } from 'openai/lib/ChatCompletionRunner';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { IKBotTask } from '../ai-tools/index.js';
export declare const default_sort: (files: string[]) => string[];
type ProcessRunResult = string | boolean | Record<string, unknown> | null;
/**
 * Complete options by setting up defaults, validating inputs, and initializing required components
 *
 * @param opts - The initial task options
 * @returns - The fully configured options object or null if validation fails
 */
export declare const complete_options: (opts: IKBotTask) => Promise<IKBotTask | null>;
/**
 * Gather all messages from various sources for the task
 *
 * @param opts - The task options
 * @param options - The completed options
 * @returns - Array of messages and source files
 */
export declare const complete_messages: (opts: IKBotTask, options: IKBotTask) => Promise<{
    messages: Array<ChatCompletionMessageParam>;
    files: any[];
}>;
/**
 * Create and configure the parameters for the request
 *
 * @param options - The completed options
 * @param messages - The gathered messages
 * @returns - The configured parameters for the API request
 */
export declare const complete_params: (options: IKBotTask, messages: Array<ChatCompletionMessageParam>) => Promise<ChatCompletionToolRunnerParams<any>>;
/**
 * Execute the request based on the mode and return the result
 *
 * @param options - The completed options
 * @param client - The API client
 * @param params - The request parameters
 * @returns - The result of the execution
 */
export declare const execute_request: (options: IKBotTask, client: any, params: ChatCompletionToolRunnerParams<any>) => Promise<ProcessRunResult>;
/**
 * Process a task with the configured options and return the result
 *
 * @param opts - The task options
 * @returns - The result of the task execution
 */
export declare const processRun: (opts: IKBotTask) => Promise<ProcessRunResult>;
export declare const run: (opts: IKBotTask) => Promise<ProcessRunResult[]>;
export {};
