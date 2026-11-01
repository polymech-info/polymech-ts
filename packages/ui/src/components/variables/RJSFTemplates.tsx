import React from 'react';
import type { WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import CollapsibleSection from '../../components/CollapsibleSection';

// Utility function to convert camelCase to Title Case
const formatLabel = (str: string): string => {
    // Split on capital letters and join with spaces
    return str
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
        .trim();
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
    } = props;

    // Format the label to be human-readable
    const formattedLabel = label ? formatLabel(label) : label;

    return (
        <div className={`mb-4 ${classNames}`}>
            {formattedLabel && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium mb-1"
                >
                    {formattedLabel}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children}
            {errors && errors.length > 0 && (
                <div id={`${id}-error`} className="mt-1 text-sm text-red-600">
                    {errors}
                </div>
            )}
            {help && <p className="mt-1 text-sm text-gray-500">{help}</p>}
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
            <div className="space-y-4">
                {description && (typeof description !== 'string' || description.trim()) && (
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                )}
                <div className={customClassNames || 'grid grid-cols-1 gap-4'}>
                    {properties.map((element: any) => (
                        <div key={element.name} className="w-full">
                            {element.content}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {props.description && (
                <p className="text-sm text-gray-600 mb-4">{props.description}</p>
            )}

            {/* Render Groups */}
            {hasGroups && (
                <div className="flex flex-col gap-4">
                    {Object.entries(groups).map(([groupName, elements]) => (
                        <CollapsibleSection
                            key={groupName}
                            title={groupName}
                            initiallyOpen={true}
                            minimal={true}
                            storageKey={`competitor-search-group-${groupName}`}
                            className=""
                            headerClassName="flex justify-between items-center p-3 cursor-pointer hover:/50 transition-colors rounded-t-lg"
                            contentClassName="p-3"
                        >
                            <div className="grid grid-cols-1 gap-4">
                                {elements.map((element: any) => (
                                    <div key={element.name} className="w-full">
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
                <div className="grid grid-cols-1 gap-4">
                    {ungrouped.map((element: any) => (
                        <div key={element.name} className="w-full">
                            {element.content}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Custom widgets
export const customWidgets: RegistryWidgetsType = {
    TextWidget,
    CheckboxWidget,
};

// Custom templates
export const customTemplates = {
    FieldTemplate,
    ObjectFieldTemplate,
};
