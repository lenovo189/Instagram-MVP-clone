export type PostWithProfile = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  profiles: {
    username: string;
    profile_picture_url: string;
  } | null;
};

export type CommentWithProfile = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    profile_picture_url: string;
  } | null;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
  bio: string | null;
};
