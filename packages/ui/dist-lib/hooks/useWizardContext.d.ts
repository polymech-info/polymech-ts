/**
 * useWizardContext Hook
 *
 * Replaces sessionStorage for wizard initial image and return path
 * Uses Zustand store with localStorage persistence
 */
export declare const useWizardContext: () => {
    wizardInitialImage: import('../stores/navigationStore').WizardInitialImage;
    wizardReturnPath: string;
    setWizardImage: (image: import('../stores/navigationStore').WizardInitialImage | null, returnPath?: string) => void;
    clearWizardImage: () => void;
    creationWizardOpen: boolean;
    creationWizardMode: "page" | "default";
    setCreationWizardOpen: (open: boolean, mode?: "default" | "page") => void;
};
export default useWizardContext;
