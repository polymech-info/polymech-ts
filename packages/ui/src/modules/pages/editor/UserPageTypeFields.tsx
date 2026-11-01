import React, { useState, useEffect } from 'react';
import { TypeForm } from '@/modules/types/TypeForm';
import { TypeDefinition, fetchTypes } from '@/modules/types/client-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { useLayout } from '@/modules/layout/LayoutContext';
import { UpdatePageMetaCommand } from '@/modules/layout/commands';
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Settings, ChevronDown } from 'lucide-react';
import { TypesEditor } from '@/modules/types/TypesEditor';
import { TypeEditorActions } from '@/modules/types/TypeEditorActions';

interface UserPageTypeFieldsProps {
    pageId: string;
    pageMeta: any;
    assignedTypes: TypeDefinition[]; // These are resolved types from the server
    isEditMode: boolean;
    onMetaUpdate?: (newMeta: any) => void;
}

export const UserPageTypeFields: React.FC<UserPageTypeFieldsProps> = ({
    pageId,
    pageMeta,
    assignedTypes,
    isEditMode,
    onMetaUpdate
}) => {
    // We need all types to resolve schemas properly
    const { data: allTypes = [], isLoading: typesLoading } = useQuery({
        queryKey: ['types', 'all'],
        queryFn: async () => fetchTypes(),
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    const { executeCommand } = useLayout();

    // Local state for form data to allow changes before saving
    // We store type values in meta.typeValues = { [typeId]: { ...data } }
    const [formData, setFormData] = useState<Record<string, any>>(pageMeta?.typeValues || {});

    // Sync from props
    useEffect(() => {
        if (pageMeta?.typeValues) {
            setFormData(pageMeta.typeValues);
        }
    }, [pageMeta]);

    const handleFormChange = async (typeId: string, data: any) => {
        setFormData(prev => ({
            ...prev,
            [typeId]: data
        }));

        // Fire command immediately so page.meta stays in sync for global save
        const newTypeValues = {
            ...(pageMeta?.typeValues || {}),
            [typeId]: data
        };

        const newMeta = {
            ...(pageMeta || {}),
            typeValues: newTypeValues
        };

        const command = new UpdatePageMetaCommand(
            `page-${pageId}`,
            { meta: pageMeta || {} },
            { meta: newMeta },
            (updatedData) => {
                if (onMetaUpdate) onMetaUpdate(updatedData.meta);
            }
        );
        console.log("command", command);
        await executeCommand(command);
    };

    const [editingType, setEditingType] = useState<TypeDefinition | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);

    // We need to import these dynamically or at top level?
    // They are lazy loaded in UserPageEdit, so let's import them at top level for now, 
    // or use lazy here too if we want to code split. 
    // Since this component is already lazy loaded, direct import is fine.
    // However, for circular dependency avoidance (if any), let's check.
    // TypesEditor depends on TypesBuilder/Renderer. 
    // Let's assume direct import is safe.

    const handleEditType = (e: React.MouseEvent, type: TypeDefinition) => {
        e.stopPropagation();
        setEditingType(type);
        setIsBuilding(true);
    };

    const queryClient = useQueryClient();

    const handleTypeSave = () => {
        // Invalidate types query to refresh schema
        queryClient.invalidateQueries({ queryKey: ['types', 'all'] });

        // Also need to refresh the specific type in the list if name/desc changed
        // assignedTypes prop comes from parent, which comes from fetching page. 
        // If type definition changes, the page might not need update, but the schema does.
        // We might need to force re-render or refetch types.
        // The useQuery['types', 'all'] invalidation should trigger re-render of this component
        // because we use `allTypes` from that query.
    };

    if (assignedTypes.length === 0) return null;

    if (typesLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 mt-8">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4"><T>Type Properties</T></h2>

            <Accordion type="multiple" className="w-full" defaultValue={assignedTypes.map(t => t.id)} key={assignedTypes.map(t => t.id).join(',')}>
                {assignedTypes.map(type => {
                    const typeData = formData[type.id] || {};

                    return (
                        <AccordionItem key={type.id} value={type.id} className="border-b last:border-0 border-border">
                            {/* 
                                Fix for nested button warning:
                                Use an overlay pattern where the Trigger is absolute and sits behind the content.
                                The content is pointer-events-none, except for the interactive buttons which are pointer-events-auto.
                            */}
                            <AccordionPrimitive.Header className="relative flex items-center group hover:bg-muted/50 transition-colors">
                                <AccordionPrimitive.Trigger className="peer absolute inset-0 w-full h-full z-0 cursor-pointer" />

                                <div className="relative z-10 flex items-center justify-between w-full px-4 py-3 pointer-events-none">
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold text-sm tracking-tight">{type.name}</span>
                                        {type.description && (
                                            <span className="text-[10px] text-muted-foreground font-normal mt-0.5 max-w-[200px] truncate">
                                                {type.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {isEditMode && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-2 pointer-events-auto"
                                                onClick={(e) => handleEditType(e, type)}
                                                title="Edit Type Definition"
                                            >
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground peer-data-[state=open]:rotate-180" />
                                    </div>
                                </div>
                            </AccordionPrimitive.Header>
                            <AccordionContent className="px-4 pb-4 pt-2">
                                <TypeForm
                                    typeDef={type}
                                    types={allTypes}
                                    requireObjectSchema
                                    uiSchemaOverrides={{ 'ui:classNames': 'grid grid-cols-1 gap-y-1' }}
                                    formData={typeData}
                                    onChange={(e) => isEditMode && handleFormChange(type.id, e.formData)}
                                    readonly={!isEditMode}
                                    className={isEditMode ? "" : "pointer-events-none opacity-80"}
                                >
                                    {/* No submit button — changes are saved via the global save (Ctrl+S) */}
                                    <></>
                                </TypeForm>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            {/* Edit Type Dialog */}
            <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <DialogTitle><T>Edit Type</T>: {editingType?.name}</DialogTitle>
                        </div>
                        <div className="flex items-center gap-2 mr-8">
                            <TypeEditorActions
                                actionIds={[
                                    'types.save',
                                    'types.edit.visual',
                                    'types.preview.toggle',
                                    'types.cancel'
                                ]}
                            />
                        </div>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden bg-muted/10 p-4">
                        {editingType && (
                            <TypesEditor
                                types={allTypes}
                                selectedType={editingType}
                                isBuilding={isBuilding}
                                onIsBuildingChange={setIsBuilding}
                                onSave={handleTypeSave}
                                onDeleteRaw={async () => {
                                    toast.error(translate("Deleting currently used types is not recommended here."));
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
