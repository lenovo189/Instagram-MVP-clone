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
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            {post.profiles && (
              <div className="flex items-center flex-1 min-w-0">
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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors ml-2 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="grow p-3 sm:p-4 overflow-y-auto">
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
                        <p className="text-sm text-gray-700 break-words">
                          <span className="font-semibold text-gray-900">{comment.profiles.username}</span> {comment.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <form onSubmit={onCommentSubmit} className="flex items-center p-3 sm:p-4 border-t">
            <input
              type="text"
              name="comment"
              placeholder={t.post.addComment}
              className="flex-1 p-2 text-sm border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              {t.post.post}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
