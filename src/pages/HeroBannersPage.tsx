import { useState, useMemo, useEffect } from "react";
import { Play, Edit2, Trash2, Loader2, Plus, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import FileUploadZone from "@/components/ui/FileUploadZone";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { heroBannersApi, songsApi, albumsApi, playlistsApi, storageApi } from "@/services/apiServices";
import type { HeroBanner } from "@/types";
import { cn } from "@/utils";

const ACTION_TYPES = [
  { value: 'play_song', label: 'Play Song' },
  { value: 'play_album', label: 'Play Album' },
  { value: 'open_playlist', label: 'Open Playlist' },
  { value: 'open_url', label: 'Open URL' },
] as const;

const INPUT_CLASS = "px-4 py-2.5 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-white placeholder:text-white/20 transition";

export default function HeroBannersPage() {
  const queryClient = useQueryClient();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");

  const [formData, setFormData] = useState<Partial<HeroBanner>>({
    title: "",
    subtitle: "",
    image_url: "",
    tag_text: "FEATURED",
    button_text: "Play Now",
    action_type: "play_song",
    action_id: "",
    is_active: true,
  });

  // Queries
  const { data: banners = [], isLoading } = useQuery({ queryKey: ["heroBanners"], queryFn: heroBannersApi.getAll });
  const { data: songs = [] } = useQuery({ queryKey: ["songs"], queryFn: songsApi.getAll });
  const { data: albums = [] } = useQuery({ queryKey: ["albums"], queryFn: albumsApi.getAll });
  const { data: playlists = [] } = useQuery({ queryKey: ["playlists"], queryFn: playlistsApi.getAll });

  // Update preview image URL when file or URL changes
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setPreviewImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewImageUrl(formData.image_url || "");
    }
  }, [coverFile, formData.image_url]);

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      heroBannersApi.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      toast.success("Banner status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: heroBannersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      toast.success("Banner deleted successfully");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (banner: Partial<HeroBanner>) => {
      let finalImageUrl = banner.image_url;

      if (coverFile) {
        toast.loading("Uploading image...", { id: "upload" });
        finalImageUrl = await storageApi.uploadFile("covers", coverFile);
        toast.dismiss("upload");
      }

      const finalData = { ...banner, image_url: finalImageUrl };

      if (editingBanner) {
        return heroBannersApi.update(editingBanner.id, finalData as any);
      }
      return heroBannersApi.create(finalData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      toast.success(editingBanner ? "Banner updated" : "Banner created");
      resetForm();
    },
    onError: (error: any) => {
      toast.dismiss("upload");
      toast.error(error.message || "Failed to save banner");
    }
  });

  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setFormData(banner);
    setCoverFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setEditingBanner(null);
    setCoverFile(null);
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      tag_text: "FEATURED",
      button_text: "Play Now",
      action_type: "play_song",
      action_id: "",
      is_active: true,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingBanner(null);
    setCoverFile(null);
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      tag_text: "FEATURED",
      button_text: "Play Now",
      action_type: "play_song",
      action_id: "",
      is_active: true,
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.image_url && !coverFile) || !formData.action_id) {
      toast.error("Please fill all required fields and provide an image");
      return;
    }
    saveMutation.mutate(formData);
  };

  const getActionTargetOptions = () => {
    switch(formData.action_type) {
      case 'play_song': return songs;
      case 'play_album': return albums;
      case 'open_playlist': return playlists;
      default: return [];
    }
  };

  const columns = [
    {
      header: "Banner",
      accessorKey: "image_url",
      cell: (props: any) => {
        const row = props.row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="w-24 h-12 rounded-lg bg-surface-2 overflow-hidden flex-shrink-0 relative group">
              {row.image_url ? (
                <img src={row.image_url} alt={row.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon size={16} />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">{row.title}</div>
              <div className="text-xs text-muted-foreground">{row.subtitle || "No subtitle"}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Action",
      accessorKey: "action_type",
      cell: (props: any) => {
        const row = props.row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium capitalize">{row.action_type.replace('_', ' ')}</span>
            <span className="text-xs text-muted-foreground max-w-[150px] truncate" title={row.action_id}>
              {row.action_id}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (props: any) => {
        const row = props.row.original;
        return (
          <button
            onClick={() => toggleMutation.mutate({ id: row.id, is_active: !row.is_active })}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent focus:outline-none transition-colors",
              row.is_active ? "bg-purple-600" : "bg-surface-3"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                row.is_active ? "translate-x-2" : "-translate-x-2"
              )}
            />
          </button>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (props: any) => {
        const row = props.row.original;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this banner?")) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Hero Banners"
        description="Create dynamic hero posters that display on the mobile app home screen."
        actions={
          !showForm ? (
            <button onClick={handleCreateNew} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Add Banner
            </button>
          ) : undefined
        }
      />

      {showForm ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* FORM SECTION */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-glass flex flex-col relative h-fit">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
              title="Cancel Edit"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="text-purple-500" size={24} />
              {editingBanner ? "Edit Banner" : "Create New Banner"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Text Fields */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. 30-Day Free Trial"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={formData.subtitle || ""}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. Only For You!"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Tag Text</label>
                  <input
                    type="text"
                    value={formData.tag_text}
                    onChange={(e) => setFormData({ ...formData, tag_text: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. TRY FREE TRIAL"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Button Text</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. Play Now"
                  />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Banner Image *</label>
                  <FileUploadZone accept="image" value={coverFile} onChange={setCoverFile} label="Upload Image" />
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">OR</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      if (e.target.value) setCoverFile(null); // Clear file if URL is pasted
                    }}
                    className={INPUT_CLASS}
                    placeholder="Paste direct image URL"
                    disabled={!!coverFile}
                  />
                </div>

                {/* Action */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">On Click Action *</label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value as any, action_id: "" })}
                    className={INPUT_CLASS}
                  >
                    {ACTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    {formData.action_type === 'open_url' ? 'URL *' : 'Select Target *'}
                  </label>
                  
                  {formData.action_type === 'open_url' ? (
                    <input
                      type="url"
                      required
                      value={formData.action_id}
                      onChange={(e) => setFormData({ ...formData, action_id: e.target.value })}
                      className={INPUT_CLASS}
                      placeholder="https://..."
                    />
                  ) : (
                    <SearchableSelect
                      options={getActionTargetOptions().map((item: any) => ({
                        label: `${item.title} ${item.artist_name ? `(${item.artist_name})` : ''}`.trim(),
                        value: item.id
                      }))}
                      value={formData.action_id || ""}
                      onChange={(val) => setFormData({ ...formData, action_id: val })}
                      placeholder={`Search ${formData.action_type?.split('_')[1] || 'target'}...`}
                    />
                  )}
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1 py-3">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="btn-primary flex-[2] flex justify-center py-3"
                >
                  {saveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : editingBanner ? "Save Changes" : "Create Poster"}
                </button>
              </div>
            </form>
          </div>

          {/* LIVE PREVIEW SECTION */}
          <div className="flex flex-col gap-4">
            <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-glass flex flex-col h-full items-center justify-center bg-black/40">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-8 flex self-start">Live Preview</h3>
              
              {/* Mobile App Style Banner Preview */}
              <div className="w-full max-w-[500px] aspect-[2/1] rounded-[24px] md:rounded-[32px] overflow-hidden flex shadow-2xl relative bg-[#18181b] border border-white/5">
                
                {/* Left Side */}
                <div className="flex-1 flex flex-col justify-center p-5 md:p-8 z-10">
                  {formData.tag_text && (
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
                      {formData.tag_text}
                    </span>
                  )}
                  
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-black text-white leading-[1.1] tracking-tight">
                    {formData.title || "Poster Title"}
                  </h2>
                  
                  {formData.subtitle && (
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white/80 leading-[1.1] tracking-tight mt-2">
                      {formData.subtitle}
                    </h3>
                  )}

                  <button className="mt-4 md:mt-6 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 w-fit transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
                    <Play fill="currentColor" size={16} className="md:w-4 md:h-4" />
                    {formData.button_text || "Play Now"}
                  </button>
                </div>

                {/* Right Image Side */}
                <div className="w-[42%] flex items-center justify-center pr-5 md:pr-8 py-5 md:py-8">
                  <div className="w-full aspect-square rounded-[16px] md:rounded-[20px] overflow-hidden bg-surface-2 relative shadow-2xl">
                    {previewImageUrl ? (
                      <img 
                        src={previewImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
                This is how your promotional poster will look on the user's home screen.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE SECTION */
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-glass">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <DataTable columns={columns} data={banners} />
          )}
        </div>
      )}

    </PageWrapper>
  );
}
