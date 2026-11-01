import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction";
import { IKBotTask } from './ai-tools/index.js';
export type TMessageParam = ChatCompletionMessageParam & {
    type?: string;
};
export declare const defaultTemplate: {
    include: string[];
    messages: any[];
    tools: string[];
};
export declare const resolve_package_path: (dir: string) => string;
export declare const load: (options: IKBotTask) => Promise<RunnableToolFunctionWithParse<any>[]>;
