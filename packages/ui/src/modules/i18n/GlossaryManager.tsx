import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Plus, Save, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { T, translate } from '@/i18n';
import {
    type Glossary,
    fetchGlossaries,
    createGlossary,
    deleteGlossary,
    fetchGlossaryTerms,
    updateGlossaryTerms,
} from './client-i18n';
import { toast } from 'sonner';

export interface GlossaryManagerProps {
    /** Default source language */
    defaultSourceLang?: string;
    /** Default target language */
    defaultTargetLang?: string;
    /** Callback when glossaries change (created/deleted) */
    onGlossariesChange?: (glossaries: Glossary[]) => void;
    /** Compact mode — smaller text, less padding */
    compact?: boolean;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
    defaultSourceLang = 'en',
    defaultTargetLang = 'fr',
    onGlossariesChange,
    compact = false,
}) => {
    // Glossary list
    const [glossaries, setGlossaries] = useState<Glossary[]>([]);
    const [loading, setLoading] = useState(false);

    // Create form
    const [newName, setNewName] = useState('');
    const [newSrc, setNewSrc] = useState(defaultSourceLang);
    const [newDst, setNewDst] = useState(defaultTargetLang);
    const [newEntries, setNewEntries] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    // Term editor
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [terms, setTerms] = useState<Record<string, string>>({});
    const [termsOriginal, setTermsOriginal] = useState<Record<string, string>>({});
    const [termsLoading, setTermsLoading] = useState(false);
    const [termsSaving, setTermsSaving] = useState(false);
    const [newTermKey, setNewTermKey] = useState('');
    const [newTermValue, setNewTermValue] = useState('');

    const loadGlossaries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchGlossaries();
            setGlossaries(data);
            onGlossariesChange?.(data);
        } catch {
            toast.error(translate('Failed to load glossaries'));
        } finally {
            setLoading(false);
        }
    }, [onGlossariesChange]);

    useEffect(() => { loadGlossaries(); }, []);

    const handleCreate = async () => {
        if (!newName || !newEntries) return;

        const entries: Record<string, string> = {};
        newEntries.split('\n').forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const term = parts[0].trim();
                const trans = parts.slice(1).join(',').trim();
                if (term && trans) entries[term] = trans;
            }
        });

        if (Object.keys(entries).length === 0) {
            toast.error(translate('No valid entries found'));
            return;
        }

        try {
            await createGlossary(newName, newSrc, newDst, entries);
            toast.success(translate('Glossary created'));
            loadGlossaries();
            setNewName('');
            setNewEntries('');
            setShowCreate(false);
        } catch (e: any) {
            toast.error(`${translate('Failed to create glossary')}: ${e.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGlossary(id);
            toast.success(translate('Glossary deleted'));
            if (expandedId === id) setExpandedId(null);
            loadGlossaries();
        } catch {
            toast.error(translate('Failed to delete glossary'));
        }
    };

    const toggleExpand = async (glossaryId: string) => {
        if (expandedId === glossaryId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(glossaryId);
        setTermsLoading(true);
        try {
            const data = await fetchGlossaryTerms(glossaryId);
            setTerms({ ...data });
            setTermsOriginal({ ...data });
        } catch (e: any) {
            toast.error(`${translate('Failed to load terms')}: ${e.message}`);
        } finally {
            setTermsLoading(false);
        }
    };

    const handleTermChange = (oldKey: string, field: 'term' | 'translation', value: string) => {
        setTerms(prev => {
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
        setTerms(prev => ({ ...prev, [newTermKey.trim()]: newTermValue.trim() }));
        setNewTermKey('');
        setNewTermValue('');
    };

    const handleDeleteTerm = (key: string) => {
        setTerms(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const termsDirty = (() => {
        const keys = Object.keys(terms);
        const origKeys = Object.keys(termsOriginal);
        if (keys.length !== origKeys.length) return true;
        return keys.some(k => terms[k] !== termsOriginal[k]);
    })();

    const handleSaveTerms = async () => {
        if (!expandedId) return;
        setTermsSaving(true);
        try {
            const res = await updateGlossaryTerms(expandedId, terms);
            toast.success(`${translate('Saved')} ${res.entry_count} ${translate('terms to DeepL + DB')}`);
            setTermsOriginal({ ...terms });
            loadGlossaries();
        } catch (e: any) {
            toast.error(`${translate('Save failed')}: ${e.message}`);
        } finally {
            setTermsSaving(false);
        }
    };

    const sz = compact ? 'text-xs' : 'text-sm';

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}><T>Glossaries</T></h3>
                <Button size="sm" variant={showCreate ? 'secondary' : 'outline'} onClick={() => setShowCreate(!showCreate)} className="text-xs">
                    {showCreate ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                    {showCreate ? translate('Cancel') : translate('New')}
                </Button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Input placeholder={translate('Name')} value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-xs" />
                        <div className="flex gap-1">
                            <Input placeholder="Src" value={newSrc} onChange={e => setNewSrc(e.target.value)} className="w-14 h-8 text-xs" />
                            <Input placeholder="Dst" value={newDst} onChange={e => setNewDst(e.target.value)} className="w-14 h-8 text-xs" />
                        </div>
                    </div>
                    <Textarea
                        placeholder={translate('Entries (term, translation per line)')}
                        value={newEntries}
                        onChange={e => setNewEntries(e.target.value)}
                        rows={3}
                        className="text-xs"
                    />
                    <Button onClick={handleCreate} className="w-full h-8 text-xs" disabled={!newName || !newEntries}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> <T>Create Glossary</T>
                    </Button>
                </div>
            )}

            {/* List */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : glossaries.length === 0 ? (
                    <p className="text-center text-muted-foreground text-xs py-4"><T>No glossaries found.</T></p>
                ) : (
                    glossaries.map(g => {
                        const isExpanded = expandedId === g.glossary_id;
                        return (
                            <div key={g.glossary_id} className="border rounded-md overflow-hidden">
                                <div
                                    className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-muted/30"
                                    onClick={() => toggleExpand(g.glossary_id)}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                        <div className="min-w-0">
                                            <p className={`font-medium truncate ${sz}`}>{g.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{g.source_lang} → {g.target_lang} • {g.entry_count} <T>entries</T></p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); handleDelete(g.glossary_id); }}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                </div>

                                {isExpanded && (
                                    <div className="border-t p-2 space-y-2 bg-muted/10">
                                        {termsLoading ? (
                                            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                        ) : (
                                            <>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-[10px] text-muted-foreground">
                                                            <th className="text-left pb-1 font-medium"><T>Term</T> ({g.source_lang})</th>
                                                            <th className="text-left pb-1 font-medium"><T>Translation</T> ({g.target_lang})</th>
                                                            <th className="w-7"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {Object.entries(terms).map(([term, translation]) => (
                                                            <tr key={term} className="group">
                                                                <td className="py-0.5 pr-1">
                                                                    <Input value={term} onChange={e => handleTermChange(term, 'term', e.target.value)} className="h-7 text-xs" />
                                                                </td>
                                                                <td className="py-0.5 pr-1">
                                                                    <Input value={translation} onChange={e => handleTermChange(term, 'translation', e.target.value)} className="h-7 text-xs" />
                                                                </td>
                                                                <td className="py-0.5">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTerm(term)}>
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="border-t border-dashed">
                                                            <td className="py-0.5 pr-1">
                                                                <Input
                                                                    placeholder={translate('New term...')}
                                                                    value={newTermKey}
                                                                    onChange={e => setNewTermKey(e.target.value)}
                                                                    className="h-7 text-xs"
                                                                    onKeyDown={e => e.key === 'Enter' && handleAddTerm()}
                                                                />
                                                            </td>
                                                            <td className="py-0.5 pr-1">
                                                                <Input
                                                                    placeholder={translate('Translation...')}
                                                                    value={newTermValue}
                                                                    onChange={e => setNewTermValue(e.target.value)}
                                                                    className="h-7 text-xs"
                                                                    onKeyDown={e => e.key === 'Enter' && handleAddTerm()}
                                                                />
                                                            </td>
                                                            <td className="py-0.5">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddTerm} disabled={!newTermKey.trim()}>
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {Object.keys(terms).length} {translate('terms')}
                                                        {termsDirty && <span className="ml-1 text-orange-500">• {translate('modified')}</span>}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={handleSaveTerms}
                                                        disabled={!termsDirty || termsSaving}
                                                    >
                                                        {termsSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                                                        <T>Save to DeepL</T>
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
        </div>
    );
};
