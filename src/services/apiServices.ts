import { supabase, supabaseAdmin } from "./supabase";
import type { Artist, Album, Song, Playlist, User, HeroBanner } from "@/types";
import { toast } from "sonner";

// Active JioSaavn API mirrors (with multi-mirror automatic fallback)
const SAAVN_BASE_URLS = [
  "https://jiosaavn-api-2.vercel.app",
  "https://saavn.me",
  "https://jiosaavn-api.vercel.app",
];

async function fetchJioSaavn(endpointPath: string): Promise<any> {
  for (const baseUrl of SAAVN_BASE_URLS) {
    try {
      const res = await fetch(`${baseUrl}${endpointPath}`);
      if (res.ok) {
        const json = await res.json();
        if (json && (json.status === "SUCCESS" || json.data || json.results)) {
          return json;
        }
      }
    } catch (e) {
      console.warn(`JioSaavn mirror '${baseUrl}' failed, trying fallback...`);
    }
  }
  return null;
}

// ─── JIOSAAVN HELPER FUNCTIONS ────────────────────────────────────────────────
function cleanText(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractImageUrl(image: any): string {
  if (Array.isArray(image)) {
    const best = image[image.length - 1] || image[0];
    return best?.link || best?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600";
  }
  if (typeof image === "string" && image.trim().length > 0) return image;
  return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600";
}

function extractAudioUrl(downloadUrl: any): string {
  if (Array.isArray(downloadUrl)) {
    const best = downloadUrl[downloadUrl.length - 1] || downloadUrl[0];
    return best?.link || best?.url || "";
  }
  if (typeof downloadUrl === "string") return downloadUrl;
  return "";
}

function extractArtistName(item: any): string {
  if (typeof item.primaryArtists === "string" && item.primaryArtists.trim().length > 0) {
    return cleanText(item.primaryArtists);
  }
  if (Array.isArray(item.artists?.primary) && item.artists.primary.length > 0) {
    return cleanText(item.artists.primary.map((a: any) => a.name).join(", "));
  }
  if (typeof item.artist === "string" && item.artist.trim().length > 0) {
    return cleanText(item.artist);
  }
  return "Various Artists";
}

function extractArtistId(item: any): string {
  if (Array.isArray(item.artists?.primary) && item.artists.primary.length > 0) {
    return String(item.artists.primary[0].id || "");
  }
  return String(item.artistId || item.primaryArtistsId || "");
}

function mapJioSaavnSong(item: any): Song {
  return {
    id: String(item.id),
    title: cleanText(item.name || item.title || "Untitled Song"),
    artist_id: extractArtistId(item),
    artist_name: extractArtistName(item),
    album_id: String(item.album?.id || item.albumId || ""),
    album_name: cleanText(item.album?.name || item.album || "Single"),
    cover_url: extractImageUrl(item.image),
    audio_url: extractAudioUrl(item.downloadUrl),
    duration: Number(item.duration ?? 180),
    language: item.language ? (item.language.charAt(0).toUpperCase() + item.language.slice(1).toLowerCase()) : "Hindi",
    created_at: item.releaseDate || new Date().toISOString(),
  };
}

function mapJioSaavnArtist(item: any): Artist {
  return {
    id: String(item.id),
    name: cleanText(item.name || item.title || "Unknown Artist"),
    image_url: extractImageUrl(item.image),
    verified: true,
    monthly_listeners: Number(item.followerCount || item.playCount || 150000),
    role: item.role || item.type || "Artist",
    created_at: new Date().toISOString(),
  };
}

function mapJioSaavnAlbum(item: any): Album {
  return {
    id: String(item.id),
    title: cleanText(item.name || item.title || "Untitled Album"),
    artist_id: extractArtistId(item),
    artist_name: extractArtistName(item),
    cover_url: extractImageUrl(item.image),
    release_year: Number(item.year || 2024),
    song_count: Number(item.songCount || 10),
    created_at: item.releaseDate || new Date().toISOString(),
  };
}

// ─── PREMIUM EXPO PUSH NOTIFICATION SERVICE ──────────────────────────────────
export async function sendExpoPushNotification({
  title,
  subtitle,
  body,
  data,
}: {
  title: string;
  subtitle?: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    const { data: tokenList, error } = await supabase.from("user_push_tokens").select("push_token");
    if (error) throw error;

    if (tokenList && tokenList.length > 0) {
      const pushMessages = tokenList
        .filter((item) => item.push_token && typeof item.push_token === "string" && item.push_token.trim().length > 0)
        .map((item) => ({
          to: item.push_token.trim(),
          sound: "default",
          title: title,
          subtitle: subtitle || "Musify Exclusive",
          body: body,
          badge: 1,
          priority: "high",
          channelId: "default",
          data: data || {},
        }));

      if (pushMessages.length > 0) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pushMessages),
        });
      }
    }
  } catch (e: any) {
    console.error("Expo push notification failed:", e);
  }
}

// ─── USERS API (SUPABASE AUTH ADMIN) ───────────────────────────────────────
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      
      return data.users.map((u) => ({
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || "Unknown User",
        email: u.email || "No Email",
        avatar_url: u.user_metadata?.avatar_url || "https://i.pravatar.cc/150",
        role: u.user_metadata?.role === "admin" ? "admin" : "user",
        status: u.user_metadata?.status === "banned" ? "banned" : "active",
        created_at: u.created_at,
      }));
    } catch (e) {
      console.warn("Failed to fetch users from Supabase auth.admin:", e);
      return [];
    }
  },
  
  updateRole: async (id: string, role: "admin" | "user"): Promise<void> => {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { role }
      });
      if (error) throw error;
    } catch (e) {
      console.error("Supabase update role failed:", e);
      toast.error("Failed to update role in Supabase");
    }
  },

  updateStatus: async (id: string, status: "active" | "banned"): Promise<void> => {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { status }
      });
      if (error) throw error;
    } catch (e) {
      console.error("Supabase update status failed:", e);
      toast.error("Failed to update status in Supabase");
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase delete user failed:", e);
      toast.error("Failed to delete user in Supabase");
    }
  },
};

// ─── SONGS API (EXTENSIVE MULTI-QUERY CATALOG) ──────────────────────────────
export const songsApi = {
  search: async (query: string = "trending"): Promise<Song[]> => {
    try {
      const q = query.trim().toLowerCase();
      
      // Preset queries for rich multi-search catalog
      let queryList: string[] = [];
      if (q === "trending" || q === "all" || q === "") {
        queryList = [
          "trending hindi",
          "punjabi hits",
          "latest hindi",
          "latest punjabi",
          "sidhu moose wala",
          "arijit singh",
          "karan aujla",
          "diljit dosanjh",
          "shubh",
          "ap dhillon",
        ];
      } else if (q === "punjabi") {
        queryList = [
          "punjabi hits",
          "latest punjabi",
          "sidhu moose wala",
          "karan aujla",
          "diljit dosanjh",
          "shubh",
          "ap dhillon",
          "b praak",
          "gurinder gill",
          "amrit maan",
        ];
      } else if (q === "hindi") {
        queryList = [
          "hindi hits",
          "latest hindi",
          "arijit singh",
          "pritam",
          "shreya ghoshal",
          "badshah",
          "jubin nautiyal",
          "neha kakkar",
          "king",
          "yoyo honey singh",
        ];
      } else {
        queryList = [q];
      }

      // Execute queries in parallel
      const responses = await Promise.all(
        queryList.map((term) => fetchJioSaavn(`/search/songs?query=${encodeURIComponent(term)}&limit=40`))
      );

      const map = new Map<string, Song>();
      for (const json of responses) {
        const rawList = json?.results || json?.data?.results || json?.data || [];
        if (Array.isArray(rawList)) {
          rawList.forEach((item) => {
            const mapped = mapJioSaavnSong(item);
            if (mapped.id && !map.has(mapped.id)) {
              map.set(mapped.id, mapped);
            }
          });
        }
      }

      return Array.from(map.values());
    } catch (e) {
      console.error("JioSaavn search songs error:", e);
      return [];
    }
  },

  getAll: async (): Promise<Song[]> => {
    return songsApi.search("trending");
  },

  getById: async (id: string): Promise<Song | null> => {
    try {
      const json = await fetchJioSaavn(`/songs?id=${id}`);
      const rawList = json?.results || json?.data?.results || json?.data || [];
      const item = Array.isArray(rawList) ? rawList[0] : rawList;
      return item ? mapJioSaavnSong(item) : null;
    } catch (e) {
      console.error("JioSaavn get song by id error:", e);
      return null;
    }
  },

  create: async (song: Omit<Song, "id">, _skipNotification?: boolean): Promise<Song> => {
    toast.info("Catalog is live via JioSaavn API");
    return { ...song, id: `s-${Date.now()}` };
  },

  update: async (_id: string, _updates: Partial<Song>): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },

  delete: async (_id: string): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },
};

// ─── ARTISTS API (JIOSAAVN LIVE EXPLORER) ───────────────────────────────────
export const artistsApi = {
  search: async (query: string = "arijit"): Promise<Artist[]> => {
    try {
      const q = query.trim() || "arijit";
      const json = await fetchJioSaavn(`/search/all?query=${encodeURIComponent(q)}`);
      
      const rawList = json?.results?.artists?.data || json?.data?.artists?.data || json?.results || json?.data || [];
      if (Array.isArray(rawList)) {
        return rawList.map(mapJioSaavnArtist);
      }
      return [];
    } catch (e) {
      console.error("JioSaavn search artists error:", e);
      return [];
    }
  },

  getAll: async (): Promise<Artist[]> => {
    return artistsApi.search("arijit");
  },

  create: async (artist: Omit<Artist, "id">): Promise<Artist> => {
    toast.info("Catalog is live via JioSaavn API");
    return { ...artist, id: `a-${Date.now()}` };
  },

  update: async (_id: string, _updates: Partial<Artist>): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },

  delete: async (_id: string): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },
};

// ─── ALBUMS API (JIOSAAVN LIVE EXPLORER) ────────────────────────────────────
export const albumsApi = {
  search: async (query: string = "trending"): Promise<Album[]> => {
    try {
      const q = query.trim() || "trending";
      const json = await fetchJioSaavn(`/search/albums?query=${encodeURIComponent(q)}&limit=40`);
      
      const rawList = json?.results || json?.data?.results || json?.data || [];
      if (Array.isArray(rawList)) {
        return rawList.map(mapJioSaavnAlbum);
      }
      return [];
    } catch (e) {
      console.error("JioSaavn search albums error:", e);
      return [];
    }
  },

  getAll: async (): Promise<Album[]> => {
    return albumsApi.search("trending");
  },

  create: async (album: Omit<Album, "id">): Promise<Album> => {
    toast.info("Catalog is live via JioSaavn API");
    return { ...album, id: `al-${Date.now()}` };
  },

  update: async (_id: string, _updates: Partial<Album>): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },

  delete: async (_id: string): Promise<void> => {
    toast.info("Catalog is live via JioSaavn API");
  },
};

// ─── PLAYLISTS API (SUPABASE + JIOSAAVN STRING IDs) ─────────────────────────
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
      return [];
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
          song_id: String(sid),
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
            song_id: String(sid),
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

// ─── STORAGE API (SUPABASE STORAGE) ──────────────────────────────────────────
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

// ─── NOTIFICATIONS API (ONESIGNAL DIRECT) ────────────────────────────────────
export const notificationsApi = {
  sendPushNotification: async (payload: {
    title: string;
    message: string;
    target: string;
    artwork?: string;
    subtitle?: string;
    deepLinkData?: { type: string; id: string };
  }) => {
    try {
      const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
      const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

      if (!appId || !apiKey) {
        throw new Error("OneSignal keys are missing in environment variables.");
      }

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          included_segments: ["Subscribed Users", "Active Users", "Total Subscriptions"],
          headings: { en: payload.title },
          contents: { en: payload.message },
          subtitle: payload.subtitle ? { en: payload.subtitle } : undefined,
          big_picture: payload.artwork || undefined,
          ios_attachments: payload.artwork ? { id1: payload.artwork } : undefined,
          data: payload.deepLinkData || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OneSignal API Error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data;
    } catch (e) {
      console.error("Failed to send push notification via OneSignal:", e);
      throw e;
    }
  },
};

// ─── HERO BANNERS API (SUPABASE) ───────────────────────────────────────────
export const heroBannersApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HeroBanner[];
    } catch (e) {
      console.warn("Supabase fetch hero_banners error:", e);
      return [];
    }
  },
  create: async (banner: Omit<HeroBanner, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("hero_banners")
      .insert([banner])
      .select()
      .single();
    if (error) throw error;
    return data as HeroBanner;
  },
  update: async (id: string, updates: Partial<Omit<HeroBanner, "id" | "created_at">>) => {
    const { data, error } = await supabase
      .from("hero_banners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as HeroBanner;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("hero_banners").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
  toggleActive: async (id: string, is_active: boolean) => {
    const { data, error } = await supabase
      .from("hero_banners")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as HeroBanner;
  },
};
