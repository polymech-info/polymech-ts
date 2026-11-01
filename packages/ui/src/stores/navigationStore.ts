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

interface NavigationStore {
  // Wizard state (replaces sessionStorage)
  wizardInitialImage: WizardInitialImage | null;
  wizardReturnPath: string | null;

  // Global Creation Wizard state
  creationWizardOpen: boolean;
  creationWizardMode: 'default' | 'page';

  // Wizard actions
  setWizardImage: (image: WizardInitialImage | null, returnPath?: string) => void;
  clearWizardImage: () => void;
  setCreationWizardOpen: (open: boolean, mode?: 'default' | 'page') => void;

  // Reset all
  reset: () => void;
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      // Initial state
      wizardInitialImage: null,
      wizardReturnPath: null,
      creationWizardOpen: false,
      creationWizardMode: 'default',

      // Set wizard image (replaces sessionStorage)
      setWizardImage: (image, returnPath) => {
        set({
          wizardInitialImage: image,
          wizardReturnPath: returnPath || null
        });
      },

      // Clear wizard image
      clearWizardImage: () => {
        set({
          wizardInitialImage: null,
          wizardReturnPath: null
        });
      },

      // Set global creation wizard open state
      setCreationWizardOpen: (open, mode = 'default') => {
        set({
          creationWizardOpen: open,
          creationWizardMode: mode
        });
      },

      // Reset entire store
      reset: () => {
        set({
          wizardInitialImage: null,
          wizardReturnPath: null,
          creationWizardOpen: false,
          creationWizardMode: 'default'
        });
      }
    }),
    {
      name: 'pm-pics-navigation', // localStorage key
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        wizardInitialImage: state.wizardInitialImage,
        wizardReturnPath: state.wizardReturnPath,
      }),

      version: 2, // Bump version to clear old navigation data from localStorage

      skipHydration: false,
    }
  )
);

// Selectors
export const selectWizardImage = (state: NavigationStore) => state.wizardInitialImage;
export const selectWizardReturnPath = (state: NavigationStore) => state.wizardReturnPath;
export const selectCreationWizardOpen = (state: NavigationStore) => state.creationWizardOpen;
export const selectCreationWizardMode = (state: NavigationStore) => state.creationWizardMode;
