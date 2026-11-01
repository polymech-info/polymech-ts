import { TypeDefinition } from '@/modules/types/client-types';

// Mapping from our primitive type names to JSON Schema types
export const primitiveToJsonSchema: Record<string, any> = {
    'string': { type: 'string' },
    'int': { type: 'integer' },
    'float': { type: 'number' },
    'bool': { type: 'boolean' },
    'boolean': { type: 'boolean' }, // Handle both just in case
    'array': { type: 'array', items: {} },
    'object': { type: 'object' },
    'enum': { type: 'string', enum: [] },
    'flags': { type: 'array', items: { type: 'string' } },
    'reference': { type: 'string' },
    'alias': { type: 'string' }
};

// Recursive function to generate schema for any type (primitive or structure)
export const generateSchemaForType = (typeId: string, types: TypeDefinition[], visited = new Set<string>()): any => {
    // Prevent infinite recursion for circular references
    if (visited.has(typeId)) {
        const cycleType = types.find(t => t.id === typeId);
        const path = Array.from(visited).map(id => types.find(t => t.id === id)?.name || id).join(' -> ');
        console.warn(`[schema] Circular reference detected at type: ${cycleType?.name || typeId} (kind: ${cycleType?.kind})\nResolution path: ${path} -> ${cycleType?.name || typeId}`);
        return { type: 'object', description: 'Circular reference detected' };
    }
    
    // Add to visited to catch loops through fields or aliases
    visited.add(typeId);

    const type = types.find(t => t.id === typeId);
    if (!type) return { type: 'string' };

    // Field rows wrap the actual value type (enum, flags, …) — resolve through parent
    if (type.kind === 'field' && type.parent_type_id) {
        return generateSchemaForType(type.parent_type_id, types, visited);
    }

    // If it's a primitive, return the JSON schema mapping
    if (type.kind === 'primitive') {
        return primitiveToJsonSchema[type.name] || { type: 'string' };
    }

    // If it's an enum, generate schema with actual enum values
    if (type.kind === 'enum') {
        const values = (type.enum_values || [])
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        const enumValues = values.map((v: any) => v.value);
        const enumNames = values.map((v: any) => v.label || v.value);
        return {
            type: 'string',
            enum: enumValues,
            enumNames: enumNames
        };
    }

    // If it's a flags type, generate schema with checkboxes (array of unique strings)
    if (type.kind === 'flags') {
        const values = (type.flag_values || [])
            .sort((a: any, b: any) => (a.bit ?? 0) - (b.bit ?? 0));
        const flagValues = values.map((v: any) => v.name);
        return {
            type: 'array',
            items: {
                type: 'string',
                enum: flagValues
            },
            uniqueItems: true
        };
    }

    // If it's a structure, recursively build its schema
    if (type.kind === 'structure' && type.structure_fields) {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        type.structure_fields.forEach(field => {
            const fieldType = types.find(t => t.id === field.field_type_id);
            if (fieldType) {
                // If the field type has a parent (it's a field definition), we need to resolve the parent's schema
                const typeToResolve = fieldType.parent_type_id
                    ? types.find(t => t.id === fieldType.parent_type_id)
                    : fieldType;

                if (typeToResolve) {
                    // Recursively generate schema
                    let fieldSchema = generateSchemaForType(typeToResolve.id, types, new Set(visited));

                    // If the resolved type is 'array', check for items_type_id in the field's settings
                    if (typeToResolve.name === 'array' || fieldSchema.type === 'array') {
                        const itemsTypeId = fieldType.settings?.items_type_id || fieldType.meta?.items_type_id;
                        if (itemsTypeId) {
                            const itemsSchema = generateSchemaForType(itemsTypeId, types, new Set(visited));
                            fieldSchema = {
                                ...fieldSchema,
                                items: itemsSchema
                            };
                        }
                    }

                    properties[field.field_name] = {
                        ...fieldSchema,
                        title: field.field_name,
                        ...(fieldType.description && { description: fieldType.description }),
                        ...(fieldType.settings?.default_value !== undefined && fieldType.settings?.default_value !== null && { default: fieldType.settings.default_value })
                    };
                    if (field.required) {
                        required.push(field.field_name);
                    }
                }
            }
        });

        return {
            type: 'object',
            properties,
            ...(required.length > 0 && { required })
        };
    }

    // Fallback for other kinds (alias, etc -> resolve to their target if possible, currently alias is just string for now)
    return type.json_schema || { type: 'string' };
};

// Recursive function to generate UI schema for a type
export const generateUiSchemaForType = (typeId: string, types: TypeDefinition[], visited = new Set<string>()): any => {
    if (visited.has(typeId)) {
        const cycleType = types.find(t => t.id === typeId);
        const path = Array.from(visited).map(id => types.find(t => t.id === id)?.name || id).join(' -> ');
        console.warn(`[uiSchema] Circular reference detected at type: ${cycleType?.name || typeId} (kind: ${cycleType?.kind})\nResolution path: ${path} -> ${cycleType?.name || typeId}`);
        return {};
    }
    visited.add(typeId);

    const type = types.find(t => t.id === typeId);
    if (!type) return {};

    if (type.kind === 'enum') {
        return { 'ui:widget': 'select' };
    }

    if (type.kind === 'flags') {
        return { 'ui:widget': 'checkboxes' };
    }

    if (type.kind !== 'structure' || !type.structure_fields) {
        return {};
    }

    visited.add(typeId);

    const uiSchema: Record<string, any> = {
        'ui:options': { orderable: false },
        'ui:classNames': 'grid grid-cols-1 gap-y-1'
    };

    type.structure_fields.forEach(field => {
        const fieldType = types.find(t => t.id === field.field_type_id);
        const parentType = fieldType?.parent_type_id
            ? types.find(t => t.id === fieldType.parent_type_id)
            : null;

        const isNestedStructure = parentType?.kind === 'structure';
        const isArray = parentType?.name === 'array' || parentType?.kind === 'primitive' && parentType?.name === 'array';
        const isEnum = parentType?.kind === 'enum';
        const isFlags = parentType?.kind === 'flags';
        const fieldUiSchema = {
            ...(fieldType?.meta?.uiSchema || {}),
            ...(fieldType?.settings?.group && { 'ui:group': fieldType.settings.group })
        };

        if (isEnum) {
            // Enum field — default to select widget if not overridden
            uiSchema[field.field_name] = {
                'ui:widget': 'select',
                ...fieldUiSchema,
            };
        } else if (isFlags) {
            // Flags field — default to checkboxes widget
            uiSchema[field.field_name] = {
                'ui:widget': 'checkboxes',
                'ui:classNames': 'col-span-full',
                ...fieldUiSchema,
            };
        } else if (isArray && fieldType) {
            // Array field — check if items are a structure and generate nested UI schema for items
            const itemsTypeId = fieldType.settings?.items_type_id || fieldType.meta?.items_type_id;
            if (itemsTypeId) {
                const itemsType = types.find(t => t.id === itemsTypeId);
                if (itemsType?.kind === 'structure') {
                    const itemsUiSchema = generateUiSchemaForType(itemsTypeId, types, new Set(visited));
                    const itemExtras =
                        fieldUiSchema.items && typeof fieldUiSchema.items === 'object'
                            ? fieldUiSchema.items
                            : {};
                    uiSchema[field.field_name] = {
                        ...fieldUiSchema,
                        items: {
                            ...itemsUiSchema,
                            'ui:label': false,
                            ...itemExtras
                        },
                        'ui:options': { orderable: false },
                        'ui:classNames': 'col-span-full'
                    };
                } else {
                    const itemExtras =
                        fieldUiSchema.items && typeof fieldUiSchema.items === 'object'
                            ? fieldUiSchema.items
                            : {};
                    uiSchema[field.field_name] = {
                        ...fieldUiSchema,
                        items: {
                            'ui:label': false,
                            ...itemExtras
                        },
                        'ui:options': { orderable: false },
                        'ui:classNames': 'col-span-full'
                    };
                }
            } else {
                uiSchema[field.field_name] = {
                    ...fieldUiSchema,
                    'ui:options': { orderable: false },
                    'ui:classNames': 'col-span-full'
                };
            }
        } else if (isNestedStructure && parentType) {
            // Recursively generate UI schema for nested structure
            const nestedUiSchema = generateUiSchemaForType(parentType.id, types, new Set(visited));
            uiSchema[field.field_name] = {
                ...fieldUiSchema,
                ...nestedUiSchema,
                'ui:classNames': 'col-span-full border-t pt-4 mt-2'
            };
        } else {
            uiSchema[field.field_name] = fieldUiSchema;
        }
    });

    return uiSchema;
};

// Deep merge two UI schemas, prioritizing the source (override) but merging objects
export const deepMergeUiSchema = (target: any, source: any): any => {
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source === undefined ? target : source;
    }

    const output = { ...target };

    Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null && key in target) {
            output[key] = deepMergeUiSchema(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    });

    return output;
};
