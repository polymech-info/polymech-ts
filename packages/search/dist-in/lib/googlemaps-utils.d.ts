export type ParsedURL = {
    scheme: string;
    host?: string;
    path?: string;
    query?: Record<string, string>;
    fragment?: string;
};
export declare const escapeFirstUrlSegment: (url: string) => string;
export declare const handleFs: (path: string) => Promise<string | object>;
export declare const schemeHandlers: Record<string, (arg1: string, arg2?: URLSearchParams) => Promise<string | object>>;
export declare const parseCustomUrl: (url: string) => Promise<string | object>;
export declare const resolvePath: (str: string, query: any, category: any, opts: any) => string;
export declare const cleanObjectStrings: (obj: any) => any;
