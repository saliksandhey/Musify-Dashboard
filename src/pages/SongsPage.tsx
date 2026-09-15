import { useState, useMemo, useEffect } from "react";
import { Play, Pause, Music, Search, Globe, Volume2 } from "lucide-react";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { songsApi } from "@/services/apiServices";
import type { Song } from "@/types";
import { formatDuration } from "@/utils";

const LANGUAGES = ["Hindi", "Punjabi", "English", "Tamil", "Telugu", "Bengali", "Spanish", "French", "German"];

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<{ url: string; title: string; artist: string } | null>(null);

  // Debounced search for JioSaavn API based on search query or selected language
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim() || (languageFilter !== "all" ? languageFilter : "trending");
      loadSongs(q);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, languageFilter]);

  const loadSongs = async (query: string) => {
    setLoading(true);
    const data = await songsApi.search(query);
    setSongs(data);
    setLoading(false);
  };

  const filteredSongs = useMemo(() => {
    if (languageFilter === "all") return songs;
    // Keep tracks matching selected language or all returned from api
    return songs.filter((s) => !s.language || s.language.toLowerCase() === languageFilter.toLowerCase() || search.length > 0);
  }, [songs, languageFilter, search]);

  const handlePlayToggle = (song: Song) => {
    if (!song.audio_url) return;
    if (playingSongId === song.id) {
      setPlayingSongId(null);
      setPreviewAudioUrl(null);
    } else {
      setPlayingSongId(song.id);
      setPreviewAudioUrl({
        url: song.audio_url,
        title: song.title,
        artist: song.artist_name || "Unknown Artist",
      });
    }
  };

  const columns = [
    {
      header: "Track",
      accessorKey: "title",
      cell: (props: any) => {
        const row: Song = props.row.original;
        const isPlaying = playingSongId === row.id;
        return (
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-lg bg-surface-2 overflow-hidden flex-shrink-0 group">
              <img src={row.cover_url} alt={row.title} className="w-full h-full object-cover" />
              {row.audio_url && (
                <button
                  onClick={() => handlePlayToggle(row)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
                </button>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-foreground text-sm truncate">{row.title}</div>
              <div className="text-xs text-muted-foreground truncate">{row.artist_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Album",
      accessorKey: "album_name",
      cell: (props: any) => {
        const row: Song = props.row.original;
        return (
          <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px] inline-block">
            {row.album_name || "Single"}
          </span>
        );
      },
    },
    {
      header: "Language",
      accessorKey: "language",
      cell: (props: any) => {
        const row: Song = props.row.original;
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Globe size={12} />
            {row.language || "Hindi"}
          </span>
        );
      },
    },
    {
      header: "Duration",
      accessorKey: "duration",
      cell: (props: any) => {
        const row: Song = props.row.original;
        return <span className="text-xs font-mono text-muted-foreground">{formatDuration(row.duration)}</span>;
      },
    },
    {
      header: "Audio Preview",
      accessorKey: "audio_url",
      cell: (props: any) => {
        const row: Song = props.row.original;
        const isPlaying = playingSongId === row.id;
        return (
          <div>
            {row.audio_url ? (
              <button
                onClick={() => handlePlayToggle(row)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isPlaying
                    ? "bg-purple-600 text-white shadow-glow-purple-sm"
                    : "bg-surface-3 hover:bg-surface-4 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isPlaying ? "Playing..." : "Preview"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground italic">No Audio</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Songs Library"
        description="Explore live Punjabi, Hindi, and global music catalog via JioSaavn API."
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search any track or artist (e.g. Sidhu Moose Wala, Karan Aujla, Kesariya)..."
            className="w-full max-w-md"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-4 py-2 bg-surface-2 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-foreground transition"
          >
            <option value="all">All Languages (250+ Tracks)</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-surface-2 rounded-xl border border-white/5">
            Showing <span className="text-foreground font-bold">{filteredSongs.length}</span> tracks
          </div>
        </div>
      </div>

      {/* Floating Audio Player */}
      {previewAudioUrl && (
        <div className="fixed bottom-6 right-6 z-50 glass-card p-4 rounded-2xl border border-purple-500/30 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-glow-purple-sm">
            <Volume2 size={20} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{previewAudioUrl.title}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{previewAudioUrl.artist}</p>
          </div>
          <audio src={previewAudioUrl.url} autoPlay controls className="h-8 max-w-[220px]" onEnded={() => setPlayingSongId(null)} />
          <button
            onClick={() => {
              setPlayingSongId(null);
              setPreviewAudioUrl(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-glass">
        {loading ? <TableSkeleton rows={8} /> : <DataTable columns={columns} data={filteredSongs} />}
      </div>
    </PageWrapper>
  );
}
