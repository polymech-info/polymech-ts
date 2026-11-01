import { create } from 'zustand';
import { BuilderMode, BuilderElement, EnumValueEntry, FlagValueEntry, BuilderOutput } from './types';

interface BuilderState {
    mode: BuilderMode;
    typeName: string;
    typeDescription: string;
    elements: BuilderElement[];
    selectedId: string | null;
    activeDragItem: BuilderElement | null;
    fieldsToDelete: string[];
    enumValues: EnumValueEntry[];
    flagValues: FlagValueEntry[];

    // Setters
    setMode: (mode: BuilderMode) => void;
    setTypeName: (name: string) => void;
    setTypeDescription: (desc: string) => void;
    setElements: (elements: BuilderElement[] | ((prev: BuilderElement[]) => BuilderElement[])) => void;
    setSelectedId: (id: string | null) => void;
    setActiveDragItem: (item: BuilderElement | null) => void;
    setFieldsToDelete: (fields: string[] | ((prev: string[]) => string[])) => void;
    setEnumValues: (values: EnumValueEntry[] | ((prev: EnumValueEntry[]) => EnumValueEntry[])) => void;
    setFlagValues: (values: FlagValueEntry[] | ((prev: FlagValueEntry[]) => FlagValueEntry[])) => void;

    // Actions
    deleteElement: (id: string) => void;
    removeElement: (id: string) => void;
    updateSelectedElement: (updates: Partial<BuilderElement>) => void;
    
    // Initializer
    initialize: (data?: BuilderOutput) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
    mode: 'structure',
    typeName: '',
    typeDescription: '',
    elements: [],
    selectedId: null,
    activeDragItem: null,
    fieldsToDelete: [],
    enumValues: [],
    flagValues: [],

    setMode: (mode) => set({ mode }),
    setTypeName: (typeName) => set({ typeName }),
    setTypeDescription: (typeDescription) => set({ typeDescription }),
    setElements: (updater) => set((state) => ({ 
        elements: typeof updater === 'function' ? updater(state.elements) : updater 
    })),
    setSelectedId: (selectedId) => set({ selectedId }),
    setActiveDragItem: (activeDragItem) => set({ activeDragItem }),
    setFieldsToDelete: (updater) => set((state) => ({
        fieldsToDelete: typeof updater === 'function' ? updater(state.fieldsToDelete) : updater
    })),
    setEnumValues: (updater) => set((state) => ({
        enumValues: typeof updater === 'function' ? updater(state.enumValues) : updater
    })),
    setFlagValues: (updater) => set((state) => ({
        flagValues: typeof updater === 'function' ? updater(state.flagValues) : updater
    })),

    deleteElement: (id) => set((state) => {
        const el = state.elements.find(e => e.id === id);
        const newFieldsToDelete = el && el.fieldTypeId ? [...state.fieldsToDelete, el.fieldTypeId] : state.fieldsToDelete;
        return {
            elements: state.elements.filter(e => e.id !== id),
            fieldsToDelete: newFieldsToDelete,
            selectedId: state.selectedId === id ? null : state.selectedId
        };
    }),

    removeElement: (id) => set((state) => ({
        elements: state.elements.filter(e => e.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId
    })),

    updateSelectedElement: (updates) => set((state) => ({
        elements: state.elements.map(e => e.id === state.selectedId ? { ...e, ...updates } : e)
    })),

    initialize: (data) => set({
        mode: data?.mode || 'structure',
        typeName: data?.name || '',
        typeDescription: data?.description || '',
        elements: data?.elements || [],
        enumValues: data?.enumValues || [],
        flagValues: data?.flagValues || [],
        selectedId: null,
        activeDragItem: null,
        fieldsToDelete: []
    })
}));
