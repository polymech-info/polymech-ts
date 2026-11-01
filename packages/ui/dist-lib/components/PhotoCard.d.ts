interface PhotoCardProps {
    pictureId: string;
    image: string;
    title: string;
    author: string;
    authorId: string;
    likes: number;
    comments: number;
    isLiked?: boolean;
    description?: string | null;
    onClick?: (pictureId: string) => void;
    onLike?: () => void;
    onDelete?: () => void;
    isVid?: boolean;
    onEdit?: (pictureId: string) => void;
    createdAt?: string;
    authorAvatarUrl?: string | null;
    showContent?: boolean;
    responsive?: any;
    variant?: 'grid' | 'feed';
    apiUrl?: string;
}
declare const PhotoCard: ({ pictureId, image, title, author, authorId, likes, comments, isLiked, description, onClick, onLike, onDelete, isVid, onEdit, createdAt, authorAvatarUrl, showContent, responsive, variant, apiUrl }: PhotoCardProps) => import("react/jsx-runtime").JSX.Element;
export default PhotoCard;
