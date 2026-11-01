import { getJson as searchSerpAPI } from "serpapi";
export declare const SearchProviders: {
    scaleserp: (params: any) => Promise<import("./types.js").IScaleserpResponse>;
    serpApi: typeof searchSerpAPI;
};
export declare const cleanOptions: (opts: any) => any;
