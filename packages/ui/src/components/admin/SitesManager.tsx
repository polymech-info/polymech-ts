import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    MoreHorizontal, Plus, Globe, ChevronDown, Play, RefreshCw,
    Download, Clock, CheckCircle, XCircle, AlertTriangle, Archive, Layers,
} from 'lucide-react';
import {
    fetchSites, createSite, updateSite, deleteSite,
    fetchSiteEvents, importPleskJson, runSiteGenerator,
    type ManagedSite, type CreateSitePayload, type UpdateSitePayload,
    type SiteStatus, type SiteEvent, type RunGeneratorPayload,
} from '@/modules/admin/client-sites';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<SiteStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    active:       { label: 'Active',       variant: 'default',     icon: CheckCircle },
    provisioning: { label: 'Provisioning', variant: 'secondary',   icon: RefreshCw },
    suspended:    { label: 'Suspended',    variant: 'outline',     icon: AlertTriangle },
    archived:     { label: 'Archived',     variant: 'destructive', icon: Archive },
};

function StatusBadge({ status }: { status: SiteStatus }) {
    const m = STATUS_META[status] ?? STATUS_META.active;
    return (
        <Badge variant={m.variant} className="gap-1 text-xs">
            <m.icon className="h-3 w-3" />
            {m.label}
        </Badge>
    );
}

function safeJson(val: unknown): string {
    if (!val || (typeof val === 'object' && Object.keys(val as object).length === 0)) return '';
    try { return JSON.stringify(val, null, 2); } catch { return ''; }
}

function parseJsonField(raw: string): Record<string, unknown> | null {
    if (!raw.trim()) return {};
    try { return JSON.parse(raw); } catch { return null; }
}

const EMPTY_FORM: CreateSitePayload = {
    name: '', domain: '', display_name: '', admin_email: '', contact_email: '',
    service_url: '', client_url: '', infrastructure_dir: '', plesk_target: '',
    ssh_host: '', dns_zone: '', service_user: '', status: 'active',
    settings: {}, meta: {},
};

// ── Main component ────────────────────────────────────────────────────────────

const SitesManager = () => {
    const navigate = useNavigate();
    const [sites, setSites] = useState<ManagedSite[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [editingSite, setEditingSite] = useState<ManagedSite | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deletingSite, setDeletingSite] = useState<ManagedSite | null>(null);
    const [runSite, setRunSite] = useState<ManagedSite | null>(null);
    const [eventsSite, setEventsSite] = useState<ManagedSite | null>(null);
    const [events, setEvents] = useState<SiteEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    // Edit form
    const [form, setForm] = useState<CreateSitePayload>(EMPTY_FORM);
    const [settingsRaw, setSettingsRaw] = useState('');
    const [metaRaw, setMetaRaw] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Run pipeline
    const [runConfig, setRunConfig] = useState('templates/site-gen.json');
    const [runDryRun, setRunDryRun] = useState(false);
    const [running, setRunning] = useState(false);
    const [runResult, setRunResult] = useState<{ ok: boolean; logFile: string; error?: string } | null>(null);

    const loadSites = useCallback(async () => {
        try {
            setLoading(true);
            setSites(await fetchSites());
        } catch {
            toast.error(translate('Failed to load sites'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSites(); }, [loadSites]);

    // ── Create / Edit helpers ─────────────────────────────────────────────────

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setSettingsRaw('');
        setMetaRaw('');
        setJsonError('');
        setAdvancedOpen(false);
        setIsCreateOpen(true);
        setEditingSite(null);
    };

    const openEdit = (site: ManagedSite) => {
        setForm({
            name: site.name, domain: site.domain,
            display_name: site.display_name ?? '',
            admin_email: site.admin_email ?? '',
            contact_email: site.contact_email ?? '',
            service_url: site.service_url ?? '',
            client_url: site.client_url ?? '',
            infrastructure_dir: site.infrastructure_dir ?? '',
            plesk_target: site.plesk_target ?? '',
            ssh_host: site.ssh_host ?? '',
            dns_zone: site.dns_zone ?? '',
            service_user: site.service_user ?? '',
            status: site.status,
        });
        setSettingsRaw(safeJson(site.settings));
        setMetaRaw(safeJson(site.meta));
        setJsonError('');
        setAdvancedOpen(false);
        setEditingSite(site);
        setIsCreateOpen(false);
    };

    const closeEditCreate = () => { setIsCreateOpen(false); setEditingSite(null); };

    const handleSave = async () => {
        const settings = parseJsonField(settingsRaw);
        const meta = parseJsonField(metaRaw);
        if (settings === null || meta === null) {
            setJsonError(translate('Invalid JSON in settings or meta'));
            return;
        }
        setJsonError('');
        setSaving(true);
        try {
            const payload = {
                ...form,
                display_name: form.display_name || null,
                admin_email: form.admin_email || null,
                contact_email: form.contact_email || null,
                service_url: form.service_url || null,
                client_url: form.client_url || null,
                infrastructure_dir: form.infrastructure_dir || null,
                plesk_target: form.plesk_target || null,
                ssh_host: form.ssh_host || null,
                dns_zone: form.dns_zone || null,
                service_user: form.service_user || null,
                settings,
                meta,
            };
            if (editingSite) {
                const { name: _n, ...patch } = payload;
                await updateSite(editingSite.name, patch as UpdateSitePayload);
                toast.success(translate('Site updated'));
            } else {
                await createSite(payload);
                toast.success(translate('Site created'));
            }
            closeEditCreate();
            loadSites();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(msg.includes('already exists') ? translate('Name or domain already exists') : translate('Failed to save site'));
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deletingSite) return;
        const ok = await deleteSite(deletingSite.name);
        if (ok) { toast.success(translate('Site deleted')); loadSites(); }
        else toast.error(translate('Failed to delete site'));
        setDeletingSite(null);
    };

    // ── Plesk import ──────────────────────────────────────────────────────────

    const handlePleskImport = async (site: ManagedSite) => {
        try {
            const res = await importPleskJson(site.name);
            if (res.ok) {
                toast.success(`plesk.json imported${res.fqdn ? ` (${res.fqdn})` : ''}`);
                loadSites();
            } else {
                toast.error(translate('Import failed'));
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : translate('Import failed'));
        }
    };

    // ── Pipeline run ──────────────────────────────────────────────────────────

    const openRun = (site: ManagedSite) => {
        setRunSite(site);
        setRunConfig('templates/site-gen.json');
        setRunDryRun(false);
        setRunResult(null);
    };

    const handleRun = async () => {
        if (!runSite) return;
        setRunning(true);
        setRunResult(null);
        try {
            const payload: RunGeneratorPayload = {
                config: runConfig || 'templates/site-gen.json',
                dryRun: runDryRun,
                vars: { site: runSite.name, ...(runSite.domain ? { rootDomain: runSite.dns_zone ?? runSite.domain.split('.').slice(1).join('.') } : {}) },
            };
            const res = await runSiteGenerator(payload);
            setRunResult(res);
            if (res.ok) toast.success(translate('Pipeline completed'));
            else toast.error(translate('Pipeline failed'));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : translate('Run failed'));
        } finally {
            setRunning(false);
        }
    };

    // ── Events ────────────────────────────────────────────────────────────────

    const openEvents = async (site: ManagedSite) => {
        setEventsSite(site);
        setEventsLoading(true);
        try { setEvents(await fetchSiteEvents(site.name)); }
        catch { toast.error(translate('Failed to load events')); }
        finally { setEventsLoading(false); }
    };

    // ── Field helper ──────────────────────────────────────────────────────────

    const field = (id: keyof CreateSitePayload, label: string, opts?: { placeholder?: string; type?: string; required?: boolean; readOnly?: boolean }) => (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}{opts?.required && <span className="text-destructive ml-0.5">*</span>}</Label>
            <Input
                id={id}
                type={opts?.type ?? 'text'}
                value={(form[id] as string) ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                placeholder={opts?.placeholder}
                disabled={opts?.readOnly}
            />
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) return <div className="p-4 text-muted-foreground"><T>Loading sites...</T></div>;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex justify-end mb-4">
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    <T>Add Site</T>
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><T>Site</T></TableHead>
                            <TableHead><T>Domain</T></TableHead>
                            <TableHead><T>Admin email</T></TableHead>
                            <TableHead><T>Status</T></TableHead>
                            <TableHead><T>Updated</T></TableHead>
                            <TableHead className="text-right"><T>Actions</T></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sites.map((site) => (
                            <TableRow key={site.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted p-2 rounded-md">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium font-mono text-sm">{site.name}</div>
                                            {site.display_name && (
                                                <div className="text-xs text-muted-foreground">{site.display_name}</div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href={site.client_url ?? `https://${site.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm hover:underline text-primary"
                                    >
                                        {site.domain}
                                    </a>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {site.admin_email ?? <span className="italic opacity-50">—</span>}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={site.status} />
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(site.updated_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(site)}><T>Edit</T></DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEvents(site)}>
                                                <Clock className="mr-2 h-3.5 w-3.5" /><T>Activity log</T>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => openRun(site)}>
                                                <Play className="mr-2 h-3.5 w-3.5" /><T>Run pipeline</T>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`${site.name}/steps`)}>
                                                <Layers className="mr-2 h-3.5 w-3.5" /><T>Steps</T>
                                            </DropdownMenuItem>
                                            {site.plesk_target && (
                                                <DropdownMenuItem onClick={() => handlePleskImport(site)}>
                                                    <Download className="mr-2 h-3.5 w-3.5" /><T>Import plesk.json</T>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => setDeletingSite(site)}
                                            >
                                                <T>Delete</T>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sites.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    <T>No sites yet. Add one to get started.</T>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isCreateOpen || !!editingSite} onOpenChange={(o) => !o && closeEditCreate()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSite ? <T>Edit Site</T> : <T>Add Site</T>}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-5 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {field('name', translate('Name (slug)'), { placeholder: 'pacbot', required: true, readOnly: !!editingSite })}
                            {field('display_name', translate('Display name'), { placeholder: 'Pacbot' })}
                        </div>
                        {field('domain', translate('Domain'), { placeholder: 'pacbot.polymech.info', required: true })}

                        <div className="border-t pt-4 grid gap-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide"><T>URLs</T></p>
                            {field('client_url', translate('Client URL'), { placeholder: 'https://pacbot.polymech.info' })}
                            {field('service_url', translate('Service URL'), { placeholder: 'https://service.pacbot.polymech.info' })}
                        </div>

                        <div className="border-t pt-4 grid grid-cols-2 gap-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide col-span-2"><T>Contact</T></p>
                            {field('admin_email', translate('Admin email'), { type: 'email', placeholder: 'admin@example.com' })}
                            {field('contact_email', translate('Contact email'), { type: 'email', placeholder: 'contact@example.com' })}
                        </div>

                        <div className="border-t pt-4 grid gap-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide"><T>Infrastructure</T></p>
                            <div className="grid grid-cols-2 gap-4">
                                {field('infrastructure_dir', translate('Infra dir'), { placeholder: '../infrastructure/pacbot' })}
                                {field('plesk_target', translate('Plesk target'), { placeholder: '../infrastructure/pacbot' })}
                                {field('dns_zone', translate('DNS zone'), { placeholder: 'polymech.info' })}
                                {field('ssh_host', translate('SSH host'), { placeholder: 'polymech' })}
                                {field('service_user', translate('Service user'), { placeholder: 'polymech.info_abc123' })}
                            </div>
                        </div>

                        <div className="border-t pt-4 grid gap-2">
                            <Label><T>Status</T></Label>
                            <Select value={form.status ?? 'active'} onValueChange={(v) => setForm((f) => ({ ...f, status: v as SiteStatus }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(STATUS_META) as SiteStatus[]).map((s) => (
                                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border-t pt-4">
                            <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide w-full hover:text-foreground">
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                                    <T>Advanced — settings & meta (JSON)</T>
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label><T>Settings</T> <span className="text-xs text-muted-foreground">(merged into recipe vars at run time)</span></Label>
                                    <Textarea rows={5} className="font-mono text-xs" value={settingsRaw}
                                        onChange={(e) => setSettingsRaw(e.target.value)}
                                        placeholder='{ "servicePort": "3334", "sslEmail": "admin@example.com" }' />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label><T>Meta</T> <span className="text-xs text-muted-foreground">(tags, billing refs, notes)</span></Label>
                                    <Textarea rows={3} className="font-mono text-xs" value={metaRaw}
                                        onChange={(e) => setMetaRaw(e.target.value)}
                                        placeholder='{ "tags": ["prod"], "notes": "" }' />
                                </div>
                                {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditCreate} disabled={saving}><T>Cancel</T></Button>
                        <Button onClick={handleSave} disabled={saving || !form.name || !form.domain}>
                            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            <T>Save</T>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ─────────────────────────────────────────────── */}
            <Dialog open={!!deletingSite} onOpenChange={(o) => !o && setDeletingSite(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle><T>Delete Site</T></DialogTitle></DialogHeader>
                    <p className="text-muted-foreground py-4">
                        {translate('Are you sure you want to delete site')}{' '}
                        <span className="font-semibold text-foreground">{deletingSite?.name}</span>?
                        {' '}{translate('This also deletes all activity log entries.')}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingSite(null)}><T>Cancel</T></Button>
                        <Button variant="destructive" onClick={handleDelete}><T>Delete</T></Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Run Pipeline Dialog ───────────────────────────────────────── */}
            <Dialog open={!!runSite} onOpenChange={(o) => { if (!o) { setRunSite(null); setRunResult(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle><T>Run pipeline</T>{runSite ? ` — ${runSite.name}` : ''}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="run-config"><T>Recipe config path</T></Label>
                            <Input id="run-config" value={runConfig} onChange={(e) => setRunConfig(e.target.value)} placeholder="templates/site-gen.json" />
                            <p className="text-xs text-muted-foreground"><T>Relative to server cwd</T></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch id="dry-run" checked={runDryRun} onCheckedChange={setRunDryRun} />
                            <Label htmlFor="dry-run" className="cursor-pointer">
                                <T>Dry run</T>
                                <span className="ml-1 text-xs text-muted-foreground">({translate('print plan, skip most steps')})</span>
                            </Label>
                        </div>
                        {runResult && (
                            <div className={`rounded-md border p-3 text-sm ${runResult.ok ? 'border-green-500/30 bg-green-50 dark:bg-green-950/20' : 'border-destructive/30 bg-destructive/5'}`}>
                                <div className="flex items-center gap-2 font-medium mb-1">
                                    {runResult.ok ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                    {runResult.ok ? <T>Pipeline completed</T> : <T>Pipeline failed</T>}
                                </div>
                                {runResult.error && <p className="text-xs text-destructive mt-1">{runResult.error}</p>}
                                <p className="text-xs text-muted-foreground mt-1"><T>Log</T>: <code className="font-mono">{runResult.logFile}</code></p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRunSite(null); setRunResult(null); }}><T>Close</T></Button>
                        <Button onClick={handleRun} disabled={running}>
                            {running ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            {runDryRun ? <T>Dry run</T> : <T>Run</T>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Activity Log Dialog ───────────────────────────────────────── */}
            <Dialog open={!!eventsSite} onOpenChange={(o) => !o && setEventsSite(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle><T>Activity log</T>{eventsSite ? ` — ${eventsSite.name}` : ''}</DialogTitle>
                    </DialogHeader>
                    {eventsLoading ? (
                        <div className="py-8 text-center text-muted-foreground"><T>Loading...</T></div>
                    ) : events.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground"><T>No events recorded yet.</T></div>
                    ) : (
                        <div className="space-y-2 py-2">
                            {events.map((ev) => (
                                <div key={ev.id} className="border rounded-md p-3 text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={ev.status === 'ok' ? 'default' : ev.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                                            {ev.status}
                                        </Badge>
                                        <span className="font-mono text-xs font-medium">{ev.event_type}{ev.step ? ` / ${ev.step}` : ''}</span>
                                        <span className="ml-auto text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                                    </div>
                                    {ev.message && <p className="text-xs text-muted-foreground">{ev.message}</p>}
                                    {ev.log_file && <p className="text-xs text-muted-foreground mt-0.5"><T>Log</T>: <code className="font-mono">{ev.log_file}</code></p>}
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEventsSite(null)}><T>Close</T></Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SitesManager;
