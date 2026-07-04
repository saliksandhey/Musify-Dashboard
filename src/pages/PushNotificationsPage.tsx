import { useState, useEffect } from "react";
import { Bell, Music, Disc3, Send, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import { songsApi, albumsApi, notificationsApi } from "@/services/apiServices";
import type { Song, Album } from "@/types";
import { cn } from "@/utils";

type NotificationType = "custom" | "song" | "album";

export default function PushNotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationType>("custom");
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Data for lists
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [selectedItem, setSelectedItem] = useState<Song | Album | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (activeTab === "song" && songs.length === 0) fetchSongs();
    if (activeTab === "album" && albums.length === 0) fetchAlbums();
  }, [activeTab]);

  const fetchSongs = async () => {
    setLoadingItems(true);
    const data = await songsApi.getAll();
    // Sort descending by created_at or default fallback and get top 20
    const sorted = data.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 20);
    setSongs(sorted);
    setLoadingItems(false);
  };

  const fetchAlbums = async () => {
    setLoadingItems(true);
    const data = await albumsApi.getAll();
    const sorted = data.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 20);
    setAlbums(sorted);
    setLoadingItems(false);
  };

  const handleSelectSong = (song: Song) => {
    setSelectedItem(song);
    setFormTitle(`🎵 NEW RELEASE: ${song.title}`);
    setFormMessage(`${song.artist_name || 'Your favorite artist'} just dropped a new track! Listen now.`);
    setFormImageUrl(song.cover_url);
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedItem(album);
    setFormTitle(`💿 NEW ALBUM: ${album.title}`);
    setFormMessage(`Stream the highly anticipated new album by ${album.artist_name || 'your favorite artist'} today.`);
    setFormImageUrl(album.cover_url);
  };

  const handleTabSwitch = (tab: NotificationType) => {
    setActiveTab(tab);
    setSelectedItem(null);
    if (tab === "custom") {
      setFormTitle("");
      setFormMessage("");
      setFormImageUrl("");
    }
  };

  const handleSend = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    setIsSending(true);
    try {
      const payload: any = {
        title: formTitle,
        message: formMessage,
        target: "segment_all",
        artwork: formImageUrl || undefined,
      };

      if (activeTab !== "custom" && selectedItem) {
        payload.subtitle = (selectedItem as any).title;
        payload.deepLinkData = {
          type: activeTab,
          id: selectedItem.id,
        };
      }

      await notificationsApi.sendPushNotification(payload);
      toast.success("Push notification sent successfully!");
      
      // Reset form on success
      setFormTitle("");
      setFormMessage("");
      setFormImageUrl("");
      setSelectedItem(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Push Notifications"
        description="Engage your mobile app users by sending custom announcements or promoting new releases."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Setup & Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Tabs */}
          <div className="flex gap-2 bg-surface-2 p-1.5 rounded-xl border border-white/5 w-fit">
            <button
              onClick={() => handleTabSwitch("custom")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                activeTab === "custom" ? "bg-purple-600 text-white shadow-glow-purple-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              <Bell size={16} /> Custom
            </button>
            <button
              onClick={() => handleTabSwitch("song")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                activeTab === "song" ? "bg-purple-600 text-white shadow-glow-purple-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              <Music size={16} /> Song Release
            </button>
            <button
              onClick={() => handleTabSwitch("album")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                activeTab === "album" ? "bg-purple-600 text-white shadow-glow-purple-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              <Disc3 size={16} /> Album Release
            </button>
          </div>

          {/* Database Selection List (if song or album) */}
          {(activeTab === "song" || activeTab === "album") && (
            <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col h-[300px]">
              <h3 className="text-sm font-semibold mb-3 text-white">Select {activeTab === "song" ? "Song" : "Album"} (Top 20 latest)</h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {loadingItems ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-purple-500" />
                  </div>
                ) : (
                  (activeTab === "song" ? songs : albums).map((item: any) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => activeTab === "song" ? handleSelectSong(item) : handleSelectAlbum(item)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all",
                          isSelected 
                            ? "bg-purple-500/10 border-purple-500/50 shadow-glow-purple-sm" 
                            : "bg-surface-3 border-transparent hover:border-white/10 hover:bg-surface-4"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-surface-1 overflow-hidden flex-shrink-0">
                          <img src={item.cover_url || item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Notification Editor Form */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-5 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-2">Notification Payload</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Notification Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Weekly Top 50 is here!"
                className="px-4 py-2.5 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-white placeholder:text-white/20 transition"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Notification Message *</label>
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={3}
                placeholder="e.g. Tap to explore the hottest tracks this week..."
                className="px-4 py-3 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-white placeholder:text-white/20 transition resize-none custom-scrollbar"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Artwork Image URL (Optional)</label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="px-4 py-2.5 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 text-white placeholder:text-white/20 transition"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isSending || !formTitle.trim() || !formMessage.trim()}
              className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-surface-4 disabled:to-surface-4 disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl shadow-glow-purple transition-all"
            >
              {isSending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending to Edge...
                </>
              ) : (
                <>
                  <Send size={18} /> Send Push Notification
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Preview Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white text-center">Live Android Preview</h3>
            
            <div className="relative w-[320px] mx-auto bg-[#0f111a] rounded-[36px] p-3 shadow-2xl border-4 border-surface-2 ring-1 ring-white/10 overflow-hidden" style={{ minHeight: '600px'}}>
              
              {/* Android Mock Status Bar */}
              <div className="flex justify-between items-center px-4 pt-1 pb-4 text-[10px] text-white/50 font-medium">
                <span>12:00</span>
                <div className="flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-4 h-3 rounded-[4px] bg-white/20" />
                </div>
              </div>

              {/* Lockscreen Time */}
              <div className="text-center mt-8 mb-12">
                <h1 className="text-5xl font-light text-white/90 tracking-tight">12:00</h1>
                <p className="text-white/50 text-sm mt-1">Sun, July 5</p>
              </div>

              {/* Notification Card UI */}
              <motion.div 
                layout
                className="bg-[#242736]/90 backdrop-blur-xl border border-white/10 rounded-2xl mx-1 overflow-hidden shadow-2xl shadow-black/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center shadow-inner">
                      <Music size={12} className="text-white" />
                    </div>
                    <span className="text-xs text-white/70 font-medium">Musify</span>
                  </div>
                  <span className="text-[10px] text-white/40">Now</span>
                </div>
                
                {/* Body */}
                <div className="px-4 py-3 flex gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <h4 className="text-sm font-semibold text-white/90 leading-tight">
                      {formTitle || "Notification Title"}
                    </h4>
                    <p className="text-sm text-white/60 leading-snug line-clamp-2">
                      {formMessage || "This is how your notification message will look to the users on their lockscreen."}
                    </p>
                  </div>
                  {/* Small Square Art Fallback if no big image, or just keeping it simple */}
                </div>

                {/* Big Image if provided */}
                {formImageUrl && (
                  <div className="w-full aspect-[2/1] bg-surface-1 border-t border-white/5 relative">
                    <img 
                      src={formImageUrl} 
                      alt="Notification Artwork" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </motion.div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl max-w-[320px] mx-auto mt-2 text-blue-400">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                App icon, formatting, and layout will vary based on user's exact Android version and settings. Deep linking is handled automatically for Songs & Albums.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
