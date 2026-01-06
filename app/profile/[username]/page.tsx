import { createClient } from '@/lib/supabase/server';
import ProfileClientPage from './ProfileClientPage';
import { Suspense } from 'react';
import ProfileSkeleton from '@/components/ProfileSkeleton';
import Navbar from '@/components/Navbar';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch user and profile in parallel
  const [userResponse, profileResponse] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
  ]);

  const authUser = userResponse.data.user;
  const profileData = profileResponse.data;

  if (!profileData) {
    return (
      <>
        <Navbar username={null} />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto py-20 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-800 font-semibold text-lg mb-2">Profile not found</p>
              <a href="/home" className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Go Home
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Fetch posts, friendship status, and friend count in parallel
  const [postsResponse, friendshipResponse, friendCountResponse] = await Promise.all([
    supabase
      .from('posts_with_counts')
      .select('*')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false }),
    authUser?.id && authUser.id !== profileData.id
      ? supabase
        .from('friendships')
        .select('status, requester_id')
        .or(`and(requester_id.eq.${authUser.id},addressee_id.eq.${profileData.id}),and(requester_id.eq.${profileData.id},addressee_id.eq.${authUser.id})`)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profileData.id},addressee_id.eq.${profileData.id}`)
  ]);

  const initialData = {
    profile: profileData,
    posts: postsResponse.data || [],
    friendshipStatus: friendshipResponse.data?.status || null,
    isRequester: friendshipResponse.data?.requester_id === authUser?.id,
    friendCount: friendCountResponse.count || 0,
    isOwnProfile: authUser?.id === profileData.id,
    currentUserId: authUser?.id || null
  };

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileClientPage initialData={initialData} />
    </Suspense>
  );
}