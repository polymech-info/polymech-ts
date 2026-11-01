import React, { useState, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "@/contexts/ProfilesContext";
import { serverUrl } from "@/lib/db";

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

const UserAvatarBlock: React.FC<UserAvatarBlockProps> = ({
    userId,
    avatarUrl,
    displayName,
    createdAt,
    className = "w-8 h-8",
    showDate = true,
    onClick,
    hoverStyle = false,
    textSize = "sm"
}) => {
    const navigate = useNavigate();
    const { profiles, fetchProfile } = useProfiles();

    // Use prop if available, otherwise look up in context
    const profile = userId ? profiles[userId] : undefined;
    const effectiveAvatarUrl = avatarUrl || profile?.avatar_url;

    // Prefer prop displayName if truthy (e.g. override), else usage context
    const effectiveDisplayName = displayName || profile?.display_name || (userId ? `User ${userId.slice(0, 8)}` : 'Unknown');

    const getOptimizedAvatarUrl = (url?: string | null) => {
        if (!url) return undefined;
        // If it's already a blob/data URI or relative asset, leave it alone (though avatars are usually remote)
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;

        // Construct optimized URL
        // We use the render endpoint: /api/images/render?url=...&width=128&format=webp
        if (!serverUrl) return url;
        try {
            const optimized = new URL(`${serverUrl}/api/images/render`);
            optimized.searchParams.set('url', url);
            optimized.searchParams.set('width', '128');
            optimized.searchParams.set('format', 'webp');
            return optimized.toString();
        } catch (e) {
            console.warn('Failed to construct optimized avatar URL:', e);
            return url;
        }
    };

    const optimizedAvatarUrl = getOptimizedAvatarUrl(effectiveAvatarUrl);

    useEffect(() => {
        // If we don't have the profile in context, ask for it
        if (!profile && userId) {
            fetchProfile(userId);
        }
    }, [userId, profile, fetchProfile]);

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            onClick(e);
            return;
        }
        e.stopPropagation();
        const username = profile?.username;
        if (username) {
            navigate(`/user/${username}`);
        } else {
            console.warn("No username found for user", userId);
            navigate(`/user/${userId}`); // Fallback
        }
    };

    const nameClass = hoverStyle
        ? `text-white text-${textSize} font-medium hover:underline cursor-pointer`
        : `font-semibold hover:underline text-${textSize}`;

    const dateClass = hoverStyle
        ? "text-white/60 text-xs"
        : "text-xs text-muted-foreground";

    return (
        <div className="flex items-center space-x-2" onClick={handleClick}>
            <Avatar className={`${className} bg-background hover:scale-105 transition-transform cursor-pointer`}>
                <AvatarImage src={optimizedAvatarUrl} alt={effectiveDisplayName || "Avatar"} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <UserIcon className="h-1/2 w-1/2" />
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
                <span className={nameClass}>
                    {effectiveDisplayName}
                </span>
                {showDate && createdAt && (
                    <span className={dateClass}>
                        {new Date(createdAt).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default UserAvatarBlock;
