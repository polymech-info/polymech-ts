import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Plus, Users } from "lucide-react";
import { fetchContactGroups, createContactGroup, ContactGroup } from './client-contacts';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';

export interface ImportContactsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 
     * If 'callback', onImport is called with the final groupId.
     * If 'file', a file picker is shown, and onImport is called with (groupId, fileBody, format).
     */
    type: 'callback' | 'file';
    onImport: (groupId?: string, fileBody?: any, format?: 'json' | 'vcard') => Promise<{ imported: number; skipped: number }>;
    title?: string;
    description?: string;
    confirmLabel?: string;
}

export const ImportContactsDialog: React.FC<ImportContactsDialogProps> = ({
    open,
    onOpenChange,
    type,
    onImport,
    title = translate('Import Contacts'),
    description = translate('Select a destination group and start the import process.'),
    confirmLabel,
}) => {
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('none');
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetchingGroups, setFetchingGroups] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);

    const getDefaultGroupName = () => {
        const d = new Date();
        return `group-${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (open) {
            loadGroups();
            setResult(null);
            setSelectedGroupId('none');
            setNewGroupName(getDefaultGroupName());
        }
    }, [open]);

    const loadGroups = async () => {
        setFetchingGroups(true);
        try {
            const data = await fetchContactGroups();
            setGroups(data || []);
        } catch (error) {
            console.error('Failed to fetch contact groups:', error);
            toast.error('Failed to load contact groups');
        } finally {
            setFetchingGroups(false);
        }
    };

    const handleConfirm = async () => {
        if (type === 'file') {
            fileRef.current?.click();
        } else {
            executeImport();
        }
    };

    const executeImport = async (fileBody?: any, format?: 'json' | 'vcard') => {
        setLoading(true);
        try {
            let targetGroupId: string | undefined = undefined;

            if (selectedGroupId === '__new') {
                const groupName = newGroupName.trim() || getDefaultGroupName();
                const newGroup = await createContactGroup({ name: groupName });
                targetGroupId = newGroup.id;
                setGroups(prev => [...prev, newGroup]);
            } else if (selectedGroupId !== 'none') {
                targetGroupId = selectedGroupId;
            }

            const res = await onImport(targetGroupId, fileBody, format);
            setResult(res);
            toast.success(translate(`Imported {{count}} contacts successfully`).replace('{{count}}', String(res.imported)));
        } catch (error: any) {
            console.error('Import to contacts failed:', error);
            toast.error(error.message || translate('Failed to import contacts'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const isVcard = file.name.endsWith('.vcf') || file.type === 'text/vcard';
            const body = isVcard ? text : JSON.parse(text);
            const format = isVcard ? 'vcard' : 'json';
            
            await executeImport(body, format);
        } catch (err: any) {
            toast.error(`${translate('File parsing failed')}: ${err.message}`);
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const displayConfirmLabel = confirmLabel || (type === 'file' ? translate('Select File & Import') : translate('Start Import'));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label><T>Destination Group</T></Label>
                            <Select 
                                value={selectedGroupId} 
                                onValueChange={setSelectedGroupId}
                                disabled={loading || fetchingGroups}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={translate('None')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none"><T>{"None (Don\'t Group)"}</T></SelectItem>
                                    <SelectItem value="__new" className="text-primary font-medium">
                                        <Plus className="w-3 h-3 mr-2 inline" />
                                        <T>Create New Group...</T>
                                    </SelectItem>
                                    {groups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fetchingGroups && <p className="text-xs text-muted-foreground animate-pulse"><T>Loading groups...</T></p>}
                        </div>

                        {selectedGroupId === '__new' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label><T>New Group Name</T></Label>
                                <Input 
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder={translate('Enter group name...')}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg"><T>Import Complete</T></h3>
                            <p className="text-sm text-muted-foreground">
                                {result.imported} <T>contacts were added successfully.</T>
                                {result.skipped > 0 && ` (${result.skipped} ${translate('were skipped or already exist')}).`}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    {!result ? (
                        <>
                            {type === 'file' && (
                                <input 
                                    ref={fileRef} 
                                    type="file" 
                                    accept=".json,.vcf" 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                />
                            )}
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                <T>Cancel</T>
                            </Button>
                            <Button onClick={handleConfirm} disabled={loading || fetchingGroups}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {displayConfirmLabel}
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full" onClick={() => {
                            onOpenChange(false);
                        }}>
                            <T>Done</T>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
