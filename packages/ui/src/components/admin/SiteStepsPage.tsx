import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { T } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import CollapsibleSection from '@/components/CollapsibleSection';
import {
    ArrowLeft, Play, RefreshCw, CheckCircle, XCircle,
    AlertTriangle, Archive, Layers,
} from 'lucide-react';
import {
    fetchSite, runPipelineStep,
    type ManagedSite, type SiteStatus,
} from '@/modules/admin/client-sites';

// ── Status badge (inline copy avoids circular imports) ────────────────────────

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
            <m.icon className="h-3 w-3" />{m.label}
        </Badge>
    );
}

// ── Step definitions ──────────────────────────────────────────────────────────

interface StepField {
    key: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'boolean';
    hint?: string;
}

interface StepDef {
    id: string;
    label: string;
    description: string;
    fields: StepField[];
    defaults: (site: ManagedSite) => Record<string, unknown>;
}

const STEP_DEFS: StepDef[] = [
    {
        id: 'backup-master',
        label: 'backup-master',
        description: 'Backup the master site — pg_dump structure + data SQL files',
        fields: [
            { key: 'source',             label: 'Source dir',          placeholder: '..' },
            { key: 'target',             label: 'Target dir',          placeholder: '../infrastructure/master/backups/db', hint: 'Where dumps are written' },
            { key: 'env',               label: '.env path',            placeholder: 'server/.env', hint: 'DB credentials source' },
            { key: 'excludeDataTables', label: 'Exclude data tables',  placeholder: 'vfs_index,vfs_document_chunks' },
            { key: 'type',              label: 'Type',                 placeholder: 'all', hint: 'all | structure | data' },
        ],
        defaults: (site) => ({
            source: '..',
            target: `../infrastructure/master/backups/db`,
            env: 'server/.env',
            type: 'all',
            excludeDataTables: (site.settings?.excludeDataTables as string) ?? '',
        }),
    },
    {
        id: 'db-import',
        label: 'db-import',
        description: 'Import SQL dumps (structure + data) into the target database',
        fields: [
            { key: 'dbname',              label: 'DB name',          placeholder: 'pacbot_db' },
            { key: 'schema',              label: 'Schema SQL',       placeholder: '../infrastructure/master/backups/db/structure.sql' },
            { key: 'data',                label: 'Data SQL',         placeholder: '../infrastructure/master/backups/db/data.sql' },
            { key: 'target',              label: 'Target dir',       placeholder: '../infrastructure/pacbot' },
            { key: 'env',                 label: '.env path',        placeholder: '../infrastructure/pacbot/.env-db' },
            { key: 'clear',               label: 'Clear DB first',   type: 'boolean' },
            { key: 'createUser',          label: 'Create user',      placeholder: 'pacbot_user' },
            { key: 'createUserPassword',  label: 'User password',    placeholder: '' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
            env: `${site.plesk_target ?? `../infrastructure/${site.name}`}/.env-db`,
            clear: false,
        }),
    },
    {
        id: 'plesk-app-create',
        label: 'plesk-app-create',
        description: 'Create Plesk subdomain + FTP user, write plesk.json',
        fields: [
            { key: 'name',   label: 'App name',    hint: 'Subdomain label' },
            { key: 'root',   label: 'Root domain', placeholder: 'polymech.info' },
            { key: 'target', label: 'Target dir',  hint: 'Where plesk.json is written' },
        ],
        defaults: (site) => ({
            name: site.name,
            root: site.dns_zone ?? site.domain.split('.').slice(1).join('.'),
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
        }),
    },
    {
        id: 'plesk-app-ftp-ensure',
        label: 'plesk-app-ftp-ensure',
        description: 'Ensure FTP user exists and home is set (reads plesk.json)',
        fields: [
            { key: 'target', label: 'Target dir', hint: 'Directory containing plesk.json' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
        }),
    },
    {
        id: 'plesk-ssl-issue',
        label: 'plesk-ssl-issue',
        description: "Issue Let's Encrypt SSL certificate via Plesk",
        fields: [
            { key: 'target', label: 'Target dir', hint: 'Directory containing plesk.json' },
            { key: 'email',  label: 'ACME email', hint: "Let's Encrypt contact email" },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
            email: site.admin_email ?? '',
        }),
    },
    {
        id: 'plesk-app-sync',
        label: 'plesk-app-sync',
        description: 'Upload built assets from dist/ to the Plesk FTP account via rclone',
        fields: [
            { key: 'target',          label: 'Target dir',        hint: 'Directory containing plesk.json' },
            { key: 'excludeEtc',      label: 'Exclude etc/',      type: 'boolean' },
            { key: 'continueOnError', label: 'Continue on error', type: 'boolean' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
            excludeEtc: true,
            continueOnError: false,
        }),
    },
    {
        id: 'patch-config',
        label: 'patch-config',
        description: 'Run site-specific patch script inside the infrastructure directory',
        fields: [
            { key: 'target', label: 'Target dir', hint: 'Infrastructure site directory' },
            { key: 'script', label: 'Script',     placeholder: 'scripts/patch-config.sh' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
            script: 'scripts/patch-config.sh',
        }),
    },
    {
        id: 'plesk-create-service',
        label: 'plesk-create-service',
        description: 'Generate + optionally deploy systemd service unit for the Node.js app',
        fields: [
            { key: 'target',    label: 'Target dir',       hint: 'Directory containing plesk.json' },
            { key: 'port',      label: 'Service port',     placeholder: '3334' },
            { key: 'sync',      label: 'SCP unit to host', type: 'boolean' },
            { key: 'scpEnable', label: 'Enable on remote', type: 'boolean' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
            port: String((site.settings?.servicePort as string) ?? '3334'),
            sync: false,
            scpEnable: false,
        }),
    },
    {
        id: 'plesk-apache-deploy',
        label: 'plesk-apache-deploy',
        description: 'Render Apache vhost snippet from template and register with Plesk',
        fields: [
            { key: 'target',       label: 'Target dir',  hint: 'Infrastructure site directory' },
            { key: 'template',     label: 'Template',    placeholder: '../infrastructure/templates/apache.snippet.conf' },
            { key: 'output',       label: 'Output path', placeholder: 'dist/etc/apache-vhost-ssl.snippet.conf' },
            { key: 'updateDryRun', label: 'Plesk update dry-run', type: 'boolean' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
        }),
    },
    {
        id: 'hetzner-dns-a-upsert',
        label: 'hetzner-dns-a-upsert',
        description: 'Create or update the Hetzner DNS A record for this site',
        fields: [
            { key: 'zone',    label: 'DNS zone',           placeholder: 'polymech.info' },
            { key: 'name',    label: 'Record name',        placeholder: 'pacbot', hint: 'Subdomain label or @ for apex' },
            { key: 'pleskIp', label: 'Use Plesk server IP', type: 'boolean' },
            { key: 'value',   label: 'IP address',         placeholder: '148.251.75.178', hint: 'Explicit IP when not using Plesk IP' },
            { key: 'ttl',     label: 'TTL (s)',            placeholder: '300' },
        ],
        defaults: (site) => ({
            zone: site.dns_zone ?? site.domain.split('.').slice(1).join('.'),
            name: site.name,
            pleskIp: true,
            value: '',
        }),
    },
    {
        id: 'zitadel-setup',
        label: 'zitadel-setup',
        description: 'Run Zitadel project / application setup stub for the site',
        fields: [
            { key: 'target', label: 'Target dir', hint: 'Infrastructure site directory (optional)' },
        ],
        defaults: (site) => ({
            target: site.plesk_target ?? `../infrastructure/${site.name}`,
        }),
    },
];

// ── Step groups ───────────────────────────────────────────────────────────────

const STEP_GROUPS: { id: string; label: string; steps: string[] }[] = [
    {
        id: 'backup-db',
        label: 'Backup & Database',
        steps: ['backup-master', 'db-import'],
    },
    {
        id: 'plesk',
        label: 'Plesk',
        steps: ['plesk-app-create', 'plesk-app-ftp-ensure', 'plesk-ssl-issue', 'plesk-app-sync', 'plesk-create-service', 'plesk-apache-deploy'],
    },
    {
        id: 'infra',
        label: 'Infrastructure',
        steps: ['patch-config', 'hetzner-dns-a-upsert'],
    },
    {
        id: 'auth',
        label: 'Auth / Zitadel',
        steps: ['zitadel-setup'],
    },
];

// ── Step state ────────────────────────────────────────────────────────────────

type StepStatus = 'idle' | 'running' | 'ok' | 'failed' | 'dry_run';

interface StepState {
    args: Record<string, unknown>;
    dryRun: boolean;
    status: StepStatus;
    logFile?: string;
    error?: string;
}

function initStates(site: ManagedSite): Record<string, StepState> {
    return Object.fromEntries(
        STEP_DEFS.map((d) => [d.id, { args: d.defaults(site), dryRun: false, status: 'idle' as StepStatus }]),
    );
}

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({
    def,
    state,
    onUpdate,
    onSetArg,
    onRun,
}: {
    def: StepDef;
    state: StepState;
    onUpdate: (patch: Partial<StepState>) => void;
    onSetArg: (key: string, value: unknown) => void;
    onRun: () => void;
}) {
    const isRunning = state.status === 'running';

    const statusStyle: Record<StepStatus, string> = {
        idle:    'border-border',
        running: 'border-blue-400 dark:border-blue-500',
        ok:      'border-green-500 dark:border-green-600',
        failed:  'border-destructive',
        dry_run: 'border-yellow-400 dark:border-yellow-500',
    };

    const StatusDot = () => {
        if (state.status === 'running') return <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />;
        if (state.status === 'ok')      return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />;
        if (state.status === 'failed')  return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
        if (state.status === 'dry_run') return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0 mt-0.5" />;
        return <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 shrink-0 mt-0.5" />;
    };

    return (
        <div className={`rounded-lg border-2 bg-card transition-colors ${statusStyle[state.status]}`}>
            {/* Card header */}
            <div className="flex items-start gap-3 p-4 pb-3">
                <StatusDot />
                <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm font-semibold">{def.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{def.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Switch
                            id={`dry-${def.id}`}
                            checked={state.dryRun}
                            onCheckedChange={(v) => onUpdate({ dryRun: v })}
                            disabled={isRunning}
                            className="scale-75 origin-right"
                        />
                        <Label htmlFor={`dry-${def.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                            dry
                        </Label>
                    </div>
                    <Button
                        size="sm"
                        variant={state.dryRun ? 'outline' : 'default'}
                        className="h-7 gap-1.5 text-xs"
                        disabled={isRunning}
                        onClick={onRun}
                    >
                        {isRunning
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <Play className="h-3 w-3" />}
                        {state.dryRun ? <T>Dry run</T> : <T>Run</T>}
                    </Button>
                </div>
            </div>

            {/* Args grid */}
            {def.fields.length > 0 && (
                <div className="border-t px-4 py-3 grid gap-2">
                    {def.fields.map((f) => (
                        <div key={f.key} className="grid grid-cols-[160px_1fr] items-center gap-3">
                            <Label
                                htmlFor={`${def.id}-${f.key}`}
                                className="text-xs text-muted-foreground text-right truncate"
                                title={f.hint ?? f.label}
                            >
                                {f.label}
                            </Label>
                            {f.type === 'boolean' ? (
                                <Switch
                                    id={`${def.id}-${f.key}`}
                                    checked={Boolean(state.args[f.key])}
                                    onCheckedChange={(v) => onSetArg(f.key, v)}
                                    disabled={isRunning}
                                />
                            ) : (
                                <Input
                                    id={`${def.id}-${f.key}`}
                                    className="h-7 text-xs font-mono"
                                    value={String(state.args[f.key] ?? '')}
                                    onChange={(e) => onSetArg(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    disabled={isRunning}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Result */}
            {(state.logFile || state.error) && (
                <div className={`border-t px-4 py-2 text-xs space-y-0.5 ${state.status === 'failed' ? 'bg-destructive/5' : state.status === 'ok' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
                    {state.error && <p className="text-destructive font-medium">{state.error}</p>}
                    {state.logFile && (
                        <p className="text-muted-foreground font-mono truncate">
                            log: {state.logFile}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SiteStepsPage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();

    const [site, setSite] = useState<ManagedSite | null>(null);
    const [loading, setLoading] = useState(true);
    const [states, setStates] = useState<Record<string, StepState>>({});

    useEffect(() => {
        if (!name) return;
        setLoading(true);
        fetchSite(name)
            .then((s) => { setSite(s); setStates(initStates(s)); })
            .catch(() => toast.error('Site not found'))
            .finally(() => setLoading(false));
    }, [name]);

    const update = (id: string, patch: Partial<StepState>) =>
        setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

    const setArg = (id: string, key: string, value: unknown) =>
        setStates((s) => ({ ...s, [id]: { ...s[id], args: { ...s[id].args, [key]: value } } }));

    const runStep = async (def: StepDef) => {
        const st = states[def.id];
        if (!st) return;
        update(def.id, { status: 'running', error: undefined, logFile: undefined });
        try {
            const res = await runPipelineStep(def.id, { ...st.args, dryRun: st.dryRun });
            update(def.id, {
                status: res.ok ? (st.dryRun ? 'dry_run' : 'ok') : 'failed',
                logFile: res.logFile,
                error: res.error,
            });
            if (res.ok) toast.success(`${def.label} ${st.dryRun ? '(dry-run)' : ''} completed`);
            else toast.error(`${def.label} failed`);
        } catch (e: unknown) {
            update(def.id, { status: 'failed', error: e instanceof Error ? e.message : String(e) });
            toast.error(`${def.label} failed`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" /><T>Loading...</T>
            </div>
        );
    }

    if (!site) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <T>Site not found.</T>
                <Button variant="link" onClick={() => navigate(-1)}><T>Go back</T></Button>
            </div>
        );
    }

    return (
        <div>
            {/* Page header */}
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-1">
                    <ArrowLeft className="h-4 w-4" />
                    <T>Sites</T>
                </Button>
                <span className="text-muted-foreground">/</span>
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h1 className="text-xl font-bold font-mono">{site.name}</h1>
                <StatusBadge status={site.status} />
                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">{site.domain}</span>
            </div>

            {/* Grouped step cards */}
            <div className="grid gap-4">
                {STEP_GROUPS.map((group) => {
                    const defs = group.steps
                        .map((id) => STEP_DEFS.find((d) => d.id === id))
                        .filter(Boolean) as StepDef[];

                    const anyRunning  = defs.some((d) => states[d.id]?.status === 'running');
                    const allOk       = defs.every((d) => states[d.id]?.status === 'ok');
                    const anyFailed   = defs.some((d) => states[d.id]?.status === 'failed');
                    const groupStatus = anyRunning ? 'running' : anyFailed ? 'failed' : allOk ? 'ok' : 'idle';

                    const statusDot = (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                            {groupStatus === 'running' && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                            {groupStatus === 'ok'      && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {groupStatus === 'failed'  && <XCircle className="h-3 w-3 text-destructive" />}
                            <span className="text-muted-foreground">{defs.length} steps</span>
                        </span>
                    );

                    return (
                        <CollapsibleSection
                            key={group.id}
                            title={group.label}
                            storageKey={`site-steps-group-${group.id}`}
                            initiallyOpen
                            minimal
                            headerContent={statusDot}
                        >
                            <div className="grid gap-3 pt-2">
                                {defs.map((def) => (
                                    <StepCard
                                        key={def.id}
                                        def={def}
                                        state={states[def.id] ?? { args: {}, dryRun: false, status: 'idle' }}
                                        onUpdate={(patch) => update(def.id, patch)}
                                        onSetArg={(key, val) => setArg(def.id, key, val)}
                                        onRun={() => runStep(def)}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                    );
                })}
            </div>
        </div>
    );
};

export default SiteStepsPage;
