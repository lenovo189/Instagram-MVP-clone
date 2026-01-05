import PostCard from '@/components/PostCard';
import { PostWithProfile } from '@/lib/types';

export default function PostFeed({ posts }: { posts: PostWithProfile[] }) {
  return (
    <div className="max-w-2xl mx-auto mt-8 sm:mt-20 space-y-6 sm:space-y-8 px-4">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} isFirstPost={index === 0} />
      ))}
    </div>
  );
}
