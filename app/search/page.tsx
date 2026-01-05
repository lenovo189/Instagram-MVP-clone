'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchSkeleton from '@/components/SearchSkeleton';
import { Profile } from '@/lib/types';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type UserCard = Profile & {
  friendshipStatus: 'none' | 'pending' | 'accepted' | 'pending_sent';
  isRequester: boolean;
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserCard[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      setUsername(profile?.username || null);
    };

    fetchCurrentUser();
  }, [supabase, router]);

  const fetchFriendshipStatus = async (profileId: string, userId: string): Promise<{ status: 'none' | 'pending' | 'accepted' | 'pending_sent', isRequester: boolean }> => {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('status, requester_id')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${userId})`)
      .single();

    if (!friendship) {
      return { status: 'none', isRequester: false };
    }

    const isRequester = friendship.requester_id === userId;
    if (friendship.status === 'pending') {
      return { status: isRequester ? 'pending_sent' : 'pending', isRequester };
    }
    return { status: friendship.status as 'accepted', isRequester };
  };

  const fetchSuggestedUsers = useCallback(async () => {
    if (!currentUserId) return;

    // Fetch recent users (excluding current user and existing friends)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

    const excludedIds = new Set<string>();
    excludedIds.add(currentUserId);
    if (friendships) {
      friendships.forEach(f => {
        if (f.requester_id === currentUserId) excludedIds.add(f.addressee_id);
        else excludedIds.add(f.requester_id);
      });
    }

    // Fetch all profiles excluding current user
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter out friends and limit to 10
    const profiles = allProfiles
      ?.filter(profile => !excludedIds.has(profile.id))
      .slice(0, 10) || [];

    if (profiles) {
      const usersWithStatus = await Promise.all(
        profiles.map(async (profile) => {
          const { status, isRequester } = await fetchFriendshipStatus(profile.id, currentUserId);
          return { ...profile, friendshipStatus: status, isRequester };
        })
      );
      setSuggestedUsers(usersWithStatus);
    }
  }, [currentUserId, supabase]);

  useEffect(() => {
    if (currentUserId && searchQuery === '') {
      fetchSuggestedUsers();
    }
  }, [currentUserId, searchQuery, fetchSuggestedUsers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim() || !currentUserId) {
      setSearchResults([]);
      if (currentUserId) {
        fetchSuggestedUsers();
      }
      return;
    }

    setLoading(true);

    // Search by username or display name
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId) // Exclude current user
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching profiles:', error);
      setLoading(false);
      // Show error state will be handled by UI
      return;
    }

    if (profiles) {
      const usersWithStatus = await Promise.all(
        profiles.map(async (profile) => {
          const { status, isRequester } = await fetchFriendshipStatus(profile.id, currentUserId);
          return { ...profile, friendshipStatus: status, isRequester };
        })
      );
      setSearchResults(usersWithStatus);
    }

    setLoading(false);
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: userId, status: 'pending' });

    if (!error) {
      // Update the status in the results
      setSearchResults(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, friendshipStatus: 'pending_sent' as const, isRequester: true }
            : user
        )
      );
      setSuggestedUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, friendshipStatus: 'pending_sent' as const, isRequester: true }
            : user
        )
      );
    }
  };

  const renderFriendButton = (user: UserCard) => {
    if (user.friendshipStatus === 'accepted') {
      return (
        <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg cursor-default">
          {t.search.friends}
        </button>
      );
    } else if (user.friendshipStatus === 'pending_sent') {
      return (
        <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg cursor-default">
          {t.search.requestSent}
        </button>
      );
    } else if (user.friendshipStatus === 'pending') {
      return (
        <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold border rounded-lg cursor-default">
          {t.search.respond}
        </button>
      );
    } else {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSendFriendRequest(user.id);
          }}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t.search.addFriend}
        </button>
      );
    }
  };

  const UserCard = ({ user }: { user: UserCard }) => (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
    >
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 w-full sm:w-auto min-w-0">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
          <Image
            src={user.profile_picture_url || getDefaultAvatar(64)}
            alt={user.username || 'User'}
            fill
            className="rounded-full object-cover"
            sizes="(max-width: 640px) 48px, 64px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.display_name || user.username}
            </h3>
            {user.username && (
              <span className="text-sm text-gray-500">@{user.username}</span>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>
      </div>
      <div className="mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-full sm:w-auto">
          {renderFriendButton(user)}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar username={username} />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6">
            <input
              type="text"
              placeholder={t.search.placeholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {loading ? (
            <SearchSkeleton />
          ) : searchQuery.trim() ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{t.search.results}</h2>
              {searchResults.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 font-semibold mb-2">{t.search.noUsers}</p>
                  <p className="text-gray-500 text-sm">{t.search.tryDifferent}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-4">{t.search.suggested}</h2>
              {suggestedUsers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 font-semibold mb-2">{t.search.noSuggested}</p>
                  <p className="text-gray-500 text-sm">{t.search.checkBack}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
