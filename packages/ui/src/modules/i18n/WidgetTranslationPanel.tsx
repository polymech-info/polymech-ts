import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef, useRef } from 'react';
import { Loader2, Languages, Trash2, Save, Pencil, X, Search, Plus, FileUp, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { T, translate } from '@/i18n';
import {
    type WidgetTranslation,
    type Glossary,
    TargetLanguageCodeSchema,
} from './client-i18n';
import { useWidgetTranslation, type WidgetTranslationFilter } from './useWidgetTranslation';
import { useAppConfig } from '@/hooks/useSystemInfo';
import { useResizableColumns } from '@/hooks/useResizableColumns';

const TARGET_LANGS = [
    ...TargetLanguageCodeSchema.options[0].options,
    ...TargetLanguageCodeSchema.options[1].options,
].sort();

const STATUSES = ['draft', 'machine', 'reviewed', 'published', 'outdated'] as const;

export interface WidgetTranslationPanelProps {
    /** Pre-set filter for the panel (e.g. entity_type='page', entity_id=pageId) */
    filter?: WidgetTranslationFilter;
    /** External glossaries list for batch translate dropdown */
    glossaries?: Glossary[];
    /** Whether to show filter bar (entity type, entity ID, widget ID inputs) */
    showFilterBar?: boolean;
    /** Auto-load on mount */
    autoLoad?: boolean;
    /** Default source language */
    defaultSourceLang?: string;
    /** Default target language */
    defaultTargetLang?: string;
    /** Compact mode for embedding in dialogs */
    compact?: boolean;
    /** Callback when translations change */
    onTranslationsChange?: (translations: WidgetTranslation[]) => void;
    /** Increment to trigger a reload */
    refreshKey?: number;
    /** Callback when user clicks "Add to Glossary" on a row */
    onAddToGlossary?: (item: WidgetTranslation) => void;
    /** Unique ID for localStorage column-width persistence (default: '0') */
    persistId?: string;
}

export interface WidgetTranslationPanelHandle {
    replaceList: (items: import('./client-i18n').WidgetTranslation[]) => void;
}

export const WidgetTranslationPanel = React.memo(forwardRef<WidgetTranslationPanelHandle, WidgetTranslationPanelProps>(({
    filter: externalFilter,
    glossaries = [],
    showFilterBar = false,
    autoLoad = true,
    defaultSourceLang: defaultSourceLangProp,
    defaultTargetLang: defaultTargetLangProp,
    compact = false,
    onTranslationsChange,
    refreshKey,
    onAddToGlossary,
    persistId = '0',
}, ref) => {
    const appConfig = useAppConfig();
    const srcLangDefault = appConfig?.i18n?.source_language || 'en';
    const defaultSourceLang = defaultSourceLangProp || srcLangDefault;
    const defaultTargetLang = defaultTargetLangProp || 'de';

    const wt = useWidgetTranslation({
        filter: externalFilter,
        autoLoad,
        defaultSourceLang,
        defaultTargetLang,
    });

    useImperativeHandle(ref, () => ({
        replaceList: (items) => wt.setWtList(items),
    }), [wt.setWtList]);

    const [wtCreating, setWtCreating] = useState(false);
    const [wtShowMissing, setWtShowMissing] = useState(false);
    const [wtSearchText, setWtSearchText] = useState('');
    const [wtBatchGlossaryId, setWtBatchGlossaryId] = useState<string>('none');

    // Resizable columns — persisted to localStorage
    const colStorageKey = useMemo(() => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        return `col-sizes-${path}-${persistId}`;
    }, [persistId]);

    const { getColStyle, getResizeHandleProps } = useResizableColumns({
        columns: [
            { key: 'checkbox', defaultWidth: 32, resizable: false },
            { key: 'key', defaultWidth: 150 },
            { key: 'source', defaultWidth: 0 },
            { key: 'translation', defaultWidth: 0 },
            { key: 'status', defaultWidth: 96, resizable: false },
            { key: 'actions', defaultWidth: 80, resizable: false },
        ],
        storageKey: colStorageKey,
    });

    // Local filter state (only used when showFilterBar is true)
    const [localEntityType, setLocalEntityType] = useState(externalFilter?.entityType || 'all');
    const [localEntityId, setLocalEntityId] = useState(externalFilter?.entityId || '');
    const [localWidgetId, setLocalWidgetId] = useState(externalFilter?.widgetId || '');
    const [localTargetLang, setLocalTargetLang] = useState(externalFilter?.targetLang || 'all');

    // Sync external filter changes
    useEffect(() => {
        if (externalFilter) {
            wt.setFilter(externalFilter);
            wt.loadWidgetTranslations(externalFilter);
        }
    }, [externalFilter?.entityType, externalFilter?.entityId, externalFilter?.widgetId, externalFilter?.targetLang]);

    // Notify parent of changes
    useEffect(() => {
        onTranslationsChange?.(wt.wtList);
    }, [wt.wtList]);

    // Reload when refreshKey changes
    useEffect(() => {
        if (refreshKey !== undefined && refreshKey > 0) {
            wt.loadWidgetTranslations(externalFilter);
        }
    }, [refreshKey]);

    const handleSearch = () => {
        const f: WidgetTranslationFilter = {};
        if (localEntityType && localEntityType !== 'all') f.entityType = localEntityType;
        if (localEntityId) f.entityId = localEntityId;
        if (localWidgetId) f.widgetId = localWidgetId;
        if (localTargetLang && localTargetLang !== 'all') f.targetLang = localTargetLang;
        wt.setFilter(f);
        wt.loadWidgetTranslations(f);
    };

    const filteredList = useMemo(() => {
        let list = wtShowMissing ? wt.wtList.filter(item => !item.translated_text) : wt.wtList;
        if (wtSearchText) {
            const q = wtSearchText.toLowerCase();
            list = list.filter(item =>
                (item.source_text || '').toLowerCase().includes(q) ||
                (item.translated_text || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [wt.wtList, wtShowMissing, wtSearchText]);

    const stats = useMemo(() => {
        let missingSelected = 0;
        let translatedSelected = 0;
        let modifiedSelected = 0;

        let missingTotal = 0;
        let translatedTotal = 0;
        let modifiedTotal = 0;

        for (const item of wt.wtList) {
            const isMissing = !!(item.source_text && !item.translated_text);
            const isTranslated = !!item.translated_text;
            const isModified = wt.wtModifiedIds.has(item.id);
            const isSelected = wt.wtSelectedIds.has(item.id);

            if (isMissing) missingTotal++;
            if (isTranslated) translatedTotal++;
            if (isModified) modifiedTotal++;

            if (isSelected) {
                if (isMissing) missingSelected++;
                if (isTranslated) translatedSelected++;
                if (isModified) modifiedSelected++;
            }
        }
        return {
            missingSelected, translatedSelected, modifiedSelected,
            missingTotal, translatedTotal, modifiedTotal
        };
    }, [wt.wtList, wt.wtSelectedIds, wt.wtModifiedIds]);

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            {showFilterBar && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Select value={localEntityType} onValueChange={setLocalEntityType}>
                        <SelectTrigger><SelectValue placeholder={translate("Entity type")} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all"><T>All types</T></SelectItem>
                            {['page', 'post', 'system', 'collection'].map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input placeholder={translate("Entity ID")} value={localEntityId} onChange={e => setLocalEntityId(e.target.value)} />
                    <Input placeholder={translate("Widget ID")} value={localWidgetId} onChange={e => setLocalWidgetId(e.target.value)} />
                    <Select value={localTargetLang} onValueChange={setLocalTargetLang}>
                        <SelectTrigger><SelectValue placeholder={translate("Target lang")} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all"><T>All langs</T></SelectItem>
                            {TARGET_LANGS.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                        <Button onClick={handleSearch} disabled={wt.wtLoading} className="flex-1">
                            {wt.wtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-1"><T>Search</T></span>
                        </Button>
                        {localEntityType && localEntityId && (
                            <Button variant="destructive" size="icon" onClick={() => wt.handleWtDeleteByEntity()} title={translate("Delete all for this entity")}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Batch Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{wt.wtList.length} <T>entries</T></span>
                <Button
                    size="sm"
                    variant={wtShowMissing ? 'default' : 'outline'}
                    onClick={() => setWtShowMissing(!wtShowMissing)}
                >
                    {wtShowMissing ? translate('Showing missing only') : translate('Show missing')}
                </Button>

                {stats.missingTotal > 0 && (
                    <>
                        {glossaries.length > 0 && (
                            <Select value={wtBatchGlossaryId} onValueChange={setWtBatchGlossaryId}>
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder={translate("Glossary")} />
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
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => wt.handleWtBatchTranslate(wtBatchGlossaryId)}
                            disabled={wt.wtBatchTranslating || (wt.wtSelectedIds.size > 0 && stats.missingSelected === 0)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        >
                            {wt.wtBatchTranslating
                                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {wt.wtBatchProgress.done}/{wt.wtBatchProgress.total}</>
                                : <><Languages className="h-4 w-4 mr-1" /> <T>Translate</T> {wt.wtSelectedIds.size > 0 ? `(${stats.missingSelected})` : `${translate('All Missing')} (${stats.missingTotal})`}</>
                            }
                        </Button>
                    </>
                )}

                <Button
                    size="sm"
                    variant="outline"
                    onClick={wt.handleWtSaveToDB}
                    disabled={wt.wtSavingToDB || stats.modifiedTotal === 0 || (wt.wtSelectedIds.size > 0 && stats.modifiedSelected === 0)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/30"
                    title={translate("Save translated entries to database")}
                >
                    {wt.wtSavingToDB ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    <T>Save to DB</T> {wt.wtSelectedIds.size > 0 ? (stats.modifiedSelected > 0 ? `(${stats.modifiedSelected})` : '') : (stats.modifiedTotal > 0 ? `(${stats.modifiedTotal})` : '')}
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={wt.handleUpdateI18n}
                    disabled={wt.wtUpdatingI18n || (wt.wtSelectedIds.size > 0 ? stats.translatedSelected === 0 : stats.modifiedTotal === 0)}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/30"
                    title={translate("Merge translations into i18n files")}
                >
                    {wt.wtUpdatingI18n ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileUp className="h-4 w-4 mr-1" />}
                    <T>Update i18n</T> {wt.wtSelectedIds.size > 0 ? `(${stats.translatedSelected})` : (stats.modifiedTotal > 0 ? `(${stats.modifiedTotal})` : '')}
                </Button>

                <Button size="sm" variant={wtCreating ? 'secondary' : 'default'} onClick={() => { wt.resetWtForm(); setWtCreating(!wtCreating); }}>
                    {wtCreating ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    {wtCreating ? translate('Cancel') : translate('New')}
                </Button>

                {(wtShowMissing || wt.wtBatchTranslating) && (
                    <span className="text-xs text-muted-foreground">
                        {wt.wtList.filter(item => !item.translated_text).length} of {wt.wtList.length} <T>missing</T>
                    </span>
                )}
            </div>

            {/* Search within results */}
            {wt.wtList.length > 0 && (
                <Input
                    placeholder={translate("Search source or translation...")}
                    value={wtSearchText}
                    onChange={e => setWtSearchText(e.target.value)}
                    className="max-w-sm"
                />
            )}

            {/* Table */}
            {wt.wtLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : wt.wtList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <T>No widget translations found.</T>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={getColStyle('checkbox')} />
                            <col style={getColStyle('key')} />
                            <col style={getColStyle('source')} />
                            <col style={getColStyle('translation')} />
                            <col style={getColStyle('status')} />
                            <col style={getColStyle('actions')} />
                        </colgroup>
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-2 py-2">
                                    <Checkbox
                                        checked={filteredList.length > 0 && filteredList.every(item => wt.wtSelectedIds.has(item.id))}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                wt.setWtSelectedIds(prev => {
                                                    const next = new Set(prev);
                                                    filteredList.forEach(item => next.add(item.id));
                                                    return next;
                                                });
                                            } else {
                                                wt.setWtSelectedIds(prev => {
                                                    const next = new Set(prev);
                                                    filteredList.forEach(item => next.delete(item.id));
                                                    return next;
                                                });
                                            }
                                        }}
                                    />
                                </th>
                                <th className="text-left px-2 py-2 font-medium text-muted-foreground relative">
                                    <T>Key</T>
                                    {(() => { const h = getResizeHandleProps('key'); return h ? <div {...h} /> : null; })()}
                                </th>
                                <th className="text-left px-2 py-2 font-medium text-muted-foreground relative">
                                    <T>Source</T>
                                    {(() => { const h = getResizeHandleProps('source'); return h ? <div {...h} /> : null; })()}
                                </th>
                                <th className="text-left px-2 py-2 font-medium text-muted-foreground relative">
                                    <T>Translation</T>
                                    {(() => { const h = getResizeHandleProps('translation'); return h ? <div {...h} /> : null; })()}
                                </th>
                                <th className="text-center px-2 py-2 font-medium text-muted-foreground"><T>Status</T></th>
                                <th className="text-right px-2 py-2 font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredList.map(item => {
                                const isEditing = wt.wtEditing === item.id;
                                return (
                                    <tr
                                        key={item.id}
                                        className={`group transition-colors ${isEditing ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : 'hover:bg-muted/30'} ${wt.wtSelectedIds.has(item.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-2 py-2.5 align-top">
                                            <Checkbox
                                                checked={wt.wtSelectedIds.has(item.id)}
                                                onCheckedChange={(checked) => {
                                                    wt.setWtSelectedIds(prev => {
                                                        const next = new Set(prev);
                                                        if (checked) next.add(item.id);
                                                        else next.delete(item.id);
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-2.5 align-top overflow-hidden">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${item.entity_type === 'system' ? 'bg-purple-500' :
                                                        item.entity_type === 'page' ? 'bg-blue-500' :
                                                            item.entity_type === 'category' ? 'bg-green-500' :
                                                                item.entity_type === 'post' ? 'bg-orange-500' : 'bg-gray-400'
                                                        }`} />
                                                    <span className="font-medium text-xs">{item.entity_type}</span>
                                                </div>
                                                {item.widget_id && (
                                                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]" title={item.widget_id}>
                                                        {item.widget_id}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-muted-foreground/70">.{item.prop_path}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2.5 align-top">
                                            <div className="flex items-start gap-1.5">
                                                <span className="shrink-0 text-[10px] font-bold uppercase bg-muted px-1 py-0.5 rounded mt-0.5">{isEditing ? wt.wtForm.source_lang : item.source_lang}</span>
                                                <span className="text-foreground/80 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">{(isEditing ? wt.wtForm.source_text : item.source_text) || <span className="italic text-muted-foreground"><T>empty</T></span>}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2.5 align-top">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="shrink-0 text-[10px] font-bold uppercase bg-primary/10 text-primary px-1 py-0.5 rounded w-fit">{wt.wtForm.target_lang}</span>
                                                    <Textarea
                                                        value={wt.wtForm.translated_text || ''}
                                                        onChange={e => wt.setWtForm(f => ({ ...f, translated_text: e.target.value }))}
                                                        rows={3}
                                                        className="text-sm min-h-[3rem] resize-y font-medium"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-1.5">
                                                    <span className="shrink-0 text-[10px] font-bold uppercase bg-primary/10 text-primary px-1 py-0.5 rounded mt-0.5">{item.target_lang}</span>
                                                    <span className="font-medium text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">{item.translated_text || <span className="italic text-muted-foreground"><T>empty</T></span>}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-2.5 align-top text-center">
                                            {isEditing ? (
                                                <Select value={wt.wtForm.status || 'machine'} onValueChange={v => wt.setWtForm(f => ({ ...f, status: v as any }))}>
                                                    <SelectTrigger className="h-7 text-xs w-[90px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent align="end">
                                                        {STATUSES.map(s => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${item.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                                    item.status === 'reviewed' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' :
                                                        item.status === 'machine' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                                            item.status === 'outdated' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>{item.status}</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-2.5 align-top text-right relative z-10">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                        onClick={wt.handleWtUpsert} disabled={wt.wtSaving} title={translate("Save")}
                                                    >
                                                        {wt.wtSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                        onClick={() => wt.handleWtTranslate()} disabled={wt.wtTranslating || !wt.wtForm.source_text}
                                                        title={translate("Translate via DeepL")}
                                                    >
                                                        {wt.wtTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={wt.resetWtForm} title={translate("Cancel")}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wt.handleWtEdit(item)} title={translate("Edit")}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {onAddToGlossary && item.source_text && item.translated_text && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => onAddToGlossary(item)} title={translate("Add to Glossary")}>
                                                            <BookPlus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => wt.handleWtDelete(item.id)} title={translate("Delete")}>
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create New Translation Form */}
            {wtCreating && (
                <div className="border-t pt-4 space-y-4">
                    <h3 className="text-lg font-medium"><T>Create Widget Translation</T></h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Select value={wt.wtForm.entity_type || 'page'} onValueChange={v => wt.setWtForm(f => ({ ...f, entity_type: v }))}>
                            <SelectTrigger><SelectValue placeholder={translate("Entity type")} /></SelectTrigger>
                            <SelectContent>
                                {['page', 'post', 'system', 'collection'].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input placeholder={translate("Entity ID")} value={wt.wtForm.entity_id || ''} onChange={e => wt.setWtForm(f => ({ ...f, entity_id: e.target.value || null }))} />
                        <Input placeholder={translate("Widget ID")} value={wt.wtForm.widget_id || ''} onChange={e => wt.setWtForm(f => ({ ...f, widget_id: e.target.value || null }))} />
                        <Input placeholder={translate("Prop path")} value={wt.wtForm.prop_path || ''} onChange={e => wt.setWtForm(f => ({ ...f, prop_path: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Input placeholder={translate("Source lang")} value={wt.wtForm.source_lang} onChange={e => wt.setWtForm(f => ({ ...f, source_lang: e.target.value }))} />
                        <Select value={wt.wtForm.target_lang} onValueChange={v => wt.setWtForm(f => ({ ...f, target_lang: v }))}>
                            <SelectTrigger><SelectValue placeholder={translate("Target lang")} /></SelectTrigger>
                            <SelectContent>
                                {TARGET_LANGS.map(lang => (
                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={wt.wtForm.status || 'machine'} onValueChange={v => wt.setWtForm(f => ({ ...f, status: v as any }))}>
                            <SelectTrigger><SelectValue placeholder={translate("Status")} /></SelectTrigger>
                            <SelectContent>
                                {STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Textarea
                            placeholder={translate("Source text")}
                            value={wt.wtForm.source_text || ''}
                            onChange={e => wt.setWtForm(f => ({ ...f, source_text: e.target.value }))}
                            rows={3}
                        />
                        <div className="relative">
                            <Textarea
                                placeholder={translate("Translated text")}
                                value={wt.wtForm.translated_text || ''}
                                onChange={e => wt.setWtForm(f => ({ ...f, translated_text: e.target.value }))}
                                rows={3}
                            />
                            <Button
                                variant="ghost" size="sm"
                                className="absolute top-1 right-1 h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                onClick={() => wt.handleWtTranslate()}
                                disabled={wt.wtTranslating || !wt.wtForm.source_text}
                                title={translate("Translate via DeepL")}
                            >
                                {wt.wtTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                                DeepL
                            </Button>
                        </div>
                    </div>
                    <Button onClick={wt.handleWtUpsert} disabled={wt.wtSaving} className="w-full">
                        {wt.wtSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        <T>Create Translation</T>
                    </Button>
                </div>
            )}
        </div>
    );
}));
