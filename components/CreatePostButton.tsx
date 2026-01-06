'use client';

import { useState } from 'react';
import CreatePostModal from './CreatePostModal';

import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function CreatePostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-16 sm:bottom-20 right-4 sm:right-10 bg-primary text-primary-foreground p-3 sm:p-4 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:scale-110 active:scale-95 z-40"
        aria-label={t.home.createPost}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
