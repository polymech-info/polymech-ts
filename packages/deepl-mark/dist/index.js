import { getMarkdown, getMdast } from "./ast/mdast.js";
import { resolveConfig } from "./config.js";
import { extractMdastStrings } from "./extract.js";
import { format } from "./format.js";
import { replaceMdastStrings } from "./replace.js";
import { translateStrings } from "./translate.js";
async function translate(content, sourceLang, targetLang, options) {
  const { apiKey, deeplOptions, ...configOptions } = options ?? {};
  const config = resolveConfig({
    sourceLanguage: sourceLang,
    outputLanguages: [targetLang],
    directories: [["", ""]],
    ...configOptions
  });
  const formatted = await format(content);
  const mdast = getMdast(formatted);
  const strings = extractMdastStrings({ mdast, config });
  if (strings.length === 0) return content;
  const translated = await translateStrings(strings, sourceLang, targetLang, apiKey, deeplOptions);
  const result = replaceMdastStrings({ mdast, strings: translated, config });
  return getMarkdown(result);
}
export {
  translate
};
