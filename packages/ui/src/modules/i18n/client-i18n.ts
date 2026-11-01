import { z } from "zod";
import { fetchWithDeduplication, invalidateCache, getAuthToken } from "@/lib/db";

// --- i18n ---

export const TargetLanguageCodeSchema = z.union([
    z.enum(["en", "pt", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]),
    z.enum(["en-GB", "en-US", "pt-BR", "pt-PT"])
]);

export type TargetLanguageCode = z.infer<typeof TargetLanguageCodeSchema>;

export const SourceLanguageCodeSchema = z.enum(["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]);
export type SourceLanguageCode = z.infer<typeof SourceLanguageCodeSchema>;

export interface Glossary {
    glossary_id: string;
    name: string;
    ready: boolean;
    source_lang: string;
    target_lang: string;
    entry_count: number;
}

export const translateText = async (text: string, srcLang: string, dstLang: string, glossaryId?: string, format?: 'text' | 'markdown') => {
    // POST /api/i18n/translate
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/i18n/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            srcLang,
            dstLang,
            text,
            format: format || 'text',
            meta: glossaryId ? { glossary_id: glossaryId } : undefined
        })
    });

    if (!res.ok) throw new Error(`Translation failed: ${res.statusText}`);
    return await res.json(); // { translation: string }
};

export const fetchGlossaries = async () => {
    // GET /api/i18n/glossaries
    return fetchWithDeduplication('i18n-glossaries', async () => {
        const token = await getAuthToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/i18n/glossaries', { headers });
        if (!res.ok) throw new Error(`Fetch glossaries failed: ${res.statusText}`);
        return await res.json() as Glossary[];
    });
};

export const createGlossary = async (name: string, srcLang: string, dstLang: string, entries: Record<string, string>) => {
    // POST /api/i18n/glossaries
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/i18n/glossaries', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name,
            source_lang: srcLang,
            target_lang: dstLang,
            entries
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Create glossary failed: ${err.error || res.statusText}`);
    }

    invalidateCache('i18n-glossaries');
    return await res.json();
};

export const deleteGlossary = async (id: string) => {
    // DELETE /api/i18n/glossaries/:id
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/i18n/glossaries/${id}`, {
        method: 'DELETE',
        headers
    });

    if (!res.ok) throw new Error(`Delete glossary failed: ${res.statusText}`);

    invalidateCache('i18n-glossaries');
    return true;
};

export const fetchGlossaryTerms = async (glossaryId: string): Promise<Record<string, string>> => {
    const res = await fetch(`/api/i18n/glossaries/${glossaryId}/terms`);
    if (!res.ok) throw new Error(`Fetch glossary terms failed: ${res.statusText}`);
    const data = await res.json();
    return data.terms || {};
};

export const updateGlossaryTerms = async (glossaryId: string, entries: Record<string, string>): Promise<{ success: boolean; entry_count: number }> => {
    const res = await fetch(`/api/i18n/glossaries/${glossaryId}/terms`, {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ entries }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`Update glossary terms failed: ${err.error || res.statusText}`);
    }

    invalidateCache('i18n-glossaries');
    return await res.json();
};

// --- Update i18n Language File ---

export const updateLangFile = async (lang: string, entries: Record<string, string>): Promise<{ success: boolean; total: number; added: number; updated: number }> => {
    const res = await fetch('/api/i18n/update-lang-file', {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ lang, entries }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`Update lang file failed: ${err.error || res.statusText}`);
    }

    return await res.json();
};

// --- Widget Translations ---

export interface WidgetTranslation {
    id: string;
    entity_type?: string | null;
    entity_id?: string | null;
    widget_id?: string | null;
    prop_path?: string | null;
    source_lang: string;
    target_lang: string;
    source_text?: string | null;
    translated_text?: string | null;
    source_version?: number | null;
    status?: 'draft' | 'machine' | 'reviewed' | 'published' | 'outdated';
    meta?: any;
    created_at?: string;
    updated_at?: string;
}

export type WidgetTranslationInput = Omit<WidgetTranslation, 'id' | 'created_at' | 'updated_at'>;

const authHeaders = async (): Promise<HeadersInit> => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const fetchWidgetTranslations = async (criteria: {
    entityType?: string;
    entityId?: string;
    widgetId?: string;
    targetLang?: string;
    sourceLang?: string;
    status?: string;
} = {}): Promise<WidgetTranslation[]> => {
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([k, v]) => { if (v) params.set(k, v); });

    const res = await fetch(`/api/i18n/widget-translations?${params.toString()}`);
    if (!res.ok) throw new Error(`Fetch widget translations failed: ${res.statusText}`);
    return await res.json();
};

export const upsertWidgetTranslation = async (data: WidgetTranslationInput): Promise<WidgetTranslation> => {
    const res = await fetch('/api/i18n/widget-translations', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`Upsert widget translation failed: ${err.error || res.statusText}`);
    }
    return await res.json();
};

export const upsertWidgetTranslationsBatch = async (data: WidgetTranslationInput[]): Promise<WidgetTranslation[]> => {
    const res = await fetch('/api/i18n/widget-translations/batch', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`Batch upsert failed: ${err.error || res.statusText}`);
    }
    return await res.json();
};

export const deleteWidgetTranslation = async (id: string): Promise<boolean> => {
    const headers = await authHeaders();
    const res = await fetch(`/api/i18n/widget-translations/${id}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error(`Delete widget translation failed: ${res.statusText}`);
    return true;
};

export const deleteWidgetTranslationsByEntity = async (entityType: string, entityId: string, targetLang?: string): Promise<boolean> => {
    const headers = await authHeaders();
    const params = targetLang ? `?targetLang=${targetLang}` : '';
    const res = await fetch(`/api/i18n/widget-translations/entity/${entityType}/${entityId}${params}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error(`Delete widget translations by entity failed: ${res.statusText}`);
    return true;
};

// --- Translation Gaps ---

export const fetchTranslationGaps = async (
    entityType: string,
    targetLang: string,
    sourceLang?: string,
    mode?: 'missing' | 'outdated' | 'all',
): Promise<WidgetTranslation[]> => {
    const params = new URLSearchParams({ entityType, targetLang });
    if (sourceLang) params.set('sourceLang', sourceLang);
    if (mode) params.set('mode', mode);

    const res = await fetch(`/api/i18n/translation-gaps?${params.toString()}`);
    if (!res.ok) throw new Error(`Fetch translation gaps failed: ${res.statusText}`);
    return await res.json();
};
