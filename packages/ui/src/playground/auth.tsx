import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { serverUrl } from '@/lib/db';

type AuthzDebugResponse = {
  verified: boolean;
  sub?: string;
  email?: string | null;
  appAdmin?: boolean;
  resolvedUserId?: string | null;
  userSecrets?: unknown;
  dbPing?: { poolOk: boolean; database: string; profileCount: number };
  error?: string;
  hint?: string;
};

function looksLikeCompactJwt(t: string): boolean {
  const p = t.split('.');
  return p.length === 3 && p.every((x) => x.length > 0);
}

function decodeJwtPayload(t: string): Record<string, unknown> | null {
  if (!looksLikeCompactJwt(t)) return null;
  try {
    const b64 = t.split('.')[1];
    if (!b64) return null;
    const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tokenFingerprint(t: string | undefined): {
  present: boolean;
  length: number;
  dots: number;
  kind: 'missing' | 'opaque' | 'jwt';
  preview: string;
} {
  if (!t) {
    return { present: false, length: 0, dots: 0, kind: 'missing', preview: '—' };
  }
  const dots = (t.match(/\./g) ?? []).length;
  const jwt = looksLikeCompactJwt(t);
  const preview =
    t.length <= 56 ? t : `${t.slice(0, 28)}…${t.slice(-20)}`;
  return {
    present: true,
    length: t.length,
    dots,
    kind: jwt ? 'jwt' : 'opaque',
    preview,
  };
}

function formatExp(exp: unknown): string {
  if (typeof exp !== 'number') return '—';
  const ms = exp * 1000;
  const d = new Date(ms);
  const left = ms - Date.now();
  const rel =
    left > 0
      ? `in ${Math.round(left / 60000)} min`
      : `expired ${Math.round(-left / 60000)} min ago`;
  return `${d.toISOString()} (${rel})`;
}

/** Zitadel often returns an opaque `access_token`; JWKS verification needs a JWT — prefer `id_token` when AT is opaque. */
function pickBearerJwtForApi(user: { access_token: string; id_token?: string } | undefined): {
  token: string;
  source: 'access_token' | 'id_token';
} | null {
  if (!user?.access_token) return null;
  if (looksLikeCompactJwt(user.access_token)) {
    return { token: user.access_token, source: 'access_token' };
  }
  if (user.id_token && looksLikeCompactJwt(user.id_token)) {
    return { token: user.id_token, source: 'id_token' };
  }
  return null;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-x-2 gap-y-1 text-xs items-start">
      <span className="text-muted-foreground font-medium shrink-0">{label}</span>
      <div className="min-w-0 break-all font-mono">{children}</div>
    </div>
  );
}

/**
 * Dev playground: exercises the Zitadel/JWKS auth path (`commons/zitadel.ts` + Postgres pool).
 * Calls like `GET /api/admin/authz/debug` and `GET /api/admin/authz/experiment/users` are for
 * integration testing only — not production policy.
 */
export default function PlaygroundAuth() {
  const auth = useAuth();
  const base = serverUrl || '';
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<AuthzDebugResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastHttp, setLastHttp] = useState<{ status: number; ok: boolean; url: string } | null>(null);
  const [lastDbPing, setLastDbPing] = useState<AuthzDebugResponse | null>(null);
  const [lastDbPingHttp, setLastDbPingHttp] = useState<{ status: number; ok: boolean; url: string } | null>(null);
  const [loadingDbPing, setLoadingDbPing] = useState(false);
  const [fetchErrorDbPing, setFetchErrorDbPing] = useState<string | null>(null);
  /** `/api/admin/authz/experiment/users` — admin-gated user list for new-auth experiments only */
  const [loadingExpUsers, setLoadingExpUsers] = useState(false);
  const [lastExpUsers, setLastExpUsers] = useState<unknown>(null);
  const [lastExpUsersHttp, setLastExpUsersHttp] = useState<{ status: number; ok: boolean; url: string } | null>(
    null,
  );
  const [fetchErrorExpUsers, setFetchErrorExpUsers] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const jwtPick = auth.user ? pickBearerJwtForApi(auth.user) : null;

  const atFp = useMemo(
    () => tokenFingerprint(auth.user?.access_token),
    [auth.user?.access_token],
  );
  const idFp = useMemo(() => tokenFingerprint(auth.user?.id_token), [auth.user?.id_token]);

  const atPayload = useMemo(
    () => (auth.user?.access_token ? decodeJwtPayload(auth.user.access_token) : null),
    [auth.user?.access_token],
  );
  const idPayload = useMemo(
    () => (auth.user?.id_token ? decodeJwtPayload(auth.user.id_token) : null),
    [auth.user?.id_token],
  );
  const pickedPayload = useMemo(
    () => (jwtPick ? decodeJwtPayload(jwtPick.token) : null),
    [jwtPick],
  );

  const oidcUser = auth.user as
    | (typeof auth.user & { scope?: string; session_state?: string; expires_at?: number })
    | undefined;

  const runCheck = useCallback(async () => {
    const picked = pickBearerJwtForApi(auth.user ?? undefined);
    if (!picked) {
      setLastHttp(null);
      if (!auth.user?.access_token) {
        setLast({ verified: false, error: 'missing_token', hint: 'Sign in via /authz first.' });
      } else {
        setLast({
          verified: false,
          error: 'opaque_or_non_jwt_token',
          hint:
            'Zitadel returned an opaque access_token and no JWT id_token. Ensure scope includes openid and the OIDC app returns id_token.',
        });
      }
      setFetchError(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    const url = `${base.replace(/\/$/, '')}/api/admin/authz/debug`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${picked.token}` },
      });
      setLastHttp({ status: res.status, ok: res.ok, url });
      const body = (await res.json()) as AuthzDebugResponse;
      setLast(body);
    } catch (e) {
      setLastHttp(null);
      setFetchError(e instanceof Error ? e.message : String(e));
      setLast(null);
    } finally {
      setLoading(false);
    }
  }, [auth.user, base]);

  /** `GET /api/admin/authz/db-ping` — same JWT + Postgres pool ping (`DATABASE_URL`). */
  const runDbPingCheck = useCallback(async () => {
    const picked = pickBearerJwtForApi(auth.user ?? undefined);
    if (!picked) {
      setLastDbPing({
        verified: false,
        error: 'opaque_or_non_jwt_token',
        hint: 'Need a JWT id_token (or JWT access_token).',
      });
      setFetchErrorDbPing(null);
      setLastDbPingHttp(null);
      return;
    }
    setLoadingDbPing(true);
    setFetchErrorDbPing(null);
    const url = `${base.replace(/\/$/, '')}/api/admin/authz/db-ping`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${picked.token}` },
      });
      setLastDbPingHttp({ status: res.status, ok: res.ok, url });
      const body = (await res.json()) as AuthzDebugResponse;
      setLastDbPing(body);
    } catch (e) {
      setLastDbPingHttp(null);
      setFetchErrorDbPing(e instanceof Error ? e.message : String(e));
      setLastDbPing(null);
    } finally {
      setLoadingDbPing(false);
    }
  }, [auth.user, base]);

  /** Experiment route: Zitadel JWT + app admin, then list users (not production `/api/admin/users`). */
  const runExperimentUsers = useCallback(async () => {
    setFetchErrorExpUsers(null);
    setLastExpUsers(null);
    setLastExpUsersHttp(null);
    if (!base) {
      setFetchErrorExpUsers('VITE_SERVER_IMAGE_API_URL is not set');
      return;
    }
    const picked = pickBearerJwtForApi(auth.user);
    if (!picked) {
      setFetchErrorExpUsers('No JWT-shaped token (use id_token when access_token is opaque)');
      return;
    }
    setLoadingExpUsers(true);
    try {
      const url = `${base.replace(/\/$/, '')}/api/admin/authz/experiment/users`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${picked.token}` },
      });
      setLastExpUsersHttp({ status: res.status, ok: res.ok, url });
      const body = (await res.json()) as unknown;
      setLastExpUsers(body);
      if (!res.ok) {
        setFetchErrorExpUsers(`HTTP ${res.status}`);
      }
    } catch (e) {
      setLastExpUsersHttp(null);
      setFetchErrorExpUsers(e instanceof Error ? e.message : String(e));
      setLastExpUsers(null);
    } finally {
      setLoadingExpUsers(false);
    }
  }, [auth.user, base]);

  const copyPickedJwt = useCallback(async () => {
    if (!jwtPick?.token) return;
    try {
      await navigator.clipboard.writeText(jwtPick.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [jwtPick?.token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Auth / Zitadel debug</CardTitle>
          </div>
          <CardDescription>
            Same flow as <code className="text-xs">pages/AuthZ.tsx</code>. The API verifies JWTs (JWKS); if Zitadel
            gives an <strong>opaque</strong> access token, this page sends the OIDC <strong>id_token</strong> instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/authz" className="inline-flex items-center gap-1">
                Open AuthZ <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" onClick={() => void runCheck()} disabled={loading || !base}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Checking…' : 'Authz debug'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void runDbPingCheck()}
              disabled={loadingDbPing || !base}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingDbPing ? 'animate-spin' : ''}`} />
              {loadingDbPing ? 'Pinging…' : 'DB ping (pool)'}
            </Button>
            {/* New-auth experiment only — see server `authzExperimentUsersRoute` */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void runExperimentUsers()}
              disabled={loadingExpUsers || !base}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingExpUsers ? 'animate-spin' : ''}`} />
              {loadingExpUsers ? 'Users…' : 'Experiment: all users'}
            </Button>
            {jwtPick && (
              <Button variant="secondary" size="sm" type="button" onClick={() => void copyPickedJwt()}>
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copied' : `Copy ${jwtPick.source} (curl)`}
              </Button>
            )}
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Environment</h3>
            <Row label="API base">
              {base || <span className="text-amber-600 dark:text-amber-400">VITE_SERVER_IMAGE_API_URL unset</span>}
            </Row>
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">OIDC client session</h3>
            <Row label="isLoading">{String(auth.isLoading)}</Row>
            <Row label="isAuthenticated">{String(auth.isAuthenticated)}</Row>
            <Row label="activeNavigator">{auth.activeNavigator ?? '—'}</Row>
            <Row label="error">{auth.error?.message ?? '—'}</Row>
            <Row label="scope">{oidcUser?.scope ?? '—'}</Row>
            <Row label="session_state">{oidcUser?.session_state ?? '—'}</Row>
            <Row label="expires_at">
              {oidcUser?.expires_at != null
                ? `${new Date(oidcUser.expires_at * 1000).toISOString()} (oidc-client session)`
                : '—'}
            </Row>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Tokens (client storage)</h3>
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium">access_token</span>
                <Badge variant={atFp.kind === 'jwt' ? 'default' : atFp.kind === 'opaque' ? 'secondary' : 'outline'}>
                  {atFp.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  len {atFp.length} · dots {atFp.dots}
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground break-all">{atFp.preview}</p>
              {atPayload && (
                <pre className="text-[11px] bg-background/80 rounded p-2 overflow-x-auto max-h-28">
                  {JSON.stringify(
                    {
                      iss: atPayload.iss,
                      sub: atPayload.sub,
                      aud: atPayload.aud,
                      exp: atPayload.exp,
                      exp_h: formatExp(atPayload.exp),
                    },
                    null,
                    0,
                  )}
                </pre>
              )}
            </div>
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium">id_token</span>
                <Badge variant={idFp.kind === 'jwt' ? 'default' : idFp.kind === 'opaque' ? 'secondary' : 'outline'}>
                  {idFp.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  len {idFp.length} · dots {idFp.dots}
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground break-all">{idFp.preview}</p>
              {idPayload && (
                <pre className="text-[11px] bg-background/80 rounded p-2 overflow-x-auto max-h-28">
                  {JSON.stringify(
                    {
                      iss: idPayload.iss,
                      sub: idPayload.sub,
                      aud: idPayload.aud,
                      exp: idPayload.exp,
                      exp_h: formatExp(idPayload.exp),
                      email: idPayload.email,
                    },
                    null,
                    0,
                  )}
                </pre>
              )}
            </div>
            <Row label="Bearer for API">
              {jwtPick ? (
                <span>
                  <Badge variant="outline">{jwtPick.source}</Badge>{' '}
                  <span className="text-muted-foreground">(JWKS verifies this JWT)</span>
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">no JWT — cannot call verify endpoint</span>
              )}
            </Row>
            {pickedPayload && (
              <pre className="text-[11px] bg-muted rounded-md p-2 overflow-x-auto max-h-32">
                {JSON.stringify(pickedPayload, null, 2)}
              </pre>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Profile (userinfo / id_token claims)</h3>
            <pre className="text-[11px] bg-muted rounded-md p-3 overflow-x-auto max-h-40">
              {auth.user?.profile
                ? JSON.stringify(auth.user.profile, null, 2)
                : '—'}
            </pre>
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Last HTTP</h3>
            <Row label="request">{lastHttp?.url ?? '—'}</Row>
            <Row label="status">
              {lastHttp ? (
                <>
                  {lastHttp.status} {lastHttp.ok ? 'OK' : '(not ok)'}
                </>
              ) : (
                '—'
              )}
            </Row>
          </section>

          {fetchError && (
            <pre className="text-xs bg-destructive/10 text-destructive rounded-md p-3 overflow-x-auto">
              {fetchError}
            </pre>
          )}

          {last && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">API response (/api/admin/authz/debug)</h3>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-[360px]">
                {JSON.stringify(last, null, 2)}
              </pre>
            </section>
          )}

          {fetchErrorDbPing && (
            <pre className="text-xs bg-destructive/10 text-destructive rounded-md p-3 overflow-x-auto">
              {fetchErrorDbPing}
            </pre>
          )}

          {lastDbPing && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">
                API response (/api/admin/authz/db-ping) — Postgres pool ping
              </h3>
              <Row label="request">{lastDbPingHttp?.url ?? '—'}</Row>
              <Row label="status">
                {lastDbPingHttp ? `${lastDbPingHttp.status} ${lastDbPingHttp.ok ? 'OK' : ''}` : '—'}
              </Row>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-[360px]">
                {JSON.stringify(lastDbPing, null, 2)}
              </pre>
            </section>
          )}

          {fetchErrorExpUsers && (
            <pre className="text-xs bg-destructive/10 text-destructive rounded-md p-3 overflow-x-auto">
              {fetchErrorExpUsers}
            </pre>
          )}

          {lastExpUsers != null && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">
                API response (/api/admin/authz/experiment/users) — new-auth experiment only
              </h3>
              <Row label="request">{lastExpUsersHttp?.url ?? '—'}</Row>
              <Row label="status">
                {lastExpUsersHttp ? `${lastExpUsersHttp.status} ${lastExpUsersHttp.ok ? 'OK' : ''}` : '—'}
              </Row>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-[360px]">
                {JSON.stringify(lastExpUsers, null, 2)}
              </pre>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
