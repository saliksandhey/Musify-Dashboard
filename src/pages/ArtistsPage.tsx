import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import Modal from "@/components/ui/Modal";
import FileUploadZone from "@/components/ui/FileUploadZone";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { artistsApi, storageApi } from "@/services/apiServices";
import type { Artist } from "@/types";
import { formatNumber } from "@/utils";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    verified: true,
    monthly_listeners: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    const data = await artistsApi.getAll();
    setArtists(data);
    setLoading(false);
  };

  const filteredArtists = useMemo(() => {
    return artists.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  }, [artists, search]);

  const handleOpenCreate = () => {
    setEditingArtist(null);
    setFormData({
      name: "",
      image_url: "",
      verified: true,
      monthly_listeners: 0,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      image_url: artist.image_url,
      verified: artist.verified,
      monthly_listeners: artist.monthly_listeners,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await artistsApi.delete(deleteTarget.id);
    setArtists((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    toast.success("Artist and related items deleted");
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please provide an artist name");
      return;
    }

    let finalImageUrl = formData.image_url || editingArtist?.image_url || "https://i.pravatar.cc/150";
    if (imageFile) {
      finalImageUrl = await storageApi.uploadFile("covers", imageFile);
    }

    if (editingArtist) {
      const updates = { ...formData, image_url: finalImageUrl };
      await artistsApi.update(editingArtist.id, updates);
      setArtists((prev) =>
        prev.map((a) => (a.id === editingArtist.id ? { ...a, ...updates } : a))
      );
      toast.success("Artist updated");
    } else {
      const newArtistData = {
        name: formData.name,
        image_url: finalImageUrl,
        verified: formData.verified,
        monthly_listeners: formData.monthly_listeners,
      };
      const created = await artistsApi.create(newArtistData);
      setArtists((prev) => [created, ...prev]);
      toast.success("Artist created");
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<Artist, unknown>[] = [
    {
      accessorKey: "name",
      header: "Artist",
      cell: ({ row }) => {
        const artist = row.original;
        return (
          <div className="flex items-center gap-3">
            <img
              src={artist.image_url}
              alt={artist.name}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>{artist.name}</span>
              {artist.verified && (
                <CheckCircle2 size={14} className="text-purple-400 fill-purple-400/20" />
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "monthly_listeners",
      header: "Monthly Listeners",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          {formatNumber(row.original.monthly_listeners)}
        </span>
      ),
    },
    {
      accessorKey: "verified",
      header: "Verified Badge",
      cell: ({ row }) => (
        <span className={row.original.verified ? "badge-purple" : "badge-muted"}>
          {row.original.verified ? "Verified" : "Unverified"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const artist = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleOpenEdit(artist)}
              className="p-2 text-muted-foreground hover:text-purple-400 hover:bg-white/5 rounded-lg transition"
              title="Edit artist"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(artist)}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              title="Delete artist"
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
        title="Artists Module"
        description="Manage verified music creators and listener statistics."
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-gradient text-white rounded-xl font-semibold text-sm shadow-glow-purple-sm hover:shadow-glow-purple transition"
          >
            <Plus size={16} />
            Add Artist
          </button>
        }
      />

      <div className="glass-card p-4 flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search artist by name..."
          className="w-full sm:w-80"
        />
      </div>

      <div className="glass-card p-4">
        {loading ? <TableSkeleton rows={5} /> : <DataTable data={filteredArtists} columns={columns} />}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArtist ? "Edit Artist" : "Add Artist"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadZone
            accept="image"
            value={imageFile}
            onChange={setImageFile}
            label="Upload Artist Avatar (or paste Image URL below)"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Artist Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Luna Velvet"
              className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Monthly Listeners</label>
            <input
              type="number"
              value={formData.monthly_listeners}
              onChange={(e) => setFormData({ ...formData, monthly_listeners: Number(e.target.value) })}
              placeholder="e.g. 1500000"
              className="w-full px-3.5 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="rounded border-white/20 bg-surface-3 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-sm text-foreground font-medium">Verified Creator Badge</span>
            </label>
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
              {editingArtist ? "Save Changes" : "Create Artist"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Deleting this artist will also remove all their associated albums and songs according to database relations."
      />
    </PageWrapper>
  );
}
