import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  MoreVertical,
  X,
  UserPlus,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  ThumbsUp,
  Smile,
  Camera,
  Play,
  Upload,
  User,
  CheckCircle,
  Flag,
  ExternalLink,
  Loader2,
  Clipboard,
  Repeat
} from 'lucide-react';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

// Types
type UserProfile = {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  role: string;
  approval_status: string;
  bio?: string;
  phone?: string;
  payment_verified?: boolean;
  created_at: string;
};

type PostMedia = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  position: number;
};

type Post = {
  id: string;
  author_id: string;
  title?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  media_type: 'text' | 'image' | 'video' | 'mixed';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  location?: string;
  privacy: string;
  feeling?: string;
  tags?: string[];
  author?: UserProfile;
  media?: PostMedia[];
  user_reaction?: string;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  user?: UserProfile;
  user_liked?: boolean;
};

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

type Pioneer = {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
};

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  haha: '😄',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

const reactionColors = {
  like: 'text-blue-600',
  love: 'text-red-500',
  haha: 'text-yellow-500',
  wow: 'text-yellow-500',
  sad: 'text-blue-400',
  angry: 'text-orange-500'
};

const Home = () => {
  const navigate = useNavigate();
  const pioneersRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const commentInputRefs = useRef<Record<string, HTMLInputElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Authentication and user state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Posts and content state
  const [posts, setPosts] = useState<Post[]>([]);
  const [pioneers, setPioneers] = useState<Pioneer[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<UserProfile[]>([]);
  
  // UI interaction state
  const [postText, setPostText] = useState('');
  const [postMediaFiles, setPostMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  
  // Reactions state
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  
  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentPioneerIndex, setCurrentPioneerIndex] = useState(0);
  const [showPostOptions, setShowPostOptions] = useState<Record<string, boolean>>({});
  const [showShareOptions, setShowShareOptions] = useState<Record<string, boolean>>({});
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize and check session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          navigate('/login');
          return;
        }
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileError || !profile) {
          navigate('/login');
          return;
        }
        
        // Check approval status
        if (profile.approval_status !== 'approved') {
          navigate('/pending-approval');
          return;
        }
        
        setUserProfile(profile);
        
        // Fetch all data
        await Promise.all([
          fetchPioneers(),
          fetchSuggestedConnections(profile.id),
          fetchPostsFromConnections(profile.id)
        ]);
        
      } catch (err: any) {
        setError(err.message || 'Failed to initialize app');
        showToast('Failed to load app. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeApp();
    
    // Refresh posts when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userProfile && !loading) {
        refreshData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      stopAutoScroll();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [navigate]);

  // Auto-scroll pioneers carousel
  useEffect(() => {
    if (pioneers.length > 3) {
      startAutoScroll();
    }
    
    return () => {
      stopAutoScroll();
    };
  }, [pioneers.length]);

  const startAutoScroll = () => {
    stopAutoScroll();
    
    scrollIntervalRef.current = setInterval(() => {
      setCurrentPioneerIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= pioneers.length ? 0 : nextIndex;
      });
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleManualScroll = (direction: 'prev' | 'next') => {
    stopAutoScroll();
    
    if (direction === 'prev') {
      setCurrentPioneerIndex((prevIndex) => {
        const newIndex = prevIndex - 1;
        return newIndex < 0 ? pioneers.length - 1 : newIndex;
      });
    } else {
      setCurrentPioneerIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        return newIndex >= pioneers.length ? 0 : newIndex;
      });
    }
    
    setTimeout(() => startAutoScroll(), 8000);
  };

  /* ---------------- DATABASE QUERIES ---------------- */
  const fetchPioneers = async () => {
    try {
      const { data, error } = await supabase
        .from('pioneers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(15);

      if (error) {
        console.error('Error fetching pioneers:', error);
        showToast('Failed to load pioneers');
        return;
      }

      setPioneers(data || []);
    } catch (error) {
      console.error('Error fetching pioneers:', error);
      showToast('Failed to load pioneers');
    }
  };

  const fetchSuggestedConnections = async (currentUserId: string) => {
    try {
      // Get users who are approved and not the current user
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .neq('id', currentUserId)
        .limit(20);

      if (error) throw error;

      // Get connections where current user is involved
      const { data: connections } = await supabase
        .from('connections')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId})`);

      const connectedUserIds = new Set<string>();
      connections?.forEach(conn => {
        if (conn.user_id === currentUserId) {
          connectedUserIds.add(conn.friend_id);
        } else {
          connectedUserIds.add(conn.user_id);
        }
      });

      // Filter out connected users and get random 6
      const unconnectedUsers = (allUsers || []).filter(user => !connectedUserIds.has(user.id));
      const randomUsers = unconnectedUsers.sort(() => Math.random() - 0.5).slice(0, 6);
      
      setSuggestedConnections(randomUsers);
    } catch (error) {
      console.error('Error fetching suggested connections:', error);
    }
  };

  const fetchPostsFromConnections = async (currentUserId: string) => {
    try {
      setIsLoadingPosts(true);
      
      // Get accepted connections
      const { data: connections, error: connError } = await supabase
        .from('connections')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId})`)
        .eq('status', 'accepted');

      if (connError) throw connError;

      const connectedUserIds = new Set<string>([currentUserId]); // Include self
      connections?.forEach(conn => {
        if (conn.user_id === currentUserId) {
          connectedUserIds.add(conn.friend_id);
        } else {
          connectedUserIds.add(conn.user_id);
        }
      });

      // Fetch posts from connected users
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .in('author_id', Array.from(connectedUserIds))
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Fetch media for each post
      if (postsData) {
        const postsWithMedia = await Promise.all(
          postsData.map(async (post) => {
            const { data: media } = await supabase
              .from('post_media')
              .select('*')
              .eq('post_id', post.id)
              .order('position', { ascending: true });

            return {
              ...post,
              media: media || []
            };
          })
        );

        setPosts(postsWithMedia);

        // Fetch user reactions for these posts
        const postIds = postsWithMedia.map(p => p.id);
        await fetchUserReactionsForPosts(postIds, currentUserId);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
      setRefreshing(false);
    }
  };

  const fetchUserReactionsForPosts = async (postIds: string[], userId: string) => {
    if (!postIds.length) return;
    
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds)
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        const reactionsMap: Record<string, string> = {};
        data.forEach(reaction => {
          reactionsMap[reaction.post_id] = reaction.reaction_type;
        });
        setUserReactions(reactionsMap);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const fetchPostComments = async (postId: string) => {
    if (!postId || !userProfile) return;
    
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (comments) {
        // Check if current user liked each comment
        const commentsWithLikes = await Promise.all(
          comments.map(async (comment) => {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', userProfile.id)
              .maybeSingle();
            
            return {
              ...comment,
              user_liked: !!likeData
            };
          })
        );
        
        setPostComments(prev => ({ ...prev, [postId]: commentsWithLikes }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const refreshData = async () => {
    if (!userProfile || refreshing) return;
    
    setRefreshing(true);
    await Promise.all([
      fetchPostsFromConnections(userProfile.id),
      fetchSuggestedConnections(userProfile.id),
      fetchPioneers()
    ]);
    showToast('Feed refreshed');
  };

  /* ---------------- POST ACTIONS ---------------- */
  const handleCreatePost = async () => {
    if (!userProfile || (!postText.trim() && postMediaFiles.length === 0)) {
      showToast('Please add some text or media to your post');
      return;
    }

    setIsPosting(true);
    setUploadProgress(0);

    try {
      // Upload media files if any
      const mediaUrls: string[] = [];
      if (postMediaFiles.length > 0) {
        const totalFiles = postMediaFiles.length;
        for (let i = 0; i < totalFiles; i++) {
          const file = postMediaFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${userProfile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `post-media/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

          mediaUrls.push(publicUrl);
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      }

      // Determine media type
      let mediaType: 'text' | 'image' | 'video' | 'mixed' = 'text';
      const imageFiles = postMediaFiles.filter(file => file.type.startsWith('image/'));
      const videoFiles = postMediaFiles.filter(file => file.type.startsWith('video/'));

      if (imageFiles.length > 0 && videoFiles.length === 0) {
        mediaType = 'image';
      } else if (videoFiles.length > 0 && imageFiles.length === 0) {
        mediaType = 'video';
      } else if (imageFiles.length > 0 && videoFiles.length > 0) {
        mediaType = 'mixed';
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: userProfile.id,
          title: postText.substring(0, 100) || 'New Post',
          content: postText.trim(),
          media_type: mediaType,
          privacy: 'public',
          likes_count: 0,
          comments_count: 0,
          shares_count: 0
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add media entries if any
      if (mediaUrls.length > 0) {
        const mediaPromises = mediaUrls.map((url, index) => {
          const file = postMediaFiles[index];
          const isVideo = file.type.startsWith('video/');
          
          return supabase
            .from('post_media')
            .insert({
              post_id: post.id,
              media_url: url,
              media_type: isVideo ? 'video' : 'image',
              position: index
            });
        });
        
        await Promise.all(mediaPromises);
      }
      
      // Create local post object
      const newPost: Post = {
        ...post,
        author: userProfile,
        media: mediaUrls.map((url, index) => ({
          id: `temp-${index}`,
          post_id: post.id,
          media_url: url,
          media_type: postMediaFiles[index].type.startsWith('video/') ? 'video' : 'image',
          position: index,
          thumbnail_url: undefined
        }))
      };
      
      // Add to top of posts list
      setPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setPostText('');
      setPostMediaFiles([]);
      mediaPreviews.forEach(preview => URL.revokeObjectURL(preview));
      setMediaPreviews([]);
      setShowCreatePost(false);
      
      showToast('✅ Post published successfully!');
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      showToast('Failed to publish post. Please try again.');
    } finally {
      setIsPosting(false);
      setUploadProgress(0);
    }
  };

  const handleReaction = async (postId: string, reactionType: ReactionType | null) => {
    if (!userProfile) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // User cannot like their own post
    if (post.author_id === userProfile.id) {
      showToast("You can't react to your own post");
      return;
    }
    
    try {
      setReactingPostId(postId);
      
      const currentReaction = userReactions[postId];
      
      if (currentReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userProfile.id);

        // Update local state
        setUserReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[postId];
          return newReactions;
        });

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: Math.max(0, post.likes_count - 1) }
            : post
        ));

      } else if (reactionType) {
        if (currentReaction) {
          // Update existing reaction
          await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('post_id', postId)
            .eq('user_id', userProfile.id);
        } else {
          // Add new reaction
          await supabase
            .from('post_reactions')
            .insert({
              post_id: postId,
              user_id: userProfile.id,
              reaction_type: reactionType
            });

          // Update post likes count
          await supabase
            .from('posts')
            .update({ likes_count: post.likes_count + 1 })
            .eq('id', postId);

          // Update local state
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, likes_count: post.likes_count + 1 }
              : post
          ));
        }

        // Update local reactions
        setUserReactions(prev => ({
          ...prev,
          [postId]: reactionType
        }));
      }
      
      // Hide reaction picker
      setShowReactionPicker(prev => ({
        ...prev,
        [postId]: false
      }));
      
    } catch (error: any) {
      console.error('Error updating reaction:', error);
      showToast('Failed to update reaction');
    } finally {
      setReactingPostId(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentTexts[postId] || '';
    if (!userProfile || !commentText.trim()) return;

    try {
      // Create comment
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userProfile.id,
          content: commentText.trim(),
          likes_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Update post comments count
      await supabase
        .from('posts')
        .update({ comments_count: (posts.find(p => p.id === postId)?.comments_count || 0) + 1 })
        .eq('id', postId);

      // Update local state
      const newComment: Comment = {
        ...comment,
        user: userProfile,
        user_liked: false
      };
      
      // Update post comments count locally
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));

      // Add comment to comments list (latest first)
      setPostComments(prev => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])]
      }));

      // Clear comment text
      setCommentTexts(prev => ({
        ...prev,
        [postId]: ''
      }));

      showToast('✅ Comment added!');

    } catch (error: any) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!userProfile) return;

    try {
      const comments = postComments[postId] || [];
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const isLiked = comment.user_liked;

      if (isLiked) {
        // Unlike comment
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userProfile.id);

        // Update local state
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c =>
            c.id === commentId
              ? { ...c, likes_count: Math.max(0, c.likes_count - 1), user_liked: false }
              : c
          )
        }));

      } else {
        // Like comment
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userProfile.id
          });

        // Update local state
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c =>
            c.id === commentId
              ? { ...c, likes_count: c.likes_count + 1, user_liked: true }
              : c
          )
        }));
      }

    } catch (error: any) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSharePost = async (postId: string, action: 'copy' | 'repost') => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (action === 'copy') {
        const shareText = `${post.content?.substring(0, 100)}...\n\nShared from GKBC Network`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        showToast('✅ Post link copied to clipboard!');
      } else if (action === 'repost') {
        // Set post text for reposting
        setPostText(`Repost: ${post.content}`);
        setShowCreatePost(true);
        showToast('✅ Post ready for sharing! Edit if needed.');
      }

      // Update share count
      await supabase
        .from('posts')
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq('id', postId);

      // Update local state
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, shares_count: (p.shares_count || 0) + 1 }
          : p
      ));

    } catch (error) {
      console.error('Error sharing post:', error);
      showToast('Failed to share post');
    }
  };

  const handleConnectUser = async (friendId: string) => {
    if (!userProfile) return;

    try {
      // Send connection request
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: userProfile.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'connection_request',
          actor_id: userProfile.id,
          content: `${userProfile.first_name} sent you a connection request`,
          is_read: false
        });

      showToast('✅ Connection request sent!');
      
      // Remove from suggestions
      setSuggestedConnections(prev => prev.filter(user => user.id !== friendId));

    } catch (error: any) {
      console.error('Error sending connection request:', error);
      showToast('Failed to send connection request');
    }
  };

  /* ---------------- UI HELPERS ---------------- */
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const formatFullRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }) + ' at ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || 'U';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const toggleCommentSection = (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      if (!postComments[postId]) {
        fetchPostComments(postId);
      }
      setTimeout(() => {
        if (commentInputRefs.current[postId]) {
          commentInputRefs.current[postId].focus();
        }
      }, 100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).slice(0, 10 - postMediaFiles.length);
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isValidType) {
        showToast(`File ${file.name} is not a valid image or video`);
        return false;
      }
      if (!isValidSize) {
        showToast(`File ${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to existing files
    setPostMediaFiles(prev => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(prev => [...prev, ...newPreviews]);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    
    setPostMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading GKBC Network...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 safe-area">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area pb-20">
      {/* HEADER */}
      <Header userName={userProfile?.first_name} />

      {/* MAIN CONTENT */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* PIONEERS CAROUSEL */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Crown size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Pioneers of GKBC</h2>
                    <p className="text-xs text-gray-600">Meet our founding members</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/pioneers')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View All
                </button>
              </div>
            </div>

            {pioneers.length > 0 ? (
              <div className="relative px-4 py-4">
                {pioneers.length > 1 && (
                  <>
                    <button 
                      onClick={() => handleManualScroll('prev')}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button 
                      onClick={() => handleManualScroll('next')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  </>
                )}

                <div className="overflow-hidden">
                  <div 
                    ref={pioneersRef}
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentPioneerIndex * 100}%)` }}
                  >
                    {pioneers.map((pioneer) => (
                      <div 
                        key={pioneer.id}
                        className="w-full flex-shrink-0 px-2"
                      >
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-md bg-gray-100">
                                {pioneer.image_url ? (
                                  <img 
                                    src={pioneer.image_url}
                                    alt={pioneer.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.parentElement!.innerHTML = `
                                        <div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                                          ${getInitials(pioneer.name)}
                                        </div>
                                      `;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                                    {getInitials(pioneer.name)}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow">
                                <Star size={12} className="text-white" />
                              </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                              {pioneer.name}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {pioneer.position}
                            </p>
                            {pioneer.bio && (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed px-2">
                                {pioneer.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {pioneers.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {pioneers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPioneerIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          index === currentPioneerIndex 
                            ? 'bg-blue-600 w-6' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-blue-500" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">No pioneers found</p>
                <p className="text-gray-400 text-xs">Check back soon to meet our pioneers</p>
              </div>
            )}
          </div>
        </div>

        {/* CREATE POST */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt={userProfile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(userProfile?.first_name, userProfile?.last_name)
                )}
              </div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 text-sm transition-colors"
              >
                What's on your mind, {userProfile?.first_name}?
              </button>
            </div>
            
            <div className="flex items-center justify-around border-t border-gray-100 pt-3">
              <button 
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <ImageIcon size={18} className="text-green-500" />
                <span>Photo/Video</span>
              </button>
              <button 
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Smile size={18} className="text-yellow-500" />
                <span>Feeling/Activity</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUGGESTED CONNECTIONS */}
        {suggestedConnections.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">People you may know</h3>
                </div>
                <button 
                  onClick={() => navigate('/members')}
                  className="text-blue-600 text-xs font-medium hover:text-blue-700"
                >
                  See All
                </button>
              </div>
              
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                  {suggestedConnections.map((member) => (
                    <div 
                      key={member.id}
                      className="flex-shrink-0 w-32"
                    >
                      <div className="bg-gradient-to-b from-white to-gray-50 rounded-lg border border-gray-200 p-3">
                        <div className="relative mb-3">
                          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-gray-300 bg-gray-100">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url}
                                alt={member.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {getInitials(member.first_name, member.last_name)}
                              </div>
                            )}
                          </div>
                          {member.payment_verified && (
                            <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-gray-900 truncate mb-1">
                            {member.first_name} {member.last_name}
                          </h4>
                          <button
                            onClick={() => handleConnectUser(member.id)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEED */}
        <div>
          {isLoadingPosts ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">No Posts Yet</h4>
              <p className="text-gray-600 text-sm mb-6">
                Connect with members to see their posts or create your own!
              </p>
              <button
                onClick={() => navigate('/members')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Connect with Members
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {post.author?.avatar_url ? (
                              <img 
                                src={post.author.avatar_url} 
                                alt={post.author.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(post.author?.first_name, post.author?.last_name)
                            )}
                          </div>
                          {post.author?.payment_verified && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <CheckCircle size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {post.author?.first_name} {post.author?.last_name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatFullRelativeTime(post.created_at)}</span>
                            <span>•</span>
                            <Globe size={10} />
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowPostOptions(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed mb-4">
                      {post.content}
                    </div>
                    
                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                      <div className="rounded-lg overflow-hidden border border-gray-100 bg-black/5">
                        {post.media[0].media_type === 'video' ? (
                          <div className="relative">
                            <video 
                              src={post.media[0].media_url}
                              controls
                              className="w-full max-h-80 object-contain"
                            />
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
                              <Play size={12} className="inline mr-1" />
                              Video
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.media[0].media_url}
                            alt="Post media"
                            className="w-full h-auto object-contain max-h-80"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="px-4 pb-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-1.5">
                            <div className="w-5 h-5 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                              <ThumbsUp size={10} className="text-white" />
                            </div>
                            <div className="w-5 h-5 bg-red-500 rounded-full border border-white flex items-center justify-center">
                              <Heart size={10} className="text-white" />
                            </div>
                            <div className="w-5 h-5 bg-yellow-500 rounded-full border border-white flex items-center justify-center">
                              <Smile size={10} className="text-white" />
                            </div>
                          </div>
                          <span>{formatNumber(post.likes_count)}</span>
                        </div>
                        <span>{formatNumber(post.comments_count)} comments</span>
                        {post.shares_count > 0 && (
                          <span>{formatNumber(post.shares_count)} shares</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-2 pb-2 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      {/* Reaction Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowReactionPicker(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          onMouseEnter={() => setShowReactionPicker(prev => ({ ...prev, [post.id]: true }))}
                          onMouseLeave={() => setTimeout(() => setShowReactionPicker(prev => ({ ...prev, [post.id]: false })), 300)}
                          disabled={post.author_id === userProfile?.id}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${
                            userReactions[post.id] 
                              ? `${reactionColors[userReactions[post.id] as ReactionType]} font-semibold hover:bg-blue-50`
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                          } ${post.author_id === userProfile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={post.author_id === userProfile?.id ? "You can't like your own post" : ""}
                        >
                          {reactingPostId === post.id ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : userReactions[post.id] ? (
                            <>
                              <span className="text-lg">{reactionEmojis[userReactions[post.id] as ReactionType]}</span>
                              <span className="capitalize hidden xs:inline">{userReactions[post.id]}</span>
                            </>
                          ) : (
                            <>
                              <ThumbsUp size={18} />
                              <span className="hidden xs:inline">Like</span>
                            </>
                          )}
                        </button>
                        
                        {showReactionPicker[post.id] && (
                          <div 
                            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl border border-gray-200 p-2 flex gap-1 z-50"
                            onMouseEnter={() => setShowReactionPicker(prev => ({ ...prev, [post.id]: true }))}
                            onMouseLeave={() => setTimeout(() => setShowReactionPicker(prev => ({ ...prev, [post.id]: false })), 300)}
                          >
                            {Object.entries(reactionEmojis).map(([type, emoji]) => (
                              <button
                                key={type}
                                onClick={() => handleReaction(post.id, type as ReactionType)}
                                className="w-9 h-9 text-lg hover:scale-110 transform transition-transform"
                                title={type}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Button */}
                      <button
                        onClick={() => toggleCommentSection(post.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          activeCommentPostId === post.id
                            ? 'text-blue-600 font-semibold bg-blue-50' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <MessageSquare size={18} />
                        <span className="hidden xs:inline">Comment</span>
                      </button>
                      
                      {/* Share Button with dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowShareOptions(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors w-full"
                        >
                          <Share2 size={18} />
                          <span className="hidden xs:inline">Share</span>
                        </button>
                        
                        {showShareOptions[post.id] && (
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-32">
                            <button
                              onClick={() => {
                                handleSharePost(post.id, 'copy');
                                setShowShareOptions(prev => ({ ...prev, [post.id]: false }));
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                              <Clipboard size={16} />
                              Copy Link
                            </button>
                            <button
                              onClick={() => {
                                handleSharePost(post.id, 'repost');
                                setShowShareOptions(prev => ({ ...prev, [post.id]: false }));
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                              <Repeat size={16} />
                              Repost
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Section */}
                  {activeCommentPostId === post.id && (
                    <div className="border-t border-gray-100 pt-3">
                      {/* Comment Input */}
                      <div className="px-4 pb-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                            {userProfile?.avatar_url ? (
                              <img 
                                src={userProfile.avatar_url} 
                                alt={userProfile.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(userProfile?.first_name, userProfile?.last_name)
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                ref={el => {
                                  if (el) commentInputRefs.current[post.id] = el;
                                }}
                                type="text"
                                placeholder="Write a comment..."
                                className="w-full bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white pr-12"
                                value={commentTexts[post.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              />
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center">
                                <button
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!commentTexts[post.id]?.trim()}
                                  className={`px-4 rounded-full font-medium text-sm mr-2 transition-colors ${
                                    commentTexts[post.id]?.trim()
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                >
                                  Post
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="max-h-64 overflow-y-auto px-4 pb-4">
                        {loadingComments[post.id] ? (
                          <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : postComments[post.id] && postComments[post.id].length > 0 ? (
                          <div className="space-y-3">
                            {postComments[post.id].map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                  {comment.user?.avatar_url ? (
                                    <img 
                                      src={comment.user.avatar_url} 
                                      alt={comment.user.first_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    getInitials(comment.user?.first_name, comment.user?.last_name)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-50 rounded-2xl p-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-sm font-bold text-gray-900 truncate">
                                        {comment.user?.first_name} {comment.user?.last_name}
                                      </span>
                                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        {formatRelativeTime(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-800 mb-2 break-words">
                                      {comment.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <button
                                        onClick={() => handleLikeComment(comment.id, post.id)}
                                        className={`flex items-center gap-1 transition-colors ${comment.user_liked ? 'text-blue-600 font-semibold' : 'hover:text-blue-600'}`}
                                      >
                                        <ThumbsUp size={12} />
                                        <span>Like</span>
                                        {comment.likes_count > 0 && (
                                          <span className="ml-1">• {comment.likes_count}</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500 text-sm">
                            No comments yet. Be the first to comment!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* No More Posts Message */}
              {posts.length > 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No more posts to show</p>
                  <p className="text-xs mt-1">Connect with more members to see their posts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 safe-area">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mt-4">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(userProfile?.first_name, userProfile?.last_name)
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <button className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 transition-colors">
                      <Globe size={12} />
                      Public
                    </button>
                  </div>
                </div>
              </div>
              
              <textarea
                placeholder={`What's on your mind, ${userProfile?.first_name}?`}
                className="w-full p-4 text-base min-h-[120px] resize-none focus:outline-none placeholder-gray-400"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                autoFocus
              />
              
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={triggerFileInput}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 flex flex-col items-center gap-2 transition-colors"
                >
                  <Upload size={24} />
                  <span className="text-sm">Add Photos/Videos</span>
                  <span className="text-xs text-gray-400">Supports JPG, PNG, GIF, MP4, MOV (max 50MB)</span>
                </button>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {mediaPreviews.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      {mediaPreviews.map((preview, index) => {
                        const file = postMediaFiles[index];
                        const isVideo = file.type.startsWith('video/');
                        
                        return (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-black/5">
                              {isVideo ? (
                                <video
                                  src={preview}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <button
                              onClick={() => removeMediaFile(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                            >
                              <X size={14} />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              {isVideo ? 'Video' : 'Image'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCreatePost}
                  disabled={(!postText.trim() && postMediaFiles.length === 0) || isPosting}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2
                    ${
                      (postText.trim() || postMediaFiles.length > 0) && !isPosting
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                >
                  {isPosting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Posting...'}
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-full text-sm font-medium z-50 shadow-xl animate-fade-in-down">
          {toastMessage}
        </div>
      )}

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default Home;