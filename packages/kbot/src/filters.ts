import { isString } from '@polymech/core/primitives'
import { logger } from './index.js'

export type Filter = (json: string) => any

export const extractFirstCodeBlock = (markdown: string): string | null => {
    const regex = /```(\w+\n)?([\s\S]*?)```/
    const match = regex.exec(markdown)
    if (match && match[2]) {
        return match[2].trim()
    }
    return markdown
}

export const extractCodeBlocks = (markdown: string): string => {
    const codeBlocks: string[] = []
    const regex = /```([\s\S]*?)```/g
    let match
    while ((match = regex.exec(markdown)) !== null) {
        codeBlocks.push(match[1])
    }
    return codeBlocks[0]
}
function isEscapedJsonString(input: string): boolean {
  if (typeof input !== 'string' || !input.startsWith('"') || !input.endsWith('"')) {
    return false;
  }

  try {
    const ret = JSON.parse(input)
    return false
  } catch (error) {
    return true;
  }
}
const unescapeJsonString = (json: string): string => {
  if (isEscapedJsonString(json)) {
    return json
  }
  // Use regex to replace common escape sequences
  const unescapedString = json
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/(\")/g, "\"")
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

  // Handle unicode escape sequences (\uXXXX)
  return unescapedString.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
}

const alphanumericSort = (arr: string[]) => {
  arr = isString(arr) ? JSON.parse(arr) : arr
  return JSON.stringify(arr.sort((a, b) => {
    const aParts = a.match(/(\d+)|(\D+)/g) || [];
    const bParts = b.match(/(\d+)|(\D+)/g) || [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (isNaN(parseInt(aPart, 10)) || isNaN(parseInt(bPart, 10))) {
        // Non-numeric parts, compare as strings
        if (aPart !== bPart) {
          return aPart < bPart ? -1 : 1;
        }
      } else {
        // Numeric parts, compare as numbers
        const aNum = parseInt(aPart, 10);
        const bNum = parseInt(bPart, 10);
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      }
    }

    // If everything else is equal, compare by length (shorter first)
    return aParts.length - bParts.length;
  }), null, 2)
}

export const JSONParse = (json: string) => {
    try {
        return JSON.parse(json)
    } catch (error) {
        return null
    }
}
export const trim = (str: string) => str ? str.trim() : null
export const extractJsonCodeBlock = (markdown: string): string | null => {
    const regex = /```json([\s\S]*?)```/g
    const match = regex.exec(markdown)
    let ret = match ? match[1] : '{}'
    try {
        return JSON.stringify(JSON.parse(ret), null, 2)
    } catch (error) {
        return ret
    }
}
const JSONPretty = (json: string) => {
  return JSON.stringify(JSON.parse(json), null, 2)
}

export const markdown = (markdown: string): string => {
    const trimmedMarkdown = markdown.trim();

    // This regex is anchored to match if the *entire* trimmed string is a code block.
    // It's adapted from the regex in extractFirstCodeBlock.
    // ^```       : Asserts the start of the string followed by ```.
    // (\w+\n)?   : Optional capturing group (Group 1) for a language specifier
    //              (e.g., "typescript\n"). \w+ requires one or more word characters
    //              for the language, followed by a newline. This group is optional.
    // ([\s\S]*?) : Capturing group (Group 2) for the content of the code block.
    //              Matches any character (including newlines) in a non-greedy way.
    // ```$       : Asserts ``` followed by the end of the string.
    const regex = /^```(\w+\n)?([\s\S]*?)```$/;

    const match = trimmedMarkdown.match(regex);

    if (match && match[2] !== undefined) {
        // match[2] contains the content of the code block.
        // Consistent with extractFirstCodeBlock, we trim the resulting content.
        return match[2].trim();
    }

    // If the regex didn't match, it means the string is not a single,
    // top-level code block that spans the entire string.
    return markdown;
};

export const applyFilters = (value: string, filters: Filter[]) => {
  if (!value) {
      return ''
  }
  (filters as Filter[]).forEach((f) => {
      try {
          let _ret = f(value)
          if (_ret) {
              value = _ret
          } else {
              logger.warn(`applyFilters: filter returned null : ${value}`, f.toString())
          }
      } catch (error) {
          logger.error(`Error applying filter: ${error.message}`)
      }
  })
  return value
}

export const Filters = {
  JSON: extractJsonCodeBlock,
  JSONUnescape: unescapeJsonString,
  JSONPretty,
  AlphaSort: alphanumericSort,
  code: extractFirstCodeBlock,
  JSONParse,
  trim,
  markdown
}