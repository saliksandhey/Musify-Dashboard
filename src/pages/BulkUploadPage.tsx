import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload, Loader2, ArrowLeft, Image as ImageIcon, Music } from "lucide-react";
import { toast } from "sonner";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { songsApi, artistsApi, albumsApi, storageApi } from "@/services/apiServices";
import type { Artist, Album } from "@/types";
import { cn } from "@/utils";

const LANGUAGES = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bengali", "Spanish", "French", "German"];

interface SongEntry {
  id: string;
  coverFile: File | null;
  coverUrl: string;
  audioFile: File | null;
  title: string;
  artist_id: string;
  album_id: string;
  language: string;
  duration: number;
  status: "pending" | "uploading" | "success" | "error";
}

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [entries, setEntries] = useState<SongEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [artistsData, albumsData] = await Promise.all([
      artistsApi.getAll(),
      albumsApi.getAll(),
    ]);
    setArtists(artistsData);
    setAlbums(albumsData);
    setLoading(false);
    
    // Add first empty entry if data is loaded
    if (artistsData.length > 0) {
      handleAddEntry(artistsData[0].id);
    }
  };

  const handleAddEntry = (defaultArtistId?: string) => {
    const newEntry: SongEntry = {
      id: Math.random().toString(36).substring(7),
      coverFile: null,
      coverUrl: "",
      audioFile: null,
      title: "",
      artist_id: defaultArtistId || (artists.length > 0 ? artists[0].id : ""),
      album_id: "",
      language: "Hindi",
      duration: 180,
      status: "pending",
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof SongEntry, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleUploadAll = async () => {
    // Validate
    const invalidEntries = entries.filter(
      (e) => e.status !== "success" && (!e.title || !e.audioFile || !e.artist_id)
    );
    if (invalidEntries.length > 0) {
      toast.error("Please fill in Title, Audio File, and Artist for all entries.");
      return;
    }

    const pendingEntries = entries.filter((e) => e.status === "pending" || e.status === "error");
    if (pendingEntries.length === 0) {
      toast.info("No new entries to upload.");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const entry of pendingEntries) {
      updateEntry(entry.id, "status", "uploading");

      try {
        let finalCoverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=600";
        if (entry.coverFile) {
          finalCoverUrl = await storageApi.uploadFile("covers", entry.coverFile);
        } else if (entry.coverUrl && entry.coverUrl.trim() !== "") {
          finalCoverUrl = entry.coverUrl.trim();
        }
        
        const audioUrl = await storageApi.uploadFile("audio", entry.audioFile!);
        
        const selectedArtist = artists.find((a) => a.id === entry.artist_id);
        const selectedAlbum = albums.find((al) => al.id === entry.album_id);

        const newSongData = {
          title: entry.title,
          artist_id: entry.artist_id,
          artist_name: selectedArtist ? selectedArtist.name : "Unknown Artist",
          album_id: entry.album_id || "",
          album_name: selectedAlbum ? selectedAlbum.title : "Single",
          cover_url: finalCoverUrl,
          audio_url: audioUrl,
          duration: entry.duration,
          language: entry.language,
        };

        // Skip push notification for bulk items
        await songsApi.create(newSongData, true);
        
        updateEntry(entry.id, "status", "success");
        successCount++;
      } catch (error) {
        console.error("Upload failed for entry", entry.title, error);
        updateEntry(entry.id, "status", "error");
      }
    }

    setIsUploading(false);
    
    if (successCount === pendingEntries.length) {
      toast.success(`Successfully uploaded ${successCount} songs!`);
      // Optionally redirect back to songs page
      setTimeout(() => navigate("/songs"), 1500);
    } else {
      toast.warning(`Uploaded ${successCount} out of ${pendingEntries.length} songs.`);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/songs")}
          className="p-2 bg-surface-2 hover:bg-white/10 text-foreground rounded-xl transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Bulk Song Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">Add multiple songs manually and upload them all at once.</p>
        </div>
        <button
          onClick={handleUploadAll}
          disabled={isUploading || entries.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-gradient text-white rounded-xl text-sm font-semibold shadow-glow-purple-sm hover:shadow-glow-purple transition disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload All
            </>
          )}
        </button>
      </div>

      <div className="space-y-4 pb-20">
        {entries.map((entry, index) => {
          const entryAlbums = albums.filter((al) => al.artist_id === entry.artist_id);
          
          return (
            <div 
              key={entry.id} 
              className={cn(
                "glass-card p-5 relative transition-all duration-300",
                entry.status === "uploading" && "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
                entry.status === "success" && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] opacity-60",
                entry.status === "error" && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              )}
            >
              {/* Status Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                <h3 className="font-semibold text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600/20 text-xs flex items-center justify-center text-purple-300">
                    {index + 1}
                  </span>
                  Song Entry
                </h3>
                <div className="flex items-center gap-3">
                  {entry.status === "uploading" && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Uploading</span>}
                  {entry.status === "success" && <span className="text-xs text-green-400">Uploaded</span>}
                  {entry.status === "error" && <span className="text-xs text-red-400">Failed</span>}
                  
                  {entry.status !== "success" && entry.status !== "uploading" && (
                    <button onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-red-400 p-1 bg-white/5 rounded-md hover:bg-red-500/10 transition">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* File Uploads (Span 3) */}
                <div className="md:col-span-3 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Cover Art</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => updateEntry(entry.id, "coverFile", e.target.files?.[0] || null)}
                          disabled={isUploading || entry.status === "success"}
                          className="hidden"
                          id={`cover-${entry.id}`}
                        />
                        <label
                          htmlFor={`cover-${entry.id}`}
                          className={cn(
                            "flex items-center justify-center gap-2 w-full px-3 py-2 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground cursor-pointer transition hover:bg-white/5",
                            (isUploading || entry.status === "success") && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <ImageIcon size={16} className={entry.coverFile ? "text-purple-400" : ""} />
                          <span className="truncate">{entry.coverFile ? entry.coverFile.name : "Upload Image"}</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={entry.coverUrl}
                          onChange={(e) => updateEntry(entry.id, "coverUrl", e.target.value)}
                          disabled={isUploading || entry.status === "success"}
                          placeholder="Or paste URL here..."
                          className="w-full px-3 py-2 bg-surface-3 border border-white/8 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Audio File *</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateEntry(entry.id, "audioFile", file);
                            // Auto-fill title if empty
                            if (!entry.title) {
                              updateEntry(entry.id, "title", file.name.replace(/\.[^/.]+$/, ""));
                            }
                          }
                        }}
                        disabled={isUploading || entry.status === "success"}
                        className="hidden"
                        id={`audio-${entry.id}`}
                      />
                      <label
                        htmlFor={`audio-${entry.id}`}
                        className={cn(
                          "flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground cursor-pointer transition hover:bg-white/5",
                          !entry.audioFile && "border-red-500/30 text-red-200",
                          (isUploading || entry.status === "success") && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Music size={16} className={entry.audioFile ? "text-purple-400" : ""} />
                        <span className="truncate">{entry.audioFile ? entry.audioFile.name : "Choose Audio"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Details (Span 9) */}
                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Song Title *</label>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                      disabled={isUploading || entry.status === "success"}
                      className={cn(
                        "w-full px-3.5 py-2 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40",
                        !entry.title && "border-red-500/30"
                      )}
                      placeholder="e.g. Chaleya"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Language</label>
                    <SearchableSelect
                      options={LANGUAGES.map((lang) => ({ label: lang, value: lang }))}
                      value={entry.language}
                      onChange={(val) => updateEntry(entry.id, "language", val)}
                      disabled={isUploading || entry.status === "success"}
                    />
                  </div>

                  <div className="space-y-1.5 z-10">
                    <label className="text-xs font-medium text-muted-foreground">Artist *</label>
                    <SearchableSelect
                      options={artists.map((a) => ({ label: a.name, value: a.id }))}
                      value={entry.artist_id}
                      onChange={(val) => {
                        updateEntry(entry.id, "artist_id", val);
                        updateEntry(entry.id, "album_id", "");
                      }}
                      disabled={isUploading || entry.status === "success"}
                      className={cn(!entry.artist_id && "border border-red-500/30 rounded-xl")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Album</label>
                    <select
                      value={entry.album_id}
                      onChange={(e) => updateEntry(entry.id, "album_id", e.target.value)}
                      disabled={isUploading || entry.status === "success"}
                      className="w-full px-3.5 py-2 bg-surface-3 border border-white/8 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                    >
                      <option value="">None (Single)</option>
                      {entryAlbums.map((al) => <option key={al.id} value={al.id}>{al.title}</option>)}
                    </select>
                  </div>
                  
                </div>

              </div>
            </div>
          );
        })}

        {/* Add New Entry Button */}
        <button
          onClick={() => handleAddEntry()}
          disabled={isUploading}
          className="w-full py-4 border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-purple-300 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          <span className="font-semibold">Add Another Song Entry</span>
        </button>
      </div>
    </PageWrapper>
  );
}
