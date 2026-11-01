export interface GeoPos {
    lon: number;
    lat: number;
}
export interface PATH_INFO {
    DIR?: string;
    NAME?: string;
    FILE_NAME?: string;
    FILE_EXT?: string;
    PATH?: string;
    IS_FILE?: boolean;
    IS_FOLDER?: boolean;
    IS_EXPRESSION?: boolean;
    IS_GLOB?: boolean;
    path: string;
    GLOB: string;
    GLOB_EXTENSIONS: string[];
    FILES: string[];
}
export interface IDeeplConfig {
    auth_key: string;
    free_api: boolean;
}
export interface IIgConfig {
    username: string;
    password: string;
}
export interface ICsCartConfigMySQL {
    host: string;
    user: string;
    database: string;
    password: string;
}
export interface ICsCartConfig {
    token: string;
    url: string;
    username: string;
    siteUrl?: string;
    timeout?: number;
    language?: string;
    userToken?: string;
    mysql?: ICsCartConfigMySQL;
}
export interface IGiteaConfig {
    token: string;
    url: string;
}
export interface IDiscourseConfig {
    host: string;
    key: string;
    username: string;
    rateLimitConcurrency: number;
}
export interface IScaleserp {
    key: string;
}
export interface IOSRConfig {
    deepl: IDeeplConfig;
    ig: IIgConfig;
    cscart: ICsCartConfig;
    discourse: IDiscourseConfig;
    discourse_admin: IDiscourseConfig;
    instagram: IIgConfig;
    urls: any;
    scaleserp?: IScaleserp;
    gitea?: IGiteaConfig;
}
export interface SRC_VARIABLES {
    SRC_PATH: string;
    SRC_DIR: string;
    SRC_NAME: string;
    SRC_FILE_NAME: string;
    SRC_FILE_EXT: string;
    SRC_IS_FILE: boolean;
    SRC_IS_FOLDER: boolean;
    SRC_IS_EXPRESSION: boolean;
    SRC_IS_GLOB: boolean;
    SRC_GLOB: string;
    SRC_GLOB_EXTENSIONS: string[];
    SRC_FILES: string[];
}
export interface DST_VARIABLES {
    DST_PATH: string;
    DST_DIR: string;
    DST_NAME: string;
    DST_FILE_NAME: string;
    DST_FILE_EXT: string;
    DST_IS_FILE: boolean;
    DST_IS_FOLDER: boolean;
    DST_IS_EXPRESSION: boolean;
    DST_IS_GLOB: boolean;
    DST_GLOB: string;
    DST_GLOB_EXTENSIONS: string[];
    DST_FILES: string[];
}
export type PATH_VARIABLES = SRC_VARIABLES & DST_VARIABLES;
export interface IOptionsBase {
    variables: PATH_VARIABLES;
}
export interface PATH_INFO {
    DIR?: string;
    FILE_EXT?: string;
    FILE_NAME?: string;
    FILES: string[];
    GLOB_EXTENSIONS: string[];
    GLOB: string;
    IS_EXPRESSION?: boolean;
    IS_FILE?: boolean;
    IS_FOLDER?: boolean;
    IS_GLOB?: boolean;
    NAME?: string;
    path: string;
    PATH?: string;
}
