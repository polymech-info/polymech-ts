import { useState } from 'react';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { createAdminUserAPI } from '@/modules/admin/client-admin';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export const CreateUserDialog = ({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [copySettings, setCopySettings] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!email || !password) {
      toast.error(translate('Email and password are required.'));
      return;
    }

    setCreating(true);
    try {
      await createAdminUserAPI(email, password, copySettings);

      toast.success(translate('User created successfully'));
      onUserCreated();
      onOpenChange(false);
      // Reset form
      setEmail('');
      setPassword('');
      setCopySettings(true);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || translate('Failed to create user'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="copy-settings"
              checked={copySettings}
              onCheckedChange={(checked) => setCopySettings(!!checked)}
            />
            <label
              htmlFor="copy-settings"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Copy my settings and API keys to the new user
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={creating}>
            <Save className="mr-2 h-4 w-4" />
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
