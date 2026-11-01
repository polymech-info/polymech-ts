import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, Save, X, GripVertical, Wand2, Sparkles, Upload, FileText, Brain, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export type WorkflowActionType = 
  | 'optimize_prompt'
  | 'generate_image'
  | 'generate_metadata'
  | 'publish_image'
  | 'quick_publish'
  | 'download_image'
  | 'enhance_image'
  | 'apply_style';

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  label: string;
  icon?: React.ReactNode; // Optional since it won't be stored in DB
  description: string;
}

export interface Workflow {
  id: string;
  name: string;
  actions: WorkflowAction[];
  createdAt: string;
}

interface WorkflowManagerProps {
  workflows: Workflow[];
  onSaveWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateWorkflow: (id: string, workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onExecuteWorkflow: (workflow: Workflow) => Promise<void>;
  loading?: boolean;
}

// Icon mapping function to avoid serialization issues
const getActionIcon = (type: WorkflowActionType) => {
  const iconMap: Record<WorkflowActionType, React.ReactNode> = {
    'optimize_prompt': <Sparkles className="w-4 h-4" />,
    'generate_image': <Wand2 className="w-4 h-4" />,
    'generate_metadata': <FileText className="w-4 h-4" />,
    'publish_image': <Upload className="w-4 h-4" />,
    'quick_publish': <Upload className="w-4 h-4" />,
    'download_image': <ArrowDown className="w-4 h-4" />,
    'enhance_image': <Sparkles className="w-4 h-4" />,
    'apply_style': <Wand2 className="w-4 h-4" />,
  };
  return iconMap[type] || <ImageIcon className="w-4 h-4" />;
};

// Available action palette
const AVAILABLE_ACTIONS: WorkflowAction[] = [
  {
    id: 'optimize_prompt',
    type: 'optimize_prompt',
    label: 'Optimize Prompt',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Enhance prompt with AI suggestions',
  },
  {
    id: 'generate_image',
    type: 'generate_image',
    label: 'Generate Image',
    icon: <Wand2 className="w-4 h-4" />,
    description: 'Create image from prompt',
  },
  {
    id: 'generate_metadata',
    type: 'generate_metadata',
    label: 'Generate Metadata',
    icon: <FileText className="w-4 h-4" />,
    description: 'Create title and description',
  },
  {
    id: 'publish_image',
    type: 'publish_image',
    label: 'Publish Image',
    icon: <Upload className="w-4 h-4" />,
    description: 'Save to gallery with metadata',
  },
  {
    id: 'quick_publish',
    type: 'quick_publish',
    label: 'Quick Publish',
    icon: <Upload className="w-4 h-4" />,
    description: 'Fast publish with prompt as description',
  },
  {
    id: 'download_image',
    type: 'download_image',
    label: 'Download Image',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Download image to device',
  },
  {
    id: 'enhance_image',
    type: 'enhance_image',
    label: 'Enhance Image',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Apply AI enhancement',
  },
  {
    id: 'apply_style',
    type: 'apply_style',
    label: 'Apply Style',
    icon: <Brain className="w-4 h-4" />,
    description: 'Apply artistic style transformation',
  },
];

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  workflows,
  onSaveWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow,
  onExecuteWorkflow,
  loading = false,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  
  const [workflowName, setWorkflowName] = useState('');
  const [selectedActions, setSelectedActions] = useState<WorkflowAction[]>([]);

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    
    if (selectedActions.length === 0) {
      toast.error('Please add at least one action to the workflow');
      return;
    }

    try {
      // Strip icon field to avoid serialization issues
      const actionsForDb = selectedActions.map(({ icon, ...action }) => action);
      
      await onSaveWorkflow({
        name: workflowName.trim(),
        actions: actionsForDb as WorkflowAction[],
      });
      
      toast.success('Workflow created successfully');
      setIsCreateDialogOpen(false);
      setWorkflowName('');
      setSelectedActions([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workflow');
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;
    
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }
    
    if (selectedActions.length === 0) {
      toast.error('Please add at least one action to the workflow');
      return;
    }

    try {
      // Strip icon field to avoid serialization issues
      const actionsForDb = selectedActions.map(({ icon, ...action }) => action);
      
      await onUpdateWorkflow(editingWorkflow.id, {
        name: workflowName.trim(),
        actions: actionsForDb as WorkflowAction[],
      });
      
      toast.success('Workflow updated successfully');
      setIsEditDialogOpen(false);
      setEditingWorkflow(null);
      setWorkflowName('');
      setSelectedActions([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;

    try {
      await onDeleteWorkflow(deleteWorkflowId);
      toast.success('Workflow deleted successfully');
      setDeleteWorkflowId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workflow');
    }
  };

  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.name);
    setSelectedActions([...workflow.actions]);
    setIsEditDialogOpen(true);
  };

  const addAction = (action: WorkflowAction) => {
    // Create a unique instance for the workflow (without icon to avoid serialization issues)
    const newAction = {
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: action.type,
      label: action.label,
      description: action.description,
      icon: action.icon, // Keep icon for UI but it won't be saved to DB
    };
    setSelectedActions([...selectedActions, newAction]);
  };

  const removeAction = (actionId: string) => {
    setSelectedActions(selectedActions.filter(a => a.id !== actionId));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedActions.length - 1) return;

    const newActions = [...selectedActions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
    setSelectedActions(newActions);
  };

  const handleExecuteWorkflow = async (workflow: Workflow) => {
    try {
      await onExecuteWorkflow(workflow);
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute workflow');
    }
  };

  return (
    <div className="border border-purple-200/50 dark:border-purple-500/30 rounded-xl p-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-white">
            <T>Workflows</T>
          </h4>
          <Badge variant="outline" className="text-xs">
            {workflows.length}
          </Badge>
        </div>
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedActions([]);
            setWorkflowName('');
            setIsCreateDialogOpen(true);
          }}
          disabled={loading}
          className="h-7 px-2 text-xs"
          title="Create new workflow"
        >
          <Plus className="w-3 h-3 mr-1" />
          <T>New Workflow</T>
        </Button>
      </div>

      <div className="space-y-2">
        {workflows.length === 0 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            <T>No workflows saved yet. Create a workflow to automate your image generation process!</T>
          </span>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group relative p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-slate-800/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-slate-700 dark:text-white mb-1">
                    {workflow.name}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {workflow.actions.map((action, idx) => (
                      <Badge 
                        key={action.id} 
                        variant="secondary" 
                        className="text-xs flex items-center gap-1"
                      >
                        <span className="text-purple-600 dark:text-purple-400">{idx + 1}.</span>
                        {getActionIcon(action.type)}
                        {action.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExecuteWorkflow(workflow)}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                    title="Execute workflow"
                  >
                    <Play className="w-3 h-3 text-green-600" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(workflow)}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                    title="Edit workflow"
                  >
                    <Edit className="w-3 h-3 text-blue-600" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteWorkflowId(workflow.id)}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                    title="Delete workflow"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingWorkflow(null);
          setWorkflowName('');
          setSelectedActions([]);
        }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? <T>Edit Workflow</T> : <T>Create New Workflow</T>}
            </DialogTitle>
            <DialogDescription>
              <T>Build a custom workflow by selecting and ordering actions from the palette below.</T>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Workflow Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Workflow Name</T>
              </label>
              <Input
                placeholder="e.g., Quick Publish Workflow, Full Generation Pipeline"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            {/* Action Palette */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Available Actions</T>
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {AVAILABLE_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => addAction(action)}
                    className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all text-left group"
                    title={action.description}
                  >
                    <div className="text-purple-600 dark:text-purple-400">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                        {action.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {action.description}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Actions (Workflow Steps) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                <T>Workflow Steps</T> ({selectedActions.length})
              </label>
              {selectedActions.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <T>No actions added yet. Click on actions above to build your workflow.</T>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-700">
                  {selectedActions.map((action, index) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => moveAction(index, 'up')}
                            disabled={index === 0}
                            className="h-5 w-5 p-0"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => moveAction(index, 'down')}
                            disabled={index === selectedActions.length - 1}
                            className="h-5 w-5 p-0"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-semibold">
                          {index + 1}
                        </div>
                        
                        <div className="text-purple-600 dark:text-purple-400">
                          {getActionIcon(action.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {action.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAction(action.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove action"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isEditDialogOpen) {
                  setIsEditDialogOpen(false);
                  setEditingWorkflow(null);
                } else {
                  setIsCreateDialogOpen(false);
                }
                setWorkflowName('');
                setSelectedActions([]);
              }}
            >
              <T>Cancel</T>
            </Button>
            <Button
              type="button"
              onClick={isEditDialogOpen ? handleUpdateWorkflow : handleCreateWorkflow}
              disabled={!workflowName.trim() || selectedActions.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditDialogOpen ? <T>Update Workflow</T> : <T>Create Workflow</T>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteWorkflowId !== null} onOpenChange={(open) => !open && setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <T>Delete Workflow?</T>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <T>Are you sure you want to delete this workflow? This action cannot be undone.</T>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteWorkflowId(null)}>
              <T>Cancel</T>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
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

export default WorkflowManager;

