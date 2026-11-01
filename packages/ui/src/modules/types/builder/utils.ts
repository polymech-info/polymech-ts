import { Type as TypeIcon, Hash, ToggleLeft, Box, List, FileJson } from 'lucide-react';
import { TypeDefinition } from '../client-types';
import { APP_PICKER_WIDGET_GROUPS } from '../AppTypeWidgets';

export function getIconForType(type: string | undefined) {
    if (!type) return FileJson;
    switch (type.toLowerCase()) {
        case 'string': return TypeIcon;
        case 'int':
        case 'float':
        case 'number': return Hash;
        case 'bool':
        case 'boolean': return ToggleLeft;
        case 'object': return Box;
        case 'array': return List;
        default: return FileJson;
    }
}

export const WIDGET_OPTIONS = [
    {
        label: 'Standard', options: [
            { value: 'text', label: 'Text Input', types: ['string', 'int', 'float', 'number'] },
            { value: 'textarea', label: 'Text Area', types: ['string'] },
            { value: 'password', label: 'Password', types: ['string'] },
            { value: 'email', label: 'Email', types: ['string'] },
            { value: 'uri', label: 'URL', types: ['string'] },
            { value: 'date', label: 'Date', types: ['string'] },
            { value: 'datetime', label: 'Date & Time', types: ['string'] },
            { value: 'time', label: 'Time', types: ['string'] },
            { value: 'color', label: 'Color Picker', types: ['string'] },
            { value: 'updown', label: 'Number (Up/Down)', types: ['int', 'float', 'number'] },
            { value: 'range', label: 'Range Slider', types: ['int', 'float', 'number'] },
            { value: 'radio', label: 'Radio Buttons', types: ['string', 'int', 'float', 'number', 'bool', 'boolean'] },
            { value: 'select', label: 'Dropdown (Select)', types: ['string', 'int', 'float', 'number', 'bool', 'boolean', 'enum'] },
            { value: 'checkbox', label: 'Checkbox', types: ['bool', 'boolean'] },
            { value: 'hidden', label: 'Hidden', types: ['string', 'int', 'float', 'number', 'bool', 'boolean'] },
            { value: 'file', label: 'File Upload', types: ['string'] },
        ]
    },
    {
        label: 'Custom', options: [
            { value: 'TextWidget', label: 'Custom Text (Styled)', types: ['string'] },
            { value: 'CheckboxWidget', label: 'Toggle Switch', types: ['bool', 'boolean'] },
            { value: 'ImageWidget', label: 'Image Picker', types: ['string'] },
            { value: 'categoryPicker', label: 'Category', types: ['string'] },
            { value: 'userPicker', label: 'User', types: ['string'] },
            { value: 'groupPicker', label: 'Group', types: ['string'] },
        ]
    },
    ...APP_PICKER_WIDGET_GROUPS,
];

export const resolvePrimitiveType = (typeName: string, types: TypeDefinition[]): string => {
    const primitives = ['string', 'int', 'float', 'number', 'bool', 'boolean', 'object', 'array', 'enum'];
    if (primitives.includes(typeName)) return typeName;

    const typeDef = types.find(t => t.name === typeName);
    if (!typeDef) return typeName;

    if (typeDef.kind === 'primitive') return typeDef.name;

    if (typeDef.parent_type_id) {
        const parentType = types.find(t => t.id === typeDef.parent_type_id);
        if (parentType) {
            return resolvePrimitiveType(parentType.name, types);
        }
    }

    return typeName;
};
