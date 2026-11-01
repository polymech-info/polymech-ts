import React, { useEffect, useState } from 'react';
import { fetchTypes, deleteType, TypeDefinition } from './client-types';
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { T, translate } from '@/i18n';
import { TypesList } from './TypesList';
import { TypesEditor } from './TypesEditor';
import { useActions } from '@/actions/useActions';
import { Action } from '@/actions/types';
import { TypeEditorActions } from './TypeEditorActions';

const TypesPlayground: React.FC = () => {
    const [types, setTypes] = useState<TypeDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);

    const { registerAction, updateAction, unregisterAction } = useActions();

    const loadTypes = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTypes();
            // console.log('types', data);
            setTypes(data);
            if (selectedTypeId) {
                // Ensure selection is valid
                const exists = data.find(t => t.id === selectedTypeId);
                if (!exists) setSelectedTypeId(null);
            }
        } catch (error) {
            console.error("Failed to fetch types", error);
            toast.error(translate("Failed to load types"));
        } finally {
            setLoading(false);
        }
    }, [selectedTypeId]);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    const handleCreateNew = React.useCallback(() => {
        setSelectedTypeId(null);
        setIsBuilding(true);
    }, []);

    const handleSelectType = React.useCallback((t: TypeDefinition) => {
        setIsBuilding(false);
        setSelectedTypeId(t.id);
    }, []);

    // Register "New Type" action
    useEffect(() => {
        const action: Action = {
            id: 'types.new',
            label: 'New Type',
            icon: Plus,
            group: 'types',
            handler: handleCreateNew,
            shortcut: 'mod+n' // Or something else
        };

        registerAction(action);

        return () => unregisterAction('types.new');
    }, [registerAction, unregisterAction]);

    // Update "New Type" state
    useEffect(() => {
        updateAction('types.new', {
            disabled: isBuilding || loading,
            visible: !isBuilding // Hide when building to keep toolbar clean? Or just disable?
            // User requested "Gray out buttons", so maybe just disabled.
            // But if we hide it, we make space for other actions.
            // Let's decide to keep it visible but disabled if building, or hide it if we want to focus on editor actions.
            // Logic in TypesEditor hides some actions.
            // Let's hide 'types.new' when building to match 'cancel' appearing.
        });
    }, [isBuilding, loading, updateAction]);


    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold"><T>Types Editor</T></h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        <T>Manage and preview your type definitions</T>
                    </p>
                </div>
                <TypeEditorActions
                    actionIds={[
                        'types.new',
                        'types.edit.visual',
                        'types.preview.toggle',
                        'types.translate',
                        'types.delete',
                        'types.cancel',
                        'types.save'
                    ]}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 p-6">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-6 h-full">
                        {/* List Sidebar */}
                        <TypesList
                            types={types}
                            selectedTypeId={selectedTypeId}
                            onSelect={handleSelectType}
                            className={`col-span-3 ${isBuilding ? 'hidden' : ''}`}
                        />

                        {/* Main Content Area */}
                        <div className={`${isBuilding ? 'col-span-12' : 'col-span-9'} flex flex-col min-h-0 overflow-hidden`}>
                            <TypesEditor
                                types={types}
                                selectedType={types.find(t => t.id === selectedTypeId) || null}
                                isBuilding={isBuilding}
                                onIsBuildingChange={setIsBuilding}
                                onSave={loadTypes}
                                onDeleteRaw={deleteType}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TypesPlayground;
