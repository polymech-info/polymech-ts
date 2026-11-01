export interface ICompileOptions {
    logLevel?: "silly" | "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    root?: string;
    cwd?: string;
    env?: string;
    format?: string;
    /** Template ifle */
    template?: string | undefined;
    /** The destination file */
    output?: string | undefined;
    /** The source file */
    source?: string | undefined;
    trace?: string;
    language?: string;
    profile?: string;
    watchContent?: boolean;
    cache?: boolean;
    stdout?: boolean;
    module?: string;
    variables?: {
        targetLanguage?: "en" | "pt" | "bg" | "cs" | "da" | "de" | "el" | "es" | "et" | "fi" | "fr" | "hu" | "id" | "it" | "ja" | "ko" | "lt" | "lv" | "nb" | "nl" | "pl" | "ro" | "ru" | "sk" | "sl" | "sv" | "tr" | "uk" | "zh";
        sourceLanguage?: ("en" | "pt" | "bg" | "cs" | "da" | "de" | "el" | "es" | "et" | "fi" | "fr" | "hu" | "id" | "it" | "ja" | "ko" | "lt" | "lv" | "nb" | "nl" | "pl" | "ro" | "ru" | "sk" | "sl" | "sv" | "tr" | "uk" | "zh") | ("en-GB" | "en-US" | "pt-BR" | "pt-PT");
        i18n?: string;
    } & {
        [x: string]: any;
    };
}