import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TypeDefinition, updateType, createType } from './client-types';
import { deepMergeUiSchema } from './schema-utils';
import { Card } from '@/components/ui/card';
import { toast } from "sonner";
import { T, translate } from '@/i18n';
import { TypeBuilder, BuilderOutput, BuilderElement, BuilderMode, TypeBuilderRef } from './builder/TypeBuilder';
import { TypeRenderer, TypeRendererRef } from './TypeRenderer';
import { RefreshCw, Save, Trash2, X, Play, Languages } from "lucide-react";
import { useActions } from '@/actions/useActions';
import { Action } from '@/actions/types';
import { TypeTranslationDialog } from '@/modules/i18n/TypeTranslationDialog';

/** 
 * Translates a single `structure_fields` database record into a `BuilderElement` that the DND visual builder can understand.
 * 
 * THE DIFFICULT PART:
 * 1. UI Schema Merging: The underlying specific `field_type` may have its own `uiSchema` defaults (e.g. `{"ui:widget": "textarea"}`).
 *    However, the parent structural type (`structureType`) can OVERRIDE this child's `uiSchema` specifically for this structure context. 
 *    Therefore, we must find the structure's `meta.uiSchema[field.field_name]`, and deeply merge it over the default field's `uiSchema`.
 * 2. Value Type resolution: A `field_type` in the DB is actually just a relational wrapper (e.g., `Profile.email`). 
 *    Its real type is often its `parent_type_id` (e.g., the primitive `String` type). We must traverse up to `parent_type_id` to get the core scalar or reference that the Builder expects.
 */
function structureFieldToBuilderElement(
    field: NonNullable<TypeDefinition['structure_fields']>[number],
    types: TypeDefinition[],
    structureType: TypeDefinition
): BuilderElement {
    const fieldType = types.find(t => t.id === field.field_type_id);
    const structureUi = structureType.meta?.uiSchema;
    let fieldSlice: Record<string, unknown> = {};
    if (structureUi && typeof structureUi === 'object' && structureUi !== null && field.field_name in structureUi) {
        const raw = (structureUi as Record<string, unknown>)[field.field_name];
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            fieldSlice = raw as Record<string, unknown>;
        }
    }
    const mergedUi = deepMergeUiSchema(fieldType?.meta?.uiSchema || {}, fieldSlice);
    const uiGroup = mergedUi['ui:group'];

    const reqList = structureType.json_schema?.required;
    const required = Array.isArray(reqList)
        ? reqList.includes(field.field_name)
        : (field.required || false);

    const defaultValue =
        field.default_value !== undefined && field.default_value !== null
            ? field.default_value
            : (fieldType?.settings?.default_value ?? fieldType?.meta?.default);

    // Value type (enum, flags, string, …) lives on the field type's parent — not on the field row name `Struct.field`
    const valueType = fieldType?.parent_type_id
        ? types.find(t => t.id === fieldType.parent_type_id && t.id !== fieldType?.id)
        : undefined;

    return {
        id: field.id || crypto.randomUUID(),
        name: field.field_name,
        type: valueType?.name || (typeof fieldType?.json_schema?.type === 'string' ? fieldType.json_schema.type : undefined) || 'string',
        refId: valueType?.id,
        fieldTypeId: fieldType?.id,
        title: field.field_name,
        description: fieldType?.description || '',
        uiSchema: mergedUi,
        itemsTypeId: fieldType?.settings?.items_type_id || undefined,
        required,
        defaultValue,
        group: fieldType?.settings?.group ?? (typeof uiGroup === 'string' ? uiGroup : undefined)
    } as BuilderElement;
}

export interface TypesEditorProps {
    types: TypeDefinition[];
    selectedType: TypeDefinition | null;
    isBuilding: boolean;
    onIsBuildingChange: (isBuilding: boolean) => void;
    onSave: () => void; // Callback to reload types
    onDeleteRaw: (id: string) => Promise<void | boolean>; // Renamed to clarify it's the raw delete function
}

/**
 * `TypesEditor`
 * 
 * This component acts as the main orchestrator for viewing and editing a specific `TypeDefinition`.
 * It manages the visual toggle switch between two distinct interfaces:
 *  - Visual Schema Editor (`TypeBuilder` + `TypeBuilderContent`): For drag-and-drop structural design.
 *  - JSON Schema / UI Schema Raw Editor (`TypeRenderer`): For raw schema/meta editing and preview generation.
 * 
 * Key Responsibilities:
 * 1. Bridging the gap between the relational nested row DB structures (`type_definitions`, `structure_fields`, `enum_values`, `flag_values`) 
 *    and the flat JSON-based `BuilderOutput` expected by the drag-and-drop interface.
 * 2. Managing global action injections (save, translate, preview) dependent on the current mode (`isBuilding`). 
 * 3. Bidirectional data hydration (DB -> Builder output) and serialization (Builder Output -> nested relational DB transactions).
 */
export const TypesEditor: React.FC<TypesEditorProps> = ({
    types,
    selectedType,
    isBuilding,
    onIsBuildingChange,
    onSave,
    onDeleteRaw
}) => {
    const [builderInitialData, setBuilderInitialData] = useState<BuilderOutput | undefined>(undefined);
    const [showTranslationDialog, setShowTranslationDialog] = useState(false);
    const rendererRef = useRef<TypeRendererRef>(null);
    const builderRef = useRef<TypeBuilderRef>(null);
    const { registerAction, updateAction, unregisterAction } = useActions();

    const handleEditVisual = useCallback(() => {
        if (!selectedType) return;

        // Convert current type to builder format
        const builderData: BuilderOutput = {
            mode: (['structure', 'alias', 'enum', 'flags'].includes(selectedType.kind) ? selectedType.kind : 'structure') as BuilderMode,
            name: selectedType.name,
            description: selectedType.description || '',
            elements: [],
            enumValues: [],
            flagValues: []
        };

        // For structures, convert structure_fields to builder elements
        if (selectedType.kind === 'structure' && selectedType.structure_fields) {
            builderData.elements = selectedType.structure_fields.map(field =>
                structureFieldToBuilderElement(field, types, selectedType)
            );
        }

        // For enums, populate enum values
        if (selectedType.kind === 'enum' && selectedType.enum_values) {
            builderData.enumValues = selectedType.enum_values.map((v: any, idx: number) => ({
                value: v.value || '',
                label: v.label || '',
                order: v.order ?? idx
            }));
        }

        // For flags, populate flag values
        if (selectedType.kind === 'flags' && selectedType.flag_values) {
            builderData.flagValues = selectedType.flag_values.map((v: any) => ({
                name: v.name || '',
                bit: v.bit ?? 0
            }));
        }

        setBuilderInitialData(builderData);
        onIsBuildingChange(true);
    }, [selectedType, types, onIsBuildingChange]);

    const getBuilderData = useCallback(() => {
        if (!selectedType) return undefined;
        const builderData: BuilderOutput = {
            mode: (['structure', 'alias', 'enum', 'flags'].includes(selectedType.kind) ? selectedType.kind : 'structure') as BuilderMode,
            name: selectedType.name,
            description: selectedType.description || '',
            elements: [],
            enumValues: [],
            flagValues: []
        };

        if (selectedType.kind === 'structure' && selectedType.structure_fields) {
            builderData.elements = selectedType.structure_fields.map(field =>
                structureFieldToBuilderElement(field, types, selectedType)
            );
        }

        if (selectedType.kind === 'enum' && selectedType.enum_values) {
            builderData.enumValues = selectedType.enum_values.map((v: any, idx: number) => ({
                value: v.value || '',
                label: v.label || '',
                order: v.order ?? idx
            }));
        }

        if (selectedType.kind === 'flags' && selectedType.flag_values) {
            builderData.flagValues = selectedType.flag_values.map((v: any) => ({
                name: v.name || '',
                bit: v.bit ?? 0
            }));
        }

        return builderData;
    }, [selectedType, types]);

    // Handler for Renderer Save
    const handleRendererSave = useCallback(async (jsonSchemaString: string, uiSchemaString: string) => {
        if (!selectedType) return;
        try {
            const jsonSchema = JSON.parse(jsonSchemaString);
            const uiSchema = JSON.parse(uiSchemaString);

            const payload: Record<string, unknown> = {
                json_schema: jsonSchema,
                meta: { ...selectedType.meta, uiSchema }
            };

            // Keep structure_fields.required in sync when JSON Schema has a top-level required array (same source of truth as the form).
            if (
                selectedType.kind === 'structure' &&
                selectedType.structure_fields?.length &&
                jsonSchema &&
                typeof jsonSchema === 'object' &&
                Array.isArray(jsonSchema.required)
            ) {
                const req = jsonSchema.required as string[];
                payload.structure_fields = selectedType.structure_fields.map((sf, idx) => ({
                    field_name: sf.field_name,
                    field_type_id: sf.field_type_id,
                    required: req.includes(sf.field_name),
                    order: sf.order ?? idx,
                    default_value: sf.default_value ?? null
                }));
            }

            await updateType(selectedType.id, payload);
            toast.success(translate("Type updated"));
            onSave();
        } catch (e) {
            console.error(e);
            toast.error(translate("Failed to update type"));
        }
    }, [selectedType, onSave]);

    // Handler for Builder Save
    /**
     * Serializes the `BuilderOutput` back into complex relational DB updates (`updateType`/`createType`).
     * 
     * THE DIFFICULT PART - Structure Mode:
     * When saving a 'structure', elements in the builder don't correspond to a single DB row.
     * Each element requires a UNIQUE nested `field_type` row (e.g., `User.Age`) which acts as the wrapper connecting
     * the root structure (`User`) to a generic primitive scalar parent type (`Integer`).
     * 
     * If an element's type was changed in the Builder (e.g., String -> Email), the parent_type_id of the intermediate
     * `field_type` row is updated to point to the new scalar base.
     * Furthermore, any custom constraint arrays defined top-level by the form (like `.required`) must be unpacked 
     * and pushed down to the specific `structure_fields.required` booleans to guarantee DB synchronization.
     */
    const handleBuilderSave = useCallback(async (output: BuilderOutput) => {
        if (selectedType) {
            // Editing existing type
            try {
                if (output.mode === 'enum') {
                    // Update enum values
                    const enumValues = (output.enumValues || []).map((v, idx) => ({
                        value: v.value,
                        label: v.label,
                        order: v.order ?? idx
                    }));
                    await updateType(selectedType.id, {
                        name: output.name,
                        description: output.description,
                        enum_values: enumValues
                    });
                } else if (output.mode === 'flags') {
                    // Update flag values
                    const flagValues = (output.flagValues || []).map(v => ({
                        name: v.name,
                        bit: v.bit
                    }));
                    await updateType(selectedType.id, {
                        name: output.name,
                        description: output.description,
                        flag_values: flagValues
                    });
                } else if (output.mode === 'structure') {
                    const nestedFields = output.elements.map((el, idx) => {
                        // Prefer the authoritative fieldTypeId set during hydration (structureFieldToBuilderElement).
                        // Fall back to name-based lookup only for safety (e.g. manually-constructed elements).
                        // Use selectedType.name (DB name) for the lookup — NOT output.name, which may differ if
                        // the user renamed the type in the builder.
                        const explicitId = (el as any).fieldTypeId as string | undefined;
                        const fieldType = explicitId
                            ? types.find(t => t.id === explicitId && t.kind === 'field')
                            : types.find(t => t.name === `${selectedType.name}.${el.name}` && t.kind === 'field');

                        // parentType: prefer refId (set when dragged from palette or loaded from DB via structureFieldToBuilderElement)
                        const parentType = (el as any).refId
                            ? types.find(t => t.id === (el as any).refId)
                            : fieldType?.parent_type_id
                                ? types.find(t => t.id === fieldType.parent_type_id)
                                : types.find(t => t.name === el.type);

                        if (!parentType) {
                            console.error(`Parent type not found: ${el.type} (refId: ${(el as any).refId}, fieldTypeId: ${explicitId})`);
                            return null;
                        }

                        const fieldMeta: any = { ...fieldType?.meta, uiSchema: el.uiSchema || {}, ...(el.defaultValue !== undefined && el.defaultValue !== '' ? { default: el.defaultValue } : {}) };
                        if (el.defaultValue === undefined || el.defaultValue === '') {
                            delete fieldMeta.default;
                        }

                        return {
                            // Send the explicit fieldTypeId so the server can UPDATE-in-place rather than INSERT.
                            // If fieldType is undefined (new field or stale ID gone from cache), id is undefined → INSERT.
                            id: fieldType?.id,
                            name: `${output.name}.${el.name}`,
                            field_name: el.name,
                            kind: 'field',
                            description: el.description || `Field ${el.name}`,
                            parent_type_id: parentType.id,
                            meta: fieldMeta,
                            settings: {
                                ...fieldType?.settings,
                                ...(el.itemsTypeId ? { items_type_id: el.itemsTypeId } : {}),
                                ...(el.defaultValue !== undefined && el.defaultValue !== '' ? { default_value: el.defaultValue } : { default_value: null }),
                                ...(el.group ? { group: el.group } : { group: null })
                            },
                            required: el.required || false,
                            default_value: el.defaultValue !== undefined && el.defaultValue !== '' ? el.defaultValue : null,
                            order: idx
                        };
                    }).filter(Boolean);

                    // Clean up json_schema
                    let updatedJsonSchema = selectedType.json_schema;
                    if (updatedJsonSchema && typeof updatedJsonSchema === 'object') {
                        updatedJsonSchema = { ...updatedJsonSchema };
                        if (updatedJsonSchema.properties) {
                            const newProps: any = {};
                            output.elements.forEach(el => {
                                if (updatedJsonSchema.properties[el.name]) {
                                    newProps[el.name] = updatedJsonSchema.properties[el.name];
                                }
                            });
                            updatedJsonSchema.properties = newProps;
                        }
                        if (Array.isArray(updatedJsonSchema.required)) {
                            updatedJsonSchema.required = updatedJsonSchema.required.filter((req: string) => 
                                output.elements.some(el => el.name === req)
                            );
                        }
                    }

                    // Clean up meta.uiSchema
                    let updatedMeta = selectedType.meta;
                    if (updatedMeta && typeof updatedMeta === 'object') {
                        updatedMeta = { ...updatedMeta };
                        if (updatedMeta.uiSchema) {
                            const newUiSchema: any = {};
                            for (const key in updatedMeta.uiSchema) {
                                if (key.startsWith('ui:')) {
                                    newUiSchema[key] = updatedMeta.uiSchema[key];
                                }
                            }
                            output.elements.forEach(el => {
                                if (updatedMeta.uiSchema[el.name]) {
                                    newUiSchema[el.name] = updatedMeta.uiSchema[el.name];
                                }
                            });
                            updatedMeta.uiSchema = newUiSchema;
                        }
                    }

                    await updateType(selectedType.id, {
                        name: output.name,
                        description: output.description,
                        nested_fields: nestedFields,
                        meta: updatedMeta,
                        json_schema: updatedJsonSchema,
                        fieldsToDelete: output.fieldsToDelete
                    });
                } else {
                    // Update non-structure types
                    await updateType(selectedType.id, {
                        name: output.name,
                        description: output.description,
                    });
                }

                toast.success(translate("Type updated"));
                setBuilderInitialData(undefined);
                onIsBuildingChange(false);
                onSave();
            } catch (error) {
                console.error("Failed to update type", error);
                toast.error(translate("Failed to update type"));
            }
        } else {
            // Creating new type
            try {
                const newType: any = {
                    name: output.name,
                    description: output.description,
                    kind: output.mode,
                };

                if (output.mode === 'enum') {
                    newType.enum_values = (output.enumValues || []).map((v, idx) => ({
                        value: v.value,
                        label: v.label,
                        order: v.order ?? idx
                    }));
                } else if (output.mode === 'flags') {
                    newType.flag_values = (output.flagValues || []).map(v => ({
                        name: v.name,
                        bit: v.bit
                    }));
                } else if (output.mode === 'structure') {
                    const nestedFields = output.elements.map((el, idx) => {
                        const parentType = (el as any).refId
                            ? types.find(t => t.id === (el as any).refId)
                            : types.find(t => t.name === el.type);

                        if (!parentType) {
                            throw new Error(`Parent type not found: ${el.type} (refId: ${(el as any).refId})`);
                        }

                        return {
                            name: `${output.name}.${el.name}`,
                            field_name: el.name,
                            kind: 'field',
                            description: el.description || `Field ${el.name}`,
                            parent_type_id: parentType.id,
                            meta: { uiSchema: el.uiSchema || {} },
                            settings: {
                                ...(el.itemsTypeId ? { items_type_id: el.itemsTypeId } : {})
                            },
                            required: el.required || false,
                            default_value: el.defaultValue !== undefined && el.defaultValue !== '' ? el.defaultValue : null,
                            order: idx
                        };
                    });

                    newType.nested_fields = nestedFields;
                }

                await createType(newType);
                toast.success(translate("Type created successfully"));
                setBuilderInitialData(undefined);
                onIsBuildingChange(false);
                onSave();
            } catch (error) {
                console.error("Failed to create type", error);
                toast.error(translate("Failed to create type"));
            }
        }
    }, [selectedType, types, onIsBuildingChange, onSave]);

    // Register Actions
    useEffect(() => {
        const actionsDef: Action[] = [
            {
                id: 'types.save',
                label: 'Save Changes',
                icon: Save,
                group: 'types',
                handler: async () => {
                    if (isBuilding) {
                        builderRef.current?.triggerSave();
                    } else {
                        rendererRef.current?.triggerSave();
                    }
                },
                shortcut: 'mod+s'
            },
            {
                id: 'types.delete',
                label: 'Delete',
                icon: Trash2,
                group: 'types',
                handler: async () => {
                    if (selectedType && confirm(translate("Are you sure you want to delete this type?"))) {
                        try {
                            await onDeleteRaw(selectedType.id);
                            toast.success(translate("Type deleted"));
                            onSave(); // Reload
                        } catch (e) {
                            console.error(e);
                            toast.error(translate("Failed to delete type"));
                        }
                    }
                }
            },
            {
                id: 'types.cancel',
                label: 'Cancel',
                icon: X,
                group: 'types',
                handler: () => {
                    onIsBuildingChange(false);
                }
            },
            {
                id: 'types.edit.visual',
                label: 'Visual Edit',
                icon: RefreshCw,
                group: 'types',
                handler: handleEditVisual
            },
            {
                id: 'types.preview.toggle',
                label: 'Preview',
                icon: Play,
                group: 'types',
                handler: () => {
                    rendererRef.current?.triggerPreview();
                },
                metadata: { active: false }
            },
            {
                id: 'types.translate',
                label: translate('Translate'),
                icon: Languages,
                group: 'types',
                handler: () => {
                    setShowTranslationDialog(true);
                }
            }
        ];

        actionsDef.forEach(registerAction);

        return () => {
            actionsDef.forEach(a => unregisterAction(a.id));
        };
    }, [registerAction, unregisterAction, isBuilding, selectedType, onSave, onDeleteRaw, handleEditVisual]);

    // Update action states/visibility
    useEffect(() => {
        updateAction('types.save', { disabled: (!selectedType && !isBuilding) });
        updateAction('types.delete', { disabled: !selectedType, visible: !isBuilding });
        updateAction('types.edit.visual', {
            visible: !isBuilding && ['structure', 'enum', 'flags', 'alias'].includes(selectedType?.kind || ''),
            disabled: false
        });
        updateAction('types.cancel', { visible: isBuilding });
        updateAction('types.preview.toggle', {
            visible: !isBuilding && ['structure', 'enum', 'flags'].includes(selectedType?.kind || '')
        });
        updateAction('types.translate', {
            visible: !isBuilding && !!selectedType,
            disabled: !selectedType
        });
    }, [selectedType, isBuilding, updateAction]);

    if (isBuilding) {
        return (
            <div className="h-full flex flex-col min-h-0 overflow-hidden">
                <TypeBuilder
                    ref={builderRef}
                    onSave={handleBuilderSave}
                    onCancel={() => {
                        onIsBuildingChange(false);
                        setBuilderInitialData(undefined);
                    }}
                    availableTypes={types}
                    types={types}
                    initialData={builderInitialData || getBuilderData()}
                    selectedType={selectedType}
                    onUpdateMeta={async (meta) => {
                        if (selectedType) {
                            await updateType(selectedType.id, { meta });
                            onSave();
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <Card className="flex bg-muted/30 flex-col h-full overflow-hidden border-0 shadow-none rounded-none w-full">
            {selectedType ? (
                <TypeRenderer
                    ref={rendererRef}
                    editedType={selectedType}
                    types={types}
                    onSave={handleRendererSave}
                />
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2 p-8 text-center bg-card">
                    <div className="bg-muted p-4 rounded-full mb-2">
                        <RefreshCw className="h-8 w-8 opacity-20" />
                    </div>
                    <h3 className="text-lg font-medium"><T>No Type Selected</T></h3>
                    <p className="max-w-sm text-sm"><T>Select a type from the sidebar to view its details, edit the schema, and preview the generated form.</T></p>
                </div>
            )}

            {/* Type Translation Dialog */}
            {showTranslationDialog && selectedType && (
                <TypeTranslationDialog
                    open={showTranslationDialog}
                    onOpenChange={setShowTranslationDialog}
                    typeId={selectedType.id}
                    typeName={selectedType.name}
                    typeDescription={selectedType.description || undefined}
                    structureFields={
                        selectedType.kind === 'structure' && selectedType.structure_fields
                            ? selectedType.structure_fields
                                .sort((a, b) => a.order - b.order)
                                .map(sf => {
                                    const fieldType = types.find(t => t.id === sf.field_type_id);
                                    const schemaProps = selectedType.json_schema?.properties?.[sf.field_name];
                                    return {
                                        fieldName: sf.field_name,
                                        title: schemaProps?.title || sf.field_name,
                                        description: schemaProps?.description || fieldType?.description || undefined,
                                    };
                                })
                            : undefined
                    }
                />
            )}
        </Card>
    );
};
