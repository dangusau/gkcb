import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Image as ImageIcon, Video, MapPin, Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  media_urls: string[];
  media_type: 'text' | 'image' | 'video' | 'gallery';
  location: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  has_liked: boolean;
  has_shared: boolean;
}

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  has_liked: boolean;
}

interface Pioneer {
  id: string;
  name: string;
  title: string;
  image_url: string;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postOffset, setPostOffset] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [pioneers, setPioneers] = useState<Pioneer[]>([]);
  const [currentPioneerIndex, setCurrentPioneerIndex] = useState(0);
  const [pioneersLoading, setPioneersLoading] = useState(true);
  
  const POSTS_PER_PAGE = 10;
  const observerTarget = useRef<HTMLDivElement>(null);
  const pioneerIntervalRef = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadPioneers();
    loadPosts();
    
    return () => {
      if (pioneerIntervalRef.current) {
        clearInterval(pioneerIntervalRef.current);
      }
    };
  }, []);

  // Auto-rotate pioneers slideshow
  useEffect(() => {
    if (pioneers.length > 1) {
      pioneerIntervalRef.current = setInterval(() => {
        setCurrentPioneerIndex((prev) => (prev + 1) % pioneers.length);
      }, 5000);
    }
    
    return () => {
      if (pioneerIntervalRef.current) {
        clearInterval(pioneerIntervalRef.current);
      }
    };
  }, [pioneers.length]);

  // Real-time subscriptions for likes and comments
  useEffect(() => {
    // Subscribe to post likes real-time updates
    const postLikesChannel = supabase
      .channel('post-likes-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'post_likes' 
        }, 
        () => {
          // Refresh posts when likes change
          loadPosts();
        }
      )
      .subscribe();

    // Subscribe to comments real-time updates
    const commentsChannel = supabase
      .channel('comments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments' 
        }, 
        () => {
          // Refresh posts when comments change
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postLikesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore]);

  // Load pioneers for slideshow
  const loadPioneers = async () => {
    try {
      setPioneersLoading(true);
      const { data, error } = await supabase
        .from('pioneers')
        .select('id, name, title, image_url')
        .eq('is_active', true)
        .order('order_index')
        .limit(10);

      if (error) throw error;
      setPioneers(data || []);
    } catch (error) {
      console.error('Error loading pioneers:', error);
    } finally {
      setPioneersLoading(false);
    }
  };

  // Navigate pioneers slideshow
  const nextPioneer = () => {
    setCurrentPioneerIndex((prev) => (prev + 1) % pioneers.length);
    if (pioneerIntervalRef.current) {
      clearInterval(pioneerIntervalRef.current);
    }
  };

  const prevPioneer = () => {
    setCurrentPioneerIndex((prev) => (prev - 1 + pioneers.length) % pioneers.length);
    if (pioneerIntervalRef.current) {
      clearInterval(pioneerIntervalRef.current);
    }
  };

  // Load posts from database function
  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      const { data, error } = await supabase
        .rpc('get_home_feed', {
          p_current_user_id: user.id,
          p_limit_count: POSTS_PER_PAGE,
          p_offset_count: 0
        });

      if (error) {
        console.error('Error from get_home_feed:', error);
        throw error;
      }
      
      const validPosts = (data || []).map((post: any) => ({
        id: post.id || '',
        author_id: post.author_id || '',
        author_name: post.author_name || 'User',
        author_avatar: post.author_avatar || '',
        content: post.content || '',
        media_urls: post.media_urls || [],
        media_type: post.media_type || 'text',
        location: post.location || null,
        tags: post.tags || [],
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
        has_liked: post.has_liked || false,
        has_shared: post.has_shared || false
      }));

      setPosts(validPosts);
      setPostOffset(POSTS_PER_PAGE);
      setHasMore((data?.length || 0) === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load more posts for infinite scroll
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_home_feed', {
          p_current_user_id: user.id,
          p_limit_count: POSTS_PER_PAGE,
          p_offset_count: postOffset
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const newPosts = data.map((post: any) => ({
          id: post.id || '',
          author_id: post.author_id || '',
          author_name: post.author_name || 'User',
          author_avatar: post.author_avatar || '',
          content: post.content || '',
          media_urls: post.media_urls || [],
          media_type: post.media_type || 'text',
          location: post.location || null,
          tags: post.tags || [],
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
          has_liked: post.has_liked || false,
          has_shared: post.has_shared || false
        }));
        
        setPosts(prev => [...prev, ...newPosts]);
        setPostOffset(prev => prev + POSTS_PER_PAGE);
        setHasMore(data.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle post like/unlike
  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('toggle_post_like', {
          p_post_id: postId,
          p_user_id: user.id
        });

      if (error) throw error;

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: data.likes_count,
            has_liked: data.has_liked
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle post share
  const handleShare = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Sharing post:', postId, 'by user:', user.id);

      const { data, error } = await supabase
        .rpc('share_post', {
          post_id: postId,
          user_id: user.id
        });

      if (error) {
        console.error('Error from share_post:', error);
        throw error;
      }

      console.log('Share function returned:', data);

      const result = data as {
        action: string;
        shares_count: number;
        has_shared: boolean;
      };

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            shares_count: result.shares_count,
            has_shared: result.has_shared
          };
        }
        return post;
      }));

      if (result.action === 'shared') {
        const post = posts.find(p => p.id === postId);
        const shareText = `Check out this post from GKBC: "${post?.content?.substring(0, 100)}..."`;
        const shareUrl = `${window.location.origin}/post/${postId}`;
        
        if (window.confirm(`Share this post?\n\nOptions:\n1. Copy Link\n2. Share to WhatsApp\n3. Repost`)) {
          const choice = prompt('Choose option:\n1. Copy Link\n2. Share to WhatsApp\n3. Repost', '1');
          
          switch (choice) {
            case '1':
              try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
              } catch (err) {
                console.error('Failed to copy:', err);
                prompt('Copy this link:', shareUrl);
              }
              break;
            case '2':
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
              window.open(whatsappUrl, '_blank');
              break;
            case '3':
              try {
                const { error: repostError } = await supabase.from('posts').insert({
                  author_id: user.id,
                  content: `🔁 Repost: ${post?.content}`,
                  original_post_id: postId
                });

                if (repostError) throw repostError;
                
                alert('Post has been reposted!');
              } catch (repostError) {
                console.error('Error reposting:', repostError);
                alert('Failed to repost. Please try again.');
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  // Load comments for a post
  const loadComments = async (postId: string) => {
    try {
      setCommentLoading(prev => ({ ...prev, [postId]: true }));
      
      const { data, error } = await supabase
        .rpc('get_post_comments', {
          p_post_id: postId,
          p_limit_count: 50
        });

      if (error) {
        console.error('Error from get_post_comments:', error);
        throw error;
      }

      console.log('Comments loaded successfully:', data);
      
      const transformedComments: Comment[] = (data || []).map((comment: any) => ({
        id: comment.id,
        author_id: comment.user_id,
        author_name: comment.user_name || 'User',
        author_avatar: comment.avatar_url || '',
        content: comment.content,
        likes_count: comment.likes_count || 0,
        created_at: comment.created_at,
        updated_at: comment.created_at,
        has_liked: false
      }));

      setComments(prev => ({ ...prev, [postId]: transformedComments }));
    } catch (error) {
      console.error('Error loading comments:', error);
      try {
        const { data: fallbackData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fallbackData) {
          const fallbackComments: Comment[] = fallbackData.map(comment => ({
            id: comment.id,
            author_id: comment.author_id,
            author_name: 'User',
            author_avatar: '',
            content: comment.content,
            likes_count: comment.likes_count || 0,
            created_at: comment.created_at,
            updated_at: comment.created_at,
            has_liked: false
          }));
          
          setComments(prev => ({ ...prev, [postId]: fallbackComments }));
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add comment to a post
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('add_comment', {
          p_post_id: postId,
          p_author_id: user.id,
          p_comment_content: newComment.trim()
        });

      if (error) throw error;

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: data.comments_count
          };
        }
        return post;
      }));

      const newCommentObj: Comment = {
        id: data.comment_id,
        author_id: user.id,
        author_name: 'You',
        author_avatar: '',
        content: newComment.trim(),
        likes_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_liked: false
      };

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentObj]
      }));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return;

    try {
      setIsPosting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let mediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `posts/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(filePath);

          mediaUrls.push(publicUrl);
        }
      }

      const mediaType = selectedFiles.length === 0 ? 'text' : 
                       selectedFiles.length === 1 ? (selectedFiles[0].type.startsWith('video/') ? 'video' : 'image') : 
                       'gallery';

      const { data: postId, error } = await supabase
        .rpc('create_post', {
          author_id: user.id,
          post_content: newPostContent.trim(),
          media_urls: mediaUrls,
          media_type: mediaType,
          tags: newPostContent.match(/#\w+/g)?.map(tag => tag.substring(1)) || []
        });

      if (error) throw error;

      const newPost: Post = {
        id: postId,
        author_id: user.id,
        author_name: 'You',
        author_avatar: '',
        content: newPostContent.trim(),
        media_urls: mediaUrls,
        media_type: mediaType,
        location: null,
        tags: newPostContent.match(/#\w+/g)?.map(tag => tag.substring(1)) || [],
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_liked: false,
        has_shared: false
      };

      setPosts(prev => [newPost, ...prev]);
      
      setNewPostContent('');
      setSelectedFiles([]);
      setShowPostModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray].slice(0, 10));
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Some time ago';
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Pioneers Slideshow Section */}
      {pioneers.length > 0 && (
        <div className="px-4 pt-4 pb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden border border-blue-300">
            <div className="relative h-48">
              {pioneersLoading ? (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <img
                    src={pioneers[currentPioneerIndex].image_url}
                    alt={pioneers[currentPioneerIndex].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                    <div className="p-4 w-full">
                      <h3 className="text-white font-bold text-lg">
                        {pioneers[currentPioneerIndex].name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {pioneers[currentPioneerIndex].title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <button
                    onClick={prevPioneer}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextPioneer}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {pioneers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPioneerIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentPioneerIndex 
                            ? 'bg-white w-4' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-700/80 to-purple-700/80 backdrop-blur-sm">
              <p className="text-white text-center text-sm font-medium">
                GKBC Pioneers • Building Our Legacy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Button */}
      <div className="sticky top-14 z-30 bg-gradient-to-b from-white to-blue-50/50 px-4 pb-4 pt-2">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                +
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors border border-gray-200"
                >
                  <p className="text-gray-600">What's on your mind?</p>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-around border-t border-gray-100 pt-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <ImageIcon size={20} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Video size={20} className="text-red-500" />
                <span className="text-sm font-medium text-gray-700">Video</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin size={20} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Location</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="pb-24">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <MessageCircle size={32} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share something with the community!</p>
            <button
              onClick={() => setShowPostModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-white shadow-md">
                        {post.author_avatar ? (
                          <img 
                            src={post.author_avatar} 
                            alt={post.author_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.author_name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(post.created_at)}
                          </span>
                          {post.location && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} />
                                {post.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mt-4">
                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">{post.content}</p>
                    
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-sm font-medium rounded-full border border-blue-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.media_urls.length > 0 && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                      {post.media_type === 'video' ? (
                        <video 
                          src={post.media_urls[0]} 
                          controls 
                          className="w-full h-auto max-h-96 object-cover"
                        />
                      ) : post.media_type === 'image' ? (
                        <img 
                          src={post.media_urls[0]} 
                          alt="Post media"
                          className="w-full h-auto max-h-96 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {post.media_urls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative aspect-square">
                              <img 
                                src={url} 
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {idx === 3 && post.media_urls.length > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-bold text-xl">
                                    +{post.media_urls.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Heart size={10} className="text-white" />
                      </div>
                      {post.likes_count}
                    </span>
                    <span>{post.comments_count} comments</span>
                    <span>{post.shares_count} shares</span>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                        post.has_liked 
                          ? 'text-red-500 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100' 
                          : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'
                      }`}
                    >
                      <Heart size={22} fill={post.has_liked ? "currentColor" : "none"} />
                      <span className="font-medium">Like</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedPostForComments(
                          selectedPostForComments === post.id ? null : post.id
                        );
                        if (!comments[post.id]) {
                          loadComments(post.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <MessageCircle size={22} />
                      <span className="font-medium">Comment</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                        post.has_shared 
                          ? 'text-green-500 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100' 
                          : 'text-gray-500 hover:text-green-500 hover:bg-gray-50'
                      }`}
                    >
                      <Share2 size={22} />
                      <span className="font-medium">Share</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {selectedPostForComments === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Add Comment */}
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Write a comment..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 shadow-md"
                        >
                          <Send size={18} />
                        </button>
                      </div>

                      {/* Comments List */}
                      {commentLoading[post.id] ? (
                        <div className="space-y-3">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : comments[post.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {comments[post.id].map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0 border border-white">
                                {comment.author_avatar ? (
                                  <img 
                                    src={comment.author_avatar} 
                                    alt={comment.author_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  comment.author_name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900">
                                    {comment.author_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 text-sm py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="py-8 text-center">
                {loadingMore ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 font-medium">Loading more posts...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMorePosts}
                    className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:text-blue-700 font-medium rounded-xl border border-blue-200 shadow-sm"
                  >
                    Load more posts
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowPostModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl animate-slideUp max-h-[85vh] overflow-hidden border-t border-blue-200">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-5">
                  <div className="grid grid-cols-3 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-300">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(idx)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Content Textarea */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                maxLength={2000}
              />

              {/* Character Counter */}
              <div className="text-right text-sm text-gray-500 mt-2">
                {newPostContent.length}/2000
              </div>

              {/* File Upload Buttons */}
              <div className="flex items-center gap-3 mt-5">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer border border-blue-200">
                    <ImageIcon size={22} className="text-blue-600" />
                    <span className="font-medium text-blue-700">Photo/Video</span>
                  </div>
                </label>
                
                <button className="flex-1 flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all border border-green-200">
                  <MapPin size={22} className="text-green-600" />
                  <span className="font-medium text-green-700">Location</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCreatePost}
                disabled={isPosting || (!newPostContent.trim() && selectedFiles.length === 0)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {isPosting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;