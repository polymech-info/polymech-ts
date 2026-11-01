/**
 * useWizardContext Hook
 *
 * Self-contained wizard state (initial image, return path, creation wizard).
 * Uses its own Zustand store with localStorage persistence — no external
 * navigation store dependency.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface WizardInitialImage {
  id: string;
  src: string;
  title: string;
  realDatabaseId?: string;
  selected: boolean;
}

interface WizardStore {
  wizardInitialImage: WizardInitialImage | null;
  wizardReturnPath: string | null;
  creationWizardOpen: boolean;
  creationWizardMode: 'default' | 'page';

  setWizardImage: (image: WizardInitialImage | null, returnPath?: string) => void;
  clearWizardImage: () => void;
  setCreationWizardOpen: (open: boolean, mode?: 'default' | 'page') => void;
  reset: () => void;
}

const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      wizardInitialImage: null,
      wizardReturnPath: null,
      creationWizardOpen: false,
      creationWizardMode: 'default',

      setWizardImage: (image, returnPath) =>
        set({ wizardInitialImage: image, wizardReturnPath: returnPath || null }),

      clearWizardImage: () =>
        set({ wizardInitialImage: null, wizardReturnPath: null }),

      setCreationWizardOpen: (open, mode = 'default') =>
        set({ creationWizardOpen: open, creationWizardMode: mode }),

      reset: () =>
        set({
          wizardInitialImage: null,
          wizardReturnPath: null,
          creationWizardOpen: false,
          creationWizardMode: 'default',
        }),
    }),
    {
      name: 'pm-pics-navigation',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wizardInitialImage: state.wizardInitialImage,
        wizardReturnPath: state.wizardReturnPath,
      }),
      version: 2,
      skipHydration: false,
    },
  ),
);

export const useWizardContext = () => {
  const wizardInitialImage = useWizardStore((s) => s.wizardInitialImage);
  const wizardReturnPath = useWizardStore((s) => s.wizardReturnPath);
  const setWizardImage = useWizardStore((s) => s.setWizardImage);
  const clearWizardImage = useWizardStore((s) => s.clearWizardImage);
  const creationWizardOpen = useWizardStore((s) => s.creationWizardOpen);
  const creationWizardMode = useWizardStore((s) => s.creationWizardMode);
  const setCreationWizardOpen = useWizardStore((s) => s.setCreationWizardOpen);

  return {
    wizardInitialImage,
    wizardReturnPath,
    setWizardImage,
    clearWizardImage,
    creationWizardOpen,
    creationWizardMode,
    setCreationWizardOpen,
  };
};

export default useWizardContext;
