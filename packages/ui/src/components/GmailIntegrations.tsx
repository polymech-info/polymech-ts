/**
 * GmailIntegrations - manage connected IMAP mailboxes in Profile > Integrations
 * Supports both OAuth2 (Connect with Google) and App Password flows.
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Mail,
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wifi,
    WifiOff,
    Eye,
    EyeOff,
    KeyRound,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    listMailboxes,
    saveMailbox,
    deleteMailbox,
    testMailbox,
    getGmailAuthUrl,
    syncMailbox,
    stopSyncMailbox,
    resetSyncMailbox,
    type MailboxItem,
    type MailboxInput,
} from '@/modules/contacts/client-mailboxes';
import { fetchContactGroups, createContactGroup, type ContactGroup } from '@/modules/contacts/client-contacts';
import { useStream } from '@/contexts/StreamContext';

// Server base — requests go through Vite proxy /api → :3333
const SERVER_BASE = '';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
    if (status === 'syncing') return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"><Loader2 className="h-3 w-3 animate-spin" /> Syncing...</Badge>;
    if (status === 'synced') return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 className="h-3 w-3" /> Synced</Badge>;
    if (status === 'ok') return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
    if (status === 'error') return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>;
    return <Badge variant="secondary" className="gap-1"><WifiOff className="h-3 w-3" /> Not tested</Badge>;
}

// ─── Auth-type badge ───────────────────────────────────────────────────────────

function AuthBadge({ item }: { item: MailboxItem }) {
    if ((item as any).has_oauth2) return <Badge variant="outline" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3 text-green-500" />OAuth2</Badge>;
    if (item.has_password) return <Badge variant="outline" className="gap-1 text-xs"><KeyRound className="h-3 w-3" />App Password</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">No credentials</Badge>;
}

// ─── Add Mailbox Dialog (App Password path) ────────────────────────────────────

interface AddMailboxDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSaved: () => void;
}

const EMPTY_FORM: MailboxInput = {
    label: '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    user: '',
    password: '',
};

const AddMailboxDialog: React.FC<AddMailboxDialogProps> = ({ open, onOpenChange, onSaved }) => {
    const [form, setForm] = useState<MailboxInput>(EMPTY_FORM);
    const [showPass, setShowPass] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (open) { setForm(EMPTY_FORM); setShowPass(false); } }, [open]);

    const handleSave = async () => {
        if (!form.label.trim()) return toast.error('Label is required');
        if (!form.host.trim()) return toast.error('Host is required');
        if (!form.user.trim()) return toast.error('Email / username is required');
        if (!form.password?.trim()) return toast.error('App Password is required');

        setSaving(true);
        try {
            await saveMailbox(form);
            toast.success('Mailbox saved');
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save mailbox');
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof MailboxInput, value: any) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add IMAP Mailbox (App Password)</DialogTitle>
                    <DialogDescription>
                        For Gmail, generate an{' '}
                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline text-primary">
                            App Password
                        </a>{' '}
                        and use it below. Or use the OAuth2 button instead.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="mb-label">Label</Label>
                        <Input id="mb-label" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Work Gmail" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="mb-host">IMAP Host</Label>
                            <Input id="mb-host" value={form.host} onChange={e => set('host', e.target.value)} placeholder="imap.gmail.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mb-port">Port</Label>
                            <Input id="mb-port" type="number" value={form.port} onChange={e => set('port', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch id="mb-tls" checked={form.tls} onCheckedChange={v => set('tls', v)} />
                        <Label htmlFor="mb-tls">Use TLS / IMAPS</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mb-user">Email / Username</Label>
                        <Input id="mb-user" type="email" value={form.user} onChange={e => set('user', e.target.value)} placeholder="you@gmail.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mb-pass">App Password</Label>
                        <div className="relative">
                            <Input
                                id="mb-pass"
                                type={showPass ? 'text' : 'password'}
                                value={form.password || ''}
                                onChange={e => set('password', e.target.value)}
                                placeholder="xxxx xxxx xxxx xxxx"
                                className="pr-10"
                            />
                            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPass(p => !p)}>
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Stored securely — never returned after saving.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : 'Save Mailbox'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Sync Mailbox Dialog ──────────────────────────────────────────────────────

interface SyncMailboxDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    mailbox: MailboxItem | null;
    groups: ContactGroup[];
    onGroupCreated: (g: ContactGroup) => void;
    onStartSync: (mailboxId: string, groupId: string | undefined, deepScan: boolean) => void;
}

const SyncMailboxDialog: React.FC<SyncMailboxDialogProps> = ({ open, onOpenChange, mailbox, groups, onGroupCreated, onStartSync }) => {
    const [importGroupId, setImportGroupId] = useState<string>('__none');
    const [importNewGroupName, setImportNewGroupName] = useState<string>('');
    const [deepScan, setDeepScan] = useState(false);

    useEffect(() => {
        if (open) {
            setImportGroupId('__none');
            const d = new Date();
            setImportNewGroupName(`group-${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            setDeepScan(false);
        }
    }, [open]);

    const handleSync = async () => {
        if (!mailbox) return;
        let targetGroupId: string | undefined = undefined;

        if (importGroupId === '__new') {
            const groupName = importNewGroupName.trim();
            if (!groupName) return toast.error('Group name required');
            try {
                const newGroup = await createContactGroup({ name: groupName });
                onGroupCreated(newGroup);
                targetGroupId = newGroup.id;
            } catch (err: any) {
                return toast.error(`Failed to create group: ${err.message}`);
            }
        } else if (importGroupId !== '__none') {
            targetGroupId = importGroupId;
        }

        onStartSync(mailbox.id, targetGroupId, deepScan);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sync Contacts from {mailbox?.label}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground pt-1.5">
                        Harvest email addresses from this mailbox and add them to your contacts.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Destination Group</Label>
                        <Select value={importGroupId} onValueChange={setImportGroupId}>
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none">None (Don't Group)</SelectItem>
                                <SelectItem value="__new">+ Create New Group</SelectItem>
                                {groups.map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {importGroupId === '__new' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>New Group Name</Label>
                            <Input
                                value={importNewGroupName}
                                onChange={e => setImportNewGroupName(e.target.value)}
                                placeholder="Group name"
                            />
                        </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="deep-scan" checked={deepScan} onCheckedChange={(v) => setDeepScan(!!v)} />
                        <label
                            htmlFor="deep-scan"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Deep Scan (Slower)
                        </label>
                    </div>
                    {deepScan && (
                        <p className="text-xs text-muted-foreground">
                            Downloads full email bodies to search for email addresses and website URLs in signatures and text. Can take a long time on large mailboxes!
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSync}>Start Syncing</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const GmailIntegrations: React.FC = () => {
    const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const location = useLocation();

    // Sync State
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [syncMailboxTarget, setSyncMailboxTarget] = useState<MailboxItem | null>(null);
    const [syncProgress, setSyncProgress] = useState<Record<string, { status: string; current?: number; total?: number; message?: string }>>({});

    // Stream listener
    const { subscribe } = useStream();
    useEffect(() => {
        return subscribe((event) => {
            if (event.kind === 'system' && event.data?.type === 'contacts-sync-progress') {
                const { mailboxId, status, current, total, message } = event.data;
                setSyncProgress(prev => ({
                    ...prev,
                    [mailboxId]: {
                        status, current, total, message
                    }
                }));

                // Update the mailbox's internal `status` for the StatusBadge to reflect
                setMailboxes(prev => prev.map(mb => {
                    if (mb.id === mailboxId) {
                        let newStatus = mb.status;
                        if (status === 'completed') newStatus = 'synced';
                        else if (status === 'error') newStatus = 'error';
                        else newStatus = 'syncing'; // fetching, connecting, etc
                        return { ...mb, status: newStatus as any };
                    }
                    return mb;
                }));
            }
        });
    }, [subscribe]);

    // Handle OAuth2 callback result via URL params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const gmail = params.get('gmail');
        const msg = params.get('msg');
        if (gmail === 'connected') {
            toast.success('Gmail connected successfully!');
            // Clean the URL
            window.history.replaceState({}, '', location.pathname);
        } else if (gmail === 'error') {
            toast.error('Gmail connection failed: ' + (msg || 'Unknown error'));
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location]);

    const handleStopSync = async (id: string) => {
        try {
            await stopSyncMailbox(id);
            toast.success('Stop signal sent. Wait a moment for the process to halt.');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleResetSync = async (id: string) => {
        try {
            await resetSyncMailbox(id);
            toast.success('Sync state reset. Next sync will start from the beginning.');
            setSyncProgress(prev => { const n = { ...prev }; delete n[id]; return n; });
            await load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const list = await listMailboxes();
            setMailboxes(list.filter(mb => mb.type !== 'smtp'));
            const gs = await fetchContactGroups();
            setGroups(gs);
        } catch (err: any) {
            toast.error('Failed to load mailboxes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleStartSync = async (mailboxId: string, groupId: string | undefined, deepScan: boolean) => {
        try {
            setSyncProgress(prev => ({ ...prev, [mailboxId]: { status: 'initializing' } }));
            await syncMailbox(mailboxId, { groupId, deepScan });
            toast.success('Background sync started!');
        } catch (err: any) {
            toast.error(`Failed to start sync: ${err.message}`);
            setSyncProgress(prev => {
                const next = { ...prev };
                delete next[mailboxId];
                return next;
            });
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const { url } = await getGmailAuthUrl();
            if (url) window.location.href = url;
        } catch (err: any) {
            toast.error('Failed to start Google OAuth flow: ' + err.message);
        }
    };

    const handleTest = async (id: string) => {
        setTesting(id);
        try {
            const result = await testMailbox(id);
            if (result.ok) toast.success('Connection successful!');
            else toast.error('Connection failed: ' + (result.error || 'Unknown error'));
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
            toast.success('Mailbox removed');
            setMailboxes(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Connected Mailboxes</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        IMAP mailboxes for contact harvesting. Credentials stored securely.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleConnectGoogle} size="sm" variant="outline" className="gap-2">
                        {/* Google G logo — inline SVG to avoid extra deps */}
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Connect Gmail
                    </Button>
                    <Button onClick={() => setAddOpen(true)} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" /> App Password
                    </Button>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : mailboxes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                        <h3 className="font-semibold text-lg mb-1">No mailboxes connected</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Connect a Gmail inbox to start harvesting contacts from your emails.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleConnectGoogle} size="sm" className="gap-2">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Connect Gmail (OAuth2)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {mailboxes.map(mb => {
                        const progress = syncProgress[mb.id];
                        const isSyncing = progress && !['completed', 'error'].includes(progress.status);

                        return (
                            <Card key={mb.id} className="relative overflow-hidden">
                                {isSyncing && progress.total ? (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min(100, (progress.current! / progress.total!) * 100)}%` }}
                                        />
                                    </div>
                                ) : null}
                                <CardHeader className="pb-3 pt-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Mail className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{mb.label}</CardTitle>
                                                <CardDescription className="text-xs">{mb.user}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleTest(mb.id)} disabled={testing === mb.id || isSyncing} title="Test connection">
                                                {testing === mb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(mb.id)} disabled={deleting === mb.id || isSyncing} title="Remove mailbox">
                                                {deleting === mb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Status</span>
                                            <StatusBadge status={mb.status} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Auth</span>
                                            <AuthBadge item={mb} />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between pt-1">
                                        {isSyncing ? (
                                            <div className="flex flex-col gap-1 w-full mr-4">
                                                <div className="flex items-center text-xs text-primary font-medium animate-pulse">
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                    {progress.status === 'initializing' && 'Preparing sync...'}
                                                    {progress.status === 'caching-contacts' && 'Loading address book...'}
                                                    {progress.status === 'connecting' && 'Connecting to IMAP...'}
                                                    {progress.message ? progress.message : (progress.status === 'fetching' ? 'Fetching emails...' : '')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground w-full mr-4">
                                                {progress?.status === 'completed' && <span className="text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> {progress.message || 'Sync complete'}</span>}
                                                {progress?.status === 'error' && <span className="text-destructive">Sync failed: {progress.message}</span>}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {isSyncing ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="shrink-0 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                                                    onClick={() => handleStopSync(mb.id)}
                                                >
                                                    Stop Sync
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="shrink-0 h-8 w-8 p-0 text-muted-foreground"
                                                        title="Reset sync state (re-scan from beginning)"
                                                        onClick={() => handleResetSync(mb.id)}
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="shrink-0"
                                                        disabled={mb.status === 'error'}
                                                        onClick={() => { setSyncMailboxTarget(mb); setSyncDialogOpen(true); }}
                                                    >
                                                        Sync Contacts
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Info card */}
            <Card className="bg-muted/40 border-dashed">
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Connection options</p>
                    <p><strong>OAuth2 (recommended):</strong> Click "Connect Gmail" — no password needed, Google authorizes directly.</p>
                    <p><strong>App Password:</strong> Enable IMAP in Gmail → Settings → Forwarding and POP/IMAP, then generate a password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline">myaccount.google.com/apppasswords</a>.</p>
                    <p className="pt-1 text-xs">Host: <code className="bg-muted px-1 rounded">imap.gmail.com</code> · Port: <code className="bg-muted px-1 rounded">993</code> · TLS: on</p>
                </CardContent>
            </Card>

            <AddMailboxDialog open={addOpen} onOpenChange={setAddOpen} onSaved={load} />
            <SyncMailboxDialog
                open={syncDialogOpen}
                onOpenChange={setSyncDialogOpen}
                mailbox={syncMailboxTarget}
                groups={groups}
                onGroupCreated={(g) => setGroups(prev => [...prev, g])}
                onStartSync={handleStartSync}
            />
        </div>
    );
};
