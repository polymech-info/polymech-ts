import type { SourceLanguageCode, TargetLanguageCode, TranslateTextOptions } from 'deepl-node';
import type { UserConfig } from './config.js';
/**
 * Options to control which parts of the markdown are translated.
 */
export type TranslateOptions = Omit<UserConfig, 'sourceLanguage' | 'outputLanguages' | 'directories'> & {
    /** DeepL API key. Falls back to `DEEPL_AUTH_KEY` env var if not provided. */
    apiKey?: string;
    /** DeepL translation options (tagHandling, splitSentences, formality, glossaryId, etc.) */
    deeplOptions?: TranslateTextOptions;
};
/**
 * Translate markdown/MDX content from one language to another using DeepL.
 *
 * Requires `DEEPL_AUTH_KEY` environment variable to be set.
 *
 * @param content - Markdown or MDX string to translate
 * @param sourceLang - Source language code (e.g. 'en', 'de', 'fr')
 * @param targetLang - Target language code (e.g. 'de', 'en-US', 'fr')
 * @param options - Optional config to control extraction (frontmatter, jsx, html, etc.)
 * @returns Translated markdown string
 *
 * @example
 * ```ts
 * import { translate } from 'deepmark';
 *
 * const result = await translate('# Hello World', 'en', 'de');
 * console.log(result); // '# Hallo Welt'
 * ```
 */
export declare function translate(content: string, sourceLang: SourceLanguageCode, targetLang: TargetLanguageCode, options?: TranslateOptions): Promise<string>;
export type { SourceLanguageCode, TargetLanguageCode, TranslateTextOptions } from 'deepl-node';
