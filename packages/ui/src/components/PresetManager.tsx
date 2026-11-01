import React, { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { T } from '@/i18n';

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
}

interface PresetManagerProps {
  presets: PromptPreset[];
  currentPrompt: string;
  onSelectPreset: (preset: PromptPreset) => void;
  onSavePreset: (preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePreset: (id: string, preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePreset: (id: string) => Promise<void>;
  loading?: boolean;
  selectedPresetId?: string; // Track which preset is active
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  currentPrompt,
  onSelectPreset,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
  loading = false,
  selectedPresetId,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<PromptPreset | null>(null);
  
  const [presetName, setPresetName] = useState('');
  const [presetPrompt, setPresetPrompt] = useState('');

  const handleCreatePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    if (!presetPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      await onSavePreset({
        name: presetName.trim(),
        prompt: presetPrompt.trim(),
      });
      
      toast.success('Preset created successfully');
      setIsCreateDialogOpen(false);
      setPresetName('');
      setPresetPrompt('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create preset');
    }
  };

  const handleUpdatePreset = async () => {
    if (!editingPreset) return;
    
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    if (!presetPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      await onUpdatePreset(editingPreset.id, {
        name: presetName.trim(),
        prompt: presetPrompt.trim(),
      });
      
      toast.success('Preset updated successfully');
      setIsEditDialogOpen(false);
      setEditingPreset(null);
      setPresetName('');
      setPresetPrompt('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preset');
    }
  };

  const handleDeletePreset = async () => {
    if (!deletePresetId) return;

    try {
      await onDeletePreset(deletePresetId);
      toast.success('Preset deleted successfully');
      setDeletePresetId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete preset');
    }
  };

  const openEditDialog = (preset: PromptPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetPrompt(preset.prompt);
    setIsEditDialogOpen(true);
  };

  const openCreateDialogWithCurrent = () => {
    setPresetPrompt(currentPrompt);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="border border-blue-200/50 dark:border-blue-500/30 rounded-xl p-4 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/20 dark:to-purple-900/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-white">
            <T>Presets</T>
          </h4>
          <Badge variant="outline" className="text-xs">
            {presets.length}
          </Badge>
        </div>
        
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openCreateDialogWithCurrent}
            disabled={loading || !currentPrompt.trim()}
            className="h-6 w-6 p-0"
            title="Save current prompt as preset"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setPresetPrompt('');
              setIsCreateDialogOpen(true);
            }}
            disabled={loading}
            className="h-6 w-6 p-0"
            title="Create new preset"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.length === 0 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            <T>No presets saved yet. Create your first preset to quickly access your favorite prompts!</T>
          </span>
        ) : (
          presets.map((preset) => {
            const isActive = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className="group relative"
              >
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  disabled={loading || isActive}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md disabled:opacity-50 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800 text-green-700 dark:text-green-200 border-green-400 dark:border-green-600 ring-2 ring-green-400 dark:ring-green-600 cursor-default'
                      : 'bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 dark:from-blue-800 dark:to-purple-800 dark:hover:from-blue-700 dark:hover:to-purple-700 text-blue-700 dark:text-blue-200 border-blue-300/50 dark:border-blue-600/50 cursor-pointer disabled:cursor-not-allowed'
                  }`}
                  title={isActive ? 'Active context' : preset.prompt}
                >
                  {isActive && '✓ '}{preset.name}
                </button>
              
              {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
              <div className="absolute -top-2 -right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(preset);
                  }}
                  className="p-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg active:scale-95 transition-transform"
                  title="Edit preset"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletePresetId(preset.id);
                  }}
                  className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg active:scale-95 transition-transform"
                  title="Delete preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Create Preset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <T>Create New Preset</T>
            </DialogTitle>
            <DialogDescription>
              <T>Save a prompt preset that you can quickly access later. Perfect for your favorite styles and techniques!</T>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Preset Name</T>
              </label>
              <Input
                placeholder="e.g., Cinematic Portrait, Fantasy Landscape"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Prompt</T>
              </label>
              <Textarea
                placeholder="Enter the prompt that will be used when this preset is selected..."
                value={presetPrompt}
                onChange={(e) => setPresetPrompt(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 mt-1">
                {presetPrompt.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setPresetName('');
                setPresetPrompt('');
              }}
            >
              <T>Cancel</T>
            </Button>
            <Button
              type="button"
              onClick={handleCreatePreset}
              disabled={!presetName.trim() || !presetPrompt.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              <T>Save Preset</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <T>Edit Preset</T>
            </DialogTitle>
            <DialogDescription>
              <T>Update your preset name and prompt.</T>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Preset Name</T>
              </label>
              <Input
                placeholder="e.g., Cinematic Portrait, Fantasy Landscape"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Prompt</T>
              </label>
              <Textarea
                placeholder="Enter the prompt that will be used when this preset is selected..."
                value={presetPrompt}
                onChange={(e) => setPresetPrompt(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500 mt-1">
                {presetPrompt.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPreset(null);
                setPresetName('');
                setPresetPrompt('');
              }}
            >
              <T>Cancel</T>
            </Button>
            <Button
              type="button"
              onClick={handleUpdatePreset}
              disabled={!presetName.trim() || !presetPrompt.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              <T>Update Preset</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePresetId !== null} onOpenChange={(open) => !open && setDeletePresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <T>Delete Preset?</T>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <T>Are you sure you want to delete this preset? This action cannot be undone.</T>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePresetId(null)}>
              <T>Cancel</T>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePreset}
              className="bg-red-600 hover:bg-red-700"
            >
              <T>Delete</T>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PresetManager;

