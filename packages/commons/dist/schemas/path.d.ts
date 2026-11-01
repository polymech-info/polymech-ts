import { z, ZodTypeAny } from 'zod';
export declare enum E_PATH {
    ENSURE_PATH_EXISTS = 1,
    INVALID_INPUT = 2,
    ENSURE_DIRECTORY_WRITABLE = 3,
    ENSURE_FILE_IS_JSON = 4,
    ENSURE_PATH_IS_ABSOLUTE = 5,
    ENSURE_PATH_IS_RELATIVE = 6,
    GET_PATH_INFO = 7
}
export declare const Transformers: Record<string, any>;
export declare const TransformersDescription: {
    description: string;
    fn: any;
}[];
export declare const extendSchema: (baseSchema: z.ZodObject<any>, extend: Record<string, any>) => z.ZodObject<{
    [x: string]: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, z.core.$strip>;
export declare const ENSURE_DIRECTORY_WRITABLE: (inputPath: string, ctx: any, variables: Record<string, string>) => string;
export declare const IS_VALID_STRING: (inputPath: string) => boolean;
export declare const ENSURE_PATH_EXISTS: (inputPath: string, ctx: any, variables: Record<string, string>) => string;
export declare const test: () => z.ZodObject<{
    [x: string]: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, z.core.$strip>;
export declare const Templates: Record<string, any>;
export declare const extend: (baseSchema: ZodTypeAny, template: any, variables?: Record<string, string>) => z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
