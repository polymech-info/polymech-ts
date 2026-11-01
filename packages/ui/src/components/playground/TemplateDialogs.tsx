import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface TemplateDialogsProps {
    // Save Dialog
    isSaveDialogOpen: boolean;
    setIsSaveDialogOpen: (open: boolean) => void;
    newTemplateName: string;
    setNewTemplateName: (name: string) => void;
    handleSaveTemplate: () => void;

    // Paste JSON Dialog
    isPasteDialogOpen: boolean;
    setIsPasteDialogOpen: (open: boolean) => void;
    pasteJsonContent: string;
    setPasteJsonContent: (content: string) => void;
    handlePasteJson: () => void;
}

export const TemplateDialogs: React.FC<TemplateDialogsProps> = ({
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    newTemplateName,
    setNewTemplateName,
    handleSaveTemplate,
    isPasteDialogOpen,
    setIsPasteDialogOpen,
    pasteJsonContent,
    setPasteJsonContent,
    handlePasteJson
}) => {
    return (
        <>
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Layout Template</DialogTitle>
                        <DialogDescription>
                            Save the current layout configuration to your local browser storage.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="template-name" className="mb-2 block">Template Name</Label>
                        <Input
                            id="template-name"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="e.g., My Dashboard Layout"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Import Layout JSON</DialogTitle>
                        <DialogDescription>
                            Paste a raw JSON layout string below to import it into the playground.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="json-content" className="mb-2 block">JSON Content</Label>
                        <Textarea
                            id="json-content"
                            value={pasteJsonContent}
                            onChange={(e) => setPasteJsonContent(e.target.value)}
                            placeholder='{"containers": [...]}'
                            className="font-mono text-xs min-h-[300px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handlePasteJson}>Import Layout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
