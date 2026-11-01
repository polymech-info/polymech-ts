import React, { useState } from 'react';
import { T, translate } from '@/i18n';
import { Contact, ContactGroup } from '@/modules/contacts/client-contacts';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Plus, Mail, Phone, Building2, Globe, Tag, Check, X, Users } from 'lucide-react';
import { STATUSES } from './StatusBadge';

export const EMPTY_CONTACT: Partial<Contact> = {
    name: '', first_name: '', last_name: '',
    emails: [], phone: '', organization: '', title: '',
    address: [], source: '', language: '', status: 'active',
    notes: '', tags: [], meta: {},
};

interface ContactFormProps {
    initial: Partial<Contact>;
    onSave: (c: Partial<Contact>, groupIds: string[]) => void;
    onCancel: () => void;
    saving: boolean;
    groups: ContactGroup[];
    initialGroupIds: string[];
}

export const ContactForm = ({
    initial, onSave, onCancel, saving,
    groups, initialGroupIds,
}: ContactFormProps) => {
    const [c, setC] = useState<Partial<Contact>>(initial);
    const [emailInput, setEmailInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set(initialGroupIds));

    const set = (k: keyof Contact, v: any) => setC(prev => ({ ...prev, [k]: v }));

    const toggleGroup = (id: string) =>
        setSelectedGroupIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });

    const addEmail = () => {
        if (!emailInput.trim()) return;
        set('emails', [...(c.emails || []), { email: emailInput.trim(), label: 'INTERNET', primary: !(c.emails?.length) }]);
        setEmailInput('');
    };
    const removeEmail = (i: number) => set('emails', (c.emails || []).filter((_, idx) => idx !== i));

    const addTag = () => {
        if (!tagInput.trim()) return;
        set('tags', [...(c.tags || []), tagInput.trim()]);
        setTagInput('');
    };
    const removeTag = (t: string) => set('tags', (c.tags || []).filter(x => x !== t));

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label><T>First name</T></Label>
                    <Input value={c.first_name || ''} onChange={e => set('first_name', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label><T>Last name</T></Label>
                    <Input value={c.last_name || ''} onChange={e => set('last_name', e.target.value)} />
                </div>
            </div>

            <div className="space-y-1">
                <Label><T>Display name</T></Label>
                <Input value={c.name || ''} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /><T>Emails</T></Label>
                <div className="flex gap-2">
                    <Input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                        placeholder={translate('email@example.com')} />
                    <Button type="button" size="sm" variant="outline" onClick={addEmail}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(c.emails || []).map((em, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                            {em.email}
                            {em.primary && <span className="text-[10px] ml-0.5 text-muted-foreground">★</span>}
                            <button onClick={() => removeEmail(i)}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /><T>Phone</T></Label>
                    <Input value={c.phone || ''} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="flex items-center gap-1"><Building2 className="h-3 w-3" /><T>Organization</T></Label>
                    <Input value={c.organization || ''} onChange={e => set('organization', e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label><T>Title</T></Label>
                    <Input value={c.title || ''} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /><T>Language</T></Label>
                    <Input value={c.language || ''} onChange={e => set('language', e.target.value)} placeholder={translate('en, de…')} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label><T>Source</T></Label>
                    <Input value={c.source || ''} onChange={e => set('source', e.target.value)} placeholder={translate('import, manual…')} />
                </div>
                <div className="space-y-1">
                    <Label><T>Status</T></Label>
                    <Select value={c.status || 'active'} onValueChange={v => set('status', v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{translate(s)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Tag className="h-3 w-3" /><T>Tags</T></Label>
                <div className="flex gap-2">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder={translate('Add tag…')} />
                    <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map(t => (
                        <Badge key={t} variant="outline" className="flex items-center gap-1">
                            {t}<button onClick={() => removeTag(t)}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label><T>Notes</T></Label>
                <Textarea rows={2} value={c.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>

            {groups.length > 0 && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Users className="h-3 w-3" /><T>Groups</T></Label>
                    <div className="flex flex-wrap gap-1.5">
                        {groups.map(g => {
                            const checked = selectedGroupIds.has(g.id);
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => toggleGroup(g.id)}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${checked
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                        }`}
                                >
                                    {g.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}><T>Cancel</T></Button>
                <Button onClick={() => {
                    // Auto-add pending email if user forgot to press +
                    let toSave = c;
                    if (emailInput.trim()) {
                        const updatedEmails = [...(c.emails || []), { email: emailInput.trim(), label: 'INTERNET', primary: !(c.emails?.length) }];
                        toSave = { ...c, emails: updatedEmails };
                    }
                    onSave(toSave, Array.from(selectedGroupIds));
                }} disabled={saving}>
                    <Check className="h-3 w-3 mr-1" /><T>{saving ? 'Saving…' : 'Save'}</T>
                </Button>
            </DialogFooter>
        </div>
    );
};
