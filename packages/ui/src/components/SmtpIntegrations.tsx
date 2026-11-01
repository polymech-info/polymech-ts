/**
 * SmtpIntegrations - manage connected SMTP servers in Profile > SMTP Servers
 * Specialized for outgoing email campaigns.
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    WifiOff,
    Eye,
    EyeOff,
    Send
} from 'lucide-react';
import { toast } from 'sonner';
import {
    listMailboxes,
    saveMailbox,
    deleteMailbox,
    testMailbox,
    testSendMailbox,
    type MailboxItem,
    type MailboxInput,
} from '@/modules/contacts/client-mailboxes';

function StatusBadge({ status }: { status?: string }) {
    if (status === 'ok') return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Tested</Badge>;
    if (status === 'error') return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>;
    return <Badge variant="secondary" className="gap-1"><WifiOff className="h-3 w-3" /> Not tested</Badge>;
}

interface AddSmtpDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSaved: () => void;
    initial?: MailboxItem | null;
}

const EMPTY_FORM: MailboxInput = {
    label: '',
    host: 'smtp.mailersend.net',
    port: 587,
    tls: true,
    user: '',
    password: '',
    type: 'smtp',
    provider: 'mailersend_api'
};

const AddSmtpDialog: React.FC<AddSmtpDialogProps> = ({ open, onOpenChange, onSaved, initial }) => {
    const [form, setForm] = useState<MailboxInput>(EMPTY_FORM);
    const [showPass, setShowPass] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setShowPass(false);
        if (initial) {
            setForm({
                id: initial.id,
                label: initial.label || '',
                host: initial.host || '',
                port: initial.port || 587,
                tls: initial.tls !== false,
                user: initial.user || '',
                password: '',
                type: 'smtp',
                provider: initial.provider || 'generic',
            });
            return;
        }
        setForm(EMPTY_FORM);
    }, [open, initial]);

    const handleSave = async () => {
        if (!form.label.trim()) return toast.error('Label is required');
        const provider = form.provider || 'generic';
        if (provider !== 'mailersend_api' && !form.host.trim()) return toast.error('SMTP Host is required');
        if (!form.user.trim()) return toast.error('Username is required');
        if (!initial && !form.password?.trim()) return toast.error('Password/Token is required');

        setSaving(true);
        try {
            await saveMailbox({ ...form, type: 'smtp' });
            toast.success(initial ? 'SMTP Server updated' : 'SMTP Server saved');
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save SMTP server');
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof MailboxInput, value: any) => setForm(prev => ({ ...prev, [key]: value }));
    const provider = form.provider || 'generic';
    const isMailerSendSmtp = provider === 'mailersend';
    const isMailerSendApi = provider === 'mailersend_api';

    const setProvider = (nextProvider: 'generic' | 'mailersend' | 'mailersend_api') => {
        if (nextProvider === 'mailersend' || nextProvider === 'mailersend_api') {
            setForm(prev => ({
                ...prev,
                provider: nextProvider,
                host: 'smtp.mailersend.net',
                port: prev.port || 587,
                tls: true,
            }));
            return;
        }
        setForm(prev => ({
            ...prev,
            provider: nextProvider,
            host: prev.host === 'smtp.mailersend.net' ? '' : prev.host,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit Outgoing SMTP Server' : 'Add Outgoing SMTP Server'}</DialogTitle>
                    <DialogDescription>
                        Configure a dedicated SMTP server for sending bulk emails without polling restrictions (e.g. MailerSend, SendGrid).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant={isMailerSendApi ? 'default' : 'outline'} size="sm" onClick={() => setProvider('mailersend_api')}>
                                MailerSend API
                            </Button>
                            <Button type="button" variant={isMailerSendSmtp ? 'default' : 'outline'} size="sm" onClick={() => setProvider('mailersend')}>
                                MailerSend SMTP
                            </Button>
                            <Button type="button" variant={provider === 'generic' ? 'default' : 'outline'} size="sm" onClick={() => setProvider('generic')}>
                                Generic SMTP
                            </Button>
                        </div>
                        {(isMailerSendSmtp || isMailerSendApi) && (
                            <p className="text-xs text-muted-foreground">
                                Create API token in MailerSend first, then paste it below.
                                <a
                                    href="https://github.com/mailersend/mailersend-nodejs?tab=readme-ov-file#create-a-token"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline ml-1"
                                >
                                    Token guide
                                </a>
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mb-label">Account Label</Label>
                        <Input id="mb-label" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. MailerSend Account" />
                    </div>
                    {!isMailerSendApi && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="mb-host">SMTP Host</Label>
                                <Input id="mb-host" value={form.host} onChange={e => set('host', e.target.value)} placeholder="smtp.provider.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mb-port">Port</Label>
                                <Input id="mb-port" type="number" value={form.port} onChange={e => set('port', Number(e.target.value))} />
                            </div>
                        </div>
                    )}
                    {!isMailerSendApi && (
                        <div className="flex items-center gap-2">
                            <Switch id="mb-tls" checked={form.tls} onCheckedChange={v => set('tls', v)} />
                            <Label htmlFor="mb-tls">Use TLS / STARTTLS</Label>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="mb-user">{(isMailerSendSmtp || isMailerSendApi) ? 'From Email Address' : 'Username'}</Label>
                        <Input
                            id="mb-user"
                            type="text"
                            value={form.user}
                            onChange={e => set('user', e.target.value)}
                            placeholder={(isMailerSendSmtp || isMailerSendApi) ? 'sender@your-domain.com' : 'SMTP Username'}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mb-pass">{(isMailerSendSmtp || isMailerSendApi) ? 'MailerSend API Token' : 'Password / Bearer Token'}</Label>
                        <div className="relative">
                            <Input
                                id="mb-pass"
                                type={showPass ? 'text' : 'password'}
                                value={form.password || ''}
                                onChange={e => set('password', e.target.value)}
                                placeholder={(isMailerSendSmtp || isMailerSendApi) ? 'msl_...' : 'Token or password'}
                                className="pr-10"
                            />
                            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPass(p => !p)}>
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {initial && (
                            <p className="text-xs text-muted-foreground">
                                Leave empty to keep existing token.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : (initial ? 'Update SMTP' : 'Save SMTP')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface TestSendDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    mailbox: MailboxItem | null;
    onSent: () => void;
}

const TestSendDialog: React.FC<TestSendDialogProps> = ({ open, onOpenChange, mailbox, onSent }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('SMTP test email');
    const [message, setMessage] = useState('Hello! This is a test email from Polymech SMTP integration.');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTo('');
        setSubject('SMTP test email');
        setMessage('Hello! This is a test email from Polymech SMTP integration.');
    }, [open, mailbox?.id]);

    const handleSend = async () => {
        if (!mailbox) return;
        if (!to.trim()) return toast.error('Recipient email is required');
        setSending(true);
        try {
            const result = await testSendMailbox(mailbox.id, {
                to: to.trim(),
                subject: subject.trim(),
                message: message.trim(),
            });
            if (!result.ok) {
                toast.error(result.error || 'Failed to send test email');
                return;
            }
            toast.success(`Test email sent${result.messageId ? ` (${result.messageId})` : ''}`);
            onSent();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to send test email');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Send Test Email</DialogTitle>
                    <DialogDescription>
                        Send a real test message through {mailbox?.label || 'this SMTP server'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1">
                        <Label htmlFor="test-to">Recipient</Label>
                        <Input id="test-to" type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="you@domain.com" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="test-subject">Subject</Label>
                        <Input id="test-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="SMTP test email" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="test-message">Message</Label>
                        <Textarea id="test-message" value={message} onChange={e => setMessage(e.target.value)} rows={5} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sending}>
                        {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : 'Send Test Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const SmtpIntegrations: React.FC = () => {
    const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<MailboxItem | null>(null);
    const [testing, setTesting] = useState<string | null>(null);
    const [sendTarget, setSendTarget] = useState<MailboxItem | null>(null);
    const [sendOpen, setSendOpen] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await listMailboxes();
            setMailboxes(list.filter(mb => mb.type === 'smtp'));
        } catch (err: any) {
            toast.error('Failed to load SMTP servers: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleTest = async (id: string) => {
        setTesting(id);
        try {
            const result = await testMailbox(id);
            if (result.ok) toast.success('SMTP connection verified successfully.');
            else toast.error('Connection failed: ' + (result.error || 'Check credentials'));
            await load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setTesting(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await deleteMailbox(id);
            toast.success('SMTP server removed');
            setMailboxes(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">SMTP Sending Servers</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Configure dedicated SMTP accounts for outgoing email campaigns.
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)} size="sm" variant="default" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Server
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : mailboxes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Send className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                        <h3 className="font-semibold text-lg mb-1">No SMTP Servers Configured</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Add a custom SMTP provider (like Mailgun, SendGrid or MailerSend) to improve campaign deliverability and isolate senders.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {mailboxes.map(mb => (
                        <Card key={mb.id} className="relative overflow-hidden">
                            <CardHeader className="pb-3 pt-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                            <Send className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base truncate max-w-[200px]" title={mb.label}>{mb.label}</CardTitle>
                                            <CardDescription className="text-xs truncate max-w-[200px]" title={mb.user}>
                                                {mb.user}
                                                {mb.provider === 'mailersend_api' ? ' (MailerSend API)' : mb.provider === 'mailersend' ? ' (MailerSend SMTP)' : ''}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                setEditTarget(mb);
                                                setAddOpen(true);
                                            }}
                                            disabled={deleting === mb.id}
                                            title="Edit SMTP server"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => handleTest(mb.id)}
                                            disabled={testing === mb.id}
                                            title="Test SMTP connection"
                                        >
                                            {testing === mb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => {
                                                setSendTarget(mb);
                                                setSendOpen(true);
                                            }}
                                            title="Send test email"
                                        >
                                            Send Test
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(mb.id)} disabled={deleting === mb.id} title="Remove mailbox">
                                            {deleting === mb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-y-1">
                                    <div className="text-muted-foreground">Host</div>
                                    <div className="text-right tracking-tight">{mb.host}</div>
                                    <div className="text-muted-foreground">Port</div>
                                    <div className="text-right">{mb.port}</div>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <StatusBadge status={mb.status} />
                                </div>
                                {mb.lastError && (
                                    <p className="text-xs text-destructive">{mb.lastError}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AddSmtpDialog
                open={addOpen}
                onOpenChange={(v) => {
                    setAddOpen(v);
                    if (!v) setEditTarget(null);
                }}
                onSaved={load}
                initial={editTarget}
            />
            <TestSendDialog
                open={sendOpen}
                onOpenChange={(v) => {
                    setSendOpen(v);
                    if (!v) setSendTarget(null);
                }}
                mailbox={sendTarget}
                onSent={load}
            />
        </div>
    );
};
