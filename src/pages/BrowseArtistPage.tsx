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
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: "cover" | "audio"; url: string; title: string } | null>(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    const artistsData = await artistsApi.search("Arijit Singh");
    setArtists(artistsData);
    if (artistsData.length > 0) {
      handleSelectArtist(artistsData[0]);
    } else {
      setLoading(false);
    }
  };

  const handleSelectArtist = async (artist: Artist) => {
    setSelectedArtist(artist);
    setLoadingSongs(true);
    const songsData = await songsApi.search(artist.name);
    setSongs(songsData);
    setLoadingSongs(false);
    setLoading(false);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Browse by Artist"
        description="Select an artist to view their live tracks from JioSaavn."
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
              const isSelected = selectedArtist?.id === artist.id;
              return (
                <button
                  key={artist.id}
                  onClick={() => handleSelectArtist(artist)}
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
            <Music className="text-purple-400 animate-pulse" size={20} />
            <div>
              <p className="text-sm font-bold text-foreground">{previewMedia.title}</p>
              <p className="text-xs text-muted-foreground">Playing live preview audio</p>
            </div>
          </div>
          <audio src={previewMedia.url} controls autoPlay className="h-9 max-w-xs" />
        </div>
      )}

      {/* Songs List */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-foreground mb-4">
          Tracks by {selectedArtist?.name || "Selected Artist"} ({songs.length})
        </h3>
        {loadingSongs ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No tracks found for this artist.</p>
        ) : (
          <div className="space-y-2">
            {songs.map((song) => {
              const isPlaying = playingSongId === song.id;
              return (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/4 transition border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={song.cover_url} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.album_name || "Single"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{formatDuration(song.duration)}</span>
                    {song.audio_url && (
                      <button
                        onClick={() => {
                          setPlayingSongId(song.id);
                          setPreviewMedia({ type: "audio", url: song.audio_url, title: song.title });
                        }}
                        className={`p-2 rounded-lg transition ${
                          isPlaying ? "bg-purple-600 text-white" : "bg-surface-3 hover:bg-surface-4 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={previewMedia?.type === "cover"} onClose={() => setPreviewMedia(null)} title="Cover Artwork Preview" size="md">
        {previewMedia?.type === "cover" && (
          <div className="flex justify-center p-4">
            <img src={previewMedia.url} alt="Cover Preview" className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain" />
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
