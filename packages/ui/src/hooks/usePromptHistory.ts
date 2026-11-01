import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useLog } from '@/contexts/LogContext';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { getUserSettings, updateUserSettings } from '@/modules/user/client-user';

const MAX_HISTORY_LENGTH = 50;

export const usePromptHistory = (settingsKey: string = 'promptHistory') => {
  const { user } = useAuth();
  const { addLog } = useLog();
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        try {
          const settings = await getUserSettings(user.id);
          const history = (settings && typeof settings === 'object' && settingsKey in settings && Array.isArray(settings[settingsKey]))
            ? settings[settingsKey].filter((item: any): item is string => typeof item === 'string')
            : [];
          setPromptHistory(history);
        } catch (error: any) {
          addLog('error', '[PromptHistory] Failed to fetch history', error);
        }
      }
    };
    fetchHistory();
  }, [user, addLog, settingsKey]);

  const updateRemoteHistory = useCallback(async (newHistory: string[]) => {
    if (user) {
      try {
        // First, fetch the current settings to avoid overwriting them
        const currentSettings = await getUserSettings(user.id);
        const newSettings = {
          ...currentSettings,
          [settingsKey]: newHistory,
        };

        await updateUserSettings(user.id, newSettings);
        addLog('debug', '[PromptHistory] Saved updated prompt history to Supabase');
      } catch (error: any) {
        addLog('error', '[PromptHistory] Failed to save history', error);
        toast.error(translate('Failed to save prompt history.'));
      }
    }
  }, [user, addLog, settingsKey]);

  const addPromptToHistory = useCallback((prompt: string) => {
    if (!prompt.trim() || promptHistory[0] === prompt) {
      return;
    }
    const newHistory = [prompt, ...promptHistory.filter(p => p !== prompt)].slice(0, MAX_HISTORY_LENGTH);
    setPromptHistory(newHistory);
    updateRemoteHistory(newHistory);
  }, [promptHistory, updateRemoteHistory]);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    setHistoryIndex(prevIndex => {
      let newIndex;
      if (direction === 'up') {
        newIndex = Math.min(prevIndex + 1, promptHistory.length - 1);
      } else { // down
        newIndex = Math.max(prevIndex - 1, -1);
      }

      if (newIndex !== prevIndex) {
        setCurrentPrompt(newIndex === -1 ? '' : promptHistory[newIndex]);
      }
      return newIndex;
    });
  }, [promptHistory]);

  return {
    prompt: currentPrompt,
    setPrompt: setCurrentPrompt,
    promptHistory,
    historyIndex,
    navigateHistory,
    addPromptToHistory,
    setHistoryIndex,
  };
};
