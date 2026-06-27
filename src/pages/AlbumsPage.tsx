import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Disc3, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import Modal from "@/components/ui/Modal";
import FileUploadZone from "@/components/ui/FileUploadZone";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { albumsApi, artistsApi, storageApi } from "@/services/apiServices";
import type { Album, Artist } from "@/types";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Album | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    cover_url: "",
    release_year: 2024,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [albumsData, artistsData] = await Promise.all([
      albumsApi.getAll(),
      artistsApi.getAll(),
    ]);
    setAlbums(albumsData);
    setArtists(artistsData);
    if (artistsData.length > 0) {
      setFormData((prev) => ({ ...prev, artist_id: artistsData[0].id }));
    }
    setLoading(false);
  };

  const filteredAlbums = useMemo(() => {
    return albums.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.artist_name && a.artist_name.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [albums, search]);

  const handleOpenCreate = () => {
    setEditingAlbum(null);
    setFormData({
      title: "",
      artist_id: artists[0]?.id || "",
      cover_url: "",
      release_year: new Date().getFullYear(),
    });
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      artist_id: album.artist_id,
      cover_url: album.cover_url,
      release_year: album.release_year,
    });
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await albumsApi.delete(deleteTarget.id);
    setAlbums((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    toast.success("Album and related songs deleted");
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter an album title");
      return;
    }

    let finalCoverUrl = formData.cover_url || editingAlbum?.cover_url || "https://picsum.photos/200";
    if (coverFile) {
      finalCoverUrl = await storageApi.uploadFile("covers", coverFile);
    }

    const selectedArtist = artists.find((a) => a.id === formData.artist_id);

    if (editingAlbum) {
      const updates = {
        ...formData,
        cover_url: finalCoverUrl,
        artist_name: selectedArtist ? selectedArtist.name : editingAlbum.artist_name,
      };
      await albumsApi.update(editingAlbum.id, updates);
      setAlbums((prev) =>
        prev.map((a) => (a.id === editingAlbum.id ? { ...a, ...updates } : a))
      );
      toast.success("Album updated");
    } else {
      const newAlbumData = {
        title: formData.title,
        artist_id: formData.artist_id,
        artist_name: selectedArtist ? selectedArtist.name : "Unknown Artist",
        cover_url: finalCoverUrl,
        release_year: formData.release_year,
      };
      const created = await albumsApi.create(newAlbumData);
      setAlbums((prev) => [created, ...prev]);
      toast.success("Album created");
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<Album, unknown>[] = [
    {
      accessorKey: "title",
      header: "Album",
      cell: ({ row }) => {
        const album = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={album.cover_url}
              alt={album.title}
              className="w-10 h-10 rounded-lg object-cover border border-white/10"
            />
            <div>
              <p className="font-semibold text-foreground">{album.title}</p>
              <p className="text-xs text-muted-foreground">{album.release_year}</p>
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
      accessorKey: "release_year",
      header: "Release Year",
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-purple-300 rounded-lg">
          {row.original.release_year}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const album = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleOpenEdit(album)}
              className="p-2 text-muted-foreground hover:text-purple-400 hover:bg-white/5 rounded-lg transition"
              title="Edit album"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(album)}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              title="Delete album"
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
        title="Albums Module"
        description="Manage discography releases linked with artists."
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-gradient text-white rounded-xl font-semibold text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
          >
            <Plus size={16} />
            Add Album
          </button>
        }
      />

      <div className="glass-card p-4 flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search album title or artist..."
          className="w-full sm:w-80"
        />
      </div>

      <div className="glass-card p-4">
        {loading ? <TableSkeleton rows={5} /> : <DataTable data={filteredAlbums} columns={columns} />}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAlbum ? "Edit Album" : "Create Album"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadZone
            accept="image"
            value={coverFile}
            onChange={setCoverFile}
            label="Upload Cover Artwork (or paste Cover URL below)"
          />

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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Album Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Midnight Echoes"
              className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Artist *</label>
              <select
                value={formData.artist_id}
                onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
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
              <label className="text-xs font-medium text-muted-foreground">Release Year</label>
              <input
                type="number"
                value={formData.release_year}
                onChange={(e) => setFormData({ ...formData, release_year: Number(e.target.value) })}
                placeholder="2024"
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
              {editingAlbum ? "Save Changes" : "Create Album"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete Album "${deleteTarget?.title}"?`}
        description="This will remove the album record and any dependent songs."
      />
    </PageWrapper>
  );
}
