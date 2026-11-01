import { ResponsiveData } from '../components/ResponsiveImage';
interface UseResponsiveImageProps {
    src: string | File | null;
    responsiveSizes?: number[];
    formats?: string[];
    enabled?: boolean;
    apiUrl?: string;
}
export declare const useResponsiveImage: ({ src, responsiveSizes, formats, enabled, apiUrl, }: UseResponsiveImageProps) => {
    data: ResponsiveData;
    loading: boolean;
    error: string;
};
export {};
