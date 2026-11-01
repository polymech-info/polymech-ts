import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus, User, Camera } from "lucide-react";
import { T } from "@/i18n";

interface Collection {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    is_public: boolean;
    created_at: string;
}

interface UserInfoProps {
    userProfile: {
        id: string;
        username: string | null;
        display_name: string | null;
        bio: string | null;
        avatar_url: string | null;
        created_at: string;
    };
    userId: string;
    isOwnProfile: boolean;
    collections?: Collection[];
}

const UserInfo = ({ userProfile, userId, isOwnProfile, collections = [] }: UserInfoProps) => {
    const navigate = useNavigate();

    return (
        <div className="border-b bg-card/50">
            <div className="px-4 py-4 max-w-screen-xl mx-auto">
                <div className="flex gap-4 items-start">
                    {/* Avatar */}
                    <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden">
                        {userProfile.avatar_url ? (
                            <img
                                src={userProfile.avatar_url}
                                alt={userProfile.display_name || 'User avatar'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="h-8 w-8 text-white" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name row + actions */}
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h1 className="text-base md:text-lg font-light">
                                {userProfile.username || userProfile.display_name?.replace(/\s+/g, '').toLowerCase() || `user${userId?.slice(0, 8)}`}
                            </h1>
                            {isOwnProfile ? (
                                <div className="flex gap-2">
                                    <Link to="/profile">
                                        <Button variant="outline" size="sm" className="text-xs h-7">
                                            <T>Edit Profile</T>
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        className="bg-primary hover:bg-primary/90 text-white text-xs h-7"
                                        onClick={() => navigate('/new')}
                                    >
                                        <Camera className="h-3 w-3 mr-1" />
                                        <T>Create Post</T>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-7">
                                        <T>Follow</T>
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs h-7">
                                        <T>Message</T>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-4 text-sm mb-1">
                            <span><strong>0</strong> <span className="text-muted-foreground"><T>posts</T></span></span>
                            <span><strong>0</strong> <span className="text-muted-foreground"><T>followers</T></span></span>
                            <span><strong>0</strong> <span className="text-muted-foreground"><T>following</T></span></span>
                        </div>

                        {/* Display name + bio */}
                        {userProfile.display_name && (
                            <div className="text-sm font-semibold">{userProfile.display_name}</div>
                        )}
                        {userProfile.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{userProfile.bio}</p>
                        )}
                    </div>
                </div>

                {/* Collections row */}
                <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                    <Link
                        to={`/user/${userProfile.username || userId}/collections`}
                        className="flex flex-col items-center gap-1 min-w-0 group shrink-0"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-primary bg-gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <ImageIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[10px] text-center group-hover:text-primary transition-colors">
                            <T>Collections</T>
                        </span>
                    </Link>

                    {isOwnProfile && (
                        <button
                            onClick={() => navigate('/collections/new')}
                            className="flex flex-col items-center gap-1 min-w-0 group shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary"><T>New</T></span>
                        </button>
                    )}

                    {collections.slice(0, 5).map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/collections/${userProfile.username || userId}/${collection.slug}`}
                            className="flex flex-col items-center gap-1 min-w-0 group shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <ImageIcon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[10px] text-center max-w-[48px] truncate group-hover:text-primary transition-colors">
                                {collection.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
