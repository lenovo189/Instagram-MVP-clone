'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import EditProfileModal from '@/components/EditProfileModal';
import PostModal from '@/components/PostModal';
import ProfileSkeleton from '@/components/ProfileSkeleton';
import Navbar from '@/components/Navbar';
import { Profile } from '@/lib/types';
import { getDefaultAvatar } from '@/lib/utils';
import { signOut } from '@/app/actions/auth';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ProfileInitialData {
  profile: Profile;
  posts: any[];
  friendshipStatus: string | null;
  isRequester: boolean;
  friendCount: number;
  isOwnProfile: boolean;
  currentUserId: string | null;
}

export default function ProfileClientPage({ initialData }: { initialData?: ProfileInitialData }) {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(initialData?.profile || null);
  const [loading, setLoading] = useState(!initialData);
  const [posts, setPosts] = useState<any[]>(initialData?.posts || []);
  const [isOwnProfile, setIsOwnProfile] = useState(initialData?.isOwnProfile || false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(initialData?.friendshipStatus || null);
  const [friendCount, setFriendCount] = useState(initialData?.friendCount || 0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialData?.currentUserId || null);
  const [isRequester, setIsRequester] = useState(initialData?.isRequester || false);
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);

  const supabase = createClient();
  const { t } = useTranslation();

  const fetchProfileData = useCallback(async () => {
    // Only fetch if we don't have initialData or if we need to refresh
    if (initialData && profile) return;

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUserId(authUser?.id || null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setIsOwnProfile(authUser?.id === profileData.id);

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

      setPosts(postsResponse.data || []);

      if (friendshipResponse.data) {
        setFriendshipStatus(friendshipResponse.data.status || null);
        setIsRequester(friendshipResponse.data.requester_id === authUser?.id);
      } else {
        setFriendshipStatus(null);
        setIsRequester(false);
      }

      setFriendCount(friendCountResponse.count || 0);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [username, supabase, initialData, profile]);

  useEffect(() => {
    if (username && !initialData) {
      fetchProfileData();
    }
  }, [username, fetchProfileData, initialData]);

  const handleSendFriendRequest = async () => {
    if (!currentUserId || !profile) return;

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: profile.id, status: 'pending' });

    if (error) {
      console.error('Error sending friend request:', error);
      alert(t.common.error);
    } else {
      setFriendshipStatus('pending');
      setIsRequester(true);
    }
  };

  const handleUnfriend = async () => {
    if (!currentUserId || !profile) return;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUserId})`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error unfriending:', error);
      alert(t.common.error);
    } else {
      setFriendshipStatus(null);
      setIsRequester(false);
      setFriendCount(prev => Math.max(0, prev - 1));
    }
    setShowFriendsDropdown(false);
  };

  const openPostModal = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  if (loading) {
    return (
      <>
        <Navbar username={null} />
        <main className="pt-16">
          <ProfileSkeleton />
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar username={null} />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto py-20 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-800 font-semibold text-lg mb-2">{t.common.noResults}</p>
              <p className="text-red-600 text-sm mb-4">{t.search.noUsers}</p>
              <a
                href="/home"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.nav.home}
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  const renderFriendButton = () => {
    if (friendshipStatus === 'accepted') {
      return (
        <div className="relative">
          <button
            onClick={() => setShowFriendsDropdown(!showFriendsDropdown)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.search.friends}
          </button>
          {showFriendsDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFriendsDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={handleUnfriend}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg"
                >
                  {t.common.decline}
                </button>
              </div>
            </>
          )}
        </div>
      );
    } else if (friendshipStatus === 'pending') {
      if (isRequester) {
        return (
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg cursor-default">
            {t.search.requestSent}
          </button>
        );
      } else {
        return (
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg cursor-default">
            {t.search.respond}
          </button>
        );
      }
    } else {
      return (
        <button
          onClick={handleSendFriendRequest}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t.search.addFriend}
        </button>
      );
    }
  };

  return (
    <>
      <Navbar username={isOwnProfile ? profile.username : null} />
      <main className="pt-16 pb-8">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
              <Image
                src={profile.profile_picture_url || getDefaultAvatar(128)}
                alt={profile.username || 'User'}
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 640px) 96px, 128px"
                priority
              />
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h1 className="text-xl sm:text-2xl font-bold">{profile.username}</h1>
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t.profile.editProfile}
                    </button>
                    <button
                      onClick={async () => await signOut()}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  renderFriendButton()
                )}
              </div>
              <div className="flex items-center space-x-8 mt-4">
                <p><span className="font-semibold">{posts.length}</span> {t.profile.posts}</p>
                <p><span className="font-semibold">{friendCount}</span> {t.search.friends}</p>
              </div>
              <div className="mt-4">
                <p className="font-semibold">{profile.display_name}</p>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {posts.map((post: any) => (
                <div
                  key={post.id}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm sm:rounded"
                  onClick={() => openPostModal(post)}
                >
                  {post.media_type === 'image' ? (
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <video
                      src={post.media_url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="flex items-center gap-1 text-white font-semibold">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white font-semibold">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                      </svg>
                      <span>{post.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {isOwnProfile && profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            fetchProfileData();
          }}
          profile={profile}
        />
      )}

      {selectedPost && (
        <PostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          post={selectedPost}
        />
      )}
    </>
  );
}