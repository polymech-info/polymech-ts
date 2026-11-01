export interface BuilderElement {
    id: string;
    type: string;
    name: string;
    description?: string;
    title?: string;
    jsonSchema?: any;
    uiSchema?: any;
    itemsTypeId?: string;
    refId?: string;
    fieldTypeId?: string;
    required?: boolean;
    defaultValue?: any;
    group?: string;
}

export type BuilderMode = 'structure' | 'alias' | 'enum' | 'flags';

export interface EnumValueEntry {
    value: string;
    label: string;
    order: number;
}

export interface FlagValueEntry {
    name: string;
    bit: number;
}

export interface BuilderOutput {
    mode: BuilderMode;
    elements: BuilderElement[];
    name: string;
    description?: string;
    fieldsToDelete?: string[];
    enumValues?: EnumValueEntry[];
    flagValues?: FlagValueEntry[];
}
