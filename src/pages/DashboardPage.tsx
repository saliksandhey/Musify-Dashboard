import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic2, Disc3, Music, ListMusic, Music2 } from "lucide-react";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { artistsApi, albumsApi, songsApi, playlistsApi } from "@/services/apiServices";
import type { Artist, Album, Song, Playlist } from "@/types";
import { formatNumber } from "@/utils";

export default function DashboardPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [artistsData, albumsData, songsData, playlistsData] = await Promise.all([
        artistsApi.getAll(),
        albumsApi.getAll(),
        songsApi.getAll(),
        playlistsApi.getAll(),
      ]);
      setArtists(artistsData);
      setAlbums(albumsData);
      setSongs(songsData);
      setPlaylists(playlistsData);
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  const stats = [
    { label: "Total Artists", value: artists.length, icon: Mic2, color: "from-blue-600 to-blue-400" },
    { label: "Total Albums", value: albums.length, icon: Disc3, color: "from-emerald-600 to-emerald-400" },
    { label: "Total Songs", value: songs.length, icon: Music, color: "from-purple-600 to-purple-400" },
    { label: "Total Playlists", value: playlists.length, icon: ListMusic, color: "from-pink-600 to-pink-400" },
  ];

  const recentSongs = songs.slice(0, 5);
  const recentAlbums = albums.slice(0, 5);

  return (
    <PageWrapper>
      <PageHeader title="Dashboard" description="Overview of platform metrics, recent releases, and media stats." />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="stat-card"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 rounded-2xl`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <stat.icon size={22} className="text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(stat.value)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
      </div>

      {/* Recent Songs & Recent Albums */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <Music size={18} className="text-purple-400" />
              <h3 className="text-base font-bold text-foreground">Recent Songs</h3>
            </div>
            <span className="text-xs text-muted-foreground">{recentSongs.length} displayed</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentSongs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No songs found.</p>
          ) : (
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition">
                  <img src={song.cover_url} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist_name || "Artist"} · {song.album_name || "Album"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Albums */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <Disc3 size={18} className="text-emerald-400" />
              <h3 className="text-base font-bold text-foreground">Recent Albums</h3>
            </div>
            <span className="text-xs text-muted-foreground">{recentAlbums.length} displayed</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentAlbums.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No albums found.</p>
          ) : (
            <div className="space-y-3">
              {recentAlbums.map((album) => (
                <div key={album.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition">
                  <img src={album.cover_url} alt={album.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{album.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{album.artist_name || "Artist"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-purple-300 rounded-lg">{album.release_year}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
