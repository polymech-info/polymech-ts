import { z } from 'zod';
export declare const TranslateOptionsSchema: z.ZodObject<{
    debug: z.ZodDefault<z.ZodBoolean>;
    dry: z.ZodDefault<z.ZodBoolean>;
    env_key: z.ZodDefault<z.ZodString>;
    src: z.ZodOptional<z.ZodString>;
    dst: z.ZodDefault<z.ZodString>;
    formality: z.ZodDefault<z.ZodEnum<{
        default: "default";
        more: "more";
        less: "less";
    }>>;
    srcLang: z.ZodDefault<z.ZodString>;
    cache: z.ZodDefault<z.ZodBoolean>;
    dstLang: z.ZodDefault<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    all: z.ZodDefault<z.ZodBoolean>;
    alt: z.ZodDefault<z.ZodBoolean>;
    glossary: z.ZodDefault<z.ZodBoolean>;
    createGlossary: z.ZodDefault<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodString>;
    keys: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    dumpJSON: z.ZodDefault<z.ZodBoolean>;
    storeRoot: z.ZodDefault<z.ZodString>;
    store: z.ZodDefault<z.ZodString>;
    csvStore: z.ZodDefault<z.ZodBoolean>;
    stdout: z.ZodDefault<z.ZodBoolean>;
    logLevel: z.ZodDefault<z.ZodEnum<{
        info: "info";
        warn: "warn";
        error: "error";
        debug: "debug";
        silly: "silly";
        trace: "trace";
        fatal: "fatal";
    }>>;
}, z.core.$strip>;
export type TranslateOptions = z.infer<typeof TranslateOptionsSchema>;
