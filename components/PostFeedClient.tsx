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

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch all posts
        const { data, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              username,
              profile_picture_url
            )
          `)
          .order('created_at', { ascending: false });

        if (postsError) {
          throw new Error('Failed to load posts');
        }

        const postsData = (data || []) as PostWithProfile[];

        // Fetch likes and comments counts in batch for all posts
        if (postsData.length > 0) {
          const postIds = postsData.map(p => p.id);

          // Fetch likes counts
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);

          // Fetch comments counts
          const { data: commentsData } = await supabase
            .from('comments')
            .select('post_id')
            .in('post_id', postIds);

          // Create maps for quick lookup
          const likesCountMap = new Map<string, number>();
          const commentsCountMap = new Map<string, number>();

          likesData?.forEach(like => {
            likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
          });

          commentsData?.forEach(comment => {
            commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
          });

          // Add counts to posts
          const postsWithCounts = postsData.map(post => ({
            ...post,
            likes_count: likesCountMap.get(post.id) || 0,
            comments_count: commentsCountMap.get(post.id) || 0,
          }));

          setPosts(postsWithCounts);
        } else {
          setPosts(postsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [supabase]);

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
