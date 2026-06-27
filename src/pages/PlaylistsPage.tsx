import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, ListMusic, Edit2, Trash2, Music, Check } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import Modal from "@/components/ui/Modal";
import FileUploadZone from "@/components/ui/FileUploadZone";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { playlistsApi, songsApi, storageApi } from "@/services/apiServices";
import type { Playlist, Song } from "@/types";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    creator: "Musify Editorial",
    cover_url: "",
  });
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [playlistsData, songsData] = await Promise.all([
      playlistsApi.getAll(),
      songsApi.getAll(),
    ]);
    setPlaylists(playlistsData);
    setSongs(songsData);
    setLoading(false);
  };

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.creator.toLowerCase().includes(search.toLowerCase())
    );
  }, [playlists, search]);

  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setFormData({
      title: "",
      creator: "Musify Editorial",
      cover_url: "",
    });
    setSelectedSongIds([]);
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (pl: Playlist) => {
    setEditingPlaylist(pl);
    setFormData({
      title: pl.title,
      creator: pl.creator,
      cover_url: pl.cover_url,
    });
    setCoverFile(null);
    setIsModalOpen(true);

    // Load junction playlist_songs for this playlist
    const existingSongIds = await playlistsApi.getPlaylistSongIds(pl.id);
    setSelectedSongIds(existingSongIds);
  };

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await playlistsApi.delete(deleteTarget.id);
    setPlaylists((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success("Playlist deleted");
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter a playlist title");
      return;
    }

    let finalCoverUrl = formData.cover_url || editingPlaylist?.cover_url || "https://picsum.photos/200";
    if (coverFile) {
      finalCoverUrl = await storageApi.uploadFile("covers", coverFile);
    }

    if (editingPlaylist) {
      const updates = { ...formData, cover_url: finalCoverUrl };
      await playlistsApi.update(editingPlaylist.id, updates, selectedSongIds);
      setPlaylists((prev) =>
        prev.map((p) => (p.id === editingPlaylist.id ? { ...p, ...updates, songs_count: selectedSongIds.length } : p))
      );
      toast.success("Playlist and song relationships updated");
    } else {
      const newPlData = {
        title: formData.title,
        creator: formData.creator,
        cover_url: finalCoverUrl,
      };
      const created = await playlistsApi.create(newPlData, selectedSongIds);
      setPlaylists((prev) => [created, ...prev]);
      toast.success("Playlist created and saved to playlist_songs");
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<Playlist, unknown>[] = [
    {
      accessorKey: "title",
      header: "Playlist",
      cell: ({ row }) => {
        const pl = row.original;
        return (
          <div className="flex items-center gap-3">
            <img src={pl.cover_url} alt={pl.title} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
            <div>
              <p className="font-semibold text-foreground">{pl.title}</p>
              <p className="text-xs text-muted-foreground">{pl.creator}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "songs_count",
      header: "Songs Count",
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-600/15 text-purple-300 rounded-lg">
          {row.original.songs_count ?? 0} Tracks
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const pl = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleOpenEdit(pl)}
              className="p-2 text-muted-foreground hover:text-purple-400 hover:bg-white/5 rounded-lg transition"
              title="Edit playlist"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(pl)}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              title="Delete playlist"
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
        title="Playlists Module"
        description="Manage playlists and store song linkages in playlist_songs junction table."
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-gradient text-white rounded-xl font-semibold text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
          >
            <Plus size={16} />
            Create Playlist
          </button>
        }
      />

      <div className="glass-card p-4 flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search playlist title or creator..."
          className="w-full sm:w-80"
        />
      </div>

      <div className="glass-card p-4">
        {loading ? <TableSkeleton rows={5} /> : <DataTable data={filteredPlaylists} columns={columns} />}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlaylist ? "Edit Playlist & Songs" : "Create Playlist"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadZone accept="image" value={coverFile} onChange={setCoverFile} label="Cover Artwork" />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cover URL</label>
            <input
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Playlist Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Global Top 50"
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Creator</label>
              <input
                type="text"
                value={formData.creator}
                onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              />
            </div>
          </div>

          {/* Song selection list for playlist_songs junction */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Select Songs to Include ({selectedSongIds.length} selected)</label>
              <span className="text-[11px] text-purple-400">Stores relationship in playlist_songs</span>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-surface-3 rounded-xl border border-white/8">
              {songs.map((song) => {
                const isSelected = selectedSongIds.includes(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSongSelection(song.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isSelected ? "bg-purple-600/20 border border-purple-600/40" : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border text-white ${isSelected ? "bg-purple-600 border-purple-600" : "border-white/20"}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <img src={song.cover_url} alt={song.title} className="w-8 h-8 rounded object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{song.title}</p>
                        <p className="text-[10px] text-muted-foreground">{song.artist_name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              {editingPlaylist ? "Save Playlist" : "Create Playlist"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete Playlist "${deleteTarget?.title}"?`}
        description="This will remove the playlist and its song entries in playlist_songs."
      />
    </PageWrapper>
  );
}
