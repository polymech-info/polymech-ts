import { toast } from 'sonner';
import { translate } from '@/i18n';
import { QuickAction } from '@/constants';
import { PromptPreset } from '@/components/PresetManager';
import { Workflow } from '@/components/WorkflowManager';
import { getUserSettings, updateUserSettings } from '@/modules/user/client-user';

/**
 * Settings Handlers
 * - Load/save prompt templates
 * - Load/save prompt presets
 * - Load/save workflows
 * - Load/save quick actions
 * - Load/save prompt history
 * - Prompt history navigation
 */

export const loadPromptTemplates = async (
  userId: string,
  setPromptTemplates: React.Dispatch<React.SetStateAction<Array<{ name: string; template: string }>>>,
  setLoadingTemplates: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoadingTemplates(true);
  console.log('loading prompt templates');
  try {
    const settings = await getUserSettings(userId);
    const templates = settings?.promptTemplates || [];
    setPromptTemplates(templates);
  } catch (error) {
    console.error('Error loading prompt templates:', error);
  } finally {
    setLoadingTemplates(false);
  }
};

export const savePromptTemplates = async (
  userId: string,
  templates: Array<{ name: string; template: string }>
) => {
  try {
    const currentSettings = await getUserSettings(userId);
    const newSettings = {
      ...currentSettings,
      promptTemplates: templates
    };

    await updateUserSettings(userId, newSettings);

    toast.success(translate('Templates saved successfully!'));
  } catch (error) {
    console.error('Error saving prompt templates:', error);
    toast.error(translate('Failed to save templates'));
    throw error;
  }
};

export const loadPromptPresets = async (
  userId: string,
  setPromptPresets: React.Dispatch<React.SetStateAction<PromptPreset[]>>,
  setLoadingPresets: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoadingPresets(true);
  try {
    const settings = await getUserSettings(userId);
    const presets = settings?.promptPresets || [];
    setPromptPresets(presets);
  } catch (error) {
    console.error('Error loading prompt presets:', error);
  } finally {
    setLoadingPresets(false);
  }
};

export const loadWorkflows = async (
  userId: string,
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>,
  setLoadingWorkflows: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoadingWorkflows(true);
  try {
    const settings = await getUserSettings(userId);
    const workflows = settings?.workflows || [];
    setWorkflows(workflows);
  } catch (error) {
    console.error('Error loading workflows:', error);
  } finally {
    setLoadingWorkflows(false);
  }
};

export const loadQuickActions = async (
  userId: string,
  setQuickActions: React.Dispatch<React.SetStateAction<QuickAction[]>>,
  setLoadingActions: React.Dispatch<React.SetStateAction<boolean>>,
  DEFAULT_QUICK_ACTIONS: QuickAction[]
) => {
  setLoadingActions(true);
  try {
    const settings = await getUserSettings(userId);
    const actions = settings?.quickActions || DEFAULT_QUICK_ACTIONS;
    setQuickActions(actions);
  } catch (error) {
    console.error('Error loading quick actions:', error);
    setQuickActions(DEFAULT_QUICK_ACTIONS);
  } finally {
    setLoadingActions(false);
  }
};

export const saveQuickActions = async (
  userId: string,
  actions: QuickAction[]
) => {
  try {
    const currentSettings = await getUserSettings(userId);

    await updateUserSettings(userId, {
      ...currentSettings,
      quickActions: actions
    });

    toast.success('Quick Actions saved');
  } catch (error) {
    console.error('Error saving quick actions:', error);
    toast.error('Failed to save quick actions');
    throw error;
  }
};

export const loadPromptHistory = async (
  userId: string,
  setPromptHistory: React.Dispatch<React.SetStateAction<string[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const history = settings?.promptHistory || [];
    setPromptHistory(history);
  } catch (error) {
    console.error('Error loading prompt history:', error);
  }
};

export const addToPromptHistory = async (
  userId: string,
  promptText: string,
  setPromptHistory: React.Dispatch<React.SetStateAction<string[]>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>
) => {
  if (!promptText.trim()) return;

  try {
    const currentSettings = await getUserSettings(userId);
    const currentHistory = currentSettings.promptHistory || [];

    // Add to history, avoid duplicates, limit to 50
    const newHistory = [promptText, ...currentHistory.filter((h: string) => h !== promptText)].slice(0, 50);

    await updateUserSettings(userId, {
      ...currentSettings,
      promptHistory: newHistory
    });

    setPromptHistory(newHistory);
    setHistoryIndex(-1); // Reset to latest
  } catch (error) {
    console.error('Error saving prompt history:', error);
  }
};

export const navigatePromptHistory = (
  direction: 'up' | 'down',
  promptHistory: string[],
  historyIndex: number,
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>,
  setPrompt: React.Dispatch<React.SetStateAction<string>>
) => {
  if (promptHistory.length === 0) return;

  let newIndex = historyIndex;

  if (direction === 'up') {
    // Go back in history
    newIndex = Math.min(historyIndex + 1, promptHistory.length - 1);
  } else {
    // Go forward in history
    newIndex = Math.max(historyIndex - 1, -1);
  }

  setHistoryIndex(newIndex);

  if (newIndex === -1) {
    setPrompt('');
  } else {
    setPrompt(promptHistory[newIndex]);
  }
};

// ============================================================================
// PRESET CRUD OPERATIONS
// ============================================================================

export const savePromptPreset = async (
  userId: string,
  preset: Omit<PromptPreset, 'id' | 'createdAt'>,
  setPromptPresets: React.Dispatch<React.SetStateAction<PromptPreset[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingPresets = settings.promptPresets || [];

    const newPreset: PromptPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: preset.name,
      prompt: preset.prompt,
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...existingPresets, newPreset];

    await updateUserSettings(userId, {
      ...settings,
      promptPresets: updatedPresets,
    });

    setPromptPresets(updatedPresets);
    toast.success(translate('Preset saved successfully!'));
  } catch (error) {
    console.error('Error saving prompt preset:', error);
    toast.error(translate('Failed to save preset'));
    throw error;
  }
};

export const updatePromptPreset = async (
  userId: string,
  id: string,
  preset: Omit<PromptPreset, 'id' | 'createdAt'>,
  setPromptPresets: React.Dispatch<React.SetStateAction<PromptPreset[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingPresets = settings.promptPresets || [];

    const updatedPresets = existingPresets.map((p: PromptPreset) =>
      p.id === id
        ? { ...p, name: preset.name, prompt: preset.prompt }
        : p
    );

    await updateUserSettings(userId, {
      ...settings,
      promptPresets: updatedPresets,
    });

    setPromptPresets(updatedPresets);
    toast.success(translate('Preset updated successfully!'));
  } catch (error) {
    console.error('Error updating prompt preset:', error);
    toast.error(translate('Failed to update preset'));
    throw error;
  }
};

export const deletePromptPreset = async (
  userId: string,
  id: string,
  setPromptPresets: React.Dispatch<React.SetStateAction<PromptPreset[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingPresets = settings.promptPresets || [];

    const updatedPresets = existingPresets.filter((p: PromptPreset) => p.id !== id);

    await updateUserSettings(userId, {
      ...settings,
      promptPresets: updatedPresets,
    });

    setPromptPresets(updatedPresets);
    toast.success(translate('Preset deleted successfully!'));
  } catch (error) {
    console.error('Error deleting prompt preset:', error);
    toast.error(translate('Failed to delete preset'));
    throw error;
  }
};

// ============================================================================
// WORKFLOW CRUD OPERATIONS
// ============================================================================

export const saveWorkflow = async (
  userId: string,
  workflow: Omit<Workflow, 'id' | 'createdAt'>,
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingWorkflows = settings.workflows || [];

    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: workflow.name,
      actions: workflow.actions,
      createdAt: new Date().toISOString(),
    };

    const updatedWorkflows = [...existingWorkflows, newWorkflow];

    await updateUserSettings(userId, {
      ...settings,
      workflows: updatedWorkflows,
    });

    setWorkflows(updatedWorkflows);
    toast.success(translate('Workflow saved successfully!'));
  } catch (error) {
    console.error('Error saving workflow:', error);
    toast.error(translate('Failed to save workflow'));
    throw error;
  }
};

export const updateWorkflow = async (
  userId: string,
  id: string,
  workflow: Omit<Workflow, 'id' | 'createdAt'>,
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingWorkflows = settings.workflows || [];

    const updatedWorkflows = existingWorkflows.map((w: Workflow) =>
      w.id === id
        ? { ...w, name: workflow.name, actions: workflow.actions }
        : w
    );

    await updateUserSettings(userId, {
      ...settings,
      workflows: updatedWorkflows,
    });

    setWorkflows(updatedWorkflows);
    toast.success(translate('Workflow updated successfully!'));
  } catch (error) {
    console.error('Error updating workflow:', error);
    toast.error(translate('Failed to update workflow'));
    throw error;
  }
};

export const deleteWorkflow = async (
  userId: string,
  id: string,
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>
) => {
  try {
    const settings = await getUserSettings(userId);
    const existingWorkflows = settings.workflows || [];

    const updatedWorkflows = existingWorkflows.filter((w: Workflow) => w.id !== id);

    await updateUserSettings(userId, {
      ...settings,
      workflows: updatedWorkflows,
    });

    setWorkflows(updatedWorkflows);
    toast.success(translate('Workflow deleted successfully!'));
  } catch (error) {
    console.error('Error deleting workflow:', error);
    toast.error(translate('Failed to delete workflow'));
    throw error;
  }
};
