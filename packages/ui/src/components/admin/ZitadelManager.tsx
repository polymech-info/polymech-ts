/**
 * ZitadelManager — admin section for Zitadel / auth inspection & token management.
 *
 * Shows:
 *  • Env config (issuer, JWKS, audience, which credentials are set)
 *  • Live connectivity (JWKS reachable, DB ok)
 *  • Service / M2M token: source, sub, expiry countdown, force-refresh
 *  • User auth cache: size, flush button
 *  • Current user's client-side OIDC tokens (access_token, id_token) with decode
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import {
    getZitadelStatus, postZitadelRefreshServiceToken, postZitadelFlushAuthCache,
    type ZitadelStatus,
} from '@/modules/admin/client-admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, CircleCheck, CircleX,
    KeyRound, Database, Wifi, WifiOff, Trash2,
} from 'lucide-react';

// ── Small helpers (ported from playground/auth.tsx) ───────────────────

function looksJwt(t: string): boolean {
    const p = t.split('.');
    return p.length === 3 && p.every(x => x.length > 0);
}

function decodePayload(t: string): Record<string, unknown> | null {
    if (!looksJwt(t)) return null;
    try {
        return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
}

function pickJwt(user: { access_token: string; id_token?: string } | undefined) {
    if (!user) return null;
    if (looksJwt(user.access_token)) return { token: user.access_token, source: 'access_token' as const };
    if (user.id_token && looksJwt(user.id_token)) return { token: user.id_token, source: 'id_token' as const };
    return null;
}

function formatExp(exp: unknown): string {
    if (typeof exp !== 'number') return '—';
    const ms = exp * 1000;
    const left = ms - Date.now();
    const rel = left > 0
        ? `in ${Math.round(left / 60000)} min`
        : `expired ${Math.round(-left / 60000)} min ago`;
    return `${new Date(ms).toISOString()} (${rel})`;
}

function expBadgeVariant(exp?: number): 'default' | 'secondary' | 'destructive' {
    if (!exp) return 'secondary';
    const left = exp * 1000 - Date.now();
    if (left < 0) return 'destructive';
    if (left < 5 * 60 * 1000) return 'secondary';
    return 'default';
}

// ── Sub-components ────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[10rem_1fr] gap-x-3 text-xs items-start py-0.5">
            <span className="text-muted-foreground font-medium shrink-0">{label}</span>
            <div className="min-w-0 break-all font-mono">{children}</div>
        </div>
    );
}

function BoolRow({ label, value, trueLabel = 'yes', falseLabel = 'no' }: { label: string; value: boolean; trueLabel?: string; falseLabel?: string }) {
    return (
        <Row label={label}>
            <span className={cn('flex items-center gap-1', value ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                {value ? <CircleCheck className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                {value ? trueLabel : falseLabel}
            </span>
        </Row>
    );
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy"
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="border rounded-lg bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────

export const ZitadelManager: React.FC = () => {
    const auth = useAuth();
    const [status, setStatus] = useState<ZitadelStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    const [refreshing, setRefreshing] = useState(false);
    const [refreshResult, setRefreshResult] = useState<{ ok: boolean; claims?: Record<string, unknown>; error?: string } | null>(null);

    const [flushing, setFlushing] = useState(false);
    const [flushResult, setFlushResult] = useState<{ ok: boolean; sizeBefore: number } | null>(null);

    const jwtPick = useMemo(() => pickJwt(auth.user ?? undefined), [auth.user]);
    const atPayload = useMemo(() => auth.user?.access_token ? decodePayload(auth.user.access_token) : null, [auth.user?.access_token]);
    const idPayload = useMemo(() => auth.user?.id_token ? decodePayload(auth.user.id_token) : null, [auth.user?.id_token]);

    const loadStatus = useCallback(async () => {
        setStatusLoading(true);
        setStatusError(null);
        try {
            setStatus(await getZitadelStatus());
        } catch (e: any) {
            setStatusError(e?.message ?? 'Failed to load status');
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => { loadStatus(); }, []);

    const handleRefreshToken = async () => {
        setRefreshing(true);
        setRefreshResult(null);
        try {
            const res = await postZitadelRefreshServiceToken();
            setRefreshResult(res);
            await loadStatus();
        } catch (e: any) {
            setRefreshResult({ ok: false, error: e?.message ?? 'Failed' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleFlushCache = async () => {
        setFlushing(true);
        setFlushResult(null);
        try {
            const res = await postZitadelFlushAuthCache();
            setFlushResult(res);
            await loadStatus();
        } catch (e: any) {
            setFlushResult({ ok: false, sizeBefore: 0 });
        } finally {
            setFlushing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6" /> Zitadel
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Auth config, token inspection &amp; cache management</p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadStatus} disabled={statusLoading} className="gap-1.5">
                    <RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {statusError && (
                <div className="text-sm text-destructive p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                    {statusError}
                </div>
            )}

            {/* ── Connectivity ── */}
            <SectionCard title="Connectivity" icon={Wifi}>
                {status ? (
                    <div className="space-y-1">
                        <Row label="Issuer">{status.env.issuer ?? <span className="text-muted-foreground">not set</span>}</Row>
                        <Row label="JWKS URL">{status.env.jwksUrl ?? <span className="text-muted-foreground">auto ({status.env.issuer}/oauth/v2/keys)</span>}</Row>
                        <Row label="Audience">
                            {status.env.audience.length ? status.env.audience.join(', ') : <span className="text-muted-foreground">not set (any)</span>}
                        </Row>
                        <Separator className="my-2" />
                        <BoolRow label="JWKS reachable" value={status.jwksReachable} trueLabel="reachable" falseLabel="unreachable" />
                        <BoolRow label="DB ok" value={status.dbOk} trueLabel="connected" falseLabel="failed" />
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground animate-pulse">Loading…</div>
                )}
            </SectionCard>

            {/* ── Credentials ── */}
            <SectionCard title="Credentials" icon={KeyRound}>
                {status ? (
                    <div className="space-y-1">
                        <BoolRow label="Server PAT set" value={status.env.hasServerAccessToken} />
                        {status.env.hasServerAccessToken && (
                            <BoolRow label="PAT is JWT" value={status.env.serverAccessTokenIsJwt} trueLabel="JWT ✓" falseLabel="opaque (cannot JWKS-verify)" />
                        )}
                        <BoolRow label="Service key JSON" value={status.env.hasServiceKeyJson} />
                        <BoolRow label="Service client ID" value={status.env.hasServiceClientId} />
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground animate-pulse">Loading…</div>
                )}
            </SectionCard>

            {/* ── Service / M2M token ── */}
            <SectionCard title="Service Token (M2M)" icon={KeyRound}>
                <div className="space-y-2">
                    {status && (
                        <div className="space-y-1">
                            <Row label="Cached">
                                {status.serviceToken.cached
                                    ? <Badge variant={expBadgeVariant(status.serviceToken.exp)}>cached</Badge>
                                    : <Badge variant="secondary">not cached</Badge>
                                }
                            </Row>
                            {status.serviceToken.sub && <Row label="sub">{status.serviceToken.sub}</Row>}
                            {status.serviceToken.exp && (
                                <Row label="exp">{formatExp(status.serviceToken.exp)}</Row>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleRefreshToken} disabled={refreshing}>
                            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                            {refreshing ? 'Refreshing…' : 'Force Refresh'}
                        </Button>
                    </div>
                    {refreshResult && (
                        <div className={cn('mt-2 rounded p-2 text-xs', refreshResult.ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20')}>
                            {refreshResult.ok ? (
                                <>
                                    <p className="text-green-600 dark:text-green-400 font-medium mb-1 flex items-center gap-1">
                                        <CircleCheck className="h-3.5 w-3.5" /> Token refreshed
                                    </p>
                                    <pre className="overflow-x-auto text-[10px] font-mono">
                                        {JSON.stringify({
                                            sub: refreshResult.claims?.sub,
                                            iss: refreshResult.claims?.iss,
                                            exp: formatExp(refreshResult.claims?.exp),
                                        }, null, 2)}
                                    </pre>
                                </>
                            ) : (
                                <p className="text-destructive">{refreshResult.error}</p>
                            )}
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* ── Auth cache ── */}
            <SectionCard title="User Auth Cache" icon={Database}>
                <div className="space-y-2">
                    <Row label="Cached tokens">
                        <Badge variant="outline">{status?.authCacheSize ?? '…'}</Badge>
                        <span className="ml-2 text-muted-foreground text-[10px]">verified user JWTs in memory</span>
                    </Row>
                    <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleFlushCache} disabled={flushing || status?.authCacheSize === 0}>
                            {flushing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            {flushing ? 'Flushing…' : 'Flush all'}
                        </Button>
                    </div>
                    {flushResult && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CircleCheck className="h-3.5 w-3.5" />
                            Flushed {flushResult.sizeBefore} token{flushResult.sizeBefore !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </SectionCard>

            {/* ── Client-side OIDC tokens ── */}
            <SectionCard title="Client Session (OIDC)" icon={ShieldAlert}>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Row label="Authenticated">{String(auth.isAuthenticated)}</Row>
                        <Row label="Loading">{String(auth.isLoading)}</Row>
                        {auth.error && <Row label="Error"><span className="text-destructive">{auth.error.message}</span></Row>}
                    </div>

                    <Separator />

                    {/* access_token */}
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium">access_token</span>
                            <Badge variant={auth.user?.access_token ? (looksJwt(auth.user.access_token) ? 'default' : 'secondary') : 'outline'}>
                                {auth.user?.access_token ? (looksJwt(auth.user.access_token) ? 'JWT' : 'opaque') : 'missing'}
                            </Badge>
                            {auth.user?.access_token && <CopyBtn text={auth.user.access_token} />}
                        </div>
                        {atPayload && (
                            <pre className="text-[10px] bg-background/80 rounded p-2 overflow-x-auto max-h-28 font-mono">
                                {JSON.stringify({ sub: atPayload.sub, iss: atPayload.iss, aud: atPayload.aud, exp: formatExp(atPayload.exp) }, null, 2)}
                            </pre>
                        )}
                    </div>

                    {/* id_token */}
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium">id_token</span>
                            <Badge variant={auth.user?.id_token ? 'default' : 'outline'}>
                                {auth.user?.id_token ? 'JWT' : 'missing'}
                            </Badge>
                            {auth.user?.id_token && <CopyBtn text={auth.user.id_token} />}
                        </div>
                        {idPayload && (
                            <pre className="text-[10px] bg-background/80 rounded p-2 overflow-x-auto max-h-28 font-mono">
                                {JSON.stringify({ sub: idPayload.sub, email: idPayload.email, exp: formatExp(idPayload.exp) }, null, 2)}
                            </pre>
                        )}
                    </div>

                    {jwtPick && (
                        <div className="text-xs text-muted-foreground">
                            API Bearer: <Badge variant="outline" className="text-[10px]">{jwtPick.source}</Badge>
                            {' '}— will be used for JWKS verification
                            <CopyBtn text={jwtPick.token} />
                        </div>
                    )}

                </div>
            </SectionCard>
        </div>
    );
};

export default ZitadelManager;
