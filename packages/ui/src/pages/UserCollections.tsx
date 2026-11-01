import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/lib/db";
import { fetchAuthorProfile } from "@/modules/user/client-user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Plus, Lock, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  picture_count?: number;
}

const UserCollections = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchCollections();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const profile = await fetchAuthorProfile(userId!);
      if (!profile) {
        setUserProfile({
          id: userId!,
          username: null,
          display_name: `User ${userId!.slice(0, 8)}`,
          bio: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });
      } else {
        setUserProfile({
          id: (profile as any).user_id || userId!,
          username: (profile as any).username || null,
          display_name: (profile as any).display_name || `User ${userId!.slice(0, 8)}`,
          bio: (profile as any).bio || null,
          avatar_url: (profile as any).avatar_url || null,
          created_at: (profile as any).created_at || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      navigate('/');
    }
  };

  const fetchCollections = async () => {
    try {
      const params = new URLSearchParams({ userId: userId! });
      if (!isOwnProfile) params.set('is_public', 'true');
      const collectionsData = await apiClient<Collection[]>(`/api/collections?${params}`);

      const collectionsWithCounts = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          try {
            const data = await apiClient<{ picture_id: string }[]>(`/api/collection-pictures?collectionId=${collection.id}`);
            return { ...collection, picture_count: data?.length || 0 };
          } catch {
            return { ...collection, picture_count: 0 };
          }
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading collections...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">User not found</div>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/user/${userId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to profile
          </Button>
          <ThemeToggle />
        </div>

        {/* Profile Summary */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-xl border">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            {userProfile.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.display_name || 'User avatar'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {userProfile.display_name}'s Collections
            </h1>
            <p className="text-muted-foreground text-sm">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          {isOwnProfile && (
            <Button 
              onClick={() => navigate('/collections/new')}
              className="ml-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          )}
        </div>

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-light mb-2">
              {isOwnProfile ? "No Collections Yet" : "No Public Collections"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {isOwnProfile 
                ? "Create your first collection to organize your photos." 
                : `${userProfile.display_name} hasn't shared any public collections yet.`}
            </p>
            {isOwnProfile && (
              <Button onClick={() => navigate('/collections/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${userId}/${collection.slug}`}
                className="group"
              >
                <div className="bg-card rounded-xl border p-6 hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
                  {/* Collection Icon */}
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Collection Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {collection.is_public ? (
                          <div title="Public">
                            <Globe className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <div title="Private">
                            <Lock className="h-4 w-4 text-orange-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {collection.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                      <span>
                        {collection.picture_count} {collection.picture_count === 1 ? 'photo' : 'photos'}
                      </span>
                      <span>
                        {new Date(collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCollections;