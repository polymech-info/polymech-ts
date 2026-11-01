import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
    translateText,
    fetchWidgetTranslations,
    upsertWidgetTranslation,
    upsertWidgetTranslationsBatch,
    deleteWidgetTranslation,
    deleteWidgetTranslationsByEntity,
    updateLangFile,
    type WidgetTranslation,
    type WidgetTranslationInput,
} from './client-i18n';
import { translate } from '@/i18n';

/** Detect if text contains markdown structures that need AST-based translation */
function looksLikeMarkdown(text: string): boolean {
    return /^\s*[#|*\-]|\|.*\|.*\||```|\*\*|\[.*\]\(/.test(text);
}

export interface WidgetTranslationFilter {
    entityType?: string;
    entityId?: string;
    widgetId?: string;
    targetLang?: string;
    sourceLang?: string;
}

export interface UseWidgetTranslationOptions {
    /** Initial filter criteria */
    filter?: WidgetTranslationFilter;
    /** Auto-load on mount */
    autoLoad?: boolean;
    /** Default source language */
    defaultSourceLang?: string;
    /** Default target language */
    defaultTargetLang?: string;
}

export function useWidgetTranslation(options: UseWidgetTranslationOptions = {}) {
    const {
        filter: initialFilter,
        autoLoad = false,
        defaultSourceLang = 'de',
        defaultTargetLang = 'en',
    } = options;

    // List state
    const [wtList, setWtList] = useState<WidgetTranslation[]>([]);
    const [wtLoading, setWtLoading] = useState(false);

    // Filter state
    const [filter, setFilter] = useState<WidgetTranslationFilter>(initialFilter || {});

    // Form state
    const [wtForm, setWtForm] = useState<WidgetTranslationInput>({
        entity_type: initialFilter?.entityType || 'page',
        entity_id: initialFilter?.entityId || null,
        widget_id: initialFilter?.widgetId || null,
        prop_path: 'content',
        source_lang: defaultSourceLang,
        target_lang: defaultTargetLang,
        source_text: '',
        translated_text: '',
        status: 'machine',
    });
    const [wtEditing, setWtEditing] = useState<string | null>(null);

    // Operation states
    const [wtSaving, setWtSaving] = useState(false);
    const [wtTranslating, setWtTranslating] = useState(false);
    const [wtBatchTranslating, setWtBatchTranslating] = useState(false);
    const [wtBatchProgress, setWtBatchProgress] = useState({ done: 0, total: 0 });
    const [wtSavingToDB, setWtSavingToDB] = useState(false);
    const [wtUpdatingI18n, setWtUpdatingI18n] = useState(false);

    // Selection and modification state
    const [wtSelectedIds, setWtSelectedIds] = useState<Set<string>>(new Set());
    const [wtModifiedIds, setWtModifiedIds] = useState<Set<string>>(new Set());

    const loadWidgetTranslations = useCallback(async (overrideFilter?: WidgetTranslationFilter) => {
        setWtLoading(true);
        try {
            const criteria: any = {};
            const f = overrideFilter || filter;
            if (f.entityType) criteria.entityType = f.entityType;
            if (f.entityId) criteria.entityId = f.entityId;
            if (f.widgetId) criteria.widgetId = f.widgetId;
            if (f.targetLang) criteria.targetLang = f.targetLang;
            if (f.sourceLang) criteria.sourceLang = f.sourceLang;
            const data = await fetchWidgetTranslations(criteria);
            setWtList(data);
            setWtModifiedIds(new Set());
        } catch (e: any) {
            toast.error(translate(`Failed to load widget translations: ${e.message}`));
        } finally {
            setWtLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (autoLoad) loadWidgetTranslations();
    }, [autoLoad]);

    const handleWtUpsert = useCallback(async () => {
        if (!wtForm.source_lang || !wtForm.target_lang) {
            toast.error(translate('source_lang and target_lang are required'));
            return;
        }
        setWtSaving(true);
        try {
            await upsertWidgetTranslation(wtForm);
            toast.success(translate(wtEditing ? 'Widget translation updated' : 'Widget translation created'));

            setWtList(prev => {
                const existingIndex = prev.findIndex(item => item.id === wtEditing);
                if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = { ...next[existingIndex], ...wtForm } as WidgetTranslation;
                    return next;
                }
                loadWidgetTranslations(); // Fallback if it's a new item or not found
                return prev;
            });

            resetWtForm();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setWtSaving(false);
        }
    }, [wtForm, wtEditing, loadWidgetTranslations]);

    const handleWtTranslate = useCallback(async (glossaryId?: string) => {
        if (!wtForm.source_text) {
            toast.error(translate('Enter source text first'));
            return;
        }
        if (!wtForm.source_lang || !wtForm.target_lang) {
            toast.error(translate('Source and target language required'));
            return;
        }
        setWtTranslating(true);
        try {
            const fmt = looksLikeMarkdown(wtForm.source_text) ? 'markdown' as const : 'text' as const;
            const res = await translateText(wtForm.source_text, wtForm.source_lang, wtForm.target_lang, glossaryId, fmt);
            setWtForm(f => ({ ...f, translated_text: res.translation }));
            toast.success(translate('Translated via DeepL'));
        } catch (e: any) {
            toast.error(`${translate('Translation failed')}: ${e.message}`);
        } finally {
            setWtTranslating(false);
        }
    }, [wtForm]);

    const handleWtEdit = useCallback((wt: WidgetTranslation) => {
        setWtEditing(wt.id);
        setWtForm({
            entity_type: wt.entity_type || 'page',
            entity_id: wt.entity_id || null,
            widget_id: wt.widget_id || null,
            prop_path: wt.prop_path || 'content',
            source_lang: wt.source_lang,
            target_lang: wt.target_lang,
            source_text: wt.source_text || '',
            translated_text: wt.translated_text || '',
            status: wt.status || 'machine',
            source_version: wt.source_version,
            meta: wt.meta,
        });
    }, []);

    const handleWtDelete = useCallback(async (id: string) => {
        try {
            await deleteWidgetTranslation(id);
            toast.success(translate('Widget translation deleted'));
            setWtList(prev => prev.filter(wt => wt.id !== id));
        } catch (e: any) {
            toast.error(e.message);
        }
    }, []);

    const handleWtDeleteByEntity = useCallback(async (entityType?: string, entityId?: string, targetLang?: string) => {
        const et = entityType || filter.entityType;
        const eid = entityId || filter.entityId;
        if (!et || !eid) {
            toast.error(translate('Entity type and entity ID required for bulk delete'));
            return;
        }
        try {
            await deleteWidgetTranslationsByEntity(et, eid, targetLang || undefined);
            toast.success(translate('Widget translations deleted for entity'));
            loadWidgetTranslations();
        } catch (e: any) {
            toast.error(e.message);
        }
    }, [filter, loadWidgetTranslations]);

    const resetWtForm = useCallback(() => {
        setWtEditing(null);
        setWtForm({
            entity_type: filter.entityType || 'page',
            entity_id: filter.entityId || null,
            widget_id: filter.widgetId || null,
            prop_path: 'content',
            source_lang: defaultSourceLang,
            target_lang: defaultTargetLang,
            source_text: '',
            translated_text: '',
            status: 'machine',
        });
    }, [filter, defaultSourceLang, defaultTargetLang]);

    const handleWtBatchTranslate = useCallback(async (glossaryId?: string) => {
        const candidates = wtSelectedIds.size > 0
            ? wtList.filter(wt => wtSelectedIds.has(wt.id) && wt.source_text && !wt.translated_text)
            : wtList.filter(wt => wt.source_text && !wt.translated_text);

        if (candidates.length === 0) {
            toast.info(translate('No untranslated entries') + (wtSelectedIds.size > 0 ? ` ${translate('in selection')}` : ''));
            return;
        }

        setWtBatchTranslating(true);
        setWtBatchProgress({ done: 0, total: candidates.length });
        let translated = 0;
        let failed = 0;
        const newModified = new Set(wtModifiedIds);

        for (const wt of candidates) {
            try {
                const gid = glossaryId && glossaryId !== 'none' ? glossaryId : undefined;
                const fmt = looksLikeMarkdown(wt.source_text!) ? 'markdown' as const : 'text' as const;
                const res = await translateText(wt.source_text!, wt.source_lang, wt.target_lang, gid, fmt);
                setWtList(prev => prev.map(item =>
                    item.id === wt.id
                        ? { ...item, translated_text: res.translation, status: 'machine' as const }
                        : item
                ));
                newModified.add(wt.id);
                translated++;
            } catch {
                failed++;
            }
            setWtBatchProgress({ done: translated + failed, total: candidates.length });
        }

        setWtModifiedIds(newModified);
        setWtBatchTranslating(false);
        toast.success(`${translate('Batch done')}: ${translated} ${translate('translated')}, ${failed} ${translate('failed')}`);
    }, [wtList, wtSelectedIds]);

    const handleWtSaveToDB = useCallback(async () => {
        const source = wtSelectedIds.size > 0
            ? wtList.filter(wt => wtSelectedIds.has(wt.id) && wt.translated_text)
            : wtList.filter(wt => wtModifiedIds.has(wt.id) && wt.translated_text);

        if (source.length === 0) {
            toast.info(translate('No translated or modified entries to save'));
            return;
        }

        setWtSavingToDB(true);
        try {
            const batch: WidgetTranslationInput[] = source.map(wt => ({
                entity_type: wt.entity_type || 'system',
                entity_id: wt.entity_id || null,
                widget_id: wt.widget_id || null,
                prop_path: wt.prop_path,
                source_lang: wt.source_lang,
                target_lang: wt.target_lang,
                source_text: wt.source_text || '',
                translated_text: wt.translated_text || '',
                status: wt.status || 'machine',
            }));

            await upsertWidgetTranslationsBatch(batch);
            setWtList(prev => prev.map(item => {
                const updated = batch.find(b =>
                    b.entity_type === item.entity_type &&
                    b.entity_id === item.entity_id &&
                    b.widget_id === item.widget_id &&
                    b.prop_path === item.prop_path &&
                    b.target_lang === item.target_lang
                );
                return updated ? { ...item, status: updated.status } : item;
            }));
            toast.success(`${translate('Saved')} ${batch.length} ${translate('translations to database')}`);
        } catch (e: any) {
            toast.error(`${translate('Save to DB failed')}: ${e.message}`);
        } finally {
            setWtSavingToDB(false);
        }
    }, [wtList, wtSelectedIds, loadWidgetTranslations]);

    const handleUpdateI18n = useCallback(async () => {
        const source = wtSelectedIds.size > 0
            ? wtList.filter(wt => wtSelectedIds.has(wt.id) && wt.translated_text)
            : wtList.filter(wt => wtModifiedIds.has(wt.id) && wt.translated_text);

        const byLang: Record<string, Record<string, string>> = {};
        for (const wt of source) {
            if (!wt.source_text || !wt.translated_text) continue;
            const lang = wt.target_lang;
            if (!byLang[lang]) byLang[lang] = {};
            byLang[lang][wt.source_text] = wt.translated_text;
        }

        const langs = Object.keys(byLang);
        if (langs.length === 0) {
            toast.info(translate('No translated entries to push'));
            return;
        }

        setWtUpdatingI18n(true);
        try {
            const results: string[] = [];
            for (const lang of langs) {
                const res = await updateLangFile(lang, byLang[lang]);
                results.push(`${lang}: +${res.added} new, ~${res.updated} updated (${res.total} total)`);
            }
            toast.success(`${translate('Updated i18n files')}:\n${results.join('\n')}`);
        } catch (e: any) {
            toast.error(`${translate('Update i18n failed')}: ${e.message}`);
        } finally {
            setWtUpdatingI18n(false);
        }
    }, [wtList, wtSelectedIds]);

    /** Translate a single text and return the result (no form interaction) */
    const translateSingle = useCallback(async (
        sourceText: string,
        sourceLang: string,
        targetLang: string,
        glossaryId?: string,
    ): Promise<string | null> => {
        try {
            const fmt = looksLikeMarkdown(sourceText) ? 'markdown' as const : 'text' as const;
            const res = await translateText(sourceText, sourceLang, targetLang, glossaryId, fmt);
            return res.translation;
        } catch (e: any) {
            toast.error(`${translate('Translation failed')}: ${e.message}`);
            return null;
        }
    }, []);

    /** Translate source text and immediately save as a widget translation */
    const translateAndSave = useCallback(async (
        sourceText: string,
        sourceLang: string,
        targetLang: string,
        entityType: string,
        entityId: string,
        widgetId: string,
        propPath: string = 'content',
        glossaryId?: string,
    ): Promise<WidgetTranslation | null> => {
        try {
            const fmt = looksLikeMarkdown(sourceText) ? 'markdown' as const : 'text' as const;
            const res = await translateText(sourceText, sourceLang, targetLang, glossaryId, fmt);
            const saved = await upsertWidgetTranslation({
                entity_type: entityType,
                entity_id: entityId,
                widget_id: widgetId,
                prop_path: propPath,
                source_lang: sourceLang,
                target_lang: targetLang,
                source_text: sourceText,
                translated_text: res.translation,
                status: 'machine',
            });
            toast.success(translate('Translation saved'));
            return saved;
        } catch (e: any) {
            toast.error(`${translate('Translation failed')}: ${e.message}`);
            return null;
        }
    }, []);

    return {
        // State
        wtList,
        setWtList,
        wtLoading,
        wtForm,
        setWtForm,
        wtEditing,
        wtSaving,
        wtTranslating,
        wtBatchTranslating,
        wtBatchProgress,
        wtSavingToDB,
        wtUpdatingI18n,
        wtSelectedIds,
        setWtSelectedIds,
        wtModifiedIds,
        setWtModifiedIds,
        filter,
        setFilter,

        // Actions
        loadWidgetTranslations,
        handleWtUpsert,
        handleWtTranslate,
        handleWtEdit,
        handleWtDelete,
        handleWtDeleteByEntity,
        resetWtForm,
        handleWtBatchTranslate,
        handleWtSaveToDB,
        handleUpdateI18n,
        translateSingle,
        translateAndSave,
    };
}
