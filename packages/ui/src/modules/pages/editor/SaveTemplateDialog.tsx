import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { T, translate } from '@/i18n';

interface SaveTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle><T>Save as New Template</T></DialogTitle>
                    <DialogDescription>
                        <T>Enter a unique name for your new layout template.</T>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={translate("Template Name")}
                            className="col-span-4"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}><T>Cancel</T></Button>
                    <Button onClick={handleSave} disabled={!name.trim()}><T>Save</T></Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
