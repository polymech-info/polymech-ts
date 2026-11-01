import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Languages, Save, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface FieldTranslation {
    translated: string | null;
    saving: boolean;
}

export interface PageTranslationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pageId: string;
    /** The selected widget's instance ID within the page layout */
    widgetInstanceId?: string | null;
    /** The widget type id (e.g. 'markdown-text') */
    widgetTypeId?: string;
    /** The widget's source content (for quick translate) */
    sourceContent?: string;
    /** Page title for meta-field translation */
    pageTitle?: string;
    /** Source language */
    sourceLang?: string;
    /** External glossaries (if not provided, will be auto-loaded) */
    glossaries?: Glossary[];
}

export const PageTranslationDialog: React.FC<PageTranslationDialogProps> = ({
    open,
    onOpenChange,
    pageId,
    widgetInstanceId,
    widgetTypeId,
    sourceContent,
    pageTitle,
    sourceLang: initialSourceLangProp,
    glossaries: externalGlossaries,
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
    const [saving, setSaving] = useState(false);
    const [translatedPreview, setTranslatedPreview] = useState<string | null>(null);
    const [panelRefreshKey, setPanelRefreshKey] = useState(0);
    const [glossaries, setGlossaries] = useState<Glossary[]>(externalGlossaries || []);
    const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>('none');

    // Meta field translation state
    const [titlePreview, setTitlePreview] = useState<FieldTranslation>({ translated: null, saving: false });

    // Auto-load glossaries if not provided externally
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
        entityType: 'page',
        entityId: pageId,
        ...(widgetInstanceId ? { widgetId: widgetInstanceId } : {}),
    }), [pageId, widgetInstanceId]);

    // Step 1: Translate only — show preview
    const handleQuickTranslate = async () => {
        if (!sourceContent) {
            toast.error(translate('No content to translate'));
            return;
        }
        setTranslating(true);
        try {
            const gid = selectedGlossaryId !== 'none' ? selectedGlossaryId : undefined;
            const result = await wt.translateSingle(sourceContent, srcLang, targetLang, gid);
            if (result) {
                setTranslatedPreview(result);
            }
        } finally {
            setTranslating(false);
        }
    };

    // Step 2: Save the previewed translation
    const handleSaveTranslation = async () => {
        if (!translatedPreview || !widgetInstanceId) return;
        setSaving(true);
        try {
            await upsertWidgetTranslation({
                entity_type: 'page',
                entity_id: pageId,
                widget_id: widgetInstanceId,
                prop_path: 'content',
                source_lang: srcLang,
                target_lang: targetLang,
                source_text: sourceContent || '',
                translated_text: translatedPreview,
                status: 'machine',
            });
            toast.success(translate('Translation saved'));
            setTranslatedPreview(null);
            // Trigger panel reload
            setPanelRefreshKey(k => k + 1);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardPreview = () => {
        setTranslatedPreview(null);
    };

    // --- Meta field handlers (title, etc.) ---

    const handleTranslateMetaField = async (
        sourceText: string,
        setter: React.Dispatch<React.SetStateAction<FieldTranslation>>
    ) => {
        if (!sourceText) {
            toast.error(translate('No content to translate'));
            return;
        }
        setTranslating(true);
        try {
            const gid = selectedGlossaryId !== 'none' ? selectedGlossaryId : undefined;
            const result = await wt.translateSingle(sourceText, srcLang, targetLang, gid);
            if (result) {
                setter({ translated: result, saving: false });
            }
        } finally {
            setTranslating(false);
        }
    };

    const handleSaveMetaField = async (
        propPath: string,
        sourceText: string,
        translatedText: string,
        setter: React.Dispatch<React.SetStateAction<FieldTranslation>>
    ) => {
        setter(prev => ({ ...prev, saving: true }));
        try {
            await upsertWidgetTranslation({
                entity_type: 'page',
                entity_id: pageId,
                widget_id: '__meta__',
                prop_path: propPath,
                source_lang: srcLang,
                target_lang: targetLang,
                source_text: sourceText,
                translated_text: translatedText,
                status: 'machine',
            });
            toast.success(translate('Translation saved'));
            setter({ translated: null, saving: false });
            setPanelRefreshKey(k => k + 1);
        } catch (e: any) {
            toast.error(e.message);
            setter(prev => ({ ...prev, saving: false }));
        }
    };

    const renderMetaFieldRow = (
        label: string,
        propPath: string,
        sourceText: string,
        preview: FieldTranslation,
        setPreview: React.Dispatch<React.SetStateAction<FieldTranslation>>,
    ) => (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground w-24 shrink-0">{label}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">{sourceText.slice(0, 120)}{sourceText.length > 120 ? '…' : ''}</span>
                {preview.translated === null && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTranslateMetaField(sourceText, setPreview)}
                        disabled={translating || !sourceText}
                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30 shrink-0"
                    >
                        {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                        <T>Translate</T>
                    </Button>
                )}
            </div>

            {preview.translated !== null && (
                <div className="space-y-1.5 ml-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">{targetLang}</span>
                    </div>
                    <Input
                        value={preview.translated}
                        onChange={e => setPreview(prev => ({ ...prev, translated: e.target.value }))}
                        className="text-sm font-medium"
                    />
                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreview({ translated: null, saving: false })}
                            className="text-xs"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            <T>Discard</T>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTranslateMetaField(sourceText, setPreview)}
                            disabled={translating}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        >
                            {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                            <T>Re-translate</T>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleSaveMetaField(propPath, sourceText, preview.translated!, setPreview)}
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

    const handleSrcLangChange = (lang: string) => {
        setSrcLang(lang);
        setTranslatedPreview(null);
        setTitlePreview({ translated: null, saving: false });
    };

    // Reset preview when target lang changes
    const handleTargetLangChange = (lang: string) => {
        setTargetLang(lang);
        setTranslatedPreview(null);
        setTitlePreview({ translated: null, saving: false });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setTranslatedPreview(null); setTitlePreview({ translated: null, saving: false }); } onOpenChange(v); }}>
            <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-blue-500" />
                        <T>Page Translations</T>
                        {widgetTypeId && (
                            <span className="text-sm font-normal text-muted-foreground">
                                — {widgetTypeId}
                                {widgetInstanceId && <span className="font-mono text-xs ml-1">({widgetInstanceId.slice(0, 8)}…)</span>}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Page Meta Fields (Title, etc.) */}
                {pageTitle && (
                    <div className="space-y-3 p-3 mx-6 bg-muted/50 rounded-lg border mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium"><T>Page Meta</T>:</span>
                            <Select value={srcLang} onValueChange={handleSrcLangChange}>
                                <SelectTrigger className="h-7 w-[80px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TARGET_LANGS.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-xs">→</span>
                            <Select value={targetLang} onValueChange={handleTargetLangChange}>
                                <SelectTrigger className="h-7 w-[80px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
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
                        </div>
                        {renderMetaFieldRow(
                            translate('Title'),
                            'title',
                            pageTitle,
                            titlePreview,
                            setTitlePreview,
                        )}
                    </div>
                )}

                {/* Quick Translate Bar */}
                {sourceContent && widgetInstanceId && (
                    <div className="space-y-2 p-3 mx-6 bg-muted/50 rounded-lg border mb-2">
                        {/* Header row */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium"><T>Quick Translate</T>:</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {sourceContent.slice(0, 120)}{sourceContent.length > 120 ? '…' : ''}
                            </span>
                            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                                <Select value={srcLang} onValueChange={handleSrcLangChange}>
                                    <SelectTrigger className="h-7 w-[80px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGS.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs">→</span>
                                <Select value={targetLang} onValueChange={handleTargetLangChange}>
                                    <SelectTrigger className="h-7 w-[80px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
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
                                {!translatedPreview && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleQuickTranslate}
                                        disabled={translating}
                                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                                    >
                                        {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                                        <T>Translate</T>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Preview area — shown after translation */}
                        {translatedPreview !== null && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">{targetLang}</span>
                                    <span className="text-xs text-muted-foreground"><T>Preview</T> — {translate('edit below then save')}</span>
                                </div>
                                <Textarea
                                    value={translatedPreview}
                                    onChange={e => setTranslatedPreview(e.target.value)}
                                    rows={Math.min(8, Math.max(2, translatedPreview.split('\n').length))}
                                    className="text-sm font-medium resize-y"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleDiscardPreview}
                                        className="text-xs"
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        <T>Discard</T>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleQuickTranslate}
                                        disabled={translating}
                                        className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                                    >
                                        {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                                        <T>Re-translate</T>
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveTranslation}
                                        disabled={saving || !translatedPreview.trim()}
                                        className="text-xs"
                                    >
                                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                        <T>Save Translation</T>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Full Panel */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                    <WidgetTranslationPanel
                        filter={filter}
                        glossaries={glossaries}
                        showFilterBar={false}
                        autoLoad={open}
                        defaultSourceLang={srcLang}
                        defaultTargetLang={targetLang}
                        compact
                        refreshKey={panelRefreshKey}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
