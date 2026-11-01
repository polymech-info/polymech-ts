import React from 'react';
import { TypeDefinition } from './client-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TypeCategoryTree } from './TypeCategoryTree';
import { T } from '@/i18n'
interface TypesListProps {
    types: TypeDefinition[];
    selectedTypeId: string | null;
    onSelect: (type: TypeDefinition) => void;
    className?: string;
    onDelete?: (typeId: string) => void; // Optional if we want to support delete from list context
}

export const TypesList: React.FC<TypesListProps> = ({
    types,
    selectedTypeId,
    onSelect,
    className
}) => {
    return (
        <Card className={`flex flex-col min-h-0 ${className}`}>
            <CardHeader className="pb-3 border-b px-4 py-3">
                <CardTitle className="text-sm font-medium"><T>Available Types</T></CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-4">
                        <TypeCategoryTree
                            types={types}
                            excludeFieldTypes={true}
                            selectedId={selectedTypeId}
                            renderItem={(t) => (
                                <button
                                    onClick={() => onSelect(t)}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${selectedTypeId === t.id
                                            ? 'bg-secondary text-secondary-foreground font-medium'
                                            : 'hover:bg-muted text-muted-foreground'
                                        }`}
                                >
                                    <span className="truncate">{t.name}</span>
                                    {selectedTypeId === t.id && (
                                        <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            )}
                        />
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
