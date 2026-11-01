import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { fetchUserIdentity } from '@/modules/user/client-user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    /** Resolved app UUID (profiles.user_id) — use this for all API calls and routing */
    id: string;
    /** Original Zitadel numeric sub from the OIDC token */
    sub: string;
    email: string | undefined;
    user_metadata: {
        display_name?: string;
        username?: string;
        full_name?: string;
    };
    app_metadata: Record<string, unknown>;
    aud: string;
}

interface AuthContextType {
    user: AuthUser | null;
    /** Always null — Zitadel uses tokens, not Supabase sessions */
    session: null;
    roles: string[];
    loading: boolean;
    isAuthenticated: boolean;
    signIn: (redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** @deprecated Use signIn() — redirects to Zitadel */
    signUp: (...args: any[]) => Promise<{ data: null; error: Error }>;
    /** @deprecated Use signIn() — redirects to Zitadel */
    signInWithGithub: () => Promise<{ error: null }>;
    /** @deprecated Use signIn() — redirects to Zitadel */
    signInWithGoogle: () => Promise<{ error: null }>;
    /** @deprecated Reset password via Zitadel portal */
    resetPassword: (...args: any[]) => Promise<{ error: Error }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const oidcAuth = useOidcAuth();
    const [roles, setRoles] = useState<string[]>([]);
    const [identityLoading, setIdentityLoading] = useState(false);
    // Resolved app UUID — starts as null until the /api/me/identity call completes
    const [resolvedId, setResolvedId] = useState<string | null>(null);

    useEffect(() => {
        if (oidcAuth.isLoading) return;

        if (!oidcAuth.isAuthenticated || !oidcAuth.user) {
            setRoles([]);
            setResolvedId(null);
            return;
        }

        setIdentityLoading(true);
        fetchUserIdentity()
            .then(({ id, roles: r }) => {
                setResolvedId(id);
                setRoles(r);
            })
            .catch(err => {
                console.error('[AuthProvider] Failed to fetch identity:', err);
                setRoles([]);
                // Fall back to the raw numeric sub so the app isn't completely broken
                setResolvedId(null);
            })
            .finally(() => setIdentityLoading(false));
    }, [oidcAuth.isAuthenticated, oidcAuth.isLoading]);

    const oidcSub = oidcAuth.user?.profile.sub ?? '';

    const user: AuthUser | null = oidcAuth.user
        ? {
              // Use the server-resolved UUID; fall back to the OIDC sub while loading
              id: resolvedId ?? oidcSub,
              sub: oidcSub,
              email: oidcAuth.user.profile.email,
              user_metadata: {
                  display_name: oidcAuth.user.profile.name,
                  full_name: oidcAuth.user.profile.name,
                  username: oidcAuth.user.profile.preferred_username,
              },
              app_metadata: {},
              aud: String(oidcAuth.user.profile.aud ?? ''),
          }
        : null;

    return (
        <AuthContext.Provider
            value={{
                user,
                session: null,
                roles,
                loading: oidcAuth.isLoading || identityLoading,
                isAuthenticated: oidcAuth.isAuthenticated,
                signIn: (redirectTo = '/') => oidcAuth.signinRedirect({ state: { redirectTo } }),
                signOut: () => oidcAuth.signoutRedirect({ post_logout_redirect_uri: window.location.origin + '/' }),
                signUp: async () => ({
                    data: null,
                    error: new Error('Sign up via Zitadel — use the /authz page'),
                }),
                signInWithGithub: async () => { await oidcAuth.signinRedirect(); return { error: null }; },
                signInWithGoogle: async () => { await oidcAuth.signinRedirect(); return { error: null }; },
                resetPassword: async () => ({
                    error: new Error('Reset password via the Zitadel portal'),
                }),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
