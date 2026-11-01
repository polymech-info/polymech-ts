import { TypeDefinition, createType } from './client-types';

/**
 * Maps a JSON Schema scalar type to the platform's primitive type name.
 * Handles the `type` field, `format` hints, and falls back to `string`.
 */
export function jsonSchemaTypeToPrimitive(prop: any): string {
    const t = prop?.type;
    const format = prop?.format;

    if (t === 'integer') return 'int';
    if (t === 'number') return 'float';
    if (t === 'boolean') return 'bool';
    if (t === 'array') return 'array';
    if (t === 'object') return 'object';
    // string with format hints
    if (t === 'string') {
        if (format === 'date-time' || format === 'date') return 'string';
        return 'string';
    }
    // anyOf / oneOf with null — treat as the non-null type
    if (Array.isArray(prop?.anyOf) || Array.isArray(prop?.oneOf)) {
        const variants: any[] = prop.anyOf || prop.oneOf;
        const nonNull = variants.find((v: any) => v.type !== 'null');
        if (nonNull) return jsonSchemaTypeToPrimitive(nonNull);
    }
    return 'string'; // safe fallback
}

export interface ImportResult {
    /** New structure type payload ready to POST to /api/types */
    payload: Record<string, any>;
    /** Fields that couldn't be resolved to a known primitive (skipped) */
    unresolved: string[];
}

/**
 * Converts a JSON Schema object into the `nested_fields` payload
 * accepted by `POST /api/types` (kind: "structure").
 *
 * @param schema    - A JSON Schema with `type: "object"` and `properties`
 * @param name      - Name to give the resulting structure type
 * @param types     - Full list of platform types (primitives + others)
 * @param description - Optional description
 */
export function jsonSchemaToStructurePayload(
    schema: any,
    name: string,
    types: TypeDefinition[],
    description?: string
): ImportResult {
    const properties: Record<string, any> = schema?.properties || {};
    const requiredFields: string[] = Array.isArray(schema?.required) ? schema.required : [];
    const unresolved: string[] = [];

    // Build a quick lookup: primitive name → type object
    const primitiveByName = new Map<string, TypeDefinition>();
    types.forEach(t => {
        if (t.kind === 'primitive') {
            primitiveByName.set(t.name.toLowerCase(), t);
        }
    });

    const nested_fields = Object.entries(properties)
        .map(([fieldName, propSchema], idx) => {
            const primitiveName = jsonSchemaTypeToPrimitive(propSchema as any);
            const primitiveType = primitiveByName.get(primitiveName);

            if (!primitiveType) {
                unresolved.push(fieldName);
                return null;
            }

            return {
                name: `${name}.${fieldName}`,
                field_name: fieldName,
                parent_type_id: primitiveType.id,
                description: (propSchema as any).description || (propSchema as any).title || `${fieldName} field`,
                required: requiredFields.includes(fieldName),
                default_value: (propSchema as any).default ?? null,
                order: idx,
                meta: {
                    uiSchema: {}
                },
                settings: {}
            };
        })
        .filter(Boolean);

    const payload = {
        name,
        kind: 'structure',
        description: description || schema?.description || schema?.title || '',
        visibility: 'public' as const,
        json_schema: schema,
        nested_fields
    };

    return { payload, unresolved };
}

/**
 * One-shot helper: parse a JSON Schema string, build the payload, and POST it.
 * Returns the created TypeDefinition.
 */
export async function importJsonSchemaAsStructure(
    schemaJson: string,
    name: string,
    types: TypeDefinition[],
    description?: string
): Promise<{ type: any; unresolved: string[] }> {
    let schema: any;
    try {
        schema = JSON.parse(schemaJson);
    } catch {
        throw new Error('Invalid JSON — could not parse schema');
    }

    if (schema.type !== 'object' && !schema.properties) {
        throw new Error('Schema must be a JSON Schema object (type: "object" with properties)');
    }

    const { payload, unresolved } = jsonSchemaToStructurePayload(schema, name, types, description);

    if ((payload.nested_fields as any[]).length === 0) {
        throw new Error('No resolvable fields found in schema properties');
    }

    const created = await createType(payload);
    return { type: created, unresolved };
}
