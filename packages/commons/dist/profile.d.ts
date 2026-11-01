interface EnvVariables {
    [key: string]: string;
}
interface EnvConfig {
    includes: string[];
    variables: EnvVariables;
}
export interface IProfile {
    includes: string[];
    variables: EnvVariables;
    env?: {
        [key: string]: EnvConfig;
    };
}
export declare const resolveConfig: (config: Record<string, string>) => Record<string, unknown>;
export declare const parse: (profilePath: string, profile: IProfile, options?: {
    env: string;
}, rel?: string) => IProfile;
export {};
