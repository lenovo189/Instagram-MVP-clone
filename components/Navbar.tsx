'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ username }: { username: string | null }) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm dark:bg-black dark:border-gray-800">
      <div className="px-2 sm:px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center flex-shrink-0">
            <a href="/home" className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors dark:text-white dark:hover:text-gray-300">
              EcoGirls
            </a>
          </div>
          <div className="hidden md:flex items-center flex-1 justify-center">
            <div className="flex items-baseline space-x-2 lg:space-x-4">
              <a href="/home" className="px-2 lg:px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100 transition-colors dark:text-white dark:hover:bg-gray-800">
                {t.nav.home}
              </a>
              <a href="/search" className="px-2 lg:px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800">
                {t.nav.search}
              </a>

              <a href="/notifications" className="px-2 lg:px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800">
                {t.nav.notifications}
              </a>

            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <div className="relative">
              <a href="/search">
                <input
                  type="text"
                  className="hidden sm:block w-full px-3 lg:px-4 py-1.5 lg:py-2 text-sm text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder={t.nav.search}
                  readOnly
                />
                <div className="sm:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </a>
            </div>
            {username && (
              <a
                href={`/profile/${username}`}
                className="block p-0.5 rounded-full hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
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
