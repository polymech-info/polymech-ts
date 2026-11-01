import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, MessageCircle, Heart, MoreHorizontal, Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import MarkdownRenderer from "@/components/MarkdownRenderer";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { transcribeAudio } from "@/lib/openai";
import { T, translate } from "@/i18n";

import { Comment } from "@/types";
import {
  fetchCommentsAPI,
  addCommentAPI,
  editCommentAPI,
  deleteCommentAPI,
  toggleCommentLikeAPI
} from "@/modules/posts/client-pictures";

interface UserProfile {
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

interface CommentsProps {
  pictureId: string;
  initialComments?: Comment[];
}

const Comments = ({ pictureId, initialComments }: CommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [useMarkdown, setUseMarkdown] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingFor, setRecordingFor] = useState<'new' | 'reply' | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchComments();
  }, [pictureId, initialComments]);

  const fetchComments = async () => {
    try {
      let data: Comment[] = [];

      if (initialComments) {
        data = initialComments;
        // Still fetch profiles and likes from API for initial comments
        if (data.length > 0) {
          try {
            const apiResult = await fetchCommentsAPI(pictureId);
            setLikedComments(new Set(apiResult.likedCommentIds));
            const newProfiles = new Map(userProfiles);
            Object.entries(apiResult.profiles).forEach(([userId, profile]) => {
              newProfiles.set(userId, profile as UserProfile);
            });
            setUserProfiles(newProfiles);
          } catch {
            // Profiles/likes are optional enrichment, don't fail
          }
        }
      } else {
        // Fetch everything from API in one call
        const apiResult = await fetchCommentsAPI(pictureId);
        data = apiResult.comments as Comment[];
        setLikedComments(new Set(apiResult.likedCommentIds));

        const newProfiles = new Map(userProfiles);
        Object.entries(apiResult.profiles).forEach(([userId, profile]) => {
          newProfiles.set(userId, profile as UserProfile);
        });
        setUserProfiles(newProfiles);
      }

      if (data.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Organize comments into nested structure with max 3 levels
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create all comments with depth tracking
      data.forEach(comment => {
        const commentWithReplies = { ...comment, replies: [], depth: 0 };
        commentsMap.set(comment.id, commentWithReplies);
      });

      // Second pass: organize hierarchy with depth limit
      data.forEach(comment => {
        const commentWithReplies = commentsMap.get(comment.id)!;

        // If it has a parent, try to attach to it
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            // Calculate depth: parent depth + 1, but max 2 (0, 1, 2 = 3 levels)
            const newDepth = Math.min(parent.depth! + 1, 2);
            commentWithReplies.depth = newDepth;

            if (parent.depth! >= 2) {
              if (parent.replies) {
                parent.replies.push(commentWithReplies);
              }
            } else {
              if (parent.replies) {
                parent.replies.push(commentWithReplies);
              }
            }
          } else {
            // Parent not found (deleted?), treat as root
            rootComments.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await addCommentAPI(pictureId, newComment.trim());
      setNewComment("");
      fetchComments();
      toast.success(translate('Comment added!'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(translate('Failed to add comment'));
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;

    try {
      await addCommentAPI(pictureId, replyText.trim(), parentId);
      setReplyText("");
      setReplyingTo(null);
      fetchComments();
      toast.success(translate('Reply added!'));
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error(translate('Failed to add reply'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      await deleteCommentAPI(pictureId, commentId);
      fetchComments();
      toast.success(translate('Comment deleted'));
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(translate('Failed to delete comment'));
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!user || !editText.trim()) return;

    try {
      await editCommentAPI(pictureId, commentId, editText.trim());
      toast.success(translate('Comment updated successfully'));
      setEditingComment(null);
      setEditText("");
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(translate('Failed to update comment'));
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleToggleLike = async (commentId: string) => {
    if (!user) {
      toast.error(translate('Please sign in to like comments'));
      return;
    }

    const isLiked = likedComments.has(commentId);

    try {
      const result = await toggleCommentLikeAPI(pictureId, commentId);

      // Update local liked state
      const newLikedComments = new Set(likedComments);
      if (result.liked) {
        newLikedComments.add(commentId);
      } else {
        newLikedComments.delete(commentId);
      }
      setLikedComments(newLikedComments);

      // Update comments state for likes_count
      const delta = result.liked ? 1 : -1;
      const updateCommentsLikes = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes_count: Math.max(0, comment.likes_count + delta) };
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentsLikes(comment.replies) };
          }
          return comment;
        });
      };
      setComments(updateCommentsLikes);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to toggle like');
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMs = now.getTime() - commentDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // If more than 24 hours ago, show regular date
    if (diffInHours >= 24) {
      return commentDate.toLocaleDateString();
    }

    // Show relative time for recent comments
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
  };

  const handleMicrophone = async (type: 'new' | 'reply') => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error(translate('Audio recording is not supported in your browser'));
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const options = { mimeType: 'audio/webm' };
        let mediaRecorder: MediaRecorder;

        try {
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        setRecordingFor(type);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsTranscribing(true);

          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

            toast.info(translate('Transcribing audio...'));
            const transcribedText = await transcribeAudio(audioFile);

            if (transcribedText) {
              if (type === 'new') {
                setNewComment(prev => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed}\n\n${transcribedText}` : transcribedText;
                });
              } else if (type === 'reply') {
                setReplyText(prev => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed}\n\n${transcribedText}` : transcribedText;
                });
              }
              toast.success(translate('Audio transcribed successfully!'));
            } else {
              toast.error(translate('Failed to transcribe audio. Please check your OpenAI API key.'));
            }
          } catch (error: any) {
            console.error('Error transcribing audio:', error);
            toast.error(error.message || translate('Failed to transcribe audio'));
          } finally {
            setIsTranscribing(false);
            setRecordingFor(null);
            audioChunksRef.current = [];
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.info(translate('Recording... Click mic again to stop'));

      } catch (error: any) {
        console.error('Error accessing microphone:', error);
        if (error.name === 'NotAllowedError') {
          toast.error(translate('Microphone access denied. Please allow microphone access in your browser settings.'));
        } else {
          toast.error(translate('Failed to access microphone') + ': ' + error.message);
        }
      }
    }
  };

  const renderComment = (comment: Comment) => {
    const isOwner = user?.id === comment.user_id;
    const marginLeft = comment.depth ? comment.depth * 24 : 0;
    const userProfile = userProfiles.get(comment.user_id);

    return (
      <div key={comment.id} className="space-y-3">
        <div className="flex space-x-3" style={{ marginLeft: `${marginLeft}px` }}>
          <Link
            to={`/user/${comment.user_id}`}
            className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform overflow-hidden"
          >
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.display_name || 'User avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/user/${comment.user_id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {userProfile?.display_name || `User ${comment.user_id.slice(0, 8)}`}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(comment.created_at)}
                  </span>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startEditingComment(comment)}
                      >
                        <T>Edit</T>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive"
                      >
                        <T>Delete</T>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="text-sm">
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim()}
                      >
                        <T>Save</T>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditingComment}
                      >
                        <T>Cancel</T>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MarkdownRenderer content={comment.content} className="prose-sm" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleLike(comment.id)}
                className={`h-6 px-2 text-xs ${likedComments.has(comment.id)
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Heart
                  className={`h-3 w-3 mr-1 ${likedComments.has(comment.id) ? 'fill-current' : ''
                    }`}
                />
                {comment.likes_count > 0 && <span className="mr-1">{comment.likes_count}</span>}
                <T>Like</T>
              </Button>
              {comment.depth < 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  <T>Reply</T>
                </Button>
              )}
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={translate('Write a reply...')}
                    className="min-h-[60px] text-sm pr-10"
                    autoFocus={false}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleAddReply(comment.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleMicrophone('reply')}
                    disabled={isTranscribing}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${isRecording && recordingFor === 'reply'
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    title={isRecording && recordingFor === 'reply' ? 'Stop recording' : 'Record audio'}
                  >
                    {isTranscribing && recordingFor === 'reply' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isRecording && recordingFor === 'reply' ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddReply(comment.id)}
                    disabled={!replyText.trim()}
                  >
                    <T>Reply</T>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                  >
                    <T>Cancel</T>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-muted-foreground"><T>Loading comments...</T></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Input - Always visible */}
      {user && (
        <div className="space-y-3 pb-4 border-b">
          <div className="relative">
            {useMarkdown ? (
              <div />
            ) : (
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={translate('Add a comment...')}
                className="min-h-[60px] pr-10"
                autoFocus={false}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
            )}
            <button
              onClick={() => handleMicrophone('new')}
              disabled={isTranscribing}
              className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${isRecording && recordingFor === 'new'
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              title={isRecording && recordingFor === 'new' ? 'Stop recording' : 'Record audio'}
            >
              {isTranscribing && recordingFor === 'new' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording && recordingFor === 'new' ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <T>Post Comment</T>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseMarkdown(!useMarkdown)}
              className="text-xs"
            >
              <T>{useMarkdown ? "Simple" : "Markdown"}</T>
            </Button>
          </div>
        </div>
      )}

      {/* Comments List - Scrollable */}
      <div className="max-h-[50vh] overflow-y-auto space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p><T>No comments yet</T></p>
            <p className="text-sm"><T>Be the first to comment!</T></p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default Comments;
