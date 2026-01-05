'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function CreatePostModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    multiple: false,
  });

  const handlePost = async () => {
    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert(t.common.error);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        media_url: publicUrl,
        media_type: file.type.startsWith('image') ? 'image' : 'video',
        caption,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      alert(t.common.error);
    } else {
      onClose();
      setFile(null);
      setPreview(null);
      setCaption('');
      window.location.reload(); // Refresh to show new post
    }

    setUploading(false);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-zoom-in border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border sticky top-0 bg-card/80 backdrop-blur-md z-10">
          <h1 className="text-base sm:text-lg font-semibold text-foreground">{t.post.createPostTitle}</h1>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors hover-scale active-scale"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div
            {...getRootProps()}
            className="flex items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <input {...getInputProps()} />
            {preview ? (
              file?.type.startsWith('image') ? (
                <div className="relative w-full h-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, 448px"
                  />
                </div>
              ) : (
                <video src={preview} controls className="object-contain w-full h-full rounded-lg"></video>
              )
            ) : (
              <div className="text-center p-4 transition-transform group-hover:scale-105">
                <svg className="w-12 h-12 mx-auto text-muted-foreground mb-2 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <p className="text-sm sm:text-base text-muted-foreground group-hover:text-primary transition-colors">{t.post.dragDrop}</p>
              </div>
            )}
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.post.writeCaption}
            maxLength={2200}
            className="w-full p-3 mt-4 text-sm sm:text-base bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/2200</p>
        </div>
        <div className="flex justify-end p-3 sm:p-4 border-t border-border sticky bottom-0 bg-card/80 backdrop-blur-md">
          <button
            onClick={handlePost}
            className="px-6 py-2 text-sm sm:text-base font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-scale active-scale"
            disabled={uploading || !file}
          >
            {uploading ? t.post.posting : t.post.post}
          </button>
        </div>
      </div>
    </div>
  );
}
