import { isString } from '@polymech/core/primitives';
import { logger } from './index.js';
export const extractFirstCodeBlock = (markdown) => {
    const regex = /```(\w+\n)?([\s\S]*?)```/;
    const match = regex.exec(markdown);
    if (match && match[2]) {
        return match[2].trim();
    }
    return markdown;
};
export const extractCodeBlocks = (markdown) => {
    const codeBlocks = [];
    const regex = /```([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        codeBlocks.push(match[1]);
    }
    return codeBlocks[0];
};
function isEscapedJsonString(input) {
    if (typeof input !== 'string' || !input.startsWith('"') || !input.endsWith('"')) {
        return false;
    }
    try {
        const ret = JSON.parse(input);
        return false;
    }
    catch (error) {
        return true;
    }
}
const unescapeJsonString = (json) => {
    if (isEscapedJsonString(json)) {
        return json;
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
};
const alphanumericSort = (arr) => {
    arr = isString(arr) ? JSON.parse(arr) : arr;
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
            }
            else {
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
    }), null, 2);
};
export const JSONParse = (json) => {
    try {
        return JSON.parse(json);
    }
    catch (error) {
        return null;
    }
};
export const trim = (str) => str ? str.trim() : null;
export const extractJsonCodeBlock = (markdown) => {
    const regex = /```json([\s\S]*?)```/g;
    const match = regex.exec(markdown);
    let ret = match ? match[1] : '{}';
    try {
        return JSON.stringify(JSON.parse(ret), null, 2);
    }
    catch (error) {
        return ret;
    }
};
const JSONPretty = (json) => {
    return JSON.stringify(JSON.parse(json), null, 2);
};
export const markdown = (markdown) => {
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
export const applyFilters = (value, filters) => {
    if (!value) {
        return '';
    }
    filters.forEach((f) => {
        try {
            let _ret = f(value);
            if (_ret) {
                value = _ret;
            }
            else {
                logger.warn(`applyFilters: filter returned null : ${value}`, f.toString());
            }
        }
        catch (error) {
            logger.error(`Error applying filter: ${error.message}`);
        }
    });
    return value;
};
export const Filters = {
    JSON: extractJsonCodeBlock,
    JSONUnescape: unescapeJsonString,
    JSONPretty,
    AlphaSort: alphanumericSort,
    code: extractFirstCodeBlock,
    JSONParse,
    trim,
    markdown
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9maWx0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBSW5DLE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLENBQUMsUUFBZ0IsRUFBaUIsRUFBRTtJQUNyRSxNQUFNLEtBQUssR0FBRywwQkFBMEIsQ0FBQTtJQUN4QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ2xDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzFCLENBQUM7SUFDRCxPQUFPLFFBQVEsQ0FBQTtBQUNuQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFFBQWdCLEVBQVUsRUFBRTtJQUMxRCxNQUFNLFVBQVUsR0FBYSxFQUFFLENBQUE7SUFDL0IsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUE7SUFDakMsSUFBSSxLQUFLLENBQUE7SUFDVCxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUM3QyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFDRCxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFDRCxTQUFTLG1CQUFtQixDQUFDLEtBQWE7SUFDeEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxD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