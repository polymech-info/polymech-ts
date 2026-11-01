/**
 * RJSF widgets that store app entity IDs / VFS paths (no inline rendering of linked content).
 * ui:widget keys are listed in builder/appPickerWidgetOptions.ts.
 */
import React, { useEffect, useState } from 'react';
import { GroupPicker } from '@/components/admin/GroupPicker';
import type { WidgetProps } from '@rjsf/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, FolderOpen, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { T, translate } from '@/i18n';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { fetchPageDetailsById } from '@/modules/pages/client-pages';
import PostPicker from '@/components/PostPicker';
import { fetchPostDetailsAPI } from '@/modules/posts/client-posts';
import { CategoryPickerField } from '@/components/widgets/CategoryPickerField';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { fetchPictureById } from '@/modules/posts/client-pictures';
import { UserPicker } from '@/components/admin/UserPicker';
import { FilePickerField } from '@/modules/storage/FilePicker';

import { getUiOptions } from '@rjsf/utils';

export const PagePickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props;
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const v = value as string | undefined;
        if (!v) {
            setLabel(null);
            return;
        }
        (async () => {
            try {
                const res = (await fetchPageDetailsById(v)) as
                    | { page?: { title?: string }; title?: string }
                    | null
                    | undefined;
                const title = res?.page?.title ?? res?.title;
                if (!cancelled && title) setLabel(String(title));
            } catch {
                if (!cancelled) setLabel(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [value]);

    const display = value
        ? label
            ? `${label} (${String(value).slice(0, 8)}…)`
            : String(value)
        : '';

    return (
        <div className="space-y-1">
            <div className="flex gap-2">
                <Input
                    id={id}
                    readOnly
                    value={display}
                    placeholder={translate('No page selected')}
                    className="flex-1 font-mono text-[10px] h-8"
                    disabled={disabled}
                    onBlur={() => onBlur(id, value)}
                    onFocus={() => onFocus(id, value)}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-2"
                    disabled={disabled || readonly}
                    onClick={() => setOpen(true)}
                >
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="text-xs">{translate('Browse')}</span>
                </Button>
                {value && !readonly && !disabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onChange(undefined)}
                        title={translate('Clear')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            <PagePickerDialog
                isOpen={open}
                onClose={() => setOpen(false)}
                currentValue={value as string | undefined}
                onSelect={(page) => {
                    onChange(page?.id ?? undefined);
                    setOpen(false);
                }}
            />
        </div>
    );
};

export const PostPickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props;
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const v = value as string | undefined;
        if (!v) {
            setLabel(null);
            return;
        }
        (async () => {
            try {
                const data = (await fetchPostDetailsAPI(v)) as
                    | { title?: string; post?: { title?: string } }
                    | null
                    | undefined;
                const title = data?.title ?? data?.post?.title;
                if (!cancelled && title) setLabel(String(title));
            } catch {
                if (!cancelled) setLabel(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [value]);

    const display = value
        ? label
            ? `${label} (${String(value).slice(0, 8)}…)`
            : String(value)
        : '';

    return (
        <div className="space-y-1">
            <div className="flex gap-2">
                <Input
                    id={id}
                    readOnly
                    value={display}
                    placeholder={translate('No post selected')}
                    className="flex-1 font-mono text-[10px] h-8"
                    disabled={disabled}
                    onBlur={() => onBlur(id, value)}
                    onFocus={() => onFocus(id, value)}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-2"
                    disabled={disabled || readonly}
                    onClick={() => setOpen(true)}
                >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    <span className="text-xs">{translate('Browse')}</span>
                </Button>
                {value && !readonly && !disabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onChange(undefined)}
                        title={translate('Clear')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            <T>Select Post</T>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto -mx-2 px-2">
                        <PostPicker
                            onSelect={(postId) => {
                                onChange(postId);
                                setOpen(false);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export const FilePickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props;

    return (
        <div onBlur={() => onBlur(id, value)} onFocus={() => onFocus(id, value)}>
            <FilePickerField
                value={(value as string) || ''}
                onChange={(nextValue) => onChange(nextValue)}
                disabled={disabled}
                readonly={readonly}
                mode="pick"
                placeholder="home:/path"
            />
        </div>
    );
};

type CategoryUiOptions = {
    filterType?: string;
};

/**
 * RJSF widget wrapping CategoryPickerField. Stores selected category id (string).
 * Optional `ui:options.filterType` matches CategoryPickerField (e.g. "types", "pages").
 */
export const CategoryPickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus, schema, uiSchema } = props;
    const uiOptions = getUiOptions(uiSchema) as CategoryUiOptions;
    const filterType = uiOptions.filterType ?? (schema as { 'x-category-filter-type'?: string })?.['x-category-filter-type'];

    const v = value == null ? '' : String(value);

    if (readonly || disabled) {
        return (
            <div
                id={id}
                className="text-xs text-muted-foreground py-1"
                onBlur={() => onBlur(id, value)}
                onFocus={() => onFocus(id, value)}
            >
                {v || '—'}
            </div>
        );
    }

    return (
        <div onBlur={() => onBlur(id, value)} onFocus={() => onFocus(id, value)}>
            <CategoryPickerField value={v} onSelect={(categoryId) => onChange(categoryId || undefined)} filterType={filterType} />
        </div>
    );
};

/**
 * RJSF widget wrapping GroupPicker (single). Stores selected group name (string), matching GroupPicker onSelect.
 */
export const GroupPickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props;
    const v = value == null ? '' : String(value);

    if (readonly) {
        return (
            <div
                id={id}
                className="text-xs text-muted-foreground py-1"
                onBlur={() => onBlur(id, value)}
                onFocus={() => onFocus(id, value)}
            >
                {v || '—'}
            </div>
        );
    }

    return (
        <div
            className="[&_[role=combobox]]:min-h-8 [&_[role=combobox]]:px-2 [&_[role=combobox]]:py-1.5 [&_[role=combobox]]:text-xs"
            onBlur={() => onBlur(id, value)}
            onFocus={() => onFocus(id, value)}
        >
            <GroupPicker
                value={v || undefined}
                disabled={disabled}
                multi={false}
                onSelect={(groupName) => onChange(groupName || undefined)}
            />
        </div>
    );
};

export const ImageWidget = (props: WidgetProps) => {
    const {
        id,
        value,
        readonly,
        disabled,
        onChange,
        onBlur,
        onFocus,
    } = props;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [picture, setPicture] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Fetch picture details if value exists
    useEffect(() => {
        const fetchPicture = async () => {
            if (!value) {
                setPicture(null);
                return;
            }

            // If we already have the picture and IDs match, don't re-fetch
            if (picture && picture.id === value) return;

            setLoading(true);
            try {
                const data = await fetchPictureById(value);
                setPicture(data);
            } catch (error) {
                console.error("Error fetching picture:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPicture();
    }, [value]);

    const handleSelectPicture = (selectedPicture: any) => {
        onChange(selectedPicture.id);
        setPicture(selectedPicture);
        setIsDialogOpen(false);
    };

    const handleClear = () => {
        onChange(undefined);
        setPicture(null);
    };

    return (
        <div className="space-y-2">
            {!value ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed flex flex-col gap-2 items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    onClick={() => setIsDialogOpen(true)}
                    disabled={disabled || readonly}
                >
                    <ImageIcon className="h-8 w-8 opacity-50" />
                    <span className="text-xs">Select Image</span>
                </Button>
            ) : (
                <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/30">
                    <div className="aspect-video w-full max-w-sm relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : picture ? (
                            <div className="w-full h-full relative">
                                <img
                                    src={picture.image_url}
                                    alt={picture.title || 'Selected image'}
                                    className="w-full h-full object-contain bg-black/5"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate">
                                    {picture.title}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                Image ID: {value} (Loading or Not Found)
                            </div>
                        )}
                    </div>

                    {/* Actions Overlay */}
                    {!readonly && !disabled && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 shadow-sm"
                                onClick={() => setIsDialogOpen(true)}
                                title="Change Image"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7 shadow-sm"
                                onClick={handleClear}
                                title="Remove Image"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <ImagePickerDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSelectPicture={handleSelectPicture}
                currentValue={value}
            />
        </div>
    );
};

/**
 * RJSF widget wrapping UserPicker. Stores selected user id (string).
 */
export const UserPickerWidget = (props: WidgetProps) => {
    const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props;
    const v = value == null ? '' : String(value);

    if (readonly) {
        return (
            <div
                id={id}
                className="text-xs text-muted-foreground py-1"
                onBlur={() => onBlur(id, value)}
                onFocus={() => onFocus(id, value)}
            >
                {v || '—'}
            </div>
        );
    }

    return (
        <div
            className="[&_button]:h-8 [&_button]:text-xs [&_button]:font-normal"
            onBlur={() => onBlur(id, value)}
            onFocus={() => onFocus(id, value)}
        >
            <UserPicker
                value={v || undefined}
                disabled={disabled}
                onSelect={(userId) => onChange(userId || undefined)}
            />
        </div>
    );
};

// --- Widget Group Options ---

/** What is persisted in form data for each ui:widget (for authors / codegen). */
export const APP_PICKER_STORAGE_HINT: Record<string, string> = {
    pagePicker: 'Page UUID',
    postPicker: 'Post UUID',
    filePicker: 'VFS location as mount:path or mount:dir/file.ext',
    categoryPicker: 'Category UUID',
    userPicker: 'User id (UUID)',
    groupPicker: 'ACL group name (string)',
};

export const APP_PICKER_WIDGET_GROUPS = [
    {
        label: 'App pickers',
        options: [
            { value: 'pagePicker', label: 'Page (ID)', types: ['string'] as const },
            { value: 'postPicker', label: 'Post (ID)', types: ['string'] as const },
            { value: 'filePicker', label: 'VFS file / path', types: ['string'] as const },
        ],
    },
] as const;

/** Drag palette + default JSON keys when dropping onto a structure */
export const APP_PICKER_PALETTE_ENTRIES = [
    { widget: 'pagePicker' as const, defaultFieldName: 'pageId', paletteTitle: 'Page (ID)' },
    { widget: 'postPicker' as const, defaultFieldName: 'postId', paletteTitle: 'Post (ID)' },
    { widget: 'filePicker' as const, defaultFieldName: 'filePath', paletteTitle: 'VFS file / path' },
] as const;

/**
 * Array field "Items Type" — string items plus a per-item ui:widget (same widgets as single-field pickers).
 */
export const ARRAY_ITEMS_APP_PICKER_ENTRIES = [
    { widget: 'categoryPicker' as const, label: 'Category' },
    { widget: 'userPicker' as const, label: 'User' },
    { widget: 'groupPicker' as const, label: 'Group' },
    { widget: 'pagePicker' as const, label: 'Page (ID)' },
    { widget: 'postPicker' as const, label: 'Post (ID)' },
    { widget: 'filePicker' as const, label: 'VFS file / path' },
] as const;

export const ARRAY_ITEMS_APP_PICKER_WIDGETS: ReadonlySet<string> = new Set(
    ARRAY_ITEMS_APP_PICKER_ENTRIES.map((e) => e.widget)
);
