import { z } from 'zod';
export declare const compilerVariables: () => z.ZodObject<{
    targetLanguage: z.ZodDefault<z.ZodString>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    i18n: z.ZodDefault<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    targetLanguage: z.ZodDefault<z.ZodString>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    i18n: z.ZodDefault<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    targetLanguage: z.ZodDefault<z.ZodString>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    i18n: z.ZodDefault<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const compilerOptions: () => z.ZodObject<{
    logLevel: z.ZodDefault<z.ZodEnum<["silly", "trace", "debug", "info", "warn", "error", "fatal"]>>;
    root: z.ZodDefault<z.ZodString>;
    cwd: z.ZodDefault<z.ZodString>;
    env: z.ZodDefault<z.ZodString>;
    format: z.ZodDefault<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    trace: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    watchContent: z.ZodDefault<z.ZodBoolean>;
    cache: z.ZodDefault<z.ZodBoolean>;
    stdout: z.ZodDefault<z.ZodBoolean>;
    module: z.ZodDefault<z.ZodString>;
    variables: z.ZodDefault<z.ZodObject<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    logLevel: z.ZodDefault<z.ZodEnum<["silly", "trace", "debug", "info", "warn", "error", "fatal"]>>;
    root: z.ZodDefault<z.ZodString>;
    cwd: z.ZodDefault<z.ZodString>;
    env: z.ZodDefault<z.ZodString>;
    format: z.ZodDefault<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    trace: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    watchContent: z.ZodDefault<z.ZodBoolean>;
    cache: z.ZodDefault<z.ZodBoolean>;
    stdout: z.ZodDefault<z.ZodBoolean>;
    module: z.ZodDefault<z.ZodString>;
    variables: z.ZodDefault<z.ZodObject<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    logLevel: z.ZodDefault<z.ZodEnum<["silly", "trace", "debug", "info", "warn", "error", "fatal"]>>;
    root: z.ZodDefault<z.ZodString>;
    cwd: z.ZodDefault<z.ZodString>;
    env: z.ZodDefault<z.ZodString>;
    format: z.ZodDefault<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    trace: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    watchContent: z.ZodDefault<z.ZodBoolean>;
    cache: z.ZodDefault<z.ZodBoolean>;
    stdout: z.ZodDefault<z.ZodBoolean>;
    module: z.ZodDefault<z.ZodString>;
    variables: z.ZodDefault<z.ZodObject<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        targetLanguage: z.ZodDefault<z.ZodString>;
        sourceLanguage: z.ZodDefault<z.ZodString>;
        i18n: z.ZodDefault<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const types: () => void;
