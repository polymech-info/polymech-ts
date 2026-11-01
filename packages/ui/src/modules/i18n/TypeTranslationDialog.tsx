import React from 'react';
import { Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { T, translate } from '@/i18n';
import { type Glossary } from './client-i18n';
import { TranslationsGrid, type TranslatableField } from './TranslationsGrid';

export interface StructureFieldInfo {
    fieldName: string;
    title: string;
    description?: string;
}

export interface TypeTranslationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    typeId: string;
    typeName: string;
    typeDescription?: string;
    structureFields?: StructureFieldInfo[];
    sourceLang?: string;
    glossaries?: Glossary[];
}

export const TypeTranslationDialog: React.FC<TypeTranslationDialogProps> = ({
    open,
    onOpenChange,
    typeId,
    typeName,
    typeDescription,
    structureFields,
    sourceLang,
    glossaries,
}) => {
    const fields: TranslatableField[] = [];

    // Top-level type fields
    if (typeName) {
        fields.push({ label: translate('Name'), propPath: 'name', sourceText: typeName });
    }
    if (typeDescription) {
        fields.push({ label: translate('Description'), propPath: 'description', sourceText: typeDescription, multiline: true });
    }

    // Structure fields — each gets its own group
    if (structureFields) {
        const groupLabel = translate('Structure Fields');
        for (const sf of structureFields) {
            if (sf.title) {
                fields.push({
                    label: translate('Title'),
                    propPath: `fields.${sf.fieldName}.title`,
                    sourceText: sf.title,
                    group: groupLabel,
                });
            }
            if (sf.description) {
                fields.push({
                    label: translate('Description'),
                    propPath: `fields.${sf.fieldName}.description`,
                    sourceText: sf.description,
                    group: groupLabel,
                });
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-blue-500" />
                        <T>Type Translations</T>
                        <span className="text-sm font-normal text-muted-foreground">
                            — {typeName}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                    <TranslationsGrid
                        entityType="type"
                        entityId={typeId}
                        fields={fields}
                        sourceLang={sourceLang}
                        glossaries={glossaries}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
