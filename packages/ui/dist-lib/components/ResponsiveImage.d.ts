import { default as React } from 'react';
interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | File;
    sizes?: string;
    className?: string;
    imgClassName?: string;
    responsiveSizes?: number[];
    formats?: string[];
    alt: string;
    onDataLoaded?: (data: ResponsiveData) => void;
    rootMargin?: string;
    data?: ResponsiveData;
    apiUrl?: string;
}
export interface ResponsiveData {
    img: {
        src: string;
        width: number;
        height: number;
        format: string;
    };
    sources?: {
        srcset: string;
        type: string;
    }[];
}
declare const ResponsiveImage: React.FC<ResponsiveImageProps>;
export default ResponsiveImage;
