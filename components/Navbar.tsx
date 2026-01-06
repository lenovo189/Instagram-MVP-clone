'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Link from 'next/link';

export default function Navbar({ username }: { username: string | null }) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!username) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profile?.profile_picture_url) {
        setProfilePictureUrl(profile.profile_picture_url);
      }
    };

    fetchProfilePicture();
  }, [username, supabase]);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (!error) {
        setNotificationCount(count || 0);
      }
    };

    fetchNotificationCount();

    // Set up real-time subscription
    const channel = supabase
      .channel('friendship_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          fetchNotificationCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 glass shadow-sm transition-all duration-300">
      <div className="px-2 sm:px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center flex-shrink-0">
            <a href="/home" className="text-xl sm:text-2xl font-bold text-primary hover-scale active-scale transition-all">
              EcoGirls
            </a>
          </div>
          <div className="hidden md:flex items-center flex-1 justify-center">
            <div className="flex items-baseline space-x-2 lg:space-x-4">
              <a href="/home" className="px-2 lg:px-3 py-2 text-sm font-medium text-foreground rounded-md hover:bg-primary/10 hover-lift transition-all">
                {t.nav.home}
              </a>
              <a href="/search" className="px-2 lg:px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-primary/10 hover-lift transition-all">
                {t.nav.search}
              </a>
              <a href="/ai" className="px-2 lg:px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-primary/10 hover-lift transition-all">
                {t.nav.ai || 'AI'}
              </a>

              <Link href="/notifications" className="relative px-2 lg:px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-primary/10 hover-lift transition-all">
                {t.nav.notifications}
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white dark:ring-black animate-zoom-in">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>


            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <div className="relative">
              <a href="/search">
                <input
                  type="text"
                  className="hidden sm:block w-full px-3 lg:px-4 py-1.5 lg:py-2 text-sm text-foreground bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
                  placeholder={t.nav.search}
                  readOnly
                />
                <div className="sm:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </a>
            </div>
            {username && (
              <a
                href={`/profile/${username}`}
                className="block p-0.5 rounded-full hover:ring-2 hover:ring-primary transition-all hover-scale active-scale"
              >
                <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                  <Image
                    src={profilePictureUrl || getDefaultAvatar(32)}
                    alt={username}
                    fill
                    className="rounded-full object-cover"
                    sizes="32px"
                    priority
                  />
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
