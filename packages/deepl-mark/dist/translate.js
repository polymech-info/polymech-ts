import { Translator } from "deepl-node";
const DEFAULT_BATCH_SIZE = 50;
const MAX_RETRIES = 3;
async function translateStrings(strings, sourceLang, targetLang, apiKey, deeplOptions, batchSize = DEFAULT_BATCH_SIZE) {
  if (strings.length === 0) return [];
  const key = apiKey ?? process.env.DEEPL_AUTH_KEY;
  if (!key) throw new Error("DeepL API key must be provided via options.apiKey or DEEPL_AUTH_KEY environment variable");
  const deepl = new Translator(key);
  const translations = new Array(strings.length).fill("");
  const textOptions = {
    tagHandling: "html",
    splitSentences: "nonewlines",
    ...deeplOptions
  };
  for (let i = 0; i < strings.length; i += batchSize) {
    const batch = strings.slice(i, i + batchSize);
    const results = await retry(
      () => deepl.translateText(batch, sourceLang, targetLang, textOptions)
    );
    for (let j = 0; j < batch.length; j++) {
      translations[i + j] = results[j].text;
    }
  }
  return translations;
}
async function retry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.statusCode ?? err?.status;
      const retryable = status === 429 || status === 456 || status >= 500 && status < 600;
      if (!retryable || attempt >= retries) throw err;
      const delay = Math.min(1e3 * 2 ** attempt, 1e4);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
export {
  translateStrings
};
