export interface NavigationPost {
    id: string;
    title: string;
    image_url: string;
    user_id: string;
}
export interface NavigationData {
    posts: NavigationPost[];
    currentIndex: number;
    source: 'home' | 'collection' | 'tag' | 'search' | 'user' | 'photogrid';
    sourceId?: string;
}
export interface NavigationHistory {
    path: string;
    data: NavigationData;
    timestamp: number;
}
export interface WizardInitialImage {
    id: string;
    src: string;
    title: string;
    realDatabaseId?: string;
    selected: boolean;
}
interface NavigationStore {
    navigationData: NavigationData | null;
    history: NavigationHistory[];
    wizardInitialImage: WizardInitialImage | null;
    wizardReturnPath: string | null;
    creationWizardOpen: boolean;
    creationWizardMode: 'default' | 'page';
    setNavigationData: (data: NavigationData | null) => void;
    updateCurrentIndex: (index: number) => void;
    pushHistory: (path: string, data: NavigationData) => void;
    popHistory: () => NavigationHistory | null;
    clearHistory: () => void;
    canGoBack: () => boolean;
    setWizardImage: (image: WizardInitialImage | null, returnPath?: string) => void;
    clearWizardImage: () => void;
    setCreationWizardOpen: (open: boolean, mode?: 'default' | 'page') => void;
    preloadImage: (url: string) => void;
    reset: () => void;
}
export declare const useNavigationStore: import('zustand').UseBoundStore<Omit<import('zustand').StoreApi<NavigationStore>, "setState" | "persist"> & {
    setState(partial: NavigationStore | Partial<NavigationStore> | ((state: NavigationStore) => NavigationStore | Partial<NavigationStore>), replace?: false): unknown;
    setState(state: NavigationStore | ((state: NavigationStore) => NavigationStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import('zustand/middleware').PersistOptions<NavigationStore, unknown, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: NavigationStore) => void) => () => void;
        onFinishHydration: (fn: (state: NavigationStore) => void) => () => void;
        getOptions: () => Partial<import('zustand/middleware').PersistOptions<NavigationStore, unknown, unknown>>;
    };
}>;
export declare const selectNavigationData: (state: NavigationStore) => NavigationData;
export declare const selectCurrentIndex: (state: NavigationStore) => number;
export declare const selectPosts: (state: NavigationStore) => NavigationPost[];
export declare const selectCanGoBack: (state: NavigationStore) => boolean;
export declare const selectWizardImage: (state: NavigationStore) => WizardInitialImage;
export declare const selectWizardReturnPath: (state: NavigationStore) => string;
export declare const selectCreationWizardOpen: (state: NavigationStore) => boolean;
export declare const selectCreationWizardMode: (state: NavigationStore) => "page" | "default";
export {};
