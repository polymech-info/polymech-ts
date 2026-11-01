import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, Sparkles } from 'lucide-react';
import { T, translate } from '@/i18n';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

const AuthZ = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🛡️ [AuthZ] Auth State Update:", {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        hasError: !!auth.error,
        errorMsg: auth.error?.message
      });
      if (auth.user) {
        console.log("🛡️ [AuthZ] Identity Token Profile:", auth.user.profile);
        console.log("🛡️ [AuthZ] Access Token:", auth.user.access_token);
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.error, auth.user]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirectTo') || '/';
      await auth.signinRedirect({ state: { redirectTo } });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin + '/' });
    } catch (e) {
      console.error(e);
      setSigningOut(false);
    }
  };

  // ── Signed in ─────────────────────────────────────────────────────────────
  if (auth.isAuthenticated && auth.user && !auth.isLoading) {
    const name = auth.user.profile.given_name
      ?? auth.user.profile.name
      ?? auth.user.profile.preferred_username
      ?? auth.user.profile.email
      ?? '';

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-morphism border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full justify-center items-center flex mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {name ? `${translate('Welcome back')}, ${name}!` : <T>Welcome back!</T>}
            </CardTitle>
            <CardDescription>
              <T>You're all set. Let's get to work.</T>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate('/')}>
              <T>Go to app</T>
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              size="sm"
              onClick={() => void handleLogout()}
              disabled={signingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {signingOut ? translate('Signing out…') : translate('Sign out')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-morphism border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full justify-center items-center flex mb-4">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            <T>Welcome</T>
          </CardTitle>
          <CardDescription>
            <T>Sign in to continue</T>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleLogin}
            disabled={isLoading}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? translate('Redirecting…') : translate('Sign in')}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            <T>Secure sign-in via Google or company credentials</T>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthZ;
