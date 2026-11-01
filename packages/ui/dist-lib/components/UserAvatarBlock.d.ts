import { default as React } from 'react';
interface UserAvatarBlockProps {
    userId: string;
    avatarUrl?: string | null;
    displayName?: string | null;
    createdAt?: string;
    className?: string;
    showDate?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    hoverStyle?: boolean;
    textSize?: "xs" | "sm" | "base";
}
declare const UserAvatarBlock: React.FC<UserAvatarBlockProps>;
export default UserAvatarBlock;
