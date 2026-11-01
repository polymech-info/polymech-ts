import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { fetchProfileAPI } from "@/modules/user/client-user";
import { fetchUserPage } from "@/modules/pages/client-pages";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { T, translate } from "@/i18n";
import { SEO } from "@/components/SEO";
import HomeWidget from "@/components/widgets/HomeWidget";

const UserPage = lazy(() => import("@/modules/pages/UserPage"));

import UserInfo from "@/components/UserInfo";

/*
<UserInfo
        userProfile={userProfile}
        userId={userId!}
        isOwnProfile={isOwnProfile}
        collections={collections}
      />
*/

interface UserProfileData {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

// A no-op component to suppress the default UserPageDetails header when embedded
const EmptyDetails = () => null;

const UserProfile = () => {
  const { userId, orgSlug } = useParams<{ userId: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [myspacePage, setMyspacePage] = useState<any | null | undefined>(undefined); // undefined = loading

  const isOwnProfile = currentUser?.id === userId;

  // Derive content type from URL path segment
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const VALID_CONTENT_TYPES = ['posts', 'pages', 'pictures'] as const;
  const initialContentType = VALID_CONTENT_TYPES.includes(lastSegment as any)
    ? (lastSegment as 'posts' | 'pages' | 'pictures')
    : undefined;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchMyspace();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const result = await fetchProfileAPI(userId!);
      const profile = result?.profile;
      const newProfile = profile ? {
        id: profile.user_id,
        username: profile.username,
        display_name: profile.display_name || `User ${userId!.slice(0, 8)}`,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
      } : {
        id: userId!,
        username: null,
        display_name: `User ${userId!.slice(0, 8)}`,
        bio: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      setUserProfile(prev => JSON.stringify(prev) !== JSON.stringify(newProfile) ? newProfile : prev);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error(translate('Failed to load user profile'));
      navigate('/');
    }
  };

  const fetchMyspace = async () => {
    try {
      const data = await fetchUserPage(userId!, 'myspace');
      if (data?.page) {
        // Ensure home widgets have the correct userId (handles legacy pages with userId: "")
        const content = data.page.content;
        if (content?.pages) {
          for (const pageData of Object.values(content.pages) as any[]) {
            for (const container of pageData.containers || []) {
              for (const widget of container.widgets || []) {
                if (widget.widgetId === 'home' && widget.props && !widget.props.userId) {
                  widget.props.userId = userId;
                }
              }
            }
          }
        }
        setMyspacePage(data.page);
      } else {
        setMyspacePage(null);
      }
    } catch {
      setMyspacePage(null);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4"><T>User not found</T></div>
          <Link to="/">
            <Button><T>Back to Home</T></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <SEO
        title={userProfile.display_name || userProfile.username || 'User Profile'}
        description={userProfile.bio || `Check out ${userProfile.display_name}'s profile on PolyMech`}
        image={userProfile.avatar_url || undefined}
      />

      {/* When a content type is specified via URL (/posts, /pages, /pictures), render HomeWidget directly */}
      {initialContentType ? (
        <HomeWidget
          userId={userId}
          showSortBar
          showFooter={false}
          initialContentType={initialContentType}
        />
      ) : myspacePage ? (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><T>Loading...</T></div>}>
          <UserPage
            userId={userId}
            slug="myspace"
            embedded
            initialPage={myspacePage}
            showSidebar={false}
            DetailsComponent={EmptyDetails}
          />
        </Suspense>
      ) : myspacePage === null ? (
        /* No myspace page — show default HomeWidget */
        <HomeWidget
          userId={userId}
          showSortBar
          showFooter={false}
        />
      ) : (
        /* Still loading myspace check */
        <HomeWidget
          userId={userId}
          showSortBar
          showFooter={false}
        />
      )}
    </div>
  );
};

export default UserProfile;