import type { SourceLanguageCode, TargetLanguageCode, TranslateTextOptions } from 'deepl-node';
/**
 * Translate an array of strings from sourceLang to targetLang using DeepL.
 * Batches requests and retries on rate-limit (429) or server (5xx) errors.
 */
export declare function translateStrings(strings: string[], sourceLang: SourceLanguageCode, targetLang: TargetLanguageCode, apiKey?: string, deeplOptions?: TranslateTextOptions, batchSize?: number): Promise<string[]>;
