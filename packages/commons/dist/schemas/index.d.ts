import * as CLI from 'yargs';
import { z, ZodTypeAny, ZodObject } from 'zod';
export * from './path.js';
export * from './zod_map.js';
export declare const generate_interfaces: (schemas: ZodObject<any>[], dst: string) => void;
export declare const enumerateHelpStrings: (schema: ZodTypeAny, path: string[], logger: any) => void;
export declare const yargsDefaults: (yargs: CLI.Argv) => any;
export declare const getInnerSchema: (schema: ZodTypeAny) => ZodTypeAny;
export declare const getInnerType: (type: ZodTypeAny) => any;
export declare const getDefaultValue: (schema: ZodTypeAny) => any;
export declare const getFieldDefaultValue: (schema: ZodTypeAny) => any | undefined;
export declare const getDescription: (schema: ZodTypeAny) => string | undefined;
export declare const toYargs: (yargs: CLI.Argv, zodSchema: ZodObject<any>, options?: {
    onKey?: (yargs: CLI.Argv, key: string, options: any) => any;
}) => CLI.Argv;
export declare const WRITERS: {
    '.json': (data: any, file: string, name: string, options: {}) => void;
};
export declare const writer: (file: string) => any;
export declare const write: (schemas: ZodObject<any>[], file: string, name: string, options: {}) => void;
export declare const combineValidatorsOr: (validators: z.ZodTypeAny[]) => z.ZodString;
export declare const combineValidatorsOrUsingZod: (validators: z.ZodTypeAny[]) => z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
export declare const combineValidatorsOrUsingZod2: (validators: z.ZodTypeAny[]) => z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
