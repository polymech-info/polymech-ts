import { z } from 'zod'
//import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
//extendZodWithOpenApi(z)

import { write } from '@plastichub/osr-commons'

import { generate_interfaces } from '@plastichub/osr-commons'

import { OSR_ROOT } from "@plastichub/osr-commons/"

import { TLogLevelNameSchema } from '@plastichub/osr-log'
import { CommonLanguageCode, CommonLanguageCodeSchema, TargetLanguageCodeSchema } from '@plastichub/osr-i18n'
import { OSRL_MODULE_NAME, I18N_SOURCE_LANGUAGE, TASK_COMPILE_CONTENT_CACHE, TASK_COMPILE_DEFAULT_PROFILE, OSRL_ENV_DEV, OSRL_LANG_FLAVOR, OSRL_FORMAT } from './config'


///////////////////////////////////////////////////////////////
//
//  OSRL - Schemas
//
export const compilerVariables = () => z.object({
    targetLanguage: z.string().default(I18N_SOURCE_LANGUAGE),
    sourceLanguage: z.string().default(I18N_SOURCE_LANGUAGE),
    i18n: z.string().default(OSR_ROOT()),
}).and(z.record(z.any()))

export const compilerOptions = () => z.object({
    logLevel: TLogLevelNameSchema.default('info'),
    root: z.string().default(`${process.cwd()}`),
    cwd: z.string().default(`${process.cwd()}`),
    env: z.string().default(OSRL_ENV_DEV),
    format: z.string().default(OSRL_FORMAT),
    language: z.string().default(OSRL_LANG_FLAVOR),

    output: z.string().default(""),
    template: z.string().optional(),
    profile: z.string().default(TASK_COMPILE_DEFAULT_PROFILE),
    plugins: z.string().default(TASK_COMPILE_DEFAULT_PROFILE),

    cache: z.boolean().default(TASK_COMPILE_CONTENT_CACHE),
    module: z.string().default(OSRL_MODULE_NAME),
    variables: compilerVariables().default({
        targetLanguage: I18N_SOURCE_LANGUAGE,
        sourceLanguage: I18N_SOURCE_LANGUAGE,
        i18n: OSR_ROOT()
    }),
}, { description: 'ICompileOptions' }).passthrough()

export const taskOptions = () => z.object({
    logLevel: TLogLevelNameSchema.default('info'),
    sourceLanguage: z.string().default(I18N_SOURCE_LANGUAGE),
    
    languages: z.union([
        z.array(z.string().default(I18N_SOURCE_LANGUAGE)),
        z.string().transform((val) => val.split(',').map((str) => str.trim()) as CommonLanguageCode[])
    ]).default([I18N_SOURCE_LANGUAGE]),
    src: z.array(z.string()).default([]),

    taskPrefix: z.string().default('content'),
    taskSuffix: z.string().default(''),
    tasksBefore: z.array(z.string()).default([]),
    tasksAfter: z.array(z.string()).default([]),

    watchContent: z.boolean().default(false),
    clear: z.boolean().default(false),
    debugWatch: z.boolean().default(false),

    onCompile: z.any(),
    onCompiled: z.any(),
    onCompileDone: z.any(),

}, { description: 'ICompileTaskOptions' }).passthrough()


export const schemas = () => [
    compilerOptions(),
    taskOptions()
]
export const types = () => generate_interfaces(schemas(), 'src/zod_types.ts')
export const jsonSchemas = (dst: string = './json_schemas.json') => write(schemas(), dst, 'osr-tasks:osrl', {})
export const openAPI = (dst: string = './openapi.yaml') => write(schemas(), dst, 'osr-tasks:osrl', {})