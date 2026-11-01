import React from 'react';
import type { WidgetProps, RegistryWidgetsType, ArrayFieldTemplateProps, ArrayFieldItemTemplateProps, IconButtonProps } from '@rjsf/utils';
import { getTemplate, getUiOptions, type FormContextType, type RJSFSchema, type StrictRJSFSchema } from '@rjsf/utils';
import CollapsibleSection from '@/components/CollapsibleSection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2, X } from 'lucide-react';

const iconBtn =
    'h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground hover:bg-muted';

/**
 * RJSF core ships Bootstrap + glyphicon icon buttons; we don't load those styles, so controls were effectively invisible.
 * These replace the array toolbar actions with shadcn + Lucide.
 */
function RjsfToolbarIconButton(
    props: IconButtonProps & {
        children: React.ReactNode;
        destructive?: boolean;
    }
) {
    const { className, disabled, onClick, title, id, children, destructive, registry: _r, uiSchema: _u, icon: _i, iconType: _it } = props;
    const label = typeof title === 'string' ? title : 'Action';
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            id={id}
            className={cn(
                iconBtn,
                destructive && 'text-destructive hover:text-destructive hover:bg-destructive/10',
                className
            )}
            disabled={disabled}
            onClick={onClick}
            title={label}
            aria-label={label}
        >
            {children}
        </Button>
    );
}

export function RjsfRemoveButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className} destructive>
            <Trash2 className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

export function RjsfMoveUpButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className}>
            <ChevronUp className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

export function RjsfMoveDownButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className}>
            <ChevronDown className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

export function RjsfCopyButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className}>
            <Copy className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

/** Used for additionalProperties and other add affordances that still use the default AddButton slot. */
export function RjsfAddIconButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className}>
            <Plus className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

export function RjsfClearButton<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: IconButtonProps<T, S, F>) {
    const { className, ...rest } = props;
    return (
        <RjsfToolbarIconButton {...rest} className={className}>
            <X className="h-3.5 w-3.5" />
        </RjsfToolbarIconButton>
    );
}

/** Partial overrides merged with @rjsf/core defaults (see Form registry merge). */
export const rjsfButtonTemplateOverrides = {
    RemoveButton: RjsfRemoveButton,
    MoveUpButton: RjsfMoveUpButton,
    MoveDownButton: RjsfMoveDownButton,
    CopyButton: RjsfCopyButton,
    AddButton: RjsfAddIconButton,
    ClearButton: RjsfClearButton,
};

// Utility function to convert camelCase to Title Case
const formatLabel = (str: string): string => {
    // Replace underscores and hyphens with spaces, add space before capitals
    return str
        .replace(/[_-]+/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^./, (char) => char.toUpperCase())
        .replace(/\s+/g, ' '); // Collapse multiple spaces
};

// Custom TextWidget using Tailwind/shadcn styling
const TextWidget = (props: WidgetProps) => {
    const {
        id,
        required,
        readonly,
        disabled,
        type,
        label,
        value,
        onChange,
        onBlur,
        onFocus,
        autofocus,
        options,
        schema,
        rawErrors = [],
    } = props;

    const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
        onChange(value === '' ? options.emptyValue : value);
    const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
        onBlur(id, value);
    const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
        onFocus(id, value);

    return (
        <input
            id={id}
            type={type || 'text'}
            className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            readOnly={readonly}
            disabled={disabled}
            autoFocus={autofocus}
            value={value || ''}
            required={required}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            aria-describedby={rawErrors.length > 0 ? `${id}-error` : undefined}
        />
    );
};

// Custom CheckboxWidget for toggle switches
const CheckboxWidget = (props: WidgetProps) => {
    const {
        id,
        value,
        disabled,
        readonly,
        label,
        onChange,
        onBlur,
        onFocus,
        autofocus,
        rawErrors = [],
    } = props;

    // Handle both boolean and string "true"/"false" values
    const isChecked = value === true || value === 'true';

    const _onChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        // Emit boolean to satisfy z.boolean() schema
        onChange(checked);
    };

    const _onBlur = () => onBlur(id, value);
    const _onFocus = () => onFocus(id, value);

    return (
        <div className="flex items-center">
            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                disabled={disabled || readonly}
                onClick={() => {
                    if (!disabled && !readonly) {
                        onChange(!isChecked);
                    }
                }}
                onBlur={_onBlur}
                onFocus={_onFocus}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${isChecked ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full  transition-transform
                        ${isChecked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
            <input
                type="checkbox"
                id={id}
                checked={isChecked}
                onChange={_onChange}
                disabled={disabled}
                readOnly={readonly}
                autoFocus={autofocus}
                className="sr-only"
                aria-describedby={rawErrors.length > 0 ? `${id}-error` : undefined}
            />
        </div>
    );
};

// Custom FieldTemplate
export const FieldTemplate = (props: any) => {
    const {
        id,
        classNames,
        label,
        help,
        required,
        description,
        errors,
        children,
        schema,
        displayLabel,
    } = props;

    // Format the label to be human-readable
    const formattedLabel = label ? formatLabel(label) : label;

    return (
        <div className={`w-full min-w-0 max-w-full ${classNames}`}>
            <div className="flex flex-col gap-1.5 mb-1 min-w-0">
                {displayLabel !== false && formattedLabel && schema?.type !== 'array' && (
                    <label
                        htmlFor={id}
                        className="text-xs font-semibold text-foreground/80"
                    >
                        {formattedLabel}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <div className="w-full">{children}</div>
            </div>
            {errors && errors.length > 0 && (
                <div id={`${id}-error`} className="mt-1 text-[11px] text-destructive font-medium">
                    {errors}
                </div>
            )}
            {help && <p className="mt-1 text-[11px] text-muted-foreground">{help}</p>}
        </div>
    );
};

// Custom ObjectFieldTemplate with Grouping Support
export const ObjectFieldTemplate = (props: any) => {
    const { properties, schema, uiSchema, title, description } = props;

    // Get custom classNames from uiSchema
    const customClassNames = uiSchema?.['ui:classNames'] || '';

    // Group properties based on uiSchema
    const groups: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    properties.forEach((element: any) => {
        // Skip if hidden widget
        if (uiSchema?.[element.name]?.['ui:widget'] === 'hidden') {
            return;
        }

        const groupName = uiSchema?.[element.name]?.['ui:group'];
        if (groupName) {
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(element);
        } else {
            ungrouped.push(element);
        }
    });

    const hasGroups = Object.keys(groups).length > 0;

    if (!hasGroups) {
        return (
            <div className="space-y-4 min-w-0 w-full">
                {description && (typeof description !== 'string' || description.trim()) && (
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                )}
                <div
                    className={
                        customClassNames ||
                        'grid grid-cols-1 gap-4 min-w-0 [grid-template-columns:minmax(0,1fr)]'
                    }
                >
                    {properties.map((element: any) => (
                        <div key={element.name} className="min-w-0 w-full max-w-full">
                            {element.content}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const innerGridClass =
        customClassNames ||
        'grid grid-cols-1 gap-4 min-w-0 [grid-template-columns:minmax(0,1fr)]';

    return (
        <div className="space-y-6 min-w-0 w-full">
            {props.description && (
                <p className="text-sm text-gray-600 mb-4">{props.description}</p>
            )}

            {/* Render Groups — bordered regions contain fields so grid/col-span-full cannot escape to an outer layout */}
            {hasGroups && (
                <div className="flex flex-col gap-4 min-w-0 w-full">
                    {Object.entries(groups).map(([groupName, elements]) => (
                        <CollapsibleSection
                            key={groupName}
                            title={groupName}
                            initiallyOpen={true}
                            minimal={true}
                            storageKey={`rjsf-object-group-${groupName}`}
                            className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden min-w-0 w-full"
                            headerClassName="flex justify-between items-center gap-2 px-3 py-2.5 cursor-pointer bg-muted/50 border-b border-border hover:bg-muted/70 transition-colors"
                            contentClassName="px-3 py-3 bg-muted/10 min-w-0 overflow-x-auto"
                        >
                            <div className={innerGridClass}>
                                {elements.map((element: any) => (
                                    <div key={element.name} className="min-w-0 w-full max-w-full">
                                        {element.content}
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    ))}
                </div>
            )}

            {/* Render Ungrouped Fields */}
            {ungrouped.length > 0 && (
                <div className={hasGroups ? innerGridClass : (customClassNames || innerGridClass)}>
                    {ungrouped.map((element: any) => (
                        <div key={element.name} className="min-w-0 w-full max-w-full">
                            {element.content}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * RJSF default ArrayFieldItemTemplate uses Bootstrap grid classes (col-xs-*); without Bootstrap the
 * remove/move toolbar collapses. This layout keeps item content + buttons visible (Tailwind).
 */
export function ArrayFieldItemTemplate<
    T = unknown,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = Record<string, unknown>,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
    const { children, className, buttonsProps, displayLabel, hasDescription, hasToolbar, registry, uiSchema } = props;
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
        'ArrayFieldItemButtonsTemplate',
        registry,
        uiOptions,
    );
    return (
        <div
            className={`${className ?? ''} flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3`.trim()}
        >
            <div className={`min-w-0 flex-1 ${hasToolbar ? '' : 'w-full'}`}>{children}</div>
            {hasToolbar && (
                <div
                    className={`flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:pt-0.5 ${displayLabel && hasDescription ? 'sm:mt-6' : displayLabel ? 'sm:mt-2' : ''}`}
                >
                    <ArrayFieldItemButtonsTemplate {...buttonsProps} />
                </div>
            )}
        </div>
    );
}

// Custom ArrayFieldTemplate for premium array management
export const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
    const { items, canAdd, onAddClick, title } = props;

    return (
        <div className="w-full min-w-0 max-w-full">
            {title && (
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
            <div className="space-y-2">
                {items.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-3 text-center border border-dashed rounded-md bg-muted/20">
                        No items yet. Click &quot;+ Add&quot; to create one.
                    </div>
                )}
                {items.map((element, idx) => (
                    <div
                        key={idx}
                        className="border rounded-md bg-background hover:border-primary/30 transition-colors p-3"
                    >
                        {element}
                    </div>
                ))}
            </div>
            {canAdd && (
                <button
                    type="button"
                    onClick={onAddClick}
                    className="mt-2 w-full py-1.5 text-xs font-medium border border-dashed rounded-md text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
                >
                    + Add Item
                </button>
            )}
        </div>
    );
};

// Custom widgets
import { FilePickerWidget, PagePickerWidget, PostPickerWidget, CategoryPickerWidget, GroupPickerWidget, UserPickerWidget, ImageWidget } from '@/modules/types/AppTypeWidgets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox as RadixCheckbox } from '@/components/ui/checkbox';

// Radix-based SelectWidget for enum fields
const SelectWidget = (props: WidgetProps) => {
    const {
        id,
        options,
        value,
        disabled,
        readonly,
        onChange,
    } = props;

    const { enumOptions } = options;

    return (
        <Select
            value={value ?? ''}
            onValueChange={(val) => onChange(val)}
            disabled={disabled || readonly}
        >
            <SelectTrigger id={id} className="h-7 text-xs">
                <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
                {(enumOptions as any[])?.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

// Radix-based CheckboxesWidget for flags fields
const CheckboxesWidget = (props: WidgetProps) => {
    const {
        id,
        options,
        value,
        disabled,
        readonly,
        onChange,
    } = props;

    const { enumOptions } = options;
    const selected: string[] = Array.isArray(value) ? value : [];

    const handleToggle = (optValue: string) => {
        if (disabled || readonly) return;
        const newValue = selected.includes(optValue)
            ? selected.filter(v => v !== optValue)
            : [...selected, optValue];
        onChange(newValue);
    };

    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-1">
            {(enumOptions as any[])?.map((opt: any) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                    <RadixCheckbox
                        id={`${id}-${opt.value}`}
                        checked={selected.includes(opt.value)}
                        onCheckedChange={() => handleToggle(opt.value)}
                        disabled={disabled || readonly}
                        className="h-3.5 w-3.5"
                    />
                    <label
                        htmlFor={`${id}-${opt.value}`}
                        className="text-xs text-foreground cursor-pointer select-none"
                    >
                        {opt.label}
                    </label>
                </div>
            ))}
        </div>
    );
};

export const customWidgets: RegistryWidgetsType = {
    TextWidget,
    CheckboxWidget,
    SelectWidget,
    CheckboxesWidget,
    ImageWidget,
    pagePicker: PagePickerWidget,
    postPicker: PostPickerWidget,
    filePicker: FilePickerWidget,
    categoryPicker: CategoryPickerWidget,
    userPicker: UserPickerWidget,
    groupPicker: GroupPickerWidget,
};

// Custom templates
export const customTemplates = {
    FieldTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemTemplate,
    ButtonTemplates: rjsfButtonTemplateOverrides,
};
