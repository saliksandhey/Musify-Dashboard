import { supabase } from "./supabase";
import { mockArtists, mockAlbums, mockSongs, mockPlaylists } from "@/constants/mockData";
import type { Artist, Album, Song, Playlist } from "@/types";

// Helper: Fetch from Supabase. Return actual database rows (even if empty []).
// Fall back to mock data ONLY if Supabase returns a network/connection error.
async function fetchFromSupabase<T>(table: string, fallbackMock: T[], transformer?: (row: any) => T): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) {
      console.warn(`Supabase query error on table '${table}':`, error.message);
      return fallbackMock;
    }
    if (data !== null) {
      return transformer ? data.map(transformer) : (data as T[]);
    }
    return [];
  } catch (e) {
    console.warn(`Supabase connection failed on table '${table}':`, e);
    return fallbackMock;
  }
}

// ─── ARTISTS API ─────────────────────────────────────────────────────────────
export const artistsApi = {
  getAll: async (): Promise<Artist[]> => {
    return fetchFromSupabase<Artist>("artists", mockArtists, (r: any) => ({
      id: String(r.id),
      name: r.name || "Unknown Artist",
      image_url: r.image_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&h=600",
      verified: Boolean(r.verified),
      monthly_listeners: Number(r.monthly_listeners ?? 0),
      created_at: r.created_at,
    }));
  },

  create: async (artist: Omit<Artist, "id">): Promise<Artist> => {
    const payload = {
      name: artist.name,
      image_url: artist.image_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&h=600",
      verified: Boolean(artist.verified),
      monthly_listeners: Number(artist.monthly_listeners ?? 0),
    };
    try {
      const { data, error } = await supabase.from("artists").insert([payload]).select().single();
      if (error) throw error;
      return {
        id: String(data.id),
        name: data.name,
        image_url: data.image_url,
        verified: Boolean(data.verified),
        monthly_listeners: Number(data.monthly_listeners),
        created_at: data.created_at,
      };
    } catch (e) {
      console.error("Supabase create artist failed:", e);
      return { ...artist, id: `a-${Date.now()}` };
    }
  },

  update: async (id: string, updates: Partial<Artist>): Promise<void> => {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.image_url !== undefined) payload.image_url = updates.image_url;
      if (updates.verified !== undefined) payload.verified = updates.verified;
      if (updates.monthly_listeners !== undefined) payload.monthly_listeners = updates.monthly_listeners;

      const { error } = await supabase.from("artists").update(payload).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase update artist failed:", e);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("artists").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase delete artist failed:", e);
    }
  },
};

// ─── ALBUMS API ──────────────────────────────────────────────────────────────
export const albumsApi = {
  getAll: async (): Promise<Album[]> => {
    return fetchFromSupabase<Album>("albums", mockAlbums, (r: any) => ({
      id: String(r.id),
      title: r.title || "Untitled Album",
      artist_id: String(r.artist_id || ""),
      artist_name: r.artist_name || "Unknown Artist",
      cover_url: r.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
      release_year: Number(r.release_year ?? 2024),
      created_at: r.created_at,
    }));
  },

  create: async (album: Omit<Album, "id">): Promise<Album> => {
    const payload = {
      title: album.title,
      artist_id: album.artist_id,
      artist_name: album.artist_name || "Unknown Artist",
      cover_url: album.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
      release_year: Number(album.release_year ?? 2024),
    };
    try {
      const { data, error } = await supabase.from("albums").insert([payload]).select().single();
      if (error) throw error;
      return {
        id: String(data.id),
        title: data.title,
        artist_id: String(data.artist_id),
        artist_name: data.artist_name,
        cover_url: data.cover_url,
        release_year: Number(data.release_year),
        created_at: data.created_at,
      };
    } catch (e) {
      console.error("Supabase create album failed:", e);
      return { ...album, id: `al-${Date.now()}` };
    }
  },

  update: async (id: string, updates: Partial<Album>): Promise<void> => {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.artist_id !== undefined) payload.artist_id = updates.artist_id;
      if (updates.artist_name !== undefined) payload.artist_name = updates.artist_name;
      if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url;
      if (updates.release_year !== undefined) payload.release_year = updates.release_year;

      const { error } = await supabase.from("albums").update(payload).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase update album failed:", e);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("albums").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase delete album failed:", e);
    }
  },
};

// ─── SONGS API (Supports language column) ──────────────────────────────────────
export const songsApi = {
  getAll: async (): Promise<Song[]> => {
    return fetchFromSupabase<Song>("songs", mockSongs, (r: any) => ({
      id: String(r.id),
      title: r.title || "Untitled Song",
      artist_id: String(r.artist_id || ""),
      artist_name: r.artist_name || "Unknown Artist",
      album_id: r.album_id ? String(r.album_id) : "",
      album_name: r.album_name || "Single",
      cover_url: r.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
      audio_url: r.audio_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: Number(r.duration ?? 180.0),
      language: r.language || "Hindi",
      created_at: r.created_at,
    }));
  },

  create: async (song: Omit<Song, "id">): Promise<Song> => {
    const payload = {
      title: song.title,
      artist_id: song.artist_id,
      artist_name: song.artist_name || "Unknown Artist",
      album_id: song.album_id || null,
      album_name: song.album_name || null,
      cover_url: song.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
      audio_url: song.audio_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: Number(song.duration ?? 180.0),
      language: song.language || "Hindi",
    };
    try {
      const { data, error } = await supabase.from("songs").insert([payload]).select().single();
      if (error) throw error;
      return {
        id: String(data.id),
        title: data.title,
        artist_id: String(data.artist_id),
        artist_name: data.artist_name,
        album_id: data.album_id ? String(data.album_id) : "",
        album_name: data.album_name || "Single",
        cover_url: data.cover_url,
        audio_url: data.audio_url,
        duration: Number(data.duration),
        language: data.language || payload.language,
        created_at: data.created_at,
      };
    } catch (e) {
      console.error("Supabase create song failed:", e);
      return { ...song, id: `s-${Date.now()}` };
    }
  },

  update: async (id: string, updates: Partial<Song>): Promise<void> => {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.artist_id !== undefined) payload.artist_id = updates.artist_id;
      if (updates.artist_name !== undefined) payload.artist_name = updates.artist_name;
      if (updates.album_id !== undefined) payload.album_id = updates.album_id || null;
      if (updates.album_name !== undefined) payload.album_name = updates.album_name || null;
      if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url;
      if (updates.audio_url !== undefined) payload.audio_url = updates.audio_url;
      if (updates.duration !== undefined) payload.duration = updates.duration;
      if (updates.language !== undefined) payload.language = updates.language;

      const { error } = await supabase.from("songs").update(payload).eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase update song failed:", e);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase delete song failed:", e);
    }
  },
};

// ─── PLAYLISTS API ───────────────────────────────────────────────────────────
export const playlistsApi = {
  getAll: async (): Promise<Playlist[]> => {
    try {
      const { data, error } = await supabase.from("playlists").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const playlistsWithCount = await Promise.all(
          data.map(async (r: any) => {
            const { count } = await supabase
              .from("playlist_songs")
              .select("*", { count: "exact", head: true })
              .eq("playlist_id", r.id);
            return {
              id: String(r.id),
              title: r.title || "Untitled Playlist",
              creator: r.creator || "Musify",
              cover_url: r.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
              songs_count: count ?? 0,
              created_at: r.created_at,
            };
          })
        );
        return playlistsWithCount;
      }
      return [];
    } catch (e) {
      console.warn("Supabase fetch playlists error:", e);
      return mockPlaylists;
    }
  },

  getPlaylistSongIds: async (playlistId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId);
      if (!error && data) {
        return data.map((r: any) => String(r.song_id));
      }
    } catch (e) {
      console.warn("Supabase fetch playlist_songs error:", e);
    }
    return [];
  },

  create: async (playlist: Omit<Playlist, "id">, songIds: string[]): Promise<Playlist> => {
    const payload = {
      title: playlist.title,
      creator: playlist.creator || "Musify",
      cover_url: playlist.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600",
    };
    let createdId = `p-${Date.now()}`;
    try {
      const { data, error } = await supabase.from("playlists").insert([payload]).select().single();
      if (!error && data) {
        createdId = String(data.id);
      }
    } catch (e) {
      console.error("Supabase insert playlist error:", e);
    }

    if (songIds.length > 0) {
      try {
        const junctionPayload = songIds.map((sid) => ({
          playlist_id: createdId,
          song_id: sid,
        }));
        await supabase.from("playlist_songs").insert(junctionPayload);
      } catch (e) {
        console.error("Supabase insert playlist_songs error:", e);
      }
    }

    return { ...playlist, id: createdId, songs_count: songIds.length };
  },

  update: async (id: string, updates: Partial<Playlist>, songIds?: string[]): Promise<void> => {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.creator !== undefined) payload.creator = updates.creator;
      if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url;

      if (Object.keys(payload).length > 0) {
        await supabase.from("playlists").update(payload).eq("id", id);
      }

      if (songIds !== undefined) {
        await supabase.from("playlist_songs").delete().eq("playlist_id", id);
        if (songIds.length > 0) {
          const junctionPayload = songIds.map((sid) => ({
            playlist_id: id,
            song_id: sid,
          }));
          await supabase.from("playlist_songs").insert(junctionPayload);
        }
      }
    } catch (e) {
      console.error("Supabase update playlist error:", e);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await supabase.from("playlists").delete().eq("id", id);
    } catch (e) {
      console.error("Supabase delete playlist error:", e);
    }
  },
};

// ─── STORAGE API ─────────────────────────────────────────────────────────────
export const storageApi = {
  uploadFile: async (bucket: "covers" | "audio", file: File): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      } else if (error) {
        console.error(`Supabase storage upload to '${bucket}' failed:`, error.message);
      }
    } catch (e) {
      console.warn("Supabase storage error:", e);
    }
    return URL.createObjectURL(file);
  },
};
