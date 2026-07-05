export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: "admin" | "user";
  status: "active" | "banned";
  created_at?: string;
}

export interface Artist {
  id: string;
  name: string;
  image_url: string;
  verified: boolean;
  monthly_listeners: number;
  created_at?: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  artist_name?: string;
  cover_url: string;
  release_year: number;
  created_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  artist_name?: string;
  album_id: string;
  album_name?: string;
  cover_url: string;
  audio_url: string;
  duration: number; // in seconds
  language?: string;
  created_at?: string;
}

export interface Playlist {
  id: string;
  title: string;
  creator: string;
  cover_url: string;
  songs_count?: number;
  created_at?: string;
}

export interface PlaylistSong {
  id?: string;
  playlist_id: string;
  song_id: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  tag_text: string;
  button_text: string;
  action_type: 'play_song' | 'play_album' | 'open_playlist' | 'open_url';
  action_id: string;
  is_active: boolean;
  created_at: string;
}
