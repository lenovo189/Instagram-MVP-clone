'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { getDefaultAvatar } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export default function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(profile.profile_picture_url);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const { t } = useTranslation();

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let profile_picture_url = profile.profile_picture_url;

    if (profilePictureFile) {
      const fileExt = profilePictureFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, profilePictureFile);

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        alert(t.common.error);
        setIsSaving(false);
        return;
      } else {
        const { data: { publicUrl } } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
        profile_picture_url = publicUrl;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        bio,
        profile_picture_url,
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating profile:', error);
      alert(t.common.error);
    } else {
      onClose();
    }
    setIsSaving(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-semibold">{t.profile.editProfile}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <Image
                src={profilePicturePreview || getDefaultAvatar(150)}
                alt="Profile preview"
                fill
                className="rounded-full object-cover"
                sizes="112px"
              />
            </div>
            <label
              htmlFor="profile-picture-upload"
              className="mt-3 text-sm font-semibold text-blue-500 cursor-pointer hover:text-blue-600 transition-colors"
            >
              {t.post.editProfilePhoto}
            </label>
            <input
              id="profile-picture-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePictureChange}
            />
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.displayName}
              </label>
              <input
                type="text"
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.username}
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                {t.profile.bio}
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex justify-end p-3 sm:p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm sm:text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? t.post.saving : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
