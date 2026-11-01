import type { SourceLanguageCode, TargetLanguageCode, TranslateTextOptions } from 'deepl-node';
import { Translator } from 'deepl-node';

const DEFAULT_BATCH_SIZE = 50;
const MAX_RETRIES = 3;

/**
 * Translate an array of strings from sourceLang to targetLang using DeepL.
 * Batches requests and retries on rate-limit (429) or server (5xx) errors.
 */
export async function translateStrings(
	strings: string[],
	sourceLang: SourceLanguageCode,
	targetLang: TargetLanguageCode,
	apiKey?: string,
	deeplOptions?: TranslateTextOptions,
	batchSize: number = DEFAULT_BATCH_SIZE
): Promise<string[]> {
	if (strings.length === 0) return [];

	const key = apiKey ?? process.env.DEEPL_AUTH_KEY;
	if (!key) throw new Error('DeepL API key must be provided via options.apiKey or DEEPL_AUTH_KEY environment variable');

	const deepl = new Translator(key);
	const translations: string[] = new Array(strings.length).fill('');

	const textOptions: TranslateTextOptions = {
		tagHandling: 'html',
		splitSentences: 'nonewlines',
		...deeplOptions
	};

	for (let i = 0; i < strings.length; i += batchSize) {
		const batch = strings.slice(i, i + batchSize);

		const results = await retry(() =>
			deepl.translateText(batch, sourceLang, targetLang, textOptions)
		);

		for (let j = 0; j < batch.length; j++) {
			translations[i + j] = results[j].text;
		}
	}

	return translations;
}

async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await fn();
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status;
			const retryable = status === 429 || status === 456 || (status >= 500 && status < 600);

			if (!retryable || attempt >= retries) throw err;

			const delay = Math.min(1000 * 2 ** attempt, 10_000);
			await new Promise((r) => setTimeout(r, delay));
		}
	}
}
