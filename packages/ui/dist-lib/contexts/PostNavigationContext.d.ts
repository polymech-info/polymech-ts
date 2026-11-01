import { ReactNode } from 'react';
import { PostNavigationData } from '../types';
interface PostNavigationContextType {
    navigationData: PostNavigationData | null;
    setNavigationData: (data: PostNavigationData | null) => void;
    preloadedImages: Map<string, boolean>;
    preloadImage: (imageUrl: string) => void;
}
export declare const usePostNavigation: () => PostNavigationContextType;
interface PostNavigationProviderProps {
    children: ReactNode;
}
export declare const PostNavigationProvider: ({ children }: PostNavigationProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
