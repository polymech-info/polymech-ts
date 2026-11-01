import React, { useMemo } from 'react';
import { TypeDefinition } from '@/modules/types/client-types';
import { generateSchemaForType, generateUiSchemaForType, deepMergeUiSchema } from '@/modules/types/schema-utils';
import RJSFForm from '@/modules/types/RJSFForm';

export interface TypeFormProps extends Omit<React.ComponentProps<typeof RJSFForm>, 'schema' | 'uiSchema'> {
    /** The definition of the type to render */
    typeDef: TypeDefinition;
    /** The full registry of types, needed to resolve nested structures/enums */
    types: TypeDefinition[];
    /** Any additional uiSchema overrides to merge with the final generated uiSchema */
    uiSchemaOverrides?: Record<string, any>;
    /**
     * If true, validation is skipped if the generated schema is not an object.
     * Useful when we only want to render forms for objects (like in UserPageTypeFields).
     */
    requireObjectSchema?: boolean;
}

/**
 * A higher-order wrapper around RJSFFormWrapper that automatically generates
 * the JSON Schema and UI Schema from a Polymech `TypeDefinition`.
 */
export const TypeForm: React.FC<TypeFormProps> = ({
    typeDef,
    types,
    uiSchemaOverrides,
    requireObjectSchema,
    ...formProps
}) => {
    const jsonSchema = useMemo(() => generateSchemaForType(typeDef.id, types), [typeDef.id, types]);

    const uiSchema = useMemo(() => {
        const generatedUi = generateUiSchemaForType(typeDef.id, types);
        // Merge with the type's own UI schema metadata
        let merged = deepMergeUiSchema(generatedUi, typeDef.meta?.uiSchema || {});
        // Merge with any explicit overrides provided as props
        if (uiSchemaOverrides) {
            merged = deepMergeUiSchema(merged, uiSchemaOverrides);
        }
        return merged;
    }, [typeDef.id, types, typeDef.meta?.uiSchema, uiSchemaOverrides]);

    if (requireObjectSchema && jsonSchema.type !== 'object') {
        return null;
    }

    return (
        <RJSFForm
            schema={jsonSchema}
            uiSchema={uiSchema}
            {...formProps}
        />
    );
};

export default TypeForm;
