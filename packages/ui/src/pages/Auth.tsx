import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Github, Mail } from 'lucide-react';
import { T, translate } from '@/i18n';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const { user, signUp, signIn, signInWithGithub, signInWithGoogle, resetPassword } = useAuth();
  const { orgSlug, isOrgContext } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.username || !formData.displayName) {
      toast({
        variant: 'destructive',
        title: translate('Missing Information'),
        description: translate('Please fill in all fields')
      });
      return;
    }

    const { data } = await signUp(formData.email, formData.password, formData.username, formData.displayName);

  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        variant: 'destructive',
        title: translate('Missing Information'),
        description: translate('Please fill in email and password')
      });
      return;
    }
    await signIn(formData.email, formData.password);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        variant: 'destructive',
        title: translate('Missing Information'),
        description: translate('Please enter your email address')
      });
      return;
    }
    const { error } = await resetPassword(formData.email);
    if (!error) {
      setResetSent(true);
    }
  };

  const getTitle = () => {
    if (mode === 'forgotPassword') return translate('Reset Password');
    if (mode === 'signUp') return translate('Create Account');
    return translate('Welcome Back');
  };

  const getDescription = () => {
    if (mode === 'forgotPassword') return translate('Enter your email to receive a reset link');
    if (mode === 'signUp') return translate('Join our photo sharing community');
    return translate('Sign in to your account');
  };

  const getSubmitHandler = () => {
    if (mode === 'forgotPassword') return handleForgotPassword;
    if (mode === 'signUp') return handleSignUp;
    return handleSignIn;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-morphism border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgotPassword' && resetSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                <T>If an account exists for</T> <strong>{formData.email}</strong>, <T>a reset link has been sent. Check your inbox.</T>
              </p>
              <Button
                variant="ghost"
                onClick={() => { setMode('signIn'); setResetSent(false); }}
                className="text-sm"
              >
                <T>Back to sign in</T>
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={getSubmitHandler()} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium"><T>Email</T></label>
                  <Input
                    type="email"
                    placeholder={translate('Enter your email')}
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                  />
                </div>

                {mode === 'signUp' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium"><T>Username</T></label>
                      <Input
                        placeholder={translate('Choose a username')}
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium"><T>Display Name</T></label>
                      <Input
                        placeholder={translate('Your display name')}
                        value={formData.displayName}
                        onChange={handleInputChange('displayName')}
                        required
                      />
                    </div>
                  </>
                )}

                {mode !== 'forgotPassword' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium"><T>Password</T></label>
                    <Input
                      type="password"
                      placeholder={mode === 'signUp' ? translate('Create a password') : translate('Enter your password')}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {mode === 'forgotPassword' ? translate('Send Reset Link') : mode === 'signUp' ? translate('Create Account') : translate('Sign In')}
                </Button>
              </form>

              {mode === 'signIn' && (
                <div className="mt-2 text-center">
                  <Button
                    variant="link"
                    onClick={() => setMode('forgotPassword')}
                    className="text-xs text-muted-foreground p-0 h-auto"
                  >
                    <T>Forgot password?</T>
                  </Button>
                </div>
              )}

              {mode !== 'forgotPassword' && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        <T>Or continue with</T>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={signInWithGithub}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={signInWithGoogle}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                  </div>
                </>
              )}

              <div className="mt-6 text-center">
                {mode === 'forgotPassword' ? (
                  <Button
                    variant="ghost"
                    onClick={() => setMode('signIn')}
                    className="text-sm"
                  >
                    <T>Back to sign in</T>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}
                    className="text-sm"
                  >
                    {mode === 'signUp'
                      ? translate('Already have an account? Sign in')
                      : translate("Don't have an account? Sign up")
                    }
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;