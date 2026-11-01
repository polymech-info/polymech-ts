import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/lib/db";
import { fetchPictures, fetchCommentsAPI, toggleLike } from "@/modules/posts/client-pictures";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hash, Image as ImageIcon, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import PhotoGrid from "@/components/PhotoGrid";
import { normalizeTag } from "@/utils/tagUtils";
import { filterPrivateCollectionPictures } from "@/utils/collectionUtils";

interface Picture {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  tags: string[] | null;
  comments: { count: number }[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  picture_id: string;
  likes_count: number;
  picture: {
    title: string;
    image_url: string;
  };
}

const TagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  const normalizedTag = tag ? normalizeTag(tag) : '';

  useEffect(() => {
    if (normalizedTag) {
      fetchTaggedContent();
      if (user) {
        fetchUserLikes();
      }
    }
  }, [normalizedTag, user]);

  const fetchTaggedContent = async () => {
    try {
      setLoading(true);

      const result = await fetchPictures({ tag: normalizedTag });
      const picturesData = result.data || [];
      const publicPictures = await filterPrivateCollectionPictures(picturesData);

      const picturesWithCommentCounts = await Promise.all(
        publicPictures.map(async (picture) => {
          try {
            const commentsResult = await fetchCommentsAPI(picture.id);
            return { ...picture, comments: [{ count: commentsResult.comments?.length || 0 }] };
          } catch {
            return { ...picture, comments: [{ count: 0 }] };
          }
        })
      );

      setPictures(picturesWithCommentCounts);

      const commentsData = await apiClient<any[]>(`/api/comments?tag=${encodeURIComponent('#' + normalizedTag)}`).catch(() => []);

      const commentsWithPictures = await Promise.all(
        (commentsData || []).map(async (comment) => {
          try {
            const picture = await apiClient<any>(`/api/pictures/${comment.picture_id}`);
            return { ...comment, picture: { title: picture?.title || 'Unknown', image_url: picture?.image_url || '' } };
          } catch {
            return { ...comment, picture: { title: 'Unknown', image_url: '' } };
          }
        })
      );

      setComments(commentsWithPictures);

    } catch (error) {
      console.error('Error fetching tagged content:', error);
      toast.error('Failed to load tagged content');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const data = await apiClient<{ ids: string[] }>(`/api/me/likes?userId=${user.id}`);
      setUserLikes(new Set(data.ids || []));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleImageClick = (pictureId: string) => {
    navigate(`/post/${pictureId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading #{tag}...</div>
      </div>
    );
  }

  const totalCount = pictures.length + comments.length;

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <ThemeToggle />
        </div>

        {/* Tag Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Hash className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {tag}
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {totalCount} {totalCount === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'posts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ImageIcon className="h-4 w-4" />
              Posts ({pictures.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comments'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'posts' ? (
          <PhotoGrid
            customPictures={pictures}
            customLoading={loading}
            navigationSource="tag"
            navigationSourceId={normalizedTag}
          />
        ) : (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No comments found</h3>
                <p className="text-muted-foreground">
                  No comments contain the hashtag #{tag}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comments.map((comment) => (
                  <Link
                    key={comment.id}
                    to={`/post/${comment.picture_id}`}
                    className="group"
                  >
                    <div className="bg-card rounded-xl border p-4 hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex gap-3">
                        <img
                          src={comment.picture.image_url}
                          alt={comment.picture.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              User {comment.user_id.slice(0, 8)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                            {comment.content}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            on "{comment.picture.title}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPage;