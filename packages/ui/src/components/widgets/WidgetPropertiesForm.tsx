import React, { useState, useEffect } from 'react';
import { T } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WidgetDefinition } from '@/lib/widgetRegistry';
import { ImagePickerDialog } from './ImagePickerDialog';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { Image as ImageIcon, Maximize2, FileText, Sparkles, FolderOpen, FolderTree, Plus, Trash2, Link, ChevronDown, Check } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MarkdownEditor from '@/components/MarkdownEditorEx';
import { TailwindClassPicker } from './TailwindClassPicker';
const TabsPropertyEditor = React.lazy(() => import('./TabsPropertyEditor').then(m => ({ default: m.TabsPropertyEditor })));
import { HtmlGeneratorWizard } from './HtmlGeneratorWizard';
import { FileBrowserWidget } from '@/modules/storage';

import { UserPicker } from '@/components/admin/UserPicker';
import { CategoryPickerField } from '@/components/widgets/CategoryPickerField';
import { LocationPickerDialog, LocationSelection } from './location-picker';
import { MapPin, Globe } from 'lucide-react';
/**
 * A helper input component that maintains local state for typing fluidity,
 * but only commits its value to the parent on blur or when Enter is pressed.
 * It also seamlessly syncs if the parent value changes externally.
 */
const LocalSyncedInput = ({ value, onChange, ...props }: { value: string, onChange: (val: string) => void } & React.ComponentProps<typeof Input>) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync external changes into local state
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleCommit = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    return (
        <Input
            {...props}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
                handleCommit();
                props.onBlur?.(e);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur(); // Blur triggers commit automatically
                }
                props.onKeyDown?.(e);
            }}
        />
    );
};

export interface WidgetPropertiesFormProps {
    widgetDefinition: WidgetDefinition;
    widgetInstanceId?: string;
    onRename?: (newId: string) => void;
    currentProps: Record<string, any>;
    onSettingsChange: (settings: Record<string, any>) => void;
    onSave?: () => void;
    onCancel?: () => void;
    showActions?: boolean;
    contextVariables?: Record<string, any>;
    pageContext?: any;
}

export const WidgetPropertiesForm: React.FC<WidgetPropertiesFormProps> = ({
    widgetDefinition,
    widgetInstanceId,
    onRename,
    currentProps,
    onSettingsChange,
    onSave,
    onCancel,
    showActions = false,
    contextVariables = {},
    pageContext
}) => {
    // Local state for immediate feedback in the form, though we also prop up changes
    const [settings, setSettings] = useState<Record<string, any>>(currentProps);
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    const [imagePickerField, setImagePickerField] = useState<string | null>(null);
    const [pagePickerOpen, setPagePickerOpen] = useState(false);
    const [pagePickerField, setPagePickerField] = useState<string | null>(null);
    const [markdownEditorOpen, setMarkdownEditorOpen] = useState(false);
    const [activeMarkdownField, setActiveMarkdownField] = useState<string | null>(null);
    const [htmlWizardOpen, setHtmlWizardOpen] = useState(false);
    const [activeHtmlField, setActiveHtmlField] = useState<string | null>(null);
    const [vfsPickerOpen, setVfsPickerOpen] = useState(false);
    const [vfsPickerField, setVfsPickerField] = useState<string | null>(null);
    const [vfsPickerMountKey, setVfsPickerMountKey] = useState<string>('');
    const [vfsPickerPathKey, setVfsPickerPathKey] = useState<string>('');
    const [vfsPickerFileKey, setVfsPickerFileKey] = useState<string | null>(null);
    const [vfsBrowseMount, setVfsBrowseMount] = useState<string>('');
    const [vfsBrowsePath, setVfsBrowsePath] = useState<string>('');
    const [vfsSelectedFilePath, setVfsSelectedFilePath] = useState<string | null>(null);

    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [locationPickerField, setLocationPickerField] = useState<string | null>(null);

    // Sync with prop changes (e.g. selection change)
    useEffect(() => {
        setSettings(prev => {
            if (JSON.stringify(prev) === JSON.stringify(currentProps)) return prev;
            return currentProps;
        });
    }, [currentProps]);

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            // Defer parent callback to avoid setState-during-render warning
            console.log('updateSetting', key, value, newSettings);
            queueMicrotask(() => onSettingsChange(newSettings));
            return newSettings;
        });
    };

    const renderField = (key: string, config: any) => {
        // Conditional visibility: skip if showWhen condition is not met
        if (config.showWhen) {
            const { field, value: expected } = config.showWhen;
            const actual = settings[field] ?? '';
            if (Array.isArray(expected) ? !expected.includes(actual) : actual !== expected) {
                return null;
            }
        }

        const value = settings[key] ?? config.default;

        switch (config.type) {
            case 'number':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <Input
                            id={key}
                            type="number"
                            min={config.min}
                            max={config.max}
                            value={value}
                            onChange={(e) => updateSetting(key, parseInt(e.target.value) || config.default)}
                            className="w-full h-8 text-sm"
                        />
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'text':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <Input
                            id={key}
                            type="text"
                            value={value || ''}
                            onChange={(e) => updateSetting(key, e.target.value)}
                            className="w-full h-8 text-sm"
                            placeholder={config.default}
                        />
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div key={key} className="space-y-2">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <Select value={value} onValueChange={(newValue) => updateSetting(key, newValue)}>
                            <SelectTrigger className="w-full h-8 text-sm">
                                <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {config.options.map((option: any) => (
                                    <SelectItem key={option.value} value={option.value} className="text-sm">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'selectWithText': {
                const isPreset = config.options?.some((o: any) => o.value === value);
                return (
                    <div key={key} className="space-y-2">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <Select
                            value={isPreset ? value : '__custom__'}
                            onValueChange={(newValue) => {
                                if (newValue === '__custom__') updateSetting(key, '');
                                else updateSetting(key, newValue);
                            }}
                        >
                            <SelectTrigger className="w-full h-8 text-sm">
                                <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {config.options.map((option: any) => (
                                    <SelectItem key={option.value} value={option.value} className="text-sm">
                                        {option.label}
                                    </SelectItem>
                                ))}
                                <SelectItem value="__custom__" className="text-sm">
                                    Custom…
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {!isPreset && (
                            <Input
                                type="text"
                                value={value || ''}
                                onChange={(e) => updateSetting(key, e.target.value)}
                                className="w-full h-8 text-sm font-mono"
                                placeholder={config.default || 'Enter custom value…'}
                            />
                        )}
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );
            }

            case 'boolean':
                return (
                    <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <T>{config.label}</T>
                                </Label>
                                {config.description && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                        <T>{config.description}</T>
                                    </p>
                                )}
                            </div>
                            <Switch
                                id={key}
                                checked={value ?? config.default}
                                onCheckedChange={(checked) => updateSetting(key, checked)}
                                className="scale-90"
                            />
                        </div>
                    </div>
                );

            case 'imagePicker':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id={key}
                                type="text"
                                value={value || ''}
                                onChange={(e) => updateSetting(key, e.target.value)}
                                placeholder={config.default || 'No image selected'}
                                className="flex-1 font-mono text-[10px] h-8"
                                readOnly
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                    setImagePickerField(key);
                                    setImagePickerOpen(true);
                                }}
                            >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                <span className="text-xs"><T>Browse</T></span>
                            </Button>
                        </div>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'pagePicker':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id={key}
                                type="text"
                                value={value || ''}
                                onChange={(e) => updateSetting(key, e.target.value)}
                                placeholder={config.default || 'No page selected'}
                                className="flex-1 font-mono text-[10px] h-8"
                                readOnly
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                    setPagePickerField(key);
                                    setPagePickerOpen(true);
                                }}
                            >
                                <FileText className="h-3 w-3 mr-1" />
                                <span className="text-xs"><T>Select Page</T></span>
                            </Button>
                        </div>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'markdown':
                return (
                    <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                <T>{config.label}</T>
                            </Label>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                    onClick={() => {
                                        setActiveHtmlField(key);
                                        setHtmlWizardOpen(true);
                                    }}
                                    title="Generate HTML with AI"
                                >
                                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                                    <T>Generate</T>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    title="Fullscreen"
                                    onClick={() => {
                                        setActiveMarkdownField(key);
                                        setMarkdownEditorOpen(true);
                                    }}
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            id={key}
                            value={value || ''}
                            onChange={(e) => updateSetting(key, e.target.value)}
                            className="w-full min-h-[80px] max-h-[200px] text-sm font-mono resize-y overflow-auto break-all"
                            placeholder={config.default}
                        />
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'classname':
                return (
                    <div key={key} className="space-y-1">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <TailwindClassPicker
                            value={value || ''}
                            onChange={(newValue) => updateSetting(key, newValue)}
                            placeholder={config.default || 'Select classes...'}
                            className="w-full"
                        />
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'tabs-editor':
                return (
                    <div key={key} className="space-y-4">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <React.Suspense fallback={<div className="text-xs text-muted-foreground">Loading editor...</div>}>
                            <TabsPropertyEditor
                                value={value || []}
                                onChange={(newValue) => updateSetting(key, newValue)}
                                widgetInstanceId={widgetInstanceId || 'new-widget'}
                            />
                        </React.Suspense>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'vfsPicker': {
                // Compound picker for mount + path — editable text field + browse dialog
                const mountKey = config.mountKey || 'mount';
                const pathKey = config.pathKey || 'path';
                const currentMount = settings[mountKey] || config.defaultMount || 'home';
                const currentPickerPath = settings[pathKey] || '/';
                const displayValue = `${currentMount}:${currentPickerPath}`;
                return (
                    <div key={key} className="space-y-2">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="flex gap-2">
                            <LocalSyncedInput
                                value={displayValue}
                                onChange={(val) => {
                                    const colonIdx = val.indexOf(':');
                                    if (colonIdx > 0) {
                                        updateSetting(mountKey, val.slice(0, colonIdx));
                                        updateSetting(pathKey, val.slice(colonIdx + 1) || '/');
                                    } else {
                                        updateSetting(pathKey, val || '/');
                                    }
                                }}
                                className="flex-1 font-mono text-xs h-8"
                                placeholder="mount:/path"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                    console.log(`on file picker click : ${key} : ${mountKey} : ${pathKey}`);
                                    setVfsPickerField(key);
                                    setVfsPickerMountKey(mountKey);
                                    setVfsPickerPathKey(pathKey);
                                    setVfsPickerFileKey(configSchema['initialFile'] ? 'initialFile' : null);
                                    setVfsBrowseMount(settings[mountKey] || config.defaultMount || 'home');

                                    let p = settings[pathKey] || '/';
                                    let fileToPreselect = settings['initialFile'] || '';

                                    if (p.includes('?file=')) {
                                        const parts = p.split('?file=');
                                        p = parts[0] || '/';
                                        fileToPreselect = fileToPreselect || decodeURIComponent(parts[1]);
                                    }
                                    setVfsBrowsePath(p);

                                    if (fileToPreselect) {
                                        const sep = p.endsWith('/') ? '' : '/';
                                        setVfsSelectedFilePath(`${p}${sep}${fileToPreselect}`.replace(/\/\/+/g, '/'));
                                    } else {
                                        setVfsSelectedFilePath(null);
                                    }
                                    setVfsPickerOpen(true);
                                }}
                            >
                                <FolderOpen className="h-3 w-3 mr-1" />
                                <span className="text-xs"><T>Browse</T></span>
                            </Button>
                        </div>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );
            }

            case 'userPicker':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <UserPicker
                            value={value || ''}
                            onSelect={(userId) => updateSetting(key, userId)}
                        />
                        {value && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive"
                                onClick={() => updateSetting(key, '')}
                            >
                                <T>Clear user filter</T>
                            </Button>
                        )}
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'categoryPicker':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <CategoryPickerField
                            value={value || ''}
                            onSelect={(categoryId) => updateSetting(key, categoryId)}
                            filterType={config.filterType}
                        />
                        {value && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive"
                                onClick={() => updateSetting(key, '')}
                            >
                                <T>Clear category</T>
                            </Button>
                        )}
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'buttons-editor': {
                const btns: any[] = Array.isArray(value) ? value : [];
                return (
                    <div key={key} className="space-y-2">
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="space-y-2">
                            {btns.map((btn: any, i: number) => (
                                <div key={btn.id || i} className="bg-muted/30 rounded-md p-1.5 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            value={btn.label || ''}
                                            onChange={(e) => {
                                                const updated = btns.map((b, j) => j === i ? { ...b, label: e.target.value } : b);
                                                updateSetting(key, updated);
                                            }}
                                            className="flex-1 h-7 text-xs"
                                            placeholder="Button label"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => {
                                                const updated = btns.filter((_: any, j: number) => j !== i);
                                                updateSetting(key, updated);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            value={btn.href || ''}
                                            onChange={(e) => {
                                                const updated = btns.map((b, j) => j === i ? { ...b, href: e.target.value, targetPageId: undefined } : b);
                                                updateSetting(key, updated);
                                            }}
                                            className="flex-1 h-6 text-[10px] font-mono"
                                            placeholder="/path or https://..."
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            title="Pick page"
                                            onClick={() => {
                                                setPagePickerField(`__btn_${key}_${i}`);
                                                setPagePickerOpen(true);
                                            }}
                                        >
                                            <Link className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => {
                                const newBtn = { id: `btn-${Date.now()}`, label: 'New Button' };
                                updateSetting(key, [...btns, newBtn]);
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            <T>Add Button</T>
                        </Button>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );
            }
            case 'locationPicker':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-muted/30 rounded-md border border-border p-1.5 flex items-center gap-2 min-h-8 overflow-hidden group">
                                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-[10px] font-bold truncate max-w-[180px] opacity-80 uppercase tracking-tight">
                                    {value?.label || value?.address || (value?.lat ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : <T>No selection</T>)}
                                </span>
                                {value && (
                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <button 
                                            onClick={() => updateSetting(key, null)}
                                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 shrink-0 border-primary/20 hover:border-primary/50 transition-colors shadow-sm"
                                onClick={() => {
                                    setLocationPickerField(key);
                                    setLocationPickerOpen(true);
                                }}
                            >
                                <Globe className="h-3 w-3 mr-1 text-primary" />
                                <span className="text-xs"><T>Pick</T></span>
                            </Button>
                        </div>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            case 'color':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            <T>{config.label}</T>
                        </Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                id={key}
                                defaultValue={value || config.default || '#000000'}
                                key={`${key}-${value}`}
                                onChange={(e) => updateSetting(key, e.target.value)}
                                className="h-8 w-10 rounded border border-border cursor-pointer bg-transparent p-0.5"
                            />
                            <LocalSyncedInput
                                type="text"
                                value={value || config.default || '#000000'}
                                onChange={(val) => updateSetting(key, val)}
                                className="flex-1 h-8 text-xs font-mono"
                                placeholder={config.default || '#000000'}
                            />
                        </div>
                        {config.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                <T>{config.description}</T>
                            </p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const configSchema = widgetDefinition.metadata.configSchema || {};

    return (
        <div className="space-y-4">


            {/* General Properties */}
            <div className="space-y-4 pb-4 border-b border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    General
                </Label>

                {/* Widget ID Helper (Editable) */}
                {widgetInstanceId && onRename && (
                    <div className="space-y-2">
                        <Label htmlFor="widget-id-editor" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Widget ID (Variable Name)
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                key={widgetInstanceId} // Force remount when widget changes to update defaultValue
                                id="widget-id-editor"
                                defaultValue={widgetInstanceId}
                                className="h-8 font-mono text-xs bg-muted/50"
                                onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val && val !== widgetInstanceId) {
                                        onRename(val);
                                    } else {
                                        e.target.value = widgetInstanceId; // Reset if empty or same
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Unique identifier used for templating key reference.
                        </p>
                    </div>
                )}

                {/* Enabled Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="widget-enabled" className="text-xs font-medium">Enabled</Label>
                        <p className="text-[10px] text-muted-foreground">Turn off to hide this widget.</p>
                    </div>
                    <Switch
                        id="widget-enabled"
                        checked={settings.enabled !== false} // Default to true
                        onCheckedChange={(checked) => updateSetting('enabled', checked)}
                        className="scale-90"
                    />
                </div>
            </div>

            {/* Custom CSS Class Editor */}
            <div className="space-y-1 pb-4 border-b border-border">
                <Label htmlFor="widget-class-editor" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    CSS Class
                </Label>
                <div className="flex gap-2">
                    <TailwindClassPicker
                        value={settings.customClassName || ''}
                        onChange={(newValue) => updateSetting('customClassName', newValue)}
                        placeholder={widgetInstanceId ? `widget-${widgetInstanceId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'Select classes...'}
                        className="w-full"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Custom CSS class for this widget instance. Defaults to widget-ID.
                </p>
            </div>

            <div className="space-y-4">
                {Object.entries(configSchema).map(([key, config]) =>
                    renderField(key, config)
                )}
            </div>

            {showActions && (
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {onCancel && (
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            <T>Cancel</T>
                        </Button>
                    )}
                    {onSave && (
                        <Button size="sm" onClick={onSave}>
                            <T>Save</T>
                        </Button>
                    )}
                </div>
            )}

            {/* Image Picker Dialog */}
            {imagePickerField && (
                <ImagePickerDialog
                    isOpen={imagePickerOpen}
                    onClose={() => {
                        setImagePickerOpen(false);
                        setImagePickerField(null);
                    }}
                    onSelectResult={(result) => {
                        // Batch both pictureId + postId into a single state update
                        setSettings(prev => {
                            const newSettings = {
                                ...prev,
                                [imagePickerField!]: result.pictureId,
                                postId: result.postId || null,
                            };
                            // Defer parent callback to avoid setState-during-render warning
                            setTimeout(() => onSettingsChange(newSettings), 0);
                            return newSettings;
                        });
                        setImagePickerOpen(false);
                        setImagePickerField(null);
                    }}
                    currentValue={settings[imagePickerField]}
                />
            )}

            {/* Page Picker Dialog */}
            {pagePickerField && (
                <PagePickerDialog
                    isOpen={pagePickerOpen}
                    onClose={() => {
                        setPagePickerOpen(false);
                        setPagePickerField(null);
                    }}
                    onSelect={(page) => {
                        // Handle buttons-editor fields: __btn_{propKey}_{index}
                        const btnMatch = pagePickerField.match(/^__btn_(.+)_(\d+)$/);
                        if (btnMatch) {
                            const [, propKey, idxStr] = btnMatch;
                            const idx = parseInt(idxStr);
                            const btns = Array.isArray(settings[propKey]) ? [...settings[propKey]] : [];
                            if (btns[idx]) {
                                btns[idx] = {
                                    ...btns[idx],
                                    targetPageId: page?.id || undefined,
                                    href: page ? `/user/${(page as any).user_id}/pages/${(page as any).slug}` : undefined,
                                };
                                updateSetting(propKey, btns);
                            }
                        } else {
                            updateSetting(pagePickerField, page?.id || null);
                        }
                        setPagePickerOpen(false);
                        setPagePickerField(null);
                    }}
                    currentValue={
                        pagePickerField.startsWith('__btn_')
                            ? (() => {
                                const m = pagePickerField.match(/^__btn_(.+)_(\d+)$/);
                                if (m) {
                                    const btns = settings[m[1]];
                                    return Array.isArray(btns) ? btns[parseInt(m[2])]?.targetPageId || null : null;
                                }
                                return null;
                            })()
                            : settings[pagePickerField]
                    }
                />
            )}

            {/* Markdown Editor Modal */}
            <Dialog open={markdownEditorOpen} onOpenChange={setMarkdownEditorOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>
                            {activeMarkdownField ?
                                (widgetDefinition.metadata.configSchema?.[activeMarkdownField]?.label || 'Markdown Editor')
                                : 'Markdown Editor'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden p-4 bg-muted/10">
                        {activeMarkdownField && (
                            <MarkdownEditor
                                value={settings[activeMarkdownField] || ''}
                                onChange={(newValue) => updateSetting(activeMarkdownField, newValue)}
                                className="h-full border rounded-md bg-background"
                                placeholder="Enter markdown content..."
                            />
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <Button onClick={() => setMarkdownEditorOpen(false)}>
                            <T>Done</T>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* HTML Generator Wizard */}
            <HtmlGeneratorWizard
                isOpen={htmlWizardOpen}
                onClose={() => {
                    setHtmlWizardOpen(false);
                    setActiveHtmlField(null);
                }}
                onHtmlGenerated={(html) => {
                    if (activeHtmlField) {
                        updateSetting(activeHtmlField, html);
                    }
                }}
                contextVariables={contextVariables}
                pageContext={pageContext}
                initialPrompt={activeHtmlField ? settings[activeHtmlField] : ''}
            />

            {/* VFS Browse Dialog */}
            <Dialog open={vfsPickerOpen} onOpenChange={(open) => {
                if (!open) setVfsPickerOpen(false);
            }}>
                <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 gap-0">
                    <DialogHeader className="p-4 pb-2">
                        <DialogTitle>Browse Files</DialogTitle>
                        <p className="text-xs text-muted-foreground font-mono">
                            {vfsBrowseMount}:{vfsBrowsePath}
                        </p>
                    </DialogHeader>
                    <div style={{ height: 600, overflow: 'hidden' }}>
                        <FileBrowserWidget
                            key={vfsBrowseMount}
                            mount={vfsBrowseMount}
                            path={vfsBrowsePath}
                            onMountChange={(m: string) => { setVfsBrowseMount(m); setVfsSelectedFilePath(null); }}
                            onPathChange={(p: string) => { setVfsBrowsePath(p); setVfsSelectedFilePath(null); }}
                            onSelect={(p: string | null) => setVfsSelectedFilePath(p)}
                            viewMode="list"
                            mode="simple"
                            showToolbar={true}
                            glob="*.*"
                            sortBy="name"
                            canChangeMount={true}
                            allowFileViewer={false}
                            allowLightbox={false}
                            allowDownload={false}
                            jail={false}
                            minHeight='500px'
                            showStatusBar={true}
                            initialFile={settings[vfsPickerFileKey || 'initialFile'] || ''}
                        />
                    </div>
                    <div className="p-3 border-t flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setVfsPickerOpen(false)}>
                            <T>Cancel</T>
                        </Button>
                        <Button size="sm" onClick={() => {
                            setSettings(prev => {
                                console.log(`On Select File ${vfsSelectedFilePath}`);
                                const newSettings = { ...prev };
                                newSettings[vfsPickerMountKey] = vfsBrowseMount;

                                if (vfsPickerFileKey) {
                                    if (vfsSelectedFilePath && vfsSelectedFilePath !== vfsBrowsePath) {
                                        const fileName = vfsSelectedFilePath.split('/').pop() || '';
                                        if (fileName.includes('.')) {
                                            newSettings[vfsPickerFileKey] = fileName;
                                            newSettings[vfsPickerPathKey] = vfsBrowsePath; // Keep directory clean
                                        } else {
                                            newSettings[vfsPickerFileKey] = '';
                                            newSettings[vfsPickerPathKey] = vfsSelectedFilePath;
                                        }
                                    } else {
                                        newSettings[vfsPickerFileKey] = '';
                                        newSettings[vfsPickerPathKey] = vfsBrowsePath;
                                    }
                                } else {
                                    let finalPath = vfsBrowsePath;
                                    if (vfsSelectedFilePath && vfsSelectedFilePath !== vfsBrowsePath) {
                                        finalPath = vfsSelectedFilePath;
                                    }
                                    newSettings[vfsPickerPathKey] = finalPath;
                                }

                                console.log('Selected VFS path:', vfsBrowseMount, newSettings[vfsPickerPathKey], newSettings);
                                queueMicrotask(() => onSettingsChange(newSettings));
                                return newSettings;
                            });
                            setVfsPickerOpen(false);
                            setVfsSelectedFilePath(null); // Reset for next time
                        }}>
                            <T>Select</T>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Location Picker Dialog */}
            {locationPickerField && (
                <LocationPickerDialog
                    isOpen={locationPickerOpen}
                    onClose={() => {
                        setLocationPickerOpen(false);
                        setLocationPickerField(null);
                    }}
                    onSelect={(selection) => {
                        updateSetting(locationPickerField, selection);
                        setLocationPickerOpen(false);
                        setLocationPickerField(null);
                    }}
                    initialSelection={settings[locationPickerField]}
                />
            )}
        </div>
    );
};

