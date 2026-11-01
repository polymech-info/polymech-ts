import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please make sure your passwords match.',
            });
            return;
        }

        if (password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Password too short',
                description: 'Password must be at least 6 characters.',
            });
            return;
        }

        setLoading(true);
        try {
            await apiClient('/api/me/password', { method: 'PATCH', body: JSON.stringify({ password }) });
            toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
            navigate('/');
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-morphism border-white/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Update Password
                    </CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <Input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdatePassword;
