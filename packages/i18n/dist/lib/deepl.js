import { stringify } from 'querystring';
import { default as axios } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
export const translate_deeplT = async (parameters) => {
    try {
        const params = "preserve_formatting=1&tag_handling=xml&auth_key=4f6441ab-8e09-48d3-9031-3ca5cd463f79&formality=default&free_api=false&text=Variant&target_lang=de&source_lang=en";
        const ret = axios(`https://api.deepl.com/v2/translate`, params);
        return ret;
    }
    catch (error) {
        console.error(error.message);
    }
};
export const translate_deepl = async (parameters) => {
    const sub_domain = parameters.free_api ? 'api-free' : 'api';
    try {
        const { auth_key, ...restParams } = parameters;
        let params = stringify(restParams);
        return axios.post(`https://${sub_domain}.deepl.com/v2/translate`, params, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${auth_key}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }
    catch (error) {
        console.error('error : translate_deepl', error.response?.data || error.message);
    }
};
export const create_glossary = async (parameters) => {
    const sub_domain = parameters.free_api ? 'api-free' : 'api';
    try {
        // v3 requires structured payload
        const p = parameters;
        const payload = {
            name: p.name || 'Glossary',
            dictionaries: [{
                    source_lang: p.source_lang,
                    target_lang: p.target_lang,
                    entries: p.entries,
                    entries_format: p.entries_format || 'tsv'
                }]
        };
        const ret = await axios.post(`https://${sub_domain}.deepl.com/v3/glossaries`, payload, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${parameters.auth_key}`,
                'Content-Type': 'application/json'
            }
        });
        return ret.data;
    }
    catch (error) {
        //@todo : never called
        console.error(error.response?.data || error.message);
    }
};
export const upload_document = async (parameters, filePath) => {
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
        const ret = await axios.post(`https://${sub_domain}.deepl.com/v2/document`, formData, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${parameters.auth_key}`,
                ...formData.getHeaders()
            }
        });
        return ret.data;
    }
    catch (error) {
        console.error('error : upload_document', error.response?.data || error.message);
        throw error;
    }
};
export const check_document_status = async (auth_key, document_id, document_key, free_api = false) => {
    const sub_domain = free_api ? 'api-free' : 'api';
    try {
        const ret = await axios.post(`https://${sub_domain}.deepl.com/v2/document/${document_id}`, { document_key }, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${auth_key}`,
                'Content-Type': 'application/json'
            }
        });
        return ret.data;
    }
    catch (error) {
        console.error('error : check_document_status', error.response?.data || error.message);
        throw error;
    }
};
export const download_document = async (auth_key, document_id, document_key, free_api = false) => {
    const sub_domain = free_api ? 'api-free' : 'api';
    try {
        const ret = await axios.post(`https://${sub_domain}.deepl.com/v2/document/${document_id}/result`, { document_key }, {
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `DeepL-Auth-Key ${auth_key}`,
                'Content-Type': 'application/json'
            }
        });
        return ret.data; // This will be the ArrayBuffer / Buffer representing the file
    }
    catch (error) {
        console.error('error : download_document', error.response?.data || error.message);
        throw error;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVlcGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2RlZXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDdkMsT0FBTyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUE7QUFDeEMsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFBO0FBQ2hDLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBNkN4QixNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLEVBQ2pDLFVBQXlCLEVBQzNCLEVBQUU7SUFDQSxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxrS0FBa0ssQ0FBQTtRQUNqTCxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQ2Isb0NBQW9DLEVBQ3BDLE1BQWEsQ0FBUSxDQUFBO1FBQ3pCLE9BQU8sR0FBRyxDQUFBO0lBQ2QsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNoQyxDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBQ0QsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLEtBQUssRUFDaEMsVUFBeUIsRUFDM0IsRUFBRTtJQUNBLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzVELElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxVQUFVLEVBQUUsR0FBRyxVQUFVLENBQUM7UUFDL0MsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQWlCLENBQUMsQ0FBQTtRQUN6QyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQ2IsV0FBVyxVQUFVLHlCQUF5QixFQUM5QyxNQUFNLEVBQ047WUFDSSxPQUFPLEVBQUU7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