import { UserProfile } from '../pages/Post/types';
import { MediaType } from '../types';
import { FeedSortOption } from '../hooks/useFeedData';
export interface MediaItemType {
    id: string;
    picture_id?: string;
    title: string;
    description: string | null;
    image_url: string;
    thumbnail_url: string | null;
    type: MediaType;
    meta: any | null;
    likes_count: number;
    created_at: string;
    user_id: string;
    comments: {
        count: number;
    }[];
    author_profile?: UserProfile;
    job?: any;
    responsive?: any;
}
interface MediaGridProps {
    customPictures?: MediaItemType[];
    customLoading?: boolean;
    navigationSource?: 'home' | 'collection' | 'tag' | 'user' | 'widget';
    navigationSourceId?: string;
    isOwner?: boolean;
    onFilesDrop?: (files: File[]) => void;
    showVideos?: boolean;
    sortBy?: FeedSortOption;
    supabaseClient?: any;
    apiUrl?: string;
}
declare const MediaGrid: ({ customPictures, customLoading, navigationSource, navigationSourceId, isOwner, onFilesDrop, showVideos, sortBy, supabaseClient, apiUrl }: MediaGridProps) => import("react/jsx-runtime").JSX.Element;
export default MediaGrid;
export { MediaGrid };
export declare const PhotoGrid: ({ customPictures, customLoading, navigationSource, navigationSourceId, isOwner, onFilesDrop, showVideos, sortBy, supabaseClient, apiUrl }: MediaGridProps) => import("react/jsx-runtime").JSX.Element;
