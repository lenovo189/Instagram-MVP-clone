'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PostFeed from '@/components/PostFeed';
import PostFeedSkeleton from '@/components/PostFeedSkeleton';
import { PostWithProfile } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function PostFeedClient({ initialPosts }: { initialPosts: PostWithProfile[] }) {
  const [posts, setPosts] = useState<PostWithProfile[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const { t } = useTranslation();

  // No need to refetch on mount if initialPosts are provided
  // Real-time updates or manual refresh can be handled separately if needed

  if (loading && posts.length === 0) {
    return <PostFeedSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">{t.common.error}</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t.common.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">{t.home.noPosts}</p>
          <p className="text-gray-500 text-sm">{t.home.startFollowing}</p>
        </div>
      </div>
    );
  }

  return <PostFeed posts={posts} />;
}
