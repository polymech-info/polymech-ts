import React, { useMemo } from 'react';
import { TypeForm } from '@/modules/types/TypeForm';
import type { TypeDefinition } from '@/modules/types/client-types';
import { Label } from '@/components/ui/label';
import { T } from '@/i18n';

const SingleTypeForm = ({
    typeId,
    typeDef,
    types,
    formData,
    onChange,
    disabled,
}: {
    typeId: string;
    typeDef: TypeDefinition;
    types: TypeDefinition[];
    formData: Record<string, unknown>;
    onChange: (fd: Record<string, unknown>) => void;
    disabled?: boolean;
}) => {
    return (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
            <Label className="text-sm font-semibold">
                {typeDef.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">({typeDef.kind})</span>
            </Label>
            <TypeForm
                typeDef={typeDef}
                types={types}
                formData={formData}
                disabled={disabled}
                readonly={disabled}
                omitExtraData
                liveValidate={false}
                onChange={({ formData: fd }) => onChange((fd || {}) as Record<string, unknown>)}
            >
                <span className="sr-only">.</span>
            </TypeForm>
        </div>
    );
};

export interface ProductTypeDataFormsProps {
    /** Structure (and other) type ids configured for this product */
    typeIds: string[];
    /** Full type registry from `fetchTypes()` — required so `TypeForm` can parse and resolve schemas. */
    types: TypeDefinition[];
    /** Per-type id → form payload (structure field values) */
    value: Record<string, Record<string, unknown>>;
    onChange: (typeId: string, formData: Record<string, unknown>) => void;
    disabled?: boolean;
}

/**
 * Renders one @rjsf form per assigned type so product settings can hold structured payloads
 * (e.g. pricing dimensions) defined in the type system.
 */
export const ProductTypeDataForms: React.FC<ProductTypeDataFormsProps> = ({
    typeIds,
    types,
    value,
    onChange,
    disabled,
}) => {
    const resolved = useMemo(() => {
        return typeIds
            .map((id) => ({ id, def: types.find((t) => t.id === id) }))
            .filter((x): x is { id: string; def: TypeDefinition } => !!x.def);
    }, [typeIds, types]);

    if (resolved.length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic py-2">
                <T>Assign structure types in Product Settings to edit type-based fields here.</T>
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {resolved.map(({ id, def }) => (
                <SingleTypeForm
                    key={id}
                    typeId={id}
                    typeDef={def}
                    types={types}
                    formData={value[id] ?? {}}
                    onChange={(fd) => onChange(id, fd)}
                    disabled={disabled}
                />
            ))}
        </div>
    );
};
