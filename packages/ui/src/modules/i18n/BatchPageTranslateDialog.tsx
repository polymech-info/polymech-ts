import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Loader2, Languages, Settings, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { T, translate, getCurrentLang } from '@/i18n';
import {
    type Glossary,
    type WidgetTranslation,
    TargetLanguageCodeSchema,
    translateText,
    fetchWidgetTranslations,
    upsertWidgetTranslationsBatch,
    deleteWidgetTranslationsByEntity,
    fetchGlossaries,
} from './client-i18n';
import { WidgetTranslationPanel, type WidgetTranslationPanelHandle } from './WidgetTranslationPanel';
import { GlossaryManager } from './GlossaryManager';
import { toast } from 'sonner';
import { useAppConfig } from '@/hooks/useSystemInfo';
import { iterateWidgets } from '@polymech/shared';
import type { PageLayout } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from '@/lib/widgetRegistry';

const TARGET_LANGS = [
    ...TargetLanguageCodeSchema.options[0].options,
    ...TargetLanguageCodeSchema.options[1].options,
].sort();

const TRANSLATABLE_WIDGET_IDS = new Set(['markdown-text', 'html-block', 'category-feed']);
const TRANSLATABLE_PROPS = ['content', 'heading'];

interface TranslatableItem {
    key: string;
    widgetId: string;
    widgetTypeId: string;
    propPath: string;
    label: string;
    sourceText: string;
}

export interface BatchPageTranslateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pageId: string;
    pageTitle?: string;
    pageLayout: PageLayout | null;
}

export const BatchPageTranslateDialog: React.FC<BatchPageTranslateDialogProps> = ({
    open,
    onOpenChange,
    pageId,
    pageTitle,
    pageLayout,
}) => {
    const appConfig = useAppConfig();
    const srcLangDefault = appConfig?.i18n?.source_language || 'en';
    const [srcLang, setSrcLang] = useState<string>(srcLangDefault);
    const [targetLang, setTargetLang] = useState<string>(getCurrentLang);
    const isShowAll = targetLang === 'all';

    const [glossaries, setGlossaries] = useState<Glossary[]>([]);
    const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>('none');
    const [translating, setTranslating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const abortRef = useRef(false);
    const panelRef = useRef<WidgetTranslationPanelHandle>(null);
    const [showGlossaryPanel, setShowGlossaryPanel] = useState(false);

    useEffect(() => {
        if (open) fetchGlossaries().then(setGlossaries).catch(() => { });
    }, [open]);

    // Collect all translatable items from page layout
    const translatableItems = useMemo<TranslatableItem[]>(() => {
        const items: TranslatableItem[] = [];

        if (pageTitle) {
            items.push({
                key: '__meta__:title',
                widgetId: '__meta__',
                widgetTypeId: '__meta__',
                propPath: 'title',
                label: translate('Page Title'),
                sourceText: pageTitle,
            });
        }

        if (pageLayout) {
            iterateWidgets(pageLayout as any, (w: any) => {
                if (!w.id || !w.props) return;
                const def = widgetRegistry.get(w.widgetId);
                const typeName = def?.metadata.name || w.widgetId;
                console.log(w.widgetId, typeName);  
                for (const prop of TRANSLATABLE_PROPS) {
                    if (prop === 'content' && !TRANSLATABLE_WIDGET_IDS.has(w.widgetId)) continue;
                    const val = w.props[prop];
                    if (typeof val === 'string' && val.trim()) {
                        items.push({
                            key: `${w.id}:${prop}`,
                            widgetId: w.id,
                            widgetTypeId: w.widgetId,
                            propPath: prop,
                            label: `${typeName} – ${prop} (${w.id.slice(0, 8)}…)`,
                            sourceText: val,
                        });
                    }
                }
            });
        }

        return items;
    }, [pageLayout, pageTitle]);

    // Load from DB + seed missing items as synthetic entries
    const loadAndSeed = useCallback(async () => {
        if (!open || translatableItems.length === 0) return;
        setLoading(true);

        try {
            const existing = await fetchWidgetTranslations({
                entityType: 'page',
                entityId: pageId,
                ...(isShowAll ? {} : { targetLang }),
            });

            if (isShowAll) {
                // Show all existing translations only — no synthetic stubs
                panelRef.current?.replaceList(existing);
            } else {
                // Lookup existing: widget_id:prop_path -> WidgetTranslation
                const lookup = new Map<string, WidgetTranslation>();
                for (const wt of existing) {
                    lookup.set(`${wt.widget_id}:${wt.prop_path}`, wt);
                }

                // Create synthetic entries for missing items (no translated_text)
                const synthetics: WidgetTranslation[] = [];
                for (const item of translatableItems) {
                    if (!lookup.has(item.key)) {
                        synthetics.push({
                            id: `missing-${item.key}`,
                            entity_type: 'page',
                            entity_id: pageId,
                            widget_id: item.widgetId,
                            prop_path: item.propPath,
                            source_lang: srcLang,
                            target_lang: targetLang,
                            source_text: item.sourceText,
                            translated_text: null,
                            status: 'draft',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    }
                }

                // Feed merged list to panel (existing DB items + missing synthetics)
                panelRef.current?.replaceList([...existing, ...synthetics]);
            }
        } catch (e: any) {
            toast.error(`${translate('Failed to load translations')}: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [open, translatableItems, pageId, targetLang, srcLang, isShowAll]);

    useEffect(() => {
        loadAndSeed();
    }, [loadAndSeed]);

    // Translate all missing
    const handleTranslateAll = useCallback(async () => {
        if (isShowAll) return;
        const existing = await fetchWidgetTranslations({
            entityType: 'page',
            entityId: pageId,
            targetLang,
        });

        const existingKeys = new Set(existing.map(wt => `${wt.widget_id}:${wt.prop_path}`));
        const candidates = translatableItems.filter(item => !existingKeys.has(item.key));

        if (candidates.length === 0) {
            toast.info(translate('All items already translated'));
            return;
        }

        setTranslating(true);
        abortRef.current = false;
        setProgress({ done: 0, total: candidates.length });
        let done = 0;
        const translated: { item: TranslatableItem; text: string }[] = [];

        for (const item of candidates) {
            if (abortRef.current) break;
            try {
                const gid = selectedGlossaryId !== 'none' ? selectedGlossaryId : undefined;
                const format = item.widgetTypeId === 'markdown-text' ? 'markdown' as const : 'text' as const;
                const res = await translateText(item.sourceText, srcLang, targetLang, gid, format);
                translated.push({ item, text: res.translation });
            } catch {
                // leave — user can retry
            }
            done++;
            setProgress({ done, total: candidates.length });
        }

        if (translated.length > 0) {
            try {
                const batch = translated.map(({ item, text }) => ({
                    entity_type: 'page' as const,
                    entity_id: pageId,
                    widget_id: item.widgetId,
                    prop_path: item.propPath,
                    source_lang: srcLang,
                    target_lang: targetLang,
                    source_text: item.sourceText,
                    translated_text: text,
                    status: 'machine' as const,
                }));
                await upsertWidgetTranslationsBatch(batch);
                toast.success(`${translate('Saved')} ${batch.length} ${translate('translations')}`);
            } catch (e: any) {
                toast.error(`${translate('Save failed')}: ${e.message}`);
            }
        }

        setTranslating(false);
        await loadAndSeed(); // Refresh
    }, [translatableItems, pageId, targetLang, srcLang, selectedGlossaryId, loadAndSeed, isShowAll]);

    const handleAbort = useCallback(() => { abortRef.current = true; }, []);

    // Delete all existing translations for this page + target language
    const handleDeleteAll = useCallback(async () => {
        if (isShowAll) return;
        const ok = window.confirm(
            translate('Delete all translations for this page in') + ` "${targetLang}"?`
        );
        if (!ok) return;

        setDeleting(true);
        try {
            await deleteWidgetTranslationsByEntity('page', pageId, targetLang);
            toast.success(translate('Translations deleted'));
            await loadAndSeed();
        } catch (e: any) {
            toast.error(`${translate('Delete failed')}: ${e.message}`);
        } finally {
            setDeleting(false);
        }
    }, [pageId, targetLang, loadAndSeed, isShowAll]);

    // Panel filter — no autoLoad since we manage loading ourselves
    const panelFilter = useMemo(() => ({
        entityType: 'page',
        entityId: pageId,
    }), [pageId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-blue-500" />
                        <T>Batch Page Translation</T>
                        {translatableItems.length > 0 && (
                            <span className="text-xs font-normal text-muted-foreground ml-2">
                                {translatableItems.length} {translate('translatable items')}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Controls bar */}
                <div className="flex items-center gap-3 px-6 py-2 border-b flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground"><T>Source</T>:</span>
                        <Select value={srcLang} onValueChange={setSrcLang}>
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
                        <Select value={targetLang} onValueChange={setTargetLang}>
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <T>All</T>
                                </SelectItem>
                                {TARGET_LANGS.map(lang => (
                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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

                    <div className="border-l h-5 mx-1" />

                    <Button
                        size="sm"
                        onClick={handleTranslateAll}
                        disabled={translating || loading || deleting || isShowAll}
                        className="text-xs"
                    >
                        {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                        <T>Translate All Missing</T>
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteAll}
                        disabled={translating || loading || deleting || isShowAll}
                        className="text-xs text-destructive hover:text-destructive"
                    >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        <T>Delete All Translations</T>
                    </Button>

                    {translating && (
                        <>
                            <Button size="sm" variant="destructive" onClick={handleAbort} className="text-xs">
                                <T>Stop</T>
                            </Button>
                            <div className="flex items-center gap-2">
                                <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} className="w-32 h-2" />
                                <span className="text-xs text-muted-foreground">{progress.done}/{progress.total}</span>
                            </div>
                        </>
                    )}

                    <div className="ml-auto">
                        <Button
                            size="sm"
                            variant={showGlossaryPanel ? 'secondary' : 'ghost'}
                            onClick={() => setShowGlossaryPanel(p => !p)}
                            className="text-xs"
                            title={translate('Glossaries')}
                        >
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Content area: translations + optional glossary panel */}
                <div className="flex-1 min-h-0 flex">
                    {/* Main: Widget Translations */}
                    <div className={`flex-1 min-w-0 overflow-y-auto px-6 pb-6 pt-2 ${showGlossaryPanel ? 'border-r' : ''}`}>
                        <WidgetTranslationPanel
                            ref={panelRef}
                            filter={panelFilter}
                            glossaries={glossaries}
                            autoLoad={false}
                            defaultSourceLang={srcLang}
                            defaultTargetLang={targetLang}
                            compact
                        />
                    </div>

                    {/* Side: Glossary Manager */}
                    {showGlossaryPanel && (
                        <div className="w-[380px] shrink-0 overflow-y-auto p-4">
                            <GlossaryManager
                                defaultSourceLang={srcLang}
                                defaultTargetLang={targetLang}
                                onGlossariesChange={setGlossaries}
                                compact
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
