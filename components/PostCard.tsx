'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { PostWithProfile } from '@/lib/types';
import CommentModal from './CommentModal';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function PostCard({ post, isFirstPost = false }: { post: PostWithProfile; isFirstPost?: boolean }) {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Check if user liked this post
        const { data: likeData, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!likeData && !error);
      }
    };

    fetchUserData();
  }, [post.id, supabase]);

  // Only fetch full comments when modal opens
  useEffect(() => {
    if (isCommentModalOpen && !commentsLoaded) {
      const fetchComments = async () => {
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles (
              username,
              profile_picture_url
            )
          `)
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
        } else {
          setComments(commentsData || []);
          setCommentsLoaded(true);
        }
      };

      fetchComments();
    }
  }, [isCommentModalOpen, commentsLoaded, post.id, supabase]);

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

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const commentInput = e.currentTarget.elements.namedItem('comment') as HTMLInputElement;
    const commentText = commentInput.value.trim();

    if (!userId || !commentText) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: userId, content: commentText })
      .select(`
        *,
        profiles (
          username,
          profile_picture_url
        )
      `)
      .single();

    if (error) {
      console.error('Error posting comment:', error);
    } else {
      setComments([...comments, data]);
      setCommentsLoaded(true);
      setNewComment('');
      commentInput.value = '';
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {post.profiles && (
          <div className="flex items-center p-3 sm:p-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={post.profiles.profile_picture_url || getDefaultAvatar(40)}
                alt={post.profiles.username || 'User'}
                fill
                className="rounded-full object-cover"
                sizes="40px"
              />
            </div>
            <p className="ml-3 sm:ml-4 font-semibold text-gray-900 truncate">{post.profiles.username}</p>
          </div>
        )}
        <div className="relative w-full aspect-square bg-black">
          {post.media_type === 'image' ? (
            <Image
              src={post.media_url}
              alt="Post media"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
              priority={isFirstPost}
              loading={isFirstPost ? "eager" : "lazy"}
            />
          ) : (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-contain"
              preload={isFirstPost ? "auto" : "metadata"}
            />
          )}
        </div>
        <div className="p-3 sm:p-4">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            </button>
            <button
              onClick={() => setIsCommentModalOpen(true)}
              className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </button>
          </div>
          <p className="mt-3 sm:mt-4 font-semibold text-gray-900">{likesCount} {t.post.likes}</p>
          {post.profiles && (
            <p className="mt-2 text-sm sm:text-base text-gray-700 break-words">
              <span className="font-semibold text-gray-900">{post.profiles.username}</span> {post.caption}
            </p>
          )}
          {(post.comments_count || 0) > 0 && (
            <div className="mt-4">
              {comments.length > 0 ? (
                <>
                  {comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-2 mb-2">
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={comment.profiles?.profile_picture_url || getDefaultAvatar(24)}
                          alt={comment.profiles?.username || 'User'}
                          fill
                          className="rounded-full object-cover"
                          sizes="24px"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 break-words">
                        <span className="font-semibold text-gray-900">{comment.profiles?.username}</span> {comment.content}
                      </p>
                    </div>
                  ))}
                  {(post.comments_count || 0) > 2 && (
                    <button
                      onClick={() => setIsCommentModalOpen(true)}
                      className="mt-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {t.post.viewAllComments.replace('{count}', (post.comments_count || 0).toString())}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsCommentModalOpen(true)}
                  className="mt-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {t.post.viewAllComments.replace('{count}', (post.comments_count || 0).toString())}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleCommentSubmit} className="flex items-center mt-4">
            <input
              type="text"
              name="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t.post.addComment}
              className="flex-1 p-2 text-xs sm:text-sm border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={!newComment.trim()}
            >
              {t.post.post}
            </button>
          </form>
        </div>
      </div>
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        post={post}
        comments={comments}
        onCommentSubmit={handleCommentSubmit}
      />
    </>
  );
}
