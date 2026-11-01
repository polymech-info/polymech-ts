import { stringify } from 'querystring'
import { default as axios } from 'axios'
import FormData from 'form-data'
import * as fs from 'fs'

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
    // v3 glossary params (optional in interface but used in create_glossary)
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

export const translate_deeplT = async (
    parameters: IDeepLOptions
) => {
    try {
        const params = "preserve_formatting=1&tag_handling=xml&auth_key=4f6441ab-8e09-48d3-9031-3ca5cd463f79&formality=default&free_api=false&text=Variant&target_lang=de&source_lang=en"
        const ret = axios(
            `https://api.deepl.com/v2/translate`,
            params as any) as any
        return ret
    } catch (error) {
        console.error(error.message)
    }
}
export const translate_deepl = async (
    parameters: IDeepLOptions
) => {
    const sub_domain = parameters.free_api ? 'api-free' : 'api';
    try {
        const { auth_key, ...restParams } = parameters;
        let params = stringify(restParams as any)
        return axios.post(
            `https://${sub_domain}.deepl.com/v2/translate`,
            params,
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${auth_key}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        ) as any
    } catch (error: any) {
        console.error('error : translate_deepl', error.response?.data || error.message)
    }
}

export const create_glossary = async (
    parameters: IDeepLOptions
) => {
    const sub_domain = parameters.free_api ? 'api-free' : 'api'
    try {
        // v3 requires structured payload
        const p: any = parameters;
        const payload = {
            name: p.name || 'Glossary',
            dictionaries: [{
                source_lang: p.source_lang,
                target_lang: p.target_lang,
                entries: p.entries,
                entries_format: p.entries_format || 'tsv'
            }]
        };

        const ret = await axios.post(
            `https://${sub_domain}.deepl.com/v3/glossaries`,
            payload,
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${parameters.auth_key}`,
                    'Content-Type': 'application/json'
                }
            }
        ) as any

        return (ret as any).data

    } catch (error: any) {
        //@todo : never called
        console.error(error.response?.data || error.message)
    }
}

export type DeepLLanguages =
    | 'BG'
    | 'CS'
    | 'DA'
    | 'DE'
    | 'EL'
    | 'EN-GB'
    | 'EN-US'
    | 'EN'
    | 'ES'
    | 'ET'
    | 'FI'
    | 'FR'
    | 'HU'
    | 'IT'
    | 'JA'
    | 'LT'
    | 'LV'
    | 'NL'
    | 'PL'
    | 'PT-PT'
    | 'PT-BR'
    | 'PT'
    | 'RO'
    | 'RU'
    | 'SK'
    | 'SL'
    | 'SV'
    | 'ZH'
export type DeepLDocumentStatus = {
    document_id: string;
    status: 'queued' | 'translating' | 'done' | 'error';
    seconds_remaining?: number;
    billed_characters?: number;
    message?: string;
}

export const upload_document = async (
    parameters: IDeepLOptions,
    filePath: string
) => {
    const sub_domain = parameters.free_api ? 'api-free' : 'api';
    try {
        const formData = new FormData();
        formData.append('target_lang', parameters.target_lang);
        if (parameters.source_lang) {
            formData.append('source_lang', parameters.source_lang);
        }
        if (parameters.glossary_id) {
            formData.append('glossary_id', parameters.glossary_id);
        }
        if (parameters.formality && parameters.formality !== 'default') {
            formData.append('formality', parameters.formality);
        }
        formData.append('file', fs.createReadStream(filePath));

        const ret = await axios.post(
            `https://${sub_domain}.deepl.com/v2/document`,
            formData,
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${parameters.auth_key}`,
                    ...formData.getHeaders()
                }
            }
        ) as any;
        return ret.data as { document_id: string; document_key: string };
    } catch (error: any) {
        console.error('error : upload_document', error.response?.data || error.message);
        throw error;
    }
}

export const check_document_status = async (
    auth_key: string,
    document_id: string,
    document_key: string,
    free_api: boolean = false
) => {
    const sub_domain = free_api ? 'api-free' : 'api';
    try {
        const ret = await axios.post(
            `https://${sub_domain}.deepl.com/v2/document/${document_id}`,
            { document_key },
            {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${auth_key}`,
                    'Content-Type': 'application/json'
                }
            }
        ) as any;
        return ret.data as DeepLDocumentStatus;
    } catch (error: any) {
        console.error('error : check_document_status', error.response?.data || error.message);
        throw error;
    }
}

export const download_document = async (
    auth_key: string,
    document_id: string,
    document_key: string,
    free_api: boolean = false
) => {
    const sub_domain = free_api ? 'api-free' : 'api';
    try {
        const ret = await axios.post(
            `https://${sub_domain}.deepl.com/v2/document/${document_id}/result`,
            { document_key },
            {
                responseType: 'arraybuffer',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${auth_key}`,
                    'Content-Type': 'application/json'
                }
            }
        ) as any;
        return ret.data; // This will be the ArrayBuffer / Buffer representing the file
    } catch (error: any) {
        console.error('error : download_document', error.response?.data || error.message);
        throw error;
    }
}
