import { useState, useMemo, useEffect } from "react";
import { Play, Pause, Music, Eye, Globe } from "lucide-react";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import { songsApi, artistsApi } from "@/services/apiServices";
import type { Song, Artist } from "@/types";
import { formatDuration, cn } from "@/utils";
import Modal from "@/components/ui/Modal";

export default function BrowseArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: "cover" | "audio"; url: string; title: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [artistsData, songsData] = await Promise.all([
      artistsApi.getAll(),
      songsApi.getAll(),
    ]);
    setArtists(artistsData);
    setSongs(songsData);
    if (artistsData.length > 0) {
      setSelectedArtistId(artistsData[0].id);
    }
    setLoading(false);
  };

  const filteredSongs = useMemo(() => {
    if (!selectedArtistId) return [];
    return songs.filter((s) => s.artist_id === selectedArtistId);
  }, [songs, selectedArtistId]);

  return (
    <PageWrapper>
      <PageHeader
        title="Browse by Artist"
        description="Select an artist to view all their songs."
      />

      {/* Artists Horizontal Scroll */}
      <div className="glass-card p-5 mb-6 overflow-hidden">
        <h3 className="text-sm font-semibold text-foreground mb-4">Select Artist</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-white/10" />
                <div className="w-16 h-3 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            artists.map((artist) => {
              const isSelected = selectedArtistId === artist.id;
              return (
                <button
                  key={artist.id}
                  onClick={() => setSelectedArtistId(artist.id)}
                  className="group flex flex-col items-center gap-3 flex-shrink-0 w-24 focus:outline-none"
                >
                  <div className={cn(
                    "w-20 h-20 rounded-full p-1 transition-all duration-300 relative",
                    isSelected ? "bg-purple-gradient shadow-glow-purple" : "bg-transparent hover:bg-white/10"
                  )}>
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover border-2 border-surface-2"
                    />
                    {artist.verified && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-surface-2 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-semibold text-center truncate w-full transition-colors",
                    isSelected ? "text-purple-300" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {artist.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Audio Player Preview */}
      {previewMedia?.type === "audio" && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between bg-purple-600/10 border-purple-600/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Previewing Audio: {previewMedia.title}</p>
              <audio controls autoPlay src={previewMedia.url} className="h-7 mt-1 w-64 sm:w-80" />
            </div>
          </div>
          <button onClick={() => { setPreviewMedia(null); setPlayingSongId(null); }} className="text-xs text-muted-foreground hover:text-foreground">Close Player</button>
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : filteredSongs.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Music size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Songs Found</h3>
            <p className="text-sm text-muted-foreground mt-1">This artist doesn't have any songs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map((song) => {
              const isPlaying = playingSongId === song.id;
              return (
                <div key={song.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-white/5 transition-colors">
                  <div className="relative flex-shrink-0">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          setPlayingSongId(null);
                        } else {
                          setPlayingSongId(song.id);
                          setPreviewMedia({ type: "audio", url: song.audio_url, title: song.title });
                        }
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition"
                    >
                      {isPlaying ? <Pause size={20} className="text-white fill-white" /> : <Play size={20} className="text-white fill-white" />}
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{song.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{song.album_name || "Single"}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-600/15 text-purple-300 rounded-md inline-flex items-center gap-1">
                        <Globe size={10} /> {song.language || "Hindi"}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setPreviewMedia({ type: "cover", url: song.cover_url, title: song.title })}
                    className="p-2 text-muted-foreground hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Preview Cover"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {previewMedia?.type === "cover" && (
        <Modal open={true} onClose={() => setPreviewMedia(null)} title={`Cover Preview: ${previewMedia.title}`} size="md">
          <div className="flex justify-center p-2">
            <img src={previewMedia.url} alt="Cover" className="max-h-80 rounded-xl object-cover border border-white/10" />
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
