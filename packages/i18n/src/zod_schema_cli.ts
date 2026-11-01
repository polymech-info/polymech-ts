import { z } from 'zod'

const logLevels = ['silly', 'debug', 'trace', 'info', 'warn', 'error', 'fatal'] as const
const formalityLevels = ['default', 'more', 'less'] as const

export const TranslateOptionsSchema = z.object({
    debug: z.boolean().default(false),
    dry: z.boolean().default(false),
    env_key: z.string().default('OSR-CONFIG'),
    src: z.string().optional(),
    dst: z.string().default('${SRC_DIR}/${SRC_NAME}_${DST_LANG}${SRC_EXT}'),
    formality: z.enum(formalityLevels).default('default'),
    srcLang: z.string().default(''),
    cache: z.boolean().default(false),
    dstLang: z.string().default('DE'),
    text: z.string().optional(),
    all: z.boolean().default(false),
    alt: z.boolean().default(false),
    glossary: z.boolean().default(false),
    createGlossary: z.boolean().default(true),
    filters: z.string().optional(),
    keys: z.string().optional(),
    query: z.string().optional(),
    dumpJSON: z.boolean().default(false),
    storeRoot: z.string().default('${OSR_ROOT}/i18n-store/'),
    store: z.string().default('${OSR_ROOT}/i18n-store/store-${DST_LANG}.json'),
    csvStore: z.boolean().default(false),
    stdout: z.boolean().default(true),
    logLevel: z.enum(logLevels).default('warn'),
})

export type TranslateOptions = z.infer<typeof TranslateOptionsSchema>
