import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Languages, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { T, translate, getCurrentLang } from '@/i18n';
import {
    type Glossary,
    TargetLanguageCodeSchema,
    upsertWidgetTranslation,
    fetchGlossaries,
} from './client-i18n';
import { WidgetTranslationPanel } from './WidgetTranslationPanel';
import { type WidgetTranslationFilter } from './useWidgetTranslation';
import { useWidgetTranslation } from './useWidgetTranslation';
import { toast } from 'sonner';
import { useAppConfig } from '@/hooks/useSystemInfo';

const TARGET_LANGS = [
    ...TargetLanguageCodeSchema.options[0].options,
    ...TargetLanguageCodeSchema.options[1].options,
].sort();

// ─── Types ──────────────────────────────────────────────

export interface TranslatableField {
    /** Display label (e.g. "Name", "Description", "Title") */
    label: string;
    /** Storage path for this translation (e.g. "name", "fields.country.title") */
    propPath: string;
    /** Source text to translate */
    sourceText: string;
    /** Render as multiline textarea */
    multiline?: boolean;
    /** Visual group name — fields with the same group are rendered under a heading */
    group?: string;
}

export interface TranslationsGridProps {
    /** Entity type for storage (e.g. 'category', 'type', 'page') */
    entityType: string;
    /** Entity ID */
    entityId: string;
    /** Fields to translate */
    fields: TranslatableField[];
    /** Initial source language (falls back to appConfig) */
    sourceLang?: string;
    /** External glossaries; auto-loaded if not provided */
    glossaries?: Glossary[];
    /** Show the WidgetTranslationPanel below the field rows (default: true) */
    showPanel?: boolean;
    /** Extra class for the root container */
    className?: string;
}

// ─── Internal ───────────────────────────────────────────

interface FieldTranslation {
    translated: string | null;
    saving: boolean;
}

const EMPTY: FieldTranslation = { translated: null, saving: false };

// ─── Component ──────────────────────────────────────────

export const TranslationsGrid: React.FC<TranslationsGridProps> = ({
    entityType,
    entityId,
    fields,
    sourceLang: initialSourceLangProp,
    glossaries: externalGlossaries,
    showPanel = true,
    className,
}) => {
    const appConfig = useAppConfig();
    const srcLangDefault = appConfig?.i18n?.source_language || 'en';
    const initialSourceLang = initialSourceLangProp || srcLangDefault;

    const [srcLang, setSrcLang] = useState<string>(initialSourceLang);
    const [targetLang, setTargetLang] = useState<string>(() => {
        const cur = getCurrentLang();
        return cur === initialSourceLang ? 'de' : cur;
    });
    const [translating, setTranslating] = useState(false);
    const [panelRefreshKey, setPanelRefreshKey] = useState(0);
    const [glossaries, setGlossaries] = useState<Glossary[]>(externalGlossaries || []);
    const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>('none');

    // Dynamic preview state keyed by propPath
    const [previews, setPreviews] = useState<Record<string, FieldTranslation>>({});
    const getPreview = (key: string): FieldTranslation => previews[key] || EMPTY;
    const setPreview = (key: string, val: FieldTranslation) =>
        setPreviews(prev => ({ ...prev, [key]: val }));
    const resetAllPreviews = () => setPreviews({});

    // Auto-load glossaries
    useEffect(() => {
        if (!externalGlossaries) {
            fetchGlossaries().then(setGlossaries).catch(() => { });
        }
    }, [externalGlossaries]);

    const wt = useWidgetTranslation({
        defaultSourceLang: srcLang,
        defaultTargetLang: targetLang,
    });

    const filter = useMemo<WidgetTranslationFilter>(() => ({
        entityType,
        entityId,
    }), [entityType, entityId]);

    // ─── Handlers ───────────────────────────────────────

    const handleTranslateField = async (sourceText: string, propPath: string) => {
        if (!sourceText) {
            toast.error(translate('No content to translate'));
            return;
        }
        setTranslating(true);
        try {
            const gid = selectedGlossaryId !== 'none' ? selectedGlossaryId : undefined;
            const result = await wt.translateSingle(sourceText, srcLang, targetLang, gid);
            if (result) setPreview(propPath, { translated: result, saving: false });
        } finally {
            setTranslating(false);
        }
    };

    const handleSaveField = async (propPath: string, sourceText: string, translatedText: string) => {
        setPreview(propPath, { translated: translatedText, saving: true });
        try {
            await upsertWidgetTranslation({
                entity_type: entityType,
                entity_id: entityId,
                widget_id: null,
                prop_path: propPath,
                source_lang: srcLang,
                target_lang: targetLang,
                source_text: sourceText,
                translated_text: translatedText,
                status: 'machine',
            });
            toast.success(translate('Translation saved'));
            setPreview(propPath, EMPTY);
            setPanelRefreshKey(k => k + 1);
        } catch (e: any) {
            toast.error(e.message);
            setPreview(propPath, { translated: translatedText, saving: false });
        }
    };

    const handleTranslateAll = async () => {
        setTranslating(true);
        const gid = selectedGlossaryId !== 'none' ? selectedGlossaryId : undefined;
        try {
            for (const f of fields) {
                if (!f.sourceText) continue;
                const result = await wt.translateSingle(f.sourceText, srcLang, targetLang, gid);
                if (result) setPreview(f.propPath, { translated: result, saving: false });
            }
        } finally {
            setTranslating(false);
        }
    };

    const handleSrcLangChange = (lang: string) => { setSrcLang(lang); resetAllPreviews(); };
    const handleTargetLangChange = (lang: string) => { setTargetLang(lang); resetAllPreviews(); };

    // ─── Render helpers ─────────────────────────────────

    const renderFieldRow = (f: TranslatableField) => {
        const preview = getPreview(f.propPath);
        return (
            <div key={f.propPath} className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground w-24 shrink-0">{f.label}</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">
                        {f.sourceText.slice(0, 120)}{f.sourceText.length > 120 ? '…' : ''}
                    </span>
                    {preview.translated === null && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTranslateField(f.sourceText, f.propPath)}
                            disabled={translating || !f.sourceText}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30 shrink-0"
                        >
                            {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                            <T>Translate</T>
                        </Button>
                    )}
                </div>

                {preview.translated !== null && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">{targetLang}</span>
                        </div>
                        {f.multiline ? (
                            <Textarea
                                value={preview.translated}
                                onChange={e => setPreview(f.propPath, { ...preview, translated: e.target.value })}
                                rows={Math.min(4, Math.max(2, (preview.translated || '').split('\n').length))}
                                className="text-sm font-medium resize-y"
                            />
                        ) : (
                            <Input
                                value={preview.translated}
                                onChange={e => setPreview(f.propPath, { ...preview, translated: e.target.value })}
                                className="text-sm font-medium"
                            />
                        )}
                        <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setPreview(f.propPath, EMPTY)} className="text-xs">
                                <X className="h-3.5 w-3.5 mr-1" />
                                <T>Discard</T>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTranslateField(f.sourceText, f.propPath)}
                                disabled={translating}
                                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                            >
                                {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                                <T>Re-translate</T>
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleSaveField(f.propPath, f.sourceText, preview.translated!)}
                                disabled={preview.saving || !(preview.translated || '').trim()}
                                className="text-xs"
                            >
                                {preview.saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                <T>Save Translation</T>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Group fields by their group prop
    const ungrouped = fields.filter(f => !f.group);
    const groups = [...new Set(fields.filter(f => f.group).map(f => f.group!))];

    return (
        <div className={className}>
            {/* Language Selection & Translate All */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium"><T>Translate</T>:</span>
                    <Select value={srcLang} onValueChange={handleSrcLangChange}>
                        <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {TARGET_LANGS.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-xs">→</span>
                    <Select value={targetLang} onValueChange={handleTargetLangChange}>
                        <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {TARGET_LANGS.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {glossaries.length > 0 && (
                        <Select value={selectedGlossaryId} onValueChange={setSelectedGlossaryId}>
                            <SelectTrigger className="h-7 w-[140px] text-xs">
                                <SelectValue placeholder={translate('Glossary')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none"><T>No glossary</T></SelectItem>
                                {glossaries.map(g => (
                                    <SelectItem key={g.glossary_id} value={g.glossary_id}>
                                        {g.name} ({g.source_lang}→{g.target_lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <div className="ml-auto">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTranslateAll}
                            disabled={translating}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        >
                            {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                            <T>Translate All</T>
                        </Button>
                    </div>
                </div>

                {/* Ungrouped fields */}
                {ungrouped.map(renderFieldRow)}
            </div>

            {/* Grouped fields */}
            {groups.map(groupName => (
                <div key={groupName} className="space-y-3 p-3 bg-muted/50 rounded-lg border mb-2">
                    <div className="text-sm font-medium">{groupName}</div>
                    {fields
                        .filter(f => f.group === groupName)
                        .map(f => (
                            <div key={f.propPath} className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                                {renderFieldRow(f)}
                            </div>
                        ))}
                </div>
            ))}

            {/* WidgetTranslationPanel */}
            {showPanel && (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <WidgetTranslationPanel
                        filter={filter}
                        glossaries={glossaries}
                        showFilterBar={false}
                        autoLoad
                        defaultSourceLang={srcLang}
                        defaultTargetLang={targetLang}
                        compact
                        refreshKey={panelRefreshKey}
                    />
                </div>
            )}
        </div>
    );
};
