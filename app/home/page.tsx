import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import PostFeedClient from '@/components/PostFeedClient';
import CreatePostButton from '@/components/CreatePostButton';
import { PostWithProfile } from '@/lib/types';
import { Suspense } from 'react';
import PostFeedSkeleton from '@/components/PostFeedSkeleton';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch user and posts in parallel
  const [userResponse, postsResponse] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          profile_picture_url
        ),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const user = userResponse.data.user;

  // Transform the response to match PostWithProfile type
  const posts = (postsResponse.data || []).map((post: any) => ({
    ...post,
    likes_count: post.likes_count?.[0]?.count || 0,
    comments_count: post.comments_count?.[0]?.count || 0,
  })) as PostWithProfile[];

  let username: string | null = null;

  if (user) {
    try {
      // Fetch profile to get username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      username = profile?.username || null;
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }

  return (
    <div>
      <Navbar username={username} />
      <main className="pt-16 pb-20">
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeedClient initialPosts={posts} />
        </Suspense>
      </main>
      <CreatePostButton />
    </div>
  );
}