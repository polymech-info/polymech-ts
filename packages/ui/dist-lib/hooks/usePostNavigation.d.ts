/**
 * usePostNavigation Hook
 *
 * Compatibility wrapper around Zustand navigationStore
 * Provides same API as old PostNavigationContext for easy migration
 */
export declare const usePostNavigation: () => {
    navigationData: import('../stores/navigationStore').NavigationData;
    setNavigationData: (data: import('../stores/navigationStore').NavigationData | null) => void;
    preloadImage: (url: string) => void;
    updateCurrentIndex: (index: number) => void;
};
export default usePostNavigation;
