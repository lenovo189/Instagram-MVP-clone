'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type FriendRequest = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester: {
    id: string;
    username: string;
    profile_picture_url: string;
    display_name: string;
  };
};

export default function NotificationsPage() {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      setCurrentUserId(user.id);

      // Fetch username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      setUsername(profile?.username || null);

      // Fetch pending friend requests where current user is the addressee
      const { data: requestsData, error: requestsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching friend requests:', requestsError);
        setFriendRequests([]);
      } else if (requestsData) {
        // Fetch requester profiles for each request
        const requestsWithProfiles = await Promise.all(
          requestsData.map(async (req) => {
            const { data: requesterProfile } = await supabase
              .from('profiles')
              .select('id, username, profile_picture_url, display_name')
              .eq('id', req.requester_id)
              .single();

            return {
              ...req,
              requester: requesterProfile || {
                id: req.requester_id,
                username: 'Unknown',
                profile_picture_url: null,
                display_name: null
              }
            };
          })
        );
        setFriendRequests(requestsWithProfiles);
      } else {
        setFriendRequests([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const handleAccept = async (requestId: string, requesterId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('addressee_id', currentUserId)
      .eq('requester_id', requesterId);

    if (!error) {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } else {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('addressee_id', currentUserId);

    if (!error) {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } else {
      console.error('Error declining friend request:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar username={username} />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div>{t.common.loading}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar username={username} />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">{t.notifications.title}</h1>

          {friendRequests.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {t.notifications.noNotifications}
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={request.requester.profile_picture_url || getDefaultAvatar(48)}
                        alt={request.requester.username}
                        fill
                        className="rounded-full object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">
                        <a
                          href={`/profile/${request.requester.username}`}
                          className="hover:underline"
                        >
                          {request.requester.display_name || request.requester.username}
                        </a>
                      </p>
                      <p className="text-sm text-gray-500">
                        @{request.requester.username} {t.notifications.sentRequest}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAccept(request.id, request.requester.id)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                      {t.common.accept}
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      {t.common.decline}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
