import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Type as TypeIcon, Hash, ToggleLeft, Trash2, Lock, Plus, Import, Download, ChevronDown, ChevronRight, Copy, FileJson, Braces, Home, List, Code, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { T, translate } from '@/i18n';
import { JSONTreeWalker } from '@/components/json';

export interface VariableElement {
    id: string;
    type: 'string' | 'number' | 'boolean' | 'secret' | 'json';
    key: string;
    value: string;
    description?: string;
    isInherited?: boolean;
    inheritedValue?: string;
}

const PaletteItem = ({ type, label, onClick }: { type: string; label: string; onClick: () => void }) => {
    const Icon = getIconForType(type);

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
            <Plus className="h-3 w-3 text-muted-foreground ml-1" />
        </button>
    );
};

const CanvasElement = ({
    element,
    isSelected,
    onSelect,
    onDelete,
    onChange,
    variableSchema
}: {
    element: VariableElement,
    isSelected: boolean,
    onSelect: () => void,
    onDelete: () => void,
    onChange: (updates: Partial<VariableElement>) => void,
    variableSchema?: Record<string, { label: string, description?: string }>
}) => {
    const Icon = getIconForType(element.type);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const schema = variableSchema?.[element.key];

    return (
        <div
            data-var-id={element.id}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`p-3 border rounded-md mb-2 cursor-pointer flex items-center justify-between group ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50 bg-background'}`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate" title={schema?.description || element.key}>
                        {schema?.label || element.key || translate('New Variable')}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-muted px-1 rounded">{element.type}</span>
                        <span className="text-xs text-muted-foreground truncate opacity-70">
                            {element.type === 'secret' ? '••••••••' : (element.value || translate('(empty)'))}
                        </span>
                        {element.isInherited && (
                            <span className="text-xs text-blue-500 bg-blue-500/10 px-1 rounded ml-1 border border-blue-500/20">
                                <T>Inherited</T>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle><T>Delete Variable?</T></AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete variable "{element.key}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                    setShowDeleteDialog(false);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                <T>Delete</T>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

function getIconForType(type: string) {
    switch (type) {
        case 'string': return TypeIcon;
        case 'number': return Hash;
        case 'boolean': return ToggleLeft;
        case 'secret': return Lock;
        case 'json': return Braces;
        default: return TypeIcon;
    }
}


export const VariableBuilder = ({
    initialData,
    inheritedData = {},
    onSave,
    isSaving,
    variableSchema
}: {
    initialData: Record<string, any>,
    inheritedData?: Record<string, any>,
    onSave: (data: Record<string, any>) => void,
    isSaving?: boolean,
    variableSchema?: Record<string, { label: string, description?: string }>
}) => {
    const [elements, setElements] = useState<VariableElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Load initial data
    useEffect(() => {
        const initialElements: VariableElement[] = [];

        // 1. Local Variables
        Object.entries(initialData || {}).forEach(([key, rawValue]) => {
            let type: VariableElement['type'] = 'string';
            let value: string;

            if (rawValue !== null && typeof rawValue === 'object') {
                type = 'json';
                value = JSON.stringify(rawValue, null, 2);
            } else if (typeof rawValue === 'boolean') {
                type = 'boolean';
                value = String(rawValue);
            } else if (typeof rawValue === 'number') {
                type = 'number';
                value = String(rawValue);
            } else {
                value = String(rawValue ?? '');
                if (value === 'true' || value === 'false') type = 'boolean';
                else if (!isNaN(Number(value)) && value.trim() !== '') type = 'number';
            }

            if (/SECRET|KEY|TOKEN|PASSWORD|PASS/i.test(key)) type = 'secret';

            initialElements.push({ id: `var-${key}`, key, value, type, isInherited: false });
        });

        // 2. Inherited Variables
        Object.entries(inheritedData || {}).forEach(([key, rawValue]) => {
            if (!(key in (initialData || {}))) {
                let type: VariableElement['type'] = 'string';
                let value: string;

                if (rawValue !== null && typeof rawValue === 'object') {
                    type = 'json';
                    value = JSON.stringify(rawValue, null, 2);
                } else if (typeof rawValue === 'boolean') {
                    type = 'boolean';
                    value = String(rawValue);
                } else if (typeof rawValue === 'number') {
                    type = 'number';
                    value = String(rawValue);
                } else {
                    value = String(rawValue ?? '');
                    if (value === 'true' || value === 'false') type = 'boolean';
                    else if (!isNaN(Number(value)) && value.trim() !== '') type = 'number';
                }

                if (/SECRET|KEY|TOKEN|PASSWORD|PASS/i.test(key)) type = 'secret';

                initialElements.push({ 
                    id: `inherited-${key}`, 
                    key, 
                    value, 
                    type, 
                    isInherited: true,
                    inheritedValue: value
                });
            }
        });

        setElements(initialElements);
    }, [initialData, inheritedData]);

    const handleAddVariable = (type: VariableElement['type']) => {
        const id = `new-${Date.now()}`;
        const newElement: VariableElement = {
            id,
            type,
            key: `NEW_VARIABLE_${elements.length + 1}`,
            value: type === 'boolean' ? 'false' : type === 'json' ? '{}' : '',
        };
        setElements([...elements, newElement]);
        setSelectedId(id);
    };

    const selectedElement = elements.find(e => e.id === selectedId);

    const updateSelectedElement = (updates: Partial<VariableElement>) => {
        if (!selectedId) return;
        setElements(prev => prev.map(e => e.id === selectedId ? { ...e, ...updates } : e));
    };

    const handleSave = () => {
        const result: Record<string, any> = {};
        elements.forEach(el => {
            if (el.key) {
                // If the element is inherited and unchanged, skip saving it to local
                if (el.isInherited && String(el.value) === String(el.inheritedValue)) {
                    return;
                }

                let val: any = el.value;
                if (el.type === 'boolean') {
                    val = el.value === 'true';
                } else if (el.type === 'number') {
                    const num = Number(el.value);
                    if (!isNaN(num) && String(el.value).trim() !== '') {
                        val = num;
                    }
                } else if (el.type === 'json') {
                    try {
                        val = JSON.parse(el.value);
                    } catch {
                        // Keep as string if invalid JSON
                    }
                }
                result[el.key] = val;
            }
        });
        onSave(result);
    };

    // Check for duplicate keys
    const duplicateKeys = new Set<string>();
    const keyCounts = new Map<string, number>();
    elements.forEach(e => {
        const k = e.key.trim();
        keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
    });
    keyCounts.forEach((count, key) => {
        if (count > 1) duplicateKeys.add(key);
    });

    return (
        <VariableBuilderContent
            elements={elements}
            setElements={setElements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSaving={isSaving}
            handleSave={handleSave}
            duplicateKeys={duplicateKeys}
            selectedElement={selectedElement}
            updateSelectedElement={updateSelectedElement}
            onAddVariable={handleAddVariable}
            variableSchema={variableSchema}
        />
    );
};

// Inner component
const VariableBuilderContent = ({
    elements,
    setElements,
    selectedId,
    setSelectedId,
    searchTerm,
    setSearchTerm,
    isSaving,
    handleSave,
    duplicateKeys,
    selectedElement,
    updateSelectedElement,
    onAddVariable,
    variableSchema
}: {
    elements: VariableElement[],
    setElements: React.Dispatch<React.SetStateAction<VariableElement[]>>,
    selectedId: string | null,
    setSelectedId: (id: string | null) => void,
    searchTerm: string,
    setSearchTerm: (s: string) => void,
    isSaving?: boolean,
    handleSave: () => void,
    duplicateKeys: Set<string>,
    selectedElement?: VariableElement,
    updateSelectedElement: (u: Partial<VariableElement>) => void,
    onAddVariable: (type: VariableElement['type']) => void,
    variableSchema?: Record<string, { label: string, description?: string }>
}) => {
    const [importJson, setImportJson] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [viewMode, setViewMode] = useState<'visual' | 'plain'>('visual');
    const [plainJson, setPlainJson] = useState('');

    // --- Finder-style navigation state ---
    const [navRootId, setNavRootId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const keyNameRef = useRef<HTMLInputElement>(null);

    const filteredElements = elements.filter(e =>
        e.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navRootElement = navRootId ? elements.find(e => e.id === navRootId) : null;

    // Keyboard handler for root variable list
    useEffect(() => {
        const el = canvasRef.current;
        if (!el || navRootId) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const items = filteredElements;
            const currentIdx = items.findIndex(i => i.id === selectedId);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length === 0) return;
                const next = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, items.length - 1);
                setSelectedId(items[next].id);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length === 0) return;
                const prev = currentIdx <= 0 ? 0 : currentIdx - 1;
                setSelectedId(items[prev].id);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const sel = items.find(i => i.id === selectedId);
                if (sel?.type === 'json') {
                    setNavRootId(sel.id);
                }
            } else if (e.key === 'Home') {
                e.preventDefault();
                if (items.length > 0) setSelectedId(items[0].id);
            } else if (e.key === 'End') {
                e.preventDefault();
                if (items.length > 0) setSelectedId(items[items.length - 1].id);
            } else if (e.key === 'F2') {
                e.preventDefault();
                requestAnimationFrame(() => {
                    keyNameRef.current?.focus();
                    keyNameRef.current?.select();
                });
            }
        };
        el.addEventListener('keydown', handleKeyDown);
        return () => el.removeEventListener('keydown', handleKeyDown);
    }, [navRootId, filteredElements, selectedId, setSelectedId]);

    // Keep scroll in sync with selection
    useEffect(() => {
        const container = canvasRef.current;
        if (!container || navRootId) return;
        if (selectedId) {
            const el = container.querySelector(`[data-var-id="${selectedId}"]`);
            el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedId, navRootId]);

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importJson);
            if (typeof parsed !== 'object' || parsed === null) {
                throw new Error("Invalid JSON: must be an object");
            }

            const newElements: VariableElement[] = [];
            // Keep existing elements that are not overwritten
            const existingKeys = new Set(Object.keys(parsed));

            // Create new elements from JSON
            Object.entries(parsed).forEach(([key, value]) => {
                let type: VariableElement['type'] = 'string';
                let strValue: string;

                if (value !== null && typeof value === 'object') {
                    type = 'json';
                    strValue = JSON.stringify(value, null, 2);
                } else if (typeof value === 'boolean') {
                    type = 'boolean';
                    strValue = String(value);
                } else if (typeof value === 'number') {
                    type = 'number';
                    strValue = String(value);
                } else {
                    strValue = String(value ?? '');
                    if (strValue === 'true' || strValue === 'false') type = 'boolean';
                    else if (!isNaN(Number(strValue)) && strValue.trim() !== '') type = 'number';
                }

                if (/SECRET|KEY|TOKEN|PASSWORD|PASS/i.test(key)) type = 'secret';

                newElements.push({
                    id: `var-${key}-${Date.now()}`,
                    key,
                    value: strValue,
                    type
                });
            });

            // Merge: append new elements to existing ones, or replace if we want to be stricter?
            // The prompt says "import", usually implies adding/merging.
            // Let's append, but maybe warn about duplicates?
            // Actually, let's just add them. The duplicate checker will handle conflicts visually.

            setElements(prev => [...prev, ...newElements]);
            setImportJson('');
            setIsImportOpen(false);
            toast.success(translate(`Imported ${newElements.length} variables`));
        } catch (error) {
            console.error("Import failed", error);
            toast.error(translate("Invalid JSON format"));
        }
    };

    const buildExportData = () => {
        const data: Record<string, any> = {};
        elements.forEach(el => {
            if (el.key) {
                let val: any = el.value;
                if (el.type === 'boolean') val = el.value === 'true';
                else if (el.type === 'number') {
                    const num = Number(el.value);
                    if (!isNaN(num) && el.value.trim() !== '') val = num;
                } else if (el.type === 'json') {
                    try { val = JSON.parse(el.value); } catch { /* keep as string */ }
                }
                data[el.key] = val;
            }
        });
        return data;
    };

    const handleExportCopy = () => {
        const data = buildExportData();
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.success(translate("Copied to clipboard"));
    };

    const handleImportFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const text = ev.target?.result as string;
                    const parsed = JSON.parse(text);
                    if (typeof parsed !== 'object' || parsed === null) {
                        throw new Error('Invalid JSON: must be an object');
                    }
                    const newElements: VariableElement[] = [];
                    Object.entries(parsed).forEach(([key, value]) => {
                        let type: VariableElement['type'] = 'string';
                        let strValue: string;
                        if (value !== null && typeof value === 'object') {
                            type = 'json';
                            strValue = JSON.stringify(value, null, 2);
                        } else if (typeof value === 'boolean') {
                            type = 'boolean';
                            strValue = String(value);
                        } else if (typeof value === 'number') {
                            type = 'number';
                            strValue = String(value);
                        } else {
                            strValue = String(value ?? '');
                            if (strValue === 'true' || strValue === 'false') type = 'boolean';
                            else if (!isNaN(Number(strValue)) && strValue.trim() !== '') type = 'number';
                        }
                        if (/SECRET|KEY|TOKEN|PASSWORD|PASS/i.test(key)) type = 'secret';
                        newElements.push({ id: `var-${key}-${Date.now()}`, key, value: strValue, type });
                    });
                    setElements(prev => [...prev, ...newElements]);
                    toast.success(translate(`Imported ${newElements.length} variables from file`));
                } catch (error) {
                    console.error('Import file failed', error);
                    toast.error(translate('Invalid JSON file'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleExportFile = () => {
        const data = buildExportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'variables.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(translate("Download started"));
    };

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
            {/* Top Toolbar: Palette & Search & Actions */}
            <div className="flex flex-col border-b bg-muted/20">
                <div className="flex items-start justify-between p-3 border-b border-border/50 gap-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1.5"><T>Variables</T></span>

                    <div className="flex items-center gap-2 shrink-0">
                        <Input
                            placeholder="Filter..."
                            className="h-7 w-40 text-xs bg-background"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />

                        <div className="flex items-center gap-1 border-l pl-2 ml-1">
                            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Import JSON">
                                        <Import className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle><T>Import Variables (JSON)</T></DialogTitle>
                                        <DialogDescription>
                                            <T>Paste a JSON object to import variables.</T>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                        value={importJson}
                                        onChange={e => setImportJson(e.target.value)}
                                        className="min-h-[300px] font-mono text-xs"
                                        placeholder={`{\n  "API_KEY": "12345",\n  "ENABLE_FEATURE": "true"\n}`}
                                    />
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsImportOpen(false)}><T>Cancel</T></Button>
                                        <Button onClick={handleImport}><T>Import Variables</T></Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Export JSON">
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleImportFile}>
                                        <FileJson className="mr-2 h-4 w-4" /> <T>Import from File</T>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportCopy}>
                                        <Copy className="mr-2 h-4 w-4" /> <T>Copy to Clipboard</T>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportFile}>
                                        <FileJson className="mr-2 h-4 w-4" /> <T>Download JSON</T>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={translate('Clear All')} disabled={elements.length === 0}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle><T>Clear All Variables?</T></AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <T>This will remove all {elements.length} variables. This cannot be undone.</T>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => {
                                                setElements([]);
                                                setSelectedId(null);
                                                setNavRootId(null);
                                                setShowClearDialog(false);
                                                toast.success(translate('All variables cleared'));
                                            }}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            <T>Clear All</T>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="w-[1px] h-4 bg-border mx-1" />

                        <div className="flex items-center gap-0 border rounded-md p-0.5 bg-muted/30">
                            <button
                                onClick={() => {
                                    if (viewMode === 'plain') {
                                        // Sync plain JSON back to elements
                                        try {
                                            const parsed = JSON.parse(plainJson);
                                            if (typeof parsed === 'object' && parsed !== null) {
                                                const newElements: VariableElement[] = Object.entries(parsed).map(([key, rawValue]) => {
                                                    let type: VariableElement['type'] = 'string';
                                                    let value: string;
                                                    if (rawValue !== null && typeof rawValue === 'object') { type = 'json'; value = JSON.stringify(rawValue, null, 2); }
                                                    else if (typeof rawValue === 'boolean') { type = 'boolean'; value = String(rawValue); }
                                                    else if (typeof rawValue === 'number') { type = 'number'; value = String(rawValue); }
                                                    else { value = String(rawValue ?? ''); }
                                                    if (/SECRET|KEY|TOKEN|PASSWORD|PASS/i.test(key)) type = 'secret';
                                                    return { id: `var-${key}`, key, value, type };
                                                });
                                                setElements(newElements);
                                            }
                                        } catch { /* leave elements as-is if JSON is invalid */ }
                                    }
                                    setViewMode('visual');
                                }}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium transition-colors",
                                    viewMode === 'visual' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutList className="h-3 w-3" />
                                <T>Visual</T>
                            </button>
                            <button
                                onClick={() => {
                                    const data = buildExportData();
                                    setPlainJson(JSON.stringify(data, null, 2));
                                    setViewMode('plain');
                                }}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium transition-colors",
                                    viewMode === 'plain' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Code className="h-3 w-3" />
                                <T>Plain</T>
                            </button>
                        </div>

                        <div className="w-[1px] h-4 bg-border mx-1" />

                        <Button size="sm" onClick={handleSave} disabled={isSaving || duplicateKeys.size > 0} className="h-7 text-xs px-3">
                            {isSaving ? translate('Saving...') : translate('Save Changes')}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-2 px-3 overflow-x-auto no-scrollbar bg-background/50">
                    <span className="text-xs font-semibold text-muted-foreground mr-2 uppercase tracking-wider"><T>Add:</T></span>
                    <PaletteItem type="string" label={translate("String")} onClick={() => onAddVariable('string')} />
                    <PaletteItem type="number" label={translate("Number")} onClick={() => onAddVariable('number')} />
                    <PaletteItem type="boolean" label={translate("Boolean")} onClick={() => onAddVariable('boolean')} />
                    <PaletteItem type="secret" label={translate("Secret")} onClick={() => onAddVariable('secret')} />
                    <PaletteItem type="json" label={translate("JSON")} onClick={() => onAddVariable('json')} />
                </div>
            </div>

            {viewMode === 'plain' ? (
                <div className="flex-1 min-h-0 p-4 flex">
                    <Textarea
                        value={plainJson}
                        onChange={e => setPlainJson(e.target.value)}
                        className="flex-1 font-mono text-xs resize-none"
                        placeholder="{}"
                        spellCheck={false}
                    />
                </div>
            ) : (
                <div className="flex flex-1 min-h-0">
                    {/* Canvas */}
                    <div className="flex-1 flex flex-col transition-colors min-w-0">
                        {navRootId && navRootElement ? (
                            /* --- JSONTreeWalker replaces inline drilled-in view --- */
                            <JSONTreeWalker
                                data={navRootElement.value}
                                rootLabel={navRootElement.key}
                                className="flex-1 border-0 rounded-none"
                                onExit={() => {
                                    const rootId = navRootId;
                                    setSelectedId(rootId);
                                    setNavRootId(null);
                                    requestAnimationFrame(() => {
                                        canvasRef.current?.focus();
                                        canvasRef.current?.querySelector(`[data-var-id="${rootId}"]`)?.scrollIntoView({ block: 'nearest' });
                                    });
                                }}
                            />
                        ) : (
                            <div
                                ref={canvasRef}
                                tabIndex={0}
                                className="flex-1 p-4 overflow-y-auto bg-muted/5 relative outline-none focus:ring-1 focus:ring-primary/20 focus:ring-inset"
                                onClick={() => setSelectedId(null)}
                            >
                                {elements.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg opacity-50 m-4 min-h-[200px]">
                                        <p className="text-sm"><T>Click types in the top bar to add variables</T></p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {duplicateKeys.size > 0 && (
                                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4 border border-destructive/20">
                                                <T>Duplicate keys detected</T>: {Array.from(duplicateKeys).join(', ')}
                                            </div>
                                        )}
                                        {filteredElements.map(el => (
                                            <CanvasElement
                                                key={el.id}
                                                element={el}
                                                isSelected={selectedId === el.id}
                                                onSelect={() => setSelectedId(el.id)}
                                                onDelete={() => {
                                                    setElements(prev => prev.filter(e => e.id !== el.id));
                                                    if (selectedId === el.id) setSelectedId(null);
                                                }}
                                                onChange={(updates) => {
                                                    setElements(prev => prev.map(e => e.id === el.id ? { ...e, ...updates } : e));
                                                }}
                                                variableSchema={variableSchema}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Configuration Sidebar - Right Side */}
                    {!navRootId && (
                        <div className="w-[300px] border-l flex flex-col bg-background shrink-0">
                            <div className="p-3 border-b bg-muted/20">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"><T>Properties</T></span>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto">
                                {selectedElement ? (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-xs">
                                                <T>Key Name</T>
                                                {variableSchema?.[selectedElement.key]?.label && (
                                                    <span className="text-muted-foreground ml-2 font-normal">({variableSchema[selectedElement.key].label})</span>
                                                )}
                                            </Label>
                                            <Input
                                                ref={keyNameRef}
                                                value={selectedElement.key}
                                                onChange={e => updateSelectedElement({ key: e.target.value })}
                                                className={`h-8 font-mono text-sm ${duplicateKeys.has(selectedElement.key.trim()) ? "border-destructive" : ""}`}
                                                placeholder="API_KEY"
                                            />
                                            {variableSchema?.[selectedElement.key]?.description && (
                                                <p className="text-xs text-muted-foreground">{variableSchema[selectedElement.key].description}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs"><T>Value</T></Label>
                                            {selectedElement.type === 'boolean' ? (
                                                <div className="flex items-center gap-2 border p-2 rounded bg-background">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedElement.value === 'true'}
                                                        onChange={e => updateSelectedElement({ value: String(e.target.checked) })}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-sm font-mono">{selectedElement.value === 'true' ? 'true' : 'false'}</span>
                                                </div>
                                            ) : selectedElement.type === 'number' ? (
                                                <Input
                                                    type="number"
                                                    value={selectedElement.value}
                                                    onChange={e => updateSelectedElement({ value: e.target.value })}
                                                    className="h-8 font-mono text-sm"
                                                />
                                            ) : (
                                                <Textarea
                                                    value={selectedElement.value}
                                                    onChange={e => updateSelectedElement({ value: e.target.value })}
                                                    className="font-mono text-xs min-h-[120px] resize-y"
                                                    placeholder="Value..."
                                                />
                                            )}
                                        </div>

                                        <div className="pt-4 border-t space-y-2">
                                            <Label className="text-xs"><T>Type</T></Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['string', 'number', 'boolean', 'secret', 'json'].map(t => {
                                                    const TIcon = getIconForType(t);
                                                    return (
                                                        <Button
                                                            key={t}
                                                            variant={selectedElement.type === t ? 'secondary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => updateSelectedElement({ type: t as any })}
                                                            className={`text-xs h-7 justify-start px-2 ${selectedElement.type === t ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                                                        >
                                                            <TIcon className="w-3 h-3 mr-2" />
                                                            <span className="capitalize">{t}</span>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {selectedElement.type === 'json' && (
                                            <div className="pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs"
                                                    onClick={() => {
                                                        setNavRootId(selectedElement.id);
                                                    }}
                                                >
                                                    <ChevronRight className="h-3 w-3 mr-1" />
                                                    <T>Browse JSON</T>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center opacity-60">
                                        <TypeIcon className="h-8 w-8 mb-2 stroke-1" />
                                        <p className="text-sm"><T>Select a variable to configure</T></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
