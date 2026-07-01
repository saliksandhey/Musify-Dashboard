import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, Play, Pause, Music, Eye, Globe } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import Modal from "@/components/ui/Modal";
import FileUploadZone from "@/components/ui/FileUploadZone";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { songsApi, artistsApi, albumsApi, storageApi } from "@/services/apiServices";
import type { Song, Artist, Album } from "@/types";
import { formatDuration } from "@/utils";

const LANGUAGES = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bengali", "Spanish", "French", "German"];

export default function SongsPage() {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: "cover" | "audio"; url: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    album_id: "", // Default to empty string (Single track, no album)
    cover_url: "",
    audio_url: "",
    duration: 180,
    language: "Hindi",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [songsData, artistsData, albumsData] = await Promise.all([
      songsApi.getAll(),
      artistsApi.getAll(),
      albumsApi.getAll(),
    ]);
    setSongs(songsData);
    setArtists(artistsData);
    setAlbums(albumsData);
    if (artistsData.length > 0) {
      setFormData((prev) => ({ ...prev, artist_id: artistsData[0].id }));
    }
    setLoading(false);
  };

  const availableAlbums = useMemo(() => {
    if (!formData.artist_id) return albums;
    return albums.filter((al) => al.artist_id === formData.artist_id);
  }, [albums, formData.artist_id]);

  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.artist_name && s.artist_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.album_name && s.album_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.language && s.language.toLowerCase().includes(search.toLowerCase()));
      const matchesLang = languageFilter === "all" || s.language === languageFilter;
      return matchesSearch && matchesLang;
    });
  }, [songs, search, languageFilter]);

  const handleOpenCreate = () => {
    setEditingSong(null);
    const firstArtistId = artists[0]?.id || "";
    setFormData({
      title: "",
      artist_id: firstArtistId,
      album_id: "", // Explicitly default to empty string so it stays a Single track unless changed
      cover_url: "",
      audio_url: "",
      duration: 200,
      language: "Hindi",
    });
    setCoverFile(null);
    setAudioFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      artist_id: song.artist_id,
      album_id: song.album_id || "",
      cover_url: song.cover_url,
      audio_url: song.audio_url,
      duration: song.duration,
      language: song.language || "Hindi",
    });
    setCoverFile(null);
    setAudioFile(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await songsApi.delete(deleteTarget.id);
    setSongs((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    toast.success("Song deleted");
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter a song title");
      return;
    }

    let finalCoverUrl = formData.cover_url || editingSong?.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600";
    if (coverFile) {
      finalCoverUrl = await storageApi.uploadFile("covers", coverFile);
    }

    let finalAudioUrl = formData.audio_url || editingSong?.audio_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    if (audioFile) {
      finalAudioUrl = await storageApi.uploadFile("audio", audioFile);
    }

    const selectedArtist = artists.find((a) => a.id === formData.artist_id);
    const selectedAlbum = albums.find((al) => al.id === formData.album_id);

    if (editingSong) {
      const updates = {
        ...formData,
        cover_url: finalCoverUrl,
        audio_url: finalAudioUrl,
        artist_name: selectedArtist ? selectedArtist.name : editingSong.artist_name,
        album_id: formData.album_id || "",
        album_name: selectedAlbum ? selectedAlbum.title : "Single",
      };
      await songsApi.update(editingSong.id, updates);
      setSongs((prev) =>
        prev.map((s) => (s.id === editingSong.id ? { ...s, ...updates } : s))
      );
      toast.success("Song updated in Supabase");
    } else {
      const newSongData = {
        title: formData.title,
        artist_id: formData.artist_id,
        artist_name: selectedArtist ? selectedArtist.name : "Unknown Artist",
        album_id: formData.album_id || "",
        album_name: selectedAlbum ? selectedAlbum.title : "Single",
        cover_url: finalCoverUrl,
        audio_url: finalAudioUrl,
        duration: formData.duration,
        language: formData.language,
      };
      const created = await songsApi.create(newSongData);
      setSongs((prev) => [created, ...prev]);
      toast.success("Song saved to Supabase");
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<Song, unknown>[] = [
    {
      accessorKey: "title",
      header: "Song Title",
      cell: ({ row }) => {
        const song = row.original;
        const isPlaying = playingSongId === song.id;
        return (
          <div className="flex items-center gap-3">
            <div className="relative group flex-shrink-0">
              <img
                src={song.cover_url}
                alt={song.title}
                className="w-10 h-10 rounded-lg object-cover border border-white/10"
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
                {isPlaying ? <Pause size={14} className="text-white fill-white" /> : <Play size={14} className="text-white fill-white" />}
              </button>
            </div>
            <div>
              <p className="font-semibold text-foreground">{song.title}</p>
              <button
                onClick={() => setPreviewMedia({ type: "cover", url: song.cover_url, title: song.title })}
                className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Eye size={10} /> Preview Cover
              </button>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "artist_name",
      header: "Artist",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground/90">{row.original.artist_name || "Unknown"}</span>
      ),
    },
    {
      accessorKey: "album_name",
      header: "Album",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.album_name || "Single"}</span>
      ),
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-600/15 text-purple-300 rounded-lg inline-flex items-center gap-1">
          <Globe size={11} /> {row.original.language || "Hindi"}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{formatDuration(row.original.duration)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const song = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleOpenEdit(song)}
              className="p-2 text-muted-foreground hover:text-purple-400 hover:bg-white/5 rounded-lg transition"
              title="Edit song"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(song)}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              title="Delete song"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Songs Module"
        description="Manage master audio tracks, languages, and previews in Supabase."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/songs/bulk-upload")}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-white/10 text-foreground rounded-xl font-semibold text-sm transition border border-white/5"
            >
              Bulk Upload
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-gradient text-white rounded-xl font-semibold text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
            >
              <Plus size={16} />
              Add Song
            </button>
          </div>
        }
      />

      {previewMedia?.type === "audio" && (
        <div className="glass-card p-4 flex items-center justify-between bg-purple-600/10 border-purple-600/30">
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

      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search song title, artist, album, language..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-muted-foreground font-medium">Language:</label>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-surface-3 border border-white/8 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card p-4">
        {loading ? <TableSkeleton rows={5} /> : <DataTable data={filteredSongs} columns={columns} />}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSong ? "Edit Song" : "Create Song"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploadZone accept="image" value={coverFile} onChange={setCoverFile} label="Cover Artwork" />
            <FileUploadZone accept="audio" value={audioFile} onChange={(file) => {
              setAudioFile(file);
              if (file && !formData.title) {
                setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
              }
            }} label="Audio File" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cover URL</label>
              <input
                type="url"
                value={formData.cover_url}
                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Audio URL</label>
              <input
                type="url"
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                placeholder="https://...mp3"
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Song Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Chaleya"
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Song Language Tag *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40 font-semibold text-purple-300"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    🌐 {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Artist *</label>
              <select
                value={formData.artist_id}
                onChange={(e) => {
                  const newArtistId = e.target.value;
                  setFormData({
                    ...formData,
                    artist_id: newArtistId,
                    // Keep album_id as "" (Single) when switching artist unless explicitly selected
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Album (Optional)</label>
              <select
                value={formData.album_id}
                onChange={(e) => setFormData({ ...formData, album_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              >
                <option value="">None (Single Track)</option>
                {availableAlbums.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                placeholder="200"
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-gradient text-white rounded-xl text-sm font-semibold shadow-glow-purple-sm hover:shadow-glow-purple transition"
            >
              {editingSong ? "Save Changes" : "Create Song"}
            </button>
          </div>
        </form>
      </Modal>

      {previewMedia?.type === "cover" && (
        <Modal open={true} onClose={() => setPreviewMedia(null)} title={`Cover Preview: ${previewMedia.title}`} size="md">
          <div className="flex justify-center p-2">
            <img src={previewMedia.url} alt="Cover" className="max-h-80 rounded-xl object-cover border border-white/10" />
          </div>
        </Modal>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete Song "${deleteTarget?.title}"?`}
        description="This song will be removed from playlists and deleted from Supabase."
      />
    </PageWrapper>
  );
}
