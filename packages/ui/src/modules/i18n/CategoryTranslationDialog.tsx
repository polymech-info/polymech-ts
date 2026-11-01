import React from 'react';
import { Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { T, translate } from '@/i18n';
import { type Glossary } from './client-i18n';
import { TranslationsGrid, type TranslatableField } from './TranslationsGrid';

export interface CategoryTranslationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: string;
    categoryName: string;
    categoryDescription?: string;
    sourceLang?: string;
    glossaries?: Glossary[];
}

export const CategoryTranslationDialog: React.FC<CategoryTranslationDialogProps> = ({
    open,
    onOpenChange,
    categoryId,
    categoryName,
    categoryDescription,
    sourceLang,
    glossaries,
}) => {
    const fields: TranslatableField[] = [];

    if (categoryName) {
        fields.push({ label: translate('Name'), propPath: 'name', sourceText: categoryName });
    }
    if (categoryDescription) {
        fields.push({ label: translate('Description'), propPath: 'description', sourceText: categoryDescription, multiline: true });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-blue-500" />
                        <T>Category Translations</T>
                        <span className="text-sm font-normal text-muted-foreground">
                            — {categoryName}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                    <TranslationsGrid
                        entityType="category"
                        entityId={categoryId}
                        fields={fields}
                        sourceLang={sourceLang}
                        glossaries={glossaries}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
