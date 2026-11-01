export interface IGlossary {
    glossaryId: string;
    name: string;
    ready: boolean;
    sourceLang: DeepLLanguages;
    targetLang: DeepLLanguages;
    creationTime: string;
    entryCount: number;
    entries: string;
    hash: string;
}
export interface IDeepLOptions {
    free_api: Boolean;
    auth_key: string;
    text: string;
    source_lang?: DeepLLanguages;
    target_lang: DeepLLanguages;
    split_sentences?: '0' | '1' | 'nonewlines';
    preserve_formatting?: '0' | '1';
    formality?: 'default' | 'more' | 'less';
    tag_handling?: string[];
    non_splitting_tags?: string[];
    outline_detection?: string;
    splitting_tags?: string[];
    ignore_tags?: string[];
    glossary_id?: string;
    name?: string;
    entries?: string;
    entries_format?: string;
}
export interface IDeepLResponse {
    translations: {
        detected_source_language: string;
        text: string;
    }[];
}
export declare const translate_deeplT: (parameters: IDeepLOptions) => Promise<any>;
export declare const translate_deepl: (parameters: IDeepLOptions) => Promise<any>;
export declare const create_glossary: (parameters: IDeepLOptions) => Promise<any>;
export type DeepLLanguages = 'BG' | 'CS' | 'DA' | 'DE' | 'EL' | 'EN-GB' | 'EN-US' | 'EN' | 'ES' | 'ET' | 'FI' | 'FR' | 'HU' | 'IT' | 'JA' | 'LT' | 'LV' | 'NL' | 'PL' | 'PT-PT' | 'PT-BR' | 'PT' | 'RO' | 'RU' | 'SK' | 'SL' | 'SV' | 'ZH';
export type DeepLDocumentStatus = {
    document_id: string;
    status: 'queued' | 'translating' | 'done' | 'error';
    seconds_remaining?: number;
    billed_characters?: number;
    message?: string;
};
export declare const upload_document: (parameters: IDeepLOptions, filePath: string) => Promise<{
    document_id: string;
    document_key: string;
}>;
export declare const check_document_status: (auth_key: string, document_id: string, document_key: string, free_api?: boolean) => Promise<DeepLDocumentStatus>;
export declare const download_document: (auth_key: string, document_id: string, document_key: string, free_api?: boolean) => Promise<any>;
