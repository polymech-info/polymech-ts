import { z } from 'zod'

export const CommonLanguageCodeSchema = z.enum([
    'en', 'pt',
    'bg', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr',
    'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'nb', 'nl',
    'pl', 'ro', 'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'zh'
])

export type CommonLanguageCode = z.infer<typeof CommonLanguageCodeSchema>

export const TargetLanguageCodeSchema = z.union([    CommonLanguageCodeSchema, z.enum(['en-GB', 'en-US', 'pt-BR', 'pt-PT'])])
export type TargetLanguageCode = z.infer<typeof TargetLanguageCodeSchema>

export const SourceGlossaryLanguageCode = z.enum(['de', 'en', 'es', 'fr', 'ja'])
export type SourceGlossaryLanguageCode = z.infer<typeof SourceGlossaryLanguageCode>
