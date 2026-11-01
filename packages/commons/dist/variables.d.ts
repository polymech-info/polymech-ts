export declare const DATE_VARS: () => {
    YYYY: number;
    MM: number;
    DD: number;
    HH: number;
    SS: number;
};
export declare const _substitute: (template: any, map: Record<string, any>, keep?: boolean, alt?: boolean) => any;
export declare const substitute: (alt: boolean, template: string, vars?: Record<string, any>, keep?: boolean) => any;
export declare const DEFAULT_VARS: (vars: any) => any;
export declare const resolveVariables: (path: string, alt?: boolean, vars?: Record<string, string>, keep?: boolean) => any;
export declare const resolve: (path: string, alt?: boolean, vars?: Record<string, string>, keep?: boolean) => any;
export declare const template: (path: string, vars?: Record<string, string>, keep?: boolean, depth?: number) => string;
