export type Filter = (json: string) => any;
export declare const extractFirstCodeBlock: (markdown: string) => string | null;
export declare const extractCodeBlocks: (markdown: string) => string;
export declare const JSONParse: (json: string) => any;
export declare const trim: (str: string) => string;
export declare const extractJsonCodeBlock: (markdown: string) => string | null;
export declare const markdown: (markdown: string) => string;
export declare const applyFilters: (value: string, filters: Filter[]) => string;
export declare const Filters: {
    JSON: (markdown: string) => string | null;
    JSONUnescape: (json: string) => string;
    JSONPretty: (json: string) => string;
    AlphaSort: (arr: string[]) => string;
    code: (markdown: string) => string | null;
    JSONParse: (json: string) => any;
    trim: (str: string) => string;
    markdown: (markdown: string) => string;
};
