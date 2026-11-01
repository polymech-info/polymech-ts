import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    translateText, fetchGlossaries, createGlossary, deleteGlossary,
    fetchGlossaryTerms, updateGlossaryTerms,
    TargetLanguageCodeSchema, Glossary,
    WidgetTranslation, fetchWidgetTranslations, fetchTranslationGaps,
} from '@/modules/i18n/client-i18n';
import { WidgetTranslationPanel, type WidgetTranslationPanelHandle } from '@/modules/i18n/WidgetTranslationPanel';
import { getRequestedTerms } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2, Plus, Search, Pencil, Save, X, Languages, Import, ChevronDown, ChevronRight, FileUp, Download, BookPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAppConfig } from '@/hooks/useSystemInfo';

// Safely extract options from ZodUnion of ZodEnums
const TARGET_LANGS = [
    ...TargetLanguageCodeSchema.options[0].options,
    ...TargetLanguageCodeSchema.options[1].options
].sort();

export default function I18nPlayground() {
    const appConfig = useAppConfig();
    const srcLangDefault = appConfig?.i18n?.source_language || 'en';

    // Translation State
    const [srcLang, setSrcLang] = useState(srcLangDefault);
    const [dstLang, setDstLang] = useState('fr');
    const [text, setText] = useState('');
    const [translation, setTranslation] = useState('');
    const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [markdownMode, setMarkdownMode] = useState(false);

    // Glossary State
    const [glossaries, setGlossaries] = useState<Glossary[]>([]);
    const [loadingGlossaries, setLoadingGlossaries] = useState(false);

    // New Glossary State
    const [newGlossaryName, setNewGlossaryName] = useState('');
    const [newGlossarySrc, setNewGlossarySrc] = useState(srcLangDefault);
    const [newGlossaryDst, setNewGlossaryDst] = useState('fr');
    const [newGlossaryEntries, setNewGlossaryEntries] = useState(''); // CSV format: term,translation

    // Glossary Term Editor State
    const [expandedGlossaryId, setExpandedGlossaryId] = useState<string | null>(null);
    const [glossaryTerms, setGlossaryTerms] = useState<Record<string, string>>({});
    const [glossaryTermsOriginal, setGlossaryTermsOriginal] = useState<Record<string, string>>({});
    const [glossaryTermsLoading, setGlossaryTermsLoading] = useState(false);
    const [glossaryTermsSaving, setGlossaryTermsSaving] = useState(false);
    const [newTermKey, setNewTermKey] = useState('');
    const [newTermValue, setNewTermValue] = useState('');

    // Widget Translation State (kept for import-from-i18n feature)
    const [wtList, setWtList] = useState<WidgetTranslation[]>([]);
    const [wtImportTargetLang, setWtImportTargetLang] = useState('de');
    const panelRef = useRef<WidgetTranslationPanelHandle>(null);

    // Missing Translations State
    const [mtEntityType, setMtEntityType] = useState('category');
    const [mtTargetLang, setMtTargetLang] = useState('de');
    const [mtLoading, setMtLoading] = useState(false);
    const [mtIncludeOutdated, setMtIncludeOutdated] = useState(true);

    useEffect(() => {
        loadGlossaries();
    }, []);

    const loadGlossaries = useCallback(async () => {
        setLoadingGlossaries(true);
        try {
            const data = await fetchGlossaries();
            setGlossaries(data);
        } catch (e) {
            toast.error('Failed to load glossaries');
        } finally {
            setLoadingGlossaries(false);
        }
    }, []);

    const handleTranslate = async () => {
        if (!text) return;
        setIsTranslating(true);
        try {
            const res = await translateText(text, srcLang, dstLang, selectedGlossaryId === 'none' ? undefined : selectedGlossaryId, markdownMode ? 'markdown' : 'text');
            setTranslation(res.translation);
        } catch (e) {
            console.error(e);
            toast.error('Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCreateGlossary = async () => {
        if (!newGlossaryName || !newGlossaryEntries) return;

        const entries: Record<string, string> = {};
        newGlossaryEntries.split('\n').forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const term = parts[0].trim();
                const trans = parts.slice(1).join(',').trim();
                if (term && trans) entries[term] = trans;
            }
        });

        if (Object.keys(entries).length === 0) {
            toast.error('No valid entries found');
            return;
        }

        try {
            await createGlossary(newGlossaryName, newGlossarySrc, newGlossaryDst, entries);
            toast.success('Glossary created');
            loadGlossaries();
            setNewGlossaryName('');
            setNewGlossaryEntries('');
        } catch (e: any) {
            toast.error(`Failed to create glossary: ${e.message}`);
        }
    };

    const handleDeleteGlossary = async (id: string) => {
        try {
            await deleteGlossary(id);
            toast.success('Glossary deleted');
            loadGlossaries();
            if (selectedGlossaryId === id) setSelectedGlossaryId('');
        } catch (e) {
            toast.error('Failed to delete glossary');
        }
    };

    // --- Glossary Term Editor Handlers ---

    const toggleGlossaryExpand = async (glossaryId: string) => {
        if (expandedGlossaryId === glossaryId) {
            setExpandedGlossaryId(null);
            return;
        }
        setExpandedGlossaryId(glossaryId);
        setGlossaryTermsLoading(true);
        try {
            const terms = await fetchGlossaryTerms(glossaryId);
            setGlossaryTerms({ ...terms });
            setGlossaryTermsOriginal({ ...terms });
        } catch (e: any) {
            toast.error(`Failed to load terms: ${e.message}`);
        } finally {
            setGlossaryTermsLoading(false);
        }
    };

    const handleTermChange = (oldKey: string, field: 'term' | 'translation', value: string) => {
        setGlossaryTerms(prev => {
            const updated = { ...prev };
            if (field === 'term') {
                const oldVal = updated[oldKey];
                delete updated[oldKey];
                updated[value] = oldVal;
            } else {
                updated[oldKey] = value;
            }
            return updated;
        });
    };

    const handleAddTerm = () => {
        if (!newTermKey.trim()) return;
        setGlossaryTerms(prev => ({ ...prev, [newTermKey.trim()]: newTermValue.trim() }));
        setNewTermKey('');
        setNewTermValue('');
    };

    const handleDeleteTerm = (key: string) => {
        setGlossaryTerms(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const glossaryTermsDirty = useMemo(() => {
        const keys = Object.keys(glossaryTerms);
        const origKeys = Object.keys(glossaryTermsOriginal);
        if (keys.length !== origKeys.length) return true;
        return keys.some(k => glossaryTerms[k] !== glossaryTermsOriginal[k]);
    }, [glossaryTerms, glossaryTermsOriginal]);

    const handleSaveGlossaryTerms = async () => {
        if (!expandedGlossaryId) return;
        setGlossaryTermsSaving(true);
        try {
            const res = await updateGlossaryTerms(expandedGlossaryId, glossaryTerms);
            toast.success(`Saved ${res.entry_count} terms to DeepL + DB`);
            setGlossaryTermsOriginal({ ...glossaryTerms });
            loadGlossaries(); // refresh entry counts
        } catch (e: any) {
            toast.error(`Save failed: ${e.message}`);
        } finally {
            setGlossaryTermsSaving(false);
        }
    };

    // --- Widget Translations Handlers ---

    const handleWtImportFromI18n = async () => {
        const allTerms = getRequestedTerms() as { [lang: string]: Record<string, string> };

        // 1. Fetch existing DB translations for this target lang
        let dbItems: WidgetTranslation[] = [];
        try {
            dbItems = await fetchWidgetTranslations({ targetLang: wtImportTargetLang });
        } catch (e) {
            console.error('Failed to fetch existing translations', e);
        }

        // 2. Build new entries from i18n localStorage
        // Use source language config as key source since it holds ALL keys; look up translations from target lang
        const sourceTerms = allTerms[srcLangDefault] || {};
        const targetTerms = allTerms[wtImportTargetLang] || {};
        const existingKeys = new Set(dbItems.map(wt => wt.prop_path));
        const newEntries: WidgetTranslation[] = Object.entries(sourceTerms)
            .filter(([key]) => !existingKeys.has(key))
            .map(([key, _sourceText], i) => {
                const translated = targetTerms[key];
                const hasTranslation = translated && translated !== key;
                return {
                    id: `local-${Date.now()}-${i}`,
                    entity_type: 'system',
                    entity_id: null,
                    widget_id: null,
                    prop_path: key,
                    source_lang: srcLangDefault,
                    target_lang: wtImportTargetLang,
                    source_text: key,
                    translated_text: hasTranslation ? translated : '',
                    status: hasTranslation ? 'machine' : 'draft',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as WidgetTranslation;
            });

        // 3. Merge: DB items + new i18n items
        const merged = [...dbItems, ...newEntries];
        panelRef.current?.replaceList(merged);
        toast.success(`Showing ${dbItems.length} existing + ${newEntries.length} new ${wtImportTargetLang} terms.`);
    };

    const handleFetchMissing = async () => {
        setMtLoading(true);
        try {
            const missing = await fetchTranslationGaps(mtEntityType, mtTargetLang, undefined, mtIncludeOutdated ? 'all' : 'missing');
            if (missing.length === 0) {
                toast.info(`No missing ${mtEntityType} translations for ${mtTargetLang}`);
                return;
            }
            // Add synthetic IDs so the panel can track them
            const withIds = missing.map((item, i) => ({
                ...item,
                id: `missing-${Date.now()}-${i}`,
            })) as WidgetTranslation[];
            panelRef.current?.replaceList(withIds);
            toast.success(`Found ${withIds.length} missing ${mtEntityType} translations for ${mtTargetLang}`);
        } catch (e: any) {
            toast.error(`Failed: ${e.message}`);
        } finally {
            setMtLoading(false);
        }
    };

    const handleAddToGlossary = useCallback(async (item: WidgetTranslation) => {
        if (!item.source_text || !item.translated_text) return;

        const srcLangUpper = (item.source_lang || 'en').toUpperCase();
        const tgtLangUpper = (item.target_lang || 'en').toUpperCase();

        try {
            // Find matching glossary
            let glossary = glossaries.find(
                g => g.source_lang.toUpperCase() === srcLangUpper && g.target_lang.toUpperCase() === tgtLangUpper
            );

            if (!glossary) {
                // Create a new one
                const name = `Auto ${srcLangUpper}→${tgtLangUpper}`;
                await createGlossary(name, srcLangUpper, tgtLangUpper, {
                    [item.source_text]: item.translated_text,
                });
                await loadGlossaries();
                toast.success(`Created glossary "${name}" with 1 entry`);
                return;
            }

            // Fetch existing terms, merge, update
            const existingTerms = await fetchGlossaryTerms(glossary.glossary_id);
            existingTerms[item.source_text] = item.translated_text;
            await updateGlossaryTerms(glossary.glossary_id, existingTerms);
            await loadGlossaries();
            toast.success(`Added "${item.source_text}" → "${item.translated_text}" to ${glossary.name}`);
        } catch (e: any) {
            toast.error(`Failed to add to glossary: ${e.message}`);
        }
    }, [glossaries, srcLangDefault, loadGlossaries]);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold">i18n / DeepL Playground</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Translation Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Translation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                            <div className="flex-1">
                                <label className="text-sm font-medium">Source Language</label>
                                <Input value={srcLang} onChange={e => setSrcLang(e.target.value)} placeholder="en" />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium">Target Language</label>
                                <Select value={dstLang} onValueChange={setDstLang}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGS.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Glossary (Optional)</label>
                            <Select value={selectedGlossaryId} onValueChange={setSelectedGlossaryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a glossary" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {glossaries
                                        .filter(g => {
                                            const gs = g.source_lang.toLowerCase();
                                            const gt = g.target_lang.toLowerCase();
                                            const sl = srcLang.toLowerCase();
                                            const dl = dstLang.toLowerCase();
                                            return (gs === sl && gt === dl) || (gs === dl && gt === sl);
                                        })
                                        .map(g => (
                                            <SelectItem key={g.glossary_id} value={g.glossary_id}>
                                                {g.name} ({g.source_lang}→{g.target_lang}, {g.entry_count} entries)
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Textarea
                            placeholder={markdownMode ? "Enter markdown to translate...\n# Heading\n\nA **bold** paragraph." : "Enter text to translate..."}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            rows={markdownMode ? 8 : 4}
                        />

                        <div className="flex items-center justify-between">
                            <Button onClick={handleTranslate} disabled={isTranslating || !text}>
                                {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Translate
                            </Button>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                    checked={markdownMode}
                                    onCheckedChange={(v) => setMarkdownMode(!!v)}
                                />
                                <span className="text-sm text-muted-foreground">Markdown</span>
                            </label>
                        </div>

                        {translation && (
                            <div className="p-4 bg-muted rounded-md mt-4">
                                <h3 className="text-sm font-medium mb-1">Result:</h3>
                                {markdownMode ? (
                                    <pre className="text-sm whitespace-pre-wrap font-mono">{translation}</pre>
                                ) : (
                                    <p>{translation}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Glossary Management Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Glossaries</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {loadingGlossaries ? (
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            ) : glossaries.length === 0 ? (
                                <p className="text-muted-foreground text-center">No glossaries found.</p>
                            ) : (
                                glossaries.map(g => {
                                    const isExpanded = expandedGlossaryId === g.glossary_id;
                                    return (
                                        <div key={g.glossary_id} className="border rounded-md overflow-hidden">
                                            <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30" onClick={() => toggleGlossaryExpand(g.glossary_id)}>
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    <div>
                                                        <p className="font-medium">{g.name}</p>
                                                        <p className="text-xs text-muted-foreground">{g.source_lang} -&gt; {g.target_lang} • {g.entry_count} entries</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteGlossary(g.glossary_id); }}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t p-3 space-y-2 bg-muted/10">
                                                    {glossaryTermsLoading ? (
                                                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                                                    ) : (
                                                        <>
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-xs text-muted-foreground">
                                                                        <th className="text-left pb-1 font-medium">Term ({g.source_lang})</th>
                                                                        <th className="text-left pb-1 font-medium">Translation ({g.target_lang})</th>
                                                                        <th className="w-8"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y">
                                                                    {Object.entries(glossaryTerms).map(([term, translation]) => (
                                                                        <tr key={term} className="group">
                                                                            <td className="py-1 pr-1">
                                                                                <Input
                                                                                    value={term}
                                                                                    onChange={e => handleTermChange(term, 'term', e.target.value)}
                                                                                    className="h-7 text-xs"
                                                                                />
                                                                            </td>
                                                                            <td className="py-1 pr-1">
                                                                                <Input
                                                                                    value={translation}
                                                                                    onChange={e => handleTermChange(term, 'translation', e.target.value)}
                                                                                    className="h-7 text-xs"
                                                                                />
                                                                            </td>
                                                                            <td className="py-1">
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTerm(term)}>
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {/* Add new term row */}
                                                                    <tr className="border-t border-dashed">
                                                                        <td className="py-1 pr-1">
                                                                            <Input
                                                                                placeholder="New term..."
                                                                                value={newTermKey}
                                                                                onChange={e => setNewTermKey(e.target.value)}
                                                                                className="h-7 text-xs"
                                                                                onKeyDown={e => e.key === 'Enter' && handleAddTerm()}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1 pr-1">
                                                                            <Input
                                                                                placeholder="Translation..."
                                                                                value={newTermValue}
                                                                                onChange={e => setNewTermValue(e.target.value)}
                                                                                className="h-7 text-xs"
                                                                                onKeyDown={e => e.key === 'Enter' && handleAddTerm()}
                                                                            />
                                                                        </td>
                                                                        <td className="py-1">
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddTerm} disabled={!newTermKey.trim()}>
                                                                                <Plus className="h-3 w-3" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                            <div className="flex items-center justify-between pt-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {Object.keys(glossaryTerms).length} terms
                                                                    {glossaryTermsDirty && <span className="ml-1 text-orange-500">• modified</span>}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={handleSaveGlossaryTerms}
                                                                    disabled={!glossaryTermsDirty || glossaryTermsSaving}
                                                                >
                                                                    {glossaryTermsSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                                                    Save to DeepL
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>


                        <div className="border-t pt-4 space-y-4">
                            <h3 className="text-lg font-medium">Create New Glossary</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Name" value={newGlossaryName} onChange={e => setNewGlossaryName(e.target.value)} />
                                <div className="flex gap-2">
                                    <Input placeholder="Src" value={newGlossarySrc} onChange={e => setNewGlossarySrc(e.target.value)} className="w-16" />
                                    <Input placeholder="Dst" value={newGlossaryDst} onChange={e => setNewGlossaryDst(e.target.value)} className="w-16" />
                                </div>
                            </div>
                            <Textarea
                                placeholder="Entries (term, translation per line)"
                                value={newGlossaryEntries}
                                onChange={e => setNewGlossaryEntries(e.target.value)}
                                rows={3}
                            />
                            <Button onClick={handleCreateGlossary} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Create Glossary
                            </Button>
                        </div>
                    </CardContent >
                </Card >
            </div >

            {/* Widget Translations Section — segmented by task */}
            <Card>
                <CardHeader>
                    <CardTitle>Widget Translations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs defaultValue="db-search" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="db-search" className="text-xs">
                                <Search className="h-3.5 w-3.5 mr-1" /> DB Search
                            </TabsTrigger>
                            <TabsTrigger value="import-i18n" className="text-xs">
                                <Import className="h-3.5 w-3.5 mr-1" /> Import i18n
                            </TabsTrigger>
                            <TabsTrigger value="fetch-missing" className="text-xs">
                                <Download className="h-3.5 w-3.5 mr-1" /> Fetch Missing
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: DB Search — uses panel's built-in filter bar */}
                        <TabsContent value="db-search" className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">
                                Search existing widget translations in the database using the filter bar below.
                            </p>
                        </TabsContent>

                        {/* Tab 2: Import from browser i18n localStorage */}
                        <TabsContent value="import-i18n" className="mt-3">
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                                <span className="text-sm text-muted-foreground shrink-0">Target:</span>
                                <Select value={wtImportTargetLang} onValueChange={setWtImportTargetLang}>
                                    <SelectTrigger className="h-8 w-[80px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGS.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleWtImportFromI18n}
                                >
                                    <Import className="h-4 w-4 mr-1" />
                                    Import from i18n
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Load terms from browser i18n localStorage and merge with DB entries.
                                </span>
                            </div>
                        </TabsContent>

                        {/* Tab 3: Fetch Missing translations from server */}
                        <TabsContent value="fetch-missing" className="mt-3">
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                                <span className="text-sm text-muted-foreground shrink-0">Type:</span>
                                <Select value={mtEntityType} onValueChange={setMtEntityType}>
                                    <SelectTrigger className="h-8 w-[110px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="page">Page</SelectItem>
                                        <SelectItem value="post">Post</SelectItem>
                                        <SelectItem value="type">Type</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground shrink-0">→</span>
                                <Select value={mtTargetLang} onValueChange={setMtTargetLang}>
                                    <SelectTrigger className="h-8 w-[80px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGS.map(lang => (
                                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleFetchMissing}
                                    disabled={mtLoading}
                                >
                                    {mtLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                                    Fetch Missing
                                </Button>
                                <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                                    <Checkbox
                                        checked={mtIncludeOutdated}
                                        onCheckedChange={(v) => setMtIncludeOutdated(!!v)}
                                    />
                                    <span className="text-xs text-muted-foreground">Include outdated</span>
                                </label>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Shared Panel — always visible below the tabs */}
                    <WidgetTranslationPanel
                        ref={panelRef}
                        showFilterBar
                        autoLoad
                        glossaries={glossaries}
                        defaultSourceLang="de"
                        defaultTargetLang="en"
                        onTranslationsChange={setWtList}
                        onAddToGlossary={handleAddToGlossary}
                    />
                </CardContent>
            </Card>
        </div >
    );
}

