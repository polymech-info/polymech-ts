import { z } from 'zod'

// import { CommonLanguageCodeSchema, TargetLanguageCodeSchema } from '@plastichub/osr-i18n'
import { TLogLevelNameSchema } from '@plastichub/osr-log/'
import { OSR_ROOT, generate_interfaces } from '@plastichub/osr-commons'

//const CommonLanguageCodeSchema = z.ZodEnum<["en", "pt", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]>;
//const TargetLanguageCodeSchema = z.ZodUnion<[z.ZodEnum<["en", "pt", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]>, z.ZodEnum<["en-GB", "en-US", "pt-BR", "pt-PT"]>]>;

export const compilerVariables = () => z.object({
    targetLanguage: z.string().default('en'),
    sourceLanguage: z.string().default('en'),
    i18n: z.string().default(OSR_ROOT()),
}).passthrough()

export const compilerOptions = () => z.object({
    logLevel: TLogLevelNameSchema.default('info'),
    root: z.string().default(`${process.cwd()}`),
    cwd: z.string().default(`${process.cwd()}`),
    env: z.string().default('hugo-debug'),
    format: z.string().default('html'),
    template: z.string().optional().describe('Template ifle'),
    output: z.string().optional().describe('The destination file'),
    source: z.string().optional().describe('The source file'),
    trace: z.string().default("${SRC_DIR}/${SRC_NAME}-trace.json"),
    language: z.string().default('osr'),
    profile: z.string().optional().default('${OSR_ROOT}/osr-templates/osrl/.osrl.json'),
    watchContent: z.boolean().default(false),
    cache: z.boolean().default(true),
    stdout: z.boolean().default(false),
    module: z.string().default('osr-module'),
    variables: compilerVariables().default({
        targetLanguage: 'en',
        sourceLanguage: 'en',
        i18n: OSR_ROOT()
    }),
}, { description: 'ICompileOptions' }).passthrough()

export const types = () => generate_interfaces(
    [
        compilerOptions()
    ], 'src/zod_types.ts')