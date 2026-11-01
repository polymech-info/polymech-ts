export type ParsedURL = {
    scheme: string;
    host?: string;
    path?: string;
    query?: Record<string, string>;
    fragment?: string;
};
export declare const escapeFirstUrlSegment: (url: string) => string;
export declare const parseURL: (url: string) => ParsedURL | null;
