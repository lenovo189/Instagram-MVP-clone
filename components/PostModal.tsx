'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { PostWithProfile, CommentWithProfile } from '@/lib/types';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
}

export default function PostModal({ isOpen, onClose, post }: PostModalProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen || !post) return;

    const fetchPostData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);

      if (likesError) console.error('Error fetching likes:', likesError);
      else {
        setLikesCount(likesData.length);
        if (user) {
          setIsLiked(likesData.some((like) => like.user_id === user.id));
        }
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, profiles(username, profile_picture_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentsError) console.error('Error fetching comments:', commentsError);
      else setComments(commentsData as any);
    };

    fetchPostData();
  }, [isOpen, post, supabase]);

  const handleLike = async () => {
    if (!userId) return;

    const wasLiked = isLiked;
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);

    if (wasLiked) {
      const { error } = await supabase.from('likes').delete().match({ post_id: post.id, user_id: userId });
      if (error) {
        console.error('Error unliking post:', error);
        // Revert on error
        setIsLiked(true);
        setLikesCount(likesCount);
      }
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: userId });
      if (error) {
        console.error('Error liking post:', error);
        // Revert on error
        setIsLiked(false);
        setLikesCount(likesCount);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: userId, content: newComment.trim() })
      .select('*, profiles(username, profile_picture_url)')
      .single();

    if (error) console.error('Error posting comment:', error);
    else {
      setComments([...comments, data as any]);
      setNewComment('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-black flex-shrink-0">
          {post.media_type === 'image' ? (
            <Image
              src={post.media_url}
              alt="Post media"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <video src={post.media_url} controls className="object-contain w-full h-full"></video>
          )}
        </div>
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 ml-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="grow p-4 overflow-y-auto">
            <div className="flex items-center space-x-4 mb-4">
              <p className="font-semibold">{post.caption}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`transition-all duration-200 transform active:scale-90 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
              >
                <svg
                  className={`w-6 h-6 transition-all duration-200 ${isLiked ? 'scale-110' : ''}`}
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
            </div>
            <p className="mt-2 font-semibold text-gray-900">{likesCount} {t.post.likes}</p>
            <div className="mt-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t.post.noComments}</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2 mb-4">
                    {comment.profiles && (
                      <>
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={comment.profiles.profile_picture_url || getDefaultAvatar(32)}
                            alt={comment.profiles.username || 'User'}
                            fill
                            className="rounded-full object-cover"
                            sizes="32px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words">
                            <span className="font-semibold">{comment.profiles.username}</span> {comment.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <form onSubmit={handleCommentSubmit} className="flex items-center p-3 sm:p-4 border-t">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t.post.addComment}
              className="flex-1 p-2 text-sm border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!newComment.trim()}
            >
              {t.post.post}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
