'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { PostWithProfile, CommentWithProfile } from '@/lib/types';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithProfile;
  comments: CommentWithProfile[];
  onCommentSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function CommentModal({ isOpen, onClose, post, comments, onCommentSubmit }: CommentModalProps) {
  const { t } = useTranslation();
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col md:flex-row animate-zoom-in border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-black/5 flex-shrink-0">
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
        <div className="w-full md:w-1/2 flex flex-col bg-card">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/80 backdrop-blur-md">
            {post.profiles && (
              <div className="flex items-center flex-1 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0 hover-scale transition-transform">
                  <Image
                    src={post.profiles.profile_picture_url || getDefaultAvatar(40)}
                    alt={post.profiles.username || 'User'}
                    fill
                    className="rounded-full object-cover ring-2 ring-primary/20"
                    sizes="40px"
                  />
                </div>
                <p className="ml-3 sm:ml-4 font-semibold text-foreground truncate">{post.profiles.username}</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-primary transition-colors ml-2 flex-shrink-0 hover-scale active-scale"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="grow p-3 sm:p-4 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t.post.noComments}</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2 mb-4 animate-fade-in">
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
                        <p className="text-sm text-muted-foreground break-words">
                          <span className="font-semibold text-foreground">{comment.profiles.username}</span> {comment.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <form onSubmit={onCommentSubmit} className="flex items-center p-3 sm:p-4 border-t border-border bg-card/80 backdrop-blur-md">
            <input
              type="text"
              name="comment"
              placeholder={t.post.addComment}
              className="flex-1 p-2 text-sm bg-muted/30 border border-border rounded-l-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-r-xl hover:bg-primary/90 transition-all active-scale"
            >
              {t.post.post}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
