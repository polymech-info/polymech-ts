import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Camera } from "lucide-react";
import { T } from "@/i18n";

interface UserProfileHeaderProps {
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
    stats?: { public: number; hidden: number; total: number };
}

const UserProfileHeader = ({ userProfile, userId, isOwnProfile, stats }: UserProfileHeaderProps) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Picture */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-primary rounded-full flex items-center justify-center">
                    {userProfile.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt={userProfile.display_name || 'User avatar'}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <User className="h-16 w-16 md:h-20 md:w-20 text-white" />
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <h1 className="text-xl md:text-2xl font-light">
                        {userProfile.username || userProfile.display_name?.replace(/\s+/g, '').toLowerCase() || `user${userId?.slice(0, 8)}`}
                    </h1>

                    {isOwnProfile ? (
                        <div className="flex gap-2 justify-center md:justify-start">
                            <Link to="/profile">
                                <Button variant="outline" size="sm" className="text-sm">
                                    <T>Edit Profile</T>
                                </Button>
                            </Link>
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={() => navigate('/new')}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                <T>Create Post</T>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2 justify-center md:justify-start">
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                                <T>Follow</T>
                            </Button>
                            <Button variant="outline" size="sm">
                                <T>Message</T>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex justify-center md:justify-start gap-8 mb-6">
                    <div className="text-center">
                        <div className="font-semibold text-lg">{stats?.total ?? 0}</div>
                        <div className="text-sm text-muted-foreground"><T>posts</T></div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-lg">0</div>
                        <div className="text-sm text-muted-foreground"><T>followers</T></div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-lg">0</div>
                        <div className="text-sm text-muted-foreground"><T>following</T></div>
                    </div>
                </div>

                {/* Bio */}
                <div className="space-y-1 max-w-md mx-auto md:mx-0">
                    <div className="font-semibold">{userProfile.display_name}</div>
                    {userProfile.bio && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{userProfile.bio}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                        <T>Joined</T> {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileHeader;
