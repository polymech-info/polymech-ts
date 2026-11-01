export interface ICompileOptions {
    logLevel?: "silly" | "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    root?: string;
    cwd?: string;
    env?: string;
    format?: string;
    language?: string;
    output?: string;
    template?: string | undefined;
    profile?: string;
    plugins?: string;
    cache?: boolean;
    module?: string;
    variables?: {
        targetLanguage?: "en" | "pt" | "bg" | "cs" | "da" | "de" | "el" | "es" | "et" | "fi" | "fr" | "hu" | "id" | "it" | "ja" | "ko" | "lt" | "lv" | "nb" | "nl" | "pl" | "ro" | "ru" | "sk" | "sl" | "sv" | "tr" | "uk" | "zh";
        sourceLanguage?: ("en" | "pt" | "bg" | "cs" | "da" | "de" | "el" | "es" | "et" | "fi" | "fr" | "hu" | "id" | "it" | "ja" | "ko" | "lt" | "lv" | "nb" | "nl" | "pl" | "ro" | "ru" | "sk" | "sl" | "sv" | "tr" | "uk" | "zh") | ("en-GB" | "en-US" | "pt-BR" | "pt-PT");
        i18n?: string;
    } & {
        [x: string]: any;
    };
}
export interface ICompileTaskOptions {
    logLevel?: "silly" | "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    sourceLanguage?:string;
    languages?: string[]
    src?: string[];
    taskPrefix?: string;
    taskSuffix?: string;
    tasksBefore?: string[];
    tasksAfter?: string[];
    watchContent?: boolean;
    clear?: boolean;
    debugWatch?: boolean;
    onCompile?: any;
    onCompiled?: any;
    onCompileDone?: any;
}