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
    /* FULLY OPAQUE OVERLAY */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      onClick={onClose}
    >
      {/* FULLY OPAQUE MODAL */}
      <div
        className="w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col md:flex-row bg-white border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MEDIA */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-white border-r border-gray-200">
          {post.media_type === 'image' ? (
            <Image
              src={post.media_url}
              alt="Post media"
              fill
              className="object-contain bg-white"
            />
          ) : (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-contain bg-white"
            />
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-col w-full md:w-1/2 bg-white">
          {/* HEADER */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <button
              onClick={onClose}
              className="ml-auto block text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            <p className="text-sm text-black mb-4">
              {post.caption}
            </p>

            <button
              onClick={handleLike}
              className={isLiked ? 'text-red-600' : 'text-gray-500'}
            >
              ♥
            </button>

            <p className="text-sm text-gray-700 mt-2">
              {likesCount} {t.post.likes}
            </p>

            <div className="mt-6 space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  {t.post.noComments}
                </p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-2 bg-white">
                    <Image
                      src={c.profiles?.profile_picture_url || getDefaultAvatar(32)}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm text-black">
                        <span className="font-medium">
                          {c.profiles?.username}
                        </span>{' '}
                        {c.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleCommentSubmit}
            className="p-3 border-t border-gray-200 flex gap-2 bg-white"
          >
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t.post.addComment}
              className="flex-1 p-2 text-sm border border-gray-300 bg-white text-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm bg-black text-white disabled:opacity-40"
            >
              {t.post.post}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
