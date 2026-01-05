import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import PostFeedClient from '@/components/PostFeedClient';
import CreatePostButton from '@/components/CreatePostButton';
import { PostWithProfile } from '@/lib/types';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let posts: PostWithProfile[] = [];
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

      // Fetch all posts
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            profile_picture_url
          )
        `)
        .order('created_at', { ascending: false });

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
        posts = postsData.map(post => ({
          ...post,
          likes_count: likesCountMap.get(post.id) || 0,
          comments_count: commentsCountMap.get(post.id) || 0,
        }));
      } else {
        posts = postsData;
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Continue with empty posts, client component will handle retry
    }
  }

  return (
    <div>
      <Navbar username={username} />
      <main className="pt-16 pb-20">
        <PostFeedClient initialPosts={posts} />
      </main>
      <CreatePostButton />
    </div>
  );
}