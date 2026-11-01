import { default as React } from 'react';
import { MediaRendererProps } from '../lib/mediaRegistry';
interface PageCardProps extends Omit<MediaRendererProps, 'created_at'> {
    variant?: 'grid' | 'feed';
    responsive?: any;
    showContent?: boolean;
    authorAvatarUrl?: string | null;
    created_at?: string;
    apiUrl?: string;
}
declare const PageCard: React.FC<PageCardProps>;
export default PageCard;
