import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface MemoryInteractionsProps {
  memoryId: string;
  authorUid: string;
  theme?: 'light' | 'dark';
  initialLikes?: any[];
  initialComments?: any[];
  shouldFetchOnMount?: boolean;
}

export function MemoryInteractions({ 
  memoryId, 
  authorUid, 
  theme = 'light', 
  initialLikes = [], 
  initialComments = [],
  shouldFetchOnMount = false
}: MemoryInteractionsProps) {
  const { user, userProfile } = useAuth();
  const [likes, setLikes] = useState<any[]>(initialLikes);
  const [comments, setComments] = useState<any[]>(initialComments);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (shouldFetchOnMount) {
      fetchLikes();
      fetchComments();
    } else {
      setLikes(initialLikes);
      setComments(initialComments);
    }
  }, [initialLikes, initialComments, shouldFetchOnMount, memoryId]);

  useEffect(() => {
    setIsLiked(likes.some((like: any) => like.userUid === userProfile?.uid));
  }, [likes, userProfile]);

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/likes/${memoryId}`);
      if (response.ok) {
        const data = await response.json();
        setLikes(data);
        setIsLiked(data.some((like: any) => like.userUid === userProfile?.uid));
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${memoryId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleToggleLike = async () => {
    if (!userProfile) return;

    // Optimistic Update
    const wasLiked = isLiked;
    const oldLikes = [...likes];
    
    setIsLiked(!wasLiked);
    if (wasLiked) {
      setLikes(likes.filter(l => l.userUid !== userProfile.uid));
    } else {
      setLikes([...likes, { id: 'temp', userUid: userProfile.uid }]);
    }

    try {
      if (wasLiked) {
        const likeToDelete = oldLikes.find((like: any) => like.userUid === userProfile.uid);
        if (likeToDelete) {
          const response = await fetch(`/api/likes/${likeToDelete.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error();
          // Rely on local state, but sync after
          fetchLikes();
        }
      } else {
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memoryId,
            userUid: userProfile.uid,
            userName: userProfile.displayName,
          }),
        });
        if (!response.ok) throw new Error();
        fetchLikes();
      }
    } catch (err) {
      // Rollback on error
      setIsLiked(wasLiked);
      setLikes(oldLikes);
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !newComment.trim() || submitting) return;

    const commentText = newComment.trim();
    setNewComment('');
    setSubmitting(true);

    // Optimistic Comment
    const tempId = Math.random().toString();
    const optimisticComment = {
      id: tempId,
      userUid: userProfile.uid,
      userName: userProfile.displayName,
      userPhoto: userProfile.photoURL || '',
      content: commentText,
      createdAt: new Date().toISOString(),
      isPending: true
    };
    
    setComments([optimisticComment, ...comments]);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryId,
          userUid: userProfile.uid,
          userName: userProfile.displayName,
          userPhoto: userProfile.photoURL || '',
          content: commentText,
        }),
      });

      if (response.ok) {
        fetchComments();
      } else {
        throw new Error();
      }
    } catch (err) {
      // Rollback
      setComments(comments.filter(c => c.id !== tempId));
      setNewComment(commentText);
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const textColor = theme === 'dark' ? 'text-white/70' : 'text-stone-500';
  const activeTextColor = theme === 'dark' ? 'text-white' : 'text-stone-900';
  const bgColor = theme === 'dark' ? 'bg-white/5' : 'bg-stone-50';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isLiked ? 'text-red-500' : textColor + ' hover:text-red-500'}`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likes.length}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${textColor} hover:${activeTextColor}`}
        >
          <MessageCircle size={18} />
          <span>{comments.length}</span>
        </button>
        
        <button className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${textColor} hover:${activeTextColor}`}>
          <Share2 size={18} />
        </button>
      </div>

      {showComments && (
        <div className={`mt-2 p-4 rounded-2xl ${bgColor} flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200`}>
          {userProfile && (
            <form onSubmit={handleAddComment} className="flex gap-2 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className={`flex-1 bg-white/50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white placeholder:text-white/30' : ''}`}
              />
              <motion.button 
                type="submit"
                whileTap={{ scale: 0.9 }}
                disabled={!newComment.trim() || submitting}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/10"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </motion.button>
            </form>
          )}

          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar px-1">
            <AnimatePresence initial={false}>
              {comments.length === 0 ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs italic text-center py-2 ${textColor}`}
                >
                  Chưa có bình luận nào.
                </motion.p>
              ) : (
                comments.map(comment => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex gap-3 transition-opacity ${comment.isPending ? 'opacity-50' : 'opacity-100'}`}
                  >
                    {comment.userPhoto ? (
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <Image src={comment.userPhoto} alt="" fill className="rounded-full object-cover border border-white shadow-sm" referrerPolicy="no-referrer" unoptimized />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-stone-500 border border-white shadow-sm">
                        {comment.userName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 bg-white/40 rounded-2xl p-3 shadow-sm border border-black/5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-bold ${activeTextColor}`}>{comment.userName}</span>
                        <span className={`text-[10px] ${textColor}`}>
                          {comment.isPending ? 'Đang gửi...' : (comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong')}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/90' : 'text-stone-700'}`}>{comment.content}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
