import { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
import { ZodSchema } from 'zod';
export declare const zodFunction: <T extends object>({ function: fn, schema, description, name, }: {
    function: (args: T) => Promise<object>;
    schema: ZodSchema<T>;
    description?: string;
    name?: string;
}) => RunnableToolFunctionWithParse<T>;
