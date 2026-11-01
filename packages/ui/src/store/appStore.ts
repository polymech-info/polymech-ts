import { create } from 'zustand';

interface AppState {
  showGlobalFooter: boolean;
  setShowGlobalFooter: (show: boolean) => void;
  /** Hides app chrome (nav, footer, max-width) for file browser routes — in-app fullscreen, not browser Fullscreen API. */
  fileBrowserImmersive: boolean;
  setFileBrowserImmersive: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  showGlobalFooter: true,
  setShowGlobalFooter: (show) => set({ showGlobalFooter: show }),
  fileBrowserImmersive: false,
  setFileBrowserImmersive: (v) => set({ fileBrowserImmersive: v }),
}));
