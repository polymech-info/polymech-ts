import { MuxResolution } from '../types';
interface VideoCardProps {
    videoId: string;
    videoUrl: string;
    thumbnailUrl?: string;
    title: string;
    author: string;
    authorId: string;
    likes: number;
    comments: number;
    isLiked?: boolean;
    description?: string | null;
    onClick?: (videoId: string) => void;
    onLike?: () => void;
    onDelete?: () => void;
    maxResolution?: MuxResolution;
    authorAvatarUrl?: string | null;
    showContent?: boolean;
    created_at?: string;
    job?: any;
    variant?: 'grid' | 'feed';
    showPlayButton?: boolean;
    apiUrl?: string;
}
declare const VideoCard: ({ videoId, videoUrl, thumbnailUrl, title, author, authorId, likes, comments, isLiked, description, onClick, onLike, onDelete, maxResolution, authorAvatarUrl, showContent, showPlayButton, created_at, job, variant, apiUrl }: VideoCardProps) => import("react/jsx-runtime").JSX.Element;
export default VideoCard;
